import 'dotenv/config';
import Hapi from '@hapi/hapi';
import Boom from '@hapi/boom';
import { logging } from './plugins/logging.js';
import { auth } from './plugins/auth.js';
import { rateLimit } from './plugins/rateLimit.js';
import { staticFiles } from './plugins/static.js';
import routes from './routes/index.js';

const ORIGINS = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const init = async () => {
  const server = Hapi.server({
    port: Number(process.env.PORT) || 8080,
    host: '0.0.0.0',
    router: { stripTrailingSlash: true },
    routes: {
      cors: {
        origin: ORIGINS.length ? ORIGINS : ['http://localhost:5173'],
        additionalHeaders: ['authorization', 'content-type'],
        additionalExposedHeaders: ['x-request-id'],
        credentials: true,
      },
      payload: {
        parse: true,
        maxBytes: 10 * 1024 * 1024, // 10MB
        allow: ['application/json', 'multipart/form-data'],
      },
    },
  });

  await server.register([logging, auth, rateLimit, staticFiles]);

  server.route(routes);

  // Formatter error agar konsisten
  server.ext('onPreResponse', (request, h) => {
    const res = request.response;
    if (!res.isBoom) return h.continue;

    const statusCode = res.output.statusCode || 500;
    const message =
      res.data?.message ||
      res.message ||
      (statusCode >= 500 ? 'Internal Server Error' : 'Bad Request');

    const payload = {
      status: statusCode >= 500 ? 'error' : 'fail',
      message,
    };

    return h.response(payload).code(statusCode);
  });

  await server.start();
  server.log(['info'], `Server running at: ${server.info.uri}`);
};

process.on('unhandledRejection', (err) => {
  console.error(err);
  process.exit(1);
});

init();
