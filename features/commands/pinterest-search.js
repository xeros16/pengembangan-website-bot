import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const defaultFetch = globalThis.fetch;

export const PINTEREST_SEARCH_COMMANDS = new Set(['pinsearch', 'pinterest']);
export const BING_IMAGE_SEARCH_COMMANDS = new Set(['bingsearch', 'bingimages']);
const MAX_QUERY_LENGTH = 100;
const MAX_RESULTS = 5;
const MAX_CANDIDATES = 25;
const DEFAULT_RESULTS = 1;
const MAX_HISTORY_HASHES = 2000;
const MAX_PAGE_BYTES = 15 * 1024 * 1024;
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const IMAGE_CONTENT_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']);

function decodeHtml(value) {
  return String(value || '')
    .replace(/\\u002F/gi, '/')
    .replace(/\\\//g, '/')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x2F;/gi, '/')
    .replace(/&#47;/gi, '/')
    .replace(/\\u003A/gi, ':')
    .replace(/\\u0026/gi, '&');
}

export function extractBingImageUrls(html, limit = MAX_RESULTS) {
  const source = decodeHtml(String(html || '')).replace(/\\u002F/gi, '/').replace(/\\\//g, '/');
  const candidates = [];
  const patterns = [
    /["']murl["']\s*:\s*["']((?:https?:\\?\/\\?\/|https?:\/\/)[^"'\\\s<>]+)["']/gi,
    /["']contentUrl["']\s*:\s*["'](https?:[^"'\\\s<>]+)["']/gi,
    /["']imgurl["']\s*:\s*["'](https?:[^"'\\\s<>]+)["']/gi,
  ];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(source))) {
      let raw = match[1].replace(/\\u0026/gi, '&').replace(/\\u003d/gi, '=').replace(/\\\\/g, '');
      try {
        const url = new URL(raw);
        if (url.protocol !== 'https:' || !url.hostname || url.username || url.password) continue;
        if (/^(localhost|.*\.localhost|.*\.local)$/i.test(url.hostname)) continue;
        if (/\.(?:svg|ico)(?:$|\?)/i.test(url.pathname)) continue;
        url.hash = '';
        candidates.push(url.toString());
      } catch { /* malformed result URL */ }
    }
  }
  return [...new Set(candidates)].slice(0, Math.max(1, Math.min(MAX_CANDIDATES, limit)));
}

async function readSearchPage(response, maxBytes = MAX_PAGE_BYTES) {
  const html = await response.text();
  if (Buffer.byteLength(html, 'utf8') > maxBytes) throw new Error('Halaman pencarian terlalu besar untuk diproses.');
  return html;
}

// Pinterest public-page extraction: no API token. Pinterest may block automated requests.
export function extractPinterestImageDetails(html, searchUrl, limit = MAX_CANDIDATES) {
  const source = decodeHtml(String(html || '')).replace(/\\u002F/gi, '/').replace(/\\\//g, '/');
  const candidates = [];
  const pagePinId = (source.match(/(?:\"id\"|\"pin_id\")\s*:\s*\"?(\d{6,})\"?/) || [])[1] || '';
  const add = (raw, pinId = '') => {
    if (!raw || typeof raw !== 'string') return;
    raw = raw.replace(/\\u0026/gi, '&').replace(/\\u003d/gi, '=').replace(/&amp;/g, '&');
    pinId = pinId || pagePinId;
    try {
      const u = new URL(raw);
      if (u.protocol !== 'https:' || !/(^|\.)i\.pinimg\.com$/i.test(u.hostname)) return;
      if (!/\.(jpg|jpeg|png|webp)(?:$|\?)/i.test(u.pathname)) return;
      // Ignore tiny thumbnail variants when an original can be inferred.
      u.pathname = u.pathname.replace(/\/(?:75x75_RS|136x136|170x|236x| thumbnails?)(?:_RS)?\//i, '/originals/');
      u.hash = '';
      candidates.push({ url: u.toString(), pinId, source: 'Pinterest public pin', pinUrl: pinId ? `https://www.pinterest.com/pin/${pinId}/` : searchUrl, searchUrl });
    } catch { /* malformed candidate */ }
  };
  // Prefer Pinterest's embedded pin JSON and original image rendition.
  const pinBlocks = source.match(/\{[^{}]{0,50000}(?:\"images\"|\"image\")\s*:[^{}]{0,50000}\}/g) || [];
  for (const block of pinBlocks) {
    const id = (block.match(/\"id\"\s*:\s*\"?(\d{6,})\"?/) || [])[1] || '';
    const urls = [...block.matchAll(/\"url\"\s*:\s*\"(https?:[^\"\s]+i\.pinimg\.com[^\"\s]*)\"/gi)];
    for (const m of urls) add(m[1], id);
  }
  // Fallback to structured image URLs only; never accept Open Graph or arbitrary external images.
  const direct = [...source.matchAll(/https?:[^\"'\s<>]+i\.pinimg\.com[^\"'\s<>]+\.(?:jpg|jpeg|png|webp)(?:\?[^\"'\s<>]*)?/gi)];
  for (const m of direct) add(m[0]);
  const unique = [];
  const seen = new Set();
  for (const item of candidates) {
    const key = item.url.replace(/\/(?:originals|\d+x\d+_RS|\d+x|75x75_RS)\//i, '/');
    if (seen.has(key)) continue;
    seen.add(key); unique.push(item);
    if (unique.length >= Math.max(1, Math.min(MAX_CANDIDATES, limit))) break;
  }
  return unique;
}

export async function searchPinterestImages(query, { limit = MAX_RESULTS, fetchImpl = defaultFetch } = {}) {
  const cleanQuery = String(query || '').trim().replace(/\s+/g, ' ').slice(0, MAX_QUERY_LENGTH);
  if (!cleanQuery) throw new Error('Masukkan kata kunci pencarian.');
  const searchUrl = `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(cleanQuery)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetchImpl(searchUrl, { headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9,id;q=0.8'
    }, redirect: 'follow', signal: controller.signal });
    if (!response.ok) throw new Error(`Pinterest membalas HTTP ${response.status}.`);
    const finalUrl = new URL(response.url || searchUrl);
    if (!/(^|\.)pinterest\.com$/i.test(finalUrl.hostname)) throw new Error('Pinterest mengalihkan pencarian ke halaman yang tidak dikenal.');
    const html = await readSearchPage(response);
    if (/captcha|challenge|verify you are human/i.test(html) && !/i\.pinimg\.com/i.test(html)) throw new Error('Pinterest menampilkan CAPTCHA atau membatasi akses otomatis. Coba lagi nanti.');
    const imageDetails = extractPinterestImageDetails(html, searchUrl, Math.max(limit * 5, MAX_CANDIDATES));
    const imageUrls = imageDetails.map(item => item.url);
    return { query: cleanQuery, searchUrl, imageUrls, imageDetails, source: 'Pinterest public page' };
  } finally { clearTimeout(timeout); }
}

export async function searchBingImages(query, { limit = MAX_RESULTS, fetchImpl = defaultFetch } = {}) {
  const cleanQuery = String(query || '').trim().replace(/\s+/g, ' ').slice(0, MAX_QUERY_LENGTH);
  if (!cleanQuery) throw new Error('Masukkan kata kunci pencarian.');
  const searchUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(cleanQuery)}&form=HDRSC3`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetchImpl(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
      }, redirect: 'follow', signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Bing Images membalas HTTP ${response.status}.`);
    const finalUrl = new URL(response.url || searchUrl);
    if (!(finalUrl.hostname === 'bing.com' || finalUrl.hostname.endsWith('.bing.com'))) throw new Error('Pencarian dialihkan ke alamat yang tidak dikenal.');
    const html = await readSearchPage(response);
    const imageUrls = extractBingImageUrls(html, MAX_CANDIDATES);
    const imageDetails = imageUrls.map(url => ({ url, source: 'Bing Images', searchUrl }));
    return { query: cleanQuery, searchUrl, imageUrls, imageDetails, source: 'Bing Images' };
  } finally {
    clearTimeout(timeout);
  }
}

function getImageDimensions(buffer) {
  if (!Buffer.isBuffer(buffer)) return null;
  // PNG
  if (buffer.length >= 24 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }
  // GIF
  if (buffer.length >= 10 && /^GIF8[79]a$/.test(buffer.toString('ascii', 0, 6))) {
    return { width: buffer.readUInt16LE(6), height: buffer.readUInt16LE(8) };
  }
  // JPEG: scan markers until a Start Of Frame segment is found.
  if (buffer.length > 4 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < buffer.length) {
      if (buffer[offset] !== 0xff) { offset++; continue; }
      const marker = buffer[offset + 1];
      if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) { offset += 2; continue; }
      if (offset + 4 > buffer.length) break;
      const length = buffer.readUInt16BE(offset + 2);
      if (length < 2 || offset + 2 + length > buffer.length) break;
      if ([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker) && length >= 7) {
        return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
      }
      offset += 2 + length;
    }
  }
  // WebP VP8X canvas dimensions.
  if (buffer.length >= 30 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP' && buffer.toString('ascii', 12, 16) === 'VP8X') {
    const width = 1 + buffer[24] + (buffer[25] << 8) + (buffer[26] << 16);
    const height = 1 + buffer[27] + (buffer[28] << 8) + (buffer[29] << 16);
    return { width, height };
  }
  return null;
}

export async function fetchPinterestImage(url, fetchImpl = defaultFetch) {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' || !parsed.hostname || parsed.username || parsed.password || parsed.port) throw new Error('Alamat gambar tidak aman atau tidak didukung.');
  if (/^(localhost|.*\.localhost|.*\.local)$/i.test(parsed.hostname) || /^(127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(parsed.hostname) || /^172\.(1[6-9]|2\d|3[01])\./.test(parsed.hostname)) throw new Error('Alamat gambar lokal tidak diizinkan.');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetchImpl(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36', Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8' }, redirect: 'follow', signal: controller.signal });
    if (!response.ok) throw new Error(`Server gambar membalas HTTP ${response.status}.`);
    const finalUrl = new URL(response.url || url);
    if (finalUrl.protocol !== 'https:' || !finalUrl.hostname || finalUrl.username || finalUrl.password || /^(localhost|.*\.localhost|.*\.local)$/i.test(finalUrl.hostname) || /^(127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(finalUrl.hostname) || /^172\.(1[6-9]|2\d|3[01])\./.test(finalUrl.hostname)) throw new Error('Pengalihan gambar ke host yang tidak diizinkan.');
    const contentType = String(response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    if (!IMAGE_CONTENT_TYPES.has(contentType)) throw new Error(`Server tidak mengirim berkas gambar (${contentType || 'tipe tidak diketahui'}).`);
    const declaredLength = Number(response.headers.get('content-length') || 0);
    if (declaredLength > MAX_IMAGE_BYTES) throw new Error('Gambar melebihi batas 20 MB.');
    const buffer = Buffer.from(await response.arrayBuffer());
    if (!buffer.length || buffer.length > MAX_IMAGE_BYTES) throw new Error('Ukuran gambar kosong atau melebihi 20 MB.');
    const isJpeg = buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    const isPng = buffer.length > 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const isWebp = buffer.length > 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
    const isGif = buffer.length > 6 && /^GIF8[79]a$/.test(buffer.toString('ascii', 0, 6));
    if (!isJpeg && !isPng && !isWebp && !isGif) throw new Error('Respons bukan berkas gambar yang valid.');
    return buffer;
  } finally {
    clearTimeout(timeout);
  }
}

function canonicalImageUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    url.hash = '';
    // Ignore common analytics parameters while preserving parameters that may identify the image itself.
    for (const key of [...url.searchParams.keys()]) {
      if (/^(utm_.+|fbclid|gclid|ref|source)$/i.test(key)) url.searchParams.delete(key);
    }
    url.searchParams.sort();
    return url.toString();
  } catch { return String(rawUrl || '').trim(); }
}

async function readSentImageHistory(historyPath) {
  try {
    const parsed = JSON.parse(await readFile(historyPath, 'utf8'));
    return Array.isArray(parsed.urls) ? parsed.urls.filter(value => typeof value === 'string') : [];
  } catch (error) {
    if (error.code !== 'ENOENT') console.warn('[IMAGE SEARCH HISTORY] Tidak dapat membaca riwayat:', error.message);
    return [];
  }
}

async function writeSentImageHistory(historyPath, urls) {
  try {
    await mkdir(path.dirname(historyPath), { recursive: true });
    await writeFile(historyPath, JSON.stringify({ version: 2, urls: urls.slice(-MAX_HISTORY_HASHES) }, null, 2), 'utf8');
  } catch (error) {
    console.warn('[IMAGE SEARCH HISTORY] Tidak dapat menyimpan riwayat:', error.message);
  }
}

export async function handlePinterestSearchCommands(ctx) {
  const { command, args, reply, sock, remoteJid, msg, PREFIX = '.', fetchImpl = defaultFetch } = ctx;
  const isBing = BING_IMAGE_SEARCH_COMMANDS.has(command);
  if (!PINTEREST_SEARCH_COMMANDS.has(command) && !isBing) return false;

  const input = [...args];
  let limit = DEFAULT_RESULTS;
  if (input.length && /^\d+$/.test(input[input.length - 1])) {
    limit = Math.max(1, Math.min(MAX_RESULTS, Number(input.pop())));
  }
  const query = input.join(' ').trim();
  const commandName = isBing ? 'bingsearch' : 'pinsearch';
  if (!query) {
    return reply(
      `🔎 *PENCARIAN ${isBing ? 'GAMBAR BING' : 'PINTEREST'}*\n\n` +
      `Contoh: ${PREFIX}${commandName} Yae Miko` +
      (isBing ? `\nAtur jumlah hasil: ${PREFIX}${commandName} Yae Miko 3\nDefault 1 gambar; maksimal 5 gambar.` : '') +
      (isBing ? '\nBing Images mengirim foto jika URL gambar valid.' : '\nTanpa API: mencoba membaca gambar pin publik dan mengirim foto jika Pinterest mengizinkan akses. Maksimal 5 gambar.')
    );
  }

  await reply(`🔎 Sedang mencari ${limit} gambar *${query.slice(0, 100)}* di ${isBing ? 'Bing Images' : 'Pinterest'}...`);
  try {
    const result = isBing
      ? await searchBingImages(query, { limit, fetchImpl })
      : await searchPinterestImages(query, { limit, fetchImpl });
    if (!isBing && !result.imageUrls.length) {
      return reply(`❌ Pinterest tidak memberikan URL gambar pin publik yang bisa diunduh. Pinterest mungkin mengubah halaman atau membatasi akses otomatis.\n\nBuka pencarian: ${result.searchUrl}`);
    }
    if (!result.imageUrls.length) {
      return reply(`❌ Bing Images tidak memberikan URL gambar yang bisa diproses. Coba kata kunci lain atau periksa akses jaringan.\n\nPencarian Bing: ${result.searchUrl}`);
    }

    let sent = 0;
    const historyPath = ctx.pinsearchHistoryPath || ctx.imageSearchHistoryPath || path.resolve(process.cwd(), 'data', 'pinsearch-history.json');
    const savedUrls = await readSentImageHistory(historyPath);
    const seenUrls = new Set(savedUrls.map(canonicalImageUrl));
    const candidates = result.imageDetails || result.imageUrls.map(url => ({ url, source: isBing ? 'Bing Images' : 'Pinterest public pin', searchUrl: result.searchUrl }));

    for (const candidate of candidates) {
      if (sent >= limit) break;
      const { url } = candidate;
      const urlKey = canonicalImageUrl(url);
      if (seenUrls.has(urlKey)) {
        console.info(`[${isBing ? 'BINGSEARCH' : 'PINSEARCH'}] Lewati URL yang pernah dikirim: ${url}`);
        continue;
      }
      try {
        const image = await fetchPinterestImage(url, fetchImpl);
        const dimensions = getImageDimensions(image);
        if (dimensions && (dimensions.width < 300 || dimensions.height < 300)) {
          console.warn(`[${isBing ? 'BINGSEARCH' : 'PINSEARCH'}] Lewati gambar kecil ${dimensions.width}x${dimensions.height}: ${url}`);
          continue;
        }
        const nextIndex = sent + 1;
        const sourceLabel = isBing ? 'Bing Images' : 'Pinterest';
        const caption = `🖼️ *HASIL ${isBing ? 'BINGSEARCH' : 'PINSEARCH'}: ${result.query}*\nGambar ${nextIndex}/${limit}\nSumber: ${sourceLabel}\n${candidate.pinUrl ? `Pin: ${candidate.pinUrl}\n` : ''}URL gambar: ${url}\nHalaman pencarian: ${candidate.searchUrl || result.searchUrl}\n\nGunakan gambar sesuai hak cipta dan izin pemiliknya.`;
        await sock.sendMessage(remoteJid, { image, caption }, { quoted: msg });
        sent += 1;
        seenUrls.add(urlKey);
        await writeSentImageHistory(historyPath, [...seenUrls]);
      } catch (error) {
        console.warn(`[${isBing ? 'BINGSEARCH' : 'PINSEARCH'} IMAGE]`, error.message);
      }
    }
    if (!sent) return reply(`❌ Tidak ada gambar ${isBing ? 'Bing' : 'Pinterest'} baru yang valid untuk dikirim. URL duplikat, gambar kecil, atau unduhan gagal dilewati.\n\nPencarian: ${result.searchUrl}`);
    if (sent < limit) await reply(`⚠️ Hanya ${sent}/${limit} gambar baru berhasil dikirim dari ${isBing ? 'Bing' : 'Pinterest'}. URL duplikat, gambar kecil, atau unduhan gagal dilewati.`);
    return true;
  } catch (error) {
    console.error(`[${isBing ? 'BINGSEARCH' : 'PINSEARCH'}]`, error.message);
    return reply(`❌ Pencarian ${isBing ? 'Bing Images' : 'Pinterest'} gagal: ${error.message}\nCoba lagi nanti.\n\nPencarian: https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query.slice(0, MAX_QUERY_LENGTH))}`);
  }
}
