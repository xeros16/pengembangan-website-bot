import test from 'node:test';
import assert from 'node:assert/strict';
import { findBlockedWord, normalizeModerationTokens, createGroupModeration } from '../features/group-moderation.js';

test('blocked-word matcher uses normalized whole-word matching', () => {
  assert.deepEqual(normalizeModerationTokens('BODOH! desain, keren_123'), ['bodoh', 'desain', 'keren_123']);
  assert.equal(findBlockedWord('Kamu BODOH sekali!', ['bodoh']), 'bodoh');
  assert.equal(findBlockedWord('Kebodohan bukan solusi', ['bodoh']), '');
  assert.equal(findBlockedWord('spamkata!', ['spamkata']), 'spamkata');
});

test('anti-toxic filter deletes and warns for non-admins when enabled', async () => {
  const warnings = [];
  const logs = [];
  const sent = [];
  const moderation = createGroupModeration({
    getDbReady: () => true,
    Group: { findOneAndUpdate: () => ({ lean: async () => ({ antiLink: false, antiSpam: false, antiToxic: true, blockedWords: ['bodoh'] }) }) },
    User: { findOneAndUpdate: async () => null },
    Warning: {
      create: async value => { warnings.push(value); },
      countDocuments: async () => 3,
    },
    ModerationLog: { create: async value => { logs.push(value); } },
    isGroupJid: jid => jid.endsWith('@g.us'),
    normalizeJid: jid => jid,
    isGroupAdmin: async () => false,
    isBotAdmin: async () => true,
    getMessageText: () => 'Kamu BODOH!',
    isChatAllowed: () => true,
  });
  const result = await moderation.processGroupModeration({ sendMessage: async (jid, payload) => { sent.push({ jid, payload }); } }, {
    key: { remoteJid: '120363000@g.us', participant: '628111111111@s.whatsapp.net', id: 'msg-1' },
    message: { conversation: 'Kamu BODOH!' },
  });
  assert.equal(result, true);
  assert.equal(warnings.length, 1);
  assert.equal(warnings[0].reason, 'Kata yang dilarang terdeteksi');
  assert.equal(logs[0].details, 'Filter kata cocok (5 karakter)');
  assert.doesNotMatch(logs[0].details, /BODOH/i);
  assert.equal(sent.length, 2, 'delete event plus one moderation notice');
  assert.match(sent.at(-1).payload.text, /3 peringatan/);
});

test('anti-toxic filter does not moderate admins or partial-word matches', async () => {
  let warningCount = 0;
  const moderation = createGroupModeration({
    getDbReady: () => true,
    Group: { findOneAndUpdate: () => ({ lean: async () => ({ antiLink: false, antiSpam: false, antiToxic: true, blockedWords: ['bodoh'] }) }) },
    User: { findOneAndUpdate: async () => null },
    Warning: { create: async () => { warningCount += 1; }, countDocuments: async () => warningCount },
    ModerationLog: { create: async () => {} },
    isGroupJid: jid => jid.endsWith('@g.us'),
    normalizeJid: jid => jid,
    isGroupAdmin: async () => true,
    isBotAdmin: async () => true,
    getMessageText: () => 'Kebodohan tidak membantu',
    isChatAllowed: () => true,
  });
  const result = await moderation.processGroupModeration({ sendMessage: async () => {} }, {
    key: { remoteJid: '120363000@g.us', participant: '628111111111@s.whatsapp.net' },
    message: { conversation: 'Kebodohan tidak membantu' },
  });
  assert.equal(result, false);
  assert.equal(warningCount, 0);
});

test('Admin can maintain a per-group blocked-word list and enable it explicitly', async () => {
  const { handleModerationSettingsCommands } = await import('../features/commands/moderation-settings.js');
  const messages = [];
  const groups = new Map();
  const Group = {
    findOneAndUpdate(query, update) {
      const current = groups.get(query.jid) || { jid: query.jid, antiToxic: false, blockedWords: [] };
      if (update.$setOnInsert) {
        groups.set(query.jid, current);
        return { lean: async () => structuredClone(current) };
      }
      const next = { ...current, ...(update.$set || {}) };
      groups.set(query.jid, next);
      return Promise.resolve(next);
    },
  };
  const ctx = {
    command: 'antitoxic', args: ['tambah', 'Bodoh'], PREFIX: '!',
    isGroup: true, remoteJid: '120363000@g.us', sender: '628111111111@s.whatsapp.net', userJid: '628111111111@s.whatsapp.net',
    sock: {}, Group, requireDatabase: async () => true, isGroupAdmin: async () => true,
    logModeration: async () => {}, reply: async value => { messages.push(String(value)); },
  };
  await handleModerationSettingsCommands(ctx);
  assert.deepEqual(groups.get(ctx.remoteJid).blockedWords, ['bodoh']);
  assert.equal(groups.get(ctx.remoteJid).antiToxic, false, 'adding words must not silently enable the filter');
  ctx.args = ['on'];
  await handleModerationSettingsCommands(ctx);
  assert.equal(groups.get(ctx.remoteJid).antiToxic, true);
  assert.match(messages.at(-1), /diaktifkan/i);
});

test('natural-language search discovers anti-toxic moderation', async () => {
  const { searchCommandsByNeed } = await import('../features/command-suggestions.js');
  const results = searchCommandsByNeed('blokir kata kasar di grup');
  assert.ok(results.some(item => item.command === 'antitoxic'));
});

test('verified bot Owner is exempt even when not a group Admin', async () => {
  let warningCount = 0;
  const moderation = createGroupModeration({
    getDbReady: () => true,
    Group: { findOneAndUpdate: () => ({ lean: async () => ({ antiLink: false, antiSpam: false, antiToxic: true, blockedWords: ['bodoh'] }) }) },
    User: { findOneAndUpdate: async () => null },
    Warning: { create: async () => { warningCount += 1; }, countDocuments: async () => warningCount },
    ModerationLog: { create: async () => {} },
    isGroupJid: jid => jid.endsWith('@g.us'),
    normalizeJid: jid => jid,
    isGroupAdmin: async () => false,
    isBotOwner: jid => jid === '628111111111@s.whatsapp.net',
    isBotAdmin: async () => true,
    getMessageText: () => 'BODOH!',
    isChatAllowed: () => true,
  });
  const result = await moderation.processGroupModeration({ sendMessage: async () => {} }, {
    key: { remoteJid: '120363000@g.us', participant: '628111111111@s.whatsapp.net' },
    message: { conversation: 'BODOH!' },
  });
  assert.equal(result, false);
  assert.equal(warningCount, 0);
});
