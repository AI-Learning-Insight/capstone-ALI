import { create, list, updateStatus, remove } from '../controllers/todo.controller.js';

export default [
  { method: 'GET', path: '/todos', handler: list },
  { method: 'POST', path: '/todos', handler: create },
  { method: 'PATCH', path: '/todos/{id}/status', handler: updateStatus },
  { method: 'DELETE', path: '/todos/{id}', handler: remove },
];
