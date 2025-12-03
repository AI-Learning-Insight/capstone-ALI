// Seed pengguna demo untuk lingkungan pengembangan / container Docker.
// Idempotent: gunakan ON CONFLICT DO NOTHING agar tidak menimpa data manual.
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { db } from '../src/db/knex.js';

const USERS = [
  {
    name: 'Demo Student',
    email: 'student@example.com',
    password: 'Student@123',
    role: 'student',
    grade: '10',
  },
  {
    name: 'Demo Mentor',
    email: 'mentor@example.com',
    password: 'Mentor@123',
    role: 'mentor',
    grade: '12',
  },
  {
    name: 'Demo Admin',
    email: 'admin@example.com',
    password: 'Admin@123',
    role: 'admin',
    grade: '12',
  },
];

async function seed() {
  for (const user of USERS) {
    const password_hash = await bcrypt.hash(user.password, 10);
    await db('users')
      .insert({
        name: user.name,
        email: user.email.toLowerCase(),
        password_hash,
        role: user.role,
        grade: user.grade,
      })
      .onConflict('email')
      .ignore();
  }

  const countRow = await db('users').count().first();
  const total = Number(countRow?.count ?? 0);
  console.log(`[seed_dev_users] selesai. total users: ${total}`);
}

seed()
  .catch((err) => {
    console.error('[seed_dev_users] gagal:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.destroy();
  });
