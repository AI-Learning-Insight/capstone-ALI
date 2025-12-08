// backend/src/controllers/auth.controller.js
import Boom from '@hapi/boom';
import Jwt from '@hapi/jwt';
import { comparePassword } from '../utils/password.js';
import { loginSchema } from '../validators/auth.schema.js';
import { findUserByEmail } from '../services/user.service.js';

// helper kecil: pastikan secret ada & generate JWT
const signJwt = (payload) => {
  if (!process.env.JWT_SECRET) {
    throw Boom.internal('Konfigurasi JWT belum diset');
  }
  return Jwt.token.generate(payload, { key: process.env.JWT_SECRET, ttlSec: 7 * 24 * 3600 });
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
