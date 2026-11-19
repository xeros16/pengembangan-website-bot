import test from 'node:test';
import assert from 'node:assert/strict';
import { handleMultiplayer, resetMultiplayerState, getMultiplayerStateCounts } from '../games/multiplayer/index.js';

function makeCtx({ sub = [], room = '120@g.us', player = '628111@s.whatsapp.net', group = true, name = 'Pemain' } = {}) {
  const messages = [];
  return { ctx: { args: sub, remoteJid: room, userJid: player, phoneJid: player, sender: player, isGroup: group, pushName: name, PREFIX: '.', reply: async text => messages.push(String(text)) }, messages };
}

test('multiplayer group room supports create, join, start and turn-based word chain', async () => {
  resetMultiplayerState();
  const a = makeCtx({ sub: ['buat', 'sambung'], player: 'a@s.whatsapp.net', name: 'A' });
  await handleMultiplayer(a.ctx);
  const b = makeCtx({ sub: ['gabung'], player: 'b@s.whatsapp.net', name: 'B' });
  await handleMultiplayer(b.ctx);
  const start = makeCtx({ sub: ['mulai'], player: 'a@s.whatsapp.net' });
  await handleMultiplayer(start.ctx);
  assert.match(start.messages[0], /SAMBUNG KATA DIMULAI/);
  assert.equal(getMultiplayerStateCounts().rooms, 1);
});

test('multiplayer quiz room is restricted to joined players and scores correct answers', async () => {
  resetMultiplayerState();
  const a = makeCtx({ sub: ['buat', 'kuis'], player: 'a@s.whatsapp.net' }); await handleMultiplayer(a.ctx);
  const b = makeCtx({ sub: ['gabung'], player: 'b@s.whatsapp.net' }); await handleMultiplayer(b.ctx);
  const start = makeCtx({ sub: ['mulai'], player: 'a@s.whatsapp.net' }); await handleMultiplayer(start.ctx);
  const outsider = makeCtx({ sub: ['jawab', 'jupiter'], player: 'c@s.whatsapp.net' }); await handleMultiplayer(outsider.ctx);
  assert.match(outsider.messages[0], /belum bergabung/i);
});

test('multiplayer group-only rooms cannot be created in private chats', async () => {
  resetMultiplayerState();
  const ctx = makeCtx({ sub: ['buat', 'kuis'], room: '628111@s.whatsapp.net', group: false });
  await handleMultiplayer(ctx.ctx);
  assert.match(ctx.messages[0], /hanya bisa dibuat di dalam grup/i);
  assert.equal(getMultiplayerStateCounts().rooms, 0);
});

test('multiplayer lobby supports leaving and transfers host ownership', async () => {
  resetMultiplayerState();
  const a = makeCtx({ sub: ['buat', 'sambung'], player: 'a@s.whatsapp.net', name: 'A' }); await handleMultiplayer(a.ctx);
  const b = makeCtx({ sub: ['gabung'], player: 'b@s.whatsapp.net', name: 'B' }); await handleMultiplayer(b.ctx);
  const leave = makeCtx({ sub: ['keluar'], player: 'a@s.whatsapp.net' }); await handleMultiplayer(leave.ctx);
  assert.match(leave.messages[0], /Host sekarang: B/);
  const c = makeCtx({ sub: ['gabung'], player: 'c@s.whatsapp.net', name: 'C' }); await handleMultiplayer(c.ctx);
  const start = makeCtx({ sub: ['mulai'], player: 'b@s.whatsapp.net' }); await handleMultiplayer(start.ctx);
  assert.match(start.messages[0], /SAMBUNG KATA DIMULAI/);
});

test('multiplayer leaderboard shows players sorted by score', async () => {
  resetMultiplayerState();
  const a = makeCtx({ sub: ['buat', 'kuis'], player: 'a@s.whatsapp.net', name: 'A' }); await handleMultiplayer(a.ctx);
  const b = makeCtx({ sub: ['gabung'], player: 'b@s.whatsapp.net', name: 'B' }); await handleMultiplayer(b.ctx);
  const board = makeCtx({ sub: ['papan'], player: 'a@s.whatsapp.net' }); await handleMultiplayer(board.ctx);
  assert.match(board.messages[0], /PAPAN SKOR MULTIPLAYER/);
  assert.match(board.messages[0], /A — 0 poin/);
});

test('multiplayer rejects unknown quiz categories', async () => {
  resetMultiplayerState();
  const ctx = makeCtx({ sub: ['buat', 'kuis', 'astronomi'] });
  await handleMultiplayer(ctx.ctx);
  assert.match(ctx.messages[0], /Kategori kuis/);
  assert.equal(getMultiplayerStateCounts().rooms, 0);
});


test('multiplayer help and flow use the configured command prefix', async () => {
  resetMultiplayerState();
  const help = makeCtx({ sub: ['menu'] });
  help.ctx.PREFIX = '!';
  await handleMultiplayer(help.ctx);
  assert.match(help.messages[0], /!multi buat sambung/);
  assert.doesNotMatch(help.messages[0], /\\.multi buat sambung/);

  const a = makeCtx({ sub: ['buat', 'sambung'], player: 'host@s.whatsapp.net', name: 'Host' });
  a.ctx.PREFIX = '!';
  await handleMultiplayer(a.ctx);
  assert.match(a.messages[0], /!multi gabung/);
  assert.match(a.messages[0], /!multi mulai/);
});

test('multiplayer start instructions use the configured prefix', async () => {
  resetMultiplayerState();
  const a = makeCtx({ sub: ['buat', 'sambung'], player: 'a@s.whatsapp.net', name: 'A' }); a.ctx.PREFIX = '!'; await handleMultiplayer(a.ctx);
  const b = makeCtx({ sub: ['gabung'], player: 'b@s.whatsapp.net', name: 'B' }); await handleMultiplayer(b.ctx);
  const start = makeCtx({ sub: ['mulai'], player: 'a@s.whatsapp.net' }); start.ctx.PREFIX = '!'; await handleMultiplayer(start.ctx);
  assert.match(start.messages[0], /!multi jawab <kata>/);
  resetMultiplayerState();
});
