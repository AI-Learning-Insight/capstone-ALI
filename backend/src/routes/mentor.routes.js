// backend/src/routes/mentor.routes.js
import { getOverview, getMentees } from '../controllers/mentor.controller.js';
import { mustBeMentor } from '../plugins/guards.js';

export default [
  {
    method: 'GET',
    path: '/mentor/overview',
    options: {
      auth: 'jwt',
      pre: [{ method: mustBeMentor }], // hanya mentor/admin
      tags: ['api', 'mentor'],
      description: 'Overview area mentor',
      response: { failAction: 'log' },
    },
    handler: getOverview,
  },
  {
    method: 'GET',
    path: '/mentor/mentees',
    options: {
      auth: 'jwt',
      pre: [{ method: mustBeMentor }],
      tags: ['api', 'mentor'],
      description: 'Daftar mentee bimbingan',
      response: { failAction: 'log' },
    },
    handler: getMentees,
  },
];
