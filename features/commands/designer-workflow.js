// Offline-first creative workflow helpers: moodboard direction and brief guidance.
const clean = (value, max = 180) => String(value ?? '')
  .replace(/[\r\n\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);

const DIRECTIONS = [
  { key: 'cyberpunk', match: /cyber|futur|tech|gaming|digital|sci.?fi/i, mood: 'Futuristik, kontras tinggi, dan energik', colors: ['#0B1020', '#00D9FF', '#8A5CFF', '#F4F7FF', '#FF4FD8'], type: 'Display sans tebal atau condensed untuk headline; sans geometris untuk informasi', imagery: 'cahaya neon terarah, refleksi metalik, grid digital, tekstur noise tipis, dan siluet urban', layout: 'Komposisi diagonal atau asimetris dengan satu focal point; jaga teks utama tetap mudah dibaca' },
  { key: 'minimal', match: /minimal|clean|modern|simple|sederhana|ui|web/i, mood: 'Minimal, tenang, dan fungsional', colors: ['#F5F5F0', '#222222', '#8C9A8B', '#D8CFC4', '#FFFFFF'], type: 'Sans humanis untuk body; serif atau sans kontras sebagai aksen display', imagery: 'ruang kosong luas, bentuk sederhana, material natural, dan fotografi bersih', layout: 'Grid konsisten, alignment kuat, whitespace lega, dan hierarki maksimal tiga tingkat' },
  { key: 'premium', match: /premium|lux|elegan|mewah|beauty|fashion|parfum/i, mood: 'Elegan, refined, dan eksklusif', colors: ['#171717', '#D4AF37', '#F5F0E8', '#8C8178', '#3A302B'], type: 'Serif display berkarakter dipadukan sans netral untuk detail', imagery: 'fotografi editorial, pencahayaan lembut, tekstur halus, dan aksen metalik terbatas', layout: 'Ruang kosong luas, grid rapi, detail tipis, dan satu aksen visual yang terkurasi' },
  { key: 'organic', match: /kopi|cafe|kafe|alam|organik|natural|eco|food|makanan/i, mood: 'Hangat, natural, dan membumi', colors: ['#244D3A', '#8BA888', '#E7E2C8', '#C87941', '#F4F0DF'], type: 'Serif hangat untuk headline dan sans humanis untuk informasi', imagery: 'tekstur kertas, biji atau bahan produk, cahaya natural, dan bentuk organik', layout: 'Komposisi editorial santai dengan area foto dominan dan label informasi yang jelas' },
  { key: 'playful', match: /ceria|playful|anak|fun|cute|edukasi|komunitas/i, mood: 'Ceria, ramah, dan ekspresif', colors: ['#FFF1C1', '#F7D6E0', '#8CC9C1', '#30475E', '#FFFFFF'], type: 'Rounded sans atau display tebal; body sans sederhana dan terbaca', imagery: 'ilustrasi bentuk sederhana, objek ekspresif, tekstur ringan, dan warna cerah terkontrol', layout: 'Bentuk modular, variasi skala, dan pengelompokan informasi agar tetap terarah' },
  { key: 'editorial', match: /poster|editorial|majalah|typography|tipografi|musik|festival/i, mood: 'Editorial, berani, dan komunikatif', colors: ['#101820', '#FEE715', '#F96167', '#FFFFFF', '#243447'], type: 'Display condensed untuk headline; sans netral untuk detail dan informasi acara', imagery: 'tipografi sebagai elemen visual, crop foto berani, tekstur cetak, dan kontras bentuk', layout: 'Headline dominan, satu focal point, lalu informasi sekunder tersusun dalam grid' },
];

export function buildMoodboard(args = []) {
  const raw = clean(args.join(' '), 300);
  if (!raw) return '🎨 *MOODBOARD GENERATOR*\nFormat: .moodboard <tema> | <warna opsional> | <gaya opsional>\nContoh: .moodboard kedai kopi modern | hijau sage dan krem | minimal natural\n\nBot menyusun arah visual dan brief moodboard berbasis panduan kurasi, bukan membuat kolase gambar otomatis.';
  const [topicRaw, colorRaw, styleRaw] = raw.split('|').map(value => clean(value, 120));
  const topic = clean(topicRaw, 120);
  if (!topic) return 'Tema moodboard wajib diisi. Contoh: .moodboard brand skincare lokal | sage dan ivory | clean premium';
  const query = `${topic} ${styleRaw || ''}`;
  const profile = DIRECTIONS.find(item => item.match.test(`${query} ${colorRaw || ''}`)) || DIRECTIONS[5];
  const palette = colorRaw
    ? `Preferensi warna dari pengguna: ${colorRaw}. Validasi kombinasi dan kontras sebelum digunakan.`
    : profile.colors.map((hex, i) => `${i + 1}. ${hex}`).join('\n');
  const keywords = [`${topic} visual identity`, `${topic} art direction`, `${profile.key} design moodboard`, `${topic} color palette`];
  return `🧭 *MOODBOARD DIRECTION*\nTema: *${topic}*\nArah gaya: *${styleRaw || profile.mood}*\n\n*Suasana visual*\n${profile.mood}\n\n*Palet warna awal*\n${palette}\n\n*Tipografi*\n${profile.type}\n\n*Referensi imagery & tekstur*\n${profile.imagery}\n\n*Komposisi*\n${profile.layout}\n\n*Keyword pencarian*\n${keywords.map((item, i) => `${i + 1}. ${item}`).join('\n')}\n\n*Brief moodboard*\nKumpulkan 6–9 referensi: 2 warna/material, 2 tipografi, 2 komposisi, dan 1–3 foto/ilustrasi. Beri catatan singkat mengapa tiap referensi relevan. Jangan menyalin karya atau identitas brand lain.\n\n*Langkah berikutnya*\n• .brandkit ${topic} | industri | audiens | kepribadian\n• .designproject template poster | ${topic.slice(0, 40)}\n\nArah ini adalah titik awal kurasi. Periksa kecocokan dengan audiens, brief, lisensi aset, dan aksesibilitas.`;
}

export function buildDesignCritiqueGuide(brief = '') {
  const subject = clean(brief, 180);
  return `🧐 *DESIGN CRITIQUE — RUBRIK REVIEW*\n${subject ? `Konteks: ${subject}\n` : ''}\nNilai setiap aspek 1–5 setelah memeriksa karya:\n1. *Hierarki visual* — pesan utama langsung terlihat?\n2. *Komposisi & alignment* — elemen punya urutan dan jarak konsisten?\n3. *Keterbacaan* — teks terbaca pada ukuran penggunaan sebenarnya?\n4. *Kontras & warna* — teks/latar cukup kontras dan palet konsisten?\n5. *Tipografi* — pilihan font, ukuran, bobot, dan line-height sesuai?\n6. *Kesesuaian brief* — tujuan, audiens, format, dan CTA terpenuhi?\n7. *Kesiapan produksi* — ejaan, safe area, resolusi, format, dan lisensi sudah dicek?\n\n*Format catatan review*\n• Yang sudah kuat: ...\n• Masalah paling berdampak: ...\n• Saran perbaikan konkret: ...\n• Prioritas pertama: ...\n\nBalas/kirim gambar bersama .designcritique untuk analisis visual AI jika OPENAI_API_KEY tersedia. Tanpa konfigurasi AI, panduan ini tidak berarti bot telah melihat atau menilai gambar. Peer review grup lama tetap tersedia lewat .critique dan .rate.`;
}
