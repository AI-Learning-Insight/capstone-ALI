import { db } from '../db/knex.js';

export const createAssessment = async (student_id, payload) => {
  const [a] = await db('assessments').insert({ student_id, ...payload }).returning('*');
  return a;
};

export const listAssessments = (student_id) =>
  db('assessments').where({ student_id }).orderBy('created_at', 'desc');
