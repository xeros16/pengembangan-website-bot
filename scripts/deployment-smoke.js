import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { effectiveEnvironments } from './integration-doctor.js';

export function validateHealthResult(statusCode, payload, service) {
  const serviceReady = service === 'bot'
    ? payload?.ready === true
    : payload?.ok === true;
  return {
    ok: Number(statusCode) >= 200 && Number(statusCode) < 300 && serviceReady,
    statusCode: Number(statusCode) || 0,
    service,
    ready: serviceReady,
    detail: service === 'bot'
      ? `WhatsApp=${payload?.whatsapp || 'unknown'}; database=${payload?.database || 'unknown'}`
      : `database=${payload?.database || 'unknown'}`,
  };
}

export async function checkHealthEndpoint(rawUrl, service, fetchImpl = globalThis.fetch) {
  let url;
  try { url = new URL(rawUrl); }
  catch { return { ok: false, service, detail: 'URL endpoint tidak valid.' }; }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    return { ok: false, service, detail: 'Gunakan URL HTTP(S) tanpa kredensial.' };
  }
  try {
    const response = await fetchImpl(url, {
      method: 'GET',
      headers: { accept: 'application/json' },
      redirect: 'manual',
      signal: AbortSignal.timeout(5000),
    });
    const payload = await response.json().catch(() => null);
    return validateHealthResult(response.status, payload, service);
  } catch (error) {
    return { ok: false, service, detail: error?.name === 'TimeoutError' ? 'Endpoint timeout setelah 5 detik.' : 'Endpoint tidak dapat dijangkau.' };
  }
}

export function resolveHealthUrls(projectRoot, runtimeEnv = process.env) {
  const { botEnv, websiteEnv } = effectiveEnvironments(projectRoot, runtimeEnv);
  const botUrl = botEnv.BOT_READY_URL || `http://${botEnv.BOT_HEALTH_HOST || '127.0.0.1'}:${botEnv.BOT_HEALTH_PORT || 3091}/ready`;
  const websiteUrl = websiteEnv.WEBSITE_HEALTH_URL || `http://${websiteEnv.PORTFOLIO_WEB_HOST || '127.0.0.1'}:${websiteEnv.PORTFOLIO_WEB_PORT || websiteEnv.PORT || 3080}/health`;
  return { botUrl, websiteUrl };
}

async function main() {
  const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const { botUrl, websiteUrl } = resolveHealthUrls(projectRoot);
  const results = await Promise.all([
    checkHealthEndpoint(botUrl, 'bot'),
    checkHealthEndpoint(websiteUrl, 'website'),
  ]);
  for (const result of results) {
    console.log(`[${result.ok ? 'OK' : 'FAIL'}] ${result.service}: ${result.detail || 'ready'}`);
  }
  const passed = results.filter(result => result.ok).length;
  console.log(`Deployment smoke: ${passed}/${results.length} services ready.`);
  if (passed !== results.length) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    console.error('[DEPLOYMENT SMOKE]', error.message);
    process.exitCode = 1;
  });
}
