import test from 'node:test';
import assert from 'node:assert/strict';
import { DAILY_MISSIONS, formatDailyMissions, getMissionDate, getMissionProgress, claimDailyMission, handleRewardsCommand, recordMissionProgress } from '../games/rewards/index.js';

test('daily mission date uses UTC calendar date', () => {
  assert.equal(getMissionDate(new Date('2026-10-30T23:59:59.000Z')), '2026-10-30');
});

test('mission progress and formatter show completion and claim state', () => {
  const state = { date: '2026-10-30', progress: { messages: 10, games: 1 }, claimed: ['chat10'] };
  assert.equal(getMissionProgress(state, DAILY_MISSIONS[0]), 10);
  const output = formatDailyMissions(state, '2026-10-30');
  assert.match(output, /Sapa Komunitas/);
  assert.match(output, /Sudah|Diklaim/);
  assert.match(output, /games2/);
});

test('progress tracker resets a new day then increments the requested metric', async () => {
  const calls = [];
  const User = { updateOne: async (...args) => { calls.push(args); return {}; } };
  assert.equal(await recordMissionProgress(User, 'user@s.whatsapp.net', 'games', 1, '2026-10-30'), true);
  assert.equal(calls.length, 2);
  assert.deepEqual(calls[1][1], { $inc: { 'activity.dailyMissions.progress.games': 1 } });
});

test('claim rejects unknown and incomplete missions without paying', async () => {
  let findCalls = 0;
  const query = { select() { return this; }, lean: async () => ({ activity: { dailyMissions: { date: '2026-10-30', progress: { messages: 0 }, claimed: [] } } }) };
  const User = { updateOne: async () => ({}), findOneAndUpdate: () => ({ select() { return this; }, lean: async () => null }), findOne: () => { findCalls++; return query; } };
  const invalid = await claimDailyMission({ User, jid: 'u', missionId: 'missing', date: '2026-10-30' });
  assert.equal(invalid.reason, 'invalid');
  const incomplete = await claimDailyMission({ User, jid: 'u', missionId: 'chat10', date: '2026-10-30' });
  assert.equal(incomplete.reason, 'incomplete');
  assert.equal(findCalls, 1);
});

test('successful claim atomically adds reward and updates level', async () => {
  const calls = [];
  const User = {
    updateOne: async (...args) => { calls.push(['update', ...args]); return {}; },
    findOneAndUpdate: () => ({ select() { return this; }, lean: async () => ({ activity: { xp: 30, coins: 20 } }) }),
  };
  const result = await claimDailyMission({ User, jid: 'u', missionId: 'chat10', date: '2026-10-30' });
  assert.equal(result.ok, true);
  assert.equal(result.coins, 20);
  assert.equal(result.level, 2);
  const payment = calls.find(call => call[0] === 'update' && call[2]?.$set?.['activity.level'] === 2);
  assert.ok(payment);
});

test('mission command requires MongoDB', async () => {
  const messages = [];
  await handleRewardsCommand({ reply: async value => messages.push(value), getDbReady: () => false });
  assert.match(messages[0], /membutuhkan koneksi MongoDB/);
});
