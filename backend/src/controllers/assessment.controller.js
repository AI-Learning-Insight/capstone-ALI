import { assessmentCreateSchema } from '../validators/assessment.schema.js';
import { createAssessment, listAssessments } from '../services/assessment.service.js';

export const create = async (request, h) => {
  const payload = await assessmentCreateSchema.validateAsync(request.payload);
  const a = await createAssessment(request.auth.credentials.id, payload);
  return h.response({ status: 'ok', data: a }).code(201);
};

export const list = async (request, h) => {
  const rows = await listAssessments(request.auth.credentials.id);
  return h.response({ status: 'ok', data: rows });
};
