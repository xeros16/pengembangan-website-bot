import test from 'node:test';
import assert from 'node:assert/strict';
import { checkHealthEndpoint, resolveHealthUrls, validateHealthResult } from '../scripts/deployment-smoke.js';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('bot readiness requires both HTTP success and ready=true', () => {
  assert.equal(validateHealthResult(200, { ready: true, whatsapp: 'open', database: 'connected' }, 'bot').ok, true);
  assert.equal(validateHealthResult(503, { ready: false }, 'bot').ok, false);
  assert.equal(validateHealthResult(200, { ready: false }, 'bot').ok, false);
});

test('website health requires database readiness', () => {
  assert.equal(validateHealthResult(200, { ok: true, database: 'connected' }, 'website').ok, true);
  assert.equal(validateHealthResult(503, { ok: false, database: 'disconnected' }, 'website').ok, false);
});

test('health checker rejects credential-bearing URLs and validates a live mock response', async () => {
  const invalid = await checkHealthEndpoint('http://user:pass@127.0.0.1:3010/health', 'website');
  assert.equal(invalid.ok, false);
  const result = await checkHealthEndpoint('http://127.0.0.1:3010/health', 'website', async () => ({
    status: 200,
    json: async () => ({ ok: true, database: 'connected' }),
  }));
  assert.equal(result.ok, true);
});


test('deployment smoke reads the local .env ports and process overrides', () => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'pir-smoke-env-'));
  try {
    fs.writeFileSync(path.join(fixture, '.env'), [
      'BOT_HEALTH_HOST=127.0.0.1',
      'BOT_HEALTH_PORT=3091',
      'PORTFOLIO_WEB_HOST=127.0.0.1',
      'PORTFOLIO_WEB_PORT=3010',
    ].join('\n'));
    const local = resolveHealthUrls(fixture, {});
    assert.equal(local.botUrl, 'http://127.0.0.1:3091/ready');
    assert.equal(local.websiteUrl, 'http://127.0.0.1:3010/health');
    const overridden = resolveHealthUrls(fixture, {
      BOT_HEALTH_PORT: '3191',
      PORTFOLIO_WEB_PORT: '3110',
    });
    assert.equal(overridden.botUrl, 'http://127.0.0.1:3191/ready');
    assert.equal(overridden.websiteUrl, 'http://127.0.0.1:3110/health');
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
});
