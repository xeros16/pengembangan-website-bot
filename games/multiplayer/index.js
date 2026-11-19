// Multiplayer games: group sessions and direct 1v1 challenges. State is persisted when MongoDB is available.
import { attachMultiplayerPersistence, scheduleMultiplayerSave } from './persistence.js';
let groupSessions = new Map();
let duelChallenges = new Map();
let duelMatches = new Map();
attachMultiplayerPersistence({ groupSessions, duelChallenges, duelMatches });

class PersistedMap extends Map {
  set(key, value) { const result = super.set(key, value); scheduleMultiplayerSave(); return result; }
  delete(key) { const result = super.delete(key); if (result) scheduleMultiplayerSave(); return result; }
  clear() { super.clear(); scheduleMultiplayerSave(); }
}
for (const [name, oldMap] of [['rooms', groupSessions], ['challenges', duelChallenges], ['duels', duelMatches]]) {
  const next = new PersistedMap(oldMap);
  if (name === 'rooms') groupSessions = next;
  else if (name === 'challenges') duelChallenges = next;
  else duelMatches = next;
}
attachMultiplayerPersistence({ groupSessions, duelChallenges, duelMatches });

const QUIZ = [
  { category: 'sains', q: 'Planet terbesar di tata surya?', a: ['jupiter'] },
  { category: 'sains', q: 'Proses tumbuhan membuat makanan dengan bantuan cahaya?', a: ['fotosintesis'] },
  { category: 'umum', q: 'Benua terbesar di dunia?', a: ['asia'] },
  { category: 'teknologi', q: 'Satuan untuk mengukur kuat arus listrik?', a: ['ampere', 'amper'] },
  { category: 'umum', q: 'Hewan mamalia terbesar di dunia?', a: ['paus biru'] },
  { category: 'sains', q: 'Rumus kimia air?', a: ['h2o'] },
  { category: 'sains', q: 'Planet yang dikenal sebagai Planet Merah?', a: ['mars'] },
  { category: 'desain', q: 'Kepanjangan RGB dalam warna digital?', a: ['red green blue', 'merah hijau biru'] },
  { category: 'teknologi', q: 'Perangkat yang menghubungkan beberapa jaringan komputer dan meneruskan paket berdasarkan IP?', a: ['router'] },
  { category: 'umum', q: 'Samudra terluas di bumi?', a: ['pasifik', 'samudra pasifik'] },
  { category: 'desain', q: 'Prinsip desain yang mengatur perbedaan mencolok antar elemen disebut?', a: ['kontras'] },
];
const WORDS = ['apel', 'lampu', 'komputer', 'bintang', 'sekolah', 'kamera', 'hujan', 'planet', 'jendela', 'sepeda', 'pohon', 'samudra'];
const normalize = value => String(value || '').toLocaleLowerCase('id-ID').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, '').trim().replace(/\s+/g, ' ');
const displayName = ctx => String(ctx.pushName || ctx.senderName || ctx.userJid || ctx.sender || 'Pemain').slice(0, 40);
const playerId = ctx => String(ctx.phoneJid || ctx.userJid || ctx.sender || 'unknown');
const roomKey = ctx => String(ctx.remoteJid || 'private');
const random = list => list[Math.floor(Math.random() * list.length)];

function menu(PREFIX) {
  return `🎮 *MULTIPLAYER CENTER*\n\n*Bermain dalam grup*\n• ${PREFIX}multi buat sambung — buat ruang Sambung Kata\n• ${PREFIX}multi buat kuis [kategori] — kuis: umum/sains/teknologi/desain\n• ${PREFIX}multi gabung — gabung ke ruang grup\n• ${PREFIX}multi mulai — mulai pertandingan\n• ${PREFIX}multi jawab <jawaban> — jawab soal / sambung kata\n• ${PREFIX}multi status — lihat pemain dan giliran\n• ${PREFIX}multi papan — papan skor
• ${PREFIX}multi keluar — keluar dari ruang saat lobi
• ${PREFIX}multi selesai — tutup ruang (pembuat)\n\n*Duel 1 lawan 1*\n• ${PREFIX}multi duel <nomor> — tantang pemain\n• ${PREFIX}multi terima — terima tantangan\n• ${PREFIX}multi tolak — tolak tantangan\n• ${PREFIX}multi suit <batu|gunting|kertas> — pilih langkah\n\nKategori kuis: umum, sains, teknologi, desain, atau semua.\nSemua pemain harus berada di chat yang diizinkan bot. Ruang dan skor tersimpan jika MongoDB aktif.`;
}

export async function handleMultiplayer(context) {
  try {
  const { args = [], reply, PREFIX = '.', isGroup = false } = context;
  const sub = normalize(args[0] || 'menu');
  const room = roomKey(context);
  const pid = playerId(context);
  const name = displayName(context);
  if (['menu', 'help', 'bantuan'].includes(sub)) return reply(menu(PREFIX));

  if (sub === 'buat' || sub === 'create') {
    if (!isGroup) return reply('⚠️ Ruang multiplayer grup hanya bisa dibuat di dalam grup WhatsApp.');
    const type = normalize(args[1] || '');
    const quizCategory = normalize(args[2] || 'semua');
    if (!['sambung', 'sambung kata', 'kuis', 'kuis rebutan'].includes(type)) return reply(`Pilih jenis game:\n${PREFIX}multi buat sambung\n${PREFIX}multi buat kuis`);
    if (type.startsWith('kuis') && !['semua', 'umum', 'sains', 'teknologi', 'desain'].includes(quizCategory)) return reply('Kategori kuis: umum, sains, teknologi, desain, atau semua.');
    if (groupSessions.has(room)) return reply('⚠️ Sudah ada ruang multiplayer aktif di grup ini. Ketik ${PREFIX}multi status untuk melihatnya.');
    groupSessions.set(room, { type: type.startsWith('sambung') ? 'sambung' : 'kuis', category: quizCategory, host: pid, players: [{ id: pid, name, score: 0 }], state: 'lobby', turn: 0, used: [], lastWord: '', round: null, createdAt: Date.now() });
    return reply(`🏟️ *RUANG MULTIPLAYER DIBUAT*\nGame: *${type.startsWith('sambung') ? 'Sambung Kata' : 'Kuis Rebutan'}*\nHost: ${name}\n\nPemain lain ketik *${PREFIX}multi gabung*.\nHost ketik *${PREFIX}multi mulai* jika siap.`);
  }

  if (sub === 'gabung' || sub === 'join') {
    const session = groupSessions.get(room);
    if (!session) return reply(`Belum ada ruang aktif. Buat dengan ${PREFIX}multi buat sambung atau ${PREFIX}multi buat kuis.`);
    if (session.state !== 'lobby') return reply('Pertandingan sudah dimulai; pemain baru tidak bisa bergabung di ronde ini.');
    if (session.players.some(p => p.id === pid)) return reply('Kamu sudah bergabung.');
    if (session.players.length >= 12) return reply('Ruang penuh (maksimal 12 pemain).');
    session.players.push({ id: pid, name, score: 0 });
    return reply(`✅ *${name}* bergabung! Pemain: ${session.players.length}/12.`);
  }

  if (sub === 'keluar' || sub === 'leave') {
    const session = groupSessions.get(room);
    if (!session) return reply('Tidak ada ruang multiplayer aktif di chat ini.');
    if (session.state !== 'lobby') return reply('Pemain tidak bisa keluar setelah pertandingan dimulai. Selesaikan pertandingan terlebih dahulu.');
    const index = session.players.findIndex(p => p.id === pid);
    if (index < 0) return reply('Kamu belum bergabung di ruang ini.');
    const [left] = session.players.splice(index, 1);
    if (!session.players.length) { groupSessions.delete(room); return reply('Ruang kosong dan otomatis ditutup.'); }
    if (session.host === pid) session.host = session.players[0].id;
    return reply(`👋 ${left.name} keluar dari ruang. Host sekarang: ${session.players.find(p => p.id === session.host).name}.`);
  }

  if (sub === 'papan' || sub === 'leaderboard' || sub === 'skor') {
    const session = groupSessions.get(room);
    if (!session) return reply('Belum ada ruang aktif untuk menampilkan papan skor.');
    const ranking = [...session.players].sort((a, b) => b.score - a.score).map((p, i) => `${i + 1}. ${p.name} — ${p.score} poin`).join('\n');
    return reply(`🏆 *PAPAN SKOR MULTIPLAYER*\n\n${ranking}`);
  }

  if (sub === 'status' || sub === 'room') {
    const session = groupSessions.get(room);
    if (!session) return reply('Tidak ada ruang multiplayer aktif di chat ini.');
    const players = session.players.map((p, i) => `${i + 1}. ${p.name} — ${p.score} poin${session.state === 'playing' && session.type === 'sambung' && i === session.turn ? ' ◀ giliran' : ''}`).join('\n');
    return reply(`🏟️ *STATUS MULTIPLAYER*\nGame: ${session.type === 'sambung' ? 'Sambung Kata' : `Kuis Rebutan (${session.category})`}\nStatus: ${session.state === 'lobby' ? 'Menunggu pemain' : 'Berlangsung'}\n\n${players}`);
  }

  if (sub === 'mulai' || sub === 'start') {
    const session = groupSessions.get(room);
    if (!session) return reply(`Belum ada ruang. Buat dulu dengan ${PREFIX}multi buat sambung atau ${PREFIX}multi buat kuis.`);
    if (session.host !== pid) return reply('Hanya pembuat ruang yang bisa memulai pertandingan.');
    if (session.state !== 'lobby') return reply('Pertandingan sudah berjalan.');
    if (session.players.length < 2) return reply('Minimal 2 pemain untuk memulai. Ajak anggota lain dengan ${PREFIX}multi gabung.');
    session.state = 'playing';
    session.turn = 0;
    if (session.type === 'sambung') {
      session.lastWord = random(WORDS);
      return reply(`🔤 *SAMBUNG KATA DIMULAI!*\nKata pertama: *${session.lastWord.toUpperCase()}*\nPemain berikutnya harus menyebut kata yang dimulai dengan huruf *${session.lastWord.slice(-1).toUpperCase()}*.\nUrutan pemain mengikuti daftar. Ketik ${PREFIX}multi jawab <kata>.`);
    }
    session.round = random(QUIZ.filter(q => session.category === 'semua' || q.category === session.category));
    return reply(`⚡ *KUIS REBUTAN DIMULAI!*\n\n❓ ${session.round.q}\n\nSiapa cepat dia dapat! Jawab dengan ${PREFIX}multi jawab <jawaban>.`);
  }

  if (sub === 'jawab' || sub === 'answer') {
    const session = groupSessions.get(room);
    if (!session || session.state !== 'playing') return reply(`Tidak ada pertandingan aktif. Buat ruang dengan ${PREFIX}multi buat sambung atau ${PREFIX}multi buat kuis.`);
    const answer = normalize(args.slice(1).join(' '));
    if (!answer) return reply(`Format: ${PREFIX}multi jawab <jawaban>`);
    const player = session.players.find(p => p.id === pid);
    if (!player) return reply('Kamu belum bergabung dalam pertandingan ini.');
    if (session.type === 'kuis') {
      if (!session.round) return reply('Ronde sedang disiapkan, coba lagi.');
      if (!session.round.a.includes(answer)) return reply('❌ Belum tepat! Pemain lain masih boleh menjawab.');
      player.score += 10;
      const winner = player.name;
      const pool = QUIZ.filter(q => (session.category === 'semua' || q.category === session.category) && q.q !== session.round.q);
      session.round = random(pool.length ? pool : QUIZ.filter(q => session.category === 'semua' || q.category === session.category));
      return reply(`🎉 *${winner}* menjawab dengan benar! +10 poin.\n\n❓ Soal berikutnya: ${session.round.q}\nJawab: ${PREFIX}multi jawab <jawaban>`);
    }
    if (session.players[session.turn]?.id !== pid) return reply(`Belum giliranmu. Sekarang giliran ${session.players[session.turn]?.name || 'pemain berikutnya'}.`);
    if (answer.length < 2 || answer[0] !== session.lastWord.slice(-1)) return reply(`Kata harus dimulai dengan huruf *${session.lastWord.slice(-1).toUpperCase()}*. Coba lagi.`);
    if (session.used.includes(answer)) return reply('Kata itu sudah pernah digunakan. Cari kata lain.');
    session.used.push(answer);
    session.lastWord = answer;
    session.players[session.turn].score += 5;
    session.turn = (session.turn + 1) % session.players.length;
    return reply(`✅ *${name}* menyambung: ${answer.toUpperCase()} (+5 poin).\nKata berikutnya harus dimulai dengan *${answer.slice(-1).toUpperCase()}*.\nGiliran: ${session.players[session.turn].name}.`);
  }

  if (sub === 'selesai' || sub === 'stop') {
    const session = groupSessions.get(room);
    if (!session) return reply('Tidak ada ruang aktif.');
    if (session.host !== pid) return reply('Hanya host yang bisa menutup ruang.');
    const ranking = [...session.players].sort((a, b) => b.score - a.score).map((p, i) => `${i + 1}. ${p.name} — ${p.score} poin`).join('\n');
    groupSessions.delete(room);
    return reply(`🏁 *PERTANDINGAN SELESAI*\n${ranking}\n\nRuang telah ditutup.`);
  }

  if (sub === 'duel') {
    if (!isGroup) return reply('⚠️ Tantangan duel saat ini harus dibuat di grup yang sama agar kedua pemain bisa ikut ronde yang sama.');
    const targetRaw = String(args[1] || '').replace(/\D/g, '');
    if (!targetRaw || targetRaw.length < 8) return reply(`Format: ${PREFIX}multi duel 628xxxxxxxxxx`);
    const target = `${targetRaw}@s.whatsapp.net`;
    if (target === pid) return reply('Kamu tidak bisa menantang diri sendiri.');
    const key = `${room}:${target}`;
    duelChallenges.set(key, { room, from: pid, fromName: name, to: target, toName: targetRaw, createdAt: Date.now() });
    return reply(`⚔️ *TANTANGAN DUEL DIKIRIM*\n${name} menantang @${targetRaw} bermain Suit!\nPenerima ketik ${PREFIX}multi terima atau ${PREFIX}multi tolak.`, [target]);
  }

  if (sub === 'terima' || sub === 'tolak') {
    if (!isGroup) return reply('⚠️ Terima atau tolak tantangan di grup tempat tantangan dibuat.');
    const found = [...duelChallenges.entries()].find(([, c]) => c.room === room && c.to === pid && Date.now() - c.createdAt < 5 * 60_000);
    if (!found) return reply('Tidak ada tantangan duel yang menunggumu (masa berlaku 5 menit).');
    const [key, challenge] = found;
    duelChallenges.delete(key);
    if (sub === 'tolak') return reply(`Tantangan dari ${challenge.fromName} ditolak.`);
    duelMatches.set(room, { players: [challenge.from, challenge.to], names: [challenge.fromName, name], moves: {} });
    return reply(`⚔️ *DUEL SUIT DIMULAI!*\n${challenge.fromName} vs ${name}\nKeduanya kirim ${PREFIX}multi suit batu / gunting / kertas. Pilihan disembunyikan sampai keduanya memilih.`);
  }

  if (sub === 'suit') {
    if (!isGroup) return reply('⚠️ Mainkan duel di grup tempat tantangan dibuat.');
    const match = duelMatches.get(room);
    const move = normalize(args[1] || '');
    if (!match || !match.players.includes(pid)) return reply('Kamu tidak memiliki duel aktif di chat ini.');
    if (!['batu', 'gunting', 'kertas'].includes(move)) return reply(`Pilih: ${PREFIX}multi suit batu, gunting, atau kertas.`);
    if (match.moves[pid]) return reply('Pilihanmu sudah tercatat. Tunggu lawan.');
    match.moves[pid] = move;
    const other = match.players.find(id => id !== pid);
    if (!match.moves[other]) return reply('✅ Pilihanmu tersimpan secara rahasia. Menunggu lawan memilih.');
    const a = match.moves[match.players[0]], b = match.moves[match.players[1]];
    const wins = { batu: 'gunting', gunting: 'kertas', kertas: 'batu' };
    const result = a === b ? 'Seri!' : wins[a] === b ? `${match.names[0]} menang!` : `${match.names[1]} menang!`;
    duelMatches.delete(room);
    return reply(`🏁 *HASIL DUEL SUIT*\n${match.names[0]}: ${a}\n${match.names[1]}: ${b}\n\n${result}`);
  }

  return reply(menu(PREFIX));
  } finally {
    // Also persist nested mutations (scores, turns, round answers, and duel moves).
    scheduleMultiplayerSave();
  }
}

export const multiplayerGame = Object.freeze({ command: 'multi', name: 'Multiplayer', description: 'Sambung Kata dan Kuis Rebutan dalam grup, serta Duel Suit 1 lawan 1.', handler: handleMultiplayer });
export function resetMultiplayerState() { groupSessions.clear(); duelChallenges.clear(); duelMatches.clear(); }
export function getMultiplayerStateCounts() { return { rooms: groupSessions.size, challenges: duelChallenges.size, duels: duelMatches.size }; }
