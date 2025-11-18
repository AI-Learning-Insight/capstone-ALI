import { login, register } from '../controllers/auth.controller.js';
import { registerSchema, loginSchema } from '../validators/auth.schema.js';

export default [
  {
    method: 'POST',
    path: '/auth/register',
    options: {
      auth: false,                         // public
      validate: { payload: registerSchema } // 400 otomatis jika tidak valid
    },
    handler: register,
  },
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
