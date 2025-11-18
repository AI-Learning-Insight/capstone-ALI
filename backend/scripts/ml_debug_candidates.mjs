// backend/scripts/ml_debug_candidates.mjs
import knex from '../src/db/knex.js';

const run = async () => {
  const rows = await knex('ml_users as m')
    .join('ml_user_features as f', 'f.ml_user_id', 'm.id')
    .select(
      'm.id as ml_user_id',
      'm.email',
      'f.exams_taken',
      'f.pass_rate',
      'f.avg_exam_score',
      'f.study_minutes',
      'f.days_since_last_activity'
    )
    .orderByRaw('f.study_minutes DESC NULLS LAST')
    .limit(15);

  console.table(rows.map(r => ({
    ml_user_id: r.ml_user_id,
    email: r.email,
    exams_taken: r.exams_taken,
    pass_rate: Number(r.pass_rate ?? 0).toFixed(2),
    avg_exam_score: Number(r.avg_exam_score ?? 0).toFixed(1),
    study_minutes: r.study_minutes,
    days_since_last_activity: r.days_since_last_activity
  })));

  await knex.destroy();
};

run().catch(async (e) => { console.error(e); await knex.destroy(); process.exit(1); });
