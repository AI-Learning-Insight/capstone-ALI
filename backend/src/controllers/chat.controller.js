import Boom from '@hapi/boom';
import {
  appendMessage,
  ensureThread,
  fetchMessages,
  getThreadIfParticipant,
  listThreads,
  countUnreadTotal,
  searchPartners,
} from '../services/chat.service.js';
import {
  createThreadSchema,
  sendMessageSchema,
  messageQuerySchema,
} from '../validators/chat.schema.js';

export async function listMyThreads(req, h) {
  const userId = req.auth.credentials.id;
  const threads = await listThreads(userId);
  return h.response({ status: 'ok', data: threads });
}

export async function startThread(req, h) {
  let payload;
  try {
    payload = await createThreadSchema.validateAsync(req.payload, {
      abortEarly: false,
      stripUnknown: true,
    });
  } catch (err) {
    throw Boom.badRequest(err.message);
  }

  const currentUser = {
    id: req.auth.credentials.id,
    role: req.auth.credentials.role,
  };

  const { thread, counterpart, created } = await ensureThread(
    currentUser,
    payload.target_user_id,
  );

  const threads = await listThreads(currentUser.id);
  const full = threads.find((t) => String(t.id) === String(thread.id)) || {
    ...thread,
    counterpart,
    last_message: null,
  };

  return h
    .response({ status: 'ok', data: full, meta: { created: !!created } })
    .code(created ? 201 : 200);
}

export async function getThreadMessages(req, h) {
  let query;
  try {
    query = await messageQuerySchema.validateAsync(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });
  } catch (err) {
    throw Boom.badRequest(err.message);
  }

  const userId = req.auth.credentials.id;
  const thread = await getThreadIfParticipant(req.params.id, userId);
  if (!thread) throw Boom.notFound('Percakapan tidak ditemukan');

  const messages = await fetchMessages(thread.id, userId, {
    limit: query.limit,
    before: query.before,
  });

  return h.response({ status: 'ok', data: messages });
}

export async function sendThreadMessage(req, h) {
  let payload;
  try {
    payload = await sendMessageSchema.validateAsync(req.payload, {
      abortEarly: false,
      stripUnknown: true,
    });
  } catch (err) {
    throw Boom.badRequest(err.message);
  }

  const userId = req.auth.credentials.id;
  const thread = await getThreadIfParticipant(req.params.id, userId);
  if (!thread) throw Boom.notFound('Percakapan tidak ditemukan');

  const msg = await appendMessage(thread, userId, payload.body.trim());
  return h.response({ status: 'ok', data: msg }).code(201);
}

export async function listPartners(req, h) {
  const currentUser = {
    id: req.auth.credentials.id,
    role: req.auth.credentials.role,
  };
  const q = String(req.query?.q || '').trim();
  const partners = await searchPartners(currentUser, q);
  return h.response({ status: 'ok', data: partners });
}

export async function getUnreadSummary(req, h) {
  const userId = req.auth.credentials.id;
  const total = await countUnreadTotal(userId);
  return h.response({ status: 'ok', data: { total } });
}
