import HapiPino from 'hapi-pino';

export const logging = {
  name: 'app-logging',
  version: '1.0.0',
  register: async (server) => {
    await server.register({
      plugin: HapiPino,
      options: {
        redact: ['req.headers.authorization', 'payload.password', 'payload.password_new'],
        transport:
          process.env.NODE_ENV === 'development'
            ? { target: 'pino-pretty', options: { singleLine: true } }
            : undefined
      }
    });
  }
};
