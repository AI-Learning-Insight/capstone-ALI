import Jwt from '@hapi/jwt';
import Boom from '@hapi/boom';

export const auth = {
  name: 'app-auth',
  version: '1.0.0',
  register: async (server) => {
    await server.register(Jwt);

    server.auth.strategy('jwt', 'jwt', {
      keys: process.env.JWT_SECRET,
      verify: {
        aud: false,
        iss: false,
        sub: false,
        nbf: true,
        exp: true
      },
      validate: (artifacts) => {
        // artifacts.decoded.payload => { id, role, email }
        return { isValid: true, credentials: artifacts.decoded.payload };
      }
    });

    server.auth.default('jwt');

    // Public paths helper
    server.ext('onPreAuth', (request, h) => {
      const publicPaths = ['/health', '/auth/login'];
      if (publicPaths.includes(request.path)) {
        request.auth.mode = 'try';
      }
      return h.continue;
    });

    // Simple guard for blocked tokens (future use)
    server.ext('onPostAuth', (request, h) => {
      if (request.route.settings.auth === false) return h.continue;
      if (!request.auth?.isAuthenticated) {
        throw Boom.unauthorized('Missing or invalid token.');
      }
      return h.continue;
    });
  }
};
