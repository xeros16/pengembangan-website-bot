// Pure combat helpers extracted from the original game command handler.
// No database access; state changes are limited to enemy.turn in enemyRetaliation.
export function getBossPhase(enemy) {
  if (!enemy || !(enemy.isBoss || enemy.mode === 'boss' || enemy.isBossDungeon)) return 1;
  const ratio = Number(enemy.hp || 0) / Math.max(1, Number(enemy.maxHp || 1));
  return ratio <= 0.25 ? 3 : ratio <= 0.55 ? 2 : 1;
}

export function getBattleIntent(enemy) {
  if (!enemy) return '';
  const turn = Math.max(1, Number(enemy.turn || 1));
  const interval = enemy.isBoss || enemy.mode === 'boss' || enemy.isBossDungeon ? 2 : 3;
  const phase = getBossPhase(enemy);
  const enraged = enemy.hp <= enemy.maxHp * 0.3;
  if (phase === 3) return '🔥 *FASE 3 — AMUK TERAKHIR!* Boss sangat berbahaya. Gunakan potion atau akhiri pertarungan secepatnya.';
  if (phase === 2) return '⚠️ *FASE 2 — BOSS BERUBAH POLA!* Serangan boss meningkat. Bersiaplah menghadapi serangan berat.';
  if (enraged) return '🔥 Musuh memasuki MODE AMUK! Serangannya lebih berbahaya.';
  if (turn % interval === 0) return '⚠️ Musuh sedang mengumpulkan tenaga untuk SERANGAN BERAT! Pertimbangkan memulihkan HP atau mengakhiri duel.';
  return '👁️ Musuh mengincar gerakanmu. Jurus spesial perlu cooldown.';
}

export function resolveEnemyRetaliation(enemy, game, random = Math.random) {
  if (!enemy) throw new TypeError('Musuh tidak tersedia.');
  const turn = Math.max(1, Number(enemy.turn || 1));
  const interval = enemy.isBoss || enemy.mode === 'boss' || enemy.isBossDungeon ? 2 : 3;
  const heavy = turn % interval === 0;
  const enraged = enemy.hp <= enemy.maxHp * 0.3;
  const phase = getBossPhase(enemy);
  const armorReduction = game.equipment?.armor && game.equipment.armor !== 'none' ? 3 : 0;
  let raw = enemy.atk + Math.floor(random() * 5);
  if (phase === 2) raw = Math.ceil(raw * 1.12);
  if (phase === 3) raw = Math.ceil(raw * 1.25);
  if (heavy) raw = Math.ceil(raw * 1.65);
  if (enraged && phase === 1) raw = Math.ceil(raw * 1.25);
  const dodgeChance = Math.min(0.18, 0.06 + Math.floor(Number(game.level || 1) / 10) * 0.02);
  const dodged = random() < dodgeChance;
  const hit = dodged ? 0 : Math.max(1, raw - armorReduction - Math.floor((game.level || 1) / 3));
  enemy.turn = turn + 1;
  const phaseText = phase === 3 ? '🔥 FASE AMUK! ' : phase === 2 ? '⚡ FASE 2! ' : '';
  return { hit, heavy: heavy && !dodged, enraged: enraged && !dodged, phase, dodged, text: dodged ? `${game.name || 'Petualang'} menghindari serangan ${enemy.name}` : `${phaseText}${heavy ? '💥 SERANGAN BERAT! ' : ''}${enraged ? '🔥 MODE AMUK! ' : ''}${enemy.name} menyerang` };
}
