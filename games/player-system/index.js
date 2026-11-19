const MILESTONES = [
  { id: 'newcomer', label: 'Pendatang Baru', messages: 1, icon: '🌱' },
  { id: 'active', label: 'Aktif', messages: 25, icon: '🔥' },
  { id: 'regular', label: 'Pengunjung Tetap', messages: 100, icon: '⭐' },
  { id: 'veteran', label: 'Veteran Komunitas', messages: 500, icon: '🏅' },
  { id: 'legend', label: 'Legenda Komunitas', messages: 1000, icon: '👑' },
];

export function getPlayerLevel(xp = 0) {
  return Math.floor(Math.max(0, Number(xp) || 0) / 25) + 1;
}

export function getPlayerAchievements(messages = 0) {
  const count = Math.max(0, Number(messages) || 0);
  return MILESTONES.filter(item => count >= item.messages);
}

export function formatPlayerProfile(user, fallbackName = 'Pemain') {
  const activity = user?.activity || {};
  const xp = Math.max(0, Number(activity.xp) || 0);
  const messages = Math.max(0, Number(activity.messages) || 0);
  const level = getPlayerLevel(xp);
  const next = level * 25;
  const achievements = getPlayerAchievements(messages);
  const inventory = activity.inventory && typeof activity.inventory === 'object' ? activity.inventory : {};
  const itemCount = Object.values(inventory).reduce((sum, value) => sum + Math.max(0, Number(value) || 0), 0);
  return [
    `👤 *PROFIL PEMAIN*`,
    `Nama: ${String(fallbackName || 'Pemain').slice(0, 40)}`,
    `Level: ${level}`,
    `XP: ${xp} (${next - xp} XP menuju level ${level + 1})`,
    `Koin: ${Math.max(0, Number(activity.coins) || 0)}`,
    `Item koleksi: ${itemCount}`,
    `Pesan tercatat: ${messages}`,
    `Pencapaian: ${achievements.length}/${MILESTONES.length}`,
    achievements.length ? achievements.map(item => `${item.icon} ${item.label}`).join('\n') : 'Belum ada pencapaian. Mulai beraktivitas untuk mendapatkannya!',
  ].join('\n');
}

export async function handlePlayerSystem(ctx) {
  const { args = [], User, userJid, phoneJid, msg, pushName, reply, PREFIX = '.', getDbReady } = ctx;
  if (!getDbReady?.() || !User) return reply('⚠️ Sistem profil pemain membutuhkan koneksi MongoDB.');
  const sub = String(args[0] || 'profil').toLowerCase();
  if (['topkoin', 'kaya', 'rich'].includes(sub)) {
    const rows = await User.find({}).sort({ 'activity.coins': -1, 'activity.xp': -1 }).limit(10).select({ activity: 1 }).lean();
    if (!rows.length) return reply('Belum ada data pemain.');
    const text = rows.map((row, i) => `${i + 1}. ${Math.max(0, Number(row.activity?.coins) || 0)} koin`).join('\n');
    return reply(`💰 *TOP 10 PEMAIN TERKAYA*\n\n${text}`);
  }
  if (['top', 'rank', 'leaderboard', 'papan'].includes(sub)) {
    const rows = await User.find({}).sort({ 'activity.xp': -1, 'activity.messages': -1 }).limit(10).select({ jid: 1, activity: 1 }).lean();
    if (!rows.length) return reply('Belum ada data pemain.');
    const text = rows.map((row, i) => {
      const xp = Math.max(0, Number(row.activity?.xp) || 0);
      return `${i + 1}. Level ${getPlayerLevel(xp)} — ${xp} XP`;
    }).join('\n');
    return reply(`🏆 *TOP 10 PEMAIN GLOBAL*\n\n${text}\n\nGunakan ${PREFIX}player untuk melihat profilmu.`);
  }
  if (!['profil', 'profile', 'me', ''].includes(sub)) return reply(`Perintah: ${PREFIX}player [profil|top|topkoin]\n${PREFIX}player top — 10 pemain teratas berdasarkan XP.\n${PREFIX}player topkoin — 10 saldo koin tertinggi.`);
  const jid = userJid || phoneJid;
  const user = await User.findOne({ jid }).select({ jid: 1, activity: 1 }).lean();
  return reply(formatPlayerProfile(user, pushName || msg?.pushName || 'Pemain'));
}

export const playerSystemGame = Object.freeze({
  command: 'player', name: 'Profil Pemain',
  description: 'Profil pemain, level aktivitas, XP, koin, pencapaian, dan 10 besar global.',
  handler: handlePlayerSystem,
});
