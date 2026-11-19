import test from 'node:test';
import assert from 'node:assert/strict';
import { formatPlayerProfile, getPlayerAchievements, getPlayerLevel, handlePlayerSystem } from '../games/player-system/index.js';

test('player level follows existing 25 XP threshold', () => {
  assert.equal(getPlayerLevel(0), 1);
  assert.equal(getPlayerLevel(24), 1);
  assert.equal(getPlayerLevel(25), 2);
  assert.equal(getPlayerLevel(100), 5);
});

test('achievements unlock at message milestones', () => {
  assert.deepEqual(getPlayerAchievements(0), []);
  assert.equal(getPlayerAchievements(25).length, 2);
  assert.equal(getPlayerAchievements(1000).length, 5);
});

test('profile formatter displays XP, level and achievements', () => {
  const output = formatPlayerProfile({ activity: { xp: 50, messages: 100 } }, 'Desainer');
  assert.match(output, /Desainer/);
  assert.match(output, /Level: 3/);
  assert.match(output, /XP: 50/);
  assert.match(output, /Pengunjung Tetap/);
});

test('player command requires database and can show global top ten', async () => {
  const messages = [];
  await handlePlayerSystem({ args: [], reply: async text => messages.push(text), getDbReady: () => false });
  assert.match(messages[0], /membutuhkan koneksi MongoDB/);
  const rows = [{ activity: { xp: 75 } }, { activity: { xp: 25 } }];
  const User = { find: () => ({ sort: () => ({ limit: () => ({ select: () => ({ lean: async () => rows }) }) }) }) };
  await handlePlayerSystem({ args: ['top'], User, reply: async text => messages.push(text), getDbReady: () => true });
  assert.match(messages[1], /TOP 10 PEMAIN GLOBAL/);
  assert.match(messages[1], /Level 4 — 75 XP/);
});
