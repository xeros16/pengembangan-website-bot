import { cleanText, fmt, renderFindings, renderPriorities, summarizeFindings } from './shared.js';

// Semua angka di modul ini adalah pedoman umum, bukan standar mutlak.
// Untuk cetak dan kemasan, spesifikasi vendor/regulasi selalu didahulukan.

export const TYPOGRAPHY_KINDS = ['web', 'app', 'sosial', 'poster', 'cetak', 'kemasan'];
const MODULAR_RATIOS = [1.125, 1.2, 1.25, 1.333, 1.414, 1.5, 1.618];

const HIERARCHY = {
  web: {
    unit: 'px', note: 'Pedoman UI web responsif; kecilkan sekitar 15–25% pada mobile untuk judul besar.',
    rows: [
      ['Hero/Display', '40–64', 'Bold 700', '1.1–1.2'],
      ['Heading 1', '32–48', 'Semibold–Bold', '1.15–1.25'],
      ['Heading 2', '24–32', 'Semibold', '1.2–1.3'],
      ['Heading 3', '20–24', 'Semibold', '1.25–1.35'],
      ['Body', '16–18', 'Regular 400', '1.5–1.6'],
      ['Caption/Label', '12–14', 'Regular–Medium', '1.4–1.5'],
    ],
  },
  app: {
    unit: 'px', note: 'Pedoman umum. Untuk aplikasi native, ikuti pedoman platform (Human Interface Guidelines atau Material) dan dukung pengaturan ukuran teks sistem.',
    rows: [
      ['Large Title', '28–34', 'Bold', '1.15–1.25'],
      ['Title', '20–24', 'Semibold', '1.2–1.3'],
      ['Body', '16–17', 'Regular', '1.4–1.5'],
      ['Secondary', '14–15', 'Regular', '1.4–1.5'],
      ['Caption', '12–13', 'Regular–Medium', '1.3–1.4'],
    ],
  },
  sosial: {
    unit: 'px', note: 'Untuk kanvas lebar 1080 px (feed/carousel/story). Selalu uji di layar ponsel dengan ukuran sebenarnya.',
    rows: [
      ['Hook/Judul', '64–120', 'Bold–Black', '1.05–1.2'],
      ['Subjudul', '40–56', 'Semibold', '1.15–1.25'],
      ['Isi', '32–44', 'Regular–Medium', '1.3–1.45'],
      ['Detail/CTA kecil', '26–32', 'Medium', '1.3'],
      ['Legal/Kredit', '≥ 22', 'Regular', '1.3'],
    ],
  },
  poster: {
    unit: 'pt', note: 'Contoh untuk poster A3. Skalakan proporsional untuk ukuran lain dan sesuaikan dengan jarak baca.',
    rows: [
      ['Judul', '72–140', 'Bold–Black', '1.0–1.15'],
      ['Subjudul', '28–48', 'Semibold', '1.15–1.25'],
      ['Detail acara/isi', '16–24', 'Regular–Medium', '1.25–1.4'],
      ['CTA/kontak', '18–28', 'Semibold', '1.2–1.3'],
      ['Sponsor/legal', '8–12', 'Regular', '1.2–1.3'],
    ],
  },
  cetak: {
    unit: 'pt', note: 'Contoh untuk dokumen A4 (brosur, laporan, proposal). Leading cetak umumnya 120–140% dari ukuran huruf.',
    rows: [
      ['Judul', '24–36', 'Bold', '1.1–1.2'],
      ['Subjudul', '14–18', 'Semibold', '1.2–1.3'],
      ['Body', '9–12', 'Regular (umumnya 10–11 pt)', '1.2–1.4'],
      ['Caption/Catatan', '8–9', 'Regular', '1.2–1.3'],
      ['Footnote/Legal', '≥ 7', 'Regular', '1.2'],
    ],
  },
  kemasan: {
    unit: 'pt', note: 'Ukuran minimum teks wajib (netto, komposisi, legal) mengikuti regulasi dan spesifikasi vendor; konfirmasi sebelum final. Angka di bawah hanya pedoman visual.',
    rows: [
      ['Nama produk', '24–48', 'Bold', '1.0–1.15'],
      ['Varian/keunggulan', '12–20', 'Semibold', '1.15–1.25'],
      ['Informasi pendukung', '8–12', 'Regular–Medium', '1.2–1.3'],
      ['Teks wajib/legal', 'sesuai regulasi dan vendor', 'Regular', '1.1–1.2'],
    ],
  },
};

export const TYPOGRAPHY_USAGE = prefix => `🔤 *TYPOGRAPHY STUDIO*\nRancang dan periksa tipografi secara konsisten.\n\n${prefix}typography hierarchy <${TYPOGRAPHY_KINDS.join('|')}>\n${prefix}typography size <digital|cetak>\n${prefix}typography check <digital|cetak> | <font, font> | <ukuran...> | [line-height]\n\nContoh:\n${prefix}typography hierarchy web\n${prefix}typography size cetak\n${prefix}typography check digital | Inter, Playfair Display | 12 14 16* 24 32 48 | 1.5\n\nTanda * pada ukuran menandai ukuran body. Pembuat skala: ${prefix}typescale. Pasangan font: ${prefix}fontpair.`;

export function buildHierarchy(kind) {
  const entry = HIERARCHY[kind];
  if (!entry) return null;
  const lines = entry.rows.map(([role, size, weight, lineHeight]) => `• *${role}*: ${size}${/^[\d≥]/.test(size) ? ` ${entry.unit}` : ''} · ${weight} · line-height ${lineHeight}`);
  return `🔤 *HIERARKI FONT — ${kind.toUpperCase()}*\n\n${lines.join('\n')}\n\n*Catatan*\n${entry.note}\n\n*Aturan inti*\n• Maksimal 2 keluarga font (3 hanya dengan alasan kuat).\n• Bedakan level dengan ukuran, bobot, dan jarak — jangan hanya salah satunya.\n• Gunakan satu skala ukuran yang konsisten: ${'.'}typescale dapat membuatnya.`;
}

export function buildSizeGuide(medium) {
  if (medium === 'digital') {
    return `🔤 *UKURAN FONT DIGITAL*\n\n• Body: *16–18 px* (hindari di bawah 14 px untuk paragraf)\n• Teks sekunder/caption: *12–14 px* (jangan di bawah 12 px untuk teks apa pun)\n• Line-height body: *1.4–1.6*; heading: *1.1–1.3*\n• Panjang baris: sekitar *45–75 karakter* per baris\n• Heading: sekitar *1.5–3×* ukuran body, sesuai levelnya\n• Dukung pembesaran teks/zoom 200% tanpa kehilangan konten\n\n*Catatan*\nAngka adalah pedoman umum. Uji pada perangkat nyata, terutama layar ponsel kecil. Gunakan ${'.'}typescale untuk skala modular.`;
  }
  if (medium === 'cetak') {
    return `🔤 *UKURAN FONT CETAK*\n\n• Body dokumen: *9–12 pt* (umumnya 10–11 pt)\n• Caption/catatan: *8–9 pt*\n• Footnote/legal: *≥ 7 pt* (di bawah 6 pt berisiko tidak terbaca setelah dicetak)\n• Leading body: sekitar *120–140%* dari ukuran huruf (mis. 10/12–10/14 pt)\n• Poster dan signage: pedoman kasar tinggi huruf ≈ *2,5 cm per 3 m* jarak baca\n• Teks terang di atas latar gelap atau foto memerlukan ukuran/bobot lebih besar\n\n*Catatan*\nCetak kecil harus diuji lewat proof. Untuk kemasan, ukuran minimum teks wajib mengikuti regulasi dan vendor.`;
  }
  return null;
}

const NUMBER_TOKEN = /^(\d+(?:\.\d+)?)(px|pt)?(\*)?$/i;

export function parseSizes(raw) {
  const tokens = String(raw ?? '').split(/[\s,;]+/).filter(Boolean);
  const sizes = [];
  const invalid = [];
  let bodyMarked = null;
  let markerCount = 0;
  for (const token of tokens) {
    const match = token.match(NUMBER_TOKEN);
    const value = match ? Number(match[1]) : NaN;
    if (!match || !(value >= 3 && value <= 400)) { invalid.push(cleanText(token, 12)); continue; }
    sizes.push(value);
    if (match[3]) { markerCount += 1; bodyMarked = value; }
  }
  return { sizes, invalid, bodyMarked, markerCount };
}

export function parseLineHeight(raw) {
  if (raw === undefined || raw === null || String(raw).trim() === '') return { value: null };
  const value = Number(String(raw).trim().replace(',', '.'));
  if (!Number.isFinite(value) || value < 0.8 || value > 3) return { value: null, invalid: true };
  return { value };
}

export function parseFonts(raw) {
  const seen = new Set();
  const fonts = [];
  for (const part of String(raw ?? '').split(/[,;]+/)) {
    const name = cleanText(part, 40);
    const key = name.toLocaleLowerCase('id-ID');
    if (!name || seen.has(key)) continue;
    seen.add(key);
    fonts.push(name);
  }
  return fonts;
}

function nearestRatio(ratio) {
  return MODULAR_RATIOS.reduce((best, candidate) => Math.abs(candidate - ratio) < Math.abs(best - ratio) ? candidate : best, MODULAR_RATIOS[0]);
}

/** Analisis murni (tanpa I/O) agar mudah diuji. */
export function analyzeTypography({ medium, fonts, sizes, bodyMarked = null, lineHeight = null }) {
  const unit = medium === 'digital' ? 'px' : 'pt';
  const findings = [];
  const unique = [...new Set(sizes)].sort((a, b) => a - b);
  const smallest = unique[0];
  const largest = unique[unique.length - 1];
  const defaultBody = medium === 'digital' ? 16 : 10;
  const body = bodyMarked ?? unique.reduce((best, value) => Math.abs(value - defaultBody) < Math.abs(best - defaultBody) ? value : best, unique[0]);
  const bodyAssumed = bodyMarked === null;

  // Keluarga font
  if (fonts.length <= 2) findings.push({ level: 'ok', text: `Keluarga font: ${fonts.length} (${fonts.join(', ')}) — terkendali.` });
  else if (fonts.length === 3) findings.push({ level: 'warn', text: `Keluarga font: ${fonts.length}. Tiga sudah menuntut alasan kuat.`, fix: 'Kurangi menjadi 2 keluarga font; bedakan level dengan bobot dan ukuran.' });
  else findings.push({ level: 'error', text: `Keluarga font: ${fonts.length}. Terlalu banyak sehingga identitas tipografi terpecah.`, fix: 'Pangkas ke maksimal 2 keluarga font (idealnya 1 keluarga dengan beberapa bobot).' });

  // Ukuran terkecil
  const minError = medium === 'digital' ? 12 : 6;
  const minWarn = medium === 'digital' ? 12 : 7;
  if (smallest < minError) findings.push({ level: 'error', text: `Ukuran terkecil ${fmt(smallest)} ${unit} di bawah batas keterbacaan (${minError} ${unit}).`, fix: `Naikkan teks terkecil menjadi minimal ${minError + (medium === 'digital' ? 0 : 1)} ${unit}.` });
  else if (smallest < minWarn) findings.push({ level: 'warn', text: `Ukuran terkecil ${fmt(smallest)} ${unit} sangat kecil; hanya untuk legal/footnote dan perlu proof cetak.`, fix: 'Uji ukuran terkecil lewat proof cetak atau naikkan bila memungkinkan.' });
  else findings.push({ level: 'ok', text: `Ukuran terkecil ${fmt(smallest)} ${unit} masih wajar untuk teks sekunder.` });

  // Body
  const bodyLabel = `Body ${fmt(body)} ${unit}${bodyAssumed ? ' (diasumsikan: ukuran terdekat dengan standar body; tandai dengan * untuk menentukan sendiri)' : ''}`;
  if (medium === 'digital') {
    if (body < 14) findings.push({ level: 'error', text: `${bodyLabel} terlalu kecil untuk paragraf digital.`, fix: 'Naikkan body menjadi 16 px (minimal 14 px).' });
    else if (body < 16) findings.push({ level: 'warn', text: `${bodyLabel} di bawah 16 px.`, fix: 'Naikkan body ke 16 px kecuali ini memang teks sekunder.' });
    else if (body > 24) findings.push({ level: 'warn', text: `${bodyLabel} terlalu besar untuk body.`, fix: 'Turunkan body ke kisaran 16–20 px dan gunakan ukuran besar hanya untuk heading.' });
    else findings.push({ level: 'ok', text: `${bodyLabel} berada pada rentang nyaman.` });
  } else if (body < 8) findings.push({ level: 'error', text: `${bodyLabel} terlalu kecil untuk teks isi cetak.`, fix: 'Naikkan body menjadi 9–11 pt.' });
  else if (body < 9) findings.push({ level: 'warn', text: `${bodyLabel} di bawah 9 pt.`, fix: 'Naikkan body ke 9–11 pt kecuali ini teks sekunder.' });
  else if (body > 14) findings.push({ level: 'warn', text: `${bodyLabel} besar untuk teks isi dokumen cetak.`, fix: 'Gunakan 10–12 pt untuk body; ukuran besar untuk judul.' });
  else findings.push({ level: 'ok', text: `${bodyLabel} berada pada rentang wajar.` });

  // Line-height
  if (lineHeight === null) findings.push({ level: 'info', text: 'Line-height tidak diisi sehingga tidak diperiksa.' });
  else if (medium === 'digital') {
    if (lineHeight < 1.2) findings.push({ level: 'error', text: `Line-height ${fmt(lineHeight)} terlalu rapat untuk paragraf.`, fix: 'Atur line-height body ke 1.4–1.6.' });
    else if (lineHeight < 1.4) findings.push({ level: 'warn', text: `Line-height ${fmt(lineHeight)} agak rapat untuk body digital.`, fix: 'Naikkan line-height body ke sekitar 1.5.' });
    else if (lineHeight > 1.8) findings.push({ level: 'warn', text: `Line-height ${fmt(lineHeight)} terlalu longgar; baris terasa terpisah.`, fix: 'Turunkan line-height body ke 1.4–1.6.' });
    else findings.push({ level: 'ok', text: `Line-height ${fmt(lineHeight)} sesuai untuk body digital.` });
  } else if (lineHeight < 1.1) findings.push({ level: 'error', text: `Leading ${fmt(lineHeight)} terlalu rapat untuk teks isi cetak.`, fix: 'Atur leading body ke sekitar 1.2–1.4× ukuran huruf.' });
  else if (lineHeight > 1.6) findings.push({ level: 'warn', text: `Leading ${fmt(lineHeight)} terlalu longgar untuk teks isi cetak.`, fix: 'Turunkan leading body ke sekitar 1.2–1.4×.' });
  else findings.push({ level: 'ok', text: `Leading ${fmt(lineHeight)} wajar untuk teks isi cetak.` });

  // Hierarki: rasio terbesar terhadap body
  const hierarchyRatio = largest / body;
  if (largest === body) findings.push({ level: 'error', text: 'Tidak ada ukuran yang lebih besar dari body, sehingga hierarki tidak terbentuk.', fix: 'Tambahkan minimal satu level heading yang jelas lebih besar dari body.' });
  else if (hierarchyRatio < 1.5) findings.push({ level: 'warn', text: `Ukuran terbesar hanya ${fmt(hierarchyRatio)}× body; kontras hierarki lemah.`, fix: 'Perbesar level tertinggi hingga minimal 1.5× (idealnya ≥ 2×) dari body.' });
  else findings.push({ level: 'ok', text: `Ukuran terbesar ${fmt(hierarchyRatio)}× body — hierarki cukup kuat.` });

  // Jumlah level
  if (unique.length > 7) findings.push({ level: 'warn', text: `${unique.length} ukuran berbeda; skala terlalu ramai.`, fix: 'Ringkas menjadi 5–7 ukuran dengan skala modular (.typescale).' });
  else if (unique.length < 3) findings.push({ level: 'info', text: `Hanya ${unique.length} ukuran; hierarki mungkin terlalu datar untuk konten kompleks.` });
  else findings.push({ level: 'ok', text: `${unique.length} ukuran berbeda — jumlah level terkendali.` });

  // Konsistensi skala
  const ratios = unique.slice(1).map((value, index) => value / unique[index]);
  const tooClose = unique.slice(1).map((value, index) => ({ a: unique[index], b: value, ratio: value / unique[index] })).filter(pair => pair.ratio < 1.1);
  if (tooClose.length) {
    const list = tooClose.slice(0, 3).map(pair => `${fmt(pair.a)}↔${fmt(pair.b)}`).join(', ');
    findings.push({ level: 'warn', text: `Ukuran yang terlalu mirip (selisih < 10%): ${list}. Perbedaannya sulit terbaca sebagai level berbeda.`, fix: `Gabungkan ukuran yang berdekatan (${list}) menjadi satu level.` });
  }
  let suggestedRatio = null;
  if (ratios.length >= 3) {
    const spread = Math.max(...ratios) / Math.min(...ratios);
    const sorted = [...ratios].sort((a, b) => a - b);
    const median = sorted.length % 2 ? sorted[(sorted.length - 1) / 2] : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
    suggestedRatio = nearestRatio(median);
    if (spread > 1.4) findings.push({ level: 'warn', text: `Loncatan antarukuran tidak konsisten (rasio ${fmt(Math.min(...ratios))}–${fmt(Math.max(...ratios))}).`, fix: `Rapikan dengan skala modular, mis. .typescale ${fmt(body)} ${suggestedRatio}.` });
    else findings.push({ level: 'ok', text: `Loncatan antarukuran cukup konsisten (rasio ${fmt(Math.min(...ratios))}–${fmt(Math.max(...ratios))}).` });
  }

  return { unit, sizes: unique, body, bodyAssumed, hierarchyRatio, suggestedRatio, findings, ...summarizeFindings(findings) };
}

export function formatTypographyReport(medium, fonts, analysis) {
  const verdict = analysis.errors
    ? `${analysis.errors} masalah serius, ${analysis.warnings} peringatan.`
    : analysis.warnings ? `Tidak ada masalah serius; ${analysis.warnings} peringatan.` : 'Tidak ada masalah terdeteksi dari data yang Anda isi.';
  return `🔤 *TYPOGRAPHY CHECK — ${medium.toUpperCase()}*\nFont: ${fonts.join(', ')}\nUkuran: ${analysis.sizes.map(fmt).join(' · ')} ${analysis.unit}\n\n${renderFindings(analysis.findings)}\n\n*Ringkasan*: ${verdict}${renderPriorities(analysis.priorities)}\n\nCatatan: pemeriksaan ini berbasis angka yang Anda masukkan dan aturan praktis umum; ia tidak menilai tampilan visual atau lisensi font.`;
}

export async function handleTypographyCommand(ctx) {
  const { args = [], reply, PREFIX = '.' } = ctx;
  const action = String(args[0] || '').toLowerCase();
  if (action === 'hierarchy' || action === 'hierarki') {
    const kind = String(args[1] || '').toLowerCase();
    const text = buildHierarchy(kind);
    return reply(text ? text.replace('.typescale', `${PREFIX}typescale`) : `🔤 Pilih jenis: ${TYPOGRAPHY_KINDS.join(', ')}.\nContoh: ${PREFIX}typography hierarchy web`);
  }
  if (action === 'size' || action === 'ukuran') {
    const medium = String(args[1] || '').toLowerCase();
    const text = buildSizeGuide(medium);
    return reply(text ? text.replace('.typescale', `${PREFIX}typescale`) : `🔤 Pilih media: digital atau cetak.\nContoh: ${PREFIX}typography size digital`);
  }
  if (action === 'check' || action === 'cek') {
    const [mediumRaw, fontsRaw, sizesRaw, lineRaw] = args.slice(1).join(' ').split('|').map(value => value.trim());
    const medium = String(mediumRaw || '').toLowerCase();
    if (!['digital', 'cetak'].includes(medium) || !fontsRaw || !sizesRaw) {
      return reply(`🔤 *TYPOGRAPHY CHECK*\nFormat: ${PREFIX}typography check <digital|cetak> | <font, font> | <ukuran...> | [line-height]\nContoh: ${PREFIX}typography check digital | Inter, Playfair Display | 12 14 16* 24 32 48 | 1.5\n\nTanda * menandai ukuran body. Satuan otomatis px (digital) atau pt (cetak). Line-height opsional.`);
    }
    const fonts = parseFonts(fontsRaw);
    if (!fonts.length) return reply('⚠️ Tulis minimal satu nama font, dipisahkan koma.');
    if (fonts.length > 8) return reply('⚠️ Maksimal 8 nama font per pemeriksaan.');
    const { sizes, invalid, bodyMarked, markerCount } = parseSizes(sizesRaw);
    if (invalid.length) return reply(`⚠️ Ukuran tidak valid: ${invalid.slice(0, 5).join(', ')}. Gunakan angka 3–400, contoh: 12 14 16* 24.`);
    if (sizes.length < 2) return reply('⚠️ Isi minimal 2 ukuran agar hierarki dapat diperiksa.');
    if (sizes.length > 12) return reply('⚠️ Maksimal 12 ukuran per pemeriksaan.');
    if (markerCount > 1) return reply('⚠️ Tandai hanya satu ukuran body dengan *.');
    const line = parseLineHeight(lineRaw);
    if (line.invalid) return reply('⚠️ Line-height tidak valid. Gunakan angka 0,8–3, contoh: 1.5.');
    return reply(formatTypographyReport(medium, fonts, analyzeTypography({ medium, fonts, sizes, bodyMarked, lineHeight: line.value })));
  }
  return reply(TYPOGRAPHY_USAGE(PREFIX));
}
