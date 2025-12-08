import Joi from 'joi';

export const todoCreateSchema = Joi.object({
  title: Joi.string().required(),
  subject: Joi.string().allow('', null),
  description: Joi.string().allow('', null),
  due_date: Joi.date().allow(null)
});

export const todoUpdateStatusSchema = Joi.object({
  status: Joi.string().valid('pending', 'doing', 'done').required()
});
