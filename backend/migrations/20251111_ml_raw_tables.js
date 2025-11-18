export async function up(knex) {
  // 1) users_clean.csv
  await knex.schema.createTable('ml_users', (t) => {
    t.bigInteger('id').primary(); // id user eksternal
    t.string('display_name');
    t.string('name');
    t.string('email').index();
    t.string('phone');
    t.integer('user_role');
    t.integer('user_verification_status');
    t.timestamp('created_at', { useTz: true });
    t.string('updated_at'); // sumber data kadang "Oct 8, 2025, 13:17" → simpan mentah
    t.integer('city_id');
  });

  // 2) complete_clean.csv (enroll summary per journey)
  await knex.schema.createTable('ml_complete', (t) => {
    t.bigInteger('id').primary();
    t.bigInteger('user_id').index();
    t.integer('journey_id').index();
    t.timestamp('created_at', { useTz: true });
    t.timestamp('updated_at', { useTz: true });
    t.integer('enrolling_times');
    t.timestamp('enrollments_at', { useTz: true }).nullable();
    t.timestamp('last_enrolled_at', { useTz: true }).nullable();
    t.integer('study_duration').nullable(); // menit (normalisasi saat ingest)
    t.decimal('avg_submission_rating').nullable();
  });

  // 3) registration_clean.csv
  await knex.schema.createTable('ml_registration', (t) => {
    t.bigInteger('id').primary(); // exam_registration_id
    t.integer('exam_module_id').index();
    t.integer('tutorial_id').index();
    t.bigInteger('examinees_id').index(); // user eksternal
    t.integer('status');
    t.timestamp('created_at', { useTz: true });
    t.timestamp('updated_at', { useTz: true });
    t.timestamp('deadline_at', { useTz: true }).nullable();
    t.timestamp('retake_limit_at', { useTz: true }).nullable();
    t.timestamp('exam_finished_at', { useTz: true }).nullable();
    t.timestamp('deleted_at', { useTz: true }).nullable();
  });

  // 4) exam_clean.csv
  await knex.schema.createTable('ml_exam', (t) => {
    t.bigInteger('id').primary();
    t.bigInteger('exam_registration_id').index().references('ml_registration.id').onDelete('CASCADE');
    t.integer('total_questions').nullable();
    t.decimal('score').nullable();
    t.integer('is_passed').nullable(); // 0/1
    t.timestamp('created_at', { useTz: true });
    t.timestamp('look_report_at', { useTz: true }).nullable();
  });

  // 5) submission_clean.csv
  await knex.schema.createTable('ml_submission', (t) => {
    t.bigInteger('id').primary();
    t.integer('journey_id').index();
    t.integer('quiz_id').nullable();
    t.bigInteger('submitter_id').index(); // user eksternal
    t.decimal('version_id').nullable();
    t.text('app_link').nullable();
    t.text('app_comment').nullable();
    t.integer('status').nullable();
    t.boolean('as_trial_subscriber').nullable();
    t.timestamp('created_at', { useTz: true });
    t.timestamp('updated_at', { useTz: true });
    t.text('admin_comment').nullable();
    t.decimal('reviewer_id').nullable();
    t.string('current_reviewer').nullable();
    t.timestamp('started_review_at', { useTz: true }).nullable();
    t.timestamp('ended_review_at', { useTz: true }).nullable();
    t.decimal('rating').nullable();
    t.text('note').nullable();
    t.integer('submission_duration').nullable();
  });

  // 6) tracking_clean.csv
  await knex.schema.createTable('ml_tracking', (t) => {
    t.bigInteger('developer_id').index(); // user eksternal
    t.integer('journey_id').index();
    t.integer('tutorial_id').index();
    t.integer('status').nullable(); // 0/1
    t.timestamp('first_opened_at', { useTz: true }).nullable();
    t.timestamp('completed_at', { useTz: true }).nullable();
    t.timestamp('last_viewed', { useTz: true }).nullable();
    t.primary(['developer_id', 'journey_id', 'tutorial_id']);
  });

  // Indeks bantu
  await knex.schema.alterTable('ml_complete', (t) => t.index(['user_id', 'journey_id']));
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('ml_tracking');
  await knex.schema.dropTableIfExists('ml_submission');
  await knex.schema.dropTableIfExists('ml_exam');
  await knex.schema.dropTableIfExists('ml_registration');
  await knex.schema.dropTableIfExists('ml_complete');
  await knex.schema.dropTableIfExists('ml_users');
}
