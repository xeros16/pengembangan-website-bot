export const SUPPORT_CENTER_COMMANDS = new Set(['support']);

const FAQ = [
  ['Cara melihat semua fitur', 'Ketik .help atau .menu untuk melihat kategori fitur dan contoh penggunaan.'],
  ['Cara menemukan perintah', 'Ceritakan kebutuhanmu melalui .cari, misalnya .cari membuat poster promosi.'],
  ['Cara belajar menggunakan bot', 'Ketik .tutorial desain atau .tutorial belajar untuk panduan bertahap.'],
  ['Bot tidak merespons', 'Periksa prefix command, pastikan chat diizinkan, lalu coba .help. Jika tetap bermasalah, buka tiket bantuan.'],
  ['Cara menghubungi bantuan', 'Ketik .ticket buka ringkasan kendala, lalu .ticket saya untuk memeriksa status tiket.'],
  ['Cara melaporkan masalah grup', 'Gunakan .report dengan alasan yang jelas. Laporan hanya dapat dibuat dari grup.'],
];

function supportHome(prefix = '.') {
  return [
    '🛟 *PIR VISUALS — PUSAT BANTUAN*',
    'Pilih jalur bantuan yang paling sesuai. Kamu tidak perlu menghafal semua command.',
    '',
    '*Mulai menggunakan bot*',
    `• ${prefix}help — panduan command dan contoh.`,
    `• ${prefix}menu — lihat fitur berdasarkan kategori.`,
    `• ${prefix}cari <kebutuhan> — temukan fitur dengan bahasa sehari-hari.`,
    `• ${prefix}tutorial desain — panduan dasar.`,
    `• ${prefix}mulai — onboarding interaktif.`,
    '',
    '*Butuh bantuan teknis*',
    `• ${prefix}support faq — jawaban masalah umum.`,
    `• ${prefix}ticket buka <ringkasan> — buat tiket bantuan.`,
    `• ${prefix}ticket saya — lihat tiket milikmu.\n• ${prefix}ticket detail <ID> — baca percakapan tiket.`,
    `• ${prefix}report @anggota | alasan — laporkan masalah di grup.`,
    '',
    'Jangan kirim password, kode OTP, token, atau informasi pembayaran ke dalam tiket.',
  ].join('\n');
}

export async function handleSupportCenterCommands(ctx) {
  const { args = [], PREFIX = '.', reply } = ctx;
  const action = String(args[0] || '').toLowerCase();

  if (!action || action === 'help' || action === 'menu') {
    return reply(supportHome(PREFIX));
  }

  if (action === 'faq') {
    const requested = args.slice(1).join(' ').trim().toLowerCase();
    const selected = requested
      ? FAQ.filter(([question, answer]) => `${question} ${answer}`.toLowerCase().includes(requested))
      : FAQ;
    if (!selected.length) {
      return reply(`Topik FAQ belum ditemukan. Ketik ${PREFIX}support faq untuk melihat semua topik, atau ${PREFIX}ticket buka <ringkasan> untuk meminta bantuan.`);
    }
    return reply(`❓ *FAQ PIR VISUALS*\n\n${selected.map(([question, answer], index) => `${index + 1}. *${question}*\n${answer}`).join('\n\n')}\n\nJika masalah belum teratasi: ${PREFIX}ticket buka <ringkasan kendala>.`);
  }

  if (action === 'ticket') {
    return reply(`🎫 *BANTUAN MELALUI TIKET*\n\n1. Buka tiket: ${PREFIX}ticket buka Bot tidak merespons setelah command dikirim.\n2. Periksa tiket: ${PREFIX}ticket saya.\n3. Baca percakapan: ${PREFIX}ticket detail <ID>.\n4. Admin grup asal dapat melihat tiket grup dengan ${PREFIX}ticket list.\n5. Admin dapat membalas dengan ${PREFIX}ticket balas <ID> <pesan>.\n6. Pemilik tiket dapat menutup tiket dengan ${PREFIX}ticket tutup <ID>.\n\nBatas anti-spam: maksimal 3 tiket terbuka dan 5 tiket baru per 24 jam; maksimal 3 laporan per 10 menit per anggota/grup.\nJangan sertakan OTP, password, token, atau data rahasia.`);
  }

  if (action === 'laporan' || action === 'report') {
    return reply(`🚩 *PELAPORAN DI GRUP*\n\nBalas pesan yang ingin dilaporkan lalu ketik ${PREFIX}report <alasan>, atau gunakan ${PREFIX}report @anggota | <alasan>.\nAdmin grup dapat meninjau laporan melalui ${PREFIX}reports dan menutup laporan yang sudah ditangani dengan ${PREFIX}reports tutup <ID>.`);
  }

  return reply(`Submenu bantuan tidak dikenal. Ketik ${PREFIX}support untuk melihat Pusat Bantuan.`);
}
