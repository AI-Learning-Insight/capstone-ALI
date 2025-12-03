#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import csv from 'csv-parser';
import knex from 'knex';
import knexfile from '../knexfile.js';

const db = knex(knexfile);

// Pastikan tabel agregat final_dataset tersedia
async function ensureFinalDatasetTable() {
  const exists = await db.schema.hasTable('ml_final_dataset');
  if (!exists) {
    await db.schema.createTable('ml_final_dataset', (t) => {
      t.bigInteger('user_id').primary();
      t.string('display_name');
      t.string('name');
      t.string('email');
      t.string('phone');
      t.integer('total_tracking_events');
      t.integer('total_completed_modules');
      t.integer('total_submissions');
      t.decimal('avg_submission_rating');
      t.decimal('avg_study_duration');
      t.decimal('avg_completion_rating');
      t.decimal('avg_exam_score');
      t.decimal('exam_pass_rate');
    });
  } else {
    await db('ml_final_dataset').truncate();
  }
}

// Buat ulang materialized view ml_user_features berbasis final_dataset
async function rebuildFeaturesViewFromFinal() {
  await db.raw('DROP MATERIALIZED VIEW IF EXISTS ml_user_features');
  await db.raw(`
    CREATE MATERIALIZED VIEW ml_user_features AS
    SELECT
      fd.user_id                        AS ml_user_id,
      fd.email,
      fd.display_name,
      fd.name,
      coalesce(fd.total_completed_modules, 0) AS enrollments_count,
      coalesce(fd.total_completed_modules, 0) AS tutorials_completed,
      coalesce(fd.avg_study_duration, 0)      AS avg_study_duration,
      coalesce(fd.avg_study_duration, 0)      AS study_minutes,
      coalesce(fd.avg_submission_rating, 0)   AS avg_submission_rating,
      coalesce(fd.avg_completion_rating, 0)   AS avg_completion_rating,
      coalesce(fd.total_submissions, 0)       AS total_submissions,
      coalesce(fd.total_tracking_events, 0)   AS total_tracking_events,
      NULL::timestamp                         AS last_enrolled_at,
      NULL::int                               AS exams_taken,
      coalesce(fd.avg_exam_score, 0)          AS avg_exam_score,
      coalesce(fd.exam_pass_rate, 0)          AS pass_rate,
      NULL::timestamp                         AS last_exam_activity,
      NULL::timestamp                         AS last_track_activity,
      NULL::timestamp                         AS last_activity_at,
      NULL::double precision                  AS days_since_last_activity
    FROM ml_final_dataset fd;
  `);
  await db.raw(
    'CREATE UNIQUE INDEX IF NOT EXISTS idx_ml_user_features ON ml_user_features(ml_user_id);'
  );
}

// ----------------- HELPERS -----------------

function parseTS(v) {
  if (!v || v === 'nan' || v === 'NaN') return null;
  const t = Date.parse(v);
  return Number.isNaN(t) ? null : new Date(t);
}

function toInt(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isInteger(n) ? n : null;
}

function toFloat(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// Ambil spesifikasi kolom numeric dari information_schema
async function getNumericSpec(table) {
  const rows = await db
    .select(
      'column_name',
      'data_type',
      'numeric_precision',
      'numeric_scale',
      'table_schema'
    )
    .from('information_schema.columns')
    .where({
      table_name: table,
      table_schema: 'public',
    });

  const spec = {};
  for (const r of rows) {
    if (
      r.data_type === 'numeric' &&
      r.numeric_precision !== null &&
      r.numeric_scale !== null
    ) {
      spec[r.column_name] = {
        precision: Number(r.numeric_precision),
        scale: Number(r.numeric_scale),
      };
    }
  }
  return spec;
}

// Clamp / null-kan nilai yang tidak muat ke numeric(precision, scale)
function applyNumericSpec(row, numericSpec) {
  if (!numericSpec || !Object.keys(numericSpec).length) return row;

  const out = { ...row };

  for (const [col, cfg] of Object.entries(numericSpec)) {
    let val = out[col];
    if (val === null || val === undefined || val === '') continue;

    if (typeof val !== 'number' || !Number.isFinite(val)) {
      const num = Number(val);
      if (!Number.isFinite(num)) {
        out[col] = null;
        continue;
      }
      val = num;
    }

    const factor = 10 ** cfg.scale;
    const rounded = Math.round(val * factor) / factor;

    const maxAbs = 10 ** (cfg.precision - cfg.scale);
    if (Math.abs(rounded) >= maxAbs) {
      out[col] = null;
    } else {
      out[col] = rounded;
    }
  }

  return out;
}

// Deduplicate berdasarkan upsertKey (string / array).
// Last row wins untuk key yang sama.
function dedupeRows(rows, upsertKey) {
  if (!upsertKey) return rows;

  const keys = Array.isArray(upsertKey) ? upsertKey : [upsertKey];

  const hasAllKeys = (row) =>
    keys.every((k) => row[k] !== undefined && row[k] !== null);

  const makeKey = (row) =>
    hasAllKeys(row) ? keys.map((k) => String(row[k])).join('||') : null;

  const map = new Map();
  const noKeyRows = [];

  for (const row of rows) {
    const k = makeKey(row);
    if (k === null) {
      noKeyRows.push(row);
    } else {
      map.set(k, row);
    }
  }

  return [...map.values(), ...noKeyRows];
}

// ----------------- INGEST (UPSERT PER CHUNK) -----------------

async function ingestCSV(file, table, mapRow, options = {}) {
  console.log(`→ Ingest ${file} -> ${table}`);

  const rawRows = [];
  await new Promise((resolve, reject) => {
    fs.createReadStream(file)
      .pipe(csv())
      .on('data', (r) => rawRows.push(mapRow(r)))
      .on('end', resolve)
      .on('error', reject);
  });

  const numericSpec =
    options.numericSpec ||
    (options.useNumericSpec ? await getNumericSpec(table) : null);

  // apply numeric guards
  let rows = numericSpec
    ? rawRows.map((row) => applyNumericSpec(row, numericSpec))
    : rawRows;

  // IMPORTANT:
  // Hilangkan duplikat berdasarkan upsertKey sebelum di-insert
  if (options.upsertKey) {
    const before = rows.length;
    rows = dedupeRows(rows, options.upsertKey);
    const after = rows.length;
    if (before !== after) {
      console.log(
        `  - dedupe on ${JSON.stringify(
          options.upsertKey
        )}: ${before} -> ${after}`
      );
    }
  }

  const CHUNK = 1000;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    if (!chunk.length) continue;

    let q = db(table).insert(chunk);

    if (options.upsertKey) {
      q = q.onConflict(options.upsertKey).merge();
    }

    await q;
    process.stdout.write('.');
  }

  console.log(` done (${rows.length})`);
}

// ----------------- MAIN -----------------

async function main() {
  const base = process.argv[2];
  if (!base) {
    console.error('Usage: node scripts/ml_ingest.mjs <path-to-dataset>');
    process.exit(1);
  }

  // Pastikan tabel agregat final_dataset siap dan kosong
  await ensureFinalDatasetTable();

  // Preload numeric specs
  const numericSpecs = {
    ml_users: await getNumericSpec('ml_users'),
    ml_complete: await getNumericSpec('ml_complete'),
    ml_registration: await getNumericSpec('ml_registration'),
    ml_exam: await getNumericSpec('ml_exam'),
    ml_submission: await getNumericSpec('ml_submission'),
    ml_tracking: await getNumericSpec('ml_tracking'),
  };

  // Helper path ke data_ml
  const p = (f) => path.join(base, f);

  // ---- final_dataset.csv -> ml_final_dataset (agregat) ----
  await ingestCSV(
    p('final_dataset.csv'),
    'ml_final_dataset',
    (r) => ({
      user_id: toInt(r.user_id),
      display_name: r.display_name || null,
      name: r.name || null,
      email: r.email || null,
      phone: r.phone || null,
      total_tracking_events: toInt(r.total_tracking_events),
      total_completed_modules: toInt(r.total_completed_modules),
      total_submissions: toInt(r.total_submissions),
      avg_submission_rating: toFloat(r.avg_submission_rating),
      avg_study_duration: toFloat(r.avg_study_duration),
      avg_completion_rating: toFloat(r.avg_completion_rating),
      avg_exam_score: toFloat(r.avg_exam_score),
      exam_pass_rate: toFloat(r.exam_pass_rate),
    }),
    { upsertKey: 'user_id' }
  );

  // ---- developer_journeys.csv -> ml_journeys ----
  console.log('\nImporting developer_journeys.csv → ml_journeys');

  await ingestCSV(
    p('developer_journeys.csv'),
    'ml_journeys',
    (r) => {
      const name = (r.name || '').trim();
      const lower = name.toLowerCase();

      let class_track = null;
      let class_prefix = null;

      // ⚠️ Aturan pengelompokan tinggi:
      // ANDROID: judul mengandung android / kotlin / flutter
      if (
        lower.includes('android') ||
        lower.includes('kotlin') ||
        lower.includes('flutter')
      ) {
        class_track = 'ANDROID';
        class_prefix = 'AND';
      }
      // WEB: judul mengandung web / front-end / back-end / javascript
      else if (
        lower.includes('web') ||
        lower.includes('front-end') ||
        lower.includes('frontend') ||
        lower.includes('back-end') ||
        lower.includes('backend') ||
        lower.includes('javascript')
      ) {
        class_track = 'WEB';
        class_prefix = 'WEB';
      }
      // CLOUD: judul mengandung cloud / aws / google cloud / gcp
      else if (
        lower.includes('cloud') ||
        lower.includes('aws') ||
        lower.includes('google cloud') ||
        lower.includes('gcp')
      ) {
        class_track = 'CLOUD';
        class_prefix = 'CLD';
      }

      return {
        id: toInt(r.id),
        name,
        hours_to_study: toInt(r.hours_to_study),
        class_track,
        class_prefix,
        // created_at / updated_at diisi default dari DB
      };
    },
    {
      upsertKey: 'id',
      // numericSpec: bukan wajib, karena kolom numericnya sederhana
    }
  );

  // users_clean.csv -> ml_users
  await ingestCSV(
    p('users_clean.csv'),
    'ml_users',
    (r) => ({
      id: toInt(r.id),
      display_name: r.display_name || null,
      name: r.name || null,
      email: r.email || null,
      phone: r.phone || null,
      user_role: toInt(r.user_role),
      user_verification_status: toInt(r.user_verification_status),
      created_at: parseTS(r.created_at),
      updated_at: parseTS(r.updated_at),
      city_id: toInt(r.city_id),
    }),
    { upsertKey: 'id', numericSpec: numericSpecs.ml_users }
  );

  // complete_clean.csv -> ml_complete
  await ingestCSV(
    p('complete_clean.csv'),
    'ml_complete',
    (r) => ({
      id: toInt(r.id),
      user_id: toInt(r.user_id),
      journey_id: toInt(r.journey_id),
      created_at: parseTS(r.created_at),
      updated_at: parseTS(r.updated_at),
      enrolling_times: toInt(r.enrolling_times),
      enrollments_at: parseTS(r.enrollments_at),
      last_enrolled_at: parseTS(r.last_enrolled_at),
      study_duration: toInt(r.study_duration),
      avg_submission_rating: toFloat(r.avg_submission_rating),
    }),
    { upsertKey: 'id', numericSpec: numericSpecs.ml_complete }
  );

  // registration_clean.csv -> ml_registration
  await ingestCSV(
    p('registration_clean.csv'),
    'ml_registration',
    (r) => ({
      id: toInt(r.id),
      exam_module_id: toInt(r.exam_module_id),
      tutorial_id: toInt(r.tutorial_id),
      examinees_id: toInt(r.examinees_id),
      status: toInt(r.status),
      created_at: parseTS(r.created_at),
      updated_at: parseTS(r.updated_at),
      deadline_at: parseTS(r.deadline_at),
      retake_limit_at: parseTS(r.retake_limit_at),
      exam_finished_at: parseTS(r.exam_finished_at),
      deleted_at: parseTS(r.deleted_at),
    }),
    { upsertKey: 'id', numericSpec: numericSpecs.ml_registration }
  );

  // exam_clean.csv -> ml_exam
  await ingestCSV(
    p('exam_clean.csv'),
    'ml_exam',
    (r) => ({
      id: toInt(r.id),
      exam_registration_id: toInt(r.exam_registration_id),
      total_questions: toInt(r.total_questions),
      score: toFloat(r.score),
      is_passed: toInt(r.is_passed),
      created_at: parseTS(r.created_at),
      look_report_at: parseTS(r.look_report_at),
    }),
    { upsertKey: 'id', numericSpec: numericSpecs.ml_exam }
  );

  // submission_clean.csv -> ml_submission
  await ingestCSV(
    p('submission_clean.csv'),
    'ml_submission',
    (r) => ({
      id: toInt(r.id),
      journey_id: toInt(r.journey_id),
      quiz_id: toInt(r.quiz_id),
      submitter_id: toInt(r.submitter_id),
      version_id: toFloat(r.version_id),
      app_link: r.app_link || null,
      app_comment: r.app_comment || null,
      status: toInt(r.status),
      as_trial_subscriber: r.as_trial_subscriber
        ? r.as_trial_subscriber === '1'
        : null,
      created_at: parseTS(r.created_at),
      updated_at: parseTS(r.updated_at),
      admin_comment: r.admin_comment || null,
      reviewer_id: toInt(r.reviewer_id),
      current_reviewer: r.current_reviewer || null,
      started_review_at: parseTS(r.started_review_at),
      ended_review_at: parseTS(r.ended_review_at),
      rating: toFloat(r.rating),
      note: r.note || null,
      submission_duration: toInt(r.submission_duration),
    }),
    {
      upsertKey: 'id',
      numericSpec: numericSpecs.ml_submission,
    }
  );

  // tracking_clean.csv -> ml_tracking (composite key)
  await ingestCSV(
    p('tracking_clean.csv'),
    'ml_tracking',
    (r) => ({
      developer_id: toInt(r.developer_id),
      journey_id: toInt(r.journey_id),
      tutorial_id: toInt(r.tutorial_id),
      status: toInt(r.status),
      first_opened_at: parseTS(r.first_opened_at),
      completed_at: parseTS(r.completed_at),
      last_viewed: parseTS(r.last_viewed),
    }),
    {
      upsertKey: ['developer_id', 'journey_id', 'tutorial_id'],
      numericSpec: numericSpecs.ml_tracking,
    }
  );

  // ---- Hitung kelas utama per ml_user_id → ml_user_class ----
  try {
    console.log('\nRecomputing ml_user_class from ml_complete + ml_journeys…');

    // Kosongkan dulu
    await db('ml_user_class').truncate();

    // Pakai SQL DISTINCT ON untuk ambil journey dengan study_duration terbesar per user
    const result = await db.raw(`
      select distinct on (c.user_id)
             c.user_id       as ml_user_id,
             c.journey_id    as main_journey_id,
             j.class_track,
             j.class_prefix,
             coalesce(c.study_duration, 0) as study_duration
      from ml_complete c
      join ml_journeys j on j.id = c.journey_id
      where j.class_prefix is not null
      order by c.user_id, study_duration desc nulls last
    `);

    const rows = result?.rows || [];

    if (!rows.length) {
      console.log('  - no journeys with class_prefix found; skipping ml_user_class');
    } else {
      const now = new Date();
      const payload = rows.map((r) => ({
        ml_user_id: r.ml_user_id,
        main_journey_id: r.main_journey_id,
        class_track: r.class_track,
        class_prefix: r.class_prefix,
        class_code:
          r.class_prefix && r.ml_user_id
            ? `${r.class_prefix}-${r.ml_user_id}`
            : null,
        study_duration: r.study_duration,
        created_at: now,
        updated_at: now,
      }));

      const chunkSize = 1000;
      for (let i = 0; i < payload.length; i += chunkSize) {
        const chunk = payload.slice(i, i + chunkSize);
        await db('ml_user_class')
          .insert(chunk)
          .onConflict('ml_user_id')
          .merge({
            main_journey_id: db.raw('EXCLUDED.main_journey_id'),
            class_track: db.raw('EXCLUDED.class_track'),
            class_prefix: db.raw('EXCLUDED.class_prefix'),
            class_code: db.raw('EXCLUDED.class_code'),
            study_duration: db.raw('EXCLUDED.study_duration'),
            updated_at: db.raw('EXCLUDED.updated_at'),
          });
      }

      console.log(`  - upserted ${payload.length} rows into ml_user_class`);
    }
  } catch (e) {
    console.warn('\n[warn] ml_user_class recompute failed:', e.message);
  }

  // --- clustered_learners.csv (opsional, hasil modeling offline) ---
  try {
    // "base" = path ke data_ml
    const candidates = [
      // ../.. dari data_ml -> Capstone_v2/modeling/clustered_learners.csv
      path.join(base, '..', '..', 'modeling', 'clustered_learners.csv'),
      // ../ dari data_ml -> data/modeling/clustered_learners.csv (jika modeling diletakkan di dalam /data)
      path.join(base, '..', 'modeling', 'clustered_learners.csv'),
      // same dir fallback
      path.join(base, 'clustered_learners.csv'),
    ];

    const clusterCsv = candidates.find((p) => fs.existsSync(p));
    if (clusterCsv) {
      console.log(
        '\nImporting',
        path.relative(process.cwd(), clusterCsv),
        '→ ml_learner_cluster'
      );
      await ingestCSV(
        clusterCsv,
        'ml_learner_cluster',
        (r) => ({
          developer_id: toInt(r.developer_id),
          materials_completed: toInt(r.materials_completed),
          active_days: toInt(r.active_days),
          avg_rating: toFloat(r.avg_rating),
          avg_score: toFloat(r.avg_score),
          consistency_score: toFloat(r.consistency_score),
          fast_learner_flag:
            r.fast_learner_flag === '1' ||
            r.fast_learner_flag === 1 ||
            r.fast_learner_flag === true,
          reflective_learner_flag:
            r.reflective_learner_flag === '1' ||
            r.reflective_learner_flag === 1 ||
            r.reflective_learner_flag === true,
          study_duration_total: toFloat(r.study_duration_total),
          cluster: toInt(r.cluster),
          learner_type: r.learner_type || null,
        }),
        { upsertKey: 'developer_id' }
      );
    } else {
      console.log('\n[skip] clustered_learners.csv not found in expected locations');
    }
  } catch (e) {
    console.warn('\n[warn] clustered_learners import failed:', e.message);
  }

  // refresh materialized view
  await rebuildFeaturesViewFromFinal();
  await db.raw('REFRESH MATERIALIZED VIEW CONCURRENTLY ml_user_features;');

  console.log('\nAll done.');
  await db.destroy();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
