// backend/src/routes/me.routes.js
import { me, updateProfile, changePassword, uploadAvatar } from '../controllers/user.controller.js';

export default [
  // --- profil dasar ---
  {
    method: 'GET',
    path: '/me',
    options: { auth: 'jwt' },      // ⬅️ ganti 'jwt' kalau di server.js namanya beda
    handler: me,
  },
  {
    method: 'PATCH',
    path: '/me',
    options: { auth: 'jwt' },
    handler: updateProfile,
  },
  {
    method: 'PATCH',
    path: '/me/password',
    options: { auth: 'jwt' },
    handler: changePassword,
  },

  // --- upload avatar ---
  {
    method: 'POST',
    path: '/me/avatar',
    options: {
      auth: 'jwt',                 // ⬅️ sama persis dengan GET /me
      payload: {
        parse: true,
        output: 'stream',
        multipart: { output: 'stream' },
        maxBytes: 2 * 1024 * 1024, // 2 MB
      },
    },
    handler: uploadAvatar,
  },
];
