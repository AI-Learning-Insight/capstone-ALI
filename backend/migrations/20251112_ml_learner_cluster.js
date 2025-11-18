export async function up(knex) {
  const exists = await knex.schema.hasTable('ml_learner_cluster');
  if (!exists) {
    await knex.schema.createTable('ml_learner_cluster', (t) => {
      t.bigInteger('developer_id').primary();
      t.integer('materials_completed');
      t.integer('active_days');
      t.decimal('avg_rating', 8, 2);
      t.decimal('avg_score', 8, 3);
      t.decimal('consistency_score', 8, 3);
      t.boolean('fast_learner_flag');
      t.boolean('reflective_learner_flag');
      t.decimal('study_duration_total', 12, 2);
      t.integer('cluster');
      t.string('learner_type');
    });
  }
}
export async function down(knex) {
  await knex.schema.dropTableIfExists('ml_learner_cluster');
}
