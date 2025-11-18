// backend/src/plugins/static.js
import Inert from '@hapi/inert';
import path from 'path';

export const staticFiles = {
  name: 'static-files',
  version: '1.0.0',
  register: async (server) => {
    await server.register(Inert);

    server.route({
      method: 'GET',
      path: '/uploads/{param*}',
      options: {
        auth: false, // <- WAJIB: akses publik, tanpa JWT
        description: 'Serve public uploaded files',
        tags: ['public', 'static'],
        cache: {
          privacy: 'public',
          expiresIn: 60 * 60 * 1000, // 1 jam (opsional)
        },
      },
      handler: {
        directory: {
          path: path.join(process.cwd(), 'uploads'),
          listing: false,
          index: false,
          redirectToSlash: true,
        },
      },
    });
  },
};
