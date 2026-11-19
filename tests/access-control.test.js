import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ACCESS_LIST_PATH, readAccessList, writeAccessList, addAllowedGroup, removeAllowedGroup,
  addAllowedContact, removeAllowedContact, isChatAllowed, normalizeAccessJid,
  isDestinationAllowed, isInboundChatAllowed, registerLinkedDesignerDestination, unregisterLinkedDesignerDestination, guardSocketOutbound, setAllowedGroupProfile, setAllowedContactProfile, getAccessIdentity, searchAccessIdentities,
} from '../features/access-control.js';

function withCleanList(run) {
  const backup = fs.existsSync(ACCESS_LIST_PATH) ? fs.readFileSync(ACCESS_LIST_PATH) : null;
  const backupPath = `${ACCESS_LIST_PATH}.bak`;
  const backupCopy = fs.existsSync(backupPath) ? fs.readFileSync(backupPath) : null;
  const restore = () => {
    if (backup) fs.writeFileSync(ACCESS_LIST_PATH, backup); else if (fs.existsSync(ACCESS_LIST_PATH)) fs.unlinkSync(ACCESS_LIST_PATH);
    if (backupCopy) fs.writeFileSync(backupPath, backupCopy); else if (fs.existsSync(backupPath)) fs.unlinkSync(backupPath);
  };
  try {
    for (const file of [ACCESS_LIST_PATH, backupPath]) if (fs.existsSync(file)) fs.unlinkSync(file);
    const result = run();
    if (result && typeof result.then === 'function') return result.finally(restore);
    restore();
    return result;
  } catch (error) {
    restore();
    throw error;
  }
}

test('allowlist defaults to enabled and denies all unknown chats', () => withCleanList(() => {
  assert.deepEqual(readAccessList(), { enabled: true, groups: [], contacts: [], groupProfiles: {}, contactProfiles: {}, revision: 0 });
  assert.equal(isChatAllowed({ remoteJid: '12345-67890@g.us', isGroup: true }), false);
  assert.equal(isChatAllowed({ remoteJid: '628123456789@s.whatsapp.net', isGroup: false }), false);
}));

test('only explicitly allowed groups can use bot in group chats', () => withCleanList(() => {
  const jid = '12345-67890@g.us';
  assert.equal(addAllowedGroup(jid).ok, true);
  assert.equal(isChatAllowed({ remoteJid: jid, isGroup: true }), true);
  assert.equal(isChatAllowed({ remoteJid: '99999-99999@g.us', isGroup: true }), false);
  assert.equal(removeAllowedGroup(jid).ok, true);
  assert.equal(isChatAllowed({ remoteJid: jid, isGroup: true }), false);
}));

test('allowed contacts match sender identity aliases', () => withCleanList(() => {
  assert.equal(addAllowedContact('628123456789').ok, true);
  assert.equal(isChatAllowed({ remoteJid: '123456789@lid', isGroup: false, identityAliases: ['628123456789@s.whatsapp.net'] }), true);
  assert.equal(isChatAllowed({ remoteJid: '628999999999@s.whatsapp.net', isGroup: false }), false);
  assert.equal(removeAllowedContact('628123456789').ok, true);
}));

test('normalization rejects invalid identifiers and write persists only valid types', () => withCleanList(() => {
  assert.equal(normalizeAccessJid('bad id'), '');
  writeAccessList({ enabled: true, groups: ['628123456789', '123-456@g.us'], contacts: ['628123456789', '123-456@g.us'] });
  assert.deepEqual(readAccessList(), { enabled: true, groups: ['123-456@g.us'], contacts: ['628123456789@s.whatsapp.net'], groupProfiles: {}, contactProfiles: {}, revision: 1 });
}));


test('outbound destinations must also be explicitly allowlisted', () => withCleanList(() => {
  const group = '12345-67890@g.us';
  const contact = '628123456789@s.whatsapp.net';
  assert.equal(isDestinationAllowed(group), false);
  assert.equal(isDestinationAllowed(contact), false);
  addAllowedGroup(group);
  addAllowedContact(contact);
  assert.equal(isDestinationAllowed(group), true);
  assert.equal(isDestinationAllowed(contact), true);
  assert.equal(isDestinationAllowed('bad jid'), false);
}));

test('socket outbound guard blocks all unapproved sends and permits approved destinations', async () => withCleanList(async () => {
  const sent = [];
  const warnings = [];
  const sock = { async sendMessage(jid, content, options) { sent.push({ jid, content, options }); return { ok: true }; } };
  guardSocketOutbound(sock, { warn: message => warnings.push(message) });
  assert.equal(await sock.sendMessage('628111111111@s.whatsapp.net', { text: 'blocked' }), null);
  assert.equal(sent.length, 0);
  assert.equal(warnings.length, 1);
  addAllowedContact('628111111111');
  const result = await sock.sendMessage('628111111111@s.whatsapp.net', { text: 'allowed' });
  assert.deepEqual(result, { ok: true });
  assert.equal(sent.length, 1);
}));

test('allowlist is saved to MongoDB and restored after a restart', async () => withCleanList(async () => {
  const backup = fs.existsSync(ACCESS_LIST_PATH) ? fs.readFileSync(ACCESS_LIST_PATH) : null;
  const { configureAccessListPersistence, restoreAccessListFromDatabase, flushAccessListPersistence } = await import('../features/access-control.js');
  const store = { document: null, writes: 0 };
  const model = {
    findOne() { return { lean: async () => store.document }; },
    async updateOne(filter, update) { store.document = { ...update.$set }; store.writes += 1; },
  };
  try {
    configureAccessListPersistence({ model, logger: { error() {} } });
    addAllowedGroup('12345-67890@g.us');
    setAllowedGroupProfile('12345-67890@g.us', { alias: 'Tenant Alpha', waName: 'Alpha Group' });
    await flushAccessListPersistence();
    assert.equal(store.writes, 2);
    assert.deepEqual(store.document.groups, ['12345-67890@g.us']);
    assert.equal(store.document.groupProfiles['12345-67890@g.us'].alias, 'Tenant Alpha');
    store.document.updatedAt = new Date(Date.now() + 60_000);

    writeAccessList({ enabled: true, groups: [], contacts: [] }, { persist: false });
    const restored = await restoreAccessListFromDatabase();
    assert.equal(restored.source, 'mongodb');
    assert.equal(isChatAllowed({ remoteJid: '12345-67890@g.us', isGroup: true }), true);
    assert.equal(readAccessList().groupProfiles['12345-67890@g.us'].alias, 'Tenant Alpha');
  } finally {
    configureAccessListPersistence({ model: null });
    if (backup) fs.writeFileSync(ACCESS_LIST_PATH, backup);
    else if (fs.existsSync(ACCESS_LIST_PATH)) fs.unlinkSync(ACCESS_LIST_PATH);
  }
}));

test('group and contact aliases persist with allowlist identity metadata', () => withCleanList(() => {
  const group = '12345-67890@g.us';
  const contact = '628123456789@s.whatsapp.net';
  addAllowedGroup(group);
  addAllowedContact(contact);
  assert.equal(setAllowedGroupProfile(group, { alias: 'Pelanggan Toko A', waName: 'Toko A Official', note: 'Sewa tahunan' }).ok, true);
  assert.equal(setAllowedContactProfile(contact, { alias: 'Admin Toko A', note: 'Pemilik' }).ok, true);
  const list = readAccessList();
  assert.equal(getAccessIdentity(group, list).alias, 'Pelanggan Toko A');
  assert.equal(getAccessIdentity(contact, list).alias, 'Admin Toko A');
  writeAccessList({ ...list, groups: [], contacts: [contact] });
  assert.equal(readAccessList().groupProfiles[group], undefined, 'metadata grup yang dicabut tidak tertinggal');
  assert.equal(readAccessList().contactProfiles[contact].alias, 'Admin Toko A');
}));

test('corrupt allowlist does not silently become empty', () => {
  const backup = fs.existsSync(ACCESS_LIST_PATH) ? fs.readFileSync(ACCESS_LIST_PATH) : null;
  const backupFile = `${ACCESS_LIST_PATH}.bak`;
  const oldBackup = fs.existsSync(backupFile) ? fs.readFileSync(backupFile) : null;
  try {
    fs.mkdirSync(new URL('../config/', import.meta.url), { recursive: true });
    fs.writeFileSync(ACCESS_LIST_PATH, '{broken');
    if (fs.existsSync(backupFile)) fs.unlinkSync(backupFile);
    assert.throws(() => readAccessList(), /Allowlist rusak/);
  } finally {
    if (backup) fs.writeFileSync(ACCESS_LIST_PATH, backup); else if (fs.existsSync(ACCESS_LIST_PATH)) fs.unlinkSync(ACCESS_LIST_PATH);
    if (oldBackup) fs.writeFileSync(backupFile, oldBackup); else if (fs.existsSync(backupFile)) fs.unlinkSync(backupFile);
  }
});


test('database allowlist survives a fresh empty deployment config', async () => {
  const backup = fs.existsSync(ACCESS_LIST_PATH) ? fs.readFileSync(ACCESS_LIST_PATH) : null;
  const backupPath = `${ACCESS_LIST_PATH}.bak`;
  const backupCopy = fs.existsSync(backupPath) ? fs.readFileSync(backupPath) : null;
  const { configureAccessListPersistence, restoreAccessListFromDatabase } = await import('../features/access-control.js');
  const store = { document: { key: 'global', enabled: true, groups: ['12345-67890@g.us'], contacts: [], groupProfiles: { '12345-67890@g.us': { alias: 'Tenant Persisten' } }, contactProfiles: {}, revision: 7, updatedAt: new Date(Date.now() - 86400000) } };
  const model = { findOne() { return { lean: async () => store.document }; }, async updateOne(filter, update) { store.document = { ...update.$set }; } };
  try {
    for (const file of [ACCESS_LIST_PATH, backupPath]) if (fs.existsSync(file)) fs.unlinkSync(file);
    writeAccessList({ enabled: true, groups: [], contacts: [], revision: 0 }, { persist: false });
    configureAccessListPersistence({ model, logger: { error() {} } });
    const restored = await restoreAccessListFromDatabase();
    assert.equal(restored.source, 'mongodb');
    assert.equal(isChatAllowed({ remoteJid: '12345-67890@g.us', isGroup: true }), true);
    assert.equal(readAccessList().groupProfiles['12345-67890@g.us'].alias, 'Tenant Persisten');
  } finally {
    configureAccessListPersistence({ model: null });
    if (backup) fs.writeFileSync(ACCESS_LIST_PATH, backup); else if (fs.existsSync(ACCESS_LIST_PATH)) fs.unlinkSync(ACCESS_LIST_PATH);
    if (backupCopy) fs.writeFileSync(backupPath, backupCopy); else if (fs.existsSync(backupPath)) fs.unlinkSync(backupPath);
  }
});


test('intentional offline allowlist changes sync by revision, not filesystem time', async () => {
  const backup = fs.existsSync(ACCESS_LIST_PATH) ? fs.readFileSync(ACCESS_LIST_PATH) : null;
  const backupPath = `${ACCESS_LIST_PATH}.bak`;
  const backupCopy = fs.existsSync(backupPath) ? fs.readFileSync(backupPath) : null;
  const { configureAccessListPersistence, restoreAccessListFromDatabase } = await import('../features/access-control.js');
  const store = { document: { key: 'global', enabled: true, groups: [], contacts: [], groupProfiles: {}, contactProfiles: {}, revision: 2 } };
  const model = { findOne() { return { lean: async () => store.document }; }, async updateOne(filter, update) { store.document = { ...update.$set }; } };
  try {
    for (const file of [ACCESS_LIST_PATH, backupPath]) if (fs.existsSync(file)) fs.unlinkSync(file);
    writeAccessList({ enabled: true, groups: ['12345-67890@g.us'], contacts: [], revision: 3 }, { persist: false });
    configureAccessListPersistence({ model, logger: { error() {} } });
    const result = await restoreAccessListFromDatabase();
    assert.equal(result.source, 'newer-local-revision-synced');
    assert.deepEqual(store.document.groups, ['12345-67890@g.us']);
    assert.equal(store.document.revision, 3);
  } finally {
    configureAccessListPersistence({ model: null });
    if (backup) fs.writeFileSync(ACCESS_LIST_PATH, backup); else if (fs.existsSync(ACCESS_LIST_PATH)) fs.unlinkSync(ACCESS_LIST_PATH);
    if (backupCopy) fs.writeFileSync(backupPath, backupCopy); else if (fs.existsSync(backupPath)) fs.unlinkSync(backupPath);
  }
});


test('allowlist search matches alias, WhatsApp name, note, and JID with optional type filter', () => withCleanList(() => {
  const group = '12345-67890@g.us';
  const contact = '628123456789@s.whatsapp.net';
  addAllowedGroup(group);
  addAllowedContact(contact);
  setAllowedGroupProfile(group, { alias: 'Studio Langit', waName: 'Komunitas Desain', note: 'Penyewa premium' });
  setAllowedContactProfile(contact, { alias: 'Admin Studio', note: 'Kontak pembayaran' });

  assert.equal(searchAccessIdentities('studio').length, 2);
  assert.equal(searchAccessIdentities('KOMUNITAS')[0].jid, group);
  assert.equal(searchAccessIdentities('pembayaran', { type: 'contact' })[0].jid, contact);
  assert.equal(searchAccessIdentities('pembayaran', { type: 'group' }).length, 0);
  assert.equal(searchAccessIdentities('628123456789')[0].jid, contact);
  assert.deepEqual(searchAccessIdentities(''), []);
}));

test('allowlist search caps results and does not mutate stored identities', () => withCleanList(() => {
  for (let i = 0; i < 12; i++) {
    const jid = `${10000 + i}-${20000 + i}@g.us`;
    addAllowedGroup(jid);
    setAllowedGroupProfile(jid, { alias: `Studio ${i}` });
  }
  const before = readAccessList();
  assert.equal(searchAccessIdentities('studio', { limit: 100 }).length, 12); // hard cap is 50; all 12 are allowed
  assert.equal(searchAccessIdentities('studio', { limit: 3 }).length, 3);
  assert.deepEqual(readAccessList(), before);
}));


test('verified Owner bypass applies only to private inbound chats', () => withCleanList(() => {
  const group = '12345-67890@g.us';
  assert.equal(isInboundChatAllowed({
    senderIsOwner: true, remoteJid: group, isGroup: true,
  }), false, 'Owner must not bypass group allowlist');
  assert.equal(isInboundChatAllowed({
    senderIsOwner: true, remoteJid: '628123456789@s.whatsapp.net', isGroup: false,
  }), true, 'verified Owner may use private chat');
  assert.equal(isInboundChatAllowed({
    senderIsOwner: false, remoteJid: '628123456789@s.whatsapp.net', isGroup: false,
  }), false, 'non-Owner private chat remains allowlisted');
}));

test('Owner in a group is accepted only when that group is allowlisted', () => withCleanList(() => {
  const group = '12345-67890@g.us';
  addAllowedGroup(group);
  assert.equal(isInboundChatAllowed({ senderIsOwner: true, remoteJid: group, isGroup: true }), true);
  assert.equal(isInboundChatAllowed({ senderIsOwner: true, remoteJid: '99999-99999@g.us', isGroup: true }), false);
}));

test('Owner bypass cannot be triggered by an inconsistent private-chat flag', () => withCleanList(() => {
  const group = '12345-67890@g.us';
  assert.equal(isInboundChatAllowed({ senderIsOwner: true, remoteJid: group, isGroup: false }), false);
  assert.equal(isInboundChatAllowed({ senderIsOwner: true, remoteJid: 'untrusted-destination', isGroup: false }), false);
  assert.equal(isInboundChatAllowed({ senderIsOwner: true, remoteJid: '628123456789@s.whatsapp.net', isGroup: false }), true);
  assert.equal(isInboundChatAllowed({ senderIsOwner: true, remoteJid: '123456789@lid', isGroup: false }), true);
}));


test('command handler delegates inbound authorization to the shared Owner-safe gate', () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const source = fs.readFileSync(path.join(root, 'features/command-handler.js'), 'utf8');
  assert.match(source, /import \{ isInboundChatAllowed \} from '\.\/access-control\.js';/);
  assert.match(source, /isInboundChatAllowed\(\{ senderIsOwner: deps\.isBotOwner\(userJid, senderIdentityAliases\), remoteJid, isGroup/);
  assert.doesNotMatch(source, /!deps\.isBotOwner\(userJid, senderIdentityAliases\) && !isChatAllowed/);
});


test('linked designer notification destinations allow private outbound only, never inbound or group access', () => withCleanList(() => {
  const privateJid = '628123456789@s.whatsapp.net';
  const groupJid = '12345-67890@g.us';
  assert.equal(registerLinkedDesignerDestination(privateJid), true);
  assert.equal(isDestinationAllowed(privateJid), true);
  assert.equal(isChatAllowed({ remoteJid: privateJid, isGroup: false }), false);
  assert.equal(isInboundChatAllowed({ remoteJid: privateJid, isGroup: false }), false);
  assert.equal(isDestinationAllowed(groupJid), false);
  assert.equal(registerLinkedDesignerDestination(groupJid), false);
  assert.equal(unregisterLinkedDesignerDestination(privateJid), true);
  assert.equal(isDestinationAllowed(privateJid), false);
}));
