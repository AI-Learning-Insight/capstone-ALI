// backend/src/controllers/me.controller.js
import fs from 'fs';
import Path from 'path';
import Boom from '@hapi/boom';
import mime from 'mime-types';
import { fileURLToPath } from 'url';
import { updateUserAvatar } from '../services/user.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = Path.dirname(__filename);

// folder penyimpanan avatar
const UPLOAD_DIR = Path.join(__dirname, '../../uploads/avatars');

// pastikan folder ada
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export const uploadAvatar = async (request, h) => {
  const userId = request.auth.credentials.id;
  const file = request.payload.avatar; // harus sama dengan nama field di FE: "avatar"

  if (!file || !file.hapi) {
    throw Boom.badRequest('File avatar wajib diisi');
  }

  const contentType = file.hapi.headers['content-type'] || '';
  const ext = mime.extension(contentType) || 'png';

  if (!/^image\//.test(contentType)) {
    throw Boom.badRequest('File harus berupa gambar (jpeg/png/webp)');
  }

  const filename = `${userId}-${Date.now()}.${ext}`;
  const filepath = Path.join(UPLOAD_DIR, filename);

  const writeStream = fs.createWriteStream(filepath);

  await new Promise((resolve, reject) => {
    file.pipe(writeStream);
    file.on('end', resolve);
    file.on('error', reject);
  });

  const relativeUrl = `/uploads/avatars/${filename}`;

  // panggil service untuk update kolom avatar_url user
  await updateUserAvatar(userId, relativeUrl);

  return h
    .response({
      status: 'ok',
      data: { avatar_url: relativeUrl },
    })
    .code(201);
};
