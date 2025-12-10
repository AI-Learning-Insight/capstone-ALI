import {
  getThreadMessages,
  listMyThreads,
  listPartners,
  sendThreadMessage,
  startThread,
  getUnreadSummary,
} from '../controllers/chat.controller.js';

export default [
  {
    method: 'GET',
    path: '/chat/threads',
    options: {
      auth: 'jwt',
      tags: ['api', 'chat'],
      description: 'Daftar percakapan yang melibatkan user',
    },
    handler: listMyThreads,
  },
  {
    method: 'POST',
    path: '/chat/threads',
    options: {
      auth: 'jwt',
      tags: ['api', 'chat'],
      description: 'Mulai percakapan dengan lawan bicara (mentor/mentee)',
      response: { failAction: 'log' },
    },
    handler: startThread,
  },
  {
    method: 'GET',
    path: '/chat/threads/{id}/messages',
    options: {
      auth: 'jwt',
      tags: ['api', 'chat'],
      description: 'Ambil pesan dalam percakapan',
      response: { failAction: 'log' },
    },
    handler: getThreadMessages,
  },
  {
    method: 'POST',
    path: '/chat/threads/{id}/messages',
    options: {
      auth: 'jwt',
      tags: ['api', 'chat'],
      description: 'Kirim pesan pada percakapan',
      response: { failAction: 'log' },
    },
    handler: sendThreadMessage,
  },
  {
    method: 'GET',
    path: '/chat/partners',
    options: {
      auth: 'jwt',
      tags: ['api', 'chat'],
      description: 'Cari lawan bicara yang valid (mentor/mentee)',
      response: { failAction: 'log' },
    },
    handler: listPartners,
  },
  {
    method: 'GET',
    path: '/chat/unread',
    options: {
      auth: 'jwt',
      tags: ['api', 'chat'],
      description: 'Hitung total pesan belum dibaca',
      response: { failAction: 'log' },
    },
    handler: getUnreadSummary,
  },
];
