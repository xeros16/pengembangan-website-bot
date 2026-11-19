import { recordMissionProgress } from '../games/rewards/index.js';
// Group moderation and activity tracking are isolated from the WhatsApp entry point.
const SPAM_WINDOW_MS = 8000;
const SPAM_MAX_MESSAGES = 6;
const LINK_REGEX = /(?:https?:\/\/|www\.|chat\.whatsapp\.com\/|wa\.me\/|t\.me\/|discord\.gg\/)[^\s]+/i;
const WARNING_ESCALATION_THRESHOLD = 3;
const WARNING_ESCALATION_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

export function normalizeModerationTokens(value) {
  return String(value || '').normalize('NFKC').toLocaleLowerCase('id-ID').match(/[\p{L}\p{N}_-]+/gu) || [];
}

export function findBlockedWord(value, blockedWords = []) {
  const tokens = new Set(normalizeModerationTokens(value));
  return (Array.isArray(blockedWords) ? blockedWords : [])
    .map(word => String(word || '').normalize('NFKC').toLocaleLowerCase('id-ID').trim())
    .find(word => word && tokens.has(word)) || '';
}

export function createGroupModeration({
  getDbReady, Group, User, Warning, ModerationLog, isGroupJid, normalizeJid,
  isGroupAdmin, isBotAdmin, isBotOwner = () => false, getMessageText, isChatAllowed = () => true,
}) {
const spamTracker = new Map();

async function logModeration(groupJid, userJid, action, reason = '', details = '') {
  if (!getDbReady()) return;
  try { await ModerationLog.create({ groupJid, userJid, action, reason, details }); }
  catch (error) { console.error('[MOD LOG]', error.message); }
}

async function processGroupModeration(sock, msg) {
  const groupJid = msg.key.remoteJid;
  if (!isGroupJid(groupJid) || !msg.message || msg.key.fromMe || !getDbReady()) return false;
  // Seluruh otomasi grup (XP, notifikasi level-up, dan moderasi) hanya berjalan
  // setelah grup masuk allowlist. Pesan dari grup lain tetap diabaikan sepenuhnya.
  if (!isChatAllowed({ remoteJid: groupJid, isGroup: true })) return false;
  const senderJid = normalizeJid(msg.key.participant || '');
  if (!senderJid) return false;
  const group = await Group.findOneAndUpdate({ jid: groupJid }, { $setOnInsert: { jid: groupJid } }, { upsert: true, new: true, setDefaultsOnInsert: true }).lean().catch(() => null);
  if (!group) return false;
  const admin = await isGroupAdmin(sock, groupJid, senderJid);
  const owner = isBotOwner(senderJid, [msg.key.participantAlt, msg.key.remoteJidAlt, msg.key.senderPn, msg.key.senderLid, msg.key.participantPn, msg.key.participantLid]);
  const privileged = admin || owner;
  const text = getMessageText(msg.message) || '';
  const now = Date.now();
  const key = `${groupJid}:${senderJid}`;
  const previous = spamTracker.get(key) || { times: [], lastText: '', repeats: 0 };
  previous.times = previous.times.filter(t => now - t < SPAM_WINDOW_MS);
  previous.times.push(now);
  previous.repeats = text && text === previous.lastText ? previous.repeats + 1 : 0;
  previous.lastText = text;
  spamTracker.set(key, previous);

  // XP dan jumlah pesan aktivitas.
  const user = await User.findOneAndUpdate({ jid: senderJid }, { $setOnInsert: { jid: senderJid }, $inc: { 'activity.messages': 1, 'activity.xp': 1 } }, { upsert: true, new: true, setDefaultsOnInsert: true }).catch(() => null);
  if (user) {
    await recordMissionProgress(User, senderJid, 'messages').catch(() => {});
    const xp = Number(user.activity?.xp || 0);
    const level = Math.floor(xp / 25) + 1;
    if (level !== Number(user.activity?.level || 1)) {
      await User.updateOne({ jid: senderJid }, { $set: { 'activity.level': level } }).catch(() => {});
      if (level > 1) await sock.sendMessage(groupJid, { text: `🎉 @${senderJid.split('@')[0]} naik ke *Level ${level}*! (XP: ${xp})`, mentions: [senderJid] }).catch(() => {});
    }
  }
  let violation = '';
  let matchedWord = '';
  if (!admin && group.antiLink !== false && LINK_REGEX.test(text)) violation = 'Tautan dilarang';
  else if (!admin && group.antiSpam !== false && (previous.times.length > SPAM_MAX_MESSAGES || previous.repeats >= 3)) violation = 'Spam/flood terdeteksi';
  else if (!privileged && group.antiToxic === true) {
    matchedWord = findBlockedWord(text, group.blockedWords);
    if (matchedWord) violation = 'Kata yang dilarang terdeteksi';
  }
  if (!violation) return false;
  const canDelete = await isBotAdmin(sock, groupJid);
  if (canDelete) await sock.sendMessage(groupJid, { delete: msg.key }).catch(() => {});
  const details = matchedWord ? `Filter kata cocok (${matchedWord.length} karakter)` : text.slice(0, 300);
  await logModeration(groupJid, senderJid, 'AUTO_MODERATION', violation, details);
  await Warning.create({ groupJid, targetJid: senderJid, adminJid: 'BOT', reason: violation }).catch(() => {});
  const warningCount = typeof Warning.countDocuments === 'function'
    ? await Warning.countDocuments({ groupJid, targetJid: senderJid, createdAt: { $gte: new Date(Date.now() - WARNING_ESCALATION_WINDOW_MS) } }).catch(() => 0)
    : 0;
  const escalation = warningCount === WARNING_ESCALATION_THRESHOLD
    ? `\n⚠️ Anggota mencapai ${WARNING_ESCALATION_THRESHOLD} peringatan. Admin dapat meninjau dengan perintah .warnings dan .modlogs.`
    : '';
  const warningSummary = warningCount ? ` Peringatan: ${warningCount}.` : '';
  await sock.sendMessage(groupJid, { text: `${canDelete ? '🚫 Pesan dihapus.' : '⚠️ Bot belum admin, pesan tidak bisa dihapus otomatis.'} @${senderJid.split('@')[0]}: ${violation}.${warningSummary}${escalation}`, mentions: [senderJid] }).catch(() => {});
  return true;
}

  return { logModeration, processGroupModeration, spamTracker, SPAM_WINDOW_MS, SPAM_MAX_MESSAGES, LINK_REGEX, WARNING_ESCALATION_THRESHOLD, WARNING_ESCALATION_WINDOW_MS };
}
