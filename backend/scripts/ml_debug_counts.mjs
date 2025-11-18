// backend/scripts/ml_debug_counts.mjs
import knex from '../src/db/knex.js';

// helper: hitung cepat dengan Knex query builder (hindari raw)
const countQb = async (table, where = null) => {
  let qb = knex(table);
  if (where) qb = where(qb);
  const row = await qb.count({ c: '*' }).first(); // { c: '123' } (string)
  return Number(row?.c ?? 0);
};

// helper: untuk view/tabel apa pun via SQL (fallback)
const countSql = async (sql) => {
  const res = await knex.raw(sql);                // PG: { rows: [ { c: 123 } ], ... }
  const rows = res?.rows ?? [];
  return Number(rows[0]?.c ?? 0);
};

const run = async () => {
  const totalUsers = await countQb('users');
  const linked     = await countQb('users', (qb) => qb.whereNotNull('ml_user_id'));
  const mlUsers    = await countQb('ml_users');
  const features   = await countSql('select count(*)::int as c from ml_user_features');
  const cluster    = await countQb('ml_learner_cluster');

  console.table([{
    totalUsers,
    linked,
    unlinked: totalUsers - linked,
    mlUsers,
    features,
    cluster
  }]);

  // tampilkan contoh user yang belum tertaut (kalau ada)
  if (totalUsers - linked > 0) {
    const unlinkedRows = await knex('users')
      .select('id', 'email')
      .whereNull('ml_user_id')
      .limit(10);
    console.log('\nUnlinked sample:');
    console.table(unlinkedRows);
  }

  await knex.destroy();
};

run().catch(async (e) => {
  console.error(e);
  await knex.destroy();
  process.exit(1);
});
