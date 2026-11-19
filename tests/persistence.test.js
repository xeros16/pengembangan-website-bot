import test from 'node:test';
import assert from 'node:assert/strict';
import { createGamePersistence, getGameDateContext } from '../games/pixel-realm/services/persistence.js';

test('game persistence only updates the game field and mirrors saved state', async () => {
  const calls = [];
  const game = { level: 4 };
  const user = {};
  const User = { updateOne: async (...args) => { calls.push(args); return { matchedCount: 1 }; } };
  const saveGame = createGamePersistence({ User, userJid: '123@s.whatsapp.net', getGame: () => game, user });
  await saveGame();
  assert.deepEqual(calls, [[{ jid: '123@s.whatsapp.net' }, { $set: { game } }]]);
  assert.equal(user.game, game);
});

test('game persistence reports a missing player instead of silently succeeding', async () => {
  const saveGame = createGamePersistence({ User: { updateOne: async () => ({ matchedCount: 0 }) }, userJid: 'missing', getGame: () => ({}) });
  await assert.rejects(saveGame(), /Data pemain tidak ditemukan/);
});

test('date context uses WIB date and ISO week key', () => {
  assert.deepEqual(getGameDateContext(new Date('2026-01-01T00:00:00Z')), { today: '2026-01-01', currentWeek: '2026-W01' });
});
