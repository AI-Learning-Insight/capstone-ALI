import api from './api';

export async function fetchChatThreads() {
  const r = await api.get('/chat/threads');
  return r.data?.data ?? [];
}

export async function startChatWithUser(target_user_id) {
  const r = await api.post('/chat/threads', { target_user_id });
  return r.data?.data ?? null;
}

export async function fetchChatMessages(threadId, params = {}) {
  const r = await api.get(`/chat/threads/${threadId}/messages`, { params });
  return r.data?.data ?? [];
}

export async function sendChatMessage(threadId, body) {
  const r = await api.post(`/chat/threads/${threadId}/messages`, { body });
  return r.data?.data ?? null;
}

export async function searchChatPartners(q = '') {
  const r = await api.get('/chat/partners', { params: { q } });
  return r.data?.data ?? [];
}

export async function fetchChatUnreadTotal() {
  const r = await api.get('/chat/unread');
  return r.data?.data?.total ?? 0;
}
