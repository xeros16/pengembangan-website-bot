import { cleanText, contrastRatio, fmt, parseHex, renderFindings, renderPriorities, summarizeFindings } from './shared.js';

// Review QA berbasis angka yang diisi pengguna. Bukan penilaian visual dan bukan sertifikasi aksesibilitas.
// Checklist manual lengkap tetap tersedia lewat .designqa <jenis>.

export const QA_KINDS = ['poster', 'sosial', 'logo', 'cetak', 'kemasan', 'web', 'app'];
const DIGITAL = new Set(['sosial', 'web', 'app', 'logo']);
const HAS_CTA = new Set(['poster', 'sosial', 'web', 'app']);
const HAS_ALT = new Set(['sosial', 'web', 'app']);
const HAS_TAP = new Set(['web', 'app']);
const HAS_BLEED = new Set(['poster', 'cetak', 'kemasan']);
const HAS_DPI = new Set(['poster', 'cetak', 'kemasan']);
const ABSOLUTE_BODY = new Set(['web', 'app', 'cetak']);

const KEY_ALIASES = {
  teks: 'teks', text: 'teks', warnateks: 'teks',
  latar: 'latar', bg: 'latar', background: 'latar',
  aksen: 'aksen', accent: 'aksen', tombol: 'aksen',
  body: 'body', isi: 'body',
  judul: 'judul', heading: 'judul', h1: 'judul',
  font: 'font', fonts: 'font',
  tap: 'tap', target: 'tap',
  cta: 'cta', alt: 'alt', bleed: 'bleed', dpi: 'dpi',
};
const KNOWN = new Set(Object.values(KEY_ALIASES));
const YES = new Set(['ya', 'yes', 'y', 'true', '1', 'ada', 'sudah']);
const NO = new Set(['tidak', 'no', 'n', 'false', '0', 'belum', 'tdk']);

export const QA_REVIEW_USAGE = prefix => `🧪 *DESIGN QA REVIEW*\nPeriksa kesiapan desain dari angka dan data yang Anda isi.\n\nFormat: ${prefix}qareview <jenis> key=nilai key=nilai ...\nJenis: ${QA_KINDS.join(', ')}\n\n*Isian (semua opsional)*\n• teks=#222222 latar=#FFFFFF — kontras teks\n• aksen=#2D6CDF — warna tombol/komponen terhadap latar\n• body=16 judul=32 — ukuran teks (px untuk digital, pt untuk cetak)\n• font=2 — jumlah keluarga font\n• tap=44 — target sentuh px (web/app)\n• cta=ya alt=ya — CTA jelas, alt text/label aksesibilitas\n• bleed=3 — bleed mm (poster/cetak/kemasan)\n• dpi=300 — resolusi efektif gambar (poster/cetak/kemasan)\n\nContoh:\n${prefix}qareview web teks=#222222 latar=#FFFFFF aksen=#2D6CDF body=16 judul=32 font=2 tap=44 cta=ya alt=ya\n${prefix}qareview cetak body=10 judul=24 font=2 bleed=3 dpi=300\n\nChecklist manual lengkap: ${prefix}designqa <jenis>`;

/** Mengurai token "kunci=nilai". Kembalikan nilai valid, daftar tidak valid, dan kunci yang tidak dikenal. */
export function parseQaArgs(tokens) {
  const values = {};
  const invalid = [];
  const unknown = [];
  for (const token of tokens) {
    const index = token.indexOf('=');
    if (index <= 0) { unknown.push(cleanText(token, 20)); continue; }
    const rawKey = token.slice(0, index).toLowerCase().replace(/[^a-z0-9]/g, '');
    const rawValue = token.slice(index + 1);
    const key = KEY_ALIASES[rawKey];
    if (!key) { unknown.push(cleanText(rawKey || token, 20)); continue; }
    if (key === 'teks' || key === 'latar' || key === 'aksen') {
      const color = parseHex(rawValue);
      if (!color) invalid.push(`${key}=${cleanText(rawValue, 12)} (HEX 3/6 digit)`); else values[key] = color;
    } else if (key === 'cta' || key === 'alt') {
      const word = rawValue.toLowerCase();
      if (YES.has(word)) values[key] = true; else if (NO.has(word)) values[key] = false; else invalid.push(`${key}=${cleanText(rawValue, 12)} (ya/tidak)`);
    } else {
      const number = Number(rawValue.replace(/(px|pt|mm|dpi)$/i, '').replace(',', '.'));
      const limits = { body: [3, 400], judul: [3, 800], font: [1, 20], tap: [1, 200], bleed: [0, 50], dpi: [10, 2400] };
      const [min, max] = limits[key];
      if (!Number.isFinite(number) || number < min || number > max || (key === 'font' && !Number.isInteger(number))) invalid.push(`${key}=${cleanText(rawValue, 12)} (angka ${min}–${max})`);
      else values[key] = number;
    }
  }
  return { values, invalid, unknown };
}

/** Review murni (tanpa I/O) agar mudah diuji. */
export function reviewDesign(kind, values) {
  const findings = [];
  const notChecked = [];
  const unit = DIGITAL.has(kind) ? 'px' : 'pt';

  // Kontras teks
  if (values.teks && values.latar) {
    const ratio = contrastRatio(values.teks, values.latar);
    const shown = `${fmt(Math.round(ratio * 100) / 100)}:1`;
    if (ratio >= 7) findings.push({ level: 'ok', text: `Kontras teks ${values.teks.hex} di ${values.latar.hex}: ${shown} (memenuhi WCAG AAA).` });
    else if (ratio >= 4.5) findings.push({ level: 'ok', text: `Kontras teks ${values.teks.hex} di ${values.latar.hex}: ${shown} (memenuhi WCAG AA teks normal).` });
    else if (ratio >= 3) findings.push({ level: 'warn', text: `Kontras teks ${values.teks.hex} di ${values.latar.hex}: ${shown}; hanya cukup untuk teks besar.`, fix: 'Gelapkan teks atau terangkan latar hingga rasio ≥ 4.5:1 untuk teks isi (cek dengan .contrast).' });
    else findings.push({ level: 'error', text: `Kontras teks ${values.teks.hex} di ${values.latar.hex}: ${shown}; terlalu rendah untuk dibaca nyaman.`, fix: 'Ubah warna teks atau latar hingga rasio minimal 4.5:1 (cek dengan .contrast).' });
  } else notChecked.push('kontras teks (teks=, latar=)');

  // Kontras aksen/komponen
  if (values.aksen && values.latar) {
    const ratio = contrastRatio(values.aksen, values.latar);
    const shown = `${fmt(Math.round(ratio * 100) / 100)}:1`;
    if (ratio >= 3) findings.push({ level: 'ok', text: `Kontras aksen ${values.aksen.hex} terhadap latar: ${shown} (≥ 3:1 untuk komponen UI/grafis).` });
    else findings.push({ level: 'warn', text: `Kontras aksen ${values.aksen.hex} terhadap latar: ${shown}; komponen/tombol sulit dibedakan dari latar.`, fix: 'Gelapkan atau terangkan warna aksen hingga ≥ 3:1 terhadap latar; periksa juga kontras teks di dalam tombol.' });
  } else if (values.aksen && !values.latar) notChecked.push('kontras aksen (butuh latar=)');

  // Keluarga font
  if (values.font !== undefined) {
    if (values.font <= 2) findings.push({ level: 'ok', text: `Keluarga font: ${values.font} — terkendali.` });
    else if (values.font === 3) findings.push({ level: 'warn', text: 'Keluarga font: 3; perlu alasan kuat.', fix: 'Kurangi ke 2 keluarga font dan bedakan level dengan bobot/ukuran.' });
    else findings.push({ level: 'error', text: `Keluarga font: ${values.font}; terlalu banyak.`, fix: 'Pangkas ke maksimal 2 keluarga font.' });
  } else notChecked.push('jumlah font (font=)');

  // Ukuran body absolut
  if (values.body !== undefined) {
    if (ABSOLUTE_BODY.has(kind)) {
      const body = values.body;
      if (kind === 'cetak') {
        if (body < 8) findings.push({ level: 'error', text: `Body ${fmt(body)} pt terlalu kecil untuk teks isi cetak.`, fix: 'Naikkan body cetak menjadi 9–11 pt.' });
        else if (body < 9) findings.push({ level: 'warn', text: `Body ${fmt(body)} pt di bawah 9 pt.`, fix: 'Naikkan body ke 9–11 pt kecuali teks sekunder.' });
        else if (body > 14) findings.push({ level: 'warn', text: `Body ${fmt(body)} pt besar untuk teks isi dokumen.`, fix: 'Gunakan 10–12 pt untuk body; ukuran besar untuk judul.' });
        else findings.push({ level: 'ok', text: `Body ${fmt(body)} pt wajar untuk dokumen cetak.` });
      } else if (body < 12) findings.push({ level: 'error', text: `Body ${fmt(body)} px terlalu kecil untuk antarmuka digital.`, fix: 'Naikkan body menjadi 16 px (minimal 14 px).' });
      else if (body < 16) findings.push({ level: 'warn', text: `Body ${fmt(body)} px di bawah 16 px.`, fix: 'Naikkan body ke 16 px kecuali ini teks sekunder.' });
      else findings.push({ level: 'ok', text: `Body ${fmt(body)} px berada pada rentang nyaman.` });
    } else findings.push({ level: 'info', text: `Ukuran body absolut tidak dinilai untuk ${kind} karena bergantung pada kanvas/jarak baca; uji pada ukuran dan jarak sebenarnya.` });
  } else if (ABSOLUTE_BODY.has(kind)) notChecked.push(`ukuran body (body=, ${unit})`);

  // Hierarki judul/body
  if (values.body !== undefined && values.judul !== undefined) {
    const ratio = values.judul / values.body;
    if (ratio <= 1) findings.push({ level: 'error', text: `Judul (${fmt(values.judul)} ${unit}) tidak lebih besar dari body (${fmt(values.body)} ${unit}).`, fix: 'Perbesar judul hingga minimal 1.5× body (idealnya ≥ 2×).' });
    else if (ratio < 1.25) findings.push({ level: 'error', text: `Judul hanya ${fmt(Math.round(ratio * 100) / 100)}× body; hierarki hampir tidak terlihat.`, fix: 'Perbesar judul hingga minimal 1.5× body, atau perkuat dengan bobot dan jarak.' });
    else if (ratio < 1.5) findings.push({ level: 'warn', text: `Judul ${fmt(Math.round(ratio * 100) / 100)}× body; hierarki masih lemah.`, fix: 'Naikkan judul ke ≥ 1.5× body atau tambah kontras bobot.' });
    else findings.push({ level: 'ok', text: `Judul ${fmt(Math.round(ratio * 100) / 100)}× body — hierarki jelas.` });
  } else notChecked.push('hierarki judul/body (body=, judul=)');

  // Target sentuh
  if (HAS_TAP.has(kind)) {
    if (values.tap === undefined) notChecked.push('target sentuh (tap=)');
    else if (values.tap < 24) findings.push({ level: 'error', text: `Target sentuh ${fmt(values.tap)} px di bawah minimum 24 px (WCAG 2.2 AA).`, fix: 'Perbesar target interaktif minimal 24 px, idealnya 44 px atau lebih untuk sentuhan.' });
    else if (values.tap < 44) findings.push({ level: 'warn', text: `Target sentuh ${fmt(values.tap)} px; di bawah 44 px yang disarankan untuk sentuhan.`, fix: 'Perbesar area sentuh ke 44 px atau lebih (area sentuh boleh lebih besar dari tampilan ikon).' });
    else findings.push({ level: 'ok', text: `Target sentuh ${fmt(values.tap)} px memadai.` });
  }

  // CTA
  if (HAS_CTA.has(kind)) {
    if (values.cta === undefined) notChecked.push('CTA (cta=ya/tidak)');
    else if (values.cta) findings.push({ level: 'ok', text: 'CTA jelas tersedia.' });
    else findings.push({ level: 'warn', text: 'CTA belum jelas.', fix: 'Tambahkan satu CTA utama yang spesifik dan mudah ditemukan.' });
  }

  // Alt text / label aksesibilitas
  if (HAS_ALT.has(kind)) {
    if (values.alt === undefined) notChecked.push('alt text/label aksesibilitas (alt=ya/tidak)');
    else if (values.alt) findings.push({ level: 'ok', text: 'Alt text/label aksesibilitas tersedia.' });
    else findings.push({ level: 'warn', text: 'Alt text/label aksesibilitas belum ada.', fix: 'Tambahkan alt text untuk gambar penting dan label untuk kontrol interaktif.' });
  }

  // Bleed
  if (HAS_BLEED.has(kind)) {
    if (values.bleed === undefined) notChecked.push('bleed (bleed=, mm)');
    else if (values.bleed === 0) findings.push({ level: 'error', text: 'Bleed 0 mm; risiko tepi putih setelah pemotongan.', fix: 'Tambahkan bleed (umumnya 3 mm) dan konfirmasi angka final ke vendor.' });
    else if (values.bleed < 3) findings.push({ level: 'warn', text: `Bleed ${fmt(values.bleed)} mm; lebih kecil dari 3 mm yang umum.`, fix: 'Konfirmasi bleed ke vendor; umumnya 3 mm.' });
    else findings.push({ level: 'ok', text: `Bleed ${fmt(values.bleed)} mm — sesuai praktik umum (tetap konfirmasi ke vendor).` });
  }

  // Resolusi
  if (HAS_DPI.has(kind)) {
    if (values.dpi === undefined) notChecked.push('resolusi gambar (dpi=)');
    else if (kind === 'poster') {
      if (values.dpi < 100) findings.push({ level: 'error', text: `Resolusi efektif ${fmt(values.dpi)} dpi terlalu rendah, bahkan untuk poster besar.`, fix: 'Gunakan gambar beresolusi lebih tinggi (minimal 150 dpi pada ukuran cetak akhir).' });
      else if (values.dpi < 150) findings.push({ level: 'warn', text: `Resolusi efektif ${fmt(values.dpi)} dpi; di bawah 150 dpi.`, fix: 'Naikkan resolusi atau pastikan jarak baca dan vendor memang mengizinkan.' });
      else findings.push({ level: 'ok', text: `Resolusi efektif ${fmt(values.dpi)} dpi memadai untuk poster (konfirmasi ke vendor).` });
    } else if (values.dpi < 200) findings.push({ level: 'error', text: `Resolusi efektif ${fmt(values.dpi)} dpi terlalu rendah untuk ${kind}.`, fix: 'Gunakan gambar beresolusi lebih tinggi; target 300 dpi pada ukuran cetak akhir.' });
    else if (values.dpi < 300) findings.push({ level: 'warn', text: `Resolusi efektif ${fmt(values.dpi)} dpi; di bawah 300 dpi.`, fix: 'Targetkan 300 dpi pada ukuran cetak akhir kecuali vendor menyatakan lain.' });
    else findings.push({ level: 'ok', text: `Resolusi efektif ${fmt(values.dpi)} dpi memadai.` });
  }

  return { findings, notChecked, ...summarizeFindings(findings) };
}

export function formatQaReport(kind, values, review, parsed) {
  const verdict = review.errors
    ? `${review.errors} masalah serius, ${review.warnings} peringatan.`
    : review.warnings ? `Tidak ada masalah serius; ${review.warnings} peringatan.` : review.findings.some(item => item.level === 'ok') ? 'Tidak ada masalah terdeteksi dari data yang diisi.' : 'Belum ada data yang cukup untuk dinilai.';
  const lines = [`🧪 *DESIGN QA REVIEW — ${kind.toUpperCase()}*`];
  if (parsed.invalid.length) lines.push(`\n⚠️ Input tidak valid, bagian ini tidak diperiksa: ${parsed.invalid.slice(0, 5).join('; ')}`);
  if (parsed.unknown.length) lines.push(`\nℹ️ Diabaikan: ${parsed.unknown.slice(0, 5).join(', ')}`);
  lines.push(`\n${review.findings.length ? renderFindings(review.findings) : 'Belum ada isian yang dapat dinilai.'}`);
  lines.push(`\n*Ringkasan*: ${verdict}${renderPriorities(review.priorities)}`);
  if (review.notChecked.length) lines.push(`\n*Belum diperiksa*: ${review.notChecked.join('; ')}`);
  lines.push('\nCatatan: review ini hanya memeriksa angka yang Anda isi dan aturan praktis umum. Ia tidak menilai tampilan visual, hukum, atau lisensi aset.');
  return lines.join('\n');
}

export async function handleQaReviewCommand(ctx) {
  const { args = [], reply, PREFIX = '.' } = ctx;
  const tokens = args.join(' ').split(/\s+/).filter(Boolean);
  const kind = String(tokens[0] || '').toLowerCase();
  if (!QA_KINDS.includes(kind)) return reply(QA_REVIEW_USAGE(PREFIX));
  if (tokens.length > 30) return reply('⚠️ Terlalu banyak isian. Maksimal 29 isian per review.');
  const parsed = parseQaArgs(tokens.slice(1));
  const review = reviewDesign(kind, parsed.values);
  return reply(formatQaReport(kind, parsed.values, review, parsed));
}
