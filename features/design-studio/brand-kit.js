const PALETTES = {
  minimalis: ['#F5F5F0', '#222222', '#8C9A8B', '#D8CFC4'],
  futuristik: ['#0B1020', '#00D9FF', '#8A5CFF', '#F4F7FF'],
  elegan: ['#171717', '#D4AF37', '#F5F0E8', '#6E6259'],
  alam: ['#244D3A', '#8BA888', '#E7E2C8', '#C87941'],
  retro: ['#F4D35E', '#EE964B', '#F95738', '#0D3B66'],
  pastel: ['#F7D6E0', '#CDE7F0', '#D8D5F2', '#FFF1C1'],
};

const PROFILES = [
  { key: 'futuristik', match: /tech|digital|gaming|game|futur|inovasi|software|startup/i, tone: 'progresif, percaya diri, dan ringkas', display: 'Space Grotesk', body: 'Inter', visual: 'geometri tegas, grid rapi, glow seperlunya, dan detail antarmuka yang fungsional' },
  { key: 'alam', match: /alam|organik|kopi|makanan|eco|hijau|natural|pertanian|kesehatan/i, tone: 'hangat, jujur, dan membumi', display: 'DM Serif Display', body: 'Manrope', visual: 'tekstur natural, fotografi autentik, bentuk organik, dan ruang kosong yang lega' },
  { key: 'elegan', match: /premium|luxury|mewah|fashion|beauty|parfum|perhiasan|hotel|wedding/i, tone: 'tenang, eksklusif, dan terkurasi', display: 'Playfair Display', body: 'Montserrat', visual: 'komposisi editorial, detail halus, fotografi berkontras lembut, dan aksen metalik terbatas' },
  { key: 'retro', match: /retro|vintage|musik|festival|komunitas|street|heritage/i, tone: 'ekspresif, akrab, dan berkarakter', display: 'Bebas Neue', body: 'Inter', visual: 'tipografi display, bentuk geometris berani, tekstur cetak, dan layout dinamis' },
  { key: 'pastel', match: /anak|ceria|beauty|cute|playful|edukasi|kreatif/i, tone: 'ramah, optimistis, dan menyenangkan', display: 'Poppins', body: 'Nunito Sans', visual: 'sudut membulat, ilustrasi sederhana, warna lembut, dan ikon yang konsisten' },
];

const clean = (value, max = 120) => String(value ?? '').replace(/[\r\n\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);

export function buildBrandKit({ name, industry = '', audience = '', personality = '' } = {}) {
  const brand = clean(name, 70);
  if (brand.length < 2) return { ok: false, reason: 'name_required' };
  const context = `${industry} ${personality}`;
  const profile = PROFILES.find(item => item.match.test(context)) || {
    key: 'minimalis', tone: 'jelas, konsisten, dan mudah didekati', display: 'Plus Jakarta Sans', body: 'Inter',
    visual: 'grid sederhana, hierarki kuat, ikon seperlunya, dan ruang kosong yang cukup',
  };
  const colors = PALETTES[profile.key];
  const target = clean(audience, 100) || 'Tentukan satu segmen utama berdasarkan riset pelanggan';
  const sector = clean(industry, 80) || 'Belum ditentukan — validasi kategori produk/jasa';
  return {
    ok: true, brand, industry: sector, audience: target, style: profile.key,
    tone: profile.tone, displayFont: profile.display, bodyFont: profile.body,
    colors, visual: profile.visual,
    do: ['Gunakan warna primer dan tipografi secara konsisten', 'Pastikan logo tetap terbaca pada ukuran kecil', 'Jaga kontras teks dan latar; cek pasangan warna sebelum publikasi', 'Gunakan foto/aset dengan izin yang sesuai'],
    dont: ['Jangan mengubah proporsi atau memelintir logo', 'Jangan memakai semua warna aksen sekaligus', 'Jangan menambahkan efek yang mengurangi keterbacaan'],
  };
}

export function formatBrandKit(kit) {
  if (!kit?.ok) return '';
  return `🧩 *BRAND KIT — ${kit.brand.toUpperCase()}*\n\n*Ringkasan brand*\nKategori: ${kit.industry}\nAudiens: ${kit.audience}\nArah visual: ${kit.style}\nKarakter suara: ${kit.tone}\n\n*Palet warna awal*\n${kit.colors.map((color, index) => `${index + 1}. ${color}${index === 0 ? ' — primer' : index === 1 ? ' — kontras/aksen' : ''}`).join('\n')}\n\n*Tipografi rekomendasi*\nDisplay/judul: ${kit.displayFont}\nBody/isi: ${kit.bodyFont}\nValidasi ketersediaan glyph, lisensi, dan keterbacaan sebelum dipakai.\n\n*Gaya visual*\n${kit.visual}\n\n*DO*\n${kit.do.map(item => `• ${item}`).join('\n')}\n\n*DON’T*\n${kit.dont.map(item => `• ${item}`).join('\n')}\n\n*Aplikasi prioritas*\nLogo utama + monokrom, avatar, template sosial, materi promosi, dan panduan penggunaan.\n\n*Langkah validasi*\n1. Uji palet dengan ${'.'}contrast untuk teks/latar.\n2. Uji logo pada ukuran kecil dan satu warna.\n3. Cocokkan gaya dengan wawancara/riset audiens.\n4. Dokumentasikan aturan final dan lisensi aset.\n\nIni rekomendasi awal berbasis kata kunci, bukan hasil riset pasar atau brand strategy final.`;
}
