import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const models = fs.readFileSync(new URL('../models/index.js', import.meta.url), 'utf8');
const app = fs.readFileSync(new URL('../index.js', import.meta.url), 'utf8');
const setup = fs.readFileSync(new URL('../scripts/ensure-directory-indexes.js', import.meta.url), 'utf8');
const verifier = fs.readFileSync(new URL('../scripts/verify-shared-db.js', import.meta.url), 'utf8');

test('DesignBattle persistence is group-scoped, time-bounded, and status controlled', () => {
  for (const field of ['code:', 'groupJid:', 'createdBy:', 'title:', 'brief:', 'category:', 'startsAt:', 'endsAt:', 'status:', 'closedBy:', 'closedAt:']) {
    assert.ok(models.includes(field), `missing DesignBattle field ${field}`);
  }
  assert.match(models, /enum: \['open', 'closed'\]/);
  assert.match(models, /groupJid_1_open_unique/);
  assert.match(models, /partialFilterExpression: \{ status: 'open' \}/);
  assert.match(models, /DesignBattleSchema\.index\(\{ groupJid: 1, status: 1, endsAt: 1 \}\)/);
  assert.match(models, /enum: \['harian', 'mingguan', 'battle'\]/);
});

test('DesignBattle model is injected into the live WhatsApp command context', () => {
  assert.match(models, /mongoose\.model\('DesignBattle', DesignBattleSchema\)/);
  assert.match(app, /CommunityProfile, CommunityCollaboration, DesignBattle/);
  assert.match(app, /\n  DesignBattle,/);
});

test('DesignBattle unique code and group/time indexes have setup and verifier coverage', () => {
  assert.match(setup, /createIndex\(\{ code: 1 \}, \{ name: 'code_1', unique: true \}\)/);
  assert.match(setup, /groupJid: 1, status: 1, endsAt: 1/);
  assert.match(setup, /groupJid_1_open_unique/);
  assert.match(setup, /partialFilterExpression: \{ status: 'open' \}/);
  assert.match(verifier, /designbattles: \['code_1', 'groupJid_1_open_unique', 'groupJid_1_status_1_endsAt_1'\]/);
});
