import process from 'node:process';

const base = String(process.env.PORTFOLIO_SMOKE_BASE_URL || 'http://127.0.0.1:3080').replace(/\/$/, '');
const checks = [];
async function check(name, path, validate) {
  try {
    const response = await fetch(`${base}${path}`, { redirect: 'manual', signal: AbortSignal.timeout(10000) });
    const body = await response.text();
    const result = validate(response, body);
    checks.push({ name, ok: Boolean(result), detail: result ? `HTTP ${response.status}` : `HTTP ${response.status}; response did not match expectation` });
  } catch (error) {
    checks.push({ name, ok: false, detail: error.message });
  }
}
await check('Health / MongoDB readiness', '/health', (res, body) => res.status === 200 && JSON.parse(body).ok === true && JSON.parse(body).database === 'connected');
await check('Public homepage', '/', (res, body) => res.status === 200 && body.includes('INDEPENDENT CREATIVE TALENT PLATFORM') && body.includes('Temukan desainer'));
await check('Robots and sitemap reference', '/robots.txt', (res, body) => res.status === 200 && body.includes('/sitemap.xml'));
await check('Sitemap XML', '/sitemap.xml', (res, body) => res.status === 200 && body.includes('<urlset') && body.includes('</urlset>'));
await check('PWA manifest', '/manifest.webmanifest', (res, body) => res.status === 200 && JSON.parse(body).name === 'PIR Visuals');
await check('Service worker', '/sw.js', (res, body) => res.status === 200 && body.includes("addEventListener('fetch'"));
await check('GSAP animation runtime', '/vendor/gsap.min.js', (res, body) => res.status === 200 && body.length > 1000);
await check('GSAP ScrollTrigger runtime', '/vendor/ScrollTrigger.min.js', (res, body) => res.status === 200 && body.length > 1000);
await check('Designer login page', '/studio', (res, body) => res.status === 200 && body.includes('Designer Studio'));

const failed = checks.filter(item => !item.ok);
console.log(`PIR VISUALS WEBSITE SMOKE TEST — ${base}`);
for (const item of checks) console.log(`[${item.ok ? 'PASS' : 'FAIL'}] ${item.name}: ${item.detail}`);
console.log(`Result: ${checks.length - failed.length}/${checks.length} passed`);
if (failed.length) process.exitCode = 1;

if (String(process.env.PIR_CHECK_BOT_HEALTH || '').toLowerCase() === 'true') {
  const botHealth = String(process.env.BOT_HEALTH_URL || 'http://127.0.0.1:3091/health').replace(/\/$/, '');
  try {
    const response = await fetch(botHealth, { signal: AbortSignal.timeout(10000) });
    const data = await response.json();
    const ok = response.status === 200 && data.ok === true && data.database === 'connected' && data.whatsapp === 'open';
    checks.push({ name: 'WhatsApp bot + MongoDB readiness', ok, detail: ok ? 'HTTP 200; WhatsApp online and MongoDB connected' : `HTTP ${response.status}; database=${data.database}; whatsapp=${data.whatsapp}` });
  } catch (error) {
    checks.push({ name: 'WhatsApp bot + MongoDB readiness', ok: false, detail: error.message });
  }
  const failed = checks.filter(item => !item.ok);
  console.log('[INTEGRATION] Bot health check enabled.');
  console.log(`Updated result: ${checks.length - failed.length}/${checks.length} passed`);
  if (failed.length) process.exitCode = 1;
}
