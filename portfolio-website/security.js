import crypto from 'node:crypto';
import { isIP } from 'node:net';

export function getClientAddress(req, { trustCloudflare = false } = {}) {
  if (trustCloudflare) {
    const candidate = String(req?.headers?.['cf-connecting-ip'] || '').trim();
    if (candidate && isIP(candidate)) return candidate;
  }
  return String(req?.socket?.remoteAddress || req?.connection?.remoteAddress || 'unknown').slice(0, 80);
}

export function readCookie(header, name) {
  const cookieName = String(name || '');
  if (!cookieName || !/^[A-Za-z0-9_-]{1,80}$/.test(cookieName)) return '';
  const values = [];
  for (const part of String(header || '').split(';')) {
    const item = part.trim();
    const separator = item.indexOf('=');
    if (separator < 0 || item.slice(0, separator).trim() !== cookieName) continue;
    const raw = item.slice(separator + 1).trim();
    try {
      values.push(decodeURIComponent(raw));
    } catch {
      return '';
    }
  }
  // Ambiguous duplicate cookies are rejected rather than choosing a value that
  // may differ between an upstream proxy and the application.
  if (values.length !== 1) return '';
  return values[0].slice(0, 4096);
}

export function safeTokenEqual(left, right) {
  const a = String(left ?? '');
  const b = String(right ?? '');
  if (!a || !b) return false;
  const leftDigest = crypto.createHash('sha256').update(a).digest();
  const rightDigest = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(leftDigest, rightDigest);
}

export function createRateLimiter({
  maxEntries = 30000,
  now = Date.now,
  secret = process.env.ANALYTICS_SALT || 'pir-visuals-rate-limit',
  trustCloudflare = false,
} = {}) {
  const buckets = new Map();
  const capacity = Math.max(100, Math.min(100000, Number(maxEntries) || 30000));

  function consume(req, { scope, identity = '', limit = 10, windowMs = 15 * 60 * 1000 } = {}) {
    const safeScope = String(scope || 'default').slice(0, 100);
    const safeIdentity = String(identity || '').trim().toLowerCase().slice(0, 256);
    const ip = getClientAddress(req, { trustCloudflare });
    const key = crypto.createHash('sha256')
      .update(`${secret}\0${safeScope}\0${ip}\0${safeIdentity}`)
      .digest('hex');
    const timestamp = Number(now());
    const maximum = Math.max(1, Math.min(100000, Number(limit) || 1));
    const duration = Math.max(1000, Math.min(24 * 60 * 60 * 1000, Number(windowMs) || 1000));
    let bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= timestamp) {
      bucket = { count: 0, resetAt: timestamp + duration };
      buckets.set(key, bucket);
    }

    if (bucket.count >= maximum) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterMs: Math.max(0, bucket.resetAt - timestamp),
        retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - timestamp) / 1000)),
      };
    }

    bucket.count += 1;
    // Keep recently used buckets near the end of insertion order.
    buckets.delete(key);
    buckets.set(key, bucket);

    if (buckets.size > capacity) {
      for (const [existingKey, existing] of buckets) {
        if (existing.resetAt <= timestamp || buckets.size > capacity) buckets.delete(existingKey);
        if (buckets.size <= capacity) break;
      }
    }

    return {
      allowed: true,
      remaining: Math.max(0, maximum - bucket.count),
      retryAfterMs: Math.max(0, bucket.resetAt - timestamp),
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - timestamp) / 1000)),
    };
  }

  return {
    consume,
    clear() { buckets.clear(); },
    get size() { return buckets.size; },
  };
}

export function securityHeaders({ productionHttps = false } = {}) {
  return {
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'DENY',
    'referrer-policy': 'strict-origin-when-cross-origin',
    'permissions-policy': 'camera=(), microphone=(), geolocation=()',
    'cross-origin-opener-policy': 'same-origin',
    'x-dns-prefetch-control': 'off',
    'x-permitted-cross-domain-policies': 'none',
    'x-download-options': 'noopen',
    'origin-agent-cluster': '?1',
    ...(productionHttps ? { 'strict-transport-security': 'max-age=31536000; includeSubDomains' } : {}),
  };
}
