import { db } from '../db/knex.js';

export const latestRecommendations = (student_id, limit = 3) =>
  db('recommendations').where({ student_id }).orderBy('created_at', 'desc').limit(limit);

export const saveRecommendation = async (student_id, rec) => {
  const [r] = await db('recommendations').insert({ student_id, ...rec }).returning('*');
  return r;
};
