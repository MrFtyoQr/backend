import jwt from 'jsonwebtoken';

// Rate limiting en memoria (sin Redis). Límite: 60 peticiones por 60 segundos por IP/usuario.
const windowMs = 60 * 1000;
const maxPerWindow = 60;
const store = new Map(); // identifier -> { count, resetAt }

function getIdentifier(req) {
  const forwardedFor = req.headers['x-forwarded-for'];
  const clientIP = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : forwardedFor?.split(',')[0]?.trim() ||
      req.ip ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      '127.0.0.1';

  if (req.user?.userId) {
    return `user:${req.user.userId}`;
  }
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token && process.env.JWT_SECRET) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded?.userId) return `user:${decoded.userId}`;
    } catch (_) {}
  }
  return `ip:${clientIP}`;
}

const rateLimiter = async (req, res, next) => {
  try {
    const identifier = getIdentifier(req);
    const now = Date.now();
    let entry = store.get(identifier);

    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs };
      store.set(identifier, entry);
    }
    entry.count += 1;

    res.set({
      'X-RateLimit-Limit': String(maxPerWindow),
      'X-RateLimit-Remaining': String(Math.max(0, maxPerWindow - entry.count)),
      'X-RateLimit-Reset': new Date(entry.resetAt).toISOString(),
    });

    if (entry.count > maxPerWindow) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests, please try again later.',
        retryAfter: Math.ceil((entry.resetAt - now) / 1000),
      });
    }

    next();
  } catch (error) {
    console.log('Rate limiter error:', error);
    next();
  }
};

export default rateLimiter;
