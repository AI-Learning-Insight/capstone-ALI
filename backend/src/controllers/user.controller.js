// backend/src/controllers/user.controller.js
import Boom from '@hapi/boom';
import fs from 'fs';
import Path from 'path';
import { pipeline } from 'stream/promises';
import mime from 'mime-types';
import { changePasswordSchema, updateProfileSchema } from '../validators/user.schema.js';
import { comparePassword, hashPassword } from '../utils/password.js';
import { db } from '../db/knex.js';
import {
  findUserById,
  updateUser,
  findUserSecretById,
  updateUserPasswordHashById,
} from '../services/user.service.js';

const AVATAR_DIR = Path.join(process.cwd(), 'uploads', 'avatars');

// pastikan folder upload ada
if (!fs.existsSync(AVATAR_DIR)) {
  fs.mkdirSync(AVATAR_DIR, { recursive: true });
}

export const me = async (request, h) => {
  const userId = request.auth.credentials.id;
  const user = await findUserById(userId);
  if (!user) throw Boom.notFound('Akun tidak ditemukan');

  // Tambahkan info kelas utama dari ml_user_class (jika ada ml_user_id)
  if (user.ml_user_id) {
    const cls = await db('ml_user_class')
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

  // Lock ID siswa tidak boleh di-update lewat halaman profil
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

// Versi baru uploadAvatar
export async function uploadAvatar(request, h) {
  // kredensial user
  const creds = request.auth?.credentials || {};
  const userId = creds.id || creds.userId || creds.user_id;

  if (!userId) {
    throw Boom.unauthorized('User tidak ditemukan di token');
  }

  // Nama field harus sama dengan FormData: "avatar"
  const file = request.payload.avatar;

  if (!file || !file.hapi) {
    throw Boom.badRequest('File avatar wajib diisi');
  }

  const { filename, headers } = file.hapi;
  const contentType = headers['content-type'] || '';

  if (!contentType.startsWith('image/')) {
    throw Boom.badRequest('File harus berupa gambar (jpeg/png/webp)');
  }

  // tentukan ekstensi
  const extFromMime = mime.extension(contentType);
  const extFromName = filename && filename.includes('.') ? filename.split('.').pop() : null;
  const ext = extFromMime || extFromName || 'png';

  const safeName = `${userId}-${Date.now()}.${ext}`;
  const filepath = Path.join(AVATAR_DIR, safeName);

  // simpan stream ke file
  await pipeline(file, fs.createWriteStream(filepath));

  const relativeUrl = `/uploads/avatars/${safeName}`;

  // update user di database
  await db('users')
    .where({ id: userId })
    .update({
      avatar_url: relativeUrl,
      updated_at: db.fn.now(), // hapus kalau tidak punya kolom ini
    });

  return h
    .response({
      status: 'ok',
      data: { avatar_url: relativeUrl },
    })
    .code(200);
}
