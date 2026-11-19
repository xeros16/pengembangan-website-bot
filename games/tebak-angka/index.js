import mongoose from 'mongoose';

const NumberStateSchema = new mongoose.Schema({
  jid: { type: String, required: true, unique: true },
  target: { type: Number, required: true },
  attempts: { type: Number, default: 0 },
  maxAttempts: { type: Number, default: 7 },
  startedAt: { type: Date, default: Date.now },
}, { versionKey: false });
const NumberState = mongoose.models.NumberGuessState || mongoose.model('NumberGuessState', NumberStateSchema);

const NumberScoreSchema = new mongoose.Schema({
  jid: { type: String, required: true, unique: true },
  name: { type: String, default: 'Pemain' },
  wins: { type: Number, default: 0 },
  points: { type: Number, default: 0 },
}, { versionKey: false });
const NumberScore = mongoose.models.NumberGuessScore || mongoose.model('NumberGuessScore', NumberScoreSchema);

export { normalizeNumberGuess } from './utils.js';
import { normalizeNumberGuess } from './utils.js';

export async function handleNumberGuess(context) {
  const { args = [], remoteJid, userJid, sender, reply, PREFIX = '.', pushName } = context;
  const player = userJid || sender || remoteJid;
  const sessionId = `${remoteJid || 'private'}:${player}`;
  const sub = String(args[0] || 'menu').toLowerCase();

  if (['menu', 'help', 'bantuan'].includes(sub)) return reply(
    `🔢 *TEBAK ANGKA*\n\nTebak angka rahasia dari 1–50 dalam maksimal 7 kesempatan.\n\n• ${PREFIX}angka mulai — mulai permainan\n• ${PREFIX}angka 25 — kirim tebakan\n• ${PREFIX}angka menyerah — lihat jawaban\n• ${PREFIX}angka skor — lihat statistik\n\nPetunjuk akan memberi tahu apakah angka rahasia lebih tinggi atau lebih rendah.`
  );
  if (['mulai', 'start'].includes(sub)) {
    const target = Math.floor(Math.random() * 50) + 1;
    await NumberState.findOneAndUpdate({ jid: sessionId }, { target, attempts: 0, maxAttempts: 7, startedAt: new Date() }, { upsert: true, new: true, setDefaultsOnInsert: true });
    return reply(`🎯 *TEBAK ANGKA DIMULAI!*\n\nAku sudah memilih angka dari *1 sampai 50*.\nKamu punya *7 kesempatan*.\n\nKirim: ${PREFIX}angka <angka>`);
  }
  if (['skor', 'score'].includes(sub)) {
    const score = await NumberScore.findOne({ jid: sessionId }).lean();
    return reply(score ? `🏅 *SKOR TEBAK ANGKA*\nNama: ${score.name}\nMenang: ${score.wins}\nPoin: ${score.points}` : 'Kamu belum memiliki skor. Menangkan permainan untuk mendapat poin!');
  }
  const state = await NumberState.findOne({ jid: sessionId });
  if (!state) return reply(`Belum ada permainan aktif. Ketik ${PREFIX}angka mulai.`);
  if (['menyerah', 'stop', 'berhenti'].includes(sub)) {
    await NumberState.deleteOne({ jid: sessionId });
    return reply(`🏳️ Permainan selesai. Angka rahasianya adalah *${state.target}*. Coba lagi: ${PREFIX}angka mulai`);
  }
  const guess = normalizeNumberGuess(args.join(' '));
  if (guess === null || guess < 1 || guess > 50) return reply(`Masukkan angka bulat 1–50. Contoh: ${PREFIX}angka 25`);
  state.attempts += 1;
  if (guess === state.target) {
    const points = Math.max(5, 20 - ((state.attempts - 1) * 2));
    await NumberScore.findOneAndUpdate({ jid: sessionId }, { $set: { name: pushName || 'Pemain' }, $inc: { wins: 1, points } }, { upsert: true, new: true, setDefaultsOnInsert: true });
    await NumberState.deleteOne({ jid: sessionId });
    return reply(`🎉 *TEPAT SEKALI!* Angkanya adalah *${state.target}*.\nKesempatan terpakai: ${state.attempts}/7\n🏅 Kamu mendapat *+${points} poin*!\nMain lagi: ${PREFIX}angka mulai`);
  }
  if (state.attempts >= state.maxAttempts) {
    await NumberState.deleteOne({ jid: sessionId });
    return reply(`😅 Kesempatan habis! Angka rahasianya *${state.target}*.\nCoba lagi dengan ${PREFIX}angka mulai.`);
  }
  await state.save();
  const direction = guess < state.target ? 'lebih besar' : 'lebih kecil';
  return reply(`↗️ Belum tepat! Angka rahasia *${direction}* dari ${guess}.\nKesempatan: ${state.attempts}/${state.maxAttempts}.`);
}

export const numberGuessGame = Object.freeze({
  id: 'tebak-angka', command: 'angka', name: 'Tebak Angka',
  description: 'Tebak angka rahasia 1–50 dengan 7 kesempatan dan kumpulkan poin.',
  handler: handleNumberGuess,
});
