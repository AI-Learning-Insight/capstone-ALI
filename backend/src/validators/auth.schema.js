import Joi from 'joi';

export const registerSchema = Joi.object({
  name: Joi.string().trim().min(3).max(100).required(),
  email: Joi.string().trim().lowercase().email().required(),
  password: Joi.string().min(8).max(128).required(), // selaras dengan FE
  // opsional: kalau suatu saat butuh role
  // role: Joi.string().valid('student','teacher','admin').default('student'),
}).options({ abortEarly: false, stripUnknown: true });

export const loginSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
  password: Joi.string().min(8).max(128).required(),
}).options({ abortEarly: false, stripUnknown: true });
