import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveMongoUri, safeDatabaseLabel, verifySharedDatabase } from '../scripts/verify-shared-db.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function createLogger() {
  const rows = [];
  return {
    rows,
    log: value => rows.push(String(value)),
    error: value => rows.push(String(value)),
  };
}

test('database verifier reports missing MONGO_URI before loading mongoose', async () => {
  const log = createLogger();
  let imported = false;
  const exitCode = await verifySharedDatabase({
    mongoUri: '',
    loadMongoose: async () => { imported = true; throw new Error('must not load'); },
    log,
  });
  assert.equal(exitCode, 1);
  assert.equal(imported, false);
  assert.match(log.rows.join('\n'), /MONGO_URI belum diatur/);
});

test('database verifier reports missing mongoose as an actionable dependency error', async () => {
  const log = createLogger();
  const exitCode = await verifySharedDatabase({
    mongoUri: 'mongodb://127.0.0.1:27017/pir_visuals_staging',
    loadMongoose: async () => { throw new Error('ERR_MODULE_NOT_FOUND'); },
    log,
  });
  assert.equal(exitCode, 1);
  assert.match(log.rows.join('\n'), /Dependency mongoose belum terpasang/);
  assert.doesNotMatch(log.rows.join('\n'), /ERR_MODULE_NOT_FOUND/);
});

test('database URI resolver prioritizes process environment and reads root env safely', () => {
  assert.equal(resolveMongoUri({ MONGO_URI: 'mongodb://process/db' }, '/nonexistent'), 'mongodb://process/db');
  assert.equal(resolveMongoUri({}, '/nonexistent'), '');
});

test('database label never includes MongoDB credentials', () => {
  assert.equal(
    safeDatabaseLabel('mongodb://admin:secret@db.example:27017/pir_visuals_staging'),
    'db.example:27017/pir_visuals_staging',
  );
  assert.doesNotMatch(safeDatabaseLabel('mongodb://admin:secret@db.example:27017/pir_visuals_staging'), /admin|secret/);
});


test('database verifier requires TTL and compound indexes for persisted brief sessions', () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const source = fs.readFileSync(path.join(root, 'scripts/verify-shared-db.js'), 'utf8');
  assert.match(source, /designbriefsessions: \['chatJid_1_userJid_1', 'expiresAt_1'\]/);
  assert.match(source, /'designbriefsessions'/);
});


test('database verifier requires group-scoped Design Battle indexes', () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const source = fs.readFileSync(path.join(root, 'scripts/verify-shared-db.js'), 'utf8');
  assert.match(source, /designbattles: \['code_1', 'groupJid_1_open_unique', 'groupJid_1_status_1_endsAt_1'\]/);
  assert.match(source, /'designbattles'/);
});


test('database verifier requires group-scoped Learning Cohort and unique check-in indexes', () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const source = fs.readFileSync(path.join(root, 'scripts/verify-shared-db.js'), 'utf8');
  assert.match(source, /learningcohorts: \['code_1', 'groupJid_1_code_1', 'groupJid_1_status_1_createdAt_-1'\]/);
  assert.match(source, /learningcohortcheckins: \['code_1', 'groupJid_1_cohortCode_1_milestoneCode_1_userJid_1', 'groupJid_1_cohortCode_1_status_1_updatedAt_-1'\]/);
  assert.match(source, /'learningcohorts'/);
  assert.match(source, /'learningcohortcheckins'/);
});


test('database verifier requires group-scoped Design Season and Creative Asset indexes', () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const source = fs.readFileSync(path.join(root, 'scripts/verify-shared-db.js'), 'utf8');
  assert.match(source, /designseasons: \['code_1', 'groupJid_1_active_unique', 'groupJid_1_status_1_createdAt_-1'\]/);
  assert.match(source, /designseasonsubmissions: \['code_1', 'groupJid_1_seasonCode_1_roundCode_1_userJid_1', 'groupJid_1_seasonCode_1_roundCode_1_status_1_updatedAt_-1'\]/);
  assert.match(source, /creativeassets: \['groupJid_1_code_1', 'groupJid_1_visibility_1_status_1_category_1_updatedAt_-1', 'groupJid_1_ownerJid_1_status_1_updatedAt_-1'\]/);
});
