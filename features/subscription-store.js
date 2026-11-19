import fs from 'node:fs/promises';
import path from 'node:path';

const defaultFile = () => process.env.BOT_SUBSCRIPTIONS_FILE || path.resolve(process.cwd(), 'data', 'bot-subscriptions.json');
const normalizeIdentity = value => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^\+?\d+$/.test(raw)) return `${raw.replace(/^\+/, '')}@s.whatsapp.net`;
  return raw;
};

async function readStore(file = defaultFile()) {
  try {
    const parsed = JSON.parse(await fs.readFile(file, 'utf8'));
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch (error) {
    if (error.code === 'ENOENT') return {};
    throw new Error(`Data langganan tidak dapat dibaca: ${error.message}`);
  }
}

async function writeStore(data, file = defaultFile()) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const temp = `${file}.${process.pid}.tmp`;
  await fs.writeFile(temp, `${JSON.stringify(data, null, 2)}\n`, { mode: 0o600 });
  await fs.rename(temp, file);
}

export async function getSubscription(identities, { file = defaultFile(), now = Date.now() } = {}) {
  const store = await readStore(file);
  const keys = [...new Set((Array.isArray(identities) ? identities : [identities]).map(normalizeIdentity).filter(Boolean))];
  for (const key of keys) {
    const record = store[key];
    if (!record) continue;
    const expiresAt = Date.parse(record.expiresAt || '');
    if (Number.isFinite(expiresAt) && expiresAt > now) return { ...record, jid: key, active: true, expiresAt: new Date(expiresAt).toISOString() };
  }
  return null;
}

export async function grantSubscription(identity, days, grantedBy, { file = defaultFile(), now = Date.now() } = {}) {
  const jid = normalizeIdentity(identity);
  const duration = Number(days);
  if (!/@s\.whatsapp\.net$/.test(jid) || !/^\d{5,20}@s\.whatsapp\.net$/.test(jid)) throw new Error('Target harus nomor WhatsApp berupa angka, contoh 628123456789.');
  if (!Number.isInteger(duration) || duration < 1 || duration > 3650) throw new Error('Durasi harus bilangan bulat 1–3650 hari.');
  const store = await readStore(file);
  const previousExpiry = Date.parse(store[jid]?.expiresAt || '');
  const base = Number.isFinite(previousExpiry) && previousExpiry > now ? previousExpiry : now;
  const record = { expiresAt: new Date(base + duration * 86400000).toISOString(), grantedBy: String(grantedBy || ''), updatedAt: new Date(now).toISOString() };
  store[jid] = record;
  await writeStore(store, file);
  return { ...record, jid, active: true };
}

export async function revokeSubscription(identity, { file = defaultFile() } = {}) {
  const jid = normalizeIdentity(identity);
  const store = await readStore(file);
  const existed = Boolean(store[jid]);
  delete store[jid];
  await writeStore(store, file);
  return { jid, existed };
}

export async function listSubscriptions({ file = defaultFile(), now = Date.now() } = {}) {
  const store = await readStore(file);
  return Object.entries(store)
    .map(([jid, record]) => ({ jid, ...record, active: Number.isFinite(Date.parse(record.expiresAt || '')) && Date.parse(record.expiresAt) > now }))
    .sort((a, b) => String(a.jid).localeCompare(String(b.jid)));
}

export function normalizeSubscriptionIdentity(value) { return normalizeIdentity(value); }
