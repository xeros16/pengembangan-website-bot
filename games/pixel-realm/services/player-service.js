import { normalizeGameState } from './normalize-game.js';

/**
 * Siapkan state game dari dokumen pemain yang sudah diambil dari database.
 * Tidak melakukan query atau menyimpan ke database; caller tetap mengendalikan persistensi.
 */
export function getPlayerGameState(user, currentWeek) {
  if (!user || typeof user !== 'object') {
    throw new TypeError('getPlayerGameState membutuhkan dokumen pemain.');
  }
  return normalizeGameState(user.game, currentWeek);
}

/** Membuat ringkasan profil sederhana yang aman untuk ditampilkan di command. */
export function getPlayerProfileSummary(game) {
  if (!game || typeof game !== 'object') {
    throw new TypeError('getPlayerProfileSummary membutuhkan state game.');
  }
  return {
    name: String(game.name || 'Belum dibuat'),
    className: String(game.class || 'Belum dipilih'),
    level: Math.max(1, Number(game.level || 1)),
    exp: Math.max(0, Number(game.exp || 0)),
    hp: Math.max(0, Number(game.hp || 0)),
    maxHp: Math.max(1, Number(game.maxHp || 100)),
    gold: Math.max(0, Number(game.gold || 0)),
    location: String(game.location || 'Desa Pemula'),
  };
}
