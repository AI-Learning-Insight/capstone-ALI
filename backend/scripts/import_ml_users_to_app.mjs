// Import semua baris ml_users menjadi akun aplikasi.
// Password default sama untuk semua user baru; akun yang sudah ada tidak disentuh kecuali ml_user_id diisi.
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { db } from '../src/db/knex.js';

const DEFAULT_PASSWORD = process.env.DEFAULT_ML_PASSWORD || 'Student@123';

async function ensureMlUserIdUniqueIndex() {
  // Hilangkan duplikat ml_user_id (ambil baris terbaru), lalu buat unique index partial
  await db.raw(`
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

  await db.raw(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_ml_user_id_unique
    ON users(ml_user_id)
    WHERE ml_user_id IS NOT NULL;
  `);
}

async function run() {
  const password_hash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  // Pastikan constraint siap (idempotent)
  await ensureMlUserIdUniqueIndex();

  const sql = `
    INSERT INTO users (id, name, email, phone, password_hash, role, grade, ml_user_id, created_at, updated_at)
    SELECT
      uuid_generate_v4(),
      COALESCE(NULLIF(TRIM(name), ''), NULLIF(TRIM(display_name), ''), 'User ' || id) AS name,
      LOWER(email) AS email,
      NULLIF(TRIM(phone), '') AS phone,
      ? AS password_hash,
      'student' AS role,
      '10' AS grade,
      id AS ml_user_id,
      NOW(),
      NOW()
    FROM ml_users
    WHERE email IS NOT NULL AND email <> ''
    ON CONFLICT (email) DO UPDATE
      SET ml_user_id = EXCLUDED.ml_user_id,
          name       = EXCLUDED.name,
          phone      = COALESCE(EXCLUDED.phone, users.phone),
          role       = 'student',
          grade      = '10',
          updated_at = NOW()
    RETURNING email, ml_user_id;
  `;

  const res = await db.raw(sql, [password_hash]);
  const rowCount = res.rowCount ?? res.rows?.length ?? 0;
  console.log(`[import_ml_users_to_app] imported/linked ${rowCount} users. default password: ${DEFAULT_PASSWORD}`);
}

run()
  .catch((err) => {
    console.error('[import_ml_users_to_app] failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.destroy();
  });
