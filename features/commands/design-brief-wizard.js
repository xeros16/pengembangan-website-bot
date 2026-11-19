const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_SESSIONS = 5000;
const sessions = new Map();

const STEPS = [
  { key: 'type', title: 'Jenis desain', prompt: '🎨 *Langkah 1/7 — Jenis desain*\nDesain apa yang ingin kamu buat?\n1. Poster\n2. Konten media sosial\n3. Logo\n4. Banner\n5. Kemasan\n6. Lainnya\n\nBalas dengan nomor atau nama jenis desain.' },
  { key: 'goal', title: 'Tujuan', prompt: '🎯 *Langkah 2/7 — Tujuan desain*\nApa tujuan utamanya? Contoh: promosi produk, mengumumkan acara, mengenalkan brand, atau mengajak orang mendaftar.' },
  { key: 'audience', title: 'Audiens', prompt: '👥 *Langkah 3/7 — Audiens*\nSiapa yang ingin melihat desain ini? Contoh: pelajar SMK, calon pembeli kopi, atau peserta acara.' },
  { key: 'platform', title: 'Platform dan ukuran', prompt: '📐 *Langkah 4/7 — Platform/ukuran*\nDesain akan dipasang di mana dan ukuran apa? Contoh: Instagram feed 1080 × 1080 px, story 1080 × 1920 px, atau cetak A4. Ketik *lewati* jika belum tahu.' },
  { key: 'style', title: 'Gaya visual', prompt: '🖌️ *Langkah 5/7 — Gaya visual*\nGaya seperti apa yang diinginkan? Contoh: minimalis, futuristik, elegan, retro, anime, atau playful. Referensi boleh disebutkan dengan kata-kata.' },
  { key: 'colors', title: 'Warna', prompt: '🌈 *Langkah 6/7 — Warna*\nAda warna pilihan atau warna yang harus dihindari? Contoh: biru dan putih, gunakan palet pastel, atau bebas. Ketik *lewati* jika belum ditentukan.' },
  { key: 'content', title: 'Teks dan batasan', prompt: '✍️ *Langkah 7/7 — Teks penting dan batasan*\nTuliskan teks/CTA yang wajib ada dan hal yang perlu dihindari. Contoh: judul “Promo Akhir Tahun”, CTA “Pesan sekarang”, jangan terlalu ramai. Ketik *lewati* jika belum ada.' },
];

const clean = value => String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 500);

function getIdentity(ctx) {
  const userJid = String(ctx.phoneJid || ctx.userJid || ctx.sender || '').trim();
  const chatJid = String(ctx.remoteJid || 'private').trim();
  if (!userJid || !chatJid) return null;
  return { userJid, chatJid, key: `${chatJid}::${userJid}` };
}

function isDatabaseReady(ctx) {
  try {
    if (typeof ctx.getDbReady === 'function') return Boolean(ctx.getDbReady());
    return Boolean(ctx.dbReady);
  } catch {
    return false;
  }
}

function sessionExpiry(session) {
  const value = session?.expiresAt;
  const timestamp = value instanceof Date ? value.getTime() : Number(value || 0);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function pruneExpired(now = Date.now()) {
  for (const [key, session] of sessions) {
    if (sessionExpiry(session) <= now) sessions.delete(key);
  }
  if (sessions.size > MAX_SESSIONS) {
    const oldest = [...sessions.entries()].sort((a, b) => Number(a[1].updatedAt || 0) - Number(b[1].updatedAt || 0));
    for (const [key] of oldest.slice(0, sessions.size - MAX_SESSIONS)) sessions.delete(key);
  }
}

async function loadSession(ctx) {
  pruneExpired();
  const identity = getIdentity(ctx);
  if (!identity) return null;
  const cached = sessions.get(identity.key) || null;
  if (cached && sessionExpiry(cached) > Date.now() && !isDatabaseReady(ctx)) return cached;

  const Model = ctx.DesignBriefSession;
  if (isDatabaseReady(ctx) && Model?.findOne) {
    try {
      const record = await Model.findOne({ chatJid: identity.chatJid, userJid: identity.userJid }).lean();
      if (!record) {
        if (cached && cached.storage === 'memory' && sessionExpiry(cached) > Date.now()) return cached;
        sessions.delete(identity.key);
        return null;
      }
      if (sessionExpiry(record) <= Date.now()) {
        sessions.delete(identity.key);
        if (Model.deleteOne) await Model.deleteOne({ chatJid: identity.chatJid, userJid: identity.userJid }).catch(() => {});
        return null;
      }
      const session = {
        step: Math.max(0, Math.min(STEPS.length - 1, Number(record.step) || 0)),
        answers: record.answers && typeof record.answers === 'object' ? { ...record.answers } : {},
        updatedAt: new Date(record.updatedAt || Date.now()).getTime(),
        expiresAt: sessionExpiry(record),
        storage: 'database',
      };
      sessions.set(identity.key, session);
      return session;
    } catch {
      // A transient database failure may use the current process cache, but cannot promise restart recovery.
      return cached && sessionExpiry(cached) > Date.now() ? cached : null;
    }
  }

  return cached && sessionExpiry(cached) > Date.now() ? cached : null;
}

async function saveSession(ctx, session) {
  const identity = getIdentity(ctx);
  if (!identity) return 'unavailable';
  const now = Date.now();
  const stored = {
    step: Math.max(0, Math.min(STEPS.length - 1, Number(session.step) || 0)),
    answers: { ...(session.answers || {}) },
    updatedAt: now,
    expiresAt: now + SESSION_TTL_MS,
    storage: 'memory',
  };
  sessions.set(identity.key, stored);
  pruneExpired(now);

  const Model = ctx.DesignBriefSession;
  if (isDatabaseReady(ctx) && Model?.findOneAndUpdate) {
    try {
      await Model.findOneAndUpdate(
        { chatJid: identity.chatJid, userJid: identity.userJid },
        { $set: { step: stored.step, answers: stored.answers, expiresAt: new Date(stored.expiresAt) } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
      stored.storage = 'database';
      sessions.set(identity.key, stored);
      return 'database';
    } catch {
      return 'memory';
    }
  }
  return 'memory';
}

async function deleteSession(ctx) {
  const identity = getIdentity(ctx);
  if (!identity) return false;
  const existed = sessions.delete(identity.key);
  const Model = ctx.DesignBriefSession;
  if (isDatabaseReady(ctx) && Model?.deleteOne) {
    try {
      const result = await Model.deleteOne({ chatJid: identity.chatJid, userJid: identity.userJid });
      return existed || Number(result?.deletedCount || 0) > 0;
    } catch {
      return existed;
    }
  }
  return existed;
}

function currentPrompt(session, prefix) {
  const step = STEPS[session.step];
  return `${step.prompt}\n\nBalas pesan ini dengan jawabanmu. Ketik *${prefix}wizard kembali* untuk pertanyaan sebelumnya, *${prefix}wizard status* untuk melihat progres, atau *${prefix}wizard batal* untuk menghapus draft.`;
}

function renderBrief(answers) {
  const type = answers.type || 'Belum ditentukan';
  const lines = [
    `🧾 *BRIEF DESAIN — ${type.toUpperCase()}*`,
    '',
    `*Tujuan:* ${answers.goal || 'Belum ditentukan'}`,
    `*Audiens:* ${answers.audience || 'Belum ditentukan'}`,
    `*Platform/ukuran:* ${answers.platform || 'Belum ditentukan'}`,
    `*Gaya visual:* ${answers.style || 'Belum ditentukan'}`,
    `*Warna:* ${answers.colors || 'Belum ditentukan'}`,
    `*Teks penting dan batasan:* ${answers.content || 'Belum ditentukan'}`,
    '',
    '*Sebelum mulai desain:*',
    '1. Pastikan semua teks, nama, tanggal, harga, dan kontak benar.',
    '2. Pastikan ukuran sesuai media tujuan.',
    '3. Pastikan aset dan font boleh digunakan untuk proyek ini.',
    '',
    'Langkah berikutnya (opsional):',
    '• `.creative <topik>` untuk mencari ide konsep.',
    '• `.layout <jenis desain>` untuk mendapat saran tata letak.',
    '• `.checklist poster` untuk pemeriksaan akhir.',
    '',
    'Brief ini adalah rancangan awal; konfirmasikan detail penting dengan klien sebelum produksi.',
  ];
  return lines.join('\n');
}

function normalizeType(value) {
  const normalized = clean(value).toLowerCase();
  const options = [
    [/^(1|poster|flyer|pamflet)$/, 'Poster'],
    [/^(2|sosial|media sosial|konten sosial|instagram)$/, 'Konten media sosial'],
    [/^(3|logo|identitas brand)$/, 'Logo'],
    [/^(4|banner|spanduk)$/, 'Banner'],
    [/^(5|kemasan|packaging)$/, 'Kemasan'],
    [/^(6|lainnya|lain)$/, 'Lainnya'],
  ];
  return options.find(([pattern]) => pattern.test(normalized))?.[1] || '';
}

export async function startDesignBriefWizard(ctx, { restart = false } = {}) {
  const identity = getIdentity(ctx);
  if (!identity) return ctx.reply('⚠️ Aku belum bisa mengenali akun WhatsApp kamu. Coba mulai ulang dari chat pribadi.');
  let existing = await loadSession(ctx);
  if (existing && !restart) {
    const prefix = ctx.PREFIX || '.';
    return ctx.reply(`🧭 *DRAFT BRIEF MASIH AKTIF*\nProgres terakhir: langkah ${existing.step + 1}/${STEPS.length} — *${STEPS[existing.step].title}*.\n\nKetik *${prefix}wizard lanjut* untuk meneruskan, *${prefix}wizard kembali* untuk mengubah jawaban sebelumnya, atau *${prefix}wizard ulang* untuk memulai dari awal.`);
  }
  if (existing && restart) await deleteSession(ctx);
  const session = { step: 0, answers: {} };
  const storage = await saveSession(ctx, session);
  const storageNote = storage === 'database'
    ? 'Progres dan jawaban disimpan sementara di database selama 24 jam agar bisa dilanjutkan setelah bot restart.'
    : 'Database belum tersedia; progres hanya tersimpan di memori bot dan tidak akan bertahan jika bot restart.';
  return ctx.reply(`🧭 *WIZARD BRIEF DESAIN*\nAku akan menanyakan kebutuhan desain satu per satu, lalu menyusun brief yang bisa kamu salin. Ini tidak membuat gambar otomatis.\n\n🔐 ${storageNote}\nKetik *${ctx.PREFIX || '.'}wizard batal* untuk menghapus draft. Jangan sertakan password, OTP, atau data rahasia klien.\n\n${currentPrompt(session, ctx.PREFIX || '.')}`);
}

export async function resumeDesignBriefWizard(ctx) {
  const session = await loadSession(ctx);
  if (!session) return ctx.reply(`Tidak ada draft brief aktif yang bisa dilanjutkan. Ketik *${ctx.PREFIX || '.'}wizard* untuk memulai.`);
  return ctx.reply(`↩️ *MELANJUTKAN DRAFT BRIEF*\nProgres tersimpan: langkah ${session.step + 1}/${STEPS.length}.\n\n${currentPrompt(session, ctx.PREFIX || '.')}`);
}

export async function clearDesignBriefWizardSession(ctx) {
  return deleteSession(ctx);
}

export async function cancelDesignBriefWizard(ctx) {
  const existed = await deleteSession(ctx);
  return existed
    ? ctx.reply('✅ Draft wizard brief desain dihapus dan sesi dibatalkan. Jika ingin mulai lagi, ketik `.wizard`.')
    : ctx.reply('Tidak ada draft wizard brief desain yang aktif. Ketik `.wizard` untuk mulai membuat brief.');
}

export async function goBackDesignBriefWizard(ctx) {
  const session = await loadSession(ctx);
  if (!session) return ctx.reply(`Tidak ada draft brief aktif. Ketik *${ctx.PREFIX || '.'}wizard* untuk memulai.`);
  if (session.step <= 0) return ctx.reply(`Kamu sudah berada di pertanyaan pertama. Ketik *${ctx.PREFIX || '.'}wizard lanjut* untuk menjawabnya.`);
  session.step -= 1;
  await saveSession(ctx, session);
  return ctx.reply(`↩️ *KEMBALI KE PERTANYAAN SEBELUMNYA*\nJawaban pada langkah ini bisa kamu ganti.\n\n${currentPrompt(session, ctx.PREFIX || '.')}`);
}

export async function getDesignBriefWizardStatus(ctx) {
  const session = await loadSession(ctx);
  if (!session) return ctx.reply(`Belum ada wizard yang aktif. Ketik *${ctx.PREFIX || '.'}wizard* untuk mulai membuat brief desain.`);
  const answered = Object.keys(session.answers || {}).length;
  return ctx.reply(`🧭 *STATUS WIZARD BRIEF*\nProgres: langkah ${session.step + 1} dari ${STEPS.length}\nPertanyaan aktif: *${STEPS[session.step].title}*\nJawaban tersimpan: ${answered}\nMasa simpan: maksimal 24 jam sejak aktivitas terakhir.\n\nKetik *${ctx.PREFIX || '.'}wizard lanjut* untuk melanjutkan atau *${ctx.PREFIX || '.'}wizard batal* untuk menghapus draft.`);
}

export async function consumeDesignBriefWizardMessage(ctx) {
  if (ctx.isCommand) return false;
  const session = await loadSession(ctx);
  if (!session) return false;
  const answer = clean(ctx.messageText);
  if (!answer) return true;
  if (/^(batal|cancel|stop)$/i.test(answer)) {
    await deleteSession(ctx);
    await ctx.reply('✅ Draft wizard brief desain dihapus. Ketik `.wizard` jika ingin memulai lagi.');
    return true;
  }
  if (/^(kembali|back)$/i.test(answer)) {
    await goBackDesignBriefWizard(ctx);
    return true;
  }
  if (answer.length < 2 && !(session.step === 0 && /^[1-6]$/.test(answer))) {
    await ctx.reply('Jawaban terlalu singkat. Tulis sedikit lebih jelas, atau ketik *lewati* jika pertanyaan ini opsional.');
    return true;
  }

  const step = STEPS[session.step];
  if (step.key === 'type') {
    const type = normalizeType(answer);
    if (!type) {
      await ctx.reply('Pilih salah satu jenis: *1 Poster, 2 Media sosial, 3 Logo, 4 Banner, 5 Kemasan, 6 Lainnya*. Coba jawab lagi.');
      return true;
    }
    session.answers[step.key] = type;
  } else if (answer.toLowerCase() === 'lewati' && ['platform', 'colors', 'content'].includes(step.key)) {
    session.answers[step.key] = 'Belum ditentukan';
  } else {
    session.answers[step.key] = answer;
  }

  session.step += 1;
  if (session.step >= STEPS.length) {
    await deleteSession(ctx);
    await ctx.reply(renderBrief(session.answers));
    return true;
  }
  await saveSession(ctx, session);
  await ctx.reply(`✅ *${step.title} dicatat.*\n\n${currentPrompt(session, ctx.PREFIX || '.')}`);
  return true;
}

export function resetDesignBriefWizardSessionsForTests() {
  sessions.clear();
}
