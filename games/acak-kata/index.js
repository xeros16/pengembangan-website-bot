import mongoose from 'mongoose';

const WORDS = Object.freeze([
  { word: 'KOMPUTER', hint: 'Perangkat elektronik untuk mengolah data', category: 'Teknologi' },
  { word: 'GALAKSI', hint: 'Kumpulan bintang, gas, dan debu kosmik', category: 'Astronomi' },
  { word: 'KAMERA', hint: 'Alat untuk mengambil foto atau video', category: 'Teknologi' },
  { word: 'KANGURU', hint: 'Hewan berkantung yang terkenal dari Australia', category: 'Hewan' },
  { word: 'SAMUDRA', hint: 'Laut yang sangat luas', category: 'Geografi' },
  { word: 'PIRAMIDA', hint: 'Bangunan bersejarah yang terkenal di Mesir', category: 'Sejarah' },
  { word: 'METEOR', hint: 'Benda langit yang tampak berpijar saat memasuki atmosfer', category: 'Astronomi' },
  { word: 'BATERAI', hint: 'Menyimpan energi untuk perangkat elektronik', category: 'Teknologi' },
  { word: 'ANGKLUNG', hint: 'Alat musik tradisional dari bambu', category: 'Budaya' },
  { word: 'KOMPAS', hint: 'Alat penunjuk arah', category: 'Pengetahuan Umum' },
  { word: 'FOTOSINTESIS', hint: 'Proses tumbuhan membuat makanan dengan bantuan cahaya', category: 'Sains' },
  { word: 'ORNAMEN', hint: 'Elemen hias dalam karya visual', category: 'Desain' },
]);

const WordStateSchema = new mongoose.Schema({
  jid: { type: String, required: true, unique: true },
  answer: { type: String, required: true },
  hint: { type: String, required: true },
  category: { type: String, required: true },
  scrambled: { type: String, required: true },
  attempts: { type: Number, default: 0 },
}, { versionKey: false });
const WordState = mongoose.models.ScrambleWordState || mongoose.model('ScrambleWordState', WordStateSchema);

const WordScoreSchema = new mongoose.Schema({
  jid: { type: String, required: true, unique: true },
  name: { type: String, default: 'Pemain' },
  wins: { type: Number, default: 0 },
  points: { type: Number, default: 0 },
}, { versionKey: false });
const WordScore = mongoose.models.ScrambleWordScore || mongoose.model('ScrambleWordScore', WordScoreSchema);

export { normalizeScrambleAnswer, scrambleWord } from './utils.js';
import { normalizeScrambleAnswer, scrambleWord } from './utils.js';

export async function handleScrambleGame(context) {
  const { args = [], remoteJid, userJid, sender, reply, PREFIX = '.', pushName } = context;
  const player = userJid || sender || remoteJid;
  const sessionId = `${remoteJid || 'private'}:${player}`;
  const sub = String(args[0] || 'menu').toLowerCase();
  if (['menu', 'help', 'bantuan'].includes(sub)) return reply(
    `🔤 *ACAK KATA*\n\nSusun huruf acak menjadi kata yang benar.\n\n• ${PREFIX}acak mulai — mulai ronde\n• ${PREFIX}acak <jawaban> — jawab soal\n• ${PREFIX}acak hint — lihat petunjuk\n• ${PREFIX}acak stop — hentikan\n• ${PREFIX}acak skor — statistik pribadi`
  );
  if (['mulai', 'start'].includes(sub)) {
    const item = WORDS[Math.floor(Math.random() * WORDS.length)];
    const scrambled = scrambleWord(item.word);
    await WordState.findOneAndUpdate({ jid: sessionId }, { answer: item.word, hint: item.hint, category: item.category, scrambled, attempts: 0 }, { upsert: true, new: true, setDefaultsOnInsert: true });
    return reply(`🔤 *ACAK KATA DIMULAI!*\n\nKategori: *${item.category}*\nHuruf: *${[...scrambled].join(' ')}*\nJumlah huruf: ${item.word.length}\n\nJawab: ${PREFIX}acak <kata>`);
  }
  if (['skor', 'score'].includes(sub)) {
    const score = await WordScore.findOne({ jid: sessionId }).lean();
    return reply(score ? `🏅 *SKOR ACAK KATA*\nNama: ${score.name}\nMenang: ${score.wins}\nPoin: ${score.points}` : 'Belum ada skor. Menangkan satu ronde untuk mulai mengumpulkan poin!');
  }
  const state = await WordState.findOne({ jid: sessionId });
  if (!state) return reply(`Belum ada ronde aktif. Ketik ${PREFIX}acak mulai.`);
  if (['hint', 'petunjuk'].includes(sub)) return reply(`💡 *PETUNJUK*\n${state.hint}`);
  if (['stop', 'berhenti', 'keluar'].includes(sub)) {
    await WordState.deleteOne({ jid: sessionId });
    return reply(`🛑 Ronde dihentikan. Jawabannya: *${state.answer}*.`);
  }
  const guess = normalizeScrambleAnswer(args.join(' '));
  if (!guess) return reply(`Kirim jawaban. Contoh: ${PREFIX}acak komputer`);
  state.attempts += 1;
  if (guess === state.answer) {
    const points = Math.max(5, 15 - (state.attempts - 1) * 2);
    await WordScore.findOneAndUpdate({ jid: sessionId }, { $set: { name: pushName || 'Pemain' }, $inc: { wins: 1, points } }, { upsert: true, new: true, setDefaultsOnInsert: true });
    await WordState.deleteOne({ jid: sessionId });
    return reply(`🎉 *BENAR!* Jawabannya *${state.answer}*.\nPercobaan: ${state.attempts}\n🏅 Poin: *+${points}*\nMulai lagi: ${PREFIX}acak mulai`);
  }
  await state.save();
  return reply(`❌ Belum tepat. Percobaan: ${state.attempts}. Ketik ${PREFIX}acak hint untuk petunjuk.`);
}

export const scrambleWordGame = Object.freeze({
  id: 'acak-kata', command: 'acak', name: 'Acak Kata',
  description: 'Susun huruf acak menjadi kata dari kategori pengetahuan umum, sains, teknologi, dan lainnya.',
  handler: handleScrambleGame,
});
