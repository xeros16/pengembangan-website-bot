import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('shared database verifier requires the private notification outbox index', () => {
  const source = fs.readFileSync(path.join(root, 'scripts/verify-shared-db.js'), 'utf8');
  assert.match(source, /portfolioitems: \['itemId_1_moderationStatus_1'\]/);
  assert.match(source, /whatsappDeliveryStatus_1_whatsappNextAttemptAt_1_createdAt_1/);
});
