import test from 'node:test';
import assert from 'node:assert/strict';
import {
  handleQuickAccessCommand,
  recordRecentCommand,
  resetQuickAccessForTests,
} from '../features/quick-access.js';

function makeHarness({ jid = 'user-1@s.whatsapp.net', dbReady = true, initial = null } = {}) {
  const messages = [];
  const store = new Map();
  if (initial) store.set(jid, structuredClone(initial));
  const User = {
    findOne({ jid: lookup }) {
      return {
        select() { return this; },
        lean() { return Promise.resolve(structuredClone(store.get(lookup) || null)); },
      };
    },
    async updateOne({ jid: lookup }, update) {
      const user = store.get(lookup) || { jid: lookup, preferences: {} };
      user.preferences ||= {};
      user.preferences.quickAccess = structuredClone(update.$set['preferences.quickAccess']);
      store.set(lookup, user);
      return { acknowledged: true };
    },
  };
  const ctx = {
    PREFIX: '!',
    args: [],
    userJid: jid,
    User,
    getDbReady: () => dbReady,
    reply: async message => { messages.push(String(message)); },
  };
  return { ctx, messages, store, User };
}

test.beforeEach(() => resetQuickAccessForTests());

test('quick access starts with favorites and command history empty; history is opt-in', async () => {
  const { ctx, messages } = makeHarness();
  await handleQuickAccessCommand(ctx);
  assert.match(messages[0], /AKSES CEPAT/);
  assert.match(messages[0], /FAVORIT \(0\/8\)/);
  assert.match(messages[0], /riwayat aktif/);
  assert.match(messages[0], /NONAKTIF/);
});

test('a member can add and remove public command favorites with the configured prefix', async () => {
  const { ctx, messages, store } = makeHarness();
  ctx.args = ['tambah', '.contrast'];
  await handleQuickAccessCommand(ctx);
  assert.match(messages.at(-1), /!contrast.*ditambahkan/i);
  assert.deepEqual(store.get(ctx.userJid).preferences.quickAccess.favorites, ['contrast']);

  ctx.args = [];
  await handleQuickAccessCommand(ctx);
  assert.match(messages.at(-1), /\* !contrast \*|!contrast/);

  ctx.args = ['hapus', 'contrast'];
  await handleQuickAccessCommand(ctx);
  assert.deepEqual(store.get(ctx.userJid).preferences.quickAccess.favorites, []);
});

test('quick access rejects unknown, owner-only, admin-only, and navigation commands', async () => {
  const { ctx, messages, store } = makeHarness();
  for (const command of ['doesnotexist', 'allowlist', 'kick', 'menu', 'cepat']) {
    ctx.args = ['tambah', command];
    await handleQuickAccessCommand(ctx);
    assert.match(messages.at(-1), /tidak tersedia/i);
  }
  assert.deepEqual(store.get(ctx.userJid)?.preferences?.quickAccess?.favorites || [], []);
});

test('command history is disabled by default and stores no arguments after explicit opt-in', async () => {
  const { ctx, store, messages } = makeHarness();
  assert.equal(await recordRecentCommand(ctx, 'contrast #222222 #ffffff'), false);
  assert.equal(store.has(ctx.userJid), false);

  ctx.args = ['riwayat', 'aktif'];
  await handleQuickAccessCommand(ctx);
  assert.match(messages.at(-1), /diaktifkan/i);
  assert.equal(store.get(ctx.userJid).preferences.quickAccess.historyEnabled, true);

  assert.equal(await recordRecentCommand(ctx, 'resize 1080 1080'), true);
  const recent = store.get(ctx.userJid).preferences.quickAccess.recent;
  assert.equal(recent.length, 1);
  assert.equal(recent[0].command, 'resize');
  assert.deepEqual(Object.keys(recent[0]).sort(), ['command', 'usedAt']);
});

test('recent commands are unique, newest-first, and capped at eight entries', async () => {
  const { ctx, store } = makeHarness();
  ctx.args = ['riwayat', 'aktif'];
  await handleQuickAccessCommand(ctx);
  for (const command of ['contrast', 'resize', 'compress', 'crop', 'fontpair', 'wizard', 'designlearn', 'colorpalette', 'design', 'designer']) {
    await recordRecentCommand(ctx, command);
  }
  const recent = store.get(ctx.userJid).preferences.quickAccess.recent;
  assert.equal(recent.length, 8);
  assert.equal(recent[0].command, 'designer');
  assert.equal(new Set(recent.map(item => item.command)).size, recent.length);
});

test('disabling history stops further recording but preserves history until deleted', async () => {
  const { ctx, store, messages } = makeHarness();
  ctx.args = ['riwayat', 'aktif'];
  await handleQuickAccessCommand(ctx);
  await recordRecentCommand(ctx, 'contrast');

  ctx.args = ['riwayat', 'nonaktif'];
  await handleQuickAccessCommand(ctx);
  assert.equal(await recordRecentCommand(ctx, 'resize'), false);
  assert.deepEqual(store.get(ctx.userJid).preferences.quickAccess.recent.map(item => item.command), ['contrast']);
  assert.match(messages.at(-1), /dinonaktifkan/i);

  ctx.args = ['riwayat', 'hapus'];
  await handleQuickAccessCommand(ctx);
  assert.deepEqual(store.get(ctx.userJid).preferences.quickAccess.recent, []);
});

test('reset clears favorites and history and turns history off', async () => {
  const { ctx, store } = makeHarness();
  ctx.args = ['tambah', 'contrast'];
  await handleQuickAccessCommand(ctx);
  ctx.args = ['riwayat', 'aktif'];
  await handleQuickAccessCommand(ctx);
  await recordRecentCommand(ctx, 'resize');

  ctx.args = ['reset'];
  await handleQuickAccessCommand(ctx);
  const data = store.get(ctx.userJid).preferences.quickAccess;
  assert.deepEqual(data.favorites, []);
  assert.deepEqual(data.recent, []);
  assert.equal(data.historyEnabled, false);
});

test('quick access data is isolated per WhatsApp account', async () => {
  const first = makeHarness({ jid: 'first@s.whatsapp.net' });
  const second = makeHarness({ jid: 'second@s.whatsapp.net' });
  first.ctx.args = ['tambah', 'contrast'];
  second.ctx.args = ['tambah', 'resize'];
  await handleQuickAccessCommand(first.ctx);
  await handleQuickAccessCommand(second.ctx);
  assert.deepEqual(first.store.get('first@s.whatsapp.net').preferences.quickAccess.favorites, ['contrast']);
  assert.deepEqual(second.store.get('second@s.whatsapp.net').preferences.quickAccess.favorites, ['resize']);
});

test('MongoDB-unavailable mode works in memory and clearly reports persistence limitation', async () => {
  const { ctx, messages } = makeHarness({ dbReady: false });
  ctx.args = ['tambah', 'contrast'];
  await handleQuickAccessCommand(ctx);
  assert.match(messages.at(-1), /sementara di memori/i);
});

test('quick access handles missing sender identity without throwing', async () => {
  const { ctx, messages } = makeHarness({ jid: '' });
  ctx.userJid = '';
  ctx.args = [];
  await handleQuickAccessCommand(ctx);
  assert.match(messages[0], /mengenali akun/i);
});


test('quick access preferences and recent history are only displayed in private chat', async () => {
  const { ctx, messages } = makeHarness();
  ctx.isGroup = true;
  ctx.args = [];
  await handleQuickAccessCommand(ctx);
  assert.match(messages[0], /chat pribadi/i);
  assert.doesNotMatch(messages[0], /FAVORIT \(0\/8\)/);
});


test('favorites are capped at eight and do not silently replace existing entries', async () => {
  const { ctx, messages, store } = makeHarness();
  for (const command of ['contrast', 'resize', 'compress', 'crop', 'fontpair', 'wizard', 'designlearn', 'colorpalette']) {
    ctx.args = ['tambah', command];
    await handleQuickAccessCommand(ctx);
  }
  ctx.args = ['tambah', 'designer'];
  await handleQuickAccessCommand(ctx);
  assert.equal(store.get(ctx.userJid).preferences.quickAccess.favorites.length, 8);
  assert.match(messages.at(-1), /mencapai 8 perintah/i);
});

test('favorites survive a fresh process cache through User.preferences.quickAccess', async () => {
  const { ctx, store } = makeHarness();
  ctx.args = ['tambah', 'contrast'];
  await handleQuickAccessCommand(ctx);
  resetQuickAccessForTests();
  ctx.args = [];
  const messages = [];
  ctx.reply = async message => { messages.push(String(message)); };
  await handleQuickAccessCommand(ctx);
  assert.match(messages[0], /!contrast/);
});

test('recent history ignores private/admin/navigation commands even when tracking is enabled', async () => {
  const { ctx, store } = makeHarness();
  ctx.args = ['riwayat', 'aktif'];
  await handleQuickAccessCommand(ctx);
  assert.equal(await recordRecentCommand(ctx, 'allowlist'), false);
  assert.equal(await recordRecentCommand(ctx, 'kick'), false);
  assert.equal(await recordRecentCommand(ctx, 'menu'), false);
  assert.deepEqual(store.get(ctx.userJid).preferences.quickAccess.recent, []);
});


test('favorite input accepts built-in short aliases but stores the canonical command', async () => {
  const { ctx, store } = makeHarness();
  ctx.args = ['tambah', 'ct'];
  await handleQuickAccessCommand(ctx);
  assert.deepEqual(store.get(ctx.userJid).preferences.quickAccess.favorites, ['contrast']);
});


test('favorite input accepts a custom non-dot prefix', async () => {
  const { ctx, store } = makeHarness();
  ctx.PREFIX = '?';
  ctx.args = ['tambah', '?contrast'];
  await handleQuickAccessCommand(ctx);
  assert.deepEqual(store.get(ctx.userJid).preferences.quickAccess.favorites, ['contrast']);
});

test('malformed stored preferences are normalized safely', async () => {
  const { ctx, messages } = makeHarness({
    initial: { jid: 'user-1@s.whatsapp.net', preferences: { quickAccess: null } },
  });
  await handleQuickAccessCommand(ctx);
  assert.match(messages[0], /FAVORIT \(0\/8\)/);
});
