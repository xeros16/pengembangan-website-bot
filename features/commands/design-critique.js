import { analyzeDesignWithVision } from '../design-studio/design-vision.js';
import { buildDesignCritiqueGuide } from './designer-workflow.js';

const getCritiqueModel = async () => (await import('../../models/index.js')).Critique;

export const DESIGN_CRITIQUE_COMMANDS = new Set(['critique', 'rate', 'designcritique']);

export async function handleDesignCritiqueCommands(ctx) {
  const {
    sock, msg, remoteJid, isGroup, command, args,
    userJid, reply, PREFIX = '.', getImageTarget, downloadMedia, sharp
  } = ctx;

  if (command === 'designcritique') {
    const target = typeof getImageTarget === 'function' ? getImageTarget(msg) : null;
    const brief = args.join(' ').trim();
    if (!target) return reply(buildDesignCritiqueGuide(brief));
    if (!process.env.OPENAI_API_KEY) {
      return reply(`${buildDesignCritiqueGuide(brief)}\n\n⚠️ OPENAI_API_KEY belum dikonfigurasi. Bot belum menganalisis gambar ini.`);
    }
    try {
      const imageBuffer = await downloadMedia(sock, target);
      const result = await analyzeDesignWithVision({ brief, imageBuffer, sharp });
      if (result.ok) return reply(`🧐 *HASIL DESIGN CRITIQUE AI*\n\n${result.text || result.analysis || 'Analisis selesai, tetapi respons tidak berisi teks yang dapat ditampilkan.'}\n\nCatatan: gunakan hasil ini sebagai masukan; validasi kembali dengan brief dan kebutuhan klien.`);
      return reply(`${buildDesignCritiqueGuide(brief)}\n\n⚠️ Analisis AI tidak tersedia (${result.reason || 'unknown'}). Tidak ada penilaian otomatis yang dilakukan.`);
    } catch (error) {
      return reply(`${buildDesignCritiqueGuide(brief)}\n\n⚠️ Gambar belum berhasil dianalisis (${String(error?.message || 'kesalahan tidak diketahui').slice(0, 160)}).`);
    }
  }

  if (!isGroup) return reply('⛔ Fitur kritik desain komunitas hanya tersedia di dalam grup.');

  const sub = (args[0] || '').toLowerCase();

  // --- KIRIM KARYA UNTUK REVIEW ---
  if (command === 'critique' && sub === '') {
    const target = getImageTarget(msg);
    if (!target) return reply(`Kirim atau balas gambar dengan caption ${PREFIX}critique untuk meminta review.`);

    // Gunakan ID pesan sebagai hash sederhana untuk identifikasi karya
    const imageHash = msg.key.id || 'unknown';

    const Critique = await getCritiqueModel();
    await Critique.findOneAndUpdate(
      { groupJid: remoteJid, imageHash },
      { submitterJid: userJid },
      { upsert: true }
    );

    return reply(`✅ *Karya Berhasil Dikirim!*\n\nSekarang anggota grup bisa memberikan rating dengan membalas gambar ini menggunakan perintah:\n\n${PREFIX}rate <angka 1-5> <komentar>\n\nContoh: ${PREFIX}rate 5 Komposisinya mantap!`);
  }

  // --- LIHAT DAFTAR REVIEW ---
  if (command === 'critique' && sub === 'list') {
    const Critique = await getCritiqueModel();
    const activeCritiques = await Critique.find({ groupJid: remoteJid, status: 'active' }).sort({ createdAt: -1 }).limit(5);
    if (!activeCritiques.length) return reply('Tidak ada karya yang sedang menunggu review saat ini.');

    let text = `🎨 *ANTREAN REVIEW DESAIN*\n\n`;
    activeCritiques.forEach((c, i) => {
      const avg = c.ratings.length ? (c.ratings.reduce((a, b) => a + b.score, 0) / c.ratings.length).toFixed(1) : 'Belum ada rating';
      text += `${i + 1}. Pengirim: ${c.submitterJid.split('@')[0]}\nRating: ${avg} ⭐ (${c.ratings.length} vote)\n\n`;
    });
    text += `Balas gambar karya tersebut dengan ${PREFIX}rate untuk memberi nilai.`;
    return reply(text);
  }

  // --- MEMBERIKAN RATING ---
  if (command === 'rate') {
    const score = Number(args[0]);
    const comment = args.slice(1).join(' ');

    if (!Number.isInteger(score) || score < 1 || score > 5) {
      return reply(`Format salah! Gunakan: ${PREFIX}rate <angka 1-5> <komentar>\nContoh: ${PREFIX}rate 4 Bagus, tapi warna kurang kontras.`);
    }

    const quoted = ctx.getQuotedMessage(msg);
    if (!quoted) return reply('Balas gambar karya yang ingin diberi rating!');

    const imageHash = quoted.key.id;
    const Critique = await getCritiqueModel();
    const critique = await Critique.findOne({ groupJid: remoteJid, imageHash });

    if (!critique) return reply('Gambar ini bukan bagian dari sistem kritik desain.');
    if (critique.submitterJid === userJid) return reply('Kamu tidak bisa memberi rating pada karyamu sendiri!');

    critique.ratings.push({
      userJid,
      score,
      comment: comment || 'Tanpa komentar'
    });
    await critique.save();

    return reply(`✅ *Rating Terkirim!*\n\nSkor: ${score} ⭐\nKomentar: ${comment || '-'}\nTerima kasih telah membantu rekan desainer!`);
  }

  return null;
}
