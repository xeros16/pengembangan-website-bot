// Perintah untuk melihat identitas chat, grup, dan anggota WhatsApp.
export const GROUP_IDENTIFIER_COMMANDS = new Set([
  'jid', 'idgrup', 'groupid', 'idanggota', 'memberid', 'daftaridanggota',
]);

function cleanId(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function uniqueIds(values) {
  return [...new Set(values.map(cleanId).filter(Boolean))];
}

function getContextInfo(msg) {
  const message = msg?.message || {};
  return message.extendedTextMessage?.contextInfo
    || message.imageMessage?.contextInfo
    || message.videoMessage?.contextInfo
    || message.documentMessage?.contextInfo
    || {};
}

function getTargetIds(ctx) {
  const { msg, sender, userJid, senderIdentityAliases = [], normalizeJid } = ctx;
  const contextInfo = getContextInfo(msg);
  const quoted = ctx.getQuotedMessage?.(msg);
  const quotedId = cleanId(quoted?.key?.participant);
  const mentions = Array.isArray(contextInfo.mentionedJid) ? contextInfo.mentionedJid : [];
  const ids = uniqueIds([...mentions.slice(0, 5), quotedId].filter(Boolean));
  if (ids.length) return ids.map(id => normalizeJid?.(id) || id);
  return uniqueIds([userJid, sender, ...senderIdentityAliases]).map(id => normalizeJid?.(id) || id);
}

function formatParticipant(participant, normalizeJid) {
  const ids = uniqueIds([
    participant.id,
    participant.phoneNumber,
    participant.lid,
  ]).map(id => normalizeJid?.(id) || id);
  const role = participant.admin === 'superadmin'
    ? 'Owner grup'
    : participant.admin === 'admin' ? 'Admin' : 'Anggota';
  return { ids: uniqueIds(ids), role };
}

export async function handleGroupIdentifierCommands(ctx) {
  const {
    sock, msg, remoteJid, isGroup, command, args, sender, userJid,
    senderIdentityAliases = [], normalizeJid, isBotOwner, isGroupAdmin, reply,
  } = ctx;

  switch (command) {
    case 'jid': {
      const chatType = isGroup ? 'Grup' : 'Chat pribadi';
      const lines = [
        '🆔 *IDENTITAS CHAT*',
        `Jenis chat: ${chatType}`,
        `JID chat: ${remoteJid}`,
        `JID pengirim: ${normalizeJid?.(userJid || sender) || userJid || sender || 'Tidak tersedia'}`,
      ];
      if (senderIdentityAliases.length) lines.push(`Alias pengirim: ${uniqueIds(senderIdentityAliases).join(', ')}`);
      return reply(lines.join('\n'));
    }
    case 'idgrup':
    case 'groupid': {
      if (!isGroup) return reply('ℹ️ Perintah ini digunakan di dalam grup WhatsApp. Untuk melihat JID chat pribadi, gunakan .jid.');
      try {
        const metadata = await sock.groupMetadata(remoteJid);
        return reply(
          `🆔 *IDENTITAS GRUP*\nNama: ${metadata.subject || '(tanpa nama)'}\nJID grup: ${remoteJid}\nJumlah anggota: ${metadata.participants?.length ?? 'tidak diketahui'}`
        );
      } catch (error) {
        return reply(`JID grup: ${remoteJid}\n⚠️ Metadata grup tidak dapat dibaca: ${error.message || 'akses gagal'}`);
      }
    }
    case 'idanggota':
    case 'memberid': {
      const subcommand = String(args?.[0] || '').toLowerCase();
      if (['semua', 'all', 'list'].includes(subcommand)) {
        if (!isGroup) return reply('ℹ️ Daftar ID anggota hanya tersedia di dalam grup.');
        const allowed = isBotOwner?.(userJid, senderIdentityAliases)
          || await isGroupAdmin?.(sock, remoteJid, sender);
        if (!allowed) return reply('⛔ Daftar seluruh ID anggota hanya dapat dilihat admin grup atau Owner bot. Gunakan .idanggota tanpa argumen untuk melihat ID sendiri.');
        try {
          const metadata = await sock.groupMetadata(remoteJid);
          const participants = (metadata.participants || []).slice(0, 30);
          const lines = participants.map((participant, index) => {
            const formatted = formatParticipant(participant, normalizeJid);
            return `${index + 1}. ${formatted.role}\n   ${formatted.ids.join('\n   ') || '(ID tidak tersedia)'}`;
          });
          const suffix = (metadata.participants || []).length > participants.length
            ? `\n\nDaftar dibatasi ${participants.length} anggota per pesan. Grup ini memiliki ${(metadata.participants || []).length} anggota.` : '';
          return reply(`📋 *ID ANGGOTA GRUP*\nGrup: ${metadata.subject || remoteJid}\nJID grup: ${remoteJid}\n\n${lines.join('\n')} ${suffix}`);
        } catch (error) {
          return reply(`❌ Gagal mengambil daftar anggota: ${error.message || 'metadata grup tidak tersedia'}`);
        }
      }

      if (!isGroup && !getContextInfo(msg).mentionedJid?.length && !ctx.getQuotedMessage?.(msg)) {
        const ownIds = uniqueIds([userJid, sender, ...senderIdentityAliases]).map(id => normalizeJid?.(id) || id);
        return reply(`🆔 *ID AKUN ANDA*\n${uniqueIds(ownIds).join('\n') || 'ID tidak tersedia'}`);
      }

      const ids = getTargetIds(ctx);
      const contextInfo = getContextInfo(msg);
      const hasExplicitTarget = Boolean(contextInfo.mentionedJid?.length || ctx.getQuotedMessage?.(msg)?.key?.participant);
      const label = hasExplicitTarget ? 'ID ANGGOTA YANG DIPILIH' : 'ID AKUN ANDA';
      return reply(`🆔 *${label}*\n${ids.join('\n') || 'ID tidak tersedia'}\n\nCatatan: WhatsApp dapat menampilkan JID nomor telepon (@s.whatsapp.net) atau ID privat/LID (@lid), tergantung akun dan versi Baileys.`);
    }
    case 'daftaridanggota': {
      // Alias yang jelas untuk fitur daftar anggota; tetap menggunakan pemeriksaan izin yang sama.
      ctx.command = 'idanggota';
      ctx.args = ['semua'];
      return handleGroupIdentifierCommands(ctx);
    }
    default:
      return;
  }
}
