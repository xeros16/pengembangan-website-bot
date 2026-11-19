import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const backup = fs.readFileSync(path.join(root, 'scripts/backup-restore-check.js'), 'utf8');
const docs = fs.readFileSync(path.join(root, 'docs/BACKUP-RESTORE-VERIFICATION-v5.98.0.md'), 'utf8');

test('backup script dumps the configured application database to a private archive', () => {
  assert.match(backup, /mongodump/);
  assert.match(backup, /--archive=\$\{archivePath\}/);
  assert.match(backup, /chmod\(archivePath, 0o600\)/);
  assert.match(backup, /chmod\(outputDir, 0o700\)/);
});

test('restore uses a unique isolated database namespace and never uses --drop', () => {
  assert.match(backup, /pir_restore_check_\$\{Date\.now\(\)\}/);
  assert.match(backup, /--nsFrom=\$\{sourceDbName\}\.\*/);
  assert.match(backup, /--nsTo=\$\{restoreDbName\}\.\*/);
  assert.doesNotMatch(backup, /['"]--drop['"]/);
  assert.match(backup, /restoreDbName === sourceDbName/);
});

test('restore verification compares every application collection document count', () => {
  assert.match(backup, /collectionCounts\(sourceConnection\)/);
  assert.match(backup, /collectionCounts\(restoreConnection\)/);
  assert.match(backup, /if \(!sameJson\(beforeCounts, afterCounts\)\)/);
});

test('portfolio media is copied and checked by SHA-256 before the backup passes', () => {
  assert.match(backup, /PORTFOLIO_UPLOAD_DIR/);
  assert.match(backup, /directoryManifest/);
  assert.match(backup, /copyDirectorySafe/);
  assert.match(backup, /entry\.isSymbolicLink\(\)/);
  assert.match(backup, /sha256/);
  assert.match(backup, /Verifikasi salinan media gagal/);
});

test('backup documentation warns that private data must be encrypted and kept local', () => {
  assert.match(docs, /WhatsApp auth\/session/);
  assert.match(docs, /terenkripsi|encrypted/i);
  assert.match(docs, /tidak.*restore.*database sumber|never restores over the active database/i);
});
