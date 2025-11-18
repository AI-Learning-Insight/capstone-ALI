// backend/src/controllers/auth.controller.js
import Boom from '@hapi/boom';
import Jwt from '@hapi/jwt';
import { comparePassword, hashPassword } from '../utils/password.js';
import { registerSchema, loginSchema } from '../validators/auth.schema.js';
import { createUser, findUserByEmail } from '../services/user.service.js';

// helper kecil: pastikan secret ada & generate JWT
const signJwt = (payload) => {
  if (!process.env.JWT_SECRET) {
    throw Boom.internal('Konfigurasi JWT belum diset');
  }
  return Jwt.token.generate(payload, { key: process.env.JWT_SECRET, ttlSec: 7 * 24 * 3600 });
};

export const register = async (request, h) => {
  // Alias: dukung fullName dari FE
  const raw = { ...(request.payload || {}) };
  if (raw.fullName && !raw.name) raw.name = raw.fullName;

  // Validasi payload
  const payload = await registerSchema.validateAsync(raw, {
    abortEarly: false,
    stripUnknown: true,
  });

  // Normalisasi sederhana
  payload.name = String(payload.name).trim();
  payload.email = String(payload.email).trim().toLowerCase();

  // Cek duplikasi (best-effort; race condition tetap ditangkap di catch 23505)
  const existing = await findUserByEmail(payload.email);
  if (existing) throw Boom.conflict('Email sudah terdaftar');

  try {
    const password_hash = await hashPassword(payload.password);

    // createUser di service sudah menyaring field yang dipakai
    const user = await createUser({
      ...payload,
      password_hash,
    });

    const token = signJwt({ id: user.id, email: user.email, role: user.role });

    // Jangan expose hash
    const { password_hash: _omit, ...safe } = user;
    return h.response({ status: 'ok', data: { token, user: safe } }).code(201);
  } catch (err) {
    // Map error khas Postgres agar tidak jadi 500
    if (err.code === '23505') {
      // unique_violation (email unik)
      throw Boom.conflict('Email sudah terdaftar');
    }
    if (err.code === '23502') {
      // not_null_violation
      throw Boom.badRequest(`Field wajib kosong: ${err.column || 'unknown'}`);
    }
    request.logger?.error({ where: 'auth.register', code: err.code, detail: err.detail });
    throw Boom.internal('Gagal register');
  }
};

export const login = async (request, h) => {
  const data = await loginSchema.validateAsync(request.payload, {
    abortEarly: false,
    stripUnknown: true,
  });

  const email = String(data.email).trim().toLowerCase();
  const password = data.password;

  const user = await findUserByEmail(email);
  if (!user) throw Boom.unauthorized('Email atau password salah');

  const ok = await comparePassword(password, user.password_hash);
  if (!ok) throw Boom.unauthorized('Email atau password salah');

  const token = signJwt({ id: user.id, email: user.email, role: user.role });

  const { password_hash: _omit, ...safe } = user;
  return h.response({ status: 'ok', data: { token, user: safe } }).code(200);
};
