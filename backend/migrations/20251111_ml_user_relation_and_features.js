export async function up(knex) {
  // relasi cepat: users (aplikasi) -> ml_users (dataset)
  const hasCol = await knex.schema.hasColumn('users', 'ml_user_id');
  if (!hasCol) {
    await knex.schema.alterTable('users', (t) => {
      t.bigInteger('ml_user_id').nullable().index();
    });
  }

  // materialized view fitur per user eksternal (aggregasi lintas tabel)
  await knex.schema.raw(`
    CREATE MATERIALIZED VIEW IF NOT EXISTS ml_user_features AS
    with enroll AS (
      select user_id,
             count(*)                        as enrollments_count,
             sum(coalesce(study_duration,0)) as study_minutes,
             avg(nullif(avg_submission_rating,0)) as avg_submission_rating,
             max(last_enrolled_at)           as last_enrolled_at
      from ml_complete
      group by user_id
    ),
    exams AS (
      select r.examinees_id as user_id,
             count(e.id)                         as exams_taken,
             avg(e.score)                        as avg_exam_score,
             avg(e.is_passed::float)             as pass_rate,
             max(coalesce(r.exam_finished_at, e.created_at)) as last_exam_activity
      from ml_registration r
      left join ml_exam e on e.exam_registration_id = r.id
      group by r.examinees_id
    ),
    track AS (
      select developer_id as user_id,
             count(*) filter (where status=1 and completed_at is not null) as tutorials_completed,
             max(coalesce(last_viewed, completed_at, first_opened_at))     as last_track_activity
      from ml_tracking
      group by developer_id
    )
    select
      coalesce(u.id, ex.user_id, t.user_id)         as ml_user_id,
      u.email,
      u.display_name,
      u.name,
      coalesce(en.enrollments_count,0)              as enrollments_count,
      coalesce(en.study_minutes,0)                  as study_minutes,
      round(coalesce(en.avg_submission_rating,0)::numeric, 2) as avg_submission_rating,
      en.last_enrolled_at,
      coalesce(ex.exams_taken,0)                    as exams_taken,
      round(coalesce(ex.avg_exam_score,0)::numeric, 2) as avg_exam_score,
      round(coalesce(ex.pass_rate,0)::numeric, 3)   as pass_rate,
      ex.last_exam_activity,
      coalesce(t.tutorials_completed,0)             as tutorials_completed,
      t.last_track_activity,
      greatest(
        coalesce(en.last_enrolled_at, to_timestamp(0)),
        coalesce(ex.last_exam_activity, to_timestamp(0)),
        coalesce(t.last_track_activity, to_timestamp(0))
      ) as last_activity_at,
      extract(epoch from (now() - greatest(
        coalesce(en.last_enrolled_at, to_timestamp(0)),
        coalesce(ex.last_exam_activity, to_timestamp(0)),
        coalesce(t.last_track_activity, to_timestamp(0))
      )))/86400.0 as days_since_last_activity
    from ml_users u
    full join (select * from enroll) en on en.user_id = u.id
    full join (select * from exams)  ex on ex.user_id = u.id
    full join (select * from track)  t  on t.user_id = u.id
  `);

  await knex.schema.raw(`CREATE UNIQUE INDEX IF NOT EXISTS idx_ml_user_features ON ml_user_features(ml_user_id);`);
}

export async function down(knex) {
  await knex.schema.raw('DROP MATERIALIZED VIEW IF EXISTS ml_user_features');
  await knex.schema.alterTable('users', (t) => t.dropColumn('ml_user_id'));
}
