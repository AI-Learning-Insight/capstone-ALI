import Joi from 'joi';

export const createThreadSchema = Joi.object({
  target_user_id: Joi.string().uuid().required(),
});

export const sendMessageSchema = Joi.object({
  body: Joi.string().trim().min(1).max(2000).required(),
});

export const messageQuerySchema = Joi.object({
  limit: Joi.number().integer().min(1).max(200).default(50),
  before: Joi.date().iso().optional(),
});
