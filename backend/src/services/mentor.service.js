import knex from '../db/knex.js';

// ---------- utils ----------
const existsRelation = async (name) => {
  const res = await knex.raw('select to_regclass(?) as reg', [name]); // e.g. 'public.ml_learner_cluster'
  return !!res?.rows?.[0]?.reg;
};
const N = (v, d = 0) => (v == null ? d : Number(v));
const clamp = (x, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, Number(x) || 0));

// Heuristik style bila tidak ada cluster
function inferStyleFromFeatures(f = {}) {
  const pass = N(f.pass_rate);
  const avg = clamp(N(f.avg_exam_score) / 100);
  const minutes = N(f.study_minutes);
  const idle = N(f.days_since_last_activity, 999);
  const rating = N(f.avg_submission_rating);
  if (pass >= 0.8 && avg >= 0.8 && minutes < 300 && idle <= 14) return 'fast';
  if (rating >= 4.5 || minutes >= 600) return 'reflective';
  return 'consistent';
}

// Softmax helper
const softmax = (arr, tau = 0.7) => {
  const ex = arr.map((s) => Math.exp((Number(s) || 0) / tau));
  const sum = ex.reduce((a, b) => a + b, 0) || 1;
  return ex.map((e) => e / sum);
};

// -> Fallback: hitung probabilitas dari fitur (aproksimasi)
//  - fast   : pass up, avg up, menit down, idle down
//  - consistent : pass up, avg up, menit sedang, idle down
//  - reflective : menit up, rating up (pass/avg tetap berkontribusi)
function probsFromFeatures(f = {}) {
  const pass = clamp(N(f.pass_rate));               // 0..1
  const avg = clamp(N(f.avg_exam_score) / 100);     // 0..1
  const minutes = N(f.study_minutes);
  const minNorm = clamp(minutes / 900);             // 0..1 (900 menit jadi saturasi)
  const idleNorm = clamp(N(f.days_since_last_activity, 30) / 30);  // 0..1
  const ratingNorm = clamp((N(f.avg_submission_rating) - 1) / 4);  // 0..1 (1..5 -> 0..1)

  const scoreFast =
    0.35 * pass + 0.35 * avg + 0.2 * (1 - minNorm) + 0.1 * (1 - idleNorm);

  // preferensi menit "sedang" ~ 0.4 (~ 360 menit bila skala 900)
  const midPref = 1 - Math.min(1, Math.abs(minNorm - 0.4) / 0.4);
  const scoreCons =
    0.4 * pass + 0.25 * avg + 0.2 * midPref + 0.15 * (1 - idleNorm);

  const scoreRefl =
    0.15 * pass + 0.2 * avg + 0.4 * minNorm + 0.25 * ratingNorm;

  const [pf, pc, pr] = softmax([scoreFast, scoreCons, scoreRefl], 0.7);
  return { prob_fast: pf, prob_consistent: pc, prob_reflective: pr };
}

// Buat URL absolut untuk avatar (jika backend kirim path relatif /uploads/...)
function absUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const base =
    process.env.PUBLIC_BASE_URL ||
    process.env.APP_BASE_URL ||
    `http://localhost:${process.env.PORT || 8080}`;
  return `${base}${path}`;
}

// ---------- List mentees (anchor: ml_users) ----------
export async function listMentees({ page = 1, limit = 20, search = '', style } = {}) {
  const p = Math.max(1, Number(page));
  const l = Math.min(100, Math.max(1, Number(limit)));
  const offset = (p - 1) * l;

  const hasFeatures = await existsRelation('public.ml_user_features');
  const hasCluster  = await existsRelation('public.ml_learner_cluster');

  // total (aman: search ke ml_users saja)
  const countQ = knex('ml_users as mu');
  if (search) {
    const q = `%${String(search)}%`;
    countQ.andWhere(function () {
      this.where('mu.email', 'ilike', q).orWhere('mu.name', 'ilike', q);
    });
  }
  const total = Number((await countQ.clone().count({ total: '*' }).first())?.total ?? 0);

  // page data
  const baseRows = await (function () {
    const qb = knex('ml_users as mu')
      .leftJoin('users as u', 'u.ml_user_id', 'mu.id')
      .select(
        'mu.id as ml_user_id',
        knex.raw("COALESCE(u.name, mu.name, split_part(mu.email,'@',1)) as name"),
        knex.raw('COALESCE(u.email, mu.email) as email'),
        'u.id as app_user_id',
        'u.avatar_url'
      )
      .orderBy('mu.id', 'asc')
      .offset(offset)
      .limit(l);

    if (search) {
      const q = `%${String(search)}%`;
      qb.andWhere(function () {
        this.where('mu.email', 'ilike', q).orWhere('mu.name', 'ilike', q);
      });
    }
    return qb;
  })();

  const ids = baseRows.map((r) => r.ml_user_id);
  if (ids.length === 0) return { items: [], pagination: { page: p, limit: l, total } };

  // fitur per page
  let featuresById = {};
  if (hasFeatures) {
    const feats = await knex('ml_user_features').whereIn('ml_user_id', ids);
    for (const f of feats) featuresById[f.ml_user_id] = f;
  }

  // cluster per page (+ deteksi kolom probabilitas jika ada)
  let clusterById = {};
  let hasProbCols = false;
  if (hasCluster) {
    const cols = await knex('information_schema.columns')
      .select('column_name')
      .where({ table_schema: 'public', table_name: 'ml_learner_cluster' });

    const names = cols.map((c) => c.column_name);
    const pick = (arr) => arr.find((n) => names.includes(n));
    const cFast = pick(['prob_fast','p_fast','fast_prob','fast_probability','proba_fast']);
    const cCons = pick(['prob_consistent','p_consistent','consistent_prob','consistent_probability','proba_consistent']);
    const cRefl = pick(['prob_reflective','p_reflective','reflective_prob','reflective_probability','proba_reflective']);

    const selects = ['developer_id','cluster','learner_type'];
    if (cFast) selects.push(knex.raw(`"${cFast}" as prob_fast`));
    if (cCons) selects.push(knex.raw(`"${cCons}" as prob_consistent`));
    if (cRefl) selects.push(knex.raw(`"${cRefl}" as prob_reflective`));
    hasProbCols = !!(cFast || cCons || cRefl);

    const cls = await knex('ml_learner_cluster')
      .whereIn('developer_id', ids)
      .select(selects);

    for (const c of cls) clusterById[c.developer_id] = c;
  }

  // compose items
  let items = baseRows.map((r) => {
    const f = featuresById[r.ml_user_id] || {};
    const c = clusterById[r.ml_user_id] || {};

    // style final: cluster > heuristik
    const lt = String(c.learner_type || '').toLowerCase();
    const styleDerived = lt
      ? (lt.includes('fast') ? 'fast' : lt.includes('reflective') ? 'reflective' : 'consistent')
      : inferStyleFromFeatures(f);

    // probabilitas: pakai dari cluster jika ada; jika tidak, hitung dari fitur
    let prob_fast = null, prob_consistent = null, prob_reflective = null;
    if (hasProbCols && (c.prob_fast != null || c.prob_consistent != null || c.prob_reflective != null)) {
      prob_fast = c.prob_fast != null ? Number(c.prob_fast) : null;
      prob_consistent = c.prob_consistent != null ? Number(c.prob_consistent) : null;
      prob_reflective = c.prob_reflective != null ? Number(c.prob_reflective) : null;
    } else {
      const p = probsFromFeatures(f);
      prob_fast = p.prob_fast; prob_consistent = p.prob_consistent; prob_reflective = p.prob_reflective;
    }

    return {
      id: r.app_user_id ? Number(r.app_user_id) : null,
      name: r.name,
      email: r.email,
      ml_user_id: r.ml_user_id,
      avatar: absUrl(r.avatar_url),

      style: styleDerived,
      category: styleDerived === 'fast' ? 'A' : styleDerived === 'consistent' ? 'B' : 'C',
      cluster: c.cluster ?? null,

      // down kirim probabilitas 0..1
      prob_fast,
      prob_consistent,
      prob_reflective,

      // metrik ringkas
      exams_taken: N(f.exams_taken),
      pass_rate: f.pass_rate == null ? 0 : N(f.pass_rate),
      avg_exam_score: f.avg_exam_score == null ? 0 : N(f.avg_exam_score),
      study_minutes: N(f.study_minutes),
      avg_study_duration: f.avg_study_duration == null ? 0 : N(f.avg_study_duration),
      avg_submission_rating: f.avg_submission_rating == null ? 0 : N(f.avg_submission_rating),
      avg_completion_rating: f.avg_completion_rating == null ? 0 : N(f.avg_completion_rating),
      tutorials_completed: N(f.tutorials_completed),
      total_tracking_events: N(f.total_tracking_events),
      total_submissions: N(f.total_submissions),
      days_since_last_activity: f.days_since_last_activity == null ? null : N(f.days_since_last_activity),
    };
  });

  // filter style di JS (aman)
  if (style) {
    const s = String(style).toLowerCase();
    items = items.filter((it) => it.style === s);
  }

  return { items, pagination: { page: p, limit: l, total } };
}

// ---------- Overview ----------
export async function mentorOverview() {
  const hasFeatures = await existsRelation('public.ml_user_features');
  const hasCluster  = await existsRelation('public.ml_learner_cluster');

  const mus = await knex('ml_users').select('id').orderBy('id', 'asc');
  const ids = mus.map((r) => r.id);

  let featuresById = {};
  if (hasFeatures && ids.length) {
    const feats = await knex('ml_user_features').whereIn('ml_user_id', ids);
    for (const f of feats) featuresById[f.ml_user_id] = f;
  }

  let clusterById = {};
  if (hasCluster && ids.length) {
    const cls = await knex('ml_learner_cluster').whereIn('developer_id', ids);
    for (const c of cls) clusterById[c.developer_id] = c;
  }

  let total = ids.length, fast = 0, consistent = 0, reflective = 0;
  for (const id of ids) {
    const f = featuresById[id] || {};
    const c = clusterById[id] || {};
    const lt = String(c.learner_type || '').toLowerCase();
    const style = lt
      ? (lt.includes('fast') ? 'fast' : lt.includes('reflective') ? 'reflective' : 'consistent')
      : inferStyleFromFeatures(f);
    if (style === 'fast') fast += 1;
    else if (style === 'reflective') reflective += 1;
    else consistent += 1;
  }

  return { total, fast, consistent, reflective };
}
