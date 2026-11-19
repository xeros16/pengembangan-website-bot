// Lightweight game metadata for help/catalog rendering.
// Runtime handlers remain registered in games/index.js; this file has no database dependencies.
export const GAME_COMMAND_METADATA = Object.freeze([
  Object.freeze({
    command: 'pixelrealm',
    name: 'Pixel Realm',
    description: 'RPG petualangan WhatsApp dengan karakter, pertarungan, crafting, guild, dan progres tersimpan.',
  }),
  Object.freeze({
    command: 'tebak',
    name: 'Tebak-Tebakan Multikategori',
    description: 'Tebak kata dari pengetahuan umum, sains, teknologi, geografi, hewan, makanan, olahraga, sejarah, desain, dan logika.',
  }),
  Object.freeze({
    command: 'angka',
    name: 'Tebak Angka',
    description: 'Tebak angka rahasia 1–50 dengan 7 kesempatan dan kumpulkan poin.',
  }),
  Object.freeze({
    command: 'acak',
    name: 'Acak Kata',
    description: 'Susun huruf acak menjadi kata dari kategori pengetahuan umum, sains, teknologi, dan lainnya.',
  }),
  Object.freeze({
    command: 'misteri',
    name: 'Misteri & Detektif',
    description: 'Investigasi episodik: kunjungi lokasi, periksa bukti, interogasi saksi, dan pecahkan kasus fiksi.',
  }),
  Object.freeze({
    command: 'multi',
    name: 'Multiplayer',
    description: 'Sambung Kata dan Kuis Rebutan dalam grup, serta Duel Suit 1 lawan 1.',
  }),
  Object.freeze({
    command: 'player',
    name: 'Profil Pemain',
    description: 'Profil pemain, level aktivitas, XP, koin, pencapaian, dan 10 besar global.',
  }),
  Object.freeze({
    command: 'mission',
    name: 'Misi Harian & Hadiah',
    description: 'Selesaikan misi harian untuk mendapatkan koin dan XP.',
  }),
]);
