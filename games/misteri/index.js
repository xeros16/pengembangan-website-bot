import mongoose from 'mongoose';
import { MYSTERY_CASES, normalizeMysteryAnswer, getMysteryCase } from './cases.js';

const MysteryStateSchema = new mongoose.Schema({
  jid: { type: String, required: true, unique: true },
  caseId: { type: String, required: true },
  cluesShown: { type: Number, default: 0 },
  attempts: { type: Number, default: 0 },
  evidenceFound: { type: [String], default: [] },
  visitedLocations: { type: [String], default: [] },
  interviewsDone: { type: [String], default: [] },
  startedAt: { type: Date, default: Date.now },
}, { versionKey: false });
const MysteryState = mongoose.models.MysteryGameState || mongoose.model('MysteryGameState', MysteryStateSchema);

const MysteryScoreSchema = new mongoose.Schema({
  jid: { type: String, required: true, unique: true },
  name: { type: String, default: 'Pemain' },
  solved: { type: Number, default: 0 },
  points: { type: Number, default: 0 },
}, { versionKey: false });
const MysteryScore = mongoose.models.MysteryGameScore || mongoose.model('MysteryGameScore', MysteryScoreSchema);

const pickCase = () => MYSTERY_CASES[Math.floor(Math.random() * MYSTERY_CASES.length)];
const suspectList = item => item.suspects.map((name, index) => `${index + 1}. ${name}`).join('\n');
const locationList = item => item.locations.map(location => `• *${location.code}* — ${location.name}`).join('\n');
const evidenceList = item => item.evidence.map(evidence => `• *${evidence.code}* — ${evidence.name} (${evidence.location})`).join('\n');

export async function handleMysteryGame(context) {
  const { args = [], remoteJid, userJid, sender, reply, PREFIX = '.', pushName } = context;
  const player = userJid || sender || remoteJid;
  const sessionId = `${remoteJid || 'private'}:${player}`;
  const sub = String(args[0] || 'menu').toLowerCase();
  const usage = `🕵️ *MISTERI & DETEKTIF — PANDUAN*\n\n${PREFIX}misteri mulai — buka kasus baru\n${PREFIX}misteri lokasi — lihat lokasi investigasi\n${PREFIX}misteri kunjungi <kode> — datangi lokasi\n${PREFIX}misteri bukti — lihat daftar bukti\n${PREFIX}misteri periksa <kode> — periksa bukti di lokasi yang sudah dikunjungi\n${PREFIX}misteri interogasi <nama> — dengarkan keterangan tersangka\n${PREFIX}misteri petunjuk — buka petunjuk tambahan\n${PREFIX}misteri jurnal — rangkuman investigasi\n${PREFIX}misteri tersangka — lihat daftar tersangka\n${PREFIX}misteri tuduh <nama> — simpulkan kasus\n${PREFIX}misteri menyerah — tutup kasus dan lihat solusi\n${PREFIX}misteri skor / papan — statistik dan peringkat`;

  if (['menu', 'help', 'bantuan'].includes(sub)) return reply(usage);

  if (['mulai', 'start'].includes(sub)) {
    const item = pickCase();
    await MysteryState.findOneAndUpdate(
      { jid: sessionId },
      { caseId: item.id, cluesShown: 0, attempts: 0, evidenceFound: [], visitedLocations: [], interviewsDone: [], startedAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return reply(`🗂️ *BERKAS INVESTIGASI BARU*\n*${item.title}*\nTingkat: *${item.difficulty.toUpperCase()}*\n\n${item.story}\n\n📍 *Lokasi yang bisa diperiksa*\n${locationList(item)}\n\n🧑‍⚖️ *Tersangka*\n${suspectList(item)}\n\nMulai dengan: ${PREFIX}misteri kunjungi <kode lokasi>`);
  }

  if (['skor', 'score'].includes(sub)) {
    const score = await MysteryScore.findOne({ jid: sessionId }).lean();
    return reply(score ? `🏅 *STATISTIK DETEKTIF*\nNama: ${score.name}\nKasus terpecahkan: ${score.solved}\nPoin: ${score.points}` : 'Kamu belum memiliki skor. Pecahkan satu kasus untuk mulai mengumpulkan poin!');
  }
  if (['papan', 'ranking', 'top'].includes(sub)) {
    const rows = await MysteryScore.find({ points: { $gt: 0 } }).sort({ points: -1, solved: -1 }).limit(10).lean();
    return reply(rows.length ? `🏆 *PAPAN PERINGKAT DETEKTIF*\n\n${rows.map((row, i) => `${i + 1}. ${row.name || 'Detektif'} — *${row.points} poin* (${row.solved} kasus)`).join('\n')}` : 'Belum ada detektif di papan peringkat.');
  }

  const state = await MysteryState.findOne({ jid: sessionId });
  if (['stop', 'menyerah', 'berhenti'].includes(sub)) {
    if (!state) return reply(`Tidak ada kasus aktif. Ketik ${PREFIX}misteri mulai.`);
    const item = getMysteryCase(state.caseId);
    await MysteryState.deleteOne({ jid: sessionId });
    return reply(`📁 *BERKAS DITUTUP*\n${item?.solution || 'Solusi tidak tersedia.'}`);
  }
  if (!state) return reply(`Belum ada kasus aktif. Ketik ${PREFIX}misteri mulai.`);
  const item = getMysteryCase(state.caseId);
  if (!item) { await MysteryState.deleteOne({ jid: sessionId }); return reply('Kasus tidak ditemukan. Silakan mulai kasus baru.'); }

  if (['lokasi', 'lokasiinvestigasi'].includes(sub)) return reply(`📍 *LOKASI INVESTIGASI*\n${locationList(item)}\n\nKunjungi dengan: ${PREFIX}misteri kunjungi <kode>`);

  if (['kunjungi', 'masuk', 'visit'].includes(sub)) {
    const code = normalizeMysteryAnswer(args.slice(1).join(' '));
    const location = item.locations.find(row => normalizeMysteryAnswer(row.code) === code || normalizeMysteryAnswer(row.name) === code);
    if (!location) return reply(`Lokasi tidak ditemukan. Pilih salah satu:\n${locationList(item)}`);
    if (!state.visitedLocations.includes(location.code)) state.visitedLocations.push(location.code);
    await state.save();
    const available = item.evidence.filter(row => row.location === location.code && !state.evidenceFound.includes(row.code));
    return reply(`📍 *${location.name.toUpperCase()}*\n${location.description}\n\n${available.length ? `Ada sesuatu yang perlu diperiksa: ${available.map(row => `*${row.code}*`).join(', ')}.` : 'Kamu sudah memeriksa semua bukti yang tersedia di sini.'}\n\nGunakan ${PREFIX}misteri periksa <kode bukti>.`);
  }

  if (['bukti', 'evidence'].includes(sub)) return reply(`🔎 *DAFTAR BUKTI KASUS*\n${evidenceList(item)}\n\nBukti hanya dapat diperiksa setelah mengunjungi lokasinya.`);

  if (['periksa', 'inspect', 'buka'].includes(sub)) {
    const code = normalizeMysteryAnswer(args.slice(1).join(' '));
    const evidence = item.evidence.find(row => normalizeMysteryAnswer(row.code) === code || normalizeMysteryAnswer(row.name) === code);
    if (!evidence) return reply(`Kode bukti tidak ditemukan. Ketik ${PREFIX}misteri bukti.`);
    if (!state.visitedLocations.includes(evidence.location)) return reply(`Kamu belum mengunjungi lokasi bukti ini. Kunjungi dulu: ${PREFIX}misteri kunjungi ${evidence.location}`);
    if (state.evidenceFound.includes(evidence.code)) return reply(`Bukti *${evidence.name}* sudah tercatat di jurnal.`);
    state.evidenceFound.push(evidence.code);
    await state.save();
    return reply(`🧾 *BUKTI DITEMUKAN: ${evidence.name.toUpperCase()}*\n${evidence.detail}\n\nBukti tersimpan di jurnal investigasi.`);
  }

  if (['interogasi', 'tanya', 'wawancara'].includes(sub)) {
    const name = normalizeMysteryAnswer(args.slice(1).join(' '));
    if (!name) return reply(`Format: ${PREFIX}misteri interogasi <nama tersangka>\n\n${suspectList(item)}`);
    const suspect = item.suspects.find(row => normalizeMysteryAnswer(row) === name);
    if (!suspect) return reply(`Nama tidak ditemukan. Ketik ${PREFIX}misteri tersangka.`);
    const statement = item.interviews?.[normalizeMysteryAnswer(suspect)];
    if (!statement) return reply('Belum ada catatan wawancara untuk tersangka ini.');
    if (!state.interviewsDone.includes(normalizeMysteryAnswer(suspect))) state.interviewsDone.push(normalizeMysteryAnswer(suspect));
    await state.save();
    return reply(`🗣️ *WAWANCARA: ${suspect.toUpperCase()}*\n“${statement}”\n\nBandingkan pernyataan ini dengan bukti yang sudah kamu temukan.`);
  }

  if (['jurnal', 'catatan', 'journal'].includes(sub)) {
    const found = item.evidence.filter(row => state.evidenceFound.includes(row.code));
    const visited = item.locations.filter(row => state.visitedLocations.includes(row.code));
    const interviewed = item.suspects.filter(row => state.interviewsDone.includes(normalizeMysteryAnswer(row)));
    return reply(`📓 *JURNAL INVESTIGASI*\nLokasi dikunjungi: ${visited.length}/${item.locations.length}\n${visited.map(row => `• ${row.name}`).join('\n') || 'Belum ada'}\n\nBukti ditemukan: ${found.length}/${item.evidence.length}\n${found.map(row => `• ${row.name}: ${row.detail}`).join('\n') || 'Belum ada'}\n\nWawancara: ${interviewed.length}/${item.suspects.length}\n${interviewed.join(', ') || 'Belum ada'}\n\nPetunjuk tambahan dibuka: ${state.cluesShown}/${item.clues.length}`);
  }

  if (['tersangka', 'suspect', 'daftar'].includes(sub)) return reply(`🧑‍⚖️ *DAFTAR TERSANGKA*\n${suspectList(item)}\n\nGunakan: ${PREFIX}misteri interogasi <nama>`);
  if (['petunjuk', 'hint', 'clue'].includes(sub)) {
    if (state.cluesShown >= item.clues.length) return reply('Semua petunjuk tambahan sudah terbuka. Periksa jurnal sebelum membuat kesimpulan!');
    const clue = item.clues[state.cluesShown];
    state.cluesShown += 1;
    await state.save();
    return reply(`🔎 *PETUNJUK TAMBAHAN ${state.cluesShown}/${item.clues.length}*\n${clue}\n\nBaca jurnal dengan ${PREFIX}misteri jurnal.`);
  }
  if (['tuduh', 'accuse', 'jawab'].includes(sub)) {
    const guess = normalizeMysteryAnswer(args.slice(1).join(' '));
    if (!guess) return reply(`Format: ${PREFIX}misteri tuduh <nama tersangka>`);
    const suspect = item.suspects.find(name => normalizeMysteryAnswer(name) === guess);
    if (!suspect) return reply(`Nama itu tidak ada dalam daftar tersangka. Ketik ${PREFIX}misteri tersangka.`);
    state.attempts += 1;
    if (normalizeMysteryAnswer(suspect) === item.culprit) {
      const investigationBonus = Math.min(10, state.evidenceFound.length * 2 + state.interviewsDone.length);
      const points = Math.max(10, 30 - (state.attempts - 1) * 5 - Math.max(0, item.clues.length - state.cluesShown) * 3 + investigationBonus);
      await MysteryScore.findOneAndUpdate({ jid: sessionId }, { $set: { name: pushName || 'Detektif' }, $inc: { solved: 1, points } }, { upsert: true, new: true, setDefaultsOnInsert: true });
      await MysteryState.deleteOne({ jid: sessionId });
      return reply(`🎉 *KASUS TERPECAHKAN!*\nTersangka yang tepat: *${suspect}*\n\n${item.solution}\n\n📊 Bukti ditemukan: ${state.evidenceFound.length}/${item.evidence.length}\n🗣️ Wawancara: ${state.interviewsDone.length}/${item.suspects.length}\n🏅 Hadiah: *+${points} poin*\nKasus berikutnya: ${PREFIX}misteri mulai`);
    }
    await state.save();
    return reply(`❌ Dugaan belum tepat. Periksa kembali alibi dan bukti.\nPercobaan tuduhan: ${state.attempts}\nBuka jurnal: ${PREFIX}misteri jurnal`);
  }
  return reply(`Perintah tidak dikenal. Ketik ${PREFIX}misteri menu untuk melihat cara bermain.`);
}

export const mysteryGame = Object.freeze({
  id: 'misteri-detektif', command: 'misteri', name: 'Misteri & Detektif',
  description: 'Investigasi episodik: kunjungi lokasi, periksa bukti, interogasi saksi, dan pecahkan kasus fiksi.',
  handler: handleMysteryGame,
});
