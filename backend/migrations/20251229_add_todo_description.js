export async function up(knex) {
  const hasCol = await knex.schema.hasColumn('todos', 'description');
  if (!hasCol) {
    await knex.schema.alterTable('todos', (t) => {
      t.text('description').nullable();
    });
  }
}

export async function down(knex) {
  const hasCol = await knex.schema.hasColumn('todos', 'description');
  if (hasCol) {
    await knex.schema.alterTable('todos', (t) => {
      t.dropColumn('description');
    });
  }
}
