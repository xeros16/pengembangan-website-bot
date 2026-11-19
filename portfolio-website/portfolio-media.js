import path from 'node:path';

export const PORTFOLIO_MAX_FILE_BYTES = 15 * 1024 * 1024;
export const PORTFOLIO_MAX_FILES = 5;
export const PORTFOLIO_MAX_REQUEST_BYTES = 80 * 1024 * 1024;
export const PORTFOLIO_MAX_PIXELS = 20_000_000;

const EXTENSION_FORMATS = new Map([
  ['.jpg', 'jpeg'],
  ['.jpeg', 'jpeg'],
  ['.png', 'png'],
  ['.webp', 'webp'],
  ['.svg', 'svg'],
]);
const MIME_FORMATS = new Map([
  ['image/jpeg', 'jpeg'],
  ['image/jpg', 'jpeg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
  ['image/svg+xml', 'svg'],
  ['application/svg+xml', 'svg'],
]);

export function detectPortfolioFormat({ filename = '', contentType = '' } = {}) {
  const extension = path.extname(String(filename || '').split(/[\\/]/).pop() || '').toLowerCase();
  const mime = String(contentType || '').split(';')[0].trim().toLowerCase();
  return EXTENSION_FORMATS.get(extension) || MIME_FORMATS.get(mime) || null;
}

export function validateSvgMarkup(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 20) {
    throw new Error('File SVG kosong atau tidak valid.');
  }
  if (buffer.length > PORTFOLIO_MAX_FILE_BYTES) {
    throw new Error('Setiap file maksimal 15 MB.');
  }

  let markup;
  try {
    markup = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
  } catch {
    throw new Error('SVG harus menggunakan encoding UTF-8 yang valid.');
  }

  const trimmed = markup.replace(/^\uFEFF/, '').trim();
  if (!/<svg\b/i.test(trimmed) || !/<\/svg\s*>/i.test(trimmed)) {
    throw new Error('File tidak memiliki struktur SVG yang valid.');
  }
  if (/<!DOCTYPE|<!ENTITY|<\?xml-stylesheet/i.test(trimmed)) {
    throw new Error('SVG dengan DTD, entity, atau stylesheet eksternal tidak diizinkan.');
  }
  if (/<\s*(?:script|foreignObject|iframe|object|embed|audio|video|link)\b/i.test(trimmed)) {
    throw new Error('SVG mengandung elemen aktif yang tidak diizinkan.');
  }
  if (/\bon[a-z][\w:.-]*\s*=/i.test(trimmed) || /\b(?:javascript|vbscript|file):/i.test(trimmed)) {
    throw new Error('SVG mengandung event atau skema aktif yang tidak diizinkan.');
  }
  if (/@import\b|expression\s*\(/i.test(trimmed)) {
    throw new Error('SVG mengandung CSS aktif yang tidak diizinkan.');
  }

  const references = [
    ...trimmed.matchAll(/\b(?:href|xlink:href|src)\s*=\s*(["'])(.*?)\1/gi),
  ];
  for (const match of references) {
    const reference = match[2].trim();
    if (reference.startsWith('#')) continue;
    if (/^data:image\/(?:png|jpe?g|webp);base64,/i.test(reference)) continue;
    throw new Error('SVG tidak boleh memuat tautan atau aset eksternal.');
  }

  const cssReferences = [...trimmed.matchAll(/url\(\s*(["']?)(.*?)\1\s*\)/gi)];
  for (const match of cssReferences) {
    const reference = String(match[2] || '').trim();
    if (!reference.startsWith('#') && !/^data:image\/(?:png|jpe?g|webp);base64,/i.test(reference)) {
      throw new Error('SVG hanya boleh menggunakan referensi internal atau gambar yang disematkan.');
    }
  }

  const elementCount = (trimmed.match(/<[a-z][\w:.-]*(?:\s|\/?>)/gi) || []).length;
  if (elementCount > 50_000) {
    throw new Error('Struktur SVG terlalu kompleks untuk diproses.');
  }
  return Buffer.from(trimmed, 'utf8');
}

export async function processPortfolioImageBuffer(buffer, {
  filename = '',
  contentType = '',
  cropMode = 'original',
} = {}) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new Error('File gambar kosong.');
  }
  if (buffer.length > PORTFOLIO_MAX_FILE_BYTES) {
    throw new Error('Setiap file maksimal 15 MB.');
  }

  const expectedFormat = detectPortfolioFormat({ filename, contentType });
  if (!expectedFormat) {
    throw new Error('Format file harus JPEG, PNG, WebP, atau SVG.');
  }

  const input = expectedFormat === 'svg' ? validateSvgMarkup(buffer) : buffer;
  let sharp;
  try {
    ({ default: sharp } = await import('sharp'));
  } catch {
    throw new Error('Mesin pengolah gambar Sharp belum siap. Jalankan npm ci di folder portfolio-website, lalu restart website.');
  }
  const options = { failOn: 'error', limitInputPixels: PORTFOLIO_MAX_PIXELS, ...(expectedFormat === 'svg' ? { density: 72 } : {}) };
  let metadata;
  try {
    metadata = await sharp(input, options).metadata();
  } catch {
    if (expectedFormat === 'svg') {
      throw new Error('SVG tidak dapat dirender. Coba ekspor ulang dari Figma sebagai SVG standar, tanpa aset eksternal, lalu unggah kembali.');
    }
    throw new Error('File gambar tidak dapat dibaca atau rusak.');
  }

  const actualFormat = metadata.format === 'jpg' ? 'jpeg' : metadata.format;
  if (actualFormat !== expectedFormat || !metadata.width || !metadata.height) {
    throw new Error('Isi file tidak sesuai dengan format yang dipilih.');
  }
  if (metadata.width * metadata.height > PORTFOLIO_MAX_PIXELS) {
    throw new Error('Resolusi gambar terlalu besar untuk diproses.');
  }

  const width = Math.max(1, Math.min(Number(metadata.width), 1800));
  const watermark = Buffer.from(
    `<svg width="${width}" height="90" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#000" opacity=".30"/><text x="${width - 24}" y="58" text-anchor="end" font-family="Arial" font-size="30" font-weight="700" fill="#fff">PIR VISUALS</text></svg>`,
  );
  const crop = ({
    square: { width: 1200, height: 1200 },
    landscape: { width: 1600, height: 900 },
    portrait: { width: 900, height: 1200 },
  })[cropMode];

  const pipeline = sharp(input, options).rotate();
  if (crop) pipeline.resize({ ...crop, fit: 'cover', position: 'attention', withoutEnlargement: true });
  else pipeline.resize({ width: 1800, height: 1800, fit: 'inside', withoutEnlargement: true });

  return pipeline
    .composite([{ input: watermark, gravity: 'south' }])
    .webp({ quality: 82, effort: 4 })
    .toBuffer();
}


export const PROFILE_AVATAR_MAX_FILE_BYTES = 5 * 1024 * 1024;
export const PROFILE_AVATAR_MAX_PIXELS = 100_000_000;
export const PROFILE_AVATAR_MAX_SIDE = 32_768;

function readRasterImageDimensions(buffer, format) {
  if (format === 'png') {
    const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    if (buffer.length < 33 || !buffer.subarray(0, 8).equals(signature) ||
        buffer.readUInt32BE(8) !== 13 || buffer.toString('ascii', 12, 16) !== 'IHDR') return null;
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    if (buffer.indexOf(Buffer.from('IEND')) < 0) return null;
    return { width, height };
  }

  if (format === 'jpeg') {
    if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;
    const sofMarkers = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
    let offset = 2;
    while (offset + 4 <= buffer.length) {
      if (buffer[offset] !== 0xff) { offset++; continue; }
      while (offset < buffer.length && buffer[offset] === 0xff) offset++;
      const marker = buffer[offset++];
      if (marker === 0xd8 || marker === 0xd9 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
      if (offset + 2 > buffer.length) return null;
      const segmentLength = buffer.readUInt16BE(offset);
      if (segmentLength < 2 || offset + segmentLength > buffer.length) return null;
      if (sofMarkers.has(marker)) {
        if (segmentLength < 7) return null;
        return { height: buffer.readUInt16BE(offset + 3), width: buffer.readUInt16BE(offset + 5) };
      }
      offset += segmentLength;
    }
    return null;
  }

  if (format === 'webp') {
    if (buffer.length < 30 || buffer.toString('ascii', 0, 4) !== 'RIFF' ||
        buffer.toString('ascii', 8, 12) !== 'WEBP') return null;
    let offset = 12;
    while (offset + 8 <= buffer.length) {
      const chunk = buffer.toString('ascii', offset, offset + 4);
      const chunkLength = buffer.readUInt32LE(offset + 4);
      const data = offset + 8;
      if (chunkLength < 1 || data + chunkLength > buffer.length) return null;
      if (chunk === 'VP8X' && chunkLength >= 10) {
        return {
          width: 1 + buffer.readUIntLE(data + 4, 3),
          height: 1 + buffer.readUIntLE(data + 7, 3),
        };
      }
      if (chunk === 'VP8L' && chunkLength >= 5 && buffer[data] === 0x2f) {
        const b1 = buffer[data + 1], b2 = buffer[data + 2], b3 = buffer[data + 3], b4 = buffer[data + 4];
        return {
          width: 1 + (((b2 & 0x3f) << 8) | b1),
          height: 1 + (((b4 & 0x0f) << 10) | (b3 << 2) | ((b2 & 0xc0) >> 6)),
        };
      }
      if (chunk === 'VP8 ' && chunkLength >= 10 &&
          buffer[data + 3] === 0x9d && buffer[data + 4] === 0x01 && buffer[data + 5] === 0x2a) {
        return {
          width: buffer.readUInt16LE(data + 6) & 0x3fff,
          height: buffer.readUInt16LE(data + 8) & 0x3fff,
        };
      }
      offset = data + chunkLength + (chunkLength % 2);
    }
    return null;
  }

  return null;
}

export async function processProfileAvatarBuffer(buffer, {
  filename = '',
  contentType = '',
  sharpFactory = null,
} = {}) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new Error('Pilih foto profil yang tidak kosong.');
  }
  if (buffer.length > PROFILE_AVATAR_MAX_FILE_BYTES) {
    throw new Error('Foto profil maksimal 5 MB.');
  }

  const expectedFormat = detectPortfolioFormat({ filename, contentType });
  if (!['jpeg', 'png', 'webp'].includes(expectedFormat || '')) {
    throw new Error('Foto profil harus berformat JPG, PNG, atau WebP.');
  }

  // Check the actual raster signature before any image decoder sees the bytes.
  // Small images can be kept as-is because the browser already crops them to
  // 512 × 512. Large Figma/Affinity exports are safely downsampled on the server.
  const dimensions = readRasterImageDimensions(buffer, expectedFormat);
  if (!dimensions || !dimensions.width || !dimensions.height) {
    throw new Error('Isi file foto tidak cocok dengan formatnya atau file PNG/JPG/WebP rusak. Pilih ulang file dari perangkat.');
  }
  const pixelCount = dimensions.width * dimensions.height;
  if (pixelCount > PROFILE_AVATAR_MAX_PIXELS ||
      dimensions.width > PROFILE_AVATAR_MAX_SIDE || dimensions.height > PROFILE_AVATAR_MAX_SIDE) {
    throw new Error('Resolusi foto profil terlalu besar. Batas maksimal 100 megapiksel dan 32.768 piksel per sisi.');
  }

  if (pixelCount > PORTFOLIO_MAX_PIXELS ||
      dimensions.width > 8192 || dimensions.height > 8192) {
    let sharp = sharpFactory;
    if (!sharp) {
      try {
        ({ default: sharp } = await import('sharp'));
      } catch {
        throw new Error('Foto profil beresolusi tinggi perlu diperkecil oleh mesin gambar. Jalankan npm ci di folder portfolio-website, lalu restart website.');
      }
    }
    try {
      const resized = await sharp(buffer, {
        failOn: 'error',
        limitInputPixels: PROFILE_AVATAR_MAX_PIXELS,
      })
        .rotate()
        .resize(512, 512, { fit: 'cover', position: 'attention' })
        .webp({ quality: 88, effort: 4 })
        .toBuffer();
      if (!Buffer.isBuffer(resized) || resized.length === 0) throw new Error('Hasil optimasi kosong.');
      return { buffer: resized, format: 'webp', width: 512, height: 512 };
    } catch {
      throw new Error('Foto profil beresolusi tinggi tidak dapat diproses. Simpan ulang sebagai PNG, JPG, atau WebP standar, lalu coba lagi.');
    }
  }

  return {
    buffer,
    format: expectedFormat,
    width: dimensions.width,
    height: dimensions.height,
  };
}
