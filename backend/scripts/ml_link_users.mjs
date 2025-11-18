import knex from '../src/db/knex.js';

const sql = `
UPDATE users u
SET ml_user_id = m.id
FROM ml_users m
WHERE u.ml_user_id IS NULL
  AND lower(u.email) = lower(m.email)
`;

const run = async () => {
  const res = await knex.raw(sql);
  console.log('Linked users → ml_users:', res.rowCount ?? 'done');
  await knex.destroy();
};

run().catch(async (e) => { console.error(e); await knex.destroy(); process.exit(1); });
