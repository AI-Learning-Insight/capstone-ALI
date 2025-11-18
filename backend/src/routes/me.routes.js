// backend/src/routes/me.routes.js
import { me, updateProfile, changePassword, uploadAvatar } from '../controllers/user.controller.js';

export default [
  { method: 'GET', path: '/me', options: { auth: 'jwt' }, handler: me },
  { method: 'PATCH', path: '/me', options: { auth: 'jwt' }, handler: updateProfile },
  { method: 'PATCH', path: '/me/password', options: { auth: 'jwt' }, handler: changePassword },

  {
    method: 'POST',
    path: '/me/avatar',
    options: {
      auth: 'jwt',
      payload: {
        parse: true,                 // parse body
        output: 'stream',            // kirim file sbg stream ke handler
        multipart: { output: 'stream' }, // terima multipart dari semua browser
        maxBytes: 2 * 1024 * 1024,   // 2MB
        // ❌ JANGAN set "allow" di sini; biarkan controller yang validasi tipe
      },
    },
    handler: uploadAvatar,
  },
];
