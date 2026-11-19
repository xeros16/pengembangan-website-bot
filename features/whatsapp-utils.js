// WhatsApp identity, message-unwrapping, quoting and media helpers.
export function createWhatsAppUtils({ jidNormalizedUser, OWNER_JIDS_RAW, downloadMediaMessage, MAX_IMAGE_BYTES }) {
const normalizeJid = jid => jid ? jidNormalizedUser(jid) : '';
function ownerJidSet() {
  return new Set(OWNER_JIDS_RAW.split(',').map(value => value.trim()).filter(Boolean).map(value => {
    // Izinkan nomor polos (contoh 628123456789) atau JID lengkap, termasuk @lid.
    if (/^\+?\d+$/.test(value)) return `${value.replace(/^\+/, '')}@s.whatsapp.net`;
    return normalizeJid(value);
  }));
}
function ownerIdentityCandidates(values = []) {
  const candidates = new Set();
  for (const value of values.flat(Infinity)) {
    if (typeof value !== 'string') continue;
    const raw = value.trim();
    if (!raw) continue;
    if (/^\+?\d+$/.test(raw)) candidates.add(`${raw.replace(/^\+/, '')}@s.whatsapp.net`);
    const normalized = normalizeJid(raw);
    if (normalized) candidates.add(normalized);
  }
  return candidates;
}
function isBotOwner(jid, aliases = []) {
  const configuredOwners = ownerJidSet();
  const identities = ownerIdentityCandidates([jid, ...aliases]);
  for (const identity of identities) {
    if (configuredOwners.has(identity)) return true;
    // Baileys/WhatsApp may expose a phone-number JID and an @lid alias for the same sender.
    // Compare all identities supplied by the message key, but never infer Owner from group-admin status.
  }
  return false;
}
const isGroupJid = jid => typeof jid === 'string' && jid.endsWith('@g.us');
// Baileys dapat membungkus pesan di ephemeral/view-once; buka wrapper
// agar teks perintah tetap terbaca pada berbagai jenis chat.
function unwrapMessage(message) {
  let current = message;
  for (let i = 0; i < 5 && current; i++) {
    const next = current.ephemeralMessage?.message
      || current.viewOnceMessage?.message
      || current.viewOnceMessageV2?.message
      || current.viewOnceMessageV2Extension?.message
      || current.documentWithCaptionMessage?.message;
    if (!next) break;
    current = next;
  }
  return current || {};
}

const getMessageText = message => {
  const m = unwrapMessage(message);
  return m.conversation
    || m.extendedTextMessage?.text
    || m.imageMessage?.caption
    || m.videoMessage?.caption
    || m.documentMessage?.caption
    || m.documentWithCaptionMessage?.message?.documentMessage?.caption
    || '';
};

function getQuotedMessage(msg) {
  const context = msg.message?.extendedTextMessage?.contextInfo
    || msg.message?.imageMessage?.contextInfo
    || msg.message?.videoMessage?.contextInfo;
  if (!context?.quotedMessage) return null;
  return { key: { remoteJid: msg.key.remoteJid, participant: context.participant, id: context.stanzaId }, message: context.quotedMessage };
}

function getImageTarget(msg) {
  if (msg.message?.imageMessage || msg.message?.videoMessage) return msg;
  const quoted = getQuotedMessage(msg);
  if (quoted?.message?.imageMessage || quoted?.message?.videoMessage) return quoted;
  if (msg.message?.stickerMessage) return msg;
  if (quoted?.message?.stickerMessage) return quoted;
  return null;
}

async function downloadMedia(sock, message, maxBytes = MAX_IMAGE_BYTES) {
  const buffer = await downloadMediaMessage(message, 'buffer', {}, {
    reuploadRequest: sock.updateMediaMessage,
  });
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) throw new Error('File media kosong atau gagal diunduh.');
  const byteLimit = Math.max(1, Number(maxBytes) || MAX_IMAGE_BYTES);
  if (buffer.length > byteLimit) throw new Error(`Ukuran media maksimal ${Math.floor(byteLimit / (1024 * 1024))} MB.`);
  return buffer;
}


  return {
    normalizeJid, ownerJidSet, ownerIdentityCandidates, isBotOwner, isGroupJid,
    unwrapMessage, getMessageText, getQuotedMessage, getImageTarget, downloadMedia,
  };
}
