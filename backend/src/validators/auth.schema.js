import Joi from 'joi';

export const loginSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
  password: Joi.string().min(8).max(128).required(),
}).options({ abortEarly: false, stripUnknown: true });
