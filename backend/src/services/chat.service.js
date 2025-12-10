import Boom from '@hapi/boom';
import { db } from '../db/knex.js';

const USER_FIELDS = ['id', 'name', 'email', 'role', 'avatar_url'];
const isMentor = (role) => ['mentor', 'admin'].includes(role);
const isMentee = (role) => role === 'student';

const fetchUserBasic = (id) =>
  db('users').select(USER_FIELDS).where({ id }).first();

function resolvePair(current, target) {
  if (current.id === target.id) {
    throw Boom.badRequest('Tidak bisa membuat chat dengan diri sendiri');
  }
  const curRole = current.role;
  const tgtRole = target.role;

  if (isMentee(curRole) && isMentor(tgtRole)) {
    return { mentorId: target.id, menteeId: current.id };
  }
  if (isMentor(curRole) && isMentee(tgtRole)) {
    return { mentorId: current.id, menteeId: target.id };
  }
  throw Boom.forbidden('Chat hanya tersedia antara mentor dan mentee');
}

export async function ensureThread(currentUser, targetUserId) {
  const actor = await fetchUserBasic(currentUser.id);
  if (!actor) throw Boom.notFound('Akun tidak ditemukan');

  const target = await fetchUserBasic(targetUserId);
  if (!target) throw Boom.notFound('User tujuan tidak ditemukan');

  const { mentorId, menteeId } = resolvePair(actor, target);

  const existing = await db('chat_threads')
    .where({ mentor_id: mentorId, mentee_id: menteeId })
    .first();
  if (existing) {
    return { thread: existing, counterpart: target, created: false };
  }

  const [thread] = await db('chat_threads')
    .insert({
      mentor_id: mentorId,
      mentee_id: menteeId,
    })
    .returning(['id', 'mentor_id', 'mentee_id', 'created_at', 'updated_at', 'last_message_at']);

  return { thread, counterpart: target, created: true };
}

export async function listThreads(userId) {
  const rows = await db('chat_threads as t')
    .where(function () {
      this.where('t.mentor_id', userId).orWhere('t.mentee_id', userId);
    })
    .orderByRaw('COALESCE(t.last_message_at, t.updated_at, t.created_at) DESC NULLS LAST');

  if (!rows.length) return [];

  const peerIds = rows.map((t) =>
    String(t.mentor_id) === String(userId) ? t.mentee_id : t.mentor_id,
  );
  const uniquePeerIds = [...new Set(peerIds)];

  const peers = await db('users')
    .select(USER_FIELDS)
    .whereIn('id', uniquePeerIds);
  const peerMap = Object.fromEntries(peers.map((p) => [String(p.id), p]));

  const threadIds = rows.map((r) => r.id);

  // hitung unread per thread untuk user ini
  const unreadRows = await db('chat_messages')
    .select('thread_id')
    .count({ total: '*' })
    .whereIn('thread_id', threadIds)
    .andWhere({ recipient_id: userId })
    .whereNull('read_at')
    .groupBy('thread_id');
  const unreadMap = Object.fromEntries(
    unreadRows.map((r) => [String(r.thread_id), Number(r.total) || 0]),
  );

  const lastMessages = await db
    .select(
      'm.thread_id',
      'm.id',
      'm.body',
      'm.sender_id',
      'm.recipient_id',
      'm.created_at',
      'm.read_at',
    )
    .from(
      db('chat_messages')
        .select(
          'thread_id',
          'id',
          'body',
          'sender_id',
          'recipient_id',
          'created_at',
          'read_at',
          db.raw('row_number() over (partition by thread_id order by created_at desc) as rn'),
        )
        .whereIn('thread_id', threadIds)
        .as('m'),
    )
    .where('rn', 1);

  const lastMap = Object.fromEntries(lastMessages.map((m) => [String(m.thread_id), m]));

  return rows.map((t) => {
    const peerId = String(t.mentor_id) === String(userId) ? t.mentee_id : t.mentor_id;
    return {
      ...t,
      counterpart: peerMap[String(peerId)] || null,
      last_message: lastMap[String(t.id)] || null,
      unread_count: unreadMap[String(t.id)] || 0,
    };
  });
}

export async function getThreadIfParticipant(threadId, userId) {
  const t = await db('chat_threads').where({ id: threadId }).first();
  if (!t) return null;
  if (String(t.mentor_id) !== String(userId) && String(t.mentee_id) !== String(userId)) {
    return null;
  }
  return t;
}

export async function fetchMessages(threadId, userId, { limit = 50, before } = {}) {
  const l = Math.min(200, Math.max(1, Number(limit) || 50));

  // tandai semua pesan yang diterima user ini di thread ini sebagai dibaca
  await db('chat_messages')
    .where({ thread_id: threadId, recipient_id: userId })
    .whereNull('read_at')
    .update({ read_at: db.fn.now() });

  const qb = db('chat_messages')
    .where({ thread_id: threadId })
    .orderBy('created_at', 'desc')
    .limit(l);

  if (before) {
    qb.andWhere('created_at', '<', before);
  }

  const rows = await qb;
  // kembalikan dalam urutan kronologis
  return rows.reverse();
}

export async function appendMessage(thread, senderId, body) {
  const recipientId =
    String(thread.mentor_id) === String(senderId) ? thread.mentee_id : thread.mentor_id;

  return db.transaction(async (trx) => {
    const [msg] = await trx('chat_messages')
      .insert({
        thread_id: thread.id,
        sender_id: senderId,
        recipient_id: recipientId,
        body,
      })
      .returning(['id', 'thread_id', 'sender_id', 'recipient_id', 'body', 'created_at', 'read_at']);

    await trx('chat_threads')
      .where({ id: thread.id })
      .update({ last_message_at: trx.fn.now(), updated_at: trx.fn.now() });

    return msg;
  });
}

export async function searchPartners(currentUser, query = '') {
  const wantMentees = isMentor(currentUser.role);
  const q = String(query || '').trim().toLowerCase();

  const qb = db('users')
    .select(USER_FIELDS)
    .whereNot('id', currentUser.id);

  if (wantMentees) {
    qb.andWhere('role', 'student');
  } else {
    qb.andWhere(function () {
      this.where('role', 'mentor').orWhere('role', 'admin');
    });
  }

  if (q) {
    qb.andWhere(function () {
      this.whereRaw('LOWER(name) like ?', [`%${q}%`]).orWhereRaw('LOWER(email) like ?', [`%${q}%`]);
    });
  }

  return qb.orderBy('name', 'asc').limit(20);
}

export async function countUnreadTotal(userId) {
  const row = await db('chat_messages')
    .where({ recipient_id: userId })
    .whereNull('read_at')
    .count({ total: '*' })
    .first();
  return Number(row?.total || 0);
}
