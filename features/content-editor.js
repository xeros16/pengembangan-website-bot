import fs from 'node:fs/promises';
import path from 'node:path';

export const EDITABLE_TEXT_KEYS = Object.freeze({
  menuIntro: 'Pengantar menu utama (legacy)',
  quickAccess: 'Baris akses cepat menu (legacy)',
  mainMenu: 'Tampilan beranda utama',
  menuStart: 'Panduan pemula',
  menuColors: 'Menu warna dan kontras',
  menuImages: 'Menu gambar dan file',
  menuAssets: 'Menu aset desain',
  menuAccount: 'Menu akun dan langganan',
  menuPremium: 'Menu fitur premium',
  menuTools: 'Menu tools desain',
  menuDesigner: 'Menu Designer / Designer Workspace',
  menuTutorial: 'Menu belajar desain',
  menuGroup: 'Menu proteksi grup',
  menuMarket: 'Menu marketplace',
  menuGame: 'Menu game',
  menuOwner: 'Menu Owner bot',
  menuNeeds: 'Menu berdasarkan kebutuhan',
  commandListIntro: 'Pengantar katalog perintah',
  commandListNoResults: 'Pesan kategori/perintah tidak ditemukan',
  unknownCommand: 'Pesan perintah tidak dikenal',
  tutorialDesign: 'Tutorial desain',
  tutorialLearning: 'Tutorial Learning Path',
  tutorialChallenge: 'Tutorial Community Challenge',
  tutorialCommunity: 'Tutorial Community Hub',
  tutorialMarketplace: 'Tutorial Design Marketplace',
  tutorialGame: 'Tutorial Pixel Realm',
  tutorialPortfolio: 'Tutorial portofolio desainer',
  tutorialOrder: 'Tutorial pesanan desain',
  tutorialProof: 'Tutorial bukti dan ulasan pesanan',
});


const pendingEdits = new Map();
const MAX_TEXT_LENGTH = 3500;
const CONFIRM_WINDOW_MS = 10 * 60 * 1000;

function contentPath(cwd = process.cwd()) {
  return path.join(cwd, 'content', 'texts.json');
}

async function ensureContentFile(cwd = process.cwd()) {
  const file = contentPath(cwd);
  try { await fs.access(file); }
  catch (error) {
    if (error.code !== 'ENOENT') throw error;
    const template = path.join(cwd, 'content', 'texts.example.json');
    await fs.copyFile(template, file, fs.constants.COPYFILE_EXCL);
  }
  return file;
}

export async function readBotTexts({ cwd = process.cwd() } = {}) {
  const file = await ensureContentFile(cwd);
  const parsed = JSON.parse(await fs.readFile(file, 'utf8'));
  for (const key of Object.keys(EDITABLE_TEXT_KEYS)) {
    if (typeof parsed[key] !== 'string') throw new Error(`Kunci konten tidak valid: ${key}`);
  }
  return parsed;
}

export function cleanWhatsAppText(value) {
  return String(value ?? '')
    .replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, '')
    .replace(/\r\n?/g, '\n')
    // Older editable text files sometimes contain literal backslash-n sequences.
    .replace(/\\n/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/\t/g, '  ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s+|\s+$/g, '');
}

export function renderBotText(template, values = {}) {
  const rendered = String(template ?? '').replace(/\{([a-zA-Z][a-zA-Z0-9_]*)\}/g, (match, key) =>
    Object.hasOwn(values, key) ? String(values[key]) : match,
  );
  return cleanWhatsAppText(rendered);
}


function parseEdit(raw) {
  const match = raw.match(/^\s*([^|\s]+)\s*\|\s*([\s\S]+)$/);
  if (!match) return null;
  const key = match[1];
  const value = match[2].trim();
  if (!Object.hasOwn(EDITABLE_TEXT_KEYS, key) || !value || value.length > MAX_TEXT_LENGTH) return null;
  return { key, value };
}

async function persistText(key, value, { cwd = process.cwd() } = {}) {
  const file = await ensureContentFile(cwd);
  const backupDir = path.join(cwd, 'content', 'backups');
  await fs.mkdir(backupDir, { recursive: true });
  const current = await fs.readFile(file, 'utf8');
  const stamp = new Date().toISOString().replaceAll(':', '-');
  await fs.writeFile(path.join(backupDir, `texts-${stamp}.json`), current, { flag: 'wx' });
  const parsed = JSON.parse(current);
  parsed[key] = value;
  const temporary = `${file}.tmp`;
  await fs.writeFile(temporary, `${JSON.stringify(parsed, null, 2)}\n`, 'utf8');
  await fs.rename(temporary, file);
}

export async function handleContentEditorCommand(ctx) {
  const { command, args = [], messageText = '', userJid, senderIdentityAliases = [], isBotOwner, reply, PREFIX = '.' } = ctx;
  if (!['textlist', 'textshow', 'textedit', 'textsave', 'textcancel', 'textbackups', 'textrestore'].includes(command)) return false;
  if (!isBotOwner?.(userJid, senderIdentityAliases)) {
    await reply('⛔ Editor konten hanya dapat digunakan oleh Owner bot.');
    return true;
  }

  if (command === 'textlist') {
    await reply(`📝 *KUNCI TEKS YANG BISA DIEDIT*\n\n${Object.entries(EDITABLE_TEXT_KEYS).map(([key, label]) => `• ${key} — ${label}`).join('\n')}\n\nLihat: ${PREFIX}textshow <kunci>\nEdit: ${PREFIX}textedit <kunci> | teks baru\nSimpan: ${PREFIX}textsave\nBatalkan: ${PREFIX}textcancel\nBackup: ${PREFIX}textbackups\nPulihkan: ${PREFIX}textrestore <nomor>`);
    return true;
  }

  if (command === 'textbackups') {
    const backupDir = path.join(process.cwd(), 'content', 'backups');
    let files = [];
    try { files = (await fs.readdir(backupDir)).filter(name => /^texts-[\dT.-]+Z?\.json$/.test(name)).sort().reverse(); } catch {}
    if (!files.length) return reply('Belum ada backup konten. Backup dibuat otomatis setiap kali teks disimpan.');
    return reply(`🗂️ *BACKUP KONTEN TERBARU*\n\n${files.slice(0, 10).map((name, i) => `${i + 1}. ${name}`).join('\n')}\n\nPulihkan backup dengan ${PREFIX}textrestore <nomor>. Nomor 1 adalah backup terbaru.`);
  }

  if (command === 'textrestore') {
    const requested = Number(args[0]);
    if (!Number.isInteger(requested) || requested < 1) return reply(`Format: ${PREFIX}textrestore <nomor>\nLihat daftar dengan ${PREFIX}textbackups.`);
    const backupDir = path.join(process.cwd(), 'content', 'backups');
    let files = [];
    try { files = (await fs.readdir(backupDir)).filter(name => /^texts-[\dT.-]+Z?\.json$/.test(name)).sort().reverse(); } catch {}
    const chosen = files[requested - 1];
    if (!chosen) return reply('Nomor backup tidak ditemukan. Lihat daftar terbaru dengan .textbackups.');
    let restored;
    try {
      restored = JSON.parse(await fs.readFile(path.join(backupDir, chosen), 'utf8'));
      for (const key of Object.keys(EDITABLE_TEXT_KEYS)) if (typeof restored[key] !== 'string') throw new Error('Backup tidak lengkap');
    } catch { return reply('Backup tidak valid atau tidak lengkap; tidak ada perubahan yang diterapkan.'); }
    const current = await fs.readFile(contentPath(), 'utf8');
    await fs.mkdir(backupDir, { recursive: true });
    const stamp = new Date().toISOString().replaceAll(':', '-');
    await fs.writeFile(path.join(backupDir, `texts-${stamp}.json`), current, { flag: 'wx' });
    const temporary = `${contentPath()}.tmp`;
    await fs.writeFile(temporary, `${JSON.stringify(restored, null, 2)}\n`, 'utf8');
    await fs.rename(temporary, contentPath());
    pendingEdits.clear();
    return reply(`✅ Konten dipulihkan dari backup ${chosen}. Kondisi sebelumnya juga dicadangkan. Pratinjau edit yang menunggu konfirmasi dibatalkan.`);
  }

  if (command === 'textshow') {
    const key = String(args[0] || '');
    if (!Object.hasOwn(EDITABLE_TEXT_KEYS, key)) {
      await reply(`Kunci tidak dikenal. Gunakan ${PREFIX}textlist.`);
      return true;
    }
    const texts = await readBotTexts();
    await reply(`📝 *${key} — ${EDITABLE_TEXT_KEYS[key]}*\n\n${texts[key]}`);
    return true;
  }

  if (command === 'textedit') {
    const raw = messageText.replace(/^\s*\S+\s*/, '');
    const parsed = parseEdit(raw);
    if (!parsed) {
      await reply(`Format: ${PREFIX}textedit <kunci> | teks baru\nKunci dan teks maksimal ${MAX_TEXT_LENGTH} karakter. Gunakan ${PREFIX}textlist untuk daftar kunci.`);
      return true;
    }
    const texts = await readBotTexts();
    pendingEdits.set(userJid, { ...parsed, previous: texts[parsed.key], createdAt: Date.now() });
    await reply(`🔎 *Pratinjau perubahan*\nKunci: ${parsed.key}\n\n${parsed.value}\n\nBelum disimpan. Kirim ${PREFIX}textsave untuk menyimpan atau ${PREFIX}textcancel untuk membatalkan.`);
    return true;
  }

  if (command === 'textcancel') {
    const removed = pendingEdits.delete(userJid);
    await reply(removed ? 'Perubahan teks dibatalkan.' : 'Tidak ada perubahan yang menunggu konfirmasi.');
    return true;
  }

  const pending = pendingEdits.get(userJid);
  if (!pending || Date.now() - pending.createdAt > CONFIRM_WINDOW_MS) {
    pendingEdits.delete(userJid);
    await reply('Tidak ada perubahan aktif atau pratinjau sudah kedaluwarsa. Jalankan .textedit kembali.');
    return true;
  }
  await persistText(pending.key, pending.value);
  pendingEdits.delete(userJid);
  await reply(`✅ Teks *${pending.key}* berhasil disimpan. Salinan sebelumnya dibuat di content/backups/.`);
  return true;
}
