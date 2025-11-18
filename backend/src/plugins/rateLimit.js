const buckets = new Map();
/**
 * Token bucket per IP: 60 req / 60 detik
 */
export const rateLimit = {
  name: 'app-rate-limit',
  version: '1.0.0',
  register: async (server) => {
    server.ext('onRequest', (req, h) => {
      const ip = req.info.remoteAddress || 'unknown';
      const now = Date.now();
      let b = buckets.get(ip);
      if (!b) {
        b = { tokens: 60, updated: now };
        buckets.set(ip, b);
      }
      const refill = Math.floor((now - b.updated) / 1000); // per detik
      if (refill > 0) {
        b.tokens = Math.min(60, b.tokens + refill);
        b.updated = now;
      }
      if (b.tokens <= 0) {
        return h.response({ message: 'Too Many Requests' }).code(429).takeover();
      }
      b.tokens -= 1;
      return h.continue;
    });
  }
};
