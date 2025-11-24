import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

import 'dotenv/config';

let ratelimit = null;

const hasUpstashConfig = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

if (hasUpstashConfig) {
  try {
    ratelimit = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(60, '60 s'),
    });
  } catch (error) {
    console.warn('Rate limiter initialization failed, continuing without Upstash:', error.message);
  }
} else {
  console.warn('Upstash credentials not found. Rate limiting will fallback to IP-only protection.');
}

export default ratelimit;