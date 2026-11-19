// Extracted command module. Logic preserved from the original handler.
import { buildDesignImagePrompt, generateDesignImage } from '../design-studio/image-generator.js';

export const DESIGN_TOOLS_COMMANDS = new Set(["creative", "explain", "designprompt", "designrender", "designreview", "designscore"]);
export async function handleDesignToolsCommands(ctx) {
  const { makeWASocket, DisconnectReason, useMultiFileAuthState, jidNormalizedUser, fetchLatestBaileysVersion, downloadMediaMessage, Boom, qrcode, fs, path, execFile, promisify, sharp, webpmux, mongoose, GAME_LOCATIONS, GAME_MONSTERS, GAME_CLASSES, createInitialGameState, normalizeGameState, handleGameCommand, PREFIX, MONGO_URI, AUTH_DIR, TEMP_DIR, WELCOME_IMAGE, BACKUP_DIR, BACKUP_INTERVAL_HOURS, execFileAsync, MAX_IMAGE_BYTES, OWNER_JIDS_RAW, DEFAULT_GROUP_RULES, processedMessageIds, senderQueues, MESSAGE_DEDUPE_TTL_MS, MESSAGE_DEDUPE_MAX, rememberMessageId, serializeBySender, PartySchema, GuildSchema, AssetSchema, UserSchema, GroupSchema, FavoriteSchema, AssetAccessSchema, ReportSchema, TicketSchema, ModerationLogSchema, WarningSchema, Party, Guild, GuildWarSchema, GuildWar, MarketListingSchema, MarketListing, WorldBossSchema, WorldBoss, TerritorySchema, Territory, Asset, User, Group, Favorite, AssetAccess, Report, Ticket, Warning, ModerationLog, spamTracker, SPAM_WINDOW_MS, SPAM_MAX_MESSAGES, LINK_REGEX, logModeration, processGroupModeration, normalizeJid, ownerJidSet, ownerIdentityCandidates, isBotOwner, isGroupJid, unwrapMessage, getMessageText, getQuotedMessage, getImageTarget, downloadMedia, isGroupAdmin, isBotAdmin, sendText, requireDatabase, connectDatabase, addStickerPackMetadata, createDatabaseBackup, startBot, getDbReady, getReconnecting, sock, msg, remoteJid, isGroup, messageText, parts, command, args, sender, userJid, senderIdentityAliases, reply } = ctx;
  switch (command) {
          case 'explain': {
            const term = args.join(' ').toLowerCase();
            const techniques = {
              'hierarki visual':'Mengatur urutan perhatian dengan ukuran, kontras, posisi, warna, dan ketebalan. Buat elemen terpenting paling menonjol.',
              'kontras':'Perbedaan nilai terang-gelap, warna, ukuran, atau bentuk agar elemen penting mudah dibedakan.',
              'rule of thirds':'Bagi bidang menjadi 3 kolom dan 3 baris; tempatkan focal point di garis atau titik perpotongannya sebagai panduan komposisi.',
              'negative space':'Ruang kosong di sekitar elemen yang membantu fokus, keterbacaan, dan kesan rapi.',
              'grid':'Sistem garis bantu untuk menjaga alignment, jarak, dan konsistensi tata letak.',
              'typography':'Pemilihan dan pengaturan huruf. Perhatikan keterbacaan, ukuran, line-height, panjang baris, dan pasangan font.',
              'color':'Gunakan warna utama, pendukung, dan aksen secara konsisten; cek kontras teks dengan latar.'
            };
            const match = Object.entries(techniques).find(([k]) => term.includes(k));
            return reply(match ? `📚 *${match[0].toUpperCase()}*\n${match[1]}` : `📚 Teknik yang tersedia: ${Object.keys(techniques).join(', ')}\nContoh: ${PREFIX}explain hierarki visual`);
          }
          case 'creative': {
            const raw = args.join(' ').trim();
            if (!raw) return reply(`💡 *CREATIVE CONCEPT STUDIO*\nBuat tiga arah konsep yang lebih terarah berdasarkan topik desain.\n\nFormat: ${PREFIX}creative <topik> | <gaya opsional> | <platform/ukuran opsional>\nContoh: ${PREFIX}creative kemasan kopi lokal | organik premium | pouch 250 gram\n\nTopik saja juga bisa: ${PREFIX}creative poster festival musik.`);
            const [topicRaw, styleRaw, platformRaw] = raw.split('|').map(value => value.trim());
            const topic = (topicRaw || '').slice(0, 140);
            const style = (styleRaw || 'bebas, pilih sesuai karakter audiens').slice(0, 100);
            const platform = (platformRaw || 'format mengikuti kebutuhan proyek').slice(0, 100);
            if (!topic) return reply(`Topik belum diisi. Contoh: ${PREFIX}creative logo kedai kopi | minimalis hangat | ikon dan wordmark`);

            const lower = topic.toLowerCase();
            const kind = /logo|brand|identitas/.test(lower) ? 'identitas brand'
              : /kemasan|packaging|pouch|botol|label/.test(lower) ? 'kemasan'
              : /web|website|landing|dashboard|ui|app|aplikasi/.test(lower) ? 'antarmuka digital'
              : /carousel|feed|instagram|sosial|konten/.test(lower) ? 'konten sosial'
              : /banner|spanduk|billboard/.test(lower) ? 'banner'
              : 'poster/editorial';
            const profile = {
              'identitas brand': {
                focus: 'Bangun simbol atau wordmark yang mudah dikenali dan tetap terbaca pada ukuran kecil.',
                composition: 'Mulai dari siluet sederhana, susun lockup horizontal/vertikal, lalu uji versi monokrom dan ukuran avatar.',
                palette: 'Pilih satu warna identitas, satu warna pendukung, dan versi hitam-putih; hindari detail warna yang sulit direproduksi.',
                type: 'Gunakan satu keluarga display/wordmark dan satu sans-serif pendamping yang jelas keterbacaannya.',
                qa: 'Uji favicon/avatar, cetak satu warna, ruang aman, konsistensi proporsi, serta lisensi font dan aset.'
              },
              'kemasan': {
                focus: 'Tonjolkan nama produk, varian, manfaat utama, dan informasi wajib dengan urutan baca yang jelas.',
                composition: 'Pisahkan panel depan dan informasi belakang; sisakan area barcode, komposisi, netto, dan label sesuai regulasi produk.',
                palette: 'Batasi palet pada warna brand, pembeda varian, dan warna netral agar rak produk tetap mudah dipindai.',
                type: 'Pakai display yang kuat untuk nama produk dan sans-serif yang terbaca untuk detail kecil.',
                qa: 'Cocokkan dieline, bleed, safe area, ukuran teks cetak, barcode, bahan, dan proof warna sebelum produksi.'
              },
              'antarmuka digital': {
                focus: 'Utamakan satu tugas pengguna dan satu CTA primer per layar.',
                composition: 'Susun grid responsif, navigasi, konten utama, dan state loading/empty/error/success secara eksplisit.',
                palette: 'Tetapkan semantic tokens untuk primary, surface, text, border, success, warning, dan danger.',
                type: 'Gunakan skala modular; prioritaskan body text yang nyaman dan heading dengan hierarki konsisten.',
                qa: 'Uji breakpoint, keyboard/focus, kontras WCAG, zoom, target sentuh, validasi form, dan state gagal.'
              },
              'konten sosial': {
                focus: 'Buat hook yang terbaca dalam beberapa detik dan satu pesan utama per slide/post.',
                composition: 'Letakkan hook pada area awal, visual utama sebagai focal point, detail setelahnya, dan CTA pada penutup.',
                palette: 'Gunakan palet ringkas dengan kontras cukup pada layar ponsel; warna aksen hanya untuk informasi penting.',
                type: 'Gunakan judul tegas, body singkat, dan ukuran teks yang tetap terbaca saat preview kecil.',
                qa: 'Periksa safe area, crop thumbnail, urutan carousel, ejaan, CTA, dan konsistensi antar-post.'
              },
              banner: {
                focus: 'Sampaikan satu pesan inti dari jarak pandang yang sesuai dengan lokasi pemasangan.',
                composition: 'Gunakan headline singkat, visual besar, detail seperlunya, dan CTA/kontak yang tidak tenggelam.',
                palette: 'Pilih kontras tinggi dan hindari terlalu banyak warna yang bersaing.',
                type: 'Gunakan huruf display tebal untuk headline dan sans-serif sederhana untuk informasi pendukung.',
                qa: 'Pastikan resolusi sesuai skala cetak, bleed, safe margin, jarak baca, dan ejaan informasi.'
              },
              'poster/editorial': {
                focus: 'Tentukan satu focal point dan satu pesan yang harus diingat audiens.',
                composition: 'Bangun hierarki headline → visual utama → detail pendukung → CTA; manfaatkan grid dan negative space.',
                palette: 'Pilih 2–4 warna dengan satu aksen dominan; pastikan teks tetap kontras dengan latar.',
                type: 'Padukan display untuk headline dan sans-serif/body yang tenang untuk detail acara atau informasi.',
                qa: 'Periksa keterbacaan dari thumbnail, safe margin, rasio, ejaan, tanggal/lokasi, dan format ekspor.'
              }
            }[kind];
            const directions = [
              { name: 'A — Fokus & jelas', treatment: 'Komposisi terstruktur, hierarki kuat, ruang kosong cukup, dan elemen dekoratif minimal.', accent: 'Gunakan satu aksen warna untuk CTA atau informasi terpenting.' },
              { name: 'B — Karakter & ekspresif', treatment: 'Skala visual berani, crop objek terarah, bentuk grafis khas, dan ritme layout dinamis.', accent: 'Gunakan warna aksen lebih berani tetapi batasi pada elemen focal point.' },
              { name: 'C — Hangat & bercerita', treatment: 'Gunakan detail kontekstual, tekstur halus, visual yang terasa dekat dengan audiens, dan alur baca natural.', accent: 'Gunakan warna pendukung yang lebih lembut untuk membangun suasana.' }
            ];
            const output = directions.map((item, index) => `${index + 1}. *${item.name}*\nArah visual: ${item.treatment}\nAksen: ${item.accent}`).join('\n\n');
            const prompt = `Rancang ${kind} untuk topik “${topic}”. Targetkan audiens sesuai brief proyek. Gaya yang diminta: ${style}. Format: ${platform}. ${profile.focus} ${profile.composition} Gunakan palet warna yang koheren, tipografi terbaca, komposisi orisinal, dan safe area yang sesuai. Hindari meniru merek, karakter berhak cipta, atau karya kreator tertentu. Jangan membuat teks acak, watermark, atau logo palsu.`;
            return reply(`💡 *CREATIVE CONCEPT STUDIO*\nTopik: ${topic}\nKategori terdeteksi: ${kind}\nGaya: ${style}\nFormat: ${platform}\n\n*3 arah konsep*\n${output}\n\n*Arahan produksi*\n• Fokus: ${profile.focus}\n• Komposisi: ${profile.composition}\n• Warna: ${profile.palette}\n• Tipografi: ${profile.type}\n\n*QA sebelum final*\n${profile.qa}\n\n*PROMPT SIAP SALIN*\n${prompt}\n\n*Alur lanjutan*\n${PREFIX}wizard → ${PREFIX}creative → ${PREFIX}colorpalette <gaya> / ${PREFIX}colorconvert <warna> → ${PREFIX}fontpair <gaya> → ${PREFIX}designreview ${kind === 'identitas brand' ? 'logo' : kind === 'kemasan' ? 'poster' : kind === 'antarmuka digital' ? 'web' : kind === 'konten sosial' ? 'sosial' : 'poster'}.\n\nGenerator ini menyusun arahan berbasis template dan kata kunci, bukan AI image generator atau penilaian otomatis. Validasi kebutuhan, teks wajib, lisensi aset, dan spesifikasi produksi sebelum digunakan.`);
          }
          case 'designrender': {
            const raw = args.join(' ').trim();
            if (!raw) return reply(`🖼️ *AI DESIGN RENDERER*\nBuat konsep visual langsung menjadi gambar.\n\nFormat: ${PREFIX}designrender <jenis> | <tema> | <audiens> | <gaya> | <detail opsional>\nContoh: ${PREFIX}designrender poster | festival musik elektronik | anak muda | futuristik neon | dominan ungu dan cyan\n\nMemerlukan OPENAI_API_KEY dan akses model gambar. Biaya API mengikuti akun penyedia.`);
            const fields = raw.split('|').map(value => value.trim());
            const [kind = 'poster', theme = '', audience = 'general audience', style = 'clean contemporary', details = ''] = fields;
            if (!theme && fields.length < 2) return reply(`Tema belum diisi. Contoh: ${PREFIX}designrender poster | festival musik`);
            const prompt = buildDesignImagePrompt({ kind, theme, audience, style, details });
            await reply('🎨 Sedang membuat konsep visual. Proses ini dapat memerlukan waktu hingga sekitar 90 detik…');
            const result = await generateDesignImage({ prompt });
            if (!result.ok) {
              const messages = {
                not_configured: 'OPENAI_API_KEY belum diatur pada .env.',
                auth_error: 'API key ditolak. Periksa OPENAI_API_KEY.',
                rate_limited: 'Batas atau kuota API sedang tercapai. Coba lagi nanti.',
                bad_request: `Permintaan gambar ditolak penyedia: ${result.detail || 'periksa model dan parameter API.'}`,
                timeout: 'Penyedia gambar terlalu lama merespons. Coba lagi nanti.',
                network_error: 'Koneksi ke penyedia gambar gagal.',
                download_failed: 'Gambar berhasil diminta tetapi gagal diunduh.',
                invalid_image: 'Penyedia tidak mengembalikan file gambar yang valid.',
                provider_error: `Penyedia gambar mengalami gangguan: ${result.detail || 'coba lagi nanti.'}`,
              };
              return reply(`⚠️ *AI DESIGN RENDERER*\n${messages[result.reason] || 'Gagal membuat gambar.'}\n\nKamu masih bisa memakai ${PREFIX}designprompt untuk menghasilkan prompt teks.`);
            }
            return sock.sendMessage(remoteJid, { image: result.buffer, mimetype: 'image/png', caption: `✨ *AI DESIGN RENDERER*\nJenis: ${kind}\nTema: ${theme}\nGaya: ${style}\nModel: ${result.model}\n\nKonsep visual ini adalah draft eksplorasi. Periksa detail, teks, hak penggunaan, dan kesesuaian brand sebelum diproduksi.` }, { quoted: msg });
          }
          case 'designreview': {
            const kind = String(args.join(' ') || '').trim().toLowerCase();
            const rubrics = {
              poster: { title: 'Poster', items: ['Pesan utama langsung terbaca dan hierarki judul jelas', 'Informasi penting (tanggal, lokasi, CTA) lengkap dan akurat', 'Kontras teks-latar memadai serta teks mudah dibaca dari jarak wajar', 'Komposisi punya focal point dan ruang kosong yang cukup', 'Ukuran, bleed/safe margin, dan ekspor sesuai media tujuan'] },
              web: { title: 'Website', items: ['Tujuan halaman dan CTA utama mudah dikenali', 'Navigasi, label, dan struktur heading konsisten', 'Layout responsif tanpa scroll horizontal yang tidak perlu', 'Form punya label, validasi, dan pesan error yang jelas', 'Loading, empty, success, dan error state tersedia', 'Keyboard, focus, kontras, dan zoom telah diperiksa'] },
              app: { title: 'Aplikasi', items: ['Tugas utama mudah ditemukan dari layar awal', 'Navigasi dan pola interaksi konsisten', 'Feedback muncul setelah aksi pengguna', 'Target sentuh dan teks nyaman di layar kecil', 'Izin diminta saat diperlukan dan alasannya jelas', 'State offline, loading, kosong, dan gagal ditangani'] },
              logo: { title: 'Logo', items: ['Bentuk khas dan mudah dikenali', 'Tetap terbaca pada ukuran kecil', 'Berfungsi pada latar terang, gelap, dan monokrom', 'Proporsi dan clear space konsisten', 'Tidak bergantung pada efek dekoratif', 'Font dan aset memiliki izin penggunaan'] },
              sosial: { title: 'Konten Sosial', items: ['Hook dan pesan utama jelas di area pertama', 'Teks terbaca pada layar ponsel', 'Format dan safe area sesuai platform', 'CTA dan urutan slide mudah dipahami', 'Identitas visual konsisten antar konten', 'Caption, ejaan, dan crop sudah diperiksa'] },
              marketplace: { title: 'Direktori Portofolio Desainer', items: ['Pencarian, filter, kategori, dan lokasi mudah dipahami', 'Profil, spesialisasi, dan karya portofolio transparan', 'Kontak publik hanya tampil atas persetujuan desainer', 'Tautan WhatsApp/sosial valid dan mudah digunakan', 'Izin publikasi karya dan atribusi ditampilkan dengan jelas', 'JID internal dan data pribadi tidak bocor ke profil publik'] }
            };
            const key = Object.keys(rubrics).find(name => kind === name || kind.includes(name));
            if (!key) return reply(`🧪 *DESIGN REVIEW CHECKLIST*\nPilih: ${Object.keys(rubrics).join(', ')}\nContoh: ${PREFIX}designreview web\n\nNilai setiap kriteria: 0 = belum, 1 = sebagian, 2 = sudah. Jumlahkan sendiri; bot tidak menilai gambar secara otomatis.`);
            const rubric = rubrics[key];
            const lines = rubric.items.map((item, index) => `${index + 1}. [0/1/2] ${item}`);
            return reply(`🧪 *DESIGN REVIEW: ${rubric.title.toUpperCase()}*\n\n${lines.join('\n')}\n\n*Skala penilaian*\n0 = belum terpenuhi\n1 = sebagian / perlu perbaikan\n2 = sudah terpenuhi\n\n*Interpretasi total*\n${rubric.items.length * 2} = nilai maksimum. Prioritaskan kriteria bernilai 0, lalu uji ulang setelah revisi. Ini rubric evaluasi mandiri, bukan analisis otomatis terhadap file desain.`);
          }
          case 'designscore': {
            const raw = args.join(' ').trim();
            const [kindRaw, ratingsRaw] = raw.split('|').map(value => (value || '').trim());
            const rubrics = {
              poster: ['Pesan dan hierarki', 'Informasi akurat', 'Kontras dan keterbacaan', 'Komposisi dan ruang kosong', 'Margin dan ekspor'],
              web: ['Tujuan dan CTA', 'Navigasi dan struktur', 'Responsif', 'Form dan validasi', 'State sistem', 'Aksesibilitas'],
              app: ['Kemudahan tugas utama', 'Konsistensi navigasi', 'Feedback interaksi', 'Target sentuh dan teks', 'Izin dan privasi', 'State offline/error'],
              logo: ['Keunikan bentuk', 'Keterbacaan ukuran kecil', 'Versi latar/monokrom', 'Proporsi dan clear space', 'Kesederhanaan', 'Lisensi aset'],
              sosial: ['Hook dan pesan', 'Keterbacaan mobile', 'Format dan safe area', 'CTA dan urutan', 'Konsistensi identitas', 'Caption dan crop'],
              marketplace: ['Pencarian dan filter', 'Transparansi profil/karya', 'Kontak publik opt-in', 'Tautan kontak langsung', 'Izin publikasi karya', 'Privasi data'],
            };
            const kind = (kindRaw || '').toLowerCase();
            if (!rubrics[kind] || !ratingsRaw) return reply(`📊 *DESIGN SCORECARD*\nFormat: ${PREFIX}designscore <poster/web/app/logo/sosial/marketplace> | <nilai dipisah koma>\nContoh: ${PREFIX}designscore web | 2,1,2,1,0,1\n\nBeri satu nilai untuk setiap kriteria sesuai urutan: 0 = belum, 1 = sebagian, 2 = terpenuhi.`);
            const values = ratingsRaw.split(/[;,\s]+/).filter(Boolean).map(Number);
            const items = rubrics[kind];
            if (values.length !== items.length || values.some(value => !Number.isInteger(value) || value < 0 || value > 2)) return reply(`⚠️ Nilai tidak valid. Untuk ${kind}, masukkan tepat ${items.length} angka dari 0 sampai 2, dipisahkan koma.\nContoh: ${PREFIX}designscore ${kind} | ${items.map(() => '1').join(',')}`);
            const total = values.reduce((sum, value) => sum + value, 0);
            const max = items.length * 2;
            const percent = Math.round(total / max * 100);
            const rows = items.map((item, index) => `${values[index] === 2 ? '✅' : values[index] === 1 ? '🟡' : '🔴'} ${index + 1}. ${item}: ${values[index]}/2`);
            const priorities = items.filter((item, index) => values[index] < 2);
            const advice = percent >= 85 ? 'Fondasi sudah kuat. Periksa detail akhir dan validasi pada perangkat/media tujuan.' : percent >= 60 ? 'Cukup sebagai draft. Selesaikan kriteria yang belum penuh sebelum publikasi.' : 'Perlu revisi terarah. Mulai dari kriteria bernilai 0, lalu nilai ulang.';
            return reply(`📊 *DESIGN SCORECARD — ${kind.toUpperCase()}*\n\n${rows.join('\n')}\n\n*Skor: ${total}/${max} (${percent}%)*\n${advice}\n\n*Prioritas perbaikan*\n${priorities.length ? priorities.map(item => `• ${item}`).join('\n') : '• Tidak ada kriteria tertinggal pada rubric ini.'}\n\nSkor ini berasal dari penilaian mandiri, bukan analisis otomatis atau sertifikasi kualitas.`);
          }
          case 'designprompt': {
            const raw = args.join(' ').trim();
            if (!raw) return reply(`🪄 *PEMBUAT PROMPT DESAIN*\nFormat: ${PREFIX}designprompt <jenis> | <tema> | <audiens> | <gaya>\nContoh: ${PREFIX}designprompt poster | festival musik malam | remaja | futuristik neon\n\nBagian setelah jenis boleh dikosongkan; prompt akan memakai arahan umum.`);
            const fields = raw.split('|').map(value => value.trim());
            const kind = (fields[0] || 'visual design').slice(0, 80);
            const theme = (fields[1] || fields[0] || 'a compelling creative concept').slice(0, 180);
            const audience = (fields[2] || 'general audience').slice(0, 100);
            const style = (fields[3] || 'clean, polished, contemporary').slice(0, 120);
            const prompt = `Create an original ${kind} design about “${theme}” for ${audience}. Visual direction: ${style}. Use a clear visual hierarchy, intentional composition, balanced negative space, strong readability, cohesive color palette, refined typography, and a distinct focal point. Keep all key elements within safe margins. Make the concept original; do not imitate an existing brand, copyrighted character, or a specific creator. Avoid gibberish text, accidental logos, watermarks, and unnecessary decorative clutter. Output a polished, production-ready visual suitable for the intended format.`;
            return reply(`🪄 *PROMPT DESAIN SIAP SALIN*\nJenis: ${kind}\nTema: ${theme}\nAudiens: ${audience}\nGaya: ${style}\n\n${prompt}\n\nℹ️ Ini generator prompt teks, bukan pembuat gambar otomatis. Periksa kembali teks, lisensi aset, dan hasil sebelum dipublikasikan.`);
          }

    default: return;
  }
}
