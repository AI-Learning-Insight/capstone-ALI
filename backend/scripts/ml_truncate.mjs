#!/usr/bin/env node
import knexfile from '../knexfile.js';
import knexPkg from 'knex';

const knex = knexPkg.default(knexfile);

async function main() {
  console.log('→ Truncate ML tables...');
  // urutan penting karena foreign key
  await knex.raw(`
    TRUNCATE TABLE
      ml_exam,
      ml_registration,
      ml_submission,
      ml_tracking,
      ml_complete,
      ml_users
    RESTART IDENTITY CASCADE;
  `);
  const hasFinal = await knex.schema.hasTable('ml_final_dataset');
  if (hasFinal) {
    await knex.raw('TRUNCATE TABLE ml_final_dataset RESTART IDENTITY CASCADE;');
  }
  console.log('Done truncate.');
  await knex.destroy();
}

main().catch((e) => {
  console.error('Error while truncating:', e);
  process.exit(1);
});
