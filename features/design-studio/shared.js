// Utilitas bersama untuk modul Design Studio (Typography Studio dan Design QA Review).
// Sengaja tidak bergantung pada database, jaringan, maupun paket pihak ketiga.

/** Membersihkan teks pengguna sebelum ditampilkan kembali: tanpa newline/kontrol dan tanpa karakter format WhatsApp. */
export function cleanText(value, max = 60) {
  return String(value ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/[*_~`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

export function parseHex(value) {
  const match = String(value ?? '').trim().match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!match) return null;
  let hex = match[1].toUpperCase();
  if (hex.length === 3) hex = hex.split('').map(char => char + char).join('');
  return { hex: `#${hex}`, rgb: [0, 2, 4].map(index => parseInt(hex.slice(index, index + 2), 16)) };
}

export function relativeLuminance([r, g, b]) {
  const [lr, lg, lb] = [r, g, b].map(channel => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
}

export function contrastRatio(foreground, background) {
  const l1 = relativeLuminance(foreground.rgb);
  const l2 = relativeLuminance(background.rgb);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

export const ICON = { error: '❌', warn: '⚠️', ok: '✅', info: 'ℹ️' };

/** Format angka ringkas: bilangan bulat tanpa desimal, selain itu maksimal dua desimal. */
export function fmt(number) {
  return Number.isInteger(number) ? String(number) : String(Math.round(number * 100) / 100);
}

/** Menyusun daftar temuan menjadi ringkasan hitungan dan daftar prioritas (error dahulu, lalu warn). */
export function summarizeFindings(findings) {
  const count = level => findings.filter(item => item.level === level).length;
  const priorities = [...findings.filter(item => item.level === 'error'), ...findings.filter(item => item.level === 'warn')]
    .filter(item => item.fix);
  return { errors: count('error'), warnings: count('warn'), passed: count('ok'), priorities };
}

export function renderFindings(findings) {
  return findings.map(item => `${ICON[item.level] || '•'} ${item.text}`).join('\n');
}

export function renderPriorities(priorities) {
  if (!priorities.length) return '';
  return `\n\n*Prioritas perbaikan*\n${priorities.map((item, index) => `${index + 1}. ${item.fix}`).join('\n')}`;
}
