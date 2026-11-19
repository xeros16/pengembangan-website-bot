// Default-deny allowlist for chats. Only explicitly approved groups/contacts can use the bot.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const ACCESS_LIST_PATH = path.join(ROOT, 'config', 'allowed-chats.json');
const EMPTY = Object.freeze({ enabled: true, groups: [], contacts: [], groupProfiles: {}, contactProfiles: {}, revision: 0 });
let persistenceModel = null;
let persistenceLogger = console;
let persistenceQueue = Promise.resolve();
let lastPersistenceError = null;
const linkedDesignerDestinations = new Map();
const LINKED_DESIGNER_DESTINATION_TTL_MS = 60 * 60 * 1000;

/** Attach the MongoDB model used to keep access rules across deployments/restarts. */
export function configureAccessListPersistence({ model, logger = console } = {}) {
  persistenceModel = model || null;
  persistenceLogger = logger;
}

function scheduleDatabaseSave(list) {
  if (!persistenceModel) return;
  const snapshot = { enabled: list.enabled !== false, groups: [...list.groups], contacts: [...list.contacts], groupProfiles: { ...(list.groupProfiles || {}) }, contactProfiles: { ...(list.contactProfiles || {}) }, revision: Number(list.revision) || 0 };
  persistenceQueue = persistenceQueue.catch(() => {}).then(() => persistenceModel.updateOne(
    { key: 'global' },
    { $set: { ...snapshot, key: 'global' } },
    { upsert: true },
  )).then(() => { lastPersistenceError = null; }).catch(error => { lastPersistenceError = error; persistenceLogger.error?.('[ACCESS LIST SAVE]', error.message); });
}

/** Restore MongoDB as source of truth; seed it from the local JSON file on first run. */
export async function flushAccessListPersistence() {
  await persistenceQueue;
  return { ok: !lastPersistenceError && Boolean(persistenceModel), localOnly: !persistenceModel || Boolean(lastPersistenceError) };
}

export async function restoreAccessListFromDatabase() {
  if (!persistenceModel) return { restored: false, reason: 'model-unavailable' };
  try {
    const document = await persistenceModel.findOne({ key: 'global' }).lean();
    if (document) {
      const local = readAccessList();
      const localRevision = Number(local.revision) || 0;
      const databaseRevision = Number(document.revision) || 0;
      // Revision counters distinguish intentional offline changes from a fresh,
      // empty config file deployed with a newer filesystem timestamp.
      if (localRevision > databaseRevision) {
        await persistenceModel.updateOne({ key: 'global' }, { $set: { key: 'global', ...local } }, { upsert: true });
        return { restored: false, groups: local.groups.length, contacts: local.contacts.length, source: 'newer-local-revision-synced' };
      }
      const restored = writeAccessList({
        enabled: document.enabled, groups: document.groups, contacts: document.contacts,
        groupProfiles: document.groupProfiles, contactProfiles: document.contactProfiles,
        revision: databaseRevision,
      }, { persist: false });
      return { restored: true, groups: restored.groups.length, contacts: restored.contacts.length, source: 'mongodb' };
    }
    const local = readAccessList();
    await persistenceModel.updateOne({ key: 'global' }, { $set: { key: 'global', ...local } }, { upsert: true });
    return { restored: false, groups: local.groups.length, contacts: local.contacts.length, source: 'local-seeded' };
  } catch (error) {
    persistenceLogger.error?.('[ACCESS LIST RESTORE]', error.message);
    return { restored: false, reason: error.message };
  }
}

export function normalizeAccessJid(value) {
  if (typeof value !== 'string') return '';
  const raw = value.trim();
  if (!raw) return '';
  if (/^\+?\d{8,15}$/.test(raw)) return `${raw.replace(/^\+/, '')}@s.whatsapp.net`;
  if (!/^[^\s@]+@(s\.whatsapp\.net|g\.us|lid)$/.test(raw)) return '';
  return raw;
}

function cleanProfiles(input, suffix = null, allowed = null) {
  const output = {};
  if (!input || typeof input !== 'object' || Array.isArray(input)) return output;
  for (const [rawJid, rawProfile] of Object.entries(input)) {
    const jid = normalizeAccessJid(rawJid);
    if (!jid || (suffix && !jid.endsWith(suffix)) || (allowed && !allowed.includes(jid))) continue;
    const profile = typeof rawProfile === 'string' ? { alias: rawProfile } : rawProfile;
    if (!profile || typeof profile !== 'object') continue;
    const alias = String(profile.alias || '').trim().slice(0, 80);
    const waName = String(profile.waName || '').trim().slice(0, 100);
    const note = String(profile.note || '').trim().slice(0, 240);
    if (alias || waName || note) output[jid] = { alias, waName, note };
  }
  return output;
}

export function readAccessList() {
  try {
    const parsed = JSON.parse(fs.readFileSync(ACCESS_LIST_PATH, 'utf8'));
    const groups = [...new Set((Array.isArray(parsed.groups) ? parsed.groups : []).map(normalizeAccessJid).filter(jid => jid.endsWith('@g.us')))];
    const contacts = [...new Set((Array.isArray(parsed.contacts) ? parsed.contacts : []).map(normalizeAccessJid).filter(jid => jid.endsWith('@s.whatsapp.net') || jid.endsWith('@lid')))];
    return {
      enabled: parsed.enabled !== false, groups, contacts, revision: Math.max(0, Number(parsed.revision) || 0),
      groupProfiles: cleanProfiles(parsed.groupProfiles, '@g.us', groups),
      contactProfiles: cleanProfiles(parsed.contactProfiles, null, contacts),
    };
  } catch (error) {
    const backupPath = `${ACCESS_LIST_PATH}.bak`;
    if (error.code === 'ENOENT' && !fs.existsSync(backupPath)) return { ...EMPTY, groups: [], contacts: [], groupProfiles: {}, contactProfiles: {} };
    try {
      const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
      const groups = [...new Set((Array.isArray(backup.groups) ? backup.groups : []).map(normalizeAccessJid).filter(jid => jid.endsWith('@g.us')))];
      const contacts = [...new Set((Array.isArray(backup.contacts) ? backup.contacts : []).map(normalizeAccessJid).filter(jid => jid.endsWith('@s.whatsapp.net') || jid.endsWith('@lid')))];
      return {
        enabled: backup.enabled !== false, groups, contacts, revision: Math.max(0, Number(backup.revision) || 0),
        groupProfiles: cleanProfiles(backup.groupProfiles, '@g.us', groups),
        contactProfiles: cleanProfiles(backup.contactProfiles, null, contacts),
      };
    } catch {
      throw new Error(`Allowlist rusak dan backup tidak dapat dibaca (${error.message}). Hentikan perubahan dan pulihkan config/allowed-chats.json.`);
    }
  }
}

export function writeAccessList(next, { persist = true } = {}) {
  const groups = [...new Set((next?.groups || []).map(normalizeAccessJid).filter(jid => jid.endsWith('@g.us')))];
  const contacts = [...new Set((next?.contacts || []).map(normalizeAccessJid).filter(jid => jid.endsWith('@s.whatsapp.net') || jid.endsWith('@lid')))];
  const clean = {
    enabled: next?.enabled !== false, groups, contacts,
    revision: persist ? Math.max(0, Number(next?.revision) || 0) + 1 : Math.max(0, Number(next?.revision) || 0),
    groupProfiles: cleanProfiles(next?.groupProfiles, '@g.us', groups),
    contactProfiles: cleanProfiles(next?.contactProfiles, null, contacts),
  };
  fs.mkdirSync(path.dirname(ACCESS_LIST_PATH), { recursive: true });
  const temp = `${ACCESS_LIST_PATH}.${process.pid}.tmp`;
  if (fs.existsSync(ACCESS_LIST_PATH)) {
    const current = fs.readFileSync(ACCESS_LIST_PATH);
    try {
      JSON.parse(current.toString('utf8'));
      fs.writeFileSync(`${ACCESS_LIST_PATH}.bak`, current, { mode: 0o600 });
    } catch {
      // Preserve a known-good backup when the active JSON is already damaged.
    }
  }
  fs.writeFileSync(temp, `${JSON.stringify(clean, null, 2)}\n`, { mode: 0o600 });
  fs.renameSync(temp, ACCESS_LIST_PATH);
  if (persist) scheduleDatabaseSave(clean);
  return clean;
}

export function addAllowedGroup(jid) {
  const normalized = normalizeAccessJid(jid);
  if (!normalized.endsWith('@g.us')) return { ok: false, message: 'ID grup tidak valid.' };
  const list = readAccessList();
  if (list.groups.includes(normalized)) return { ok: true, changed: false, list };
  list.groups.push(normalized);
  return { ok: true, changed: true, list: writeAccessList(list) };
}

export function removeAllowedGroup(jid) {
  const normalized = normalizeAccessJid(jid);
  const list = readAccessList();
  const groups = list.groups.filter(item => item !== normalized);
  if (groups.length === list.groups.length) return { ok: false, message: 'Grup tidak ditemukan dalam whitelist.' };
  return { ok: true, list: writeAccessList({ ...list, groups }) };
}

export function addAllowedContact(value) {
  const normalized = normalizeAccessJid(value);
  if (!normalized.endsWith('@s.whatsapp.net') && !normalized.endsWith('@lid')) return { ok: false, message: 'Nomor/JID kontak tidak valid. Gunakan nomor internasional, contoh 628123456789.' };
  const list = readAccessList();
  if (list.contacts.includes(normalized)) return { ok: true, changed: false, list };
  list.contacts.push(normalized);
  return { ok: true, changed: true, list: writeAccessList(list) };
}

export function removeAllowedContact(value) {
  const normalized = normalizeAccessJid(value);
  const list = readAccessList();
  const contacts = list.contacts.filter(item => item !== normalized);
  if (contacts.length === list.contacts.length) return { ok: false, message: 'Kontak tidak ditemukan dalam whitelist.' };
  return { ok: true, list: writeAccessList({ ...list, contacts }) };
}

export function setAllowedGroupProfile(jid, profile = {}) {
  const normalized = normalizeAccessJid(jid);
  if (!normalized.endsWith('@g.us')) return { ok: false, message: 'ID grup tidak valid.' };
  const list = readAccessList();
  if (!list.groups.includes(normalized)) return { ok: false, message: 'Grup belum masuk allowlist.' };
  list.groupProfiles[normalized] = { ...(list.groupProfiles[normalized] || {}), ...profile };
  return { ok: true, list: writeAccessList(list) };
}

export function setAllowedContactProfile(jid, profile = {}) {
  const normalized = normalizeAccessJid(jid);
  if (!normalized.endsWith('@s.whatsapp.net') && !normalized.endsWith('@lid')) return { ok: false, message: 'JID kontak tidak valid.' };
  const list = readAccessList();
  if (!list.contacts.includes(normalized)) return { ok: false, message: 'Kontak belum masuk allowlist.' };
  list.contactProfiles[normalized] = { ...(list.contactProfiles[normalized] || {}), ...profile };
  return { ok: true, list: writeAccessList(list) };
}

export function getAccessIdentity(jid, list = readAccessList()) {
  const normalized = normalizeAccessJid(jid);
  const profile = normalized.endsWith('@g.us') ? list.groupProfiles?.[normalized] : list.contactProfiles?.[normalized];
  return { jid: normalized, alias: profile?.alias || '', waName: profile?.waName || '', note: profile?.note || '' };
}

/**
 * Search approved groups and contacts by alias, WhatsApp name, note, or JID.
 * Search is read-only and defaults to a bounded result set for WhatsApp replies.
 */
export function searchAccessIdentities(query, { type = 'all', list = readAccessList(), limit = 10 } = {}) {
  const term = String(query || '').trim().toLocaleLowerCase();
  if (!term || !['all', 'group', 'contact'].includes(type)) return [];
  const safeLimit = Math.max(1, Math.min(50, Number.isInteger(Number(limit)) ? Number(limit) : 10));
  const entries = [
    ...list.groups.map(jid => ({ type: 'group', ...getAccessIdentity(jid, list) })),
    ...list.contacts.map(jid => ({ type: 'contact', ...getAccessIdentity(jid, list) })),
  ];
  return entries
    .filter(entry => type === 'all' || entry.type === type)
    .filter(entry => [entry.jid, entry.alias, entry.waName, entry.note]
      .some(value => String(value || '').toLocaleLowerCase().includes(term)))
    .slice(0, safeLimit);
}

/** Owner bypass is restricted to verified private chats; groups always require allowlisting. */
export function isInboundChatAllowed({ senderIsOwner = false, remoteJid, isGroup = false, identityAliases = [] }) {
  const normalizedRemote = normalizeAccessJid(remoteJid);
  // Derive group-ness from the destination JID as well as the caller flag.
  // This prevents an inconsistent/mistaken `isGroup: false` from opening
  // the Owner private-chat bypass for a group destination.
  const groupChat = isGroup === true || normalizedRemote.endsWith('@g.us');
  const privateChat = normalizedRemote.endsWith('@s.whatsapp.net') || normalizedRemote.endsWith('@lid');
  if (senderIsOwner && !groupChat && privateChat) return true;
  return isChatAllowed({ remoteJid: normalizedRemote, isGroup: groupChat, identityAliases });
}

export function isChatAllowed({ remoteJid, isGroup, identityAliases = [] }) {
  const list = readAccessList();
  if (!list.enabled) return false; // fail closed; disabling is intentionally not exposed in chat commands
  if (isGroup) return list.groups.includes(normalizeAccessJid(remoteJid));
  const identities = new Set([remoteJid, ...identityAliases].map(normalizeAccessJid).filter(Boolean));
  return list.contacts.some(contact => identities.has(contact));
}


// A linked designer may receive private replies/push only after proving profile ownership
// through a private notification command or explicit push opt-in. This registry never
// changes inbound access and never permits group destinations.
export function registerLinkedDesignerDestination(value, { persistent = false } = {}) {
  const normalized = normalizeAccessJid(value);
  if (!normalized.endsWith('@s.whatsapp.net') && !normalized.endsWith('@lid')) return false;
  linkedDesignerDestinations.set(
    normalized,
    persistent ? Number.POSITIVE_INFINITY : Date.now() + LINKED_DESIGNER_DESTINATION_TTL_MS,
  );
  if (linkedDesignerDestinations.size > 10_000) {
    const now = Date.now();
    for (const [jid, expiresAt] of linkedDesignerDestinations) {
      if (expiresAt <= now) linkedDesignerDestinations.delete(jid);
      if (linkedDesignerDestinations.size <= 8_000) break;
    }
    while (linkedDesignerDestinations.size > 10_000) {
      linkedDesignerDestinations.delete(linkedDesignerDestinations.keys().next().value);
    }
  }
  return true;
}

export function unregisterLinkedDesignerDestination(value) {
  const normalized = normalizeAccessJid(value);
  return linkedDesignerDestinations.delete(normalized);
}

export function getLinkedDesignerDestinationCount() {
  return linkedDesignerDestinations.size;
}

// Every outbound WhatsApp message is subject to the same allowlist. The linked-designer
// exception is outbound-only and limited to private destinations verified against a profile.
export function isDestinationAllowed(jid) {
  const normalized = normalizeAccessJid(jid);
  if (!normalized) return false;
  if (!normalized.endsWith('@g.us') && linkedDesignerDestinations.has(normalized)) {
    const expiresAt = linkedDesignerDestinations.get(normalized);
    if (expiresAt === Number.POSITIVE_INFINITY || expiresAt > Date.now()) return true;
    linkedDesignerDestinations.delete(normalized);
  }
  return isChatAllowed({ remoteJid: normalized, isGroup: normalized.endsWith('@g.us') });
}

export function guardSocketOutbound(sock, logger = console) {
  if (!sock || typeof sock.sendMessage !== 'function') throw new TypeError('Socket WhatsApp tidak valid.');
  if (sock.__pirOutboundGuardInstalled) return sock;
  const originalSendMessage = sock.sendMessage.bind(sock);
  sock.sendMessage = async (jid, content, options) => {
    const normalized = normalizeAccessJid(jid);
    if (!isDestinationAllowed(normalized)) {
      logger.warn?.(`[OUTBOUND BLOCKED] Tujuan ${normalized.endsWith('@g.us') ? 'grup' : 'pribadi/tidak valid'} belum masuk whitelist.`);
      return null;
    }
    return originalSendMessage(jid, content, options);
  };
  Object.defineProperty(sock, '__pirOutboundGuardInstalled', { value: true, configurable: false });
  return sock;
}
