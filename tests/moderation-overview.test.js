import test from 'node:test';
import assert from 'node:assert/strict';
import { MODERATION_SETTINGS_COMMANDS, handleModerationSettingsCommands } from '../features/commands/moderation-settings.js';

function createGroupModel(initial = {}) {
  let row = { jid: 'group-test@g.us', antiLink: false, antiSpam: false, antiToxic: true, blockedWords: ['spamkata'], welcomeEnabled: false, goodbyeEnabled: false, ...structuredClone(initial) };
  const updates = [];
  return {
    updates,
    get row() { return row; },
    findOne() { return { lean: async () => structuredClone(row) }; },
    async findOneAndUpdate(_filter, update) {
      updates.push(structuredClone(update.$set || {}));
      row = { ...row, ...(update.$set || {}) };
      return structuredClone(row);
    },
  };
}

function context(command, args, Group, overrides = {}) {
  const replies = [];
  const ctx = {
    command, args, PREFIX: '!', isGroup: true, remoteJid: 'group-test@g.us',
    sender: 'admin@g.us', userJid: 'admin@s.whatsapp.net', sock: {},
    Group, requireDatabase: async () => true,
    isGroupAdmin: async () => true, isBotOwner: () => false,
    logModeration: async () => {},
    reply: async value => replies.push(String(value)),
    ...overrides,
  };
  return { ctx, replies };
}

test('moderation overview and presets are registered', () => {
  assert.equal(MODERATION_SETTINGS_COMMANDS.has('modstatus'), true);
  assert.equal(MODERATION_SETTINGS_COMMANDS.has('modpreset'), true);
});

test('modstatus is read-only and reports current protections', async () => {
  const Group = createGroupModel();
  const { ctx, replies } = context('modstatus', [], Group);
  await handleModerationSettingsCommands(ctx);
  assert.match(replies[0], /STATUS PROTEKSI GRUP/);
  assert.match(replies[0], /Anti-link: NONAKTIF/);
  assert.match(replies[0], /Anti-spam: NONAKTIF/);
  assert.match(replies[0], /Filter kata: AKTIF \(1\/30/);
  assert.equal(Group.updates.length, 0);
});

test('modpreset preview never writes and apply requires explicit confirmation', async () => {
  const Group = createGroupModel();
  const noPreview = context('modpreset', ['apply', 'proteksi-dasar', 'konfirmasi'], Group);
  await handleModerationSettingsCommands(noPreview.ctx);
  assert.match(noPreview.replies[0], /Belum ada pratinjau yang valid/);
  assert.equal(Group.updates.length, 0);

  const preview = context('modpreset', ['preview', 'proteksi-dasar'], Group);
  await handleModerationSettingsCommands(preview.ctx);
  assert.match(preview.replies[0], /PRATINJAU PRESET/);
  assert.match(preview.replies[0], /Anti-link: NONAKTIF → AKTIF/);
  assert.equal(Group.updates.length, 0);

  const noConfirm = context('modpreset', ['apply', 'proteksi-dasar'], Group);
  await handleModerationSettingsCommands(noConfirm.ctx);
  assert.match(noConfirm.replies[0], /Konfirmasi penerapan/);
  assert.equal(Group.updates.length, 0);

  const confirmed = context('modpreset', ['apply', 'proteksi-dasar', 'konfirmasi'], Group);
  await handleModerationSettingsCommands(confirmed.ctx);
  assert.equal(Group.updates.length, 1);
  assert.equal(Group.row.antiLink, true);
  assert.equal(Group.row.antiSpam, true);
  assert.equal(Group.row.antiToxic, true, 'fields outside the selected preset are preserved');
  assert.deepEqual(Group.row.blockedWords, ['spamkata']);
  assert.match(confirmed.replies[0], /DITERAPKAN/);
});

test('modpreset refuses non-admin preview and apply', async () => {
  const Group = createGroupModel();
  const denied = context('modpreset', ['apply', 'ramah', 'konfirmasi'], Group, {
    isGroupAdmin: async () => false,
    isBotOwner: () => false,
  });
  await handleModerationSettingsCommands(denied.ctx);
  assert.match(denied.replies[0], /Hanya Admin grup atau Owner/);
  assert.equal(Group.updates.length, 0);
});

test('modstatus and modpreset reject private chats', async () => {
  const Group = createGroupModel();
  const status = context('modstatus', [], Group, { isGroup: false });
  await handleModerationSettingsCommands(status.ctx);
  assert.match(status.replies[0], /di dalam grup/);
  const preset = context('modpreset', ['preview', 'ramah'], Group, { isGroup: false });
  await handleModerationSettingsCommands(preset.ctx);
  assert.match(preset.replies[0], /di dalam grup/);
});


test('preset remains reported as applied if best-effort audit logging fails', async () => {
  const Group = createGroupModel();
  const preview = context('modpreset', ['preview', 'ramah'], Group);
  await handleModerationSettingsCommands(preview.ctx);
  const applied = context('modpreset', ['apply', 'ramah', 'konfirmasi'], Group, {
    logModeration: async () => { throw new Error('audit store unavailable'); },
  });
  await handleModerationSettingsCommands(applied.ctx);
  assert.equal(Group.row.welcomeEnabled, true);
  assert.equal(Group.row.goodbyeEnabled, true);
  assert.match(applied.replies[0], /DITERAPKAN/);
});


test('preset apply refuses if relevant group settings changed after preview', async () => {
  const Group = createGroupModel();
  const preview = context('modpreset', ['preview', 'proteksi-dasar'], Group);
  await handleModerationSettingsCommands(preview.ctx);
  Group.row.antiLink = true;
  const apply = context('modpreset', ['apply', 'proteksi-dasar', 'konfirmasi'], Group);
  await handleModerationSettingsCommands(apply.ctx);
  assert.match(apply.replies[0], /berubah sejak pratinjau/);
  assert.equal(Group.updates.length, 0);
});
