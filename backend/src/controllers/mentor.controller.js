import Boom from '@hapi/boom';
import { listMentees, mentorOverview } from '../services/mentor.service.js';
import Joi from 'joi';

export async function getOverview(req, h) {
  const data = await mentorOverview();
  return h.response({ status: 'ok', data });
}

export async function getMentees(req, h) {
  const schema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    search: Joi.string().allow('', null).default(''),
    style: Joi.string().valid('fast','consistent','reflective').optional()
  });
  const { value, error } = schema.validate(req.query);
  if (error) throw Boom.badRequest(error.message);

  const { items, pagination } = await listMentees(value);
  return h.response({ status: 'ok', data: { items, pagination } });
}
