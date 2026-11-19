export const SUPPORT_REPORTS_COMMANDS = new Set(['report', 'reports', 'ticket']);

const MAX_OPEN_TICKETS = 3;
const MAX_TICKETS_PER_DAY = 5;
const MAX_REPORTS_PER_WINDOW = 3;
const REPORT_WINDOW_MS = 10 * 60 * 1000;
const TICKET_WINDOW_MS = 24 * 60 * 60 * 1000;

function cleanText(value, maxLength = 500) {
  return String(value ?? '')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function safeDisplayName(value) {
  const name = cleanText(value || 'Anggota', 50);
  if (!name || /https?:\/\/|@(?:s\.whatsapp\.net|lid)|\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b|(?:\+?\d[\d\s().-]{7,}\d)/i.test(name)) {
    return 'Anggota';
  }
  return name;
}

function normalizeUserJid(value, normalizeJid) {
  return typeof normalizeJid === 'function' ? normalizeJid(value) : String(value || '');
}

function isOwner(ctx) {
  return typeof ctx.isBotOwner === 'function'
    && ctx.isBotOwner(ctx.userJid, ctx.senderIdentityAliases || []);
}

async function ensureDatabase(ctx) {
  if (typeof ctx.requireDatabase === 'function') {
    return Boolean(await ctx.requireDatabase(ctx.sock, ctx.remoteJid));
  }
  return typeof ctx.getDbReady === 'function' && Boolean(ctx.getDbReady());
}

async function handleReport(ctx) {
  const { Report, remoteJid, userJid, args = [], msg, reply, getQuotedMessage } = ctx;
  if (!ctx.isGroup) return reply('Perintah laporan hanya bisa digunakan di grup.');
  if (!await ensureDatabase(ctx)) return;
  const context = msg?.message?.extendedTextMessage?.contextInfo;
  const target = context?.mentionedJid?.[0] || (typeof getQuotedMessage === 'function' ? getQuotedMessage(msg)?.key?.participant : '') || '';
  const reason = cleanText(args.join(' ').replace(/@\d+/g, '').replace(/^\|\s*/, ''), 500);
  if (reason.length < 8) return reply(`Jelaskan alasan laporan minimal 8 karakter.\nFormat: ${ctx.PREFIX}report @anggota | alasan, atau balas pesan lalu tulis ${ctx.PREFIX}report alasan`);
  if (target && normalizeUserJid(target, ctx.normalizeJid) === userJid) return reply('Kamu tidak dapat melaporkan akunmu sendiri.');
  try {
    const windowStart = new Date(Date.now() - REPORT_WINDOW_MS);
    const recentReports = await Report.countDocuments({
      groupJid: remoteJid,
      reporterJid: userJid,
      createdAt: { $gte: windowStart },
    });
    if (recentReports >= MAX_REPORTS_PER_WINDOW) {
      return reply('Kamu sudah mengirim 3 laporan dalam 10 menit terakhir. Tunggu sebelum mengirim laporan berikutnya dan hindari laporan duplikat.');
    }
    await Report.create({
      groupJid: remoteJid,
      reporterJid: userJid,
      reporterName: safeDisplayName(msg?.pushName),
      targetJid: target,
      targetName: target ? 'Anggota yang dilaporkan' : '',
      reason,
      status: 'open',
    });
    return reply('✅ Laporan sudah dicatat untuk ditinjau Admin grup. Hindari mengirim laporan berulang untuk kejadian yang sama.');
  } catch {
    return reply('⚠️ Laporan belum berhasil disimpan. Coba lagi setelah database stabil.');
  }
}

async function handleReports(ctx) {
  const { Report, remoteJid, userJid, sender, args = [], reply, sock } = ctx;
  if (!ctx.isGroup || typeof ctx.isGroupAdmin !== 'function' || !await ctx.isGroupAdmin(sock, remoteJid, sender)) {
    return reply('Daftar dan moderasi laporan hanya tersedia untuk Admin grup asal.');
  }
  if (!await ensureDatabase(ctx)) return;

  const action = String(args[0] || 'list').toLowerCase();
  if (action === 'tutup' || action === 'close') {
    const id = String(args[1] || '').trim();
    const resolution = cleanText(args.slice(2).join(' '), 240);
    if (!id) return reply(`Format: ${ctx.PREFIX}reports tutup <ID> [catatan penyelesaian]`);
    try {
      const report = await Report.findOneAndUpdate(
        { _id: id, groupJid: remoteJid, status: 'open' },
        { $set: { status: 'closed', reviewedBy: userJid, reviewedAt: new Date(), resolution } },
        { new: true },
      );
      return reply(report
        ? `✅ Laporan ${id} ditandai selesai. Catatan internal: ${resolution || 'Tidak ditambahkan'}.`
        : 'Laporan tidak ditemukan di grup ini atau sudah ditutup.');
    } catch {
      return reply('⚠️ Status laporan belum berhasil diperbarui.');
    }
  }

  if (action === 'detail') {
    const id = String(args[1] || '').trim();
    if (!id) return reply(`Format: ${ctx.PREFIX}reports detail <ID>`);
    try {
      const report = await Report.findOne({ _id: id, groupJid: remoteJid }).lean();
      if (!report) return reply('Laporan tidak ditemukan di grup ini.');
      return reply(`🚩 *DETAIL LAPORAN*\nID: ${report._id}\nStatus: ${report.status}\nPelapor: ${safeDisplayName(report.reporterName)}\nTarget: ${report.targetJid ? 'Anggota yang dilaporkan' : 'Tidak ditentukan'}\nAlasan: ${cleanText(report.reason, 500)}\nDibuat: ${report.createdAt ? new Date(report.createdAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) : '-'}\nCatatan: ${cleanText(report.resolution || '-', 240)}`);
    } catch {
      return reply('⚠️ Detail laporan belum dapat dimuat.');
    }
  }

  try {
    const reports = await Report.find({ groupJid: remoteJid, status: 'open' }).sort({ createdAt: -1 }).limit(10).lean();
    return reply(reports.length
      ? `🚩 *LAPORAN TERBUKA — GRUP INI*\n\n${reports.map((report, index) => `${index + 1}. ID: *${report._id}*\n   Pelapor: ${safeDisplayName(report.reporterName)}\n   Target: ${report.targetJid ? 'Anggota yang dilaporkan' : 'Tidak ditentukan'}\n   Alasan: ${cleanText(report.reason, 240)}`).join('\n\n')}\n\nDetail: ${ctx.PREFIX}reports detail <ID>\nSelesai: ${ctx.PREFIX}reports tutup <ID> [catatan]`
      : 'Tidak ada laporan terbuka di grup ini.');
  } catch {
    return reply('⚠️ Daftar laporan belum dapat dimuat.');
  }
}

async function handleTicket(ctx) {
  const {
    Ticket, remoteJid, userJid, sender, args = [], msg, reply, sock,
    sendText, isGroupAdmin, normalizeJid, isBotOwner,
  } = ctx;
  if (!await ensureDatabase(ctx)) return;
  const sub = String(args[0] || '').toLowerCase();
  const owner = isOwner(ctx);

  if (sub === 'buka') {
    const subject = cleanText(args.slice(1).join(' '), 180);
    if (subject.length < 8) return reply(`Ringkasan kendala minimal 8 karakter.\nContoh: ${ctx.PREFIX}ticket buka Bot tidak merespons setelah command dikirim.`);
    try {
      const openCount = await Ticket.countDocuments({ userJid, status: 'open' });
      if (openCount >= MAX_OPEN_TICKETS) return reply(`Kamu sudah memiliki ${MAX_OPEN_TICKETS} tiket terbuka. Periksa dengan ${ctx.PREFIX}ticket saya atau tutup tiket yang sudah selesai.`);
      const dailyCount = await Ticket.countDocuments({
        userJid,
        createdAt: { $gte: new Date(Date.now() - TICKET_WINDOW_MS) },
      });
      if (dailyCount >= MAX_TICKETS_PER_DAY) return reply(`Batas pembuatan tiket adalah ${MAX_TICKETS_PER_DAY} tiket per 24 jam. Periksa tiket yang sudah ada melalui ${ctx.PREFIX}ticket saya.`);
      const ticket = await Ticket.create({
        groupJid: remoteJid,
        userJid,
        userName: safeDisplayName(msg?.pushName),
        subject,
        category: 'general',
        messages: [{ senderJid: userJid, text: subject }],
        status: 'open',
      });
      return reply(`🎫 *TIKET BANTUAN DIBUAT*\nID: *${ticket._id}*\nSubjek: ${subject}\nStatus: Terbuka\n\nPeriksa perkembangan dengan ${ctx.PREFIX}ticket saya. Batasnya 3 tiket terbuka dan 5 tiket baru per 24 jam. Jangan sertakan OTP, password, token, atau informasi pembayaran.`);
    } catch {
      return reply('⚠️ Tiket belum berhasil dibuat. Coba lagi setelah database stabil.');
    }
  }

  if (sub === 'saya') {
    try {
      const tickets = await Ticket.find({ userJid }).sort({ createdAt: -1 }).limit(10).lean();
      return reply(tickets.length
        ? `🎫 *TIKET MILIKMU*\n\n${tickets.map(ticket => `ID: *${ticket._id}*\n${cleanText(ticket.subject, 150)} — ${ticket.status === 'closed' ? 'Selesai' : 'Terbuka'}`).join('\n\n')}`
        : 'Kamu belum memiliki tiket bantuan.');
    } catch {
      return reply('⚠️ Tiket milikmu belum dapat dimuat.');
    }
  }

  if (sub === 'list') {
    if (!ctx.isGroup || typeof isGroupAdmin !== 'function' || !await isGroupAdmin(sock, remoteJid, sender)) {
      return reply('Daftar tiket hanya bisa dilihat Admin grup asal.');
    }
    try {
      const tickets = await Ticket.find({ groupJid: remoteJid, status: 'open' }).sort({ createdAt: -1 }).limit(15).lean();
      return reply(tickets.length
        ? `🎫 *TIKET TERBUKA — GRUP INI*\n\n${tickets.map(ticket => `ID: *${ticket._id}*\nSubjek: ${cleanText(ticket.subject, 150)}\nPemilik: ${safeDisplayName(ticket.userName)}\nPesan: ${(ticket.messages || []).length}`).join('\n\n')}\n\nBalas: ${ctx.PREFIX}ticket balas <ID> <pesan>`
        : 'Tidak ada tiket terbuka di grup ini.');
    } catch {
      return reply('⚠️ Daftar tiket belum dapat dimuat.');
    }
  }

  if (sub === 'detail') {
    const id = String(args[1] || '').trim();
    if (!id) return reply(`Format: ${ctx.PREFIX}ticket detail <ID>`);
    try {
      let ticket = null;
      if (owner) {
        ticket = await Ticket.findOne({ _id: id });
      } else {
        // A ticket owner may read their own ticket from any chat. Admin access
        // is checked separately and remains scoped to the originating group.
        ticket = await Ticket.findOne({ _id: id, userJid });
        if (!ticket && ctx.isGroup && typeof isGroupAdmin === 'function' && await isGroupAdmin(sock, remoteJid, sender)) {
          ticket = await Ticket.findOne({ _id: id, groupJid: remoteJid });
        }
      }
      if (!ticket) return reply('Tiket tidak ditemukan atau kamu tidak memiliki izin untuk melihatnya.');
      const requester = normalizeUserJid(ticket.userJid, normalizeJid) === normalizeUserJid(userJid, normalizeJid);
      const messages = (ticket.messages || []).slice(-15).map(item => {
        const fromRequester = normalizeUserJid(item.senderJid, normalizeJid) === normalizeUserJid(ticket.userJid, normalizeJid);
        const label = fromRequester ? (requester ? 'Kamu' : 'Pengguna') : 'Tim bantuan';
        return `*${label}:* ${cleanText(item.text, 500)}`;
      });
      return reply(`🎫 *DETAIL TIKET*\nID: *${ticket._id}*\nSubjek: ${cleanText(ticket.subject, 180)}\nStatus: ${ticket.status === 'closed' ? 'Selesai' : 'Terbuka'}\n\n*Percakapan terbaru (maks. 15 pesan)*\n${messages.length ? messages.join('\n\n') : 'Belum ada pesan.'}\n\n${ticket.status === 'open' && requester ? `Balas melalui Admin atau tunggu tim bantuan menghubungimu.` : 'Riwayat ini hanya terlihat oleh pemilik tiket, Admin grup asal, dan Owner.'}`);
    } catch {
      return reply('⚠️ Detail tiket belum dapat dimuat. Coba lagi setelah database stabil.');
    }
  }

  if (sub === 'balas') {
    const id = String(args[1] || '').trim();
    const textReply = cleanText(args.slice(2).join(' '), 1200);
    if (!id || textReply.length < 2) return reply(`Format: ${ctx.PREFIX}ticket balas <ID> <pesan>`);
    let admin = false;
    if (!owner && ctx.isGroup && typeof isGroupAdmin === 'function') {
      admin = Boolean(await isGroupAdmin(sock, remoteJid, sender));
    }
    if (!owner && !admin) return reply('Balas tiket hanya dapat dilakukan Owner bot atau Admin grup asal.');
    const filter = { _id: id, status: 'open', ...(owner ? {} : { groupJid: remoteJid }) };
    try {
      const ticket = await Ticket.findOne(filter);
      if (!ticket) return reply('Tiket tidak ditemukan, berasal dari grup lain, atau sudah ditutup.');
      const updated = await Ticket.findOneAndUpdate(
        filter,
        {
          $push: { messages: { $each: [{ senderJid: userJid, text: textReply, createdAt: new Date() }], $slice: -100 } },
          $set: { lastRepliedAt: new Date() },
        },
        { new: true },
      );
      if (!updated) return reply('Tiket baru saja berubah. Muat ulang daftar tiket.');
      let delivered = false;
      try {
        if (typeof sendText === 'function') {
          await sendText(sock, updated.userJid, `🎫 *Balasan tiket ${updated._id}*\n${textReply}`);
          delivered = true;
        }
      } catch {
        delivered = false;
      }
      return reply(delivered
        ? '✅ Balasan dicatat dan pesan bantuan berhasil dikirim.'
        : '⚠️ Balasan sudah dicatat, tetapi pesan pribadi tidak terkirim. Pengguna dapat memeriksa tiket melalui Admin.');
    } catch {
      return reply('⚠️ Balasan tiket belum berhasil disimpan.');
    }
  }

  if (sub === 'tutup' || sub === 'close') {
    const id = String(args[1] || '').trim();
    if (!id) return reply(`Format: ${ctx.PREFIX}ticket tutup <ID>`);
    try {
      const ticket = await Ticket.findOne({ _id: id });
      if (!ticket) return reply('Tiket tidak ditemukan.');
      const requester = normalizeUserJid(ticket.userJid, normalizeJid) === userJid;
      const groupAdmin = Boolean(ctx.isGroup && ticket.groupJid === remoteJid && typeof isGroupAdmin === 'function' && await isGroupAdmin(sock, remoteJid, sender));
      if (!requester && !groupAdmin && !owner) return reply('Tiket tidak ditemukan atau kamu tidak memiliki izin untuk menutupnya.');
      const closeFilter = owner
        ? { _id: id, status: 'open' }
        : requester
          ? { _id: id, userJid, status: 'open' }
          : { _id: id, groupJid: remoteJid, status: 'open' };
      const updated = await Ticket.findOneAndUpdate(
        closeFilter,
        { $set: { status: 'closed', closedBy: userJid, closedAt: new Date() } },
        { new: true },
      );
      return reply(updated ? `✅ Tiket ${id} ditutup.` : 'Tiket sudah ditutup atau statusnya berubah.');
    } catch {
      return reply('⚠️ Tiket belum berhasil ditutup.');
    }
  }

  return reply(`🎫 *SISTEM TIKET*\n${ctx.PREFIX}ticket buka <ringkasan kendala>\n${ctx.PREFIX}ticket saya\n${ctx.PREFIX}ticket detail <ID> (pemilik/Admin grup asal/Owner)\n${ctx.PREFIX}ticket list (Admin grup asal)\n${ctx.PREFIX}ticket balas <ID> <pesan> (Admin grup asal/Owner)\n${ctx.PREFIX}ticket tutup <ID> (pemilik/Admin grup asal/Owner)`);
}

export async function handleSupportReportsCommands(ctx) {
  switch (ctx.command) {
    case 'report': return handleReport(ctx);
    case 'reports': return handleReports(ctx);
    case 'ticket': return handleTicket(ctx);
    default: return;
  }
}
