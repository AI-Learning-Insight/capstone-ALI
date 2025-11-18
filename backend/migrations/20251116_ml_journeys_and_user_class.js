// backend/migrations/20251116_ml_journeys_and_user_class.js

export async function up(knex) {
  // Tabel katalog journey (dari developer_journeys.csv)
  const hasJourneys = await knex.schema.hasTable('ml_journeys');
  if (!hasJourneys) {
    await knex.schema.createTable('ml_journeys', (t) => {
      t.integer('id').primary();           // journey_id dari CSV
      t.string('name');
      t.integer('hours_to_study').nullable();

      // Kategori tinggi: ANDROID / WEB / CLOUD / dll
      t.string('class_track').nullable();   // e.g. "ANDROID"
      t.string('class_prefix').nullable();  // e.g. "AND"

      t.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
      t.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    });
  }

  // Tabel kelas utama per ml_user_id
  const hasUserClass = await knex.schema.hasTable('ml_user_class');
  if (!hasUserClass) {
    await knex.schema.createTable('ml_user_class', (t) => {
      t.bigInteger('ml_user_id').primary().references('ml_users.id').onDelete('CASCADE');
      t.integer('main_journey_id').references('ml_journeys.id').onDelete('SET NULL');

      t.string('class_track').nullable();   // ANDROID / WEB / CLOUD
      t.string('class_prefix').nullable();  // AND / WEB / CLD
      t.string('class_code').nullable().unique(); // contoh: AND-96989

      t.integer('study_duration').nullable(); // menit dari ml_complete

      t.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
      t.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    });
  }
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('ml_user_class');
  await knex.schema.dropTableIfExists('ml_journeys');
}
