export const DAILY_MISSIONS = Object.freeze([
  { id: 'chat10', title: 'Sapa Komunitas', description: 'Kirim 10 pesan di grup yang diizinkan', metric: 'messages', target: 10, coins: 20, xp: 5 },
  { id: 'games2', title: 'Jelajahi Game', description: 'Mainkan 2 perintah game', metric: 'games', target: 2, coins: 30, xp: 10 },
  { id: 'chat25', title: 'Anggota Aktif', description: 'Kirim 25 pesan di grup yang diizinkan', metric: 'messages', target: 25, coins: 50, xp: 15 },
]);

export function getMissionDate(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function getMissionProgress(state, mission) {
  return Math.max(0, Number(state?.progress?.[mission.metric]) || 0);
}

export function formatDailyMissions(state, date = getMissionDate()) {
  const claimed = new Set(Array.isArray(state?.claimed) ? state.claimed : []);
  const lines = DAILY_MISSIONS.map(mission => {
    const progress = Math.min(mission.target, getMissionProgress(state, mission));
    const done = progress >= mission.target;
    const status = claimed.has(mission.id) ? '✅ Diklaim' : done ? '🎁 Siap diklaim' : '⏳ Berjalan';
    return `${done ? '🟩' : '⬜'} *${mission.title}* — ${progress}/${mission.target}\n${mission.description}\nHadiah: ${mission.coins} koin + ${mission.xp} XP · ${status}\nKlaim: .mission claim ${mission.id}`;
  });
  return `🎯 *MISI HARIAN* (${date})\nReset setiap pukul 00.00 UTC.\n\n${lines.join('\n\n')}\n\nSaldo koin dapat dilihat melalui .player.`;
}

async function ensureMissionDay(User, jid, date) {
  await User.updateOne(
    { jid, 'activity.dailyMissions.date': { $ne: date } },
    { $set: { 'activity.dailyMissions': { date, progress: { messages: 0, games: 0 }, claimed: [] } } },
  );
}

export async function recordMissionProgress(User, jid, metric, amount = 1, date = getMissionDate()) {
  if (!User || !jid || !['messages', 'games'].includes(metric)) return false;
  await ensureMissionDay(User, jid, date);
  await User.updateOne({ jid, 'activity.dailyMissions.date': date }, { $inc: { [`activity.dailyMissions.progress.${metric}`]: Math.max(1, Number(amount) || 1) } });
  return true;
}

export async function claimDailyMission({ User, jid, missionId, date = getMissionDate() }) {
  const mission = DAILY_MISSIONS.find(item => item.id === missionId);
  if (!mission) return { ok: false, reason: 'invalid' };
  await ensureMissionDay(User, jid, date);
  const updated = await User.findOneAndUpdate({
    jid,
    'activity.dailyMissions.date': date,
    [`activity.dailyMissions.progress.${mission.metric}`]: { $gte: mission.target },
    'activity.dailyMissions.claimed': { $ne: mission.id },
  }, {
    $addToSet: { 'activity.dailyMissions.claimed': mission.id },
    $inc: { 'activity.coins': mission.coins, 'activity.xp': mission.xp },
  }, { new: true }).select({ activity: 1 }).lean();
  if (!updated) {
    const current = await User.findOne({ jid }).select({ activity: 1 }).lean();
    const state = current?.activity?.dailyMissions;
    if (state?.date === date && (state.claimed || []).includes(mission.id)) return { ok: false, reason: 'claimed' };
    return { ok: false, reason: 'incomplete' };
  }
  const xp = Math.max(0, Number(updated.activity?.xp) || 0);
  const level = Math.floor(xp / 25) + 1;
  await User.updateOne({ jid }, { $set: { 'activity.level': level } });
  return { ok: true, mission, coins: Number(updated.activity?.coins) || 0, xp, level };
}

export async function handleRewardsCommand(ctx) {
  const { args = [], User, userJid, phoneJid, reply, getDbReady } = ctx;
  if (!getDbReady?.() || !User) return reply('⚠️ Misi harian membutuhkan koneksi MongoDB.');
  const jid = userJid || phoneJid;
  if (!jid) return reply('⚠️ Identitas pemain tidak ditemukan.');
  const date = getMissionDate();
  await ensureMissionDay(User, jid, date);
  const sub = String(args[0] || '').toLowerCase();
  if (sub === 'claim') {
    const result = await claimDailyMission({ User, jid, missionId: String(args[1] || '').toLowerCase(), date });
    if (!result.ok) {
      const message = result.reason === 'invalid' ? 'ID misi tidak dikenal. Gunakan .mission untuk melihat daftar.' : result.reason === 'claimed' ? 'Hadiah misi ini sudah pernah diklaim hari ini.' : 'Misi belum selesai. Selesaikan targetnya sebelum klaim.';
      return reply(`⚠️ ${message}`);
    }
    return reply(`🎉 *HADIAH BERHASIL DIKLAIM*\n${result.mission.title}\n+${result.mission.coins} koin\n+${result.mission.xp} XP\nSaldo: ${result.coins} koin · Level ${result.level}`);
  }
  const user = await User.findOne({ jid }).select({ activity: 1 }).lean();
  return reply(formatDailyMissions(user?.activity?.dailyMissions, date));
}

export const rewardsGame = Object.freeze({
  command: 'mission', name: 'Misi Harian & Hadiah',
  description: 'Selesaikan misi harian untuk mendapatkan koin dan XP.',
  handler: handleRewardsCommand,
});
