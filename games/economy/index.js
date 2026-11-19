export const SHOP_ITEMS = Object.freeze([
  { id: 'badge_bintang', name: 'Lencana Bintang', category: 'Koleksi', price: 120, description: 'Lencana koleksi untuk profil pemain.' },
  { id: 'badge_naga', name: 'Lencana Naga', category: 'Koleksi', price: 250, description: 'Lencana koleksi bertema Pixel Realm.' },
  { id: 'title_legend', name: 'Gelar Legenda', category: 'Gelar', price: 500, description: 'Gelar koleksi untuk inventaris.' },
  { id: 'ticket_bonus', name: 'Tiket Bonus', category: 'Tiket', price: 80, description: 'Item koleksi; belum mengubah peluang atau hasil game.' },
]);

export function utcDay(date = new Date()) { return date.toISOString().slice(0, 10); }
export function normalizeQuantity(value) {
  const number = Number.parseInt(value, 10);
  return Number.isInteger(number) && number >= 1 && number <= 10 ? number : 0;
}
export function formatShop(items = SHOP_ITEMS) {
  return `🛒 *TOKO PEMAIN*\n${items.map((item, index) => `${index + 1}. *${item.name}* — ${item.price} koin\n   ${item.description}\n   ID: ${item.id}`).join('\n\n')}\n\nBeli: .buy <id> [jumlah]\nContoh: .buy badge_bintang 1`;
}
export function formatInventory(inventory = {}) {
  const rows = SHOP_ITEMS.filter(item => Number(inventory?.[item.id]) > 0)
    .map(item => `• ${item.name} ×${Math.max(0, Number(inventory[item.id]) || 0)}`);
  return `🎒 *INVENTARIS PEMAIN*\n\n${rows.length ? rows.join('\n') : 'Inventaris masih kosong.'}`;
}

async function getUser(User, jid) {
  if (!User || !jid) return null;
  return User.findOne({ jid }).select({ activity: 1 }).lean();
}

export async function purchaseShopItem({ User, jid, itemId, quantity = 1 }) {
  const item = SHOP_ITEMS.find(entry => entry.id === itemId);
  const count = normalizeQuantity(quantity);
  if (!item) return { ok: false, reason: 'invalid_item' };
  if (!count) return { ok: false, reason: 'invalid_quantity' };
  const total = item.price * count;
  const updated = await User.findOneAndUpdate(
    { jid, 'activity.coins': { $gte: total } },
    { $inc: { 'activity.coins': -total, [`activity.inventory.${item.id}`]: count },
      $push: { 'activity.transactions': { $each: [{ type: 'purchase', itemId: item.id, quantity: count, amount: total, at: new Date() }], $slice: -30 } } },
    { new: true },
  ).select({ activity: 1 }).lean();
  if (!updated) {
    const user = await getUser(User, jid);
    return user ? { ok: false, reason: 'insufficient_funds', coins: Number(user.activity?.coins) || 0 } : { ok: false, reason: 'user_missing' };
  }
  return { ok: true, item, quantity: count, total, coins: Number(updated.activity?.coins) || 0, inventory: updated.activity?.inventory || {} };
}

export async function claimDailyBonus({ User, jid, date = utcDay() }) {
  const updated = await User.findOneAndUpdate(
    { jid, 'activity.dailyBonus.date': { $ne: date } },
    { $set: { 'activity.dailyBonus.date': date }, $inc: { 'activity.coins': 100, 'activity.xp': 10 },
      $push: { 'activity.transactions': { $each: [{ type: 'daily_bonus', amount: 100, xp: 10, at: new Date() }], $slice: -30 } } },
    { new: true },
  ).select({ activity: 1 }).lean();
  if (!updated) {
    const user = await getUser(User, jid);
    if (!user) return { ok: false, reason: 'user_missing' };
    return { ok: false, reason: user.activity?.dailyBonus?.date === date ? 'already_claimed' : 'failed', coins: Number(user.activity?.coins) || 0 };
  }
  const xp = Math.max(0, Number(updated.activity?.xp) || 0);
  const level = Math.floor(xp / 25) + 1;
  await User.updateOne({ jid }, { $set: { 'activity.level': level } });
  return { ok: true, coins: Number(updated.activity?.coins) || 0, xp, level };
}

export async function handleEconomyCommand(ctx) {
  const { command, args = [], User, userJid, phoneJid, reply, getDbReady, PREFIX = '.' } = ctx;
  if (!getDbReady?.() || !User) return reply('⚠️ Fitur ekonomi membutuhkan koneksi MongoDB.');
  const jid = userJid || phoneJid;
  if (!jid) return reply('⚠️ Identitas pemain tidak ditemukan.');
  if (command === 'shop') return reply(formatShop());
  if (command === 'inventory' || command === 'inv') {
    const user = await getUser(User, jid);
    return reply(`${formatInventory(user?.activity?.inventory)}\n\nSaldo: ${Math.max(0, Number(user?.activity?.coins) || 0)} koin`);
  }
  if (command === 'wallet' || command === 'saldo') {
    const user = await getUser(User, jid);
    return reply(`👛 Saldo kamu: *${Math.max(0, Number(user?.activity?.coins) || 0)} koin*`);
  }
  if (command === 'buy') {
    const result = await purchaseShopItem({ User, jid, itemId: String(args[0] || '').toLowerCase(), quantity: args[1] || 1 });
    if (!result.ok) {
      const messages = { invalid_item: `ID item tidak ditemukan. Lihat ${PREFIX}shop.`, invalid_quantity: 'Jumlah harus 1–10.', insufficient_funds: `Koin tidak cukup. Saldo saat ini ${result.coins} koin.`, user_missing: 'Profil pemain belum tersedia.', failed: 'Pembelian gagal. Coba lagi.' };
      return reply(`⚠️ ${messages[result.reason] || 'Pembelian gagal.'}`);
    }
    return reply(`✅ *PEMBELIAN BERHASIL*\n${result.item.name} ×${result.quantity}\nTotal: ${result.total} koin\nSisa saldo: ${result.coins} koin`);
  }
  if (command === 'daily') {
    const result = await claimDailyBonus({ User, jid });
    if (!result.ok) return reply(result.reason === 'already_claimed' ? '🎁 Bonus harian sudah diklaim hari ini. Kembali besok!' : '⚠️ Bonus harian gagal diklaim.');
    return reply(`🎉 *BONUS HARIAN BERHASIL DIKLAIM*\n+100 koin\n+10 XP\nSaldo: ${result.coins} koin · Level ${result.level}`);
  }
}

export const ECONOMY_COMMANDS = new Set(['shop', 'buy', 'inventory', 'inv', 'wallet', 'saldo', 'daily']);
