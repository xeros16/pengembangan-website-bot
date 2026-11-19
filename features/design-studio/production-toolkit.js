const TYPES = {
  poster: { label: 'Poster', ratio: 'A3/A4 atau ukuran acara', grid: '12 kolom; margin 5–8% bidang', order: 'Headline → visual utama → detail acara → CTA/logo', tip: 'Batasi maksimal 2 keluarga font; pastikan tanggal, lokasi, dan CTA terbaca dari thumbnail.' },
  feed: { label: 'Feed sosial', ratio: '4:5 (1080×1350) atau 1:1 (1080×1080)', grid: '4 kolom; gutter 24–32 px; margin 64–80 px pada kanvas 1080 px', order: 'Hook → visual/foto → satu pesan → identitas/CTA', tip: 'Jangan letakkan teks penting terlalu dekat tepi; cek crop pada preview profil.' },
  banner: { label: 'Banner', ratio: 'Ikuti rasio media/pemasangan', grid: '3 zona horizontal atau grid 12 kolom; margin mengikuti vendor', order: 'Pesan utama → visual pendukung → CTA/kontak/brand', tip: 'Gunakan sedikit kata dan ukuran huruf sesuai jarak pandang; jangan menebak resolusi cetak.' },
  web: { label: 'Website', ratio: 'Container responsif; breakpoint diuji pada perangkat nyata', grid: '12 kolom desktop, 8 tablet, 4 mobile; gutter 16–24 px', order: 'Navigasi → judul/tujuan → konten utama → bukti → CTA → footer', tip: 'Tentukan max-width, state loading/error/empty, keyboard focus, dan urutan baca.' },
};
const MOODS = {
  elegan: ['Playfair Display', 'Inter', 'Editorial, kontras serif display dan sans yang netral'],
  modern: ['Manrope', 'Inter', 'Geometris, bersih, dan mudah dibaca'],
  playful: ['Nunito', 'DM Sans', 'Ramah dengan bentuk lembut'],
  futuristik: ['Space Grotesk', 'Inter', 'Teknis dan kontemporer'],
  editorial: ['DM Serif Display', 'Source Sans 3', 'Nuansa majalah dengan body yang tenang'],
  bold: ['Bebas Neue', 'Montserrat', 'Headline padat dengan body sans yang stabil'],
};
const PLATFORMS = {
  instagram_feed: { label: 'Instagram feed portrait', size: '1080×1350 px (4:5)', safe: 'Sisakan margin internal sekitar 5–8%; cek crop thumbnail profil dan preview aplikasi.' },
  instagram_square: { label: 'Instagram square', size: '1080×1080 px (1:1)', safe: 'Sisakan margin internal sekitar 5–8%; hindari teks menempel tepi.' },
  instagram_story: { label: 'Instagram Story/Reels', size: '1080×1920 px (9:16)', safe: 'Sisakan area atas dan bawah untuk UI aplikasi; tempatkan teks inti di zona tengah. Safe area dapat berubah mengikuti UI.' },
  tiktok: { label: 'TikTok vertical', size: '1080×1920 px (9:16)', safe: 'Hindari area kanan (kontrol) dan bagian bawah (caption/navigasi); preview di aplikasi sebelum publish.' },
  youtube_thumbnail: { label: 'YouTube thumbnail', size: '1280×720 px (16:9)', safe: 'Jaga teks tetap besar dan kontras; uji pada tampilan kecil.' },
  youtube_banner: { label: 'YouTube channel banner', size: '2560×1440 px', safe: 'Tempatkan logo dan teks penting di area aman tengah 1546×423 px; cek lintas perangkat.' },
  facebook_cover: { label: 'Facebook cover', size: '820×312 px (referensi desktop)', safe: 'Crop berbeda di perangkat; pusatkan informasi penting dan cek tampilan mobile.' },
  linkedin_post: { label: 'LinkedIn post landscape', size: '1200×627 px (1.91:1)', safe: 'Gunakan margin internal dan hindari teks kecil; cek preview feed.' },
};
const RESOURCES = [
  { category: 'font', name: 'Google Fonts', url: 'https://fonts.google.com/', license: 'Lisensi tiap keluarga font ditampilkan pada halaman font; banyak yang OFL, tetapi verifikasi per font.', tags: 'font typography typeface gratis serif sans display' },
  { category: 'font', name: 'Font Squirrel', url: 'https://www.fontsquirrel.com/', license: 'Periksa lisensi komersial dan batas penggunaan pada halaman unduhan setiap font.', tags: 'font commercial desktop web' },
  { category: 'icon', name: 'Lucide', url: 'https://lucide.dev/', license: 'ISC License; periksa ketentuan versi dan aset pihak ketiga.', tags: 'icon ikon interface ui' },
  { category: 'icon', name: 'Heroicons', url: 'https://heroicons.com/', license: 'MIT License; cek lisensi pada repositori resmi.', tags: 'icon ikon ui interface' },
  { category: 'mockup', name: 'Mockup World', url: 'https://www.mockupworld.co/', license: 'Lisensi berbeda per file dan kreator; periksa syarat penggunaan sebelum komersial.', tags: 'mockup psd device packaging' },
  { category: 'mockup', name: 'Shots', url: 'https://shots.so/', license: 'Periksa paket, atribusi, dan ketentuan penggunaan terbaru.', tags: 'mockup screenshot device' },
  { category: 'texture', name: 'Poly Haven', url: 'https://polyhaven.com/', license: 'Aset Poly Haven dipublikasikan dengan CC0; tetap cek halaman aset.', tags: 'texture tekstur hdr material 3d' },
  { category: 'texture', name: 'ambientCG', url: 'https://ambientcg.com/', license: 'Aset tersedia CC0; cek halaman aset dan ketentuan terbaru.', tags: 'texture tekstur material pbr' },
  { category: 'asset', name: 'Openverse', url: 'https://openverse.org/', license: 'Lisensi bergantung pada karya sumber; buka halaman sumber dan verifikasi atribusi/izin.', tags: 'photo image illustration aset creative commons' },
  { category: 'asset', name: 'Unsplash', url: 'https://unsplash.com/license', license: 'Ikuti Unsplash License; ada batasan tertentu, termasuk distribusi ulang tanpa modifikasi.', tags: 'photo foto image photography' },
  { category: 'asset', name: 'Pexels', url: 'https://www.pexels.com/license/', license: 'Ikuti Pexels License dan batasan penggunaan yang berlaku.', tags: 'photo video foto stock' },
];
const clean = value => String(value || '').replace(/[\r\n*_~`]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120);
export function buildTypographyPairingStudio(args = []) {
  const raw = clean(args.join(' ')).toLowerCase();
  const tokens = raw.split(/\s+/).filter(Boolean);
  const mood = Object.keys(MOODS).find(key => tokens.includes(key)) || 'modern';
  const [heading, body, rationale] = MOODS[mood];
  const kind = ['poster', 'feed', 'banner', 'web'].find(key => tokens.includes(key)) || 'feed';
  return `🔤 *TYPOGRAPHY PAIRING STUDIO 2.0*\nJenis: ${TYPES[kind].label} · Mood: ${mood}\n\n*Pasangan rekomendasi*\n• Heading/display: *${heading}* — gunakan untuk judul dan aksen\n• Body/UI: *${body}* — gunakan untuk paragraf dan informasi\n• Alasan: ${rationale}\n\n*Contoh hierarki (titik awal)*\n• Display/H1: 40–56 px · Bold/Semibold · line-height 1.05–1.15\n• H2: 28–36 px · Semibold · line-height 1.15–1.25\n• Subheading: 20–24 px · Medium · line-height 1.25–1.35\n• Body: 16–18 px · Regular · line-height 1.45–1.6\n• Caption: 12–14 px · Regular · line-height 1.35–1.5\n\n*Aturan pairing*\n• Maksimal 2 keluarga font; buat kontras peran, bukan sekadar berbeda nama.\n• Gunakan 2–3 bobot per keluarga dan uji karakter angka, tanda baca, serta bahasa Indonesia.\n• Cek lisensi font sebelum logo, merchandise, atau penggunaan komersial.\n\nLanjut: .fontpair ${mood} · .typography hierarchy ${kind} · .typescale 16 1.25 5\nCatatan: rekomendasi kurasi; verifikasi ketersediaan glyph dan lisensi tiap font.`;
}
export function buildLayoutStudio(args = []) {
  const kind = clean(args[0] || '').toLowerCase();
  const data = TYPES[kind];
  if (!data) return `📐 *LAYOUT & COMPOSITION STUDIO*\nPilih jenis: ${Object.keys(TYPES).join(', ')}\nFormat: .layoutstudio <poster|feed|banner|web>\nContoh: .layoutstudio poster`;
  return `📐 *LAYOUT & COMPOSITION — ${data.label.toUpperCase()}*\n\n*Grid:* ${data.grid}\n*Ukuran/rasio:* ${data.ratio}\n*Urutan hierarki:* ${data.order}\n\n*Panduan komposisi*\n1. Tentukan satu focal point dan satu pesan utama.\n2. Pakai alignment konsisten; sejajarkan elemen berdasarkan grid.\n3. Kelompokkan informasi terkait dan beri jarak antar-kelompok.\n4. Sisakan negative space; jangan penuhi semua area.\n5. Uji versi thumbnail dan ukuran layar/perangkat target.\n\n*Pemeriksaan khusus*\n${data.tip}\n\nLanjut: .creative <topik> · .colorpalette <gaya> · .typography hierarchy ${kind === 'feed' ? 'sosial' : kind} · .designqa ${kind === 'feed' ? 'sosial' : kind === 'banner' ? 'poster' : kind}`;
}
export function buildSocialKit(args = []) {
  const key = clean(args[0] || '').toLowerCase().replace(/[-\s]/g, '_');
  const data = PLATFORMS[key];
  if (!data) return `📱 *SOCIAL MEDIA DESIGN TOOLKIT*\nPreset: ${Object.keys(PLATFORMS).join(', ')}\nFormat: .socialkit <preset>\nContoh: .socialkit instagram_story\n\nUkuran adalah preset kerja yang umum; periksa spesifikasi platform terbaru sebelum produksi.`;
  return `📱 *SOCIAL MEDIA TOOLKIT — ${data.label.toUpperCase()}*\nKanvas: *${data.size}*\n\n*Safe area & crop*\n${data.safe}\n\n*Checklist produksi*\n• Buat master pada ukuran target; simpan teks/logo sebagai layer terpisah.\n• Gunakan margin internal 5–8% sebagai titik awal, lalu sesuaikan dengan UI platform.\n• Pastikan headline tetap terbaca pada preview kecil dan kontras teks/latar memadai.\n• Ekspor PNG/JPG sesuai kebutuhan; optimalkan ukuran file tanpa merusak kualitas.\n• Untuk carousel: satu ide per slide, slide 1 sebagai hook, isi berurutan, slide akhir berisi ringkasan/CTA.\n• Cek crop, safe area, ejaan, tautan, dan tampilan di aplikasi sebelum publish.\n\nCatatan: ukuran dan safe area dapat berubah; ini panduan awal, bukan jaminan spesifikasi resmi permanen.`;
}
export function searchDesignResources(args = []) {
  const category = clean(args[0] || '').toLowerCase();
  const query = clean(args.slice(1).join(' ')).toLowerCase();
  const valid = ['font', 'icon', 'mockup', 'texture', 'asset'];
  if (!valid.includes(category)) return { help: `🔎 *DESIGN RESOURCE FINDER*\nKategori: ${valid.join(', ')}\nFormat: .resourcefind <kategori> [kata kunci]\nContoh: .resourcefind font serif` };
  const terms = query.split(/\\s+/).filter(Boolean);
  const rows = RESOURCES.filter(item => item.category === category && (!terms.length || terms.some(term => `${item.name} ${item.tags} ${item.license}`.toLowerCase().includes(term))));
  return { category, rows };
}
export function formatDesignResourceResults(result) {
  if (result.help) return result.help;
  if (!result.rows.length) return `Belum ada sumber kurasi untuk kategori *${result.category}* dan kata kunci tersebut. Coba tanpa kata kunci atau kategori lain.`;
  return `🔎 *DESIGN RESOURCE FINDER — ${result.category.toUpperCase()}*\n\n${result.rows.map((item, index) => `${index + 1}. *${item.name}*\n${item.url}\nLisensi: ${item.license}`).join('\n\n')}\n\n*Penting:* Finder ini mengarahkan ke sumber resmi. Lisensi dapat berbeda per aset/versi; buka halaman item dan simpan bukti izin sebelum penggunaan komersial.`;
}
