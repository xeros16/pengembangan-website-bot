/**
 * Template game baru untuk Game Center.
 * Salin folder ini ke games/<id-game>/, lalu ubah metadata dan handler.
 */
export const sampleGame = Object.freeze({
  id: 'sample-game',
  command: 'samplegame',
  name: 'Sample Game',
  creator: 'Nama Kreator',
  description: 'Deskripsi singkat game baru.',
  async handler(context) {
    const { args = [], reply } = context;
    const subcommand = String(args[0] || 'menu').toLowerCase();

    if (subcommand === 'menu') {
      return reply('🎮 Sample Game\n\nTambahkan menu dan perintah game di games/sample-game/commands/.');
    }

    return reply(`Perintah Sample Game tidak dikenal: ${subcommand}`);
  },
});

export default sampleGame;
