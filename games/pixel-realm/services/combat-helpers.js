// Helper combat dan pet dipisahkan agar mudah diuji dan dirawat.
export function createGameCombatHelpers(game) {
const petCatalog = { fox: { name: 'Rubah Senja', emoji: '🦊', price: 60, atk: 4 }, wolf: { name: 'Serigala Bulan', emoji: '🐺', price: 85, atk: 6 }, slime: { name: 'Slime Mini', emoji: '🟢', price: 45, atk: 3 }, dragon: { name: 'Naga Mini', emoji: '🐉', price: 160, atk: 9 } };
const heroArt = () => (game.heroStyle === 'heroine'
  ? ['      /\\_/\\', '     ( o.o )  ✦', '      > ^ <', '     /|   |\\', '      /   \\'].join('\n')
  : ['       .-^- .', '      /  ⚔  \\', '     |  o o  |', '      \\  ^  /', '       /|_|\\', '        / \\'].join('\n'));
const petLabel = () => game.pet?.species && petCatalog[game.pet.species] ? `${petCatalog[game.pet.species].emoji} ${game.pet.name || petCatalog[game.pet.species].name} Lv.${game.pet.level}` : 'Belum memiliki pet';
const petAttack = () => game.pet?.species && petCatalog[game.pet.species] ? petCatalog[game.pet.species].atk + (game.pet.level - 1) * 2 + (game.pet.evolved ? 8 : 0) : 0;
// Sistem giliran: jurus punya cooldown, musuh memberi tanda sebelum serangan berat.
const bossPhase = (enemy) => {
  if (!enemy || !(enemy.isBoss || enemy.mode === 'boss' || enemy.isBossDungeon)) return 1;
  const ratio = Number(enemy.hp || 0) / Math.max(1, Number(enemy.maxHp || 1));
  return ratio <= 0.25 ? 3 : ratio <= 0.55 ? 2 : 1;
};
const battleIntent = (enemy) => {
  if (!enemy) return '';
  const turn = Math.max(1, Number(enemy.turn || 1));
  const interval = enemy.isBoss || enemy.mode === 'boss' || enemy.isBossDungeon ? 2 : 3;
  const phase = bossPhase(enemy);
  const enraged = enemy.hp <= enemy.maxHp * 0.3;
  if (phase === 3) return '🔥 *FASE 3 — AMUK TERAKHIR!* Boss sangat berbahaya. Gunakan potion atau akhiri pertarungan secepatnya.';
  if (phase === 2) return '⚠️ *FASE 2 — BOSS BERUBAH POLA!* Serangan boss meningkat. Bersiaplah menghadapi serangan berat.';
  if (enraged) return '🔥 Musuh memasuki MODE AMUK! Serangannya lebih berbahaya.';
  if (turn % interval === 0) return '⚠️ Musuh sedang mengumpulkan tenaga untuk SERANGAN BERAT! Pertimbangkan memulihkan HP atau mengakhiri duel.';
  return '👁️ Musuh mengincar gerakanmu. Jurus spesial perlu cooldown.';
};
const enemyRetaliation = (enemy) => {
  const turn = Math.max(1, Number(enemy.turn || 1));
  const interval = enemy.isBoss || enemy.mode === 'boss' || enemy.isBossDungeon ? 2 : 3;
  const heavy = turn % interval === 0;
  const enraged = enemy.hp <= enemy.maxHp * 0.3;
  const phase = bossPhase(enemy);
  const armorReduction = game.equipment?.armor && game.equipment.armor !== 'none' ? 3 : 0;
  let raw = enemy.atk + Math.floor(Math.random() * 5);
  if (phase === 2) raw = Math.ceil(raw * 1.12);
  if (phase === 3) raw = Math.ceil(raw * 1.25);
  if (heavy) raw = Math.ceil(raw * 1.65);
  if (enraged && phase === 1) raw = Math.ceil(raw * 1.25);
  const dodgeChance = Math.min(0.18, 0.06 + Math.floor(Number(game.level || 1) / 10) * 0.02);
  const dodged = Math.random() < dodgeChance;
  const hit = dodged ? 0 : Math.max(1, raw - armorReduction - Math.floor((game.level || 1) / 3));
  enemy.turn = turn + 1;
  const phaseText = phase === 3 ? '🔥 FASE AMUK! ' : phase === 2 ? '⚡ FASE 2! ' : '';
  return { hit, heavy: heavy && !dodged, enraged: enraged && !dodged, phase, dodged, text: dodged ? `${game.name || 'Petualang'} menghindari serangan ${enemy.name}` : `${phaseText}${heavy ? '💥 SERANGAN BERAT! ' : ''}${enraged ? '🔥 MODE AMUK! ' : ''}${enemy.name} menyerang` };
};
  return { petCatalog, heroArt, petLabel, petAttack, bossPhase, battleIntent, enemyRetaliation };
}
