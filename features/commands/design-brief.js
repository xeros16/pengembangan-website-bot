import { analyzeDesignWithVision } from '../design-studio/design-vision.js';
// Extracted command module. Logic preserved from the original handler.
export const DESIGN_BRIEF_COMMANDS = new Set(["brief", "fontpair", "layout"]);

function escapeXml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char]);
}

/** SVG preview card. Font fallbacks keep the preview readable on hosts without the named fonts installed. */
export function buildFontPairPreviewSvg(pair, index = 1) {
  const [displayFont, bodyFont] = pair.fonts.split('+').map(value => value.trim());
  const displayStack = `'${escapeXml(displayFont)}', Georgia, serif`;
  const bodyStack = `'${escapeXml(bodyFont)}', Arial, sans-serif`;
  const title = escapeXml('Ide yang kuat, dimulai dari detail.');
  const body = escapeXml('Tipografi yang tepat membuat pesan terasa jelas, konsisten, dan mudah diingat.');
  const label = escapeXml(pair.note);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#111827"/><stop offset="1" stop-color="#312e81"/></linearGradient></defs>
  <rect width="1200" height="630" rx="34" fill="url(#bg)"/>
  <circle cx="1050" cy="90" r="180" fill="#a78bfa" opacity=".12"/><circle cx="80" cy="600" r="210" fill="#38bdf8" opacity=".10"/>
  <text x="78" y="82" fill="#c4b5fd" font-family="Arial,sans-serif" font-size="23" font-weight="700" letter-spacing="4">FONT PAIRING STUDIO · PREVIEW ${index}</text>
  <text x="78" y="175" fill="#ffffff" font-family="${displayStack}" font-size="34" font-weight="700">${escapeXml(displayFont)}  +  ${escapeXml(bodyFont)}</text>
  <text x="78" y="305" fill="#ffffff" font-family="${displayStack}" font-size="66" font-weight="700">${title}</text>
  <text x="82" y="385" fill="#e0e7ff" font-family="${bodyStack}" font-size="29">${body}</text>
  <rect x="82" y="440" width="150" height="5" rx="2" fill="#a78bfa"/>
  <text x="82" y="500" fill="#cbd5e1" font-family="${bodyStack}" font-size="22">${label}</text>
  <text x="82" y="580" fill="#94a3b8" font-family="Arial,sans-serif" font-size="17">SAMPLE PREVIEW · Periksa font asli, bobot, dan lisensi sebelum produksi</text>
  </svg>`;
}

export async function sendFontPairPreview({ pair, index, sharp, sock, remoteJid, msg, reply }) {
  if (!pair || typeof sharp !== 'function' || !sock?.sendMessage || !remoteJid) {
    return reply('⚠️ Preview gambar belum tersedia pada konfigurasi bot ini.');
  }
  const svg = buildFontPairPreviewSvg(pair, index);
  const image = await sharp(Buffer.from(svg)).png().toBuffer();
  return sock.sendMessage(remoteJid, {
    image,
    caption: `🔤 *FONT PAIR PREVIEW #${index}*\n${pair.fonts}\n${pair.note}\n\nPreview ini bersifat ilustratif; hasil akhir bergantung pada font yang terpasang di aplikasi desain.`
  }, msg ? { quoted: msg } : {});
}

const FONTPAIR_MOOD_MAP = {
  luxury: ['elegan', 'luxury', 'premium', 'fashion', 'beauty', 'mewah', 'serif'],
  minimal: ['minimalis', 'ui', 'web', 'app', 'bersih', 'modern', 'sans'],
  playful: ['playful', 'fun', 'ceria', 'anak', 'friendly', 'youth'],
  futuristic: ['futuristik', 'tech', 'gaming', 'sci-fi', 'digital', 'otomotif'],
  editorial: ['editorial', 'magazine', 'publikasi', 'artikel', 'serif'],
  vintage: ['vintage', 'retro', 'classic', 'cafe', 'hospitality'],
  bold: ['bold', 'poster', 'sport', 'impact', 'tegas', 'event'],
  warm: ['hangat', 'humanis', 'lifestyle', 'wellness', 'ramah', 'natural'],
};

export function rankFontPairs(pairs, query, limit = 5) {
  const normalized = String(query || '').toLowerCase().trim();
  const expanded = new Set(normalized.split(/[^\p{L}\p{N}]+/u).filter(Boolean));
  for (const [mood, tags] of Object.entries(FONTPAIR_MOOD_MAP)) {
    if (normalized.includes(mood)) tags.forEach(tag => expanded.add(tag));
  }
  const scored = pairs.map((pair, index) => {
    const haystack = `${pair.fonts} ${pair.note} ${(pair.tags || []).join(' ')}`.toLowerCase();
    let score = 0;
    for (const token of expanded) {
      if (haystack.includes(token)) score += pair.tags?.includes(token) ? 3 : 1;
    }
    if (normalized && haystack.includes(normalized)) score += 5;
    return { pair, index: index + 1, score };
  }).filter(item => !normalized || item.score > 0);
  return scored.sort((a, b) => b.score - a.score || a.index - b.index).slice(0, limit);
}

const FONT_ASSISTANT_PROFILES = [
  { keys: ['premium','luxury','mewah','elegan','fashion','beauty','skincare','parfum'], mood: 'Elegan, premium, dan refined', palette: ['#171717', '#D4AF37', '#F5F0E8', '#8C8178'], direction: 'Gunakan ruang kosong luas, grid rapi, detail tipis, dan satu aksen metalik. Hindari terlalu banyak ornamen.', tags: 'premium luxury fashion beauty elegan skincare' },
  { keys: ['gaming','esports','game','futuristik','tech','teknologi','otomotif','sci-fi'], mood: 'Futuristik, digital, dan berenergi', palette: ['#0B1020', '#00D9FF', '#8A5CFF', '#F4F7FF'], direction: 'Pakai kontras tinggi, headline condensed/tebal, aksen neon secukupnya, dan komposisi diagonal yang terarah.', tags: 'gaming esports futuristic tech otomotif poster sport' },
  { keys: ['anak','ceria','fun','playful','edukasi','komunitas','youth'], mood: 'Ceria, ramah, dan playful', palette: ['#FFF1C1', '#F7D6E0', '#8CC9C1', '#30475E'], direction: 'Gunakan bentuk rounded, ilustrasi sederhana, warna cerah yang tetap dibatasi, dan tipografi sans yang mudah dibaca.', tags: 'playful fun anak edukasi friendly youth' },
  { keys: ['alam','natural','organik','kopi','cafe','kafe','wellness','organik'], mood: 'Hangat, natural, dan humanis', palette: ['#244D3A', '#8BA888', '#E7E2C8', '#C87941'], direction: 'Gunakan tekstur natural, warna bumi, foto dengan pencahayaan lembut, serta layout editorial yang santai.', tags: 'warm natural cafe hospitality wellness lifestyle' },
  { keys: ['minimal','modern','ui','ux','website','web','app','dashboard','startup'], mood: 'Minimal, modern, dan fungsional', palette: ['#F5F5F0', '#222222', '#8C9A8B', '#D8CFC4'], direction: 'Utamakan grid konsisten, whitespace, hierarki jelas, dan aksen warna terbatas. Pastikan ukuran teks dan kontras aksesibel.', tags: 'minimal modern ui web app dashboard startup' },
  { keys: ['poster','event','musik','festival','sport','olahraga','promo'], mood: 'Bold, ekspresif, dan komunikatif', palette: ['#101820', '#FEE715', '#F96167', '#FFFFFF'], direction: 'Buat satu focal point, headline dominan, informasi bertingkat, dan CTA yang mudah ditemukan.', tags: 'poster bold event sport promo editorial' },
];

export function buildFontPairAssistantResult(pairs, brief, imageInfo = null) {
  const query = String(brief || '').trim();
  const normalized = query.toLowerCase();
  const profile = FONT_ASSISTANT_PROFILES.find(item => item.keys.some(key => normalized.includes(key))) || {
    mood: 'Modern, seimbang, dan fleksibel',
    palette: ['#18212F', '#5B8DEF', '#E9EEF5', '#F4B860'],
    direction: 'Bangun hierarki yang jelas: satu headline, satu tingkat informasi pendukung, dan body text yang nyaman dibaca. Jaga konsistensi grid dan jarak.',
    tags: 'modern minimal editorial brand digital'
  };
  const ranked = rankFontPairs(pairs, `${query} ${profile.tags}`, 3);
  const colors = imageInfo?.dominantHex?.length ? imageInfo.dominantHex : profile.palette;
  const imageLine = imageInfo
    ? `\nReferensi visual: ${imageInfo.width || '?'}×${imageInfo.height || '?'} px${imageInfo.dominantHex?.length ? ` · warna dominan ${imageInfo.dominantHex.join(', ')}` : ''}. Analisis gambar ini membaca metadata dan statistik warna, bukan memahami objek/teks seperti model vision.`
    : '';
  return `🧠 *FONTPAIR DESIGN ASSISTANT*\nBrief: ${query || 'Belum ditentukan'}\nArah visual: *${profile.mood}*${imageLine}\n\n🎨 *ARAH WARNA*\n${colors.map((hex, i) => `${i + 1}. ${hex}`).join('\n')}\n\n🔤 *REKOMENDASI TIPOGRAFI*\n${ranked.length ? ranked.map((item, i) => `${i + 1}. *${item.pair.fonts}*\n   ${item.pair.note}`).join('\n\n') : 'Coba tambahkan kata kunci bidang atau mood agar pasangan font lebih spesifik.'}\n\n🧭 *ARAH ART DIRECTION*\n${profile.direction}\n\n🛠️ *LANGKAH LANJUT*\n1. Pakai font pertama untuk headline/display dan font kedua untuk body.\n2. Terapkan palet dengan satu warna dominan dan satu aksen.\n3. Uji keterbacaan, kontras WCAG, karakter bahasa, bobot, dan lisensi sebelum produksi.\n\nHasil ini adalah rekomendasi berbasis aturan dan koleksi kurasi lokal, bukan keputusan desain otomatis. Preview: .fontpair preview <nomor> · Live font: .fontpair google <display> | <body>`;
}

export async function inspectDesignReference(buffer, sharpImpl) {
  if (!Buffer.isBuffer(buffer) || typeof sharpImpl !== 'function') return null;
  const image = sharpImpl(buffer).rotate();
  const [metadata, stats] = await Promise.all([image.metadata(), image.stats()]);
  const channels = (stats.channels || []).slice(0, 3);
  const dominantHex = channels.length >= 3
    ? [`#${channels.map(channel => Math.max(0, Math.min(255, Math.round(channel.mean))).toString(16).padStart(2, '0')).join('').toUpperCase()}`]
    : [];
  return { width: metadata.width, height: metadata.height, dominantHex };
}

function getFontPairFavoriteModel(mongoose) {
  if (!mongoose?.models || typeof mongoose.model !== 'function') return null;
  if (mongoose.models.FontPairFavorite) return mongoose.models.FontPairFavorite;
  const schema = new mongoose.Schema({
    jid: { type: String, required: true, index: true },
    pairKey: { type: String, required: true },
    fonts: { type: String, required: true },
    note: { type: String, default: '' },
    catalogIndex: { type: Number, default: 0 },
  }, { timestamps: true });
  schema.index({ jid: 1, pairKey: 1 }, { unique: true });
  return mongoose.model('FontPairFavorite', schema);
}

function safeFontFamily(value) {
  return String(value || '').trim().replace(/[<>\\"'`;{}]/g, '').replace(/\s+/g, ' ').slice(0, 70);
}

export function buildGoogleFontsPreviewHtml(displayFont, bodyFont) {
  const display = safeFontFamily(displayFont);
  const body = safeFontFamily(bodyFont);
  const css = `https://fonts.googleapis.com/css2?${[display, body].map(name => `family=${encodeURIComponent(name).replace(/%20/g, '+')}:wght@400;700`).join('&')}&display=swap`;
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  return `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>FontPair Google Fonts Preview</title><link rel="stylesheet" href="${css}"><style>body{margin:0;padding:40px;background:#101827;color:#f8fafc;font-family:Arial,sans-serif}.card{max-width:900px;margin:0 auto;background:#1e293b;border-radius:24px;padding:42px}.eyebrow{color:#a5b4fc;letter-spacing:.18em;font-size:12px;font-weight:bold}.display{font-family:'${esc(display)}',Georgia,serif;font-size:clamp(38px,7vw,72px);line-height:1.05;margin:38px 0 20px}.body{font-family:'${esc(body)}',Arial,sans-serif;font-size:20px;line-height:1.65;color:#cbd5e1}.meta{margin-top:36px;padding-top:20px;border-top:1px solid #475569;color:#94a3b8;font-size:13px}</style></head><body><main class="card"><div class="eyebrow">PIR VISUALS · LIVE GOOGLE FONTS PREVIEW</div><div class="display">Ide yang kuat, dimulai dari detail.</div><p class="body">Tipografi yang tepat membuat pesan terasa jelas, konsisten, dan mudah diingat. Ubah ukuran jendela browser untuk melihat skala responsif pasangan font ini.</p><div class="meta"><b>DISPLAY:</b> ${esc(display)} &nbsp; · &nbsp; <b>BODY:</b> ${esc(body)}<br>Font dimuat langsung dari Google Fonts saat file dibuka dengan koneksi internet.</div></main></body></html>`;
}

export async function verifyGoogleFontPair(displayFont, bodyFont, fetchImpl = globalThis.fetch) {
  if (typeof fetchImpl !== 'function') return { ok: false, reason: 'fetch_unavailable' };
  const families = [displayFont, bodyFont].map(name => `family=${encodeURIComponent(safeFontFamily(name)).replace(/%20/g, '+')}:wght@400;700`).join('&');
  try {
    const response = await fetchImpl(`https://fonts.googleapis.com/css2?${families}&display=swap`, { headers: { 'user-agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(9000) });
    if (!response.ok) return { ok: false, reason: 'not_found' };
    const css = await response.text();
    return { ok: /font-family\s*:/i.test(css), reason: 'not_found' };
  } catch { return { ok: false, reason: 'network_error' }; }
}

async function sendGoogleFontsPreview({ displayFont, bodyFont, sock, remoteJid, msg, reply }) {
  const display = safeFontFamily(displayFont);
  const body = safeFontFamily(bodyFont);
  if (!display || !body || !sock?.sendMessage || !remoteJid) return reply('Format: .fontpair google <font judul> | <font isi>');
  const check = await verifyGoogleFontPair(display, body);
  if (!check.ok) return reply(check.reason === 'network_error' ? 'Google Fonts sedang tidak dapat dijangkau. Coba lagi nanti.' : `Font tidak ditemukan atau tidak tersedia di Google Fonts: ${display} / ${body}.`);
  const html = buildGoogleFontsPreviewHtml(display, body);
  return sock.sendMessage(remoteJid, { document: Buffer.from(html), mimetype: 'text/html', fileName: 'fontpair-google-preview.html', caption: `🌐 *LIVE GOOGLE FONTS PREVIEW*\nDisplay: ${display}\nBody: ${body}\n\nUnduh lalu buka file HTML di browser dengan koneksi internet untuk melihat kedua font asli.` }, msg ? { quoted: msg } : {});
}
export async function handleDesignBriefCommands(ctx) {
  const { makeWASocket, DisconnectReason, useMultiFileAuthState, jidNormalizedUser, fetchLatestBaileysVersion, downloadMediaMessage, Boom, qrcode, fs, path, execFile, promisify, sharp, webpmux, mongoose, GAME_LOCATIONS, GAME_MONSTERS, GAME_CLASSES, createInitialGameState, normalizeGameState, handleGameCommand, PREFIX, MONGO_URI, AUTH_DIR, TEMP_DIR, WELCOME_IMAGE, BACKUP_DIR, BACKUP_INTERVAL_HOURS, execFileAsync, MAX_IMAGE_BYTES, OWNER_JIDS_RAW, DEFAULT_GROUP_RULES, processedMessageIds, senderQueues, MESSAGE_DEDUPE_TTL_MS, MESSAGE_DEDUPE_MAX, rememberMessageId, serializeBySender, PartySchema, GuildSchema, AssetSchema, UserSchema, GroupSchema, FavoriteSchema, AssetAccessSchema, ReportSchema, TicketSchema, ModerationLogSchema, WarningSchema, Party, Guild, GuildWarSchema, GuildWar, MarketListingSchema, MarketListing, WorldBossSchema, WorldBoss, TerritorySchema, Territory, Asset, User, Group, Favorite, AssetAccess, Report, Ticket, Warning, ModerationLog, spamTracker, SPAM_WINDOW_MS, SPAM_MAX_MESSAGES, LINK_REGEX, logModeration, processGroupModeration, normalizeJid, ownerJidSet, ownerIdentityCandidates, isBotOwner, isGroupJid, unwrapMessage, getMessageText, getQuotedMessage, getImageTarget, downloadMedia, isGroupAdmin, isBotAdmin, sendText, requireDatabase, connectDatabase, addStickerPackMetadata, createDatabaseBackup, startBot, getDbReady, getReconnecting, sock, msg, remoteJid, isGroup, messageText, parts, command, args, sender, userJid, senderIdentityAliases, reply } = ctx;
  switch (command) {
          case 'fontpair': {
            // Kurasi deterministik; tag memudahkan pencarian berdasarkan gaya dan kebutuhan proyek.
            const pairs = [
              { fonts: 'Playfair Display + Montserrat', note: 'Elegan dan editorial untuk branding premium, fashion, dan beauty.', tags: ['elegan', 'editorial', 'premium', 'brand', 'fashion', 'beauty', 'luxury'] },
              { fonts: 'DM Serif Display + DM Sans', note: 'Kontras modern untuk editorial, kampanye, dan poster.', tags: ['modern', 'editorial', 'poster', 'kontras', 'magazine'] },
              { fonts: 'Bebas Neue + Inter', note: 'Judul tegas dan isi yang bersih untuk poster, event, dan GFX.', tags: ['tegas', 'poster', 'gfx', 'sport', 'bold', 'event'] },
              { fonts: 'Poppins + Lora', note: 'Ramah dan hangat untuk edukasi, komunitas, dan konten sosial.', tags: ['ramah', 'edukasi', 'friendly', 'sosial', 'community'] },
              { fonts: 'Space Grotesk + Manrope', note: 'Teknologi dan futuristik untuk UI, web, serta desain digital dan produk digital.', tags: ['teknologi', 'tech', 'futuristik', 'digital', 'ui', 'web', 'startup'] },
              { fonts: 'Cormorant Garamond + Raleway', note: 'Fashion, floral, wedding, dan identitas visual mewah.', tags: ['fashion', 'floral', 'mewah', 'elegan', 'luxury', 'wedding'] },
              { fonts: 'Oswald + Source Sans 3', note: 'Padat dan jelas untuk informasi, olahraga, dan headline.', tags: ['padat', 'informasi', 'judul', 'sport', 'poster'] },
              { fonts: 'Nunito Sans + Merriweather', note: 'Nyaman dibaca untuk artikel, blog, dan materi edukasi.', tags: ['nyaman', 'artikel', 'informasi', 'edukasi', 'readable', 'blog'] },
              { fonts: 'League Spartan + Work Sans', note: 'Geometris dan kuat untuk branding modern serta poster.', tags: ['geometris', 'branding', 'modern', 'poster', 'bold'] },
              { fonts: 'Space Grotesk + IBM Plex Mono', note: 'Nuansa teknis untuk teknologi, coding, dan data visual.', tags: ['tech', 'coding', 'data', 'futuristik', 'monospace'] },
              { fonts: 'Archivo Black + Archivo', note: 'Satu keluarga yang solid untuk kampanye dan tipografi tebal.', tags: ['bold', 'campaign', 'poster', 'minimalis', 'sans'] },
              { fonts: 'Fraunces + Manrope', note: 'Ekspresif tetapi tetap modern untuk lifestyle dan brand kreatif.', tags: ['expressive', 'lifestyle', 'creative', 'modern', 'brand'] },
              { fonts: 'DM Serif Display + Plus Jakarta Sans', note: 'Editorial kontemporer untuk brand lokal dan publikasi.', tags: ['editorial', 'brand lokal', 'premium', 'publikasi'] },
              { fonts: 'Bodoni Moda + Lato', note: 'Kontras klasik untuk fashion, parfum, dan produk premium.', tags: ['fashion', 'parfum', 'luxury', 'classic', 'elegan'] },
              { fonts: 'Cinzel + Montserrat', note: 'Formal dan berwibawa untuk event, institusi, dan tema klasik.', tags: ['formal', 'classic', 'event', 'serif', 'elegan'] },
              { fonts: 'Abril Fatface + Poppins', note: 'Display dekoratif untuk poster, editorial, dan promosi.', tags: ['display', 'dekoratif', 'poster', 'editorial', 'promosi'] },
              { fonts: 'Anton + Roboto', note: 'Headline berdampak tinggi untuk olahraga dan promo.', tags: ['sport', 'promo', 'poster', 'impact', 'bold'] },
              { fonts: 'Barlow Condensed + Barlow', note: 'Kompak dan konsisten untuk scoreboard, otomotif, dan event.', tags: ['sport', 'otomotif', 'event', 'condensed', 'poster'] },
              { fonts: 'Outfit + DM Sans', note: 'Minimal dan bersih untuk aplikasi, dashboard, serta startup.', tags: ['minimalis', 'ui', 'app', 'dashboard', 'startup'] },
              { fonts: 'Sora + Inter', note: 'Geometris futuristik untuk SaaS, teknologi, dan produk digital.', tags: ['futuristik', 'tech', 'saas', 'digital', 'ui'] },
              { fonts: 'Urbanist + Lora', note: 'Seimbang antara modern dan humanis untuk lifestyle.', tags: ['humanis', 'lifestyle', 'modern', 'sosial'] },
              { fonts: 'Josefin Sans + Crimson Text', note: 'Vintage elegan untuk kafe, hospitality, dan editorial.', tags: ['vintage', 'retro', 'cafe', 'hospitality', 'editorial'] },
              { fonts: 'Righteous + Nunito Sans', note: 'Playful untuk produk kreatif, komunitas, dan konten anak muda.', tags: ['playful', 'fun', 'youth', 'komunitas', 'friendly'] },
              { fonts: 'Lilita One + Quicksand', note: 'Ceria dan rounded untuk edukasi anak serta kemasan fun.', tags: ['anak', 'ceria', 'fun', 'kemasan', 'edukasi'] },
              { fonts: 'Comfortaa + Open Sans', note: 'Lembut dan mudah dibaca untuk wellness dan layanan ramah.', tags: ['wellness', 'soft', 'friendly', 'minimalis'] },
              { fonts: 'Libre Baskerville + Source Sans 3', note: 'Serius dan terpercaya untuk artikel, laporan, dan publikasi.', tags: ['serius', 'publikasi', 'artikel', 'laporan', 'formal'] },
              { fonts: 'Merriweather + Lato', note: 'Humanis dan stabil untuk blog, majalah, serta konten panjang.', tags: ['blog', 'majalah', 'readable', 'artikel', 'edukasi'] },
              { fonts: 'Playfair Display + Lato', note: 'Klasik dan fleksibel untuk undangan serta identitas brand.', tags: ['undangan', 'wedding', 'classic', 'elegan', 'brand'] },
              { fonts: 'Prata + Montserrat', note: 'Mewah dan minimal untuk kosmetik, parfum, dan fashion.', tags: ['luxury', 'beauty', 'kosmetik', 'fashion', 'premium'] },
              { fonts: 'Bungee + Rubik', note: 'Enerjik untuk gaming, esports, dan event komunitas.', tags: ['gaming', 'esports', 'enerjik', 'event', 'poster'] },
              { fonts: 'Teko + Rajdhani', note: 'Industrial dan futuristik untuk gaming serta otomotif.', tags: ['gaming', 'otomotif', 'industrial', 'futuristik', 'sci-fi'] },
              { fonts: 'Kanit + Sarabun', note: 'Kuat dan fungsional untuk materi bilingual dan informasi.', tags: ['bilingual', 'informasi', 'sport', 'modern', 'sans'] },
              { fonts: 'Plus Jakarta Sans + Noto Sans', note: 'Netral dan mendukung cakupan karakter luas untuk produk digital.', tags: ['multibahasa', 'bahasa', 'ui', 'digital', 'aksesibel'] },
            ];
            const sub = String(args[0] || '').toLowerCase();
            const queryText = args.slice(1).join(' ').trim();
            if (['ai', 'assistant', 'asisten', 'brief'].includes(sub)) {
              const target = typeof getImageTarget === 'function' ? getImageTarget(msg) : null;
              let imageInfo = null;
              let imageBuffer = null;
              if (target && typeof downloadMedia === 'function' && typeof sharp === 'function') {
                try {
                  imageBuffer = await downloadMedia(sock, target);
                  imageInfo = await inspectDesignReference(imageBuffer, sharp);
                } catch (error) {
                  return reply(`Gambar referensi belum dapat dianalisis: ${error.message || 'media tidak tersedia'}. Kamu tetap bisa mencoba dengan brief teks: ${PREFIX}fontpair ai <kebutuhan desain>.`);
                }
              }
              if (!queryText && !imageInfo) return reply(`🧠 *FONTPAIR DESIGN ASSISTANT*\nJelaskan brand, audiens, mood, dan media desain. Kamu juga bisa menyertakan atau membalas gambar referensi.\n\nContoh: ${PREFIX}fontpair ai brand skincare premium untuk perempuan usia 20–35, minimalis dan elegan\nAtau: balas/kirim gambar dengan caption ${PREFIX}fontpair ai poster festival musik futuristik\n\nAssistant memberi saran tipografi, palet warna, dan art direction berbasis kurasi lokal. Analisis gambar membaca metadata/statistik warna, bukan OCR atau pemahaman visual AI.`);
              const vision = await analyzeDesignWithVision({ brief: queryText, imageBuffer, sharp });
              if (vision.ok) return reply(vision.text);
              const fallback = buildFontPairAssistantResult(pairs, queryText, imageInfo);
              const reason = vision.reason === 'not_configured'
                ? 'AI Vision belum dikonfigurasi. Hasil berikut memakai rekomendasi lokal.'
                : vision.reason === 'image_too_large'
                  ? 'Gambar melebihi batas 8 MB untuk analisis AI. Hasil berikut memakai rekomendasi lokal.'
                  : 'Layanan AI Vision belum merespons. Hasil berikut memakai rekomendasi lokal.';
              return reply(`${fallback}\n\nℹ️ ${reason}`);
            }
            if (['mood', 'moodboard', 'brand', 'recommend', 'rekomendasi'].includes(sub)) {
              if (!queryText) return reply(`🎨 *MOODBOARD & BRAND FONT MATCHER*\nMasukkan kata kunci mood, karakter brand, audiens, atau bidang desain.\nContoh: ${PREFIX}fontpair mood premium minimalis skincare\n${PREFIX}fontpair recommend poster gaming energik`);
              const ranked = rankFontPairs(pairs, queryText, 6);
              if (!ranked.length) return reply(`Belum ada pasangan yang cocok untuk “${queryText}”. Coba kata kunci: luxury, playful, futuristic, editorial, vintage, bold, warm, minimal.`);
              return reply(`🎨 *HASIL KURASI BRAND & MOODBOARD*\nBrief: ${queryText}\n\n${ranked.map((item, i) => `${i + 1}. *${item.pair.fonts}*\n   ${item.pair.note}\n   Kecocokan kata kunci: ${item.score}`).join('\n\n')}\n\nPreview: ${PREFIX}fontpair preview <nomor> · Simpan: ${PREFIX}fontpair save <nomor>`);
            }
            if (['search', 'cari'].includes(sub)) {
              if (!queryText) return reply(`Contoh: ${PREFIX}fontpair search Inter`);
              const found = pairs.map((pair, index) => ({ pair, index: index + 1 })).filter(item => `${item.pair.fonts} ${item.pair.note} ${item.pair.tags.join(' ')}`.toLowerCase().includes(queryText.toLowerCase()));
              const googleUrl = `https://fonts.google.com/?query=${encodeURIComponent(queryText)}`;
              return reply(`🔎 *PENCARIAN FONT: ${queryText}*\n${found.length ? found.map(item => `${item.index}. *${item.pair.fonts}*\n   ${item.pair.note}`).join('\n\n') : 'Tidak ditemukan di kurasi pasangan lokal.'}\n\nCari keluarga font di Google Fonts: ${googleUrl}\nPeriksa kecocokan nama dan lisensi sebelum digunakan.`);
            }
            if (['google', 'googlepair', 'live'].includes(sub)) {
              const names = queryText.split('|').map(safeFontFamily).filter(Boolean);
              if (!queryText || names.length > 2) return reply(`🌐 *LIVE GOOGLE FONTS PREVIEW*\nFormat: ${PREFIX}fontpair google <font judul> | <font isi>\nContoh: ${PREFIX}fontpair google Playfair Display | Inter`);
              return sendGoogleFontsPreview({ displayFont: names[0], bodyFont: names[1] || 'Inter', sock, remoteJid, msg, reply });
            }
            if (['save', 'simpan'].includes(sub)) {
              const number = Number(args[1]);
              const pair = Number.isInteger(number) && number > 0 ? pairs[number - 1] : null;
              if (!pair) return reply(`Nomor pasangan tidak valid. Lihat ${PREFIX}fontpair semua lalu gunakan ${PREFIX}fontpair save <nomor>.`);
              if (!mongoose || typeof mongoose.model !== 'function' || !getDbReady?.()) return reply('Penyimpanan favorit memerlukan koneksi MongoDB yang aktif.');
              const FontPairFavorite = getFontPairFavoriteModel(mongoose);
              const jid = userJid || sender;
              try { await FontPairFavorite.updateOne({ jid, pairKey: pair.fonts.toLowerCase() }, { $setOnInsert: { jid, pairKey: pair.fonts.toLowerCase(), fonts: pair.fonts, note: pair.note, catalogIndex: number } }, { upsert: true }); }
              catch (error) { if (error?.code !== 11000) throw error; }
              return reply(`⭐ Pasangan *${pair.fonts}* disimpan ke favoritmu.\nLihat: ${PREFIX}fontpair favorites`);
            }
            if (['favorites', 'favorit'].includes(sub)) {
              if (!mongoose || typeof mongoose.model !== 'function' || !getDbReady?.()) return reply('Daftar favorit memerlukan koneksi MongoDB yang aktif.');
              const FontPairFavorite = getFontPairFavoriteModel(mongoose);
              const saved = await FontPairFavorite.find({ jid: userJid || sender }).sort({ createdAt: -1 }).limit(30).lean();
              return reply(saved.length ? `⭐ *FAVORIT FONTPAIR KAMU*\n\n${saved.map((item, i) => `${i + 1}. *${item.fonts}*\n   ${item.note}`).join('\n\n')}\n\nHapus: ${PREFIX}fontpair unsave <nomor>` : `Belum ada pasangan tersimpan. Gunakan ${PREFIX}fontpair save <nomor>.`);
            }
            if (['unsave', 'hapusfavorit'].includes(sub)) {
              const number = Number(args[1]);
              if (!mongoose || typeof mongoose.model !== 'function' || !getDbReady?.()) return reply('Pengelolaan favorit memerlukan koneksi MongoDB yang aktif.');
              const FontPairFavorite = getFontPairFavoriteModel(mongoose);
              const jid = userJid || sender;
              const saved = await FontPairFavorite.find({ jid }).sort({ createdAt: -1 }).limit(30).lean();
              if (!Number.isInteger(number) || number < 1 || number > saved.length) return reply(`Nomor favorit tidak valid. Lihat ${PREFIX}fontpair favorites.`);
              await FontPairFavorite.deleteOne({ _id: saved[number - 1]._id, jid });
              return reply(`🗑️ Favorit *${saved[number - 1].fonts}* dihapus.`);
            }
            if (sub === 'preview' || sub === 'google' || sub === 'googlepair' || sub === 'live') {
              // handled above for Google Fonts; legacy image preview remains below
            }
            if (String(args[0] || '').toLowerCase() === 'preview') {
              const previewQuery = args.slice(1).join(' ').trim().toLowerCase();
              const matchIndex = /^\d+$/.test(previewQuery) ? Number(previewQuery) - 1 : -1;
              const matched = matchIndex >= 0
                ? (matchIndex < pairs.length ? [{ pair: pairs[matchIndex], index: matchIndex + 1 }] : [])
                : pairs.map((pair, index) => ({ pair, index: index + 1 })).filter(item => !previewQuery || `${item.pair.fonts} ${item.pair.note} ${item.pair.tags.join(' ')}`.toLowerCase().includes(previewQuery));
              if (!matched.length) return reply(`⚠️ Pasangan font tidak ditemukan. Gunakan ${PREFIX}fontpair preview <kategori|nomor>.\nContoh: ${PREFIX}fontpair preview gaming atau ${PREFIX}fontpair preview 30.\nNomor mengikuti urutan ${PREFIX}fontpair semua.`);
              return sendFontPairPreview({ pair: matched[0].pair, index: matched[0].index, sharp, sock, remoteJid, msg, reply });
            }
            const rawQuery = args.join(' ').trim().toLowerCase();
            const allMatch = rawQuery.match(/^(?:semua|all)(?:\s+(\d+))?$/);
            const page = allMatch ? Number(allMatch[1] || 1) : 1;
            const query = allMatch ? '' : rawQuery;
            const selected = query
              ? pairs.filter(pair => `${pair.fonts} ${pair.note} ${pair.tags.join(' ')}`.toLowerCase().includes(query))
              : allMatch ? pairs : pairs.slice(0, 8);
            if (query && !selected.length) {
              return reply(`🔤 *FONT PAIRING STUDIO*\nBelum ada pasangan yang cocok dengan “${query}”.\n\nKategori: elegan, editorial, futuristik, poster, gaming, edukasi, fashion, wedding, minimalis, UI, tech, vintage, sport.\nContoh: ${PREFIX}fontpair futuristik\nLihat semua rekomendasi: ${PREFIX}fontpair semua`);
            }
            const pageSize = 12;
            const pageCount = Math.max(1, Math.ceil(selected.length / pageSize));
            if (page > pageCount) return reply(`Halaman ${page} tidak tersedia. Total halaman: ${pageCount}.\nContoh: ${PREFIX}fontpair semua ${pageCount}`);
            const pageItems = selected.slice((page - 1) * pageSize, page * pageSize);
            return reply('🔤 *REKOMENDASI PASANGAN FONT*\n' +
              `Menampilkan ${pageItems.length} dari ${selected.length} pasangan yang cocok${allMatch ? ` · Halaman ${page}/${pageCount}` : ''}.\n\n` +
              pageItems.map((pair, i) => `${(page - 1) * pageSize + i + 1}. *${pair.fonts}*\n   ${pair.note}`).join('\n\n') +
              `\n\nGunakan display untuk judul dan font yang lebih tenang untuk isi. Uji keterbacaan, dukungan karakter (termasuk aksen/bahasa), ketersediaan bobot, dan lisensi font sebelum proyek komersial.\nPreview PNG: ${PREFIX}fontpair preview <gaya|nomor> · Live Google Fonts: ${PREFIX}fontpair google <font judul> | <font isi> · Moodboard: ${PREFIX}fontpair mood <brief> · Cari: ${PREFIX}fontpair search <nama> · Favorit: ${PREFIX}fontpair save <nomor> / favorites${allMatch && page < pageCount ? ` · Berikutnya: ${PREFIX}fontpair semua ${page + 1}` : ''}`);
          }
          case 'brief': {
            const topic = args.join(' ').trim();
            if (!topic) return reply(`Contoh: ${PREFIX}brief poster lomba desain`);
            return reply(`📝 *Template Brief Desain*\n\nTopik: ${topic}\nTujuan desain: [isi tujuan]\nTarget audiens: [usia/minat/audiens]\nPlatform dan ukuran: [IG 1080×1350 / lainnya]\nPesan utama: [pesan yang harus disampaikan]\nTeks wajib: [judul, tanggal, CTA, dll.]\nGaya visual: [minimalis/elegan/futuristik/dll.]\nWarna: [warna utama dan aksen]\nAset yang tersedia: [logo/foto/ilustrasi]\nReferensi: [tautan/contoh]\nBatasan: [hal yang harus dihindari]\nOutput: [PNG/JPG/PDF]`);
          }
          case 'layout': {
            const kind = args.join(' ').toLowerCase();
            const layouts = [
              ['poster','Judul besar di atas, visual utama di tengah, detail pendukung di bawah, CTA di bagian paling bawah.'],
              ['carousel','Slide 1 sebagai hook, slide tengah satu ide per slide, slide akhir rangkuman dan CTA.'],
              ['gfx','Karakter sebagai focal point, judul kontras, panel informasi sekunder, elemen dekoratif menjaga arah pandang.'],
              ['logo','Utamakan simbol dan wordmark, sisakan ruang kosong, uji versi kecil dan monokrom.'],
              ['banner','Pesan utama di area paling terlihat, informasi sekunder dekatnya, CTA jelas dan tidak mepet tepi.'],
              ['default','Gunakan hierarki 3 tingkat: judul, informasi utama, detail. Buat satu focal point, gunakan grid dan margin konsisten.']
            ];
            const found = layouts.find(x => kind && x[0] !== 'default' && kind.includes(x[0]));
            return reply(`📐 *Rekomendasi Layout*\nJenis: ${kind || 'umum'}\n${(found || layouts[5])[1]}\n\nTips: jaga kontras, alignment, jarak antar elemen, dan keterbacaan.`);
          }

    default: return;
  }
}
