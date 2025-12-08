import { login } from '../controllers/auth.controller.js';
import { loginSchema } from '../validators/auth.schema.js';

export default [
  {
    method: 'POST',
    path: '/auth/login',
    options: {
      auth: false,                       // public
      validate: { payload: loginSchema }  // 400 otomatis jika tidak valid
    },
    handler: login,
  },
];
