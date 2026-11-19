import { getSubscription, grantSubscription, listSubscriptions, revokeSubscription } from '../subscription-store.js';
import { startDesignBriefWizard, resumeDesignBriefWizard, cancelDesignBriefWizard, getDesignBriefWizardStatus, goBackDesignBriefWizard } from './design-brief-wizard.js';
import { handleTypographyCommand } from '../design-studio/typography-studio.js';
import { handleQaReviewCommand } from '../design-studio/qa-review.js';
import { buildBrandKit, formatBrandKit } from '../design-studio/brand-kit.js';
import { buildMoodboard } from './designer-workflow.js';
import {
  DESIGN_WORKFLOW_STAGES,
  createDesignWorkflowState,
  getDesignWorkflowProgress,
  completeDesignWorkflowStage,
  reopenDesignWorkflowStage,
  formatDesignWorkflowProgress,
  formatDesignWorkflowStep,
  buildDesignWorkflowSummary,
} from '../design-studio/workflow-engine.js';

export const DESIGNER_ASSISTANT_COMMANDS = new Set(['akses', 'sub', 'colorpalette', 'palettekit', 'paletteview', 'colorconvert', 'contrast', 'checklist', 'revision', 'brandkit', 'pricing', 'wizard', 'briefwizard', 'briefbuilder', 'moodboard', 'uxaudit', 'designsystem', 'uxflow', 'designflow', 'designproject', 'typescale', 'designqa', 'handoff', 'typography', 'qareview']);
const PREMIUM_COMMANDS = new Set(['brandkit', 'pricing']);
const PALETTES = {
  minimalis: ['#F5F5F0', '#222222', '#8C9A8B', '#D8CFC4', '#A7B5A0', '#E9E5DC'],
  futuristik: ['#0B1020', '#00D9FF', '#8A5CFF', '#F4F7FF', '#263653', '#FF4FD8'],
  elegan: ['#171717', '#D4AF37', '#F5F0E8', '#6E6259', '#B8A88A', '#3A302B'],
  alam: ['#244D3A', '#8BA888', '#E7E2C8', '#C87941', '#547A5B', '#F4F0DF'],
  retro: ['#F4D35E', '#EE964B', '#F95738', '#0D3B66', '#FAF0CA', '#7A9E7E'],
  pastel: ['#F7D6E0', '#CDE7F0', '#D8D5F2', '#FFF1C1', '#B8D8BA', '#F3B7A6'],
  ocean: ['#062C43', '#054569', '#5591A9', '#9CCDDC', '#CED7E0', '#F7F9F9'],
  sunset: ['#3D2645', '#7C3F58', '#C45D54', '#F08A5D', '#F6C08B', '#F9E4C8'],
  earthy: ['#3B3028', '#765C48', '#A98467', '#CDB99A', '#E6DCCB', '#66735B'],
  candy: ['#FF5D8F', '#FFB3C6', '#FFC6FF', '#B8C0FF', '#9BF6FF', '#FDFFB6'],
  monokrom: ['#111111', '#333333', '#666666', '#999999', '#CCCCCC', '#F5F5F5'],
  botanical: ['#283618', '#606C38', '#A3B18A', '#DDA15E', '#BC6C25', '#FEFAE0'],
  lavender: ['#2E294E', '#541388', '#8F5DB7', '#D8B4E2', '#F1E3F3', '#F7F0FA'],
  coffee: ['#2B1D16', '#5C4033', '#8B5E3C', '#C4A484', '#E6D5C3', '#F7EFE5'],
  sakura: ['#6D2932', '#A34A5A', '#D88C9A', '#EFC3CA', '#F7E4E4', '#FFF8F0'],
};
const isOwner = ctx => typeof ctx.isBotOwner === 'function' && ctx.isBotOwner(ctx.userJid, ctx.senderIdentityAliases || []);
const getIdentities = ctx => [ctx.phoneJid, ctx.userJid, ctx.sender, ...(ctx.senderIdentityAliases || [])].filter(Boolean);
const targetJid = raw => {
  const digits = String(raw || '').replace(/^\+/, '');
  return /^\d{5,20}$/.test(digits) ? `${digits}@s.whatsapp.net` : '';
};

async function showAccess(ctx) {
  const owner = isOwner(ctx);
  const admin = Boolean(ctx.isGroup && await ctx.isGroupAdmin(ctx.sock, ctx.remoteJid, ctx.sender));
  const subscription = await getSubscription(getIdentities(ctx));
  const role = owner ? 'Owner bot' : admin ? 'Admin grup' : subscription ? 'Pelanggan berlangganan' : 'Anggota';
  const premium = owner || Boolean(subscription);
  const prefix = ctx.PREFIX || '.';
  const nextStep = owner
    ? `\nOwner dapat mengelola pelanggan dengan ${prefix}sub grant/revoke/list.`
    : subscription
      ? `\nFitur premium: ${prefix}brandkit <nama brand> dan ${prefix}pricing <jam> <tarif> [biaya].`
      : `\nIngin berlangganan? Ketik ${prefix}menu premium untuk melihat manfaat dan cara menghubungi Owner bot.`;
  return ctx.reply(`🔐 *STATUS AKSES BOT*\nPeran: *${role}*\nFitur langganan: ${premium ? 'Aktif' : 'Belum aktif'}${subscription ? `\nBerakhir: ${new Date(subscription.expiresAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB` : ''}\n\nAnggota: tools desain dasar dan bantuan.\nAdmin grup: pengaturan/moderasi grup sesuai perintah.\nOwner bot: pengelolaan bot dan langganan.\nPelanggan: fitur premium yang ditandai khusus.${nextStep}`);
}

async function handleSubscriptionCommand(ctx) {
  const { args = [], reply } = ctx;
  const prefix = ctx.PREFIX || '.';
  if (!isOwner(ctx)) return reply(`⛔ Perintah ${prefix}sub hanya untuk Owner bot. Admin grup tidak otomatis menjadi Owner.`);
  const action = String(args[0] || 'help').toLowerCase();
  if (action === 'grant') {
    const jid = targetJid(args[1]);
    const days = Number(args[2]);
    if (!jid || !Number.isInteger(days)) return reply(`Format: ${prefix}sub grant <nomorWhatsApp> <hari>\nContoh: ${prefix}sub grant 628123456789 30`);
    try {
      const record = await grantSubscription(jid, days, ctx.userJid);
      return reply(`✅ Langganan aktif untuk ${jid}\nBerakhir: ${new Date(record.expiresAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB`);
    } catch (error) { return reply(`❌ ${error.message}`); }
  }
  if (action === 'revoke') {
    const jid = targetJid(args[1]);
    if (!jid) return reply(`Format: ${prefix}sub revoke <nomorWhatsApp>`);
    const result = await revokeSubscription(jid);
    return reply(result.existed ? `✅ Langganan ${jid} dicabut.` : `ℹ️ Tidak ada data langganan untuk ${jid}.`);
  }
  if (action === 'status') {
    const records = await listSubscriptions();
    const active = records.filter(record => record.active).length;
    return reply(`📊 *STATUS LANGGANAN BOT*\nTotal data: ${records.length}\nAktif: ${active}\nKedaluwarsa: ${records.length - active}`);
  }
  if (action === 'list') {
    const records = await listSubscriptions();
    if (!records.length) return reply('Belum ada data langganan.');
    return reply('📋 *DAFTAR LANGGANAN*\n\n' + records.slice(0, 40).map((record, i) => `${i + 1}. ${record.jid}\n   ${record.active ? 'Aktif' : 'Kedaluwarsa'} — ${record.expiresAt || 'tanpa tanggal'}`).join('\n') + (records.length > 40 ? `\n\nMenampilkan 40 dari ${records.length} data.` : ''));
  }
  return reply(`👑 *PENGELOLA LANGGANAN*\n${prefix}sub grant <nomorWhatsApp> <hari>\n${prefix}sub revoke <nomorWhatsApp>\n${prefix}sub list\n${prefix}sub status`);
}

function hslToHex(hue, saturation, lightness) {
  const h = ((hue % 360) + 360) % 360 / 360;
  const s = Math.min(100, Math.max(0, saturation)) / 100;
  const l = Math.min(100, Math.max(0, lightness)) / 100;
  const hueToRgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const rgb = s === 0 ? [l, l, l] : (() => {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    return [hueToRgb(p, q, h + 1 / 3), hueToRgb(p, q, h), hueToRgb(p, q, h - 1 / 3)];
  })();
  return `#${rgb.map(value => Math.round(value * 255).toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}

function escapeSvg(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char]);
}

async function buildPalettePreviewPng(title, colors) {
  const width = 1200;
  const swatchWidth = width / colors.length;
  const blocks = colors.map((hex, index) => {
    const x = Math.round(index * swatchWidth);
    const labelColor = ['#111111', '#222222', '#333333', '#F5F5F5', '#FFFFFF'].includes(hex.toUpperCase()) ? '#FFFFFF' : '#17202A';
    return `<rect x="${x}" y="150" width="${Math.ceil(swatchWidth)}" height="390" fill="${hex}"/><text x="${x + swatchWidth / 2}" y="570" text-anchor="middle" font-family="Arial,sans-serif" font-size="25" font-weight="700" fill="#202124">${hex}</text><text x="${x + swatchWidth / 2}" y="615" text-anchor="middle" font-family="Arial,sans-serif" font-size="17" fill="#5F6368">Warna ${index + 1}</text>`;
  }).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="700" viewBox="0 0 ${width} 700"><rect width="100%" height="100%" fill="#FFFFFF"/><text x="60" y="75" font-family="Arial,sans-serif" font-size="38" font-weight="700" fill="#202124">${escapeSvg(title.toUpperCase())}</text><text x="60" y="112" font-family="Arial,sans-serif" font-size="20" fill="#5F6368">COLOR PALETTE STUDIO · PILIH, SALIN, DAN KREASIKAN</text>${blocks}<text x="60" y="675" font-family="Arial,sans-serif" font-size="16" fill="#777777">Preview warna digital · tampilan dapat berbeda antar layar</text></svg>`;
  const { default: sharp } = await import('sharp');
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function paletteReply(ctx) {
  const raw = String(ctx.args.join(' ') || '').trim();
  const query = raw.toLowerCase();
  const prefix = ctx.PREFIX || '.';
  if (!query || query === 'list') return ctx.reply(`🎨 *COLOR HUNT-STYLE PALETTE STUDIO*\nPilih koleksi palet kurasi:\n${Object.keys(PALETTES).map(key => `• ${key}`).join('\n')}\n\nPerintah:\n• ${prefix}colorpalette <nama> — tampilkan palet + contoh warna\n• ${prefix}colorpalette random — palet acak\n• ${prefix}colorpalette search <kata> — cari nama palet\n• ${prefix}colorpalette #HEX [complementary|analogous|triadic|monochromatic] — buat harmoni warna\nContoh: ${prefix}colorpalette ocean`);

  let key = Object.keys(PALETTES).find(name => name === query);
  if (query === 'random' || query === 'acak') key = Object.keys(PALETTES)[Math.floor(Math.random() * Object.keys(PALETTES).length)];
  if (query.startsWith('search ')) {
    const term = query.slice(7).trim();
    const matches = Object.keys(PALETTES).filter(name => name.includes(term));
    if (!matches.length) return ctx.reply(`Tidak ada palet dengan kata “${term}”. Ketik ${prefix}colorpalette list untuk melihat koleksi.`);
    return ctx.reply(`🔎 *HASIL PENCARIAN PALET*\n${matches.map(name => `• ${name} — ${PALETTES[name].join(' ')}`).join('\n')}`);
  }
  let colors;
  let title;
  let primaryColor;
  if (key) {
    colors = PALETTES[key];
    primaryColor = colors[0];
    title = key;
  } else {
    const [colorInput, harmonyInput = 'complementary'] = raw.split(/\s+/);
    const converted = convertColorInput(colorInput);
    const harmony = harmonyInput.toLowerCase();
    const harmonies = { complementary: [0, 180], analogous: [-30, 0, 30], triadic: [0, 120, 240], monochromatic: null };
    if (!converted || !Object.hasOwn(harmonies, harmony)) return ctx.reply(`Palet tidak dikenali. Gunakan ${prefix}colorpalette list atau ${prefix}colorpalette <HEX> [complementary|analogous|triadic|monochromatic].`);
    primaryColor = converted.hex;
    const [, hue, saturation, lightness] = converted.hsl.match(/hsl\((\d+), (\d+)%, (\d+)%\)/);
    if (harmony === 'monochromatic') colors = [25, 40, 55, 70, 85].map(level => hslToHex(Number(hue), Number(saturation), level));
    else {
      colors = harmonies[harmony].map(offset => offset === 0 ? converted.hex : hslToHex(Number(hue) + offset, Number(saturation), Number(lightness)));
      if (colors.length < 4) colors.push(hslToHex(Number(hue), Math.max(15, Number(saturation) - 35), Math.min(92, Number(lightness) + 28)));
      while (colors.length < 6) colors.push(hslToHex(Number(hue), Math.max(10, Number(saturation) - colors.length * 8), Math.min(94, Number(lightness) + colors.length * 7)));
    }
    title = `custom ${harmony}`;
  }

  const heading = title.startsWith('custom ') ? `COLOR STUDIO — ${title.slice(7).toUpperCase()}` : `COLOR PALETTE — ${title.toUpperCase()}`;
  const detail = `🎨 *${heading}*\nWarna utama: ${primaryColor}\n${colors.map((hex, index) => `${index + 1}. ${hex}`).join('\n')}\n\n*Contoh penerapan*\n• Warna utama: ${colors[0]}\n• Pendukung: ${colors[1]} dan ${colors[2]}\n• Aksen: ${colors[3] || colors[0]}\n• Latar/ruang kosong: ${colors[colors.length - 1]}\n\nSalin kode HEX ke Canva, Figma, Photoshop, atau aplikasi desainmu. Cek keterbacaan dengan ${prefix}contrast <HEX teks> <HEX latar>.`;
  if (ctx.sock?.sendMessage && ctx.remoteJid) {
    try {
      const image = await buildPalettePreviewPng(title, colors);
      await ctx.sock.sendMessage(ctx.remoteJid, { image, mimetype: 'image/png', caption: detail }, ctx.msg ? { quoted: ctx.msg } : {});
      return;
    } catch (error) {
      console.error('[colorpalette] Preview image failed:', error?.message || error);
    }
  }
  return ctx.reply(`${detail}\n\n_Contoh visual berupa gambar swatch akan dikirim jika koneksi media bot tersedia._`);
}


const PALETTE_VIEW_TEMPLATES = ['landing', 'product', 'poster', 'dashboard'];

function paletteViewSvg(title, colors, template) {
  const esc = value => escapeSvg(value);
  const [primary, secondary, tertiary, accent, muted, surface] = colors;
  const text = contrastRatioHex('#111111', surface) >= contrastRatioHex('#FFFFFF', surface) ? '#111111' : '#FFFFFF';
  const darkText = '#17202A';
  const chip = (x, y, w, h, color, radius = 12) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}" fill="${color}"/>`;
  let body = '';
  if (template === 'landing') {
    body = `${chip(0,0,1200,92,primary,0)}
      <text x="70" y="58" font-family="Arial" font-size="30" font-weight="700" fill="#FFFFFF">STUDIO / BRAND</text>
      <text x="930" y="56" font-family="Arial" font-size="18" fill="#FFFFFF">About　 Work　 Contact</text>
      ${chip(0,92,1200,808,surface,0)}
      <text x="85" y="260" font-family="Arial" font-size="24" fill="${secondary}">DESIGN THAT FEELS RIGHT</text>
      <text x="85" y="340" font-family="Arial" font-size="66" font-weight="700" fill="${primary}">Make your idea</text>
      <text x="85" y="415" font-family="Arial" font-size="66" font-weight="700" fill="${primary}">stand out.</text>
      <text x="85" y="475" font-family="Arial" font-size="23" fill="${text}">A thoughtful visual system for modern brands.</text>
      ${chip(85,530,210,64,accent,18)}
      <text x="190" y="570" text-anchor="middle" font-family="Arial" font-size="20" font-weight="700" fill="${darkText}">Explore work</text>
      ${chip(680,190,390,470,tertiary,28)}
      ${chip(730,240,290,260,muted,18)}
      <circle cx="875" cy="370" r="86" fill="${accent}"/>
      <text x="875" y="555" text-anchor="middle" font-family="Arial" font-size="25" font-weight="700" fill="${primary}">COLOR / FORM / TYPE</text>`;
  } else if (template === 'product') {
    body = `${chip(0,0,1200,900,surface,0)}
      ${chip(70,60,1060,780,'#FFFFFF',26)}
      ${chip(105,95,500,490,muted,20)}
      <circle cx="355" cy="340" r="155" fill="${primary}"/>
      <circle cx="355" cy="340" r="112" fill="${accent}"/>
      <text x="355" y="350" text-anchor="middle" font-family="Arial" font-size="34" font-weight="700" fill="${darkText}">PRODUCT</text>
      <text x="665" y="190" font-family="Arial" font-size="22" fill="${tertiary}">NEW COLLECTION</text>
      <text x="665" y="260" font-family="Arial" font-size="48" font-weight="700" fill="${primary}">Everyday</text>
      <text x="665" y="318" font-family="Arial" font-size="48" font-weight="700" fill="${primary}">Essentials</text>
      <text x="665" y="390" font-family="Arial" font-size="22" fill="${text}">Thoughtfully made for daily rituals.</text>
      <text x="665" y="470" font-family="Arial" font-size="34" font-weight="700" fill="${secondary}">$ 29.00</text>
      ${chip(665,520,280,68,primary,16)}
      <text x="805" y="563" text-anchor="middle" font-family="Arial" font-size="21" font-weight="700" fill="#FFFFFF">Add to cart</text>
      ${chip(665,630,54,54,primary,27)}${chip(735,630,54,54,secondary,27)}${chip(805,630,54,54,accent,27)}${chip(875,630,54,54,tertiary,27)}`;
  } else if (template === 'poster') {
    body = `${chip(0,0,1200,900,primary,0)}
      ${chip(55,55,1090,790,surface,4)}
      <text x="105" y="145" font-family="Arial" font-size="22" font-weight="700" letter-spacing="5" fill="${secondary}">CREATIVE FESTIVAL / 2026</text>
      <text x="100" y="330" font-family="Arial" font-size="112" font-weight="900" fill="${primary}">MAKE</text>
      <text x="100" y="450" font-family="Arial" font-size="112" font-weight="900" fill="${primary}">SOME</text>
      <text x="100" y="570" font-family="Arial" font-size="112" font-weight="900" fill="${primary}">NOISE.</text>
      ${chip(770,200,260,390,accent,130)}
      <circle cx="900" cy="395" r="90" fill="${tertiary}"/>
      <path d="M820 395 L980 395 M900 315 L900 475" stroke="${primary}" stroke-width="18" stroke-linecap="round"/>
      <text x="105" y="700" font-family="Arial" font-size="26" fill="${text}">IDEAS · MUSIC · COMMUNITY</text>
      <text x="105" y="755" font-family="Arial" font-size="22" fill="${text}">SATURDAY / 19:00 / CITY HALL</text>
      ${chip(890,680,150,70,secondary,12)}
      <text x="965" y="725" text-anchor="middle" font-family="Arial" font-size="18" font-weight="700" fill="#FFFFFF">GET TICKETS</text>`;
  } else {
    body = `${chip(0,0,1200,900,'#F3F5F8',0)}
      ${chip(0,0,245,900,primary,0)}
      <text x="45" y="75" font-family="Arial" font-size="27" font-weight="700" fill="#FFFFFF">NORTH / APP</text>
      <text x="45" y="155" font-family="Arial" font-size="19" fill="#FFFFFF">Overview</text>
      <text x="45" y="210" font-family="Arial" font-size="19" fill="${muted}">Analytics</text>
      <text x="45" y="265" font-family="Arial" font-size="19" fill="${muted}">Customers</text>
      <text x="290" y="85" font-family="Arial" font-size="34" font-weight="700" fill="${primary}">Dashboard</text>
      <text x="290" y="125" font-family="Arial" font-size="18" fill="#667085">Good morning, here is your summary.</text>
      ${chip(290,165,245,140,'#FFFFFF',18)}${chip(555,165,245,140,'#FFFFFF',18)}${chip(820,165,300,140,'#FFFFFF',18)}
      <text x="320" y="210" font-family="Arial" font-size="17" fill="#667085">Revenue</text><text x="320" y="265" font-family="Arial" font-size="34" font-weight="700" fill="${primary}">$24,580</text>
      <text x="585" y="210" font-family="Arial" font-size="17" fill="#667085">Orders</text><text x="585" y="265" font-family="Arial" font-size="34" font-weight="700" fill="${secondary}">1,248</text>
      <text x="850" y="210" font-family="Arial" font-size="17" fill="#667085">Conversion</text><text x="850" y="265" font-family="Arial" font-size="34" font-weight="700" fill="${tertiary}">4.8%</text>
      ${chip(290,335,830,455,'#FFFFFF',18)}
      <text x="325" y="390" font-family="Arial" font-size="22" font-weight="700" fill="${primary}">Performance overview</text>
      <path d="M340 700 L450 620 L560 650 L670 525 L780 560 L890 450 L1060 485" fill="none" stroke="${accent}" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M340 700 L450 620 L560 650 L670 525 L780 560 L890 450 L1060 485 L1060 735 L340 735Z" fill="${muted}" opacity=".55"/>`;
  }
  const swatches = colors.map((color, i) => `${chip(70 + i * 178, 805, 150, 42, color, 8)}<text x="${145 + i * 178}" y="875" text-anchor="middle" font-family="Arial" font-size="16" fill="#27313B">${color}</text>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900"><rect width="1200" height="900" fill="#FFFFFF"/>${body}<rect x="0" y="0" width="1200" height="1" fill="transparent"/>${swatches}</svg>`;
}

async function paletteViewReply(ctx) {
  const raw = String(ctx.args.join(' ') || '').trim().toLowerCase();
  const prefix = ctx.PREFIX || '.';
  if (!raw) return ctx.reply(`🖥️ *COLOR PALETTE VISUALIZER*\nTerapkan palet ke contoh desain nyata.\n\nFormat: ${prefix}paletteview <nama palet> [landing|product|poster|dashboard]\nContoh:\n• ${prefix}paletteview ocean landing\n• ${prefix}paletteview coffee product\n• ${prefix}paletteview sunset poster\n• ${prefix}paletteview futuristik dashboard\n\nTemplate: ${PALETTE_VIEW_TEMPLATES.join(', ')}. Jika template tidak diisi, default landing page.`);
  const [name, requestedTemplate = 'landing'] = raw.split(/\s+/);
  const colors = PALETTES[name];
  const template = requestedTemplate === 'website' ? 'landing' : requestedTemplate === 'produk' ? 'product' : requestedTemplate;
  if (!colors) return ctx.reply(`Palet “${name}” tidak ditemukan. Ketik ${prefix}colorpalette list untuk melihat koleksi.`);
  if (!PALETTE_VIEW_TEMPLATES.includes(template)) return ctx.reply(`Template tidak dikenal. Pilih: ${PALETTE_VIEW_TEMPLATES.join(', ')}.`);
  if (!ctx.sock?.sendMessage || !ctx.remoteJid) return ctx.reply(`Preview ${template} untuk palet ${name}: ${colors.join(' · ')}\nKirim perintah ini melalui chat WhatsApp agar bot dapat mengirim gambar preview.`);
  try {
    const svg = paletteViewSvg(name, colors, template);
    const { default: sharp } = await import('sharp');
    const image = await sharp(Buffer.from(svg)).png().toBuffer();
    return ctx.sock.sendMessage(ctx.remoteJid, {
      image, mimetype: 'image/png',
      caption: `🖥️ *COLOR PALETTE VISUALIZER*\nPalet: ${name.toUpperCase()}\nTemplate: ${template.toUpperCase()}\n\n${colors.map((hex, i) => `${i + 1}. ${hex}`).join('\n')}\n\nIni simulasi penerapan warna, bukan desain final. Sesuaikan tipografi, konten, kontras, dan identitas brand sebelum produksi.`
    }, ctx.msg ? { quoted: ctx.msg } : {});
  } catch (error) {
    console.error('[paletteview] Preview failed:', error?.message || error);
    return ctx.reply(`Gagal membuat preview visual. Pastikan dependensi sharp terpasang dengan menjalankan npm ci.\nPalet: ${colors.join(', ')}`);
  }
}

function parseHexColor(value) {
  const raw = String(value || '').trim().replace(/^#/, '');
  if (!/^(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(raw)) return null;
  const hex = raw.length === 3 ? raw.split('').map(char => char + char).join('') : raw;
  return {
    hex: `#${hex.toUpperCase()}`,
    rgb: [0, 2, 4].map(index => parseInt(hex.slice(index, index + 2), 16) / 255),
  };
}

function relativeLuminance(rgb) {
  const linear = rgb.map(channel => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}



function clampByte(value) { return Math.min(255, Math.max(0, Math.round(value))); }

export function convertColorInput(input) {
  const raw = String(input || '').trim();
  let rgb;
  let match;
  if ((match = raw.match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i))) {
    let hex = match[1];
    if (hex.length === 3) hex = hex.split('').map(char => char + char).join('');
    rgb = [0, 2, 4].map(index => parseInt(hex.slice(index, index + 2), 16));
  } else if ((match = raw.match(/^rgb\s*\(?\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*\)?$/i))) {
    rgb = match.slice(1).map(Number);
    if (rgb.some(value => value > 255)) return null;
  } else if ((match = raw.match(/^hsl\s*\(?\s*(-?\d+(?:\.\d+)?)\s*[, ]\s*(\d+(?:\.\d+)?)%\s*[, ]\s*(\d+(?:\.\d+)?)%\s*\)?$/i))) {
    let [h, saturation, lightness] = match.slice(1).map(Number);
    if (saturation < 0 || saturation > 100 || lightness < 0 || lightness > 100) return null;
    h = ((h % 360) + 360) % 360 / 360;
    saturation /= 100; lightness /= 100;
    const hueToRgb = (p, q, t) => {
      if (t < 0) t += 1; if (t > 1) t -= 1;
      if (t < 1/6) return p + (q-p)*6*t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q-p)*(2/3-t)*6;
      return p;
    };
    if (saturation === 0) rgb = [lightness, lightness, lightness].map(value => value * 255);
    else {
      const q = lightness < 0.5 ? lightness * (1+saturation) : lightness + saturation - lightness*saturation;
      const p = 2*lightness-q;
      rgb = [hueToRgb(p,q,h+1/3), hueToRgb(p,q,h), hueToRgb(p,q,h-1/3)].map(value => value*255);
    }
  } else return null;

  const [r, g, b] = rgb.map(clampByte);
  const rn=r/255, gn=g/255, bn=b/255;
  const max=Math.max(rn,gn,bn), min=Math.min(rn,gn,bn), delta=max-min;
  let h=0;
  if (delta) {
    if (max===rn) h=60*(((gn-bn)/delta)%6);
    else if (max===gn) h=60*((bn-rn)/delta+2);
    else h=60*((rn-gn)/delta+4);
  }
  const l=(max+min)/2;
  const saturation=delta===0 ? 0 : delta/(1-Math.abs(2*l-1));
  return {
    hex: `#${[r,g,b].map(value=>value.toString(16).padStart(2,'0')).join('').toUpperCase()}`,
    rgb: `rgb(${r}, ${g}, ${b})`,
    hsl: `hsl(${Math.round((h+360)%360)}, ${Math.round(saturation*100)}%, ${Math.round(l*100)}%)`,
  };
}

function colorConvertReply(ctx) {
  const value = ctx.args.join(' ').trim();
  const result = convertColorInput(value);
  if (!result) return ctx.reply(`🎨 *COLOR CONVERTER*\nFormat: ${ctx.PREFIX}colorconvert <HEX | RGB | HSL>\nContoh:\n• ${ctx.PREFIX}colorconvert #2D6CDF\n• ${ctx.PREFIX}colorconvert rgb(45, 108, 223)\n• ${ctx.PREFIX}colorconvert hsl(220, 73%, 53%)\n\nRentang RGB: 0–255; HSL: hue 0–360°, saturation/lightness 0–100%.`);
  return ctx.reply(`🎨 *HASIL KONVERSI WARNA*\nHEX: *${result.hex}*\nRGB: ${result.rgb}\nHSL: ${result.hsl}`);
}

function contrastRatioHex(first, second) {
  const a = parseHexColor(first);
  const b = parseHexColor(second);
  if (!a || !b) return 0;
  const l1 = relativeLuminance(a.rgb);
  const l2 = relativeLuminance(b.rgb);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function paletteKitReply(ctx) {
  const raw = String(ctx.args.join(' ') || '').trim().toLowerCase();
  const prefix = ctx.PREFIX || '.';
  const colors = PALETTES[raw];
  if (!colors) return ctx.reply(`🧩 *PALETTE KIT / DESIGN TOKENS*\nFormat: ${prefix}palettekit <nama palet>\nPalet tersedia: ${Object.keys(PALETTES).join(', ')}\nContoh: ${prefix}palettekit ocean\n\nMembuat peran warna, rekomendasi teks kontras, dan token CSS siap salin.`);
  const [primary, secondary, tertiary, accent, muted, surface] = colors;
  const textOnSurface = contrastRatioHex('#111111', surface) >= contrastRatioHex('#FFFFFF', surface) ? '#111111' : '#FFFFFF';
  const textOnPrimary = contrastRatioHex('#111111', primary) >= contrastRatioHex('#FFFFFF', primary) ? '#111111' : '#FFFFFF';
  const roles = [
    ['primary', primary, 'CTA, tombol utama, tautan penting'],
    ['secondary', secondary, 'tombol sekunder dan elemen pendukung'],
    ['tertiary', tertiary, 'ikon, badge, dan variasi komponen'],
    ['accent', accent, 'aksen visual; gunakan seperlunya'],
    ['muted', muted, 'border, divider, dan bidang sekunder'],
    ['surface', surface, 'latar halaman atau kartu'],
    ['text', textOnSurface, 'teks utama di atas surface'],
    ['on-primary', textOnPrimary, 'teks di atas warna primary'],
  ];
  const tokens = roles.map(([name, value]) => `  --color-${name}: ${value};`).join('\n');
  const checks = [
    ['Teks utama / surface', textOnSurface, surface],
    ['Teks tombol / primary', textOnPrimary, primary],
    ['Putih / primary', '#FFFFFF', primary],
    ['Hitam / primary', '#111111', primary],
  ].map(([label, fg, bg]) => {
    const ratio = contrastRatioHex(fg, bg);
    return `• ${label}: ${ratio.toFixed(2)}:1 — ${ratio >= 4.5 ? 'AA teks normal lulus' : ratio >= 3 ? 'hanya AA teks besar' : 'perlu pasangan warna lain'}`;
  }).join('\n');
  return ctx.reply(`🧩 *PALETTE KIT — ${raw.toUpperCase()}*\n\n*Peran warna*\n${roles.map(([name, value, use]) => `• ${name}: ${value} — ${use}`).join('\n')}\n\n*Token CSS siap salin*\n\`:root {\n${tokens}\n}\`\n\n*Pemeriksaan kontras WCAG*\n${checks}\n\n*Panduan penerapan*\n• Gunakan primary untuk aksi utama, bukan semua elemen.\n• Accent untuk penekanan singkat; jangan jadikan satu-satunya penanda status.\n• Uji state hover, focus, disabled, dan error secara terpisah.\n• Rasio ini menguji pasangan warna solid; bukan audit aksesibilitas penuh.`);
}

function contrastReply(ctx) {
  const [foreground, background] = ctx.args;
  const fg = parseHexColor(foreground);
  const bg = parseHexColor(background);
  if (!fg || !bg) return ctx.reply(`♿ *CEK KONTRAS WARNA*\nFormat: ${ctx.PREFIX}contrast <warnaTeks> <warnaLatar>\nContoh: ${ctx.PREFIX}contrast #222222 #FFFFFF\n\nGunakan HEX 3 atau 6 digit; tanda # boleh disertakan.`);
  const l1 = relativeLuminance(fg.rgb);
  const l2 = relativeLuminance(bg.rgb);
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  const normalAA = ratio >= 4.5;
  const largeAA = ratio >= 3;
  const normalAAA = ratio >= 7;
  return ctx.reply(`♿ *HASIL CEK KONTRAS*\nTeks: ${fg.hex}\nLatar: ${bg.hex}\nRasio: *${ratio.toFixed(2)}:1*\n\nWCAG AA teks normal (4,5:1): ${normalAA ? '✅ Lulus' : '❌ Belum lulus'}\nWCAG AA teks besar (3:1): ${largeAA ? '✅ Lulus' : '❌ Belum lulus'}\nWCAG AAA teks normal (7:1): ${normalAAA ? '✅ Lulus' : '❌ Belum lulus'}\n\nCatatan: teks besar berarti sekitar 18 pt reguler atau 14 pt tebal. Ini pemeriksaan rasio warna, bukan audit aksesibilitas lengkap.`);
}

async function handleDesignProjectCommandUnlocked(ctx) {
  const { args = [], reply, User, userJid, PREFIX = '.' } = ctx;
  const action = String(args[0] || 'help').toLowerCase();
  const usage = `🗂️ *DESIGNER WORKSPACE 2.0*\nKelola proyek dan ikuti tahap produksi dari brief sampai handoff. Data proyek bersifat pribadi per akun WhatsApp.\n\n${PREFIX}designproject start <nama> | <jenis> | <tema> | <audiens> | <platform>\n${PREFIX}designproject save <nama> | <jenis> | <tema> | <audiens> | <platform> | <palet> | <font>\n${PREFIX}designproject edit <nama> | <jenis> | <tema> | <audiens> | <platform> | <palet> | <font>\n${PREFIX}designproject list [status|jenis] [nilai] · board\n${PREFIX}designproject search <kata kunci>\n${PREFIX}designproject show <nama> · progress <nama>\n${PREFIX}designproject step <nama> · done <nama>\n${PREFIX}designproject reopen <nama> | <brief|concept|layout|visual|qa|handoff>\n${PREFIX}designproject export <nama>\n${PREFIX}designproject duplicate <nama> | <nama baru>\n${PREFIX}designproject status <nama> | <planning|progress|review|done>\n${PREFIX}designproject history <nama>\n${PREFIX}designproject template <poster|logo|sosial|web|app|kemasan> | <nama>\n${PREFIX}designproject flow <nama>\n${PREFIX}designproject delete <nama>\n\nTahap workflow: brief → concept → layout → visual → qa → handoff. Maksimal 10 proyek per akun.`;
  if (!User || typeof User.findOne !== 'function') return reply('⚠️ Penyimpanan proyek belum tersedia: model database User tidak ditemukan.');
  if (!userJid) return reply('⚠️ Identitas WhatsApp tidak tersedia; proyek tidak dapat disimpan.');
  try {
    let user = await User.findOne({ jid: userJid });
    if (!user && typeof User === 'function') user = new User({ jid: userJid, preferences: {} });
    if (!user) return reply('⚠️ Profil pengguna belum tersedia dan tidak dapat dibuat oleh model database.');
    const preferences = user.preferences && typeof user.preferences === 'object' ? user.preferences : {};
    const projects = Array.isArray(preferences.designProjects) ? [...preferences.designProjects] : [];
    const clean = value => String(value ?? '').replace(/[\r\n]/g, ' ').trim().slice(0, 120);
    const key = value => clean(value).toLocaleLowerCase('id-ID');
    const findProject = name => projects.findIndex(project => key(project?.name) === key(name));
    const now = () => new Date().toISOString();
    const ensureWorkflow = project => ({
      ...project,
      workflow: project?.workflow ? project.workflow : createDesignWorkflowState(project?.createdAt || now()),
    });
    const getProject = name => {
      const index = findProject(name);
      return index < 0 ? { index: -1, project: null } : { index, project: ensureWorkflow(projects[index]) };
    };
    const addHistory = (project, event, details = {}) => ({
      ...project,
      history: [...(Array.isArray(project.history) ? project.history : []), { event, at: now(), ...details }].slice(-20),
    });
    const persist = async nextProjects => {
      user.preferences = { ...preferences, designProjects: nextProjects };
      await user.save();
    };
    const nameFromArgs = args.slice(1).join(' ').trim();

    if (action === 'list') {
      const filterType = String(args[1] || '').toLowerCase();
      const filterValue = clean(args.slice(2).join(' '));
      let shown = projects;
      if (filterType === 'status' || filterType === 'jenis' || filterType === 'kind') {
        if (!filterValue) return reply(`Filter: ${PREFIX}designproject list status <planning|progress|review|done> atau list jenis <jenis desain>.`);
        if (filterType === 'status' && !['planning', 'progress', 'review', 'done'].includes(key(filterValue))) return reply(`Status tidak dikenal: *${filterValue}*. Gunakan planning, progress, review, atau done.`);
        shown = projects.filter(project => key(filterType === 'status' ? (project.status || 'planning') : project.kind) === key(filterValue));
      } else if (filterType) {
        return reply(`Filter: ${PREFIX}designproject list status <planning|progress|review|done> atau list jenis <jenis desain>.`);
      }
      if (!shown.length) return reply(`🗂️ Tidak ada proyek yang cocok${filterValue ? ` dengan filter *${filterValue}*` : ''}.`);
      return reply(`🗂️ *PROYEK TERSIMPAN (${shown.length}/${projects.length})*\n\n${shown.map(project => { const progress = getDesignWorkflowProgress(project); return `${project.name} — ${project.kind}\nStatus: ${project.status || 'planning'} · Workflow ${progress.percent}% · ${progress.current?.label || 'selesai'}\n${project.theme}`; }).join('\n\n')}\n\nBuka: ${PREFIX}designproject show <nama> · Board: ${PREFIX}designproject board`);
    }
    if (action === 'board' || action === 'papan') {
      if (!projects.length) return reply(`🗂️ Belum ada proyek. Mulai dari ${PREFIX}designproject start <nama> | <jenis> | <tema> | <audiens> | <platform> atau gunakan template.`);
      const rows = projects.map(project => {
        const progress = getDesignWorkflowProgress(project);
        const status = project.status || 'planning';
        return `• *${clean(project.name)}* — ${clean(project.kind)}\n  ${progress.percent}% · ${progress.current?.label || 'Workflow selesai'} · ${status}`;
      });
      return reply(`🗂️ *PROJECT BOARD — ${projects.length}/10*\n\n${rows.join('\n\n')}\n\nBuka tahap aktif: ${PREFIX}designproject step <nama>\nProgress: ${PREFIX}designproject progress <nama>`);
    }
    if (action === 'progress' || action === 'step' || action === 'done' || action === 'reopen') {
      const [nameRaw, stageRaw] = args.slice(1).join(' ').split('|').map(clean);
      const { index, project: found } = getProject(nameRaw);
      if (index < 0 || !found) return reply(`Proyek tidak ditemukan. Lihat daftar: ${PREFIX}designproject list.`);
      const project = found;
      if (action === 'progress') return reply(formatDesignWorkflowProgress(project, PREFIX));
      if (action === 'step') return reply(formatDesignWorkflowStep(project, PREFIX));
      if (action === 'done') {
        const transition = completeDesignWorkflowStage(project, stageRaw || '');
        if (!transition.ok && transition.reason === 'already_complete') return reply(`🎉 Workflow *${project.name}* sudah menyelesaikan semua tahap.\n\n${PREFIX}designproject export ${project.name}`);
        if (!transition.ok && transition.reason === 'not_current_stage') return reply(`⚠️ Tahap aktif proyek ini adalah *${transition.expected}*. Selesaikan tahap secara berurutan agar riwayat produksi tetap konsisten.\n\n${PREFIX}designproject step ${project.name}`);
        projects[index] = {
          ...transition.project,
          updatedAt: now(),
          history: [...(Array.isArray(project.history) ? project.history : []), {
            event: 'workflow_stage_completed', from: transition.stage.id, to: transition.nextStage, at: now(),
          }].slice(-20),
        };
        await persist(projects);
        const next = transition.progress.current;
        return reply(`✅ Tahap *${transition.stage.label}* pada proyek *${project.name}* ditandai selesai.\nProgress: *${transition.progress.percent}%* (${transition.progress.completed}/${transition.progress.total})${next ? `\n\nTahap berikutnya: *${next.label}*\nBuka panduan: ${PREFIX}designproject step ${project.name}` : `\n\n🎉 Seluruh workflow selesai. Siapkan ringkasan akhir: ${PREFIX}designproject export ${project.name}`}`);
      }
      const transition = reopenDesignWorkflowStage(project, stageRaw || '');
      if (!transition.ok && transition.reason === 'unknown_stage') return reply(`Tahap tidak dikenal. Pilih: ${DESIGN_WORKFLOW_STAGES.map(stage => stage.id).join(', ')}.`);
      if (!transition.ok && transition.reason === 'not_completed') return reply(`Tahap *${transition.stage.label}* belum selesai, jadi tidak perlu dibuka ulang. Tahap aktif: ${transition.progress?.current?.label || 'selesai'}.`);
      projects[index] = {
        ...transition.project,
        updatedAt: now(),
        history: [...(Array.isArray(project.history) ? project.history : []), {
          event: 'workflow_stage_reopened', from: project.workflow?.currentStage || 'brief', to: transition.stage.id, at: now(),
        }].slice(-20),
      };
      await persist(projects);
      return reply(`↩️ Tahap *${transition.stage.label}* dibuka ulang. Tahap setelahnya kembali menjadi belum selesai agar urutan produksi tetap konsisten.\n\n${PREFIX}designproject step ${project.name}`);
    }
    if (action === 'search' || action === 'cari') {
      const query = key(nameFromArgs);
      if (!query) return reply(`Format: ${PREFIX}designproject search <kata kunci>`);
      const found = projects.filter(project => [project.name, project.kind, project.theme, project.audience, project.platform, project.palette, project.font].some(value => key(value).includes(query)));
      return reply(found.length ? `🔎 *HASIL PENCARIAN (${found.length})*\n\n${found.map(project => `${project.name} — ${project.kind} · ${project.status || 'planning'}\n${project.theme}`).join('\n\n')}` : 'Tidak ada proyek yang cocok dengan kata kunci tersebut.');
    }
    if (action === 'show' || action === 'history' || action === 'export') {
      const index = findProject(nameFromArgs);
      if (index < 0) return reply(`Proyek tidak ditemukan. Lihat daftar dengan ${PREFIX}designproject list.`);
      const project = projects[index];
      if (action === 'history') {
        const history = Array.isArray(project.history) ? project.history : [];
        return reply(history.length ? `🕘 *RIWAYAT ${project.name.toUpperCase()}*\n\n${history.map(item => `• ${item.at || '-'} — ${item.event}${item.from || item.to ? ` (${item.from || '-'} → ${item.to || '-'})` : ''}`).join('\n')}` : `Belum ada riwayat perubahan untuk *${project.name}*.`);
      }
      if (action === 'export') {
        const progress = getDesignWorkflowProgress(project);
        const exportText = [
          `BRIEF PROYEK: ${project.name}`,
          `Jenis desain: ${project.kind || 'Belum ditentukan'}`,
          `Status proyek: ${project.status || 'planning'}`,
          `Tema/produk: ${project.theme || 'Belum ditentukan'}`,
          `Audiens: ${project.audience || 'Belum ditentukan'}`,
          `Platform/output: ${project.platform || 'Belum ditentukan'}`,
          `Palet warna: ${project.palette || 'Belum ditentukan'}`,
          `Tipografi: ${project.font || 'Belum ditentukan'}`,
          `Workflow: ${progress.percent}% (${progress.completed}/${progress.total})`,
          `Tahap selesai: ${progress.completedStages.join(', ') || 'Belum ada'}`,
          `Tahap aktif: ${progress.current?.id || 'complete'}`,
          `Dibuat: ${project.createdAt || '-'}`,
          `Diperbarui: ${project.updatedAt || project.createdAt || '-'}`,
        ].join('\n');
        return reply(`📄 *EXPORT BRIEF — ${project.name.toUpperCase()}*\n\n${exportText}\n\nSalin teks ini untuk dokumentasi atau diskusi proyek. Export hanya menghasilkan ringkasan teks; tidak membuat atau mengirim file desain.`);
      }
      return reply(`🗂️ *${project.name.toUpperCase()}*\nJenis: ${project.kind}\nStatus: ${project.status || 'planning'}\nTema: ${project.theme}\nAudiens: ${project.audience}\nPlatform: ${project.platform}\nPalet: ${project.palette || 'Belum ditentukan'}\nFont: ${project.font || 'Belum ditentukan'}\n\n${formatDesignWorkflowProgress(project, PREFIX)}\n\nRiwayat: ${(project.history || []).length} perubahan\nExport brief: ${PREFIX}designproject export ${project.name}`);
    }
    if (action === 'status' || action === 'setstatus') {
      const [nameRaw, statusRaw] = args.slice(1).join(' ').split('|').map(value => value.trim());
      const status = String(statusRaw || '').toLowerCase();
      const allowed = new Set(['planning', 'progress', 'review', 'done']);
      if (!nameRaw || !allowed.has(status)) return reply(`Format: ${PREFIX}designproject status <nama> | <planning|progress|review|done>`);
      const index = findProject(nameRaw);
      if (index < 0) return reply('Proyek tidak ditemukan; periksa dengan designproject list.');
      const previousStatus = projects[index].status || 'planning';
      projects[index] = { ...addHistory(projects[index], 'status', { from: previousStatus, to: status }), status, updatedAt: now() };
      await persist(projects);
      return reply(`🔄 Status proyek *${projects[index].name}* diperbarui menjadi *${status}*.`);
    }
    if (action === 'delete' || action === 'hapus') {
      const index = findProject(nameFromArgs);
      if (index < 0) return reply('Proyek tidak ditemukan; tidak ada data yang dihapus.');
      const [deleted] = projects.splice(index, 1);
      await persist(projects);
      return reply(`🗑️ Proyek *${deleted.name}* dihapus dari workspace akun ini.`);
    }
    if (action === 'duplicate' || action === 'duplikat') {
      const [sourceRaw, targetRaw] = args.slice(1).join(' ').split('|').map(clean);
      const sourceIndex = findProject(sourceRaw);
      if (sourceIndex < 0 || !targetRaw) return reply(`Format: ${PREFIX}designproject duplicate <nama> | <nama baru>`);
      if (projects.length >= 10) return reply('Batas 10 proyek tercapai. Hapus proyek lama sebelum menduplikasi.');
      if (findProject(targetRaw) >= 0) return reply('Nama proyek tujuan sudah digunakan. Pilih nama lain.');
      const source = projects[sourceIndex];
      const duplicateStamp = now();
      const duplicate = { ...source, name: targetRaw, status: 'planning', workflow: createDesignWorkflowState(duplicateStamp), createdAt: duplicateStamp, updatedAt: duplicateStamp, history: [{ event: 'duplicated', at: duplicateStamp, from: source.name }] };
      projects.unshift(duplicate);
      await persist(projects);
      return reply(`✅ Proyek *${source.name}* berhasil diduplikasi menjadi *${targetRaw}* dengan status planning.`);
    }
    if (action === 'flow') {
      const index = findProject(nameFromArgs);
      if (index < 0) return reply(`Proyek tidak ditemukan. Lihat daftar dengan ${PREFIX}designproject list.`);
      const project = projects[index];
      const flowKinds = ['poster', 'logo', 'sosial', 'web', 'app', 'bot', 'marketplace', 'kemasan'];
      const flowKind = String(project.kind || '').toLowerCase().split(/[^a-z0-9]+/).map(word => flowKinds.find(kind => kind === word)).find(Boolean);
      if (!flowKind) return reply(`⚠️ Jenis proyek *${project.name}* ("${project.kind || '-'}") belum dikenali oleh designflow.\n\nJenis yang didukung: ${flowKinds.join(', ')}.\nUbah dengan: ${PREFIX}designproject edit ${project.name} | <jenis>`);
      let generatedFlow = '';
      await handleDesignerAssistantCommands({
        ...ctx,
        command: 'designflow',
        args: [flowKind, '|', project.theme, '|', project.audience, '|', project.platform],
        reply: async value => { generatedFlow = String(value); },
      });
      return reply(`${generatedFlow}\n\n${buildDesignWorkflowSummary(project, PREFIX)}`);
    }
    if (action === 'template' || action === 'templat') {
      const [kindRaw, nameRaw] = args.slice(1).join(' ').split('|').map(clean);
      const kind = String(kindRaw || '').toLowerCase();
      const templates = {
        poster: ['acara atau promosi', 'audiens umum', 'feed dan cetak', 'kontras tinggi', 'Display + sans-serif'],
        logo: ['identitas brand', 'pelanggan brand', 'digital dan cetak', 'monokrom dahulu', 'Wordmark + sans-serif'],
        sosial: ['konten kampanye', 'pengikut media sosial', 'Instagram dan TikTok', 'sesuai brand', 'Sans-serif tegas'],
        web: ['website produk', 'pengunjung website', 'responsif mobile-first', 'aksesibel', 'Sans-serif UI'],
        app: ['aplikasi digital', 'pengguna aplikasi', 'iOS dan Android', 'aksesibel', 'Sans-serif UI'],
        kemasan: ['kemasan produk', 'pembeli produk', 'kemasan fisik', 'sesuai identitas brand', 'Display + sans-serif'],
      };
      if (!templates[kind] || !nameRaw) return reply(`Format: ${PREFIX}designproject template <poster|logo|sosial|web|app|kemasan> | <nama>`);
      if (projects.length >= 10) return reply('Batas 10 proyek tercapai. Hapus proyek lama sebelum membuat template.');
      if (findProject(nameRaw) >= 0) return reply('Nama proyek sudah digunakan.');
      const [theme, audience, platform, palette, font] = templates[kind];
      const stamp = now();
      const project = { name: nameRaw, kind, theme, audience, platform, palette, font, status: 'planning', workflow: createDesignWorkflowState(stamp), createdAt: stamp, updatedAt: stamp, history: [{ event: 'created_from_template', at: stamp }] };
      projects.unshift(project);
      await persist(projects);
      return reply(`✅ Template *${kind}* dibuat sebagai proyek *${nameRaw}*.\n\nWorkflow dimulai dari tahap *Brief*.\nLihat panduan: ${PREFIX}designproject step ${nameRaw}\nLihat progress: ${PREFIX}designproject progress ${nameRaw}\nLengkapi brief: ${PREFIX}designproject edit ${nameRaw} | ...`);
    }
    if (action !== 'save' && action !== 'simpan' && action !== 'start' && action !== 'mulai' && action !== 'edit' && action !== 'ubah') return reply(usage);
    const fields = args.slice(1).join(' ').split('|').map(value => value.trim());
    const [nameRaw, kindRaw, themeRaw, audienceRaw, platformRaw, paletteRaw, fontRaw] = fields;
    const name = clean(nameRaw);
    if (!name) return reply(usage);
    const existing = findProject(name);
    if ((action === 'start' || action === 'mulai') && existing >= 0) return reply(`Proyek *${name}* sudah ada. Gunakan ${PREFIX}designproject edit ${name} | ... untuk memperbarui atau pilih nama lain.`);
    if ((action === 'edit' || action === 'ubah') && existing < 0) return reply('Proyek tidak ditemukan; gunakan save untuk membuat proyek baru.');
    if (action === 'edit' || action === 'ubah') {
      const previous = projects[existing];
      const values = [kindRaw, themeRaw, audienceRaw, platformRaw, paletteRaw, fontRaw];
      const keys = ['kind', 'theme', 'audience', 'platform', 'palette', 'font'];
      const changes = {};
      keys.forEach((field, index) => { if (values[index] !== undefined && values[index] !== '') changes[field] = clean(values[index]); });
      if (!Object.keys(changes).length) return reply(`Isi minimal satu field untuk diubah. Format: ${PREFIX}designproject edit ${name} | <jenis> | <tema> | <audiens> | <platform> | <palet> | <font>`);
      const stamp = now();
      projects[existing] = { ...addHistory(previous, 'edited', { fields: Object.keys(changes) }), ...changes, updatedAt: stamp };
      await persist(projects);
      return reply(`✏️ Proyek *${name}* diperbarui (${Object.keys(changes).join(', ')}).`);
    }
    if (!kindRaw || !themeRaw || !audienceRaw || !platformRaw) return reply(usage);
    const previous = existing >= 0 ? projects[existing] : null;
    const stamp = now();
    const project = { name, kind: clean(kindRaw), theme: clean(themeRaw), audience: clean(audienceRaw), platform: clean(platformRaw), palette: clean(paletteRaw), font: clean(fontRaw), status: previous?.status || 'planning', workflow: previous?.workflow || createDesignWorkflowState(stamp), createdAt: previous?.createdAt || stamp, updatedAt: stamp, history: [...(Array.isArray(previous?.history) ? previous.history : []), { event: previous ? 'saved_update' : action === 'start' || action === 'mulai' ? 'workflow_started' : 'created', at: stamp }].slice(-20) };
    if (existing < 0 && projects.length >= 10) return reply(`Batas 10 proyek tercapai. Hapus proyek lama dengan ${PREFIX}designproject delete <nama> sebelum menyimpan lagi.`);
    if (existing >= 0) projects[existing] = project;
    else projects.unshift(project);
    await persist(projects);
    return reply(`✅ Proyek *${name}* ${existing >= 0 ? 'diperbarui' : 'disimpan'} di workspace akun ini.\n\nWorkflow produksi dimulai dari tahap *Brief*.\n• Panduan tahap aktif: ${PREFIX}designproject step ${name}\n• Lihat progress: ${PREFIX}designproject progress ${name}\n• Buka ringkasan: ${PREFIX}designproject show ${name}\n\nDaftar proyek: ${PREFIX}designproject board`);
  } catch (error) {
    return reply(`❌ Gagal mengakses workspace database: ${String(error?.message || error).slice(0, 180)}`);
  }
}

// Serialize workspace mutations per WhatsApp account inside this process to avoid lost updates
// when a member sends two project commands at nearly the same time.
const designProjectQueues = new Map();

async function handleDesignProjectCommand(ctx) {
  const key = String(ctx?.userJid || '').trim();
  if (!key) return ctx.reply('⚠️ Identitas WhatsApp tidak tersedia; workspace proyek tidak dapat dibuka.');
  const previous = designProjectQueues.get(key) || Promise.resolve();
  let release;
  const lock = new Promise(resolve => { release = resolve; });
  const tail = previous.then(() => lock);
  designProjectQueues.set(key, tail);
  await previous;
  try {
    return await handleDesignProjectCommandUnlocked(ctx);
  } finally {
    release();
    if (designProjectQueues.get(key) === tail) designProjectQueues.delete(key);
  }
}

export async function handleDesignerAssistantCommands(ctx) {
  const { command, args = [], reply, PREFIX = '.' } = ctx;
  if (command === 'akses') return showAccess(ctx);
  if (command === 'sub') return handleSubscriptionCommand(ctx);
  if (command === 'designproject') return handleDesignProjectCommand(ctx);
  if (command === 'typography') return handleTypographyCommand(ctx);
  if (command === 'qareview') return handleQaReviewCommand(ctx);
  if (command === 'moodboard') return reply(buildMoodboard(args));
  if (command === 'wizard' || command === 'briefwizard' || command === 'briefbuilder') {
    const action = String(args[0] || '').toLowerCase();
    if (['batal', 'cancel', 'stop', 'hapus'].includes(action)) return cancelDesignBriefWizard(ctx);
    if (['status', 'cek'].includes(action)) return getDesignBriefWizardStatus(ctx);
    if (['lanjut', 'resume', 'continue'].includes(action)) return resumeDesignBriefWizard(ctx);
    if (['kembali', 'back', 'mundur'].includes(action)) return goBackDesignBriefWizard(ctx);
    if (['ulang', 'reset', 'restart'].includes(action)) return startDesignBriefWizard(ctx, { restart: true });
    return startDesignBriefWizard(ctx);
  }
  if (PREMIUM_COMMANDS.has(command)) {
    const owner = isOwner(ctx);
    const subscription = owner ? null : await getSubscription(getIdentities(ctx));
    if (!owner && !subscription) return reply(`🔒 *Fitur khusus pelanggan bot*\n.${command} hanya tersedia untuk pelanggan aktif.\n\nCek status: ${PREFIX}akses\nHubungi Owner bot untuk informasi langganan.`);
  }
  switch (command) {
    case 'designflow': {
      const raw = args.join(' ').trim();
      const [kindRaw, themeRaw, audienceRaw, platformRaw] = raw.split('|').map(value => value.trim());
      const kind = String(kindRaw || '').toLowerCase();
      const supported = ['poster', 'logo', 'sosial', 'web', 'app', 'bot', 'marketplace', 'kemasan'];
      if (!supported.includes(kind) || !themeRaw || !audienceRaw || !platformRaw) {
        return reply(`🎨 *DESIGN WORKFLOW STUDIO*\nSusun alur kerja desain dari brief sampai QA.\n\nFormat: ${PREFIX}designflow <jenis> | <tema> | <audiens> | <platform>\nJenis: ${supported.join(', ')}\nContoh: ${PREFIX}designflow web | toko kopi modern | pelanggan 18+ | mobile-first\n\nOutput: ringkasan brief, arahan visual, UX/layout, prompt awal, dan checklist QA.`);
      }
      const workflows = {
        poster: 'Tentukan satu pesan utama → susun judul dan detail → pilih visual pendukung → tempatkan CTA → cek safe margin dan ukuran ekspor.',
        logo: 'Rumuskan atribut brand → eksplorasi bentuk orisinal → uji siluet hitam-putih → cek ukuran kecil → siapkan variasi dan panduan penggunaan.',
        sosial: 'Tentukan tujuan konten → buat hook → susun urutan informasi → terapkan template konsisten → cek crop, safe area, dan keterbacaan ponsel.',
        web: 'Petakan tugas utama → susun sitemap → wireframe → tetapkan design tokens → desain state lengkap → uji responsif dan aksesibilitas.',
        app: 'Petakan skenario pengguna → sederhanakan onboarding → wireframe tugas utama → desain komponen dan state → uji navigasi, sentuh, dan aksesibilitas.',
        bot: 'Kelompokkan intent → buat menu ringkas → tentukan format input → rancang respons sukses/error → uji percakapan dan hak akses.',
        marketplace: 'Pisahkan kebutuhan klien/desainer → rancang pencarian dan profil → jelaskan paket/biaya → petakan order dan revisi → uji status serta privasi.',
        kemasan: 'Tentukan informasi wajib → tetapkan hierarki depan-belakang → susun identitas visual → cek dieline dan area cetak → proof warna dan keterbacaan.'
      };
      const safeField = value => value.replace(/[\r\n]/g, ' ').slice(0, 120);
      const theme = safeField(themeRaw);
      const audience = safeField(audienceRaw);
      const platformNotes = safeField(platformRaw);
      const styleText = `${theme} ${platformNotes}`.toLowerCase();
      const paletteKey = styleText.match(/futur|tech|neon|digital/) ? 'futuristik'
        : styleText.match(/elegan|luxury|premium|formal/) ? 'elegan'
          : styleText.match(/alam|organik|natural|eco/) ? 'alam'
            : styleText.match(/retro|vintage/) ? 'retro'
              : styleText.match(/pastel|lembut|ceria/) ? 'pastel' : 'minimalis';
      const palette = PALETTES[paletteKey];
      const fontGuide = {
        poster: 'Display tegas untuk judul + sans-serif netral untuk detail',
        logo: 'Wordmark dengan keluarga type yang khas + sans-serif pendamping',
        sosial: 'Sans-serif kuat untuk hook + sans-serif sederhana untuk caption',
        web: 'Sans-serif UI untuk heading dan body; gunakan bobot, bukan banyak keluarga font',
        app: 'Sans-serif UI dengan x-height tinggi dan keterbacaan layar kecil',
        bot: 'Sans-serif sederhana; bedakan judul, instruksi, dan status dengan hierarki',
        marketplace: 'Sans-serif UI yang netral untuk harga, status, dan informasi layanan',
        kemasan: 'Display berkarakter untuk brand + sans-serif jelas untuk informasi produk',
      }[kind];
      const reviewKind = kind === 'sosial' ? 'sosial' : kind === 'kemasan' ? 'kemasan' : kind;
      const qaCommand = ['poster','logo','sosial','web','app','kemasan'].includes(reviewKind) ? reviewKind : 'poster';
      const designWidth = ['web','app','bot','marketplace'].includes(kind) ? 'Mobile 360 px, tablet 768 px, desktop 1280 px (sesuaikan breakpoint produk)' : 'Tentukan ukuran final sesuai spesifikasi kanal atau vendor';
      return reply(`🎨 *DESIGN WORKFLOW STUDIO — ${kind.toUpperCase()}*\n\n*1. Brief ringkas*\nProyek: ${theme}\nAudiens: ${audience}\nPlatform/output: ${platformNotes}\nTujuan: tetapkan satu hasil utama yang ingin dicapai dan satu CTA/pesan prioritas.\n\n*2. Alur produksi*\n${workflows[kind]}\n\n*3. Design direction*\n• Hierarki: satu fokus utama → informasi pendukung → CTA/detail.\n• Komposisi: gunakan grid, alignment konsisten, dan ruang kosong yang cukup.\n• Palet awal (${paletteKey}): ${palette.join(' · ')}\n• Tipografi: ${fontGuide}.\n• Spacing: mulai dari skala 4/8 px untuk digital; validasi sesuai konteks.\n\n*4. Spesifikasi awal*\n• Target ukuran: ${designWidth}.\n• Digital: ekspor PNG/WebP untuk raster atau SVG untuk ikon/logo bila sesuai.\n• Cetak/kemasan: minta ukuran jadi, bleed, safe area, dieline, dan profil warna dari vendor; jangan menebak spesifikasi cetak.\n\n*5. Prompt siap pakai*\nBuat konsep ${kind} bertema “${theme}” untuk ${audience}, ditujukan pada ${platformNotes}. Terapkan palet ${paletteKey} (${palette.join(', ')}), ${fontGuide.toLowerCase()}, hierarki yang jelas, komposisi orisinal, dan detail yang relevan. Pastikan hasil mudah dibaca dan tidak meniru karya, karakter, atau identitas merek tertentu.\n\n*6. QA sebelum final*\n□ Brief dan pesan utama sudah disetujui\n□ Hierarki, alignment, spacing, dan konsistensi visual diperiksa\n□ Kontras, keterbacaan, ejaan, dan safe area diperiksa\n□ Ukuran, format, resolusi, dan tampilan di target diuji\n□ Aset/font memiliki izin penggunaan dan file sumber tersimpan\n\n*7. Pintasan lanjutan*\n• Palet: ${PREFIX}colorpalette ${paletteKey}\n• Skala teks: ${PREFIX}typescale 16 1.25 5\n• Review: ${PREFIX}designqa ${qaCommand}\n• Handoff: ${PREFIX}handoff ${theme} | ${kind} | ${platformNotes} | PNG, SVG, PDF\n• Sistem desain: ${PREFIX}designsystem ${paletteKey}\n\n*Simpan sebagai proyek agar progress tidak hilang*\n${PREFIX}designproject start ${theme} | ${kind} | ${theme} | ${audience} | ${platformNotes}\n\nOutput ini adalah spesifikasi awal, bukan hasil pengukuran otomatis. Verifikasi kebutuhan klien, platform, aksesibilitas, lisensi, dan spesifikasi vendor sebelum produksi.`);
    }
    case 'typescale': {
      const raw = String(args.join(' ') || '').trim();
      const [baseRaw, ratioRaw, stepsRaw] = raw.split(/[ ,]+/).filter(Boolean);
      const base = baseRaw === undefined ? 16 : Number(baseRaw);
      const ratio = ratioRaw === undefined ? 1.25 : Number(ratioRaw);
      const steps = stepsRaw === undefined ? 5 : Number(stepsRaw);
      if (!Number.isFinite(base) || base < 10 || base > 32 || !Number.isFinite(ratio) || ratio < 1.1 || ratio > 1.5 || !Number.isInteger(steps) || steps < 2 || steps > 7) {
        return reply(`🔤 *TYPOGRAPHY SCALE STUDIO*\nBuat skala ukuran teks yang konsisten untuk UI atau konten digital.\n\nFormat: ${PREFIX}typescale [base] [ratio] [langkah]\nContoh: ${PREFIX}typescale 16 1.25 5\nRentang: base 10–32 px, ratio 1.1–1.5, langkah 2–7.\nPreset ratio: 1.125 (rapat), 1.2 (kompak), 1.25 (serbaguna), 1.333 (kontras), 1.414 (dramatis).`);
      }
      const labels = ['Caption', 'Small', 'Body', 'Subtitle', 'Heading 3', 'Heading 2', 'Heading 1', 'Display'];
      const rows = [];
      for (let index = -2; index <= steps; index++) {
        const px = base * Math.pow(ratio, index);
        const rounded = Math.round(px * 10) / 10;
        const label = labels[index + 2] || `Step ${index}`;
        const lineHeight = index <= 0 ? 1.5 : 1.2;
        rows.push(`${label}: *${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)} px* · line-height ${lineHeight}`);
      }
      return reply(`🔤 *TYPOGRAPHY SCALE*\nBase: ${base} px · Ratio: ${ratio} · Langkah: ${steps}\n\n${rows.join('\n')}\n\n*Panduan penerapan*\n• Body: utamakan 16 px atau lebih untuk paragraf digital.\n• Heading: gunakan bobot dan jarak yang konsisten; jangan hanya mengandalkan ukuran.\n• Line-height: sekitar 1.45–1.6 untuk body dan 1.1–1.25 untuk heading.\n• Uji pada layar kecil, panjang teks nyata, dan bahasa target.\n• Skala ini titik awal; sesuaikan untuk kebutuhan aksesibilitas dan media cetak.`);
    }
    case 'colorpalette': return paletteReply(ctx);
    case 'paletteview': return paletteViewReply(ctx);
    case 'palettekit': return paletteKitReply(ctx);
    case 'colorconvert': return colorConvertReply(ctx);
    case 'contrast': return contrastReply(ctx);
    case 'designsystem': {
      const style = String(args.join(' ') || '').trim().toLowerCase();
      const systems = {
        minimalis: { colors: ['#F7F7F2 (surface)', '#202124 (text)', '#5B7468 (primary)', '#DDE5DF (border)'], type: 'Inter / Manrope', radius: '8–12 px', spacing: '8 px grid', feel: 'tenang, fokus, minim dekorasi' },
        futuristik: { colors: ['#0B1020 (background)', '#F4F7FF (text)', '#00D9FF (primary)', '#8A5CFF (accent)'], type: 'Space Grotesk / Inter', radius: '12–16 px', spacing: '8 px grid', feel: 'teknologis, kontras tinggi, glow secukupnya' },
        elegan: { colors: ['#F5F0E8 (surface)', '#211E1B (text)', '#80652B (primary)', '#D9CDB7 (border)'], type: 'DM Serif Display / Lato', radius: '4–8 px', spacing: '8 px grid', feel: 'premium, editorial, banyak ruang kosong' },
        playful: { colors: ['#FFF8E8 (surface)', '#25213A (text)', '#6C5CE7 (primary)', '#FF8B6A (accent)'], type: 'Nunito / DM Sans', radius: '16–24 px', spacing: '8 px grid', feel: 'ramah, bentuk membulat, ilustrasi sederhana' },
        alam: { colors: ['#F3F0E4 (surface)', '#20382C (text)', '#3D7655 (primary)', '#C77D48 (accent)'], type: 'DM Sans / Source Serif 4', radius: '10–14 px', spacing: '8 px grid', feel: 'organik, hangat, tekstur ringan' },
      };
      if (!style || !systems[style]) return reply(`🧱 *DESIGN SYSTEM STARTER*\nPilih gaya: ${Object.keys(systems).join(', ')}\nContoh: ${PREFIX}designsystem futuristik\n\nStarter ini adalah titik awal; cek kontras dan uji token pada komponen nyata sebelum dipakai produksi.`);
      const kit = systems[style];
      return reply(`🧱 *DESIGN SYSTEM: ${style.toUpperCase()}*\n\n*Warna*\n${kit.colors.map((v, i) => `${i + 1}. ${v}`).join('\n')}\n\n*Tipografi:* ${kit.type}\n*Radius komponen:* ${kit.radius}\n*Spacing:* ${kit.spacing}\n*Karakter visual:* ${kit.feel}\n\n*Token komponen*\n• Primary button: warna primary + teks dengan kontras teruji\n• Secondary button: surface + border jelas\n• Card: surface, radius konsisten, padding 16–24 px\n• Focus state: outline terlihat, jangan hanya mengandalkan warna\n• Error/success: ikon + teks, bukan warna saja\n\n*QA sebelum rilis:* jalankan ${PREFIX}contrast untuk pasangan teks/latar, periksa mobile, hover/focus, disabled, loading, error, dan empty state. Font dan rasio ukuran di atas adalah rekomendasi, bukan aturan wajib.`);
    }
    case 'uxflow': {
      const kind = String(args.join(' ') || '').trim().toLowerCase();
      const flows = {
        web: ['Landing page → pahami manfaat → bandingkan opsi → CTA utama → form singkat → validasi inline → konfirmasi dan langkah berikutnya.', 'Sediakan navigasi konsisten, status loading/error/success, dan jalur kembali tanpa kehilangan input.'],
        app: ['Onboarding singkat → izin hanya saat dibutuhkan → beranda dengan tugas utama → aksi → feedback langsung → riwayat/status → bantuan.', 'Lewati onboarding bila memungkinkan; jelaskan alasan izin dan sediakan undo untuk aksi yang bisa dibatalkan.'],
        bot: ['Menu kategori → pilih tujuan → tampilkan format dan contoh → validasi input → konfirmasi bila berdampak besar → hasil ringkas → pintasan langkah berikutnya.', 'Untuk input salah, jelaskan bagian yang keliru dan tampilkan contoh benar; jangan mengulang pesan panjang tanpa kebutuhan.'],
        marketplace: ['Klien: cari desainer → filter → buka profil/portofolio → cek paket dan cakupan → isi brief → bandingkan penawaran → pilih → pantau status → revisi/selesai → ulasan.', 'Desainer: lengkapi profil → unggah karya → tunggu moderasi → terima brief → kirim penawaran → mulai setelah dipilih → kirim hasil → tangani revisi → selesaikan pesanan.'],
        checkout: ['Ringkasan pesanan → biaya dan cakupan transparan → data minimum → tinjau → konfirmasi → status pemrosesan → bukti sukses dan referensi.', 'Jangan sembunyikan biaya; cegah submit ganda dan sediakan jalur bantuan ketika status tidak pasti.'],
      };
      const key = Object.keys(flows).find(k => kind === k || kind.includes(k));
      if (!key) return reply(`🧭 *UX FLOW STARTER*\nPilih: ${Object.keys(flows).join(', ')}\nContoh: ${PREFIX}uxflow marketplace\n\nPilih alur yang paling sesuai dengan produk; validasi dengan pengguna nyata sebelum implementasi.`);
      return reply(`🧭 *USER FLOW: ${key.toUpperCase()}*\n\n*Alur utama*\n${flows[key][0]}\n\n*Prinsip UX*\n${flows[key][1]}\n\n*Checklist pengujian*\n□ Pengguna baru memahami langkah berikutnya tanpa bantuan\n□ Status sistem terlihat setelah setiap aksi\n□ Error menjelaskan cara memperbaiki masalah\n□ Alur bisa dipakai di layar kecil dan dengan keyboard/pembaca layar\n□ Uji minimal 3–5 orang; catat tugas gagal dan titik bingung. Ini template awal, bukan pengganti usability testing.`);
    }
    case 'uxaudit': {
      const type = String(args.join(' ') || '').trim().toLowerCase();
      const profiles = {
        web: ['Tentukan satu tujuan utama per halaman dan tampilkan CTA primer paling jelas.', 'Pastikan navigasi konsisten dan pengguna tahu lokasi mereka.', 'Gunakan label form yang selalu terlihat, contoh input, dan pesan error yang spesifik.', 'Sediakan state loading, kosong, berhasil, dan gagal.', 'Uji keyboard, fokus terlihat, kontras WCAG AA, dan zoom 200%.', 'Periksa tampilan mobile, target sentuh, serta panjang teks yang realistis.'],
        app: ['Prioritaskan tugas utama pada layar pertama.', 'Gunakan pola navigasi yang konsisten dan tombol kembali yang dapat diprediksi.', 'Beri umpan balik setelah tap, simpan, kirim, atau hapus.', 'Konfirmasi aksi destruktif dan sediakan pembatalan bila memungkinkan.', 'Sediakan loading, empty state, offline/error, dan success state.', 'Uji target sentuh, pembaca layar, kontras, dan ukuran teks.'],
        bot: ['Menu awal harus ringkas dan menunjukkan kategori perintah.', 'Setiap command memiliki contoh valid dan format input.', 'Balasan error menyebut penyebab serta langkah berikutnya.', 'Gunakan konfirmasi sebelum aksi destruktif atau perubahan status penting.', 'Jaga pesan singkat, gunakan judul/section, dan hindari spam pesan berturut-turut.', 'Pastikan akses peran dijelaskan dan data privat tidak muncul di grup.'],
        marketplace: ['Pisahkan jalur klien dan desainer dengan label yang jelas.', 'Tampilkan status pesanan dan langkah berikutnya secara konsisten.', 'Jelaskan harga, cakupan, durasi, jumlah revisi, dan output sebelum order.', 'Konfirmasi pilihan penawaran serta perubahan status penting.', 'Sediakan riwayat dan jalur bantuan untuk masalah/sengketa.', 'Jangan menampilkan pesanan atau kontak kepada pengguna yang tidak berhak.']
      };
      const key = Object.keys(profiles).find(k => type.includes(k));
      if (!key) return reply(`🧭 *AUDIT UX/UI RINGKAS*\nPilih: ${Object.keys(profiles).join(', ')}\nContoh: ${PREFIX}uxaudit bot\n\nChecklist ini membantu review awal, bukan pengganti pengujian pengguna.`);
      return reply(`🧭 *CHECKLIST UX/UI: ${key.toUpperCase()}*\n\n${profiles[key].map((item, i) => `${i + 1}. □ ${item}`).join('\n')}\n\nUji dengan 3–5 pengguna yang mewakili audiens; catat tugas yang gagal, waktu penyelesaian, dan bagian yang membingungkan.`);
    }
    case 'designqa':
    case 'checklist': {
      const type = String(args.join(' ') || 'poster').toLowerCase();
      const checks = {
        poster: ['Pesan utama terbaca dalam 3 detik', 'Hierarki judul, isi, dan detail jelas', 'Tanggal, lokasi, harga, dan CTA benar', 'Kontras teks/latar diperiksa', 'Safe margin dan bleed sesuai media', 'Resolusi dan mode warna sesuai tujuan ekspor', 'Font, foto, dan aset memiliki izin penggunaan'],
        sosial: ['Dimensi sesuai platform dan placement', 'Hook kuat pada area/slide pertama', 'Teks terbaca pada layar ponsel', 'CTA dan tautan benar', 'Safe area, crop, dan preview feed diperiksa', 'Warna dan tipografi konsisten', 'Caption, ejaan, alt text, dan jadwal diperiksa'],
        logo: ['Terbaca pada ukuran kecil dan favicon', 'Tersedia versi horizontal, vertikal, dan monokrom', 'Bentuk khas dan tetap jelas tanpa efek', 'Clear space dan ukuran minimum ditentukan', 'Diuji pada latar terang dan gelap', 'File vektor dan raster disiapkan', 'Font/aset dan hak penggunaan terdokumentasi'],
        cetak: ['Ukuran dokumen sesuai spesifikasi percetakan', 'Bleed dan safe area dikonfirmasi ke vendor', 'Resolusi gambar memadai pada ukuran cetak', 'Mode warna/profil ICC dikonfirmasi ke vendor', 'Font di-embed atau di-outline sesuai kebutuhan', 'Tautan, barcode, dan teks kecil diuji', 'PDF proof diperiksa sebelum produksi massal'],
        kemasan: ['Dieline dan ukuran berasal dari vendor', 'Panel depan/belakang dan lipatan tepat', 'Bleed, safe area, lem, dan area segel diperiksa', 'Informasi wajib, netto, barcode, dan legal copy benar', 'Warna varian dan hierarki produk konsisten', 'Mockup diuji pada bentuk fisik/ukuran nyata', 'Proof warna dan bahan disetujui sebelum produksi'],
        web: ['Grid dan breakpoint responsif konsisten', 'State default, hover, focus, disabled, loading, empty, error, success tersedia', 'Kontras dan fokus keyboard diperiksa', 'Komponen, spacing, dan token konsisten', 'Teks panjang dan konten nyata diuji', 'Navigasi keyboard dan zoom 200% diuji', 'Aset, font, dan spesifikasi developer lengkap'],
        app: ['Alur tugas utama dapat diselesaikan', 'State loading, empty, error, success, dan offline tersedia', 'Target sentuh dan safe area perangkat diperiksa', 'Kontras, ukuran teks, dan fokus aksesibel', 'Navigasi kembali dan konfirmasi aksi jelas', 'Layout diuji pada ukuran layar relevan', 'Komponen dan aset siap diserahkan ke developer'],
      };
      const key = Object.keys(checks).find(k => type.includes(k));
      if (!key) return reply(`🧪 *DESIGN QA CHECKLIST*\nPilih: ${Object.keys(checks).join(', ')}\nContoh: ${PREFIX}designqa cetak\nAlias: ${PREFIX}checklist poster\n\nTandai setiap butir setelah diperiksa. Checklist membantu review, bukan sertifikasi kualitas otomatis.`);
      return reply(`🧪 *DESIGN QA: ${key.toUpperCase()}*\n\n${checks[key].map((item, index) => `${index + 1}. □ ${item}`).join('\n')}\n\n*Keputusan akhir*\n□ Siap diserahkan\n□ Perlu revisi\n□ Menunggu konfirmasi klien/vendor\n\nChecklist ini panduan pemeriksaan manual. Untuk cetak, konfirmasikan spesifikasi final dengan vendor.`);
    }
    case 'handoff': {
      const raw = args.join(' ').trim();
      if (!raw) return reply(`📦 *DESIGN HANDOFF BUILDER*\nBuat spesifikasi serah-terima desain untuk klien atau developer.\n\nFormat: ${PREFIX}handoff <nama proyek> | <jenis> | <ukuran/platform> | <format ekspor> | <warna> | <font>\nContoh: ${PREFIX}handoff Kopi Senja | logo | master vector + avatar | SVG, PDF, PNG | #20382C, #F3F0E4 | Manrope\n\nKolom setelah nama proyek boleh dikosongkan; lengkapi sebelum file final dikirim.`);
      const fields = raw.split('|').map(value => value.trim());
      const project = (fields[0] || '').slice(0, 100);
      const kind = (fields[1] || 'Belum ditentukan').slice(0, 60);
      const size = (fields[2] || 'Konfirmasi ukuran/platform').slice(0, 100);
      const formats = (fields[3] || 'Tentukan format final').slice(0, 100);
      const colors = (fields[4] || 'Lampirkan token/kode warna').slice(0, 100);
      const fonts = (fields[5] || 'Cantumkan nama font dan lisensinya').slice(0, 100);
      if (!project || project.length < 2) return reply(`Nama proyek wajib diisi. Contoh: ${PREFIX}handoff Kopi Senja | logo | master vector | SVG, PDF, PNG`);
      const isUI = /web|app|ui|ux|dashboard|website/i.test(kind);
      const delivery = isUI
        ? ['Link file desain sumber dan struktur halaman/frame', 'Daftar komponen, variants, dan design tokens', 'Breakpoint dan perilaku responsive', 'State komponen: default, hover, focus, disabled, loading, empty, error, success', 'Interaksi, validasi, dan catatan perilaku', 'Ekspor aset, nama file, dan spesifikasi implementasi']
        : ['File master yang dapat diedit dan file final siap pakai', 'Variasi ukuran/versi dan preview/mockup', 'Safe area, clear space, atau bleed bila relevan', 'Daftar aset tertaut dan sumber/lisensinya', 'Panduan penggunaan dan hal yang tidak boleh diubah', 'Persetujuan proof dari klien/vendor sebelum produksi'];
      return reply(`📦 *DESIGN HANDOFF — ${project.toUpperCase()}*\n\n*Ringkasan proyek*\nJenis: ${kind}\nUkuran/platform: ${size}\nFormat ekspor: ${formats}\nWarna: ${colors}\nTipografi: ${fonts}\n\n*Paket yang diserahkan*\n${delivery.map((item, index) => `${index + 1}. □ ${item}`).join('\n')}\n\n*Catatan serah-terima*\n• File sumber: [tautan/lokasi]\n• File final: [tautan/lokasi]\n• Versi/tanggal: [versi dan tanggal]\n• Lisensi aset/font: [status dan bukti]\n• Batas penggunaan: [media, wilayah, durasi, atau ketentuan]\n• PIC dan kontak: [nama/kontak]\n• Persetujuan akhir: [nama dan tanggal]\n\n*Pemeriksaan sebelum kirim*\n□ Nama file konsisten dan tidak ada file sementara\n□ Semua tautan/aset dapat dibuka\n□ Font tertanam/terlampir atau instruksi pengganti tersedia\n□ File final dibuka ulang untuk memeriksa hasil ekspor\n\nTemplate ini tidak mengunggah atau mengemas file otomatis. Lampirkan file dan lengkapi detail lisensi/kontrak sebelum handoff.`);
    }
    case 'revision': return reply(`🧾 *FORMAT BRIEF REVISI*\n\n1. Bagian yang diubah: [judul/warna/foto/layout]\n2. Kondisi saat ini: [jelaskan singkat]\n3. Perubahan yang diminta: [spesifik dan terukur]\n4. Referensi/visual: [tautan atau gambar]\n5. Prioritas: [wajib / opsional]\n6. Batasan: [bagian yang jangan diubah]\n7. Deadline revisi: [tanggal]\n\nTips: kumpulkan revisi dalam satu pesan dan hindari instruksi yang saling bertentangan.`);
    case 'brandkit': {
      const raw = args.join(' ').trim();
      if (!raw) return reply(`Format: ${PREFIX}brandkit <nama brand> | <industri> | <audiens> | <kepribadian>\nContoh: ${PREFIX}brandkit Kopi Senja | kopi lokal | pekerja kreatif | natural premium\n\nIndustri, audiens, dan kepribadian boleh dikosongkan. Bot akan memberi arah awal palet, tipografi, tone, serta aturan visual.`);
      const [name, industry, audience, personality] = raw.split('|').map(value => value.trim());
      const kit = buildBrandKit({ name, industry, audience, personality });
      if (!kit.ok) return reply(`Nama brand wajib diisi. Contoh: ${PREFIX}brandkit Kopi Senja | kopi lokal | pekerja kreatif | natural premium`);
      return reply(formatBrandKit(kit));
    }
    case 'pricing': {
      const hours = Number(args[0]);
      const rate = Number(args[1]);
      const expenses = Number(args[2] || 0);
      if (!Number.isFinite(hours) || hours <= 0 || !Number.isFinite(rate) || rate <= 0 || !Number.isFinite(expenses) || expenses < 0) return reply(`💼 *KALKULATOR HARGA DESAIN*\nFormat: ${PREFIX}pricing <jam> <tarifPerJam> [biayaTambahan]\nContoh: ${PREFIX}pricing 5 50000 25000\n\nTarif akhir perlu mempertimbangkan revisi, lisensi, urgensi, kompleksitas, dan nilai penggunaan.`);
      const total = Math.round(hours * rate + expenses);
      return reply(`💼 *ESTIMASI HARGA DESAIN*\nWaktu: ${hours} jam\nTarif per jam: Rp${Math.round(rate).toLocaleString('id-ID')}\nBiaya tambahan: Rp${Math.round(expenses).toLocaleString('id-ID')}\n\n*Estimasi dasar: Rp${total.toLocaleString('id-ID')}*\n\nIni estimasi hitungan dasar, bukan patokan harga pasar. Tambahkan biaya revisi, lisensi, urgensi, dan nilai komersial bila relevan.`);
    }
    default: return;
  }
}
