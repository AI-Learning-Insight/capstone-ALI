import Boom from '@hapi/boom';
export const mustBeMentor = (req, h) => {
  const role = req.auth?.credentials?.role;
  if (!['mentor','admin'].includes(role)) throw Boom.forbidden('Mentor only');
  return h.continue;
};
