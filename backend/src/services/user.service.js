// backend/src/services/user.service.js
import { db } from '../db/knex.js';

const SAFE_FIELDS = [
  'id',
  'name',
  'email',
  'role',
  'avatar_url',
  'phone',
  'dob',
  'address',
  'bio',
  'grade',
  'school_id',
  'ml_user_id',        
  'created_at',
  'updated_at',
];

// --- LOGIN (perlu password_hash) ---
export const findUserByEmailWithSecret = (email) =>
  db('users')
    .select(
      'id',
      'name',
      'email',
      'password_hash',
      'role',
      'grade',
      'ml_user_id',   
    )
    .where({ email })
    .first();

// 🔧 ALIAS untuk kompatibilitas lama (dipakai di auth.controller.js)
export const findUserByEmail = (email) => findUserByEmailWithSecret(email);

// --- SAFE GET (/me, dll.) ---
export const getById = (id) =>
  db('users')
    .select(SAFE_FIELDS)
    .where({ id })
    .first();

export const findUserById = (id) => getById(id);

// --- CREATE / UPDATE ---
export const createUser = async ({ name, email, password_hash }) => {
  // NISN tidak lagi dipakai di jalur register.
  const payload = {
    name,
    email,
    password_hash,
    role: 'student',
    grade: '10',
  };

  const [u] = await db('users')
    .insert(payload)
    .returning(SAFE_FIELDS);

  return u;
};

export const updateUser = async (id, patch) => {
  // ⚠️ ID siswa (ml_user_id) hanya diisi dari proses mapping ML,
  // BUKAN dari halaman profil.
  const allowed = [
    'name',
    'avatar_url',
    'phone',
    'dob',
    'address',
    'bio',
    'grade',
    'school_id',
  ];

  const data = {};
  for (const k of allowed) {
    if (k in patch) data[k] = patch[k];
  }

  const [u] = await db('users')
    .where({ id })
    .update({ ...data, updated_at: db.fn.now() })
    .returning(SAFE_FIELDS);

  return u;
};

// === 🔐 Tambahan khusus password (tidak ganggu updateUser/Avatar) ===
export const findUserSecretById = (id) =>
  db('users')
    .select('id', 'password_hash')
    .where({ id })
    .first();

export const updateUserPasswordHashById = (id, password_hash) =>
  db('users')
    .where({ id })
    .update({ password_hash, updated_at: db.fn.now() });
