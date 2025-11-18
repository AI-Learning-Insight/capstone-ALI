// backend/src/controllers/user.controller.js
import Boom from '@hapi/boom';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import mime from 'mime-types';
import { changePasswordSchema, updateProfileSchema } from '../validators/user.schema.js';
import { comparePassword, hashPassword } from '../utils/password.js';
import knex from '../db/knex.js';
import {
  findUserById,
  updateUser,
  findUserSecretById,
  updateUserPasswordHashById,
} from '../services/user.service.js';

const AVATAR_DIR = path.join(process.cwd(), 'uploads', 'avatars');

export const me = async (request, h) => {
  const userId = request.auth.credentials.id;
  const user = await findUserById(userId);
  if (!user) throw Boom.notFound('Akun tidak ditemukan');

  // Tambahkan info kelas utama dari ml_user_class (jika ada ml_user_id)
  if (user.ml_user_id) {
    const cls = await knex('ml_user_class')
      .select('class_track', 'class_prefix', 'class_code')
      .where({ ml_user_id: user.ml_user_id })
      .first();

    if (cls) {
      user.class_track = cls.class_track;     // ANDROID / WEB / CLOUD
      user.class_prefix = cls.class_prefix;   // AND / WEB / CLD
      user.class_code = cls.class_code;       // contoh: AND-96989
    }
  }

  return h
    .response({ status: 'ok', data: user })
    .code(200);
};

export const updateProfile = async (request, h) => {
  const userId = request.auth.credentials.id;

  const payload = await updateProfileSchema.validateAsync(request.payload, {
    abortEarly: false,
    stripUnknown: true,
  });

  // 🔒 ID siswa tidak boleh di-update lewat halaman profil
  delete payload.ml_user_id;
  delete payload.id;

  const user = await updateUser(userId, payload);

  return h
    .response({ status: 'ok', data: user })
    .code(200);
};

export const changePassword = async (request, h) => {
  const { password_current, password_new } = await changePasswordSchema.validateAsync(
    request.payload,
    { abortEarly: false, stripUnknown: true },
  );

  const userId = request.auth.credentials.id;

  // Ambil hash lama secara eksplisit
  const secret = await findUserSecretById(userId);
  if (!secret?.password_hash) {
    request.logger?.error?.({
      where: 'changePassword',
      reason: 'missing_hash',
      userId,
    });
    throw Boom.internal('Data akun tidak lengkap');
  }

  // Verifikasi password saat ini
  const ok = await comparePassword(password_current, secret.password_hash);
  if (!ok) throw Boom.unauthorized('Password saat ini salah');

  // Tolak jika password baru sama dengan lama
  const same = await comparePassword(password_new, secret.password_hash);
  if (same) {
    throw Boom.badRequest('Password baru tidak boleh sama dengan password lama');
  }

  const newHash = await hashPassword(password_new);
  await updateUserPasswordHashById(userId, newHash);

  return h
    .response({ status: 'ok', message: 'Password berhasil diubah' })
    .code(200);
};

export const uploadAvatar = async (request, h) => {
  const userId = request.auth.credentials.id;
  const { file } = request.payload || {};

  if (!file || typeof file.pipe !== 'function') {
    throw Boom.badRequest('File avatar wajib diisi');
  }

  const contentType = file.hapi?.headers?.['content-type'] || '';
  const ext = mime.extension(contentType);

  if (!ext || !['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
    throw Boom.badRequest('Tipe file avatar harus JPG, PNG, atau WEBP');
  }

  await fs.promises.mkdir(AVATAR_DIR, { recursive: true });

  const filename = `${userId}-${Date.now()}.${ext}`;
  const dest = path.join(AVATAR_DIR, filename);

  await pipeline(file, fs.createWriteStream(dest));

  const avatar_url = `/uploads/avatars/${filename}`;
  await updateUser(userId, { avatar_url });

  return h
    .response({ status: 'ok', data: { avatar_url } })
    .code(201);
};
