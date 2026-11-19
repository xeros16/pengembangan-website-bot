export const DESIGN_CATEGORIES = [
  'Logo & Branding', 'GFX & Gaming Design', 'Poster & Banner', 'Social Media Design',
  'Thumbnail YouTube', 'UI/UX Design', 'Pixel Art', 'Illustration', 'Typography',
  'Motion Graphic', 'Photo Manipulation', 'Lainnya',
];

export const DESIGN_STYLES = [
  'Minimalist', 'Elegant & Luxury', 'Vintage & Retro', 'Anime', 'Pastel',
  'Futuristic', 'Cyberpunk', 'Pixel Art', 'Corporate', 'Cute & Kawaii',
];

export function normalizeTags(value) {
  return [...new Set(String(value || '').split(',').map(v => v.trim()).filter(Boolean).map(v => v.slice(0, 50)))].slice(0, 12);
}

export function normalizePublicWhatsApp(value) {
  const raw = String(value || '').trim();
  if (!raw || ['-', 'off', 'hapus', 'nonaktif', 'none'].includes(raw.toLowerCase())) return '';
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('0')) digits = `62${digits.slice(1)}`;
  if (digits.length < 8 || digits.length > 15) return null;
  return digits;
}

function safePublicUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return '';
    return url.toString();
  } catch {
    return '';
  }
}

export function formatProfile(profile, workCount = 0, { includeContact = false } = {}) {
  const lines = [
    `╭━━〔 🎨 DESIGNER PORTFOLIO 〕━━╮`,
    `┃ 👤 ${profile.displayName}`,
    `┃ 🆔 ${profile.designerId}`,
    ...(profile.isVerified ? ['┃ ✓ PROFIL DITINJAU PIR'] : []),
    ...(profile.isFeatured ? ['┃ ★ FEATURED DESIGNER'] : []),
    `┃ 🎯 ${profile.specialties?.length ? profile.specialties.join(', ') : 'Spesialisasi belum diisi'}`,
    ...(profile.location ? [`┃ 📍 ${profile.location}`] : []),
    `┃ 🖼️ ${workCount} karya disetujui`,
    `┃ 🌐 Profil: ${profile.isPublic === false ? 'Disembunyikan' : 'Publik'}`,
  ];
  if (profile.bio) lines.push(`┃ 📝 ${profile.bio}`);
  const socialUrl = (value, base) => {
    const raw = String(value || '').trim().replace(/^@/, '');
    if (!raw) return '';
    return safePublicUrl(/^https?:\/\//i.test(raw) ? raw : `${base}${encodeURIComponent(raw)}`);
  };
  const instagram = socialUrl(profile.instagram, 'https://instagram.com/');
  if (instagram) lines.push(`┃ 📷 Instagram: ${instagram}`);
  const behance = socialUrl(profile.behance, 'https://www.behance.net/');
  if (behance) lines.push(`┃ 🎨 Behance: ${behance}`);
  const dribbble = socialUrl(profile.dribbble, 'https://dribbble.com/');
  if (dribbble) lines.push(`┃ 🏀 Dribbble: ${dribbble}`);
  const website = safePublicUrl(profile.website);
  if (website) lines.push(`┃ 🌐 Website: ${website}`);
  if (includeContact) {
    const phone = normalizePublicWhatsApp(profile.publicWhatsApp) || normalizePublicWhatsApp(profile.contactPhone);
    lines.push('┃');
    lines.push('┃ 📩 HUBUNGI DESAINER LANGSUNG');
    if (phone) lines.push(`┃ WhatsApp: https://wa.me/${phone}`);
    if (!phone && !instagram && !behance && !dribbble && !website) {
      lines.push('┃ Kontak belum dicantumkan oleh desainer.');
    }
    lines.push('┃ PIR Visuals hanya direktori portofolio; komunikasi dan kesepakatan dilakukan langsung.');
  }
  lines.push('╰━━━━━━━━━━━━━━━━━━━━━━╯');
  return lines.join('\n');
}

export function getCommunityGroupIds(raw = '') {
  return [...new Set(String(raw).split(',').map(v => v.trim()).filter(v => /^\d+(?:-\d+)?@g\.us$/.test(v)))];
}

export function isDesignerId(value) {
  return /^DSN-[A-F0-9]{4,16}$/i.test(String(value || '').trim());
}

export function isPortfolioItemId(value) {
  return /^ART-[A-F0-9]{4,16}$/i.test(String(value || '').trim());
}

export function isMarketplaceReportId(value) {
  return /^RPT-[A-F0-9]{4,16}$/i.test(String(value || '').trim());
}

export function isValidReportReason(value) {
  const reason = String(value || '').trim();
  return reason.length >= 5 && reason.length <= 500;
}
