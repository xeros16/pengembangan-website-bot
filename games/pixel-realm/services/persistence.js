// Lapisan persistensi progres RPG. Tetap menggunakan dokumen dan field MongoDB yang sama.
export function createGamePersistence({ User, userJid, getGame, user }) {
  if (!User || typeof User.updateOne !== 'function') throw new TypeError('Model User wajib tersedia.');
  if (typeof getGame !== 'function') throw new TypeError('getGame wajib berupa fungsi.');

  return async function saveGame() {
    const game = getGame();
    const result = await User.updateOne({ jid: userJid }, { $set: { game } });
    if (!result.matchedCount) throw new Error('Data pemain tidak ditemukan saat menyimpan game.');
    if (user) user.game = game;
    return result;
  };
}

// Menghasilkan tanggal lokal WIB dan nomor pekan ISO yang dipakai quest harian/mingguan.
export function getGameDateContext(now = new Date()) {
  const today = now.toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });
  const d = new Date(`${today}T12:00:00+07:00`);
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const y = d.getUTCFullYear();
  const start = new Date(Date.UTC(y, 0, 1));
  const w = Math.ceil((((d - start) / 86400000) + 1) / 7);
  return { today, currentWeek: `${y}-W${String(w).padStart(2, '0')}` };
}
