import { create, list } from '../controllers/assessment.controller.js';

export default [
  { method: 'GET', path: '/assessments', handler: list },
  { method: 'POST', path: '/assessments', handler: create }
];
