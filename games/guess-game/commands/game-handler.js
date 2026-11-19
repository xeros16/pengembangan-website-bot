import mongoose from 'mongoose';
import { GUESS_CATEGORIES, GUESS_QUESTIONS, normalizeGuessAnswer, classifyGuessDifficulty } from '../data-questions.js';
export { GUESS_CATEGORIES, GUESS_QUESTIONS, normalizeGuessAnswer };

const GuessStateSchema = new mongoose.Schema({
  jid: { type: String, required: true, unique: true },
  currentAnswer: { type: String, required: true },
  category: { type: String, default: 'campuran' },
  difficulty: { type: String, default: 'sedang' },
  attempts: { type: Number, default: 0 },
  hintsUsed: { type: Number, default: 0 },
  startTime: Date,
  hint: String,
}, { versionKey: false });
const GuessState = mongoose.models.GuessState || mongoose.model('GuessState', GuessStateSchema);

const GuessScoreSchema = new mongoose.Schema({
  jid: { type: String, required: true, unique: true },
  name: { type: String, default: 'Pemain' },
  points: { type: Number, default: 0 },
  wins: { type: Number, default: 0 },
  totalAttempts: { type: Number, default: 0 },
  hintsUsed: { type: Number, default: 0 },
  bestTime: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now },
}, { versionKey: false });
const GuessScore = mongoose.models.GuessScore || mongoose.model('GuessScore', GuessScoreSchema);

const DIFFICULTIES = {
  mudah: { label: 'Mudah', points: 10, maxLength: 6 },
  sedang: { label: 'Sedang', points: 20, maxLength: 10 },
  sulit: { label: 'Sulit', points: 30, maxLength: Infinity },
};
function getQuestionDifficulty(question) { return classifyGuessDifficulty(question); }
function getRandomQuestion(category, difficulty) {
  let pool = category === 'campuran' ? GUESS_QUESTIONS : GUESS_QUESTIONS.filter(item => item.category === category);
  if (difficulty) pool = pool.filter(item => getQuestionDifficulty(item) === difficulty);
  if (!pool.length && difficulty) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}
function buildMenu(PREFIX) {
  const categories = Object.entries(GUESS_CATEGORIES).map(([key, value]) => `• ${value.emoji} ${key} — ${value.label}`).join('\n');
  return `🧩 *GAME TEBAK-TEBAKAN*\n\nTebak jawaban dari berbagai topik dan kumpulkan poin!\n\n*Mulai bermain*\n• ${PREFIX}tebak mulai — kategori dan kesulitan acak\n• ${PREFIX}tebak mulai sains mudah — pilih kategori + kesulitan\n• ${PREFIX}tebak kategori — lihat kategori\n• ${PREFIX}tebak hint — minta petunjuk (-5 poin)\n• ${PREFIX}tebak stop — hentikan permainan\n\n*Statistik*\n• ${PREFIX}tebak skor — skor pribadi\n• ${PREFIX}tebak papan — 10 pemain teratas\n\n*Kategori tersedia*\n${categories}\n\nKesulitan: mudah (+10), sedang (+20), sulit (+30) poin.\nJawab: ${PREFIX}tebak <jawaban>`;
}

export async function handleGuessGame(context) {
  const { remoteJid, args = [], userJid, reply, PREFIX = '.', pushName } = context;
  const playerId = userJid || context.sender || remoteJid;
  const sub = String(args[0] || 'menu').toLowerCase();

  if (['menu', 'bantuan', 'help'].includes(sub)) return reply(buildMenu(PREFIX));
  if (['kategori', 'category', 'categories'].includes(sub)) {
    return reply(`📚 *KATEGORI TEBAK-TEBAKAN*\n\n${Object.entries(GUESS_CATEGORIES).map(([key, value]) => `${value.emoji} ${key} — ${value.label}`).join('\n')}\n\nMulai: ${PREFIX}tebak mulai <kategori> <mudah|sedang|sulit>`);
  }
  if (['skor', 'score', 'statistik', 'stats'].includes(sub)) {
    const score = await GuessScore.findOne({ jid: playerId }).lean();
    if (!score) return reply('📊 Kamu belum memiliki skor. Selesaikan satu soal untuk mulai mengumpulkan poin!');
    return reply(`📊 *STATISTIK TEBAK-TEBAKAN*\n\nPemain: *${score.name || pushName || 'Pemain'}*\n🏅 Poin: *${score.points}*\n🎯 Jawaban benar: *${score.wins}*\n⌨️ Total percobaan: *${score.totalAttempts}*\n💡 Petunjuk dipakai: *${score.hintsUsed}*\n⚡ Waktu terbaik: *${score.bestTime ? `${score.bestTime} detik` : '-'}*`);
  }
  if (['papan', 'ranking', 'leaderboard', 'top'].includes(sub)) {
    const rows = await GuessScore.find({ points: { $gt: 0 } }).sort({ points: -1, wins: -1, totalAttempts: 1 }).limit(10).lean();
    if (!rows.length) return reply('🏆 Belum ada pemain di papan peringkat. Jadilah yang pertama!');
    return reply(`🏆 *PAPAN PERINGKAT TEBAK-TEBAKAN*\n\n${rows.map((row, index) => `${index + 1}. ${row.name || 'Pemain'} — *${row.points} poin* (${row.wins} benar)`).join('\n')}`);
  }

  if (['mulai', 'start'].includes(sub)) {
    const requested = String(args[1] || 'campuran').toLowerCase();
    const category = GUESS_CATEGORIES[requested] ? requested : 'campuran';
    const requestedDifficulty = String(args[2] || (DIFFICULTIES[requested] ? requested : '')).toLowerCase();
    const difficulty = DIFFICULTIES[requestedDifficulty] ? requestedDifficulty : '';
    const question = getRandomQuestion(category, difficulty);
    if (!question) return reply(`Belum ada soal kategori *${category}* untuk kesulitan *${difficulty}*. Coba kategori atau kesulitan lain.`);
    const actualDifficulty = getQuestionDifficulty(question);
    await GuessState.findOneAndUpdate({ jid: playerId }, {
      currentAnswer: question.answer, category: question.category, difficulty: actualDifficulty,
      attempts: 0, hintsUsed: 0, startTime: new Date(), hint: question.hint,
    }, { upsert: true, new: true, setDefaultsOnInsert: true });
    return reply(`🎮 *TEBAK-TEBAKAN DIMULAI!*\n\n${GUESS_CATEGORIES[question.category].emoji} Kategori: *${GUESS_CATEGORIES[question.category].label}*\n⚙️ Kesulitan: *${DIFFICULTIES[actualDifficulty].label}*\n🏅 Hadiah: *${DIFFICULTIES[actualDifficulty].points} poin*\n💡 Petunjuk: ${question.hint}\n\nJawab: ${PREFIX}tebak <jawaban>\nPetunjuk tambahan: ${PREFIX}tebak hint\nBerhenti: ${PREFIX}tebak stop`);
  }

  if (['stop', 'berhenti', 'keluar'].includes(sub)) {
    await GuessState.deleteOne({ jid: playerId });
    return reply('🛑 Permainan dihentikan. Skor yang sudah terkumpul tetap tersimpan.');
  }

  const state = await GuessState.findOne({ jid: playerId });
  if (['hint', 'petunjuk'].includes(sub)) {
    if (!state) return reply(`Belum ada permainan aktif. Ketik ${PREFIX}tebak mulai untuk memulai.`);
    state.hintsUsed += 1;
    await state.save();
    return reply(`💡 *PETUNJUK*\n${state.hint}\n\nPetunjuk digunakan: ${state.hintsUsed}. Setiap petunjuk mengurangi hadiah akhir 5 poin.`);
  }
  if (!state) return reply(`Belum ada permainan aktif. Ketik ${PREFIX}tebak mulai atau ${PREFIX}tebak menu.`);

  const guess = normalizeGuessAnswer(args.join(' '));
  const answer = normalizeGuessAnswer(state.currentAnswer);
  if (!guess) return reply(`Kirim jawaban setelah perintah. Contoh: ${PREFIX}tebak komodo`);

  if (guess === answer) {
    const solved = state;
    const elapsed = Math.max(1, Math.round((Date.now() - new Date(solved.startTime).getTime()) / 1000));
    const basePoints = DIFFICULTIES[solved.difficulty]?.points || 20;
    const earned = Math.max(1, basePoints - (Number(solved.hintsUsed || 0) * 5));
    const previousScore = await GuessScore.findOne({ jid: playerId });
    const bestTime = previousScore?.bestTime > 0 ? Math.min(previousScore.bestTime, elapsed) : elapsed;
    await GuessScore.findOneAndUpdate({ jid: playerId }, {
      $set: { name: pushName || previousScore?.name || 'Pemain', updatedAt: new Date(), bestTime },
      $inc: { points: earned, wins: 1, totalAttempts: Number(solved.attempts || 0) + 1, hintsUsed: Number(solved.hintsUsed || 0) },
    }, { upsert: true, new: true, setDefaultsOnInsert: true });
    await GuessState.deleteOne({ jid: playerId });
    return reply(`🎉 *JAWABAN BENAR!*\n\nJawabannya: *${solved.currentAnswer}*\nKategori: ${GUESS_CATEGORIES[solved.category]?.label || solved.category}\nKesulitan: *${DIFFICULTIES[solved.difficulty]?.label || solved.difficulty}*\nPercobaan: *${solved.attempts + 1}*\nWaktu: *${elapsed} detik*\n🏅 Poin didapat: *+${earned}*\n\nLihat skor: ${PREFIX}tebak skor\nLihat ranking: ${PREFIX}tebak papan\nMain lagi: ${PREFIX}tebak mulai`);
  }

  state.attempts += 1;
  await state.save();
  return reply(`❌ *Belum tepat!*\nJawabanmu: ${args.join(' ')}\nPercobaan: ${state.attempts}\nCoba lagi atau ketik ${PREFIX}tebak hint.`);
}

export const GUESS_DIFFICULTIES = DIFFICULTIES;
export { classifyGuessDifficulty };
