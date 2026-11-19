// Music discovery powered by Apple's public iTunes Search / Lookup API.
// Search and metadata only: this module does not download or redistribute audio previews.
const API_BASE = 'https://itunes.apple.com';
const MIN_REQUEST_INTERVAL_MS = 180;
const REQUEST_TIMEOUT_MS = 10_000;
const CACHE_LIMIT = 120;
const CACHE_TTL_MS = 5 * 60 * 1000;

export const MUSIC_DISCOVERY_COMMANDS = new Set(['music']);

const responseCache = new Map();
let requestChain = Promise.resolve();
let lastRequestAt = 0;

function cleanText(value, maxLength = 180) {
  return String(value ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/[*_~`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function readCache(key) {
  const entry = responseCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    responseCache.delete(key);
    return null;
  }
  responseCache.delete(key);
  responseCache.set(key, entry);
  return entry.value;
}

function writeCache(key, value) {
  responseCache.delete(key);
  responseCache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  while (responseCache.size > CACHE_LIMIT) {
    responseCache.delete(responseCache.keys().next().value);
  }
}

function enqueueRequest(fetchImpl, url, parsePayload = payload => payload?.results) {
  const task = requestChain.then(async () => {
    const waitMs = Math.max(0, MIN_REQUEST_INTERVAL_MS - (Date.now() - lastRequestAt));
    if (waitMs) await new Promise(resolve => setTimeout(resolve, waitMs));
    lastRequestAt = Date.now();

    const signal = typeof globalThis.AbortSignal?.timeout === 'function'
      ? globalThis.AbortSignal.timeout(REQUEST_TIMEOUT_MS)
      : undefined;
    const response = await fetchImpl(url, {
      method: 'GET',
      headers: { accept: 'application/json' },
      ...(signal ? { signal } : {}),
    });
    if (!response?.ok) {
      const error = new Error(`Music provider returned HTTP ${response?.status || 'unknown'}.`);
      error.status = Number(response?.status || 0);
      throw error;
    }
    const payload = await response.json();
    const results = parsePayload(payload);
    if (!Array.isArray(results)) {
      throw new Error('Music provider returned an unexpected response.');
    }
    return results;
  });
  requestChain = task.catch(() => undefined);
  return task;
}

async function requestMusic(url, cacheKey, fetchImpl, parsePayload) {
  const cached = readCache(cacheKey);
  if (cached !== null) return cached;
  const results = await enqueueRequest(fetchImpl, url, parsePayload);
  writeCache(cacheKey, results);
  return results;
}

function getFetch(ctx) {
  const fetchImpl = ctx.fetch || ctx.fetchImpl || globalThis.fetch;
  return typeof fetchImpl === 'function' ? fetchImpl : null;
}

function isExplicit(item) {
  const flags = [item?.trackExplicitness, item?.collectionExplicitness]
    .map(value => String(value || '').toLowerCase());
  return flags.includes('explicit');
}

function safeAppleUrl(value) {
  try {
    const url = new URL(String(value || ''));
    return url.protocol === 'https:' && /(^|\.)apple\.com$/i.test(url.hostname) ? url.toString() : '';
  } catch {
    return '';
  }
}

function formatDuration(milliseconds) {
  const total = Math.floor(Number(milliseconds) / 1000);
  if (!Number.isFinite(total) || total < 1) return 'Durasi tidak tersedia';
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function formatYear(value) {
  const match = String(value || '').match(/^(\d{4})/);
  return match ? match[1] : 'tahun tidak diketahui';
}

function formatSong(item, index) {
  const title = cleanText(item.trackName || item.trackCensoredName || 'Judul tidak tersedia', 120);
  const artist = cleanText(item.artistName || 'Artis tidak diketahui', 100);
  const album = cleanText(item.collectionName || '', 100);
  const genre = cleanText(item.primaryGenreName || '', 50);
  const url = safeAppleUrl(item.trackViewUrl);
  const trackId = Number.isSafeInteger(Number(item.trackId)) && Number(item.trackId) > 0 ? `Track ID: ${Number(item.trackId)}` : '';
  const meta = [
    trackId,
    album ? `Album: ${album}` : '',
    genre,
    formatYear(item.releaseDate),
    formatDuration(item.trackTimeMillis),
  ].filter(Boolean).join(' • ');
  return `${index + 1}. *${title}*\n   Artis: ${artist}\n   ${meta}${url ? `\n   ${url}` : ''}`;
}

function formatAlbum(item, index) {
  const title = cleanText(item.collectionName || 'Album tidak tersedia', 120);
  const artist = cleanText(item.artistName || 'Artis tidak diketahui', 100);
  const tracks = Number.isFinite(Number(item.trackCount)) ? `${Number(item.trackCount)} track` : '';
  const genre = cleanText(item.primaryGenreName || '', 50);
  const url = safeAppleUrl(item.collectionViewUrl);
  return `${index + 1}. *${title}*\n   Artis: ${artist}\n   ${[genre, formatYear(item.releaseDate), tracks].filter(Boolean).join(' • ')}${url ? `\n   ${url}` : ''}`;
}

function formatArtist(item, index) {
  const name = cleanText(item.artistName || 'Artis tidak tersedia', 120);
  const genre = cleanText(item.primaryGenreName || '', 60);
  const url = safeAppleUrl(item.artistLinkUrl);
  return `${index + 1}. *${name}*${genre ? `\n   Genre: ${genre}` : ''}${url ? `\n   ${url}` : ''}`;
}

function formatTopSong(item, index) {
  const title = cleanText(item?.['im:name']?.label || 'Judul tidak tersedia', 120);
  const artist = cleanText(item?.['im:artist']?.label || 'Artis tidak diketahui', 100);
  const album = cleanText(item?.['im:collection']?.['im:name']?.label || '', 100);
  const url = safeAppleUrl(item?.link?.find?.(link => link?.attributes?.rel === 'alternate')?.attributes?.href || item?.id?.label);
  return `${index + 1}. *${title}*\n   Artis: ${artist}${album ? `\n   Album: ${album}` : ''}${url ? `\n   ${url}` : ''}`;
}

function formatDetail(item) {
  if (!item || !Number.isSafeInteger(Number(item.trackId))) {
    return 'Detail lagu tidak ditemukan. Periksa ID iTunes lalu coba lagi.';
  }
  if (isExplicit(item)) {
    return 'Detail ini tidak ditampilkan karena provider menandai kontennya sebagai explicit.';
  }
  const url = safeAppleUrl(item.trackViewUrl);
  return [
    `🎵 *${cleanText(item.trackName || item.trackCensoredName || 'Judul tidak tersedia', 140)}*`,
    `Track ID: ${Number(item.trackId)}`,
    `Artis: ${cleanText(item.artistName || 'Artis tidak diketahui', 120)}`,
    item.collectionName ? `Album: ${cleanText(item.collectionName, 120)}` : '',
    item.primaryGenreName ? `Genre: ${cleanText(item.primaryGenreName, 60)}` : '',
    `Rilis: ${formatYear(item.releaseDate)}`,
    `Durasi: ${formatDuration(item.trackTimeMillis)}`,
    url ? `Apple Music/iTunes: ${url}` : '',
    '',
    '_Metadata dari Apple iTunes Search API. Bot tidak mengirim atau mengunduh preview audio._',
  ].filter(Boolean).join('\n');
}

function usage(prefix = '.') {
  return [
    '🎧 *MUSIC DISCOVERY*',
    '',
    `• ${prefix}music cari <judul/artis> — cari lagu`,
    `• ${prefix}music album <judul/artis> — cari album`,
    `• ${prefix}music artis <nama> — cari profil artis`,
    `• ${prefix}music detail <track ID> — detail lagu`,
    `• ${prefix}music preview <tautan lagu Apple Music> — kirim preview audio resmi Apple jika tersedia`,
    `• ${prefix}music top — 10 lagu teratas Apple Music/iTunes Indonesia`,
    `• ${prefix}song <judul/artis> — pencarian audio melalui yt-dlp`,
    `• ${prefix}dl audio <tautan> — unduh audio dari tautan publik yang diizinkan`,
    '',
    'Preview Apple hanya cuplikan publik yang disediakan Apple (umumnya sekitar 30 detik), bukan lagu penuh. PIR tidak melewati DRM atau langganan Apple Music.',
  ].join('\n');
}

function providerError(error) {
  if (Number(error?.status) === 429) return 'Penyedia musik sedang membatasi permintaan. Tunggu sebentar sebelum mencoba lagi.';
  if (Number(error?.status) >= 500) return 'Layanan pencarian musik sedang bermasalah. Coba lagi beberapa saat.';
  if (error?.name === 'TimeoutError' || error?.name === 'AbortError') return 'Pencarian musik melewati batas waktu. Coba lagi dengan koneksi yang lebih stabil.';
  return 'Data musik belum dapat diambil. Periksa koneksi bot lalu coba lagi.';
}

function buildSearchUrl(query, entity) {
  const url = new URL('/search', API_BASE);
  url.search = new URLSearchParams({
    term: query,
    entity,
    media: 'music',
    country: 'id',
    limit: '8',
  }).toString();
  return url.toString();
}

function parseAppleMusicTrackId(rawUrl) {
  try {
    const url = new URL(String(rawUrl || ''));
    const hostname = url.hostname.toLowerCase();
    if (url.protocol !== 'https:' || !['music.apple.com', 'itunes.apple.com', 'www.itunes.apple.com'].includes(hostname)) return null;
    const queryTrackId = url.searchParams.get('i');
    const lastSegment = url.pathname.split('/').filter(Boolean).at(-1) || '';
    const pathTrackId = url.pathname.includes('/song/') ? lastSegment : '';
    const id = queryTrackId || pathTrackId;
    return /^\d{5,20}$/.test(String(id || '')) ? String(id) : null;
  } catch {
    return null;
  }
}

function safeApplePreviewUrl(value) {
  try {
    const url = new URL(String(value || ''));
    const host = url.hostname.toLowerCase();
    const allowedHosts = new Set([
      'audio-ssl.itunes.apple.com',
      'audio.itunes.apple.com',
      'is1-ssl.mzstatic.com',
      'audio.mzstatic.com',
    ]);
    return url.protocol === 'https:' && allowedHosts.has(host) ? url.toString() : '';
  } catch {
    return '';
  }
}

function previewFileName(track) {
  const cleanPart = value => cleanText(value, 60).replace(/[<>:"/\\|?*]/g, '-').replace(/\.+$/g, '').trim();
  const title = cleanPart(track?.trackName || 'Apple Music Preview');
  const artist = cleanPart(track?.artistName || 'Unknown Artist');
  return `${title} - ${artist}.m4a`.slice(0, 150);
}

export function isAppleMusicLink(rawUrl) {
  try {
    const url = new URL(String(rawUrl || ''));
    return url.protocol === 'https:' && ['music.apple.com', 'itunes.apple.com', 'www.itunes.apple.com'].includes(url.hostname.toLowerCase());
  } catch {
    return false;
  }
}

/**
 * Sends only the public preview URL supplied by Apple's iTunes Lookup API.
 * It does not attempt to access, decrypt, or download full Apple Music streams.
 */
export async function downloadAppleMusicPreviewFromUrl(ctx, rawUrl) {
  const { reply, sock, remoteJid, msg } = ctx;
  const fetchImpl = getFetch(ctx);
  if (!isAppleMusicLink(rawUrl)) {
    return reply('Sertakan tautan lagu resmi https://music.apple.com atau https://itunes.apple.com.');
  }
  const trackId = parseAppleMusicTrackId(rawUrl);
  if (!trackId) {
    return reply('Tautan album belum menunjuk ke lagu tertentu. Buka satu lagu di Apple Music lalu salin tautan lagunya (biasanya memiliki parameter ?i=TRACK_ID).');
  }
  if (!fetchImpl) return reply('Unduhan preview Apple Music membutuhkan dukungan fetch pada Node.js 18 atau lebih baru.');
  if (!sock?.sendMessage || !remoteJid) return reply('Pengiriman audio WhatsApp tidak tersedia pada konteks ini.');

  try {
    const lookupUrl = new URL('/lookup', API_BASE);
    lookupUrl.search = new URLSearchParams({ id: trackId, entity: 'song', country: 'id' }).toString();
    const results = await requestMusic(lookupUrl.toString(), `apple-preview:${trackId}`, fetchImpl);
    const track = results.find(item => Number(item.trackId) === Number(trackId));
    if (!track) return reply('Apple tidak menemukan lagu dari tautan tersebut. Pastikan tautannya mengarah ke satu lagu, bukan halaman artis atau playlist.');
    if (isExplicit(track)) return reply('Preview tidak dikirim karena Apple menandai lagu ini sebagai explicit.');
    const previewUrl = safeApplePreviewUrl(track.previewUrl);
    if (!previewUrl) {
      return reply('Apple tidak menyediakan preview audio publik untuk lagu ini. PIR tidak dapat mengunduh lagu penuh dari katalog atau langganan Apple Music.');
    }

    const signal = typeof globalThis.AbortSignal?.timeout === 'function'
      ? globalThis.AbortSignal.timeout(15_000)
      : undefined;
    let targetUrl = previewUrl;
    let response;
    for (let redirectCount = 0; redirectCount <= 2; redirectCount += 1) {
      response = await fetchImpl(targetUrl, {
        method: 'GET',
        redirect: 'manual',
        headers: { accept: 'audio/*' },
        ...(signal ? { signal } : {}),
      });
      if ([301, 302, 303, 307, 308].includes(Number(response?.status))) {
        if (redirectCount === 2) throw new Error('Apple preview mengembalikan terlalu banyak redirect.');
        const location = response.headers?.get?.('location');
        if (!location) throw new Error('Apple preview mengembalikan redirect tanpa lokasi.');
        const nextUrl = new URL(location, targetUrl).toString();
        if (!safeApplePreviewUrl(nextUrl)) throw new Error('Redirect preview keluar dari host audio Apple yang diizinkan.');
        targetUrl = nextUrl;
        continue;
      }
      break;
    }
    if (!response?.ok) {
      const error = new Error(`Apple preview returned HTTP ${response?.status || 'unknown'}.`);
      error.status = Number(response?.status || 0);
      throw error;
    }
    const contentType = String(response.headers?.get?.('content-type') || '').split(';')[0].toLowerCase();
    if (contentType && !contentType.startsWith('audio/')) {
      throw new Error('Apple preview provider returned a non-audio response.');
    }
    const declaredLength = Number(response.headers?.get?.('content-length') || 0);
    const maxBytes = 15 * 1024 * 1024;
    if (declaredLength > maxBytes) throw new Error('Preview Apple melebihi batas 15 MB.');
    const buffer = Buffer.from(await response.arrayBuffer());
    if (!buffer.length) throw new Error('Apple tidak mengirim data preview audio.');
    if (buffer.length > maxBytes) throw new Error('Preview Apple melebihi batas 15 MB.');

    await sock.sendMessage(remoteJid, {
      audio: buffer,
      mimetype: 'audio/mp4',
      fileName: previewFileName(track),
      ptt: false,
    }, { quoted: msg });
    return reply(`🎵 Preview resmi Apple berhasil dikirim.\n*${cleanText(track.trackName || 'Judul tidak tersedia', 120)}* — ${cleanText(track.artistName || 'Artis tidak diketahui', 100)}\nDurasi cuplikan mengikuti preview yang disediakan Apple.\n\n_Catatan: ini hanya preview publik, bukan lagu penuh Apple Music._`);
  } catch (error) {
    console.warn('[APPLE MUSIC PREVIEW]', error?.status || error?.message || error);
    if (Number(error?.status) === 429) return reply('Apple sedang membatasi permintaan preview. Tunggu sebentar lalu coba lagi.');
    if (Number(error?.status) >= 500) return reply('Layanan preview Apple sedang bermasalah. Coba lagi beberapa saat.');
    if (error?.name === 'TimeoutError' || error?.name === 'AbortError') return reply('Pengambilan preview Apple melewati batas waktu. Coba lagi.');
    return reply('Preview Apple belum berhasil diambil. Pastikan tautan lagu valid dan server dapat mengakses layanan Apple.');
  }
}

export async function handleMusicDiscoveryCommand(ctx) {
  const { command, args = [], PREFIX = '.', reply } = ctx;
  if (!MUSIC_DISCOVERY_COMMANDS.has(command)) return false;

  const fetchImpl = getFetch(ctx);
  if (!fetchImpl) return reply('Music Discovery membutuhkan dukungan fetch pada Node.js 18 atau lebih baru.');

  const first = String(args[0] || '').toLowerCase();
  if (!args.length || ['help', 'bantuan', 'menu'].includes(first)) return reply(usage(PREFIX));

  if (['top', 'chart', 'teratas'].includes(first)) {
    const chartUrl = 'https://itunes.apple.com/id/rss/topsongs/limit=10/json';
    try {
      const entries = await requestMusic(chartUrl, 'chart:id:top10', fetchImpl, payload => payload?.feed?.entry);
      const top = entries.slice(0, 10);
      if (!top.length) return reply('Chart musik Indonesia belum tersedia dari penyedia saat ini.');
      return reply(`📈 *TOP 10 LAGU — APPLE MUSIC / ITUNES INDONESIA*\n\n${top.map(formatTopSong).join('\n\n')}\n\n_Sumber: Apple iTunes RSS chart. Ini daftar metadata dan tautan resmi; bot tidak mengunduh audio._`);
    } catch (error) {
      console.warn('[MUSIC CHART]', error?.status || error?.message || error);
      return reply(`⚠️ ${providerError(error)}\n\nKetik ${PREFIX}music help untuk melihat format penggunaan.`);
    }
  }

  let entity = 'song';
  let mode = 'song';
  let query = args.join(' ').trim();
  if (['cari', 'search', 'lagu', 'song'].includes(first)) {
    query = args.slice(1).join(' ').trim();
  } else if (['album', 'albums'].includes(first)) {
    entity = 'album';
    mode = 'album';
    query = args.slice(1).join(' ').trim();
  } else if (['artis', 'artist', 'penyanyi'].includes(first)) {
    entity = 'musicArtist';
    mode = 'artist';
    query = args.slice(1).join(' ').trim();
  } else if (['preview', 'download', 'unduh'].includes(first)) {
    const rawUrl = args.slice(1).join(' ').trim();
    if (!rawUrl) return reply(`Sertakan tautan satu lagu Apple Music.\nContoh: ${PREFIX}music preview https://music.apple.com/id/album/judul-album/123?i=456`);
    return downloadAppleMusicPreviewFromUrl(ctx, rawUrl);
  } else if (['detail', 'info'].includes(first)) {
    const id = Number(args[1]);
    if (!Number.isSafeInteger(id) || id < 1 || args.length !== 2) {
      return reply(`Masukkan track ID iTunes yang valid.\nContoh: ${PREFIX}music detail 1440857781`);
    }
    try {
      const url = new URL('/lookup', API_BASE);
      url.search = new URLSearchParams({ id: String(id), entity: 'song', country: 'id' }).toString();
      const results = await requestMusic(url.toString(), `detail:${id}`, fetchImpl);
      const track = results.find(item => Number(item.trackId) === id);
      return reply(formatDetail(track));
    } catch (error) {
      console.warn('[MUSIC DISCOVERY]', error?.status || error?.message || error);
      return reply(`⚠️ ${providerError(error)}\n\nKetik ${PREFIX}music help untuk melihat format penggunaan.`);
    }
  }

  query = cleanText(query, 90);
  if (query.length < 2) return reply(`Masukkan kata kunci minimal 2 karakter.\nContoh: ${PREFIX}music cari Nadin Amizah`);
  const url = buildSearchUrl(query, entity);
  try {
    const results = await requestMusic(url, `${mode}:${query.toLowerCase()}`, fetchImpl);
    const safeResults = results.filter(item => item && !isExplicit(item)).slice(0, 5);
    if (!safeResults.length) {
      return reply(`🎧 Tidak ada hasil ${mode === 'artist' ? 'artis' : mode === 'album' ? 'album' : 'lagu'} yang cocok untuk “${query}”. Coba kata kunci lain.`);
    }
    const formatter = mode === 'artist' ? formatArtist : mode === 'album' ? formatAlbum : formatSong;
    const body = safeResults.map(formatter).join('\n\n');
    const heading = mode === 'artist' ? 'HASIL PENCARIAN ARTIS' : mode === 'album' ? 'HASIL PENCARIAN ALBUM' : 'HASIL PENCARIAN LAGU';
    return reply(`🎧 *${heading}*\nKata kunci: ${query}\n\n${body}\n\n_Sumber metadata: Apple iTunes Search API. Tautan mengarah ke halaman Apple Music/iTunes bila tersedia._`);
  } catch (error) {
    console.warn('[MUSIC DISCOVERY]', error?.status || error?.message || error);
    return reply(`⚠️ ${providerError(error)}\n\nKetik ${PREFIX}music help untuk melihat format penggunaan.`);
  }
}

export function resetMusicDiscoveryStateForTests() {
  responseCache.clear();
  requestChain = Promise.resolve();
  lastRequestAt = 0;
}
