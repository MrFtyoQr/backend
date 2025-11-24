import jwt from 'jsonwebtoken';
import ratelimit from '../config/upstash.js';

const rateLimiter = async (req, res, next) => {
  if (!ratelimit) {
    return next();
  }

  try {
    const forwardedFor = req.headers['x-forwarded-for'];
    const clientIP = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : forwardedFor?.split(',')[0]?.trim() ||
        req.ip ||
        req.connection?.remoteAddress ||
        req.socket?.remoteAddress ||
        (req.connection?.socket ? req.connection.socket.remoteAddress : null) ||
        '127.0.0.1';

    let identifier = `ip:${clientIP}`;

    if (req.user?.userId) {
      identifier = `user:${req.user.userId}`;
    } else {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (token && process.env.JWT_SECRET) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          if (decoded?.userId) {
            identifier = `user:${decoded.userId}`;
          }
        } catch (error) {
          // ignore token errors here; auth middleware will handle them when needed
        }
      }
    }

    const { success, limit, remaining, reset } = await ratelimit.limit(identifier);

    res.set({
      'X-RateLimit-Limit': String(limit ?? ''),
      'X-RateLimit-Remaining': String(remaining ?? ''),
      'X-RateLimit-Reset': reset ? new Date(reset).toISOString() : '',
    });

    if (!success) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests, please try again later.',
        retryAfter: reset ? Math.round((reset - Date.now()) / 1000) : undefined,
      });
    }

    next();
  } catch (error) {
    console.log('Rate limiter error:', error);
    next();
  }
};

export default rateLimiter;
