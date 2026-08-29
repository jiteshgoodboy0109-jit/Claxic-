export function createRateLimiter({ windowMs = 60000, max = 30, message = 'Too many requests, please slow down.' }) {
  const requests = new Map();

  // Periodic cleanup of stale IP records every 5 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [ip, timestamps] of requests.entries()) {
      const valid = timestamps.filter((t) => now - t < windowMs);
      if (valid.length === 0) {
        requests.delete(ip);
      } else {
        requests.set(ip, valid);
      }
    }
  }, 300000);

  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown-ip';
    const now = Date.now();
    const timestamps = requests.get(ip) || [];

    const recent = timestamps.filter((t) => now - t < windowMs);
    recent.push(now);
    requests.set(ip, recent);

    if (recent.length > max) {
      return res.status(429).json({
        error: 'Too Many Requests',
        message,
        retryAfterSeconds: Math.ceil((windowMs - (now - recent[0])) / 1000),
      });
    }

    next();
  };
}

export const authLimiter = createRateLimiter({
  windowMs: 60000,
  max: 200,
  message: 'Too many authentication requests, please wait 1 minute.',
});

export const paymentLimiter = createRateLimiter({
  windowMs: 60000,
  max: 200,
  message: 'Too many payment requests, please wait 1 minute.',
});
