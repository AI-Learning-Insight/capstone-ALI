// Buat/pertahankan satu akun mentor statis agar dashboard mentor selalu bisa diakses,
// terlepas dari isi CSV ml_users.
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { db } from '../src/db/knex.js';

const MENTOR_EMAIL = process.env.MENTOR_EMAIL || 'mentor@example.com';
const MENTOR_NAME = process.env.MENTOR_NAME || 'Mentor';
const MENTOR_PHONE = process.env.MENTOR_PHONE || null;
const MENTOR_PASSWORD = process.env.MENTOR_PASSWORD || 'Mentor@123';

async function main() {
  const hash = await bcrypt.hash(MENTOR_PASSWORD, 10);

  await db.raw(
    `
    INSERT INTO users (id, name, email, phone, password_hash, role, grade, created_at, updated_at)
    VALUES (uuid_generate_v4(), ?, LOWER(?), ?, ?, 'mentor', NULL, NOW(), NOW())
    ON CONFLICT (email) DO UPDATE
      SET name = EXCLUDED.name,
          phone = COALESCE(EXCLUDED.phone, users.phone),
          password_hash = EXCLUDED.password_hash,
          role = 'mentor',
          updated_at = NOW()
    `,
    [MENTOR_NAME, MENTOR_EMAIL, MENTOR_PHONE, hash]
  );

  console.log(
    `[seed:mentor] ensured mentor account: ${MENTOR_EMAIL} (password: ${MENTOR_PASSWORD})`
  );
}

main()
  .catch((err) => {
    console.error('[seed:mentor] failed', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.destroy();
  });
