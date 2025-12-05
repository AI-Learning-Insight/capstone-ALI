// Add days_since_last_active to ml_final_dataset

export async function up(knex) {
  const hasTable = await knex.schema.hasTable('ml_final_dataset');
  if (!hasTable) return;

  const hasCol = await knex.schema.hasColumn(
    'ml_final_dataset',
    'days_since_last_active'
  );
  if (!hasCol) {
    await knex.schema.alterTable('ml_final_dataset', (t) => {
      t.integer('days_since_last_active').nullable();
    });
  }
}

export async function down(knex) {
  const hasTable = await knex.schema.hasTable('ml_final_dataset');
  if (!hasTable) return;

  const hasCol = await knex.schema.hasColumn(
    'ml_final_dataset',
    'days_since_last_active'
  );
  if (hasCol) {
    await knex.schema.alterTable('ml_final_dataset', (t) => {
      t.dropColumn('days_since_last_active');
    });
  }
}
