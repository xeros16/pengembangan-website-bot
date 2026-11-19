import test from 'node:test';
import assert from 'node:assert/strict';
import { handleGroupIdentifierCommands, GROUP_IDENTIFIER_COMMANDS } from '../features/commands/group-identifiers.js';

function baseCtx(overrides = {}) {
  const sent = [];
  const ctx = {
    sock: { groupMetadata: async jid => ({ subject: 'Komunitas Test', participants: [{ id: '628111@s.whatsapp.net', admin: 'admin' }] }) },
    msg: { key: { remoteJid: '120363000@g.us' }, message: { conversation: '.idgrup' } },
    remoteJid: '120363000@g.us', isGroup: true, command: 'idgrup', args: [],
    sender: '628111@s.whatsapp.net', userJid: '628111@s.whatsapp.net', senderIdentityAliases: [],
    normalizeJid: value => value, isBotOwner: () => false, isGroupAdmin: async () => false,
    getQuotedMessage: () => null,
    reply: async text => { sent.push(text); },
    sent,
    ...overrides,
  };
  return ctx;
}

test('group identifier commands are registered', () => {
  for (const command of ['jid', 'idgrup', 'groupid', 'idanggota', 'memberid', 'daftaridanggota']) {
    assert.equal(GROUP_IDENTIFIER_COMMANDS.has(command), true);
  }
});

test('idgrup returns group JID and metadata', async () => {
  const ctx = baseCtx();
  await handleGroupIdentifierCommands(ctx);
  assert.match(ctx.sent[0], /JID grup: 120363000@g\.us/);
  assert.match(ctx.sent[0], /Komunitas Test/);
  assert.match(ctx.sent[0], /Jumlah anggota: 1/);
});

test('idanggota returns current user identity by default', async () => {
  const ctx = baseCtx({ command: 'idanggota', isGroup: false, remoteJid: '628111@s.whatsapp.net' });
  await handleGroupIdentifierCommands(ctx);
  assert.match(ctx.sent[0], /628111@s\.whatsapp\.net/);
});

test('full member list is denied to non-admins', async () => {
  const ctx = baseCtx({ command: 'idanggota', args: ['semua'] });
  await handleGroupIdentifierCommands(ctx);
  assert.match(ctx.sent[0], /hanya dapat dilihat admin grup atau Owner bot/);
});

test('idanggota resolves a mentioned member ID', async () => {
  const ctx = baseCtx({
    command: 'idanggota',
    args: [],
    msg: {
      key: { remoteJid: '120363000@g.us' },
      message: { extendedTextMessage: { text: '.idanggota @628222', contextInfo: { mentionedJid: ['628222@s.whatsapp.net'] } } },
    },
  });
  await handleGroupIdentifierCommands(ctx);
  assert.match(ctx.sent[0], /628222@s\.whatsapp\.net/);
  assert.match(ctx.sent[0], /ID ANGGOTA YANG DIPILIH/);
});

test('admin can request the member ID list', async () => {
  const ctx = baseCtx({
    command: 'idanggota', args: ['semua'],
    isGroupAdmin: async () => true,
  });
  await handleGroupIdentifierCommands(ctx);
  assert.match(ctx.sent[0], /ID ANGGOTA GRUP/);
  assert.match(ctx.sent[0], /628111@s\.whatsapp\.net/);
});
