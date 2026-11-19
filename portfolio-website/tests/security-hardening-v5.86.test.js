import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  createRateLimiter,
  getClientAddress,
  readCookie,
  safeTokenEqual,
  securityHeaders,
} from '../security.js';

const source = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
const securitySource = fs.readFileSync(new URL('../security.js', import.meta.url), 'utf8');

function request(ip = '192.0.2.10', headers = {}) {
  return { socket: { remoteAddress: ip }, headers };
}

test('proxy trust and rate-limit salt are read after the project .env files are loaded', () => {
  const envLoad = source.indexOf("dotenv.config({ path: path.join(APP_ROOT, '.env') })");
  const limiterInit = source.indexOf('const securityRateLimiter = createRateLimiter(');
  assert.ok(envLoad >= 0 && limiterInit > envLoad);
});

test('rate limiter counts requests per socket address and resets after the fixed window', () => {
  let now = 10000;
  const limiter = createRateLimiter({ now: () => now, secret: 'test-secret' });
  const req = request();

  assert.equal(limiter.consume(req, { scope: 'login', limit: 2, windowMs: 5000 }).allowed, true);
  assert.equal(limiter.consume(req, { scope: 'login', limit: 2, windowMs: 5000 }).allowed, true);
  const blocked = limiter.consume(req, { scope: 'login', limit: 2, windowMs: 5000 });
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.retryAfterMs, 5000);
  assert.equal(blocked.retryAfterSeconds, 5);

  now += 5001;
  assert.equal(limiter.consume(req, { scope: 'login', limit: 2, windowMs: 5000 }).allowed, true);
});

test('rate limiter isolates different IP addresses, scopes and account identities', () => {
  const limiter = createRateLimiter({ secret: 'test-secret' });
  assert.equal(limiter.consume(request('192.0.2.10'), { scope: 'login', identity: 'a@example.test', limit: 1 }).allowed, true);
  assert.equal(limiter.consume(request('192.0.2.10'), { scope: 'login', identity: 'a@example.test', limit: 1 }).allowed, false);
  assert.equal(limiter.consume(request('192.0.2.11'), { scope: 'login', identity: 'a@example.test', limit: 1 }).allowed, true);
  assert.equal(limiter.consume(request('192.0.2.10'), { scope: 'register', identity: 'a@example.test', limit: 1 }).allowed, true);
  assert.equal(limiter.consume(request('192.0.2.10'), { scope: 'login', identity: 'b@example.test', limit: 1 }).allowed, true);
});

test('rate limiter stores bounded opaque keys and does not retain raw email or IP strings', () => {
  const limiter = createRateLimiter({ maxEntries: 100, secret: 'test-secret' });
  for (let i = 0; i < 180; i++) {
    limiter.consume(request(`192.0.2.${i % 250}`), { scope: 'login', identity: `person-${i}@example.test`, limit: 3 });
  }
  assert.ok(limiter.size <= 100);
  assert.equal(typeof limiter.clear, 'function');
  limiter.clear();
  assert.equal(limiter.size, 0);
});

test('Cloudflare client IP is ignored unless explicit trusted-proxy mode is enabled', () => {
  const req = request('192.0.2.10', { 'cf-connecting-ip': '198.51.100.25', 'x-forwarded-for': '203.0.113.8' });
  assert.equal(getClientAddress(req), '192.0.2.10');
  assert.equal(getClientAddress(req, { trustCloudflare: true }), '198.51.100.25');
  assert.equal(getClientAddress(request('192.0.2.10', { 'cf-connecting-ip': 'not-an-ip' }), { trustCloudflare: true }), '192.0.2.10');
  assert.doesNotMatch(securitySource, /x-forwarded-for/);
});

test('cookie parsing rejects malformed encoding and ambiguous duplicate cookie names', () => {
  assert.equal(readCookie('theme=dark; pir_session=abc123', 'pir_session'), 'abc123');
  assert.equal(readCookie('pir_session=a%2Fb', 'pir_session'), 'a/b');
  assert.equal(readCookie('pir_session=%E0%A4%A', 'pir_session'), '');
  assert.equal(readCookie('pir_session=first; pir_session=second', 'pir_session'), '');
  assert.equal(readCookie('other=value', 'pir_session'), '');
});

test('CSRF token comparison is constant-time and rejects empty tokens', () => {
  assert.equal(safeTokenEqual('csrf-token', 'csrf-token'), true);
  assert.equal(safeTokenEqual('csrf-token', 'other-token'), false);
  assert.equal(safeTokenEqual('', ''), false);
  assert.equal(safeTokenEqual(null, 'csrf-token'), false);
});

test('security headers include browser hardening and only enable HSTS for production HTTPS', () => {
  const local = securityHeaders();
  assert.equal(local['x-content-type-options'], 'nosniff');
  assert.equal(local['x-frame-options'], 'DENY');
  assert.equal(local['x-dns-prefetch-control'], 'off');
  assert.equal(local['x-permitted-cross-domain-policies'], 'none');
  assert.equal(local['origin-agent-cluster'], '?1');
  assert.equal(local['strict-transport-security'], undefined);
  assert.equal(securityHeaders({ productionHttps: true })['strict-transport-security'], 'max-age=31536000; includeSubDomains');
});

test('authentication and password recovery endpoints are protected by bounded per-IP and per-identity limits', () => {
  for (const marker of [
    "scope: 'studio-login-ip'",
    "scope: 'studio-login-email'",
    "scope: 'studio-forgot-ip'",
    "scope: 'studio-forgot-email'",
    "scope: 'studio-reset-ip'",
    "scope: 'studio-reset-email'",
    "scope: 'studio-register-ip'",
    "scope: 'studio-register-identity'",
    "scope: 'studio-resend-ip'",
    "scope: 'studio-resend-email'",
    "scope: 'studio-setup-ip'",
    "scope: 'studio-setup-designer'",
    "scope: 'studio-verify-ip'",
    "scope: 'studio-verify-confirm-ip'",
    "scope: 'studio-password-ip'",
    "scope: 'studio-password-designer'",
    "scope: 'owner-basic-ip'",
    "scope: 'owner-basic-user'",
  ]) assert.ok(source.includes(marker), `missing rate-limit scope ${marker}`);
});

test('CSRF uses constant-time token comparison for both designer and client workspaces', () => {
  assert.ok(source.includes("safeTokenEqual(form.get('csrf'), session.csrf)"));
  assert.equal((source.match(/safeTokenEqual\(form\.get\('csrf'\), session\.csrf\)/g) || []).length, 2);
});

test('password reset and email verification consume one-time tokens with compare-and-set updates', () => {
  assert.ok(source.includes('const resetResult = await DesignerDashboardAuth.updateOne('));
  assert.ok(source.includes('const verifyResult = await DesignerDashboardAuth.updateOne('));
  assert.ok(source.includes('if (!resetResult.matchedCount)'));
  assert.ok(source.includes('if (!verifyResult.matchedCount)'));
  assert.ok(source.includes("passwordResetExpiresAt: { $gt: new Date() }"));
  assert.ok(source.includes("emailVerifyExpiresAt: { $gt: new Date() }"));
});


test('email verification GET is safe for link scanners and only POST consumes the one-time token', () => {
  const getStart = source.indexOf("parts[0] === 'studio' && parts[1] === 'verify' && req.method === 'GET'");
  const postStart = source.indexOf("parts[0] === 'studio' && parts[1] === 'verify' && req.method === 'POST'");
  const loginStart = source.indexOf("parts[0] === 'studio' && parts[1] === 'login' && req.method === 'POST'");
  assert.ok(getStart >= 0 && postStart > getStart && loginStart > postStart);
  const getRoute = source.slice(getStart, postStart);
  const postRoute = source.slice(postStart, loginStart);
  assert.ok(getRoute.includes('Konfirmasi alamat email'));
  assert.ok(getRoute.includes('method="post" action="/studio/verify"'));
  assert.ok(!getRoute.includes('DesignerDashboardAuth.updateOne'));
  assert.ok(postRoute.includes('const verifyResult = await DesignerDashboardAuth.updateOne('));
  assert.ok(postRoute.includes('if (!verifyResult.matchedCount)'));
});

test('designer activation consumes its WhatsApp setup token with an expiry-aware compare-and-set', () => {
  const setupStart = source.indexOf("parts[0] === 'studio' && parts[1] === 'setup' && req.method === 'POST'");
  const verifyStart = source.indexOf("parts[0] === 'studio' && parts[1] === 'verify' && req.method === 'GET'");
  assert.ok(setupStart >= 0 && verifyStart > setupStart);
  const route = source.slice(setupStart, verifyStart);
  assert.ok(route.includes('const setupResult = await DesignerDashboardAuth.updateOne(') || route.includes('setupResult = await DesignerDashboardAuth.updateOne('));
  assert.ok(route.includes('setupTokenExpiresAt: { $gt: new Date() }'));
  assert.ok(route.includes('if (!setupResult?.matchedCount)'));
  assert.ok(route.includes("if (error?.code === 11000)"));
  assert.ok(route.includes("setupTokenHash: ''"));
});

test('Designer Studio login consumes WhatsApp OTP atomically and cannot create two sessions from one code', () => {
  const loginStart = source.indexOf("parts[0] === 'studio' && parts[1] === 'login' && req.method === 'POST'");
  const passwordStart = source.indexOf("parts[0] === 'studio' && parts[1] === 'password' && req.method === 'POST'");
  assert.ok(loginStart >= 0 && passwordStart > loginStart);
  const route = source.slice(loginStart, passwordStart);
  assert.ok(route.includes('const otpConsumeResult = await DesignerDashboardAuth.updateOne('));
  assert.ok(route.includes('passwordHash: account.passwordHash'));
  assert.ok(route.includes('otpHash: account.otpHash'));
  assert.ok(route.includes('otpExpiresAt: { $gt: new Date() }'));
  assert.ok(route.includes('if (!otpConsumeResult.matchedCount)'));
  assert.ok(route.includes('Minta kode baru melalui WhatsApp.'));
  assert.ok(!route.includes("await DesignerDashboardAuth.updateOne({ designerId }, { $set: { otpHash: '', otpExpiresAt: null, otpAttempts: 0 } })"));
});

test('password changes are throttled and use a compare-and-set against the current password hash', () => {
  const passwordStart = source.indexOf("parts[0] === 'studio' && parts[1] === 'password' && req.method === 'POST'");
  const availabilityStart = source.indexOf("parts[0] === 'studio' && parts[1] === 'availability' && req.method === 'POST'");
  assert.ok(passwordStart >= 0 && availabilityStart > passwordStart);
  const route = source.slice(passwordStart, availabilityStart);
  assert.ok(route.includes("scope: 'studio-password-ip'"));
  assert.ok(route.includes("scope: 'studio-password-designer'"));
  assert.ok(route.includes('const passwordChangeResult = await DesignerDashboardAuth.updateOne('));
  assert.ok(route.includes('passwordHash: account.passwordHash'));
  assert.ok(route.includes('if (!passwordChangeResult.matchedCount)'));
  assert.ok(route.includes('await DesignerDashboardSession.deleteMany({ designerId: session.designerId })'));
});

test('invalid password-reset links also receive no-store and no-referrer policies', () => {
  const resetGetStart = source.indexOf("parts[0] === 'studio' && parts[1] === 'reset' && req.method === 'GET'");
  const resetPostStart = source.indexOf("parts[0] === 'studio' && parts[1] === 'reset' && req.method === 'POST'");
  assert.ok(resetGetStart >= 0 && resetPostStart > resetGetStart);
  const route = source.slice(resetGetStart, resetPostStart);
  assert.ok(route.includes("'cache-control': 'no-store'"));
  assert.ok(route.includes("'referrer-policy': 'no-referrer'"));
});

test('password setup, reset and change invalidate previously issued WhatsApp OTPs', () => {
  const setupStart = source.indexOf("parts[0] === 'studio' && parts[1] === 'setup' && req.method === 'POST'");
  const verifyStart = source.indexOf("parts[0] === 'studio' && parts[1] === 'verify' && req.method === 'GET'");
  const passwordStart = source.indexOf("parts[0] === 'studio' && parts[1] === 'password' && req.method === 'POST'");
  const availabilityStart = source.indexOf("parts[0] === 'studio' && parts[1] === 'availability' && req.method === 'POST'");
  const resetStart = source.indexOf("parts[0] === 'studio' && parts[1] === 'reset' && req.method === 'POST'");
  assert.ok(source.slice(setupStart, verifyStart).includes("otpHash: ''"));
  assert.ok(source.slice(passwordStart, availabilityStart).includes("otpHash: ''"));
  assert.ok(source.slice(resetStart, source.indexOf("parts[0] === 'studio' && parts[1] === 'register'", resetStart)).includes("otpHash: ''"));
});

test('sensitive token pages avoid referrer leakage and are not cacheable', () => {
  assert.ok(source.includes("'referrer-policy': 'no-referrer'"));
  assert.ok(source.includes("object-src 'none'; frame-ancestors 'none'"));
  assert.ok(source.includes("cache-control': 'no-store'"));
});

test('oversized form bodies return 413 and server parser limits are bounded', () => {
  assert.ok(source.includes('error.statusCode = 413'));
  assert.ok(source.includes('const status = Number(error?.statusCode) === 413 ? 413 : 500'));
  assert.ok(source.includes('http.createServer({ maxHeaderSize: 16 * 1024 }'));
  assert.ok(source.includes('server.headersTimeout = 15000'));
  assert.ok(source.includes('server.maxHeadersCount = 100'));
  assert.ok(source.includes('server.maxRequestsPerSocket = 1000'));
});

test('release metadata, service worker cache and static asset versions advance together', () => {
  const rootPackage = JSON.parse(fs.readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));
  const websitePackage = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  const rootLock = JSON.parse(fs.readFileSync(new URL('../../package-lock.json', import.meta.url), 'utf8'));
  const websiteLock = JSON.parse(fs.readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8'));
  assert.equal(rootPackage.version, '6.7.2');
  assert.equal(rootLock.version, '6.7.2');
  assert.equal(websitePackage.version, '3.50.0');
  assert.equal(websiteLock.version, '3.50.0');
  assert.ok(source.includes("version: '6.7.2'"));
  assert.ok(source.includes("const CACHE='pir-visuals-public-v46'"));
  for (const asset of ['/icon.svg?v=6710', '/public-ui.js?v=6710', '/pwa-register.js?v=6710', '/vendor/gsap.min.js?v=6710', '/vendor/ScrollTrigger.min.js?v=6710']) {
    assert.ok(source.includes(asset), `missing cache-busted asset ${asset}`);
  }
});

test('root syntax checks include the website source without traversing dependency folders', () => {
  const checkScript = fs.readFileSync(new URL('../../scripts/check-js.js', import.meta.url), 'utf8');
  const rootPackage = JSON.parse(fs.readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));
  assert.ok(checkScript.includes("'portfolio-website'"));
  assert.ok(checkScript.includes("['node_modules','.git']"));
  assert.ok(rootPackage.scripts['website:check'].includes('portfolio-website/security.js'));
});

test('database models, project lifecycle and existing motion system are not migrated or removed', () => {
  assert.ok(source.includes('GSAP'));
  assert.ok(source.includes('.pv-magnetic'));
  assert.ok(source.includes('CLIENT_PROJECT_STATUS_TRANSITIONS'));
  assert.ok(source.includes('ClientProjectSession'));
  const models = fs.readFileSync(new URL('../models.js', import.meta.url), 'utf8');
  assert.ok(models.includes("collection: 'designerdashboardsessions'"));
  assert.ok(models.includes("collection: 'clientprojectsessions'"));
});
