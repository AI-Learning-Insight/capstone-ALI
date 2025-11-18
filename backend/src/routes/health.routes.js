export default [
  {
    method: 'GET',
    path: '/health',
    options: { auth: false },
    handler: (req, h) => h.response({ status: 'ok', time: new Date().toISOString() })
  }
];
