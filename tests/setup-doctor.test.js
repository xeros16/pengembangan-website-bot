import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluateSetup, formatReport } from '../scripts/setup-doctor.js';

async function withRoot(run) {
  const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pir-doctor-'));
  try { await run(rootDir); } finally { await fs.rm(rootDir, { recursive: true, force: true }); }
}

test('doctor reports missing setup without exposing environment values', async () => withRoot(async rootDir => {
  await fs.writeFile(path.join(rootDir, 'package.json'), JSON.stringify({ dependencies: {} }));
  const report = evaluateSetup({ rootDir, env: { OWNER_JIDS: '', MONGO_URI: 'mongodb://user:secret@host/db' }, nodeVersion: '20.1.0', commandAvailable: () => false });
  const output = formatReport(report);
  assert.match(output, /Konfigurasi \.env/);
  assert.match(output, /Owner bot/);
  assert.doesNotMatch(output, /secret|user:secret/);
  assert.equal(report.hasWarnings, true);
}));

test('doctor recognizes configured owner and protected ignore patterns', async () => withRoot(async rootDir => {
  await fs.writeFile(path.join(rootDir, '.env'), 'OWNER_JIDS=628123456789@s.whatsapp.net\nMONGO_URI=mongodb://127.0.0.1:27017/test\n');
  await fs.writeFile(path.join(rootDir, '.gitignore'), '.env\nauth_info_baileys/\nbackups/\ntemp/\n');
  await fs.writeFile(path.join(rootDir, 'package.json'), JSON.stringify({ dependencies: {} }));
  const report = evaluateSetup({ rootDir, env: {}, nodeVersion: '20.1.0', commandAvailable: () => true });
  assert.equal(report.checks.find(item => item.title === 'Owner bot').level, 'ok');
  assert.equal(report.checks.find(item => item.title === 'Perlindungan file lokal').level, 'ok');
  assert.doesNotMatch(formatReport(report), /628123456789/);
}));

test('configured prefix is documented and used by the app', async () => {
  const root = fileURLToPath(new URL('..', import.meta.url));
  const [index, example] = await Promise.all([
    fs.readFile(path.join(root, 'index.js'), 'utf8'),
    fs.readFile(path.join(root, '.env.example'), 'utf8')
  ]);
  assert.match(index, /const PREFIX = process\.env\.PREFIX \|\| '\.'/);
  assert.match(example, /^PREFIX=\./m);
});


test('env example documents required configuration without real secrets', async () => {
  const projectRoot = fileURLToPath(new URL('..', import.meta.url));
  const text = await fs.readFile(path.join(projectRoot, '.env.example'), 'utf8');
  assert.match(text, /^PREFIX=\./m);
  assert.match(text, /^MONGO_URI=mongodb:\/\/127\.0\.0\.1/m);
  assert.match(text, /^OWNER_JIDS=$/m);
  assert.doesNotMatch(text, /(?:mongodb\+srv:\/\/[^\s]+:[^\s]+@|628\d{8,}@s\.whatsapp\.net)/);
});
