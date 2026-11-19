// Menambahkan identitas pemanggil pada balasan command tanpa mengubah alur command.
function digitsFromJid(jid) {
  if (typeof jid !== 'string' || !/@(?:s\.whatsapp\.net|c\.us)$/.test(jid)) return '';
  const local = jid.split('@')[0].split(':')[0];
  return /^\d+$/.test(local) ? local : '';
}

export function buildUserAttribution({ isGroup, senderJid, phoneJid }) {
  const phone = digitsFromJid(phoneJid) || digitsFromJid(senderJid);
  const mentionJid = phoneJid || senderJid || '';
  if (isGroup && phone) {
    return {
      text: `👤 Pengguna: @${phone}`,
      mentions: mentionJid ? [mentionJid] : [],
    };
  }
  if (isGroup) {
    // Jangan menampilkan LID seolah-olah itu nomor telepon.
    return { text: '👤 Pengguna: anggota grup', mentions: senderJid ? [senderJid] : [] };
  }
  if (phone) return { text: `👤 Nomor pengguna: +${phone}`, mentions: [] };
  return { text: '👤 Pengguna: akun WhatsApp', mentions: [] };
}

function mergeMentions(existing, extra) {
  return [...new Set([...(Array.isArray(existing) ? existing : []), ...(Array.isArray(extra) ? extra : [])])];
}

export function createAttributedSocket(sock, {
  remoteJid,
  isGroup,
  senderJid,
  phoneJid,
  quotedMessage,
}) {
  const attribution = buildUserAttribution({ isGroup, senderJid, phoneJid });
  const marker = '👤 Pengguna:';
  const footer = attribution.text;

  return new Proxy(sock, {
    get(target, property) {
      if (property === 'sendMessage') {
        return async (jid, content, options) => {
          if (!content || typeof content !== 'object' || jid !== remoteJid) {
            return target.sendMessage.call(target, jid, content, options);
          }

          const originalText = typeof content.text === 'string' ? content.text : null;
          const originalCaption = typeof content.caption === 'string' ? content.caption : null;
          if ((originalText && originalText.includes(marker)) || (originalCaption && originalCaption.includes(marker))) {
            return target.sendMessage.call(target, jid, content, options);
          }

          if (originalText !== null) {
            const suffix = `\n\n${footer}`;
            const maxTextLength = 3900;
            const text = `${originalText.slice(0, Math.max(0, maxTextLength - suffix.length))}${suffix}`;
            const decorated = {
              ...content,
              text,
              ...(isGroup && attribution.mentions.length
                ? { mentions: mergeMentions(content.mentions, attribution.mentions) }
                : {}),
            };
            return target.sendMessage.call(target, jid, decorated, options);
          }

          if (originalCaption !== null) {
            const suffix = `\n\n${footer}`;
            const maxCaptionLength = 950;
            const caption = `${originalCaption.slice(0, Math.max(0, maxCaptionLength - suffix.length))}${suffix}`;
            const decorated = {
              ...content,
              caption,
              ...(isGroup && attribution.mentions.length
                ? { mentions: mergeMentions(content.mentions, attribution.mentions) }
                : {}),
            };
            return target.sendMessage.call(target, jid, decorated, options);
          }

          // Audio/stiker dan media lain yang tidak mendukung caption tetap mendapat info pemanggil.
          const result = await target.sendMessage.call(target, jid, content, options);
          const isMedia = ['image', 'video', 'audio', 'sticker', 'document', 'gifPlayback', 'ptv']
            .some(key => content[key] !== undefined);
          if (isMedia) {
            await target.sendMessage.call(target, jid, {
              text: footer,
              ...(isGroup && attribution.mentions.length ? { mentions: attribution.mentions } : {}),
            }, quotedMessage ? { quoted: quotedMessage } : {});
          }
          return result;
        };
      }
      const value = Reflect.get(target, property, target);
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
}
