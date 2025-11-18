import { todoCreateSchema, todoUpdateStatusSchema } from '../validators/todo.schema.js';
import { createTodo, listTodos, updateTodoStatus, deleteTodo } from '../services/todo.service.js';


export const create = async (request, h) => {
  const payload = await todoCreateSchema.validateAsync(request.payload);
  const t = await createTodo(request.auth.credentials.id, payload);
  return h.response({ status: 'ok', data: t }).code(201);
};

export const list = async (request, h) => {
  const rows = await listTodos(request.auth.credentials.id);
  return h.response({ status: 'ok', data: rows });
};

export const updateStatus = async (request, h) => {
  const { status } = await todoUpdateStatusSchema.validateAsync(request.payload);
  const t = await updateTodoStatus(request.params.id, request.auth.credentials.id, status);
  return h.response({ status: 'ok', data: t });
};

export const remove = async (request, h) => {
  const t = await deleteTodo(request.params.id, request.auth.credentials.id);
  return h.response({ status: 'ok', data: t });
};