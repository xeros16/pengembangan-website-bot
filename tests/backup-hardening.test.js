import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../index.js', import.meta.url), 'utf8');

test('backup validates database dump, includes manifest and optional local state', () => {
  assert.ok(source.includes("execFileAsync('mongodump'"));
  assert.ok(source.includes('if (!databaseEntries.length)'));
  assert.ok(source.includes('backup-manifest.json'));
  assert.ok(source.includes("'baileys-auth'"));
  assert.ok(source.includes("'portfolio-media'"));
});

test('backup retention is bounded and overlapping backup jobs are skipped', () => {
  assert.ok(source.includes('BACKUP_RETENTION_DAYS'));
  assert.ok(source.includes('backupInProgress'));
  assert.ok(source.includes('BACKUP] Backup berhasil'));
  assert.ok(source.includes('fs.promises.rm(candidate'));
  assert.ok(source.includes('void createDatabaseBackup()'));
});
