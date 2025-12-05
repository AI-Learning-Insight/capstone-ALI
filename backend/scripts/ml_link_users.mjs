import knex from '../src/db/knex.js';

const sql = `
UPDATE users u
SET ml_user_id = m.id,
    phone      = COALESCE(u.phone, m.phone)
FROM ml_users m
WHERE u.ml_user_id IS NULL
  AND lower(u.email) = lower(m.email)
`;

const run = async () => {
  const res = await knex.raw(sql);
  const rowCount = res.rowCount ?? res.rows?.length ?? 0;
  console.log(`[ml_link_users] linked ${rowCount} users to ml_users`);
  await knex.destroy();
};

run().catch(async (e) => {
  console.error(e);
  await knex.destroy();
  process.exit(1);
});
