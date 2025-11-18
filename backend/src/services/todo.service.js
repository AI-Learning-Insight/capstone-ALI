import { db } from '../db/knex.js';

export const createTodo = async (student_id, payload) => {
  const [t] = await db('todos').insert({ student_id, ...payload }).returning('*');
  return t;
};

export const listTodos = (student_id) =>
  db('todos').where({ student_id }).orderBy('created_at', 'desc');

export const updateTodoStatus = async (id, student_id, status) => {
  const [t] = await db('todos')
    .where({ id, student_id })
    .update({ status })
    .returning('*');
  return t;
};

export const deleteTodo = async (id, student_id) => {
  const [t] = await db('todos')
    .where({ id, student_id })
    .del()
    .returning('*');
  return t;
};
