export async function up(knex) {
  // Deduplicate users by ml_user_id (keep the most recent)
  await knex.raw(`
    WITH ranked AS (
      SELECT
        id,
        ml_user_id,
        ROW_NUMBER() OVER (
          PARTITION BY ml_user_id
          ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id
        ) AS rn
      FROM users
      WHERE ml_user_id IS NOT NULL
    )
    DELETE FROM users u
    USING ranked r
    WHERE u.id = r.id AND r.rn > 1;
  `);

  // Unique index untuk memastikan 1:1 ml_user_id -> users
  await knex.raw(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_ml_user_id_unique
    ON users(ml_user_id)
    WHERE ml_user_id IS NOT NULL;
  `);
}

export async function down(knex) {
  await knex.raw('DROP INDEX IF EXISTS idx_users_ml_user_id_unique;');
}
