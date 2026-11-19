import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function readEnvExample() {
  const values = {};
  for (const line of fs.readFileSync(path.join(root, '.env.example'), 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (match) values[match[1]] = match[2];
  }
  return values;
}

test('sample environment points to local MongoDB and loopback-only local website', () => {
  const env = readEnvExample();
  assert.equal(env.MONGO_URI, 'mongodb://127.0.0.1:27017/pir_visuals_local');
  assert.equal(env.PORTFOLIO_WEB_HOST, '127.0.0.1');
  assert.equal(env.PORTFOLIO_WEB_PORT, '3010');
  assert.equal(env.PORTFOLIO_PUBLIC_BASE_URL, 'http://127.0.0.1:3010');
  assert.equal(env.SITE_URL, 'http://127.0.0.1:3010');
  assert.equal(env.BOT_HEALTH_HOST, '127.0.0.1');
});

test('local launcher starts bot and website from project root', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const launcher = fs.readFileSync(path.join(root, 'scripts/start-local.js'), 'utf8');
  assert.equal(pkg.scripts['local:start'], 'node scripts/start-local.js');
  assert.match(launcher, /index\.js/);
  assert.match(launcher, /portfolio-website.*server\.js/);
  assert.match(launcher, /Ctrl\+C/);
});
