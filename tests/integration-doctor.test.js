import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import { databaseName, databaseTarget, effectiveEnvironments, diagnose, formatReport, parseEnvFile, resolveUploadPath } from '../scripts/integration-doctor.js';

test('databaseName extracts database path without exposing URI credentials', () => {
  assert.equal(databaseName('mongodb://user:pass@127.0.0.1:27017/pir_visuals?authSource=admin'), 'pir_visuals');
  assert.equal(databaseName('invalid'), '');
});

test('parseEnvFile supports quoted values and ignores comments', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pir-env-'));
  try {
    const file = path.join(dir, '.env');
    fs.writeFileSync(file, '# comment\nMONGO_URI=mongodb://127.0.0.1/pir_visuals\nPORTFOLIO_PUBLIC_BASE_URL="https://example.test/path"\nEMPTY=\n');
    const env = parseEnvFile(file);
    assert.equal(env.MONGO_URI, 'mongodb://127.0.0.1/pir_visuals');
    assert.equal(env.PORTFOLIO_PUBLIC_BASE_URL, 'https://example.test/path');
    assert.equal(env.EMPTY, '');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('shared upload path resolver detects bot and website path mismatch', () => {
  const root = path.resolve(os.tmpdir(), 'pir-project');
  const match = resolveUploadPath(root, { PORTFOLIO_UPLOAD_DIR: 'uploads/portfolio' }, { BOT_DATA_ROOT: '..', PORTFOLIO_UPLOAD_DIR: 'uploads/portfolio' });
  assert.equal(match.same, true);
  const mismatch = resolveUploadPath(root, { PORTFOLIO_UPLOAD_DIR: 'uploads/portfolio' }, { BOT_DATA_ROOT: '..', PORTFOLIO_UPLOAD_DIR: 'other/media' });
  assert.equal(mismatch.same, false);
});


test('databaseTarget compares host and database while omitting credentials', () => {
  assert.equal(databaseTarget('mongodb://alice:secret@db-a.example:27017/pir_visuals?authSource=admin'), 'db-a.example:27017/pir_visuals');
  assert.notEqual(
    databaseTarget('mongodb://alice:secret@db-a.example:27017/pir_visuals'),
    databaseTarget('mongodb://bob:secret@db-b.example:27017/pir_visuals'),
  );
  assert.equal(databaseTarget('invalid'), '');
});

test('effective website environment mirrors root-first dotenv loading', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pir-env-precedence-'));
  try {
    fs.mkdirSync(path.join(dir, 'portfolio-website'), { recursive: true });
    fs.writeFileSync(path.join(dir, '.env'), 'MONGO_URI=mongodb://root:secret@db.example/pir_visuals\nPORTFOLIO_UPLOAD_DIR=shared-media\n');
    fs.writeFileSync(path.join(dir, 'portfolio-website', '.env'), 'MONGO_URI=mongodb://web:secret@other.example/pir_visuals\nPORTFOLIO_UPLOAD_DIR=website-media\n');
    const env = effectiveEnvironments(dir, {});
    assert.equal(env.botEnv.MONGO_URI, 'mongodb://root:secret@db.example/pir_visuals');
    assert.equal(env.websiteEnv.MONGO_URI, 'mongodb://root:secret@db.example/pir_visuals');
    assert.equal(env.websiteEnv.PORTFOLIO_UPLOAD_DIR, 'shared-media');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('integration doctor catches a website database host mismatch without printing credentials', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pir-doctor-'));
  try {
    fs.mkdirSync(path.join(dir, 'portfolio-website'), { recursive: true });
    fs.writeFileSync(path.join(dir, '.env'), [
      'MONGO_URI=mongodb://bot-secret:topsecret@db-a.example:27017/pir_visuals',
      'PORTFOLIO_UPLOAD_DIR=shared-media',
      'PORTFOLIO_PUBLIC_BASE_URL=https://pir.example',
      'AUTH_DIR=auth_info_baileys',
    ].join('\n'));
    fs.writeFileSync(path.join(dir, 'portfolio-website', '.env'), [
      'MONGO_URI=mongodb://web-secret:topsecret@db-b.example:27017/pir_visuals',
      'BOT_DATA_ROOT=..',
      'PORTFOLIO_UPLOAD_DIR=shared-media',
    ].join('\n'));
    const checks = diagnose(dir, {});
    assert.ok(checks.some(item => item.name === 'Database bersama' && item.level === 'ok'));
    assert.ok(checks.some(item => item.name === 'Website .env precedence' && item.level === 'warning'));
    const report = formatReport(checks);
    assert.doesNotMatch(report, /topsecret|bot-secret|web-secret/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
