// Media downloader backed by the locally installed yt-dlp executable.
// Only public HTTP(S) URLs are accepted; downloaded media is size-limited before sending.
import net from 'node:net';
import { downloadAppleMusicPreviewFromUrl, isAppleMusicLink } from './music-discovery.js';

export const MEDIA_DOWNLOAD_COMMANDS = new Set(['download', 'dl', 'song', 'play', 'lagu', 'mediaformat']);
const MAX_BYTES = { video: 50 * 1024 * 1024, audio: 15 * 1024 * 1024, image: 10 * 1024 * 1024 };
const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.avif']);
const VIDEO_EXTS = new Set(['.mp4', '.m4v', '.mov', '.webm', '.mkv']);
const AUDIO_EXTS = new Set(['.mp3', '.m4a', '.aac', '.ogg', '.opus', '.wav', '.flac', '.webm']);

// Keep media downloads sequential so simultaneous requests do not overload yt-dlp,
// FFmpeg, memory, or WhatsApp message sending.
const MAX_DOWNLOAD_QUEUE = 5; // includes the active download
const SONG_SEARCH_LIMIT = 5;
const SONG_SELECTION_TTL_MS = 10 * 60 * 1000;
const MAX_SONG_SELECTIONS = 1000;
const songSelections = new Map();
const mediaInspectionTimes = new Map();
let activeMediaInspections = 0;
const MAX_ACTIVE_MEDIA_INSPECTIONS = 2;
const MEDIA_INSPECTION_COOLDOWN_MS = 15_000;
const DOWNLOAD_QUEUE = [];
let downloadJobSequence = 0;
let downloadQueueActive = false;
let activeDownloadJob = null;

function songSelectionKey(remoteJid, userJid) {
  return `${remoteJid || 'unknown-chat'}::${userJid || 'unknown-user'}`;
}

function requesterKey(remoteJid, userJid) {
  return `${remoteJid || 'unknown-chat'}::${userJid || 'unknown-user'}`;
}

function reserveMediaInspection(key, now = Date.now()) {
  for (const [storedKey, timestamp] of mediaInspectionTimes) {
    if (now - timestamp > 10 * 60 * 1000) mediaInspectionTimes.delete(storedKey);
  }
  const previous = mediaInspectionTimes.get(key);
  if (previous && now - previous < MEDIA_INSPECTION_COOLDOWN_MS) return false;
  if (activeMediaInspections >= MAX_ACTIVE_MEDIA_INSPECTIONS) return false;
  mediaInspectionTimes.set(key, now);
  while (mediaInspectionTimes.size > 1000) mediaInspectionTimes.delete(mediaInspectionTimes.keys().next().value);
  activeMediaInspections += 1;
  return true;
}

function pruneSongSelections(now = Date.now()) {
  for (const [key, value] of songSelections) {
    if (value.expiresAt <= now) songSelections.delete(key);
  }
  while (songSelections.size > MAX_SONG_SELECTIONS) {
    songSelections.delete(songSelections.keys().next().value);
  }
}

export function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return 'Durasi tidak tersedia';
  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  return hours
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    : `${minutes}:${String(secs).padStart(2, '0')}`;
}

export function safeSongText(value, maxLength = 140) {
  return String(value || 'Judul tidak diketahui')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/[\u0000-\u001f]/g, '')
    .slice(0, maxLength);
}

function startNextDownload() {
  if (downloadQueueActive || DOWNLOAD_QUEUE.length === 0) return;
  downloadQueueActive = true;
  const job = DOWNLOAD_QUEUE.shift();
  activeDownloadJob = job;
  Promise.resolve()
    .then(async () => {
      // Hold the reserved queue slot until the caller has sent its queue notice.
      await job.ready;
      if (job.controller.signal.aborted) return;
      job.phase = 'starting';
      await job.run({
        signal: job.controller.signal,
        setPhase: phase => { job.phase = String(phase || 'processing'); },
        setAttempt: attempt => { job.attempt = Math.max(1, Number(attempt) || 1); },
      });
      if (!job.controller.signal.aborted) job.phase = 'selesai';
    })
    .catch((error) => {
      job.phase = job.controller.signal.aborted ? 'dibatalkan' : 'gagal';
      if (!job.controller.signal.aborted) console.error('[MEDIA DOWNLOAD QUEUE ERROR]', error?.message || error);
    })
    .finally(() => {
      job.resolveDone();
      activeDownloadJob = null;
      downloadQueueActive = false;
      startNextDownload();
    });
}

function enqueueDownload(run, metadata = {}) {
  // Reserve capacity synchronously, before any WhatsApp reply can yield control.
  const position = DOWNLOAD_QUEUE.length + (downloadQueueActive ? 1 : 0) + 1;
  if (position > MAX_DOWNLOAD_QUEUE) return null;
  let releaseStart;
  let resolveDone;
  const ready = new Promise((resolve) => { releaseStart = resolve; });
  const done = new Promise((resolve) => { resolveDone = resolve; });
  const controller = new AbortController();
  const job = {
    run, ready, resolveDone, controller,
    requester: metadata.requester || '',
    enqueuedAt: Date.now(),
    cleanup: metadata.cleanup || null,
    phase: 'menunggu',
    attempt: 0,
  };
  DOWNLOAD_QUEUE.push(job);
  startNextDownload();
  return { position, done, start: releaseStart, cancel: () => controller.abort() };
}

function ipv4ToBigInt(value) {
  const parts = String(value || '').split('.');
  if (parts.length !== 4 || parts.some(part => !/^\d{1,3}$/.test(part) || Number(part) > 255)) return null;
  return parts.reduce((total, part) => (total << 8n) | BigInt(Number(part)), 0n);
}

function ipv6ToBigInt(value) {
  let input = String(value || '').toLowerCase();
  if (input.includes('.')) {
    const splitAt = input.lastIndexOf(':');
    const ipv4 = ipv4ToBigInt(input.slice(splitAt + 1));
    if (ipv4 === null) return null;
    const high = Number((ipv4 >> 16n) & 0xffffn).toString(16);
    const low = Number(ipv4 & 0xffffn).toString(16);
    input = `${input.slice(0, splitAt)}:${high}:${low}`;
  }
  const halves = input.split('::');
  if (halves.length > 2) return null;
  const left = halves[0] ? halves[0].split(':') : [];
  const right = halves.length === 2 && halves[1] ? halves[1].split(':') : [];
  const missing = 8 - left.length - right.length;
  if ((halves.length === 1 && missing !== 0) || (halves.length === 2 && missing < 1)) return null;
  const groups = [...left, ...Array(missing).fill('0'), ...right];
  if (groups.length !== 8 || groups.some(part => !/^[0-9a-f]{1,4}$/.test(part))) return null;
  return groups.reduce((total, part) => (total << 16n) | BigInt(parseInt(part, 16)), 0n);
}

function isIpv4NonPublic(value) {
  const address = ipv4ToBigInt(value);
  if (address === null) return true;
  const ranges = [
    ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8],
    ['169.254.0.0', 16], ['172.16.0.0', 12], ['192.0.0.0', 24], ['192.0.2.0', 24],
    ['192.88.99.0', 24], ['192.168.0.0', 16], ['198.18.0.0', 15], ['198.51.100.0', 24],
    ['203.0.113.0', 24], ['224.0.0.0', 4], ['240.0.0.0', 4],
  ];
  return ranges.some(([base, prefix]) => {
    const network = ipv4ToBigInt(base);
    const shift = BigInt(32 - prefix);
    return (address >> shift) === (network >> shift);
  });
}

function isIpv6NonPublic(value) {
  const address = ipv6ToBigInt(value);
  if (address === null) return true;
  const ranges = [
    ['::', 128], ['::1', 128], ['::ffff:0:0', 96], ['64:ff9b:1::', 48],
    ['100::', 64], ['2001::', 23], ['2001:db8::', 32], ['2002::', 16],
    ['3fff::', 20], ['fc00::', 7], ['fe80::', 10], ['ff00::', 8],
  ];
  return ranges.some(([base, prefix]) => {
    const network = ipv6ToBigInt(base);
    const shift = BigInt(128 - prefix);
    return (address >> shift) === (network >> shift);
  });
}

export function validateDownloadUrl(raw) {
  let url;
  try { url = new URL(raw); } catch { return { ok: false, reason: 'Tautan tidak valid.' }; }
  if (!['http:', 'https:'].includes(url.protocol)) return { ok: false, reason: 'Hanya tautan HTTP/HTTPS yang didukung.' };
  if (url.username || url.password) return { ok: false, reason: 'Tautan dengan kredensial tidak diizinkan.' };
  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, '').replace(/\.$/, '');
  if (!hostname || hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.local')
    || hostname.endsWith('.internal') || hostname.endsWith('.lan') || hostname.endsWith('.home')
    || hostname.endsWith('.home.arpa') || hostname.endsWith('.test') || hostname.endsWith('.example')
    || hostname.endsWith('.invalid') || (!hostname.includes('.') && net.isIP(hostname) === 0)) {
    return { ok: false, reason: 'Nama host lokal atau non-publik tidak diizinkan.' };
  }
  const ipVersion = net.isIP(hostname);
  if ((ipVersion === 4 && isIpv4NonPublic(hostname)) || (ipVersion === 6 && isIpv6NonPublic(hostname))) {
    return { ok: false, reason: 'Alamat IP privat atau khusus non-publik tidak diizinkan.' };
  }
  return { ok: true, url: url.toString() };
}

function detectKind(ext) {
  const e = ext.toLowerCase();
  if (IMAGE_EXTS.has(e)) return 'image';
  if (VIDEO_EXTS.has(e)) return 'video';
  if (AUDIO_EXTS.has(e)) return 'audio';
  return 'unknown';
}


function decodeHtml(value) {
  return value.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}

function readMetaTags(html) {
  const tags = {};
  for (const tag of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attrs = {};
    for (const match of tag[0].matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/gi)) attrs[match[1].toLowerCase()] = decodeHtml(match[3]);
    const key = (attrs.property || attrs.name || '').toLowerCase();
    if (key && attrs.content) tags[key] = attrs.content;
  }
  return tags;
}

function createTimeoutSignal(parentSignal, timeoutMs) {
  const controller = new AbortController();
  const timeoutError = Object.assign(new Error('Request timed out.'), { name: 'TimeoutError' });
  const timer = setTimeout(() => controller.abort(timeoutError), timeoutMs);
  const onParentAbort = () => controller.abort(parentSignal?.reason || Object.assign(new Error('Request aborted.'), { name: 'AbortError' }));
  if (parentSignal?.aborted) onParentAbort();
  else parentSignal?.addEventListener('abort', onParentAbort, { once: true });
  return {
    signal: controller.signal,
    cleanup() {
      clearTimeout(timer);
      parentSignal?.removeEventListener('abort', onParentAbort);
    },
  };
}

async function pinterestPublicPageFallback(rawUrl, outputTemplate, prefix, requestedKind, fs, path, signal) {
  // Fallback for publicly accessible Pinterest pages when yt-dlp cannot find formats.
  // It only downloads media URLs exposed in public page metadata; it does not bypass login/privacy.
  const pageTimeout = createTimeoutSignal(signal, 20000);
  let pageResponse;
  let html;
  try {
    pageResponse = await fetch(rawUrl, {
      redirect: 'follow',
      signal: pageTimeout.signal,
      headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128 Safari/537.36', 'accept': 'text/html,application/xhtml+xml' },
    });
    if (!pageResponse.ok) throw new Error(`Pinterest membuka halaman dengan HTTP ${pageResponse.status}.`);
    html = await pageResponse.text();
  } finally {
    pageTimeout.cleanup();
  }
  const meta = readMetaTags(html);
  const videoUrl = meta['og:video:secure_url'] || meta['og:video:url'] || meta['og:video'] || meta['twitter:player:stream'];
  const imageUrl = meta['og:image:secure_url'] || meta['og:image'] || meta['twitter:image'];
  let mediaUrl = null;
  let assumedKind = 'unknown';
  if (requestedKind === 'video') {
    mediaUrl = videoUrl;
    assumedKind = 'video';
  } else if (requestedKind === 'image') {
    mediaUrl = imageUrl;
    assumedKind = 'image';
  } else if (requestedKind === 'audio') {
    throw new Error('Halaman Pinterest tidak menyediakan metadata audio publik.');
  } else if (videoUrl) {
    mediaUrl = videoUrl;
    assumedKind = 'video';
  } else if (imageUrl) {
    mediaUrl = imageUrl;
    assumedKind = 'image';
  }
  if (!mediaUrl) throw new Error('Pinterest tidak menyediakan URL media publik pada halaman ini. Pin mungkin berupa gambar saja, memerlukan login, atau metadata video tidak tersedia.');
  let absolute;
  try { absolute = new URL(mediaUrl, pageResponse.url); } catch { throw new Error('URL media dari metadata Pinterest tidak valid.'); }
  if (!['http:', 'https:'].includes(absolute.protocol)) throw new Error('Protokol media Pinterest tidak didukung.');
  const mediaTimeout = createTimeoutSignal(signal, 30000);
  let mediaResponse;
  let buffer;
  try {
    mediaResponse = await fetch(absolute, {
      redirect: 'follow',
      signal: mediaTimeout.signal,
      headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128 Safari/537.36', 'referer': pageResponse.url, 'accept': '*/*' },
    });
    if (!mediaResponse.ok) throw new Error(`Server media Pinterest membalas HTTP ${mediaResponse.status}.`);
    const declaredLength = Number(mediaResponse.headers.get('content-length') || 0);
    if (declaredLength > 60 * 1024 * 1024) throw new Error('Media Pinterest lebih besar dari batas unduhan 60 MB.');
    buffer = Buffer.from(await mediaResponse.arrayBuffer());
  } finally {
    mediaTimeout.cleanup();
  }
  const contentType = (mediaResponse.headers.get('content-type') || '').split(';')[0].toLowerCase();
  const extByType = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif', 'image/avif': '.avif', 'video/mp4': '.mp4', 'video/webm': '.webm', 'video/quicktime': '.mov' };
  let ext = extByType[contentType];
  if (!ext) {
    try { ext = path.extname(new URL(mediaResponse.url).pathname).toLowerCase(); } catch { ext = ''; }
  }
  if (!ext || !['.jpg','.jpeg','.png','.webp','.gif','.avif','.mp4','.webm','.mov'].includes(ext)) {
    throw new Error(`Format media Pinterest tidak didukung (${contentType || 'tipe tidak diketahui'}).`);
  }
  const detected = ext.match(/^\.(jpg|jpeg|png|webp|gif|avif)$/) ? 'image' : 'video';
  if (requestedKind !== 'auto' && requestedKind !== detected) throw new Error(`Metadata Pinterest hanya menyediakan ${detected}, bukan ${requestedKind}.`);
  if (!buffer.length) throw new Error('Pinterest mengembalikan file media kosong.');
  if (buffer.length > 60 * 1024 * 1024) throw new Error('Media Pinterest lebih besar dari batas unduhan 60 MB.');
  const dir = path.dirname(outputTemplate);
  const filePath = path.join(dir, `${prefix}pinterest_fallback${ext}`);
  await fs.promises.writeFile(filePath, buffer);
  return filePath;
}

function getPythonExecutable(fs) {
  return process.env.PYTHON_PATH || (fs.existsSync('E:\\python.exe') ? 'E:\\python.exe' : 'python');
}

function getPythonEnv(path) {
  return {
    ...process.env,
    PYTHONPATH: [process.env.PYTHONPATH, 'E:\\Lib\\site-packages'].filter(Boolean).join(path.delimiter),
  };
}

export function classifyDownloaderError(error) {
  const message = String(error?.message || '');
  const stderr = String(error?.stderr || '');
  const stdout = String(error?.stdout || '');
  const combined = `${message}\n${stderr}\n${stdout}`;
  const lower = combined.toLowerCase();

  if (/timed? ?out|timeout|etimedout|deadline exceeded|killed.*sigterm/i.test(combined) || error?.code === 'ETIMEDOUT') {
    return { code: 'timeout', message: 'Proses download melewati batas waktu. Coba lagi nanti atau gunakan tautan yang lebih pendek/sederhana.' };
  }
  if (/no module named yt_dlp/i.test(combined)) {
    return { code: 'yt-dlp-missing', message: 'Python yang dipakai bot tidak menemukan yt-dlp. Jalankan `python -m pip install -U yt-dlp` menggunakan Python yang sama dengan bot, lalu restart.' };
  }
  if (/ffmpeg.*(not found|not recognized|enoent)|spawn ffmpeg enoent/i.test(combined)) {
    return { code: 'ffmpeg-missing', message: 'FFmpeg tidak ditemukan. Pasang FFmpeg dan pastikan folder bin masuk ke PATH, lalu restart bot.' };
  }
  if (/spawn (python|python3|py)(\.exe)? enoent|python.*(not found|not recognized)|enoent/i.test(combined) && !/ffmpeg/i.test(lower)) {
    return { code: 'python-missing', message: 'Python tidak ditemukan. Pastikan Python terpasang dan PATH benar, atau atur variabel PYTHON_PATH ke python.exe yang digunakan bot.' };
  }
  if (/unsupported url|no video formats found|no suitable formats|requested format is not available/i.test(combined)) {
    return { code: 'unsupported', message: 'Situs atau format media ini belum didukung oleh yt-dlp. Coba tautan publik lain atau perbarui yt-dlp.' };
  }
  if (/private video|login required|sign in to confirm|members-only|video unavailable|this content isn't available|http error 404/i.test(combined)) {
    return { code: 'unavailable', message: 'Media tidak tersedia untuk akses publik, memerlukan login, sudah dihapus, atau dibatasi oleh sumber.' };
  }
  if (/http error 429|too many requests|rate.?limit/i.test(combined)) {
    return { code: 'rate-limited', message: 'Sumber media membatasi permintaan sementara. Tunggu beberapa menit sebelum mencoba lagi.' };
  }
  if (/http error 403|forbidden|http error 401|unauthorized/i.test(combined)) {
    return { code: 'access-denied', message: 'Sumber menolak akses atau membutuhkan izin/login. Pastikan tautan dapat dibuka secara publik.' };
  }
  if (/econnreset|enotfound|eai_again|network is unreachable|connection refused|socket hang up|temporary failure in name resolution/i.test(combined)) {
    return { code: 'network', message: 'Koneksi ke sumber media bermasalah. Periksa internet/DNS server dan coba lagi.' };
  }
  if (/file is larger than|max-filesize|file.*too large|batas pengiriman/i.test(combined)) {
    return { code: 'too-large', message: 'File terlalu besar untuk dikirim melalui bot. Coba sumber dengan ukuran lebih kecil.' };
  }
  if (error?.name === 'AbortError' || error?.code === 'ABORT_ERR' || /operation was aborted|aborted by the user/i.test(combined)) {
    return { code: 'cancelled', message: 'Permintaan download dibatalkan oleh pemilik antrean.' };
  }
  return { code: 'unknown', message: message.replace(/\s+/g, ' ').slice(0, 350) || 'Terjadi kesalahan yang belum dikenali. Periksa log bot untuk detail.' };
}

export function isRetryableDownloaderError(error) {
  return ['network', 'rate-limited'].includes(classifyDownloaderError(error).code);
}

export function shouldUsePinterestPublicFallback(error, rawUrl) {
  if (classifyDownloaderError(error).code !== 'unsupported') return false;
  try {
    const hostname = new URL(String(rawUrl || '')).hostname;
    return /(^|\.)pinterest\.com$/i.test(hostname) || /(^|\.)pin\.it$/i.test(hostname);
  } catch {
    return false;
  }
}

function abortableDelay(milliseconds, signal) {
  if (signal?.aborted) return Promise.reject(Object.assign(new Error('Download dibatalkan.'), { name: 'AbortError', code: 'ABORT_ERR' }));
  return new Promise((resolve, reject) => {
    const timer = setTimeout(done, milliseconds);
    function cleanup() {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
    }
    function done() { cleanup(); resolve(); }
    function onAbort() {
      cleanup();
      reject(Object.assign(new Error('Download dibatalkan.'), { name: 'AbortError', code: 'ABORT_ERR' }));
    }
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

export async function runDownloaderWithRetry(execFileAsync, executable, args, options = {}, control = {}) {
  const signal = control.signal || options.signal;
  const requestedRetries = Number(control.maxRetries ?? 1);
  const maxRetries = Number.isFinite(requestedRetries) ? Math.max(0, Math.min(1, Math.floor(requestedRetries))) : 1;
  let retries = 0;
  while (true) {
    if (signal?.aborted) throw Object.assign(new Error('Download dibatalkan.'), { name: 'AbortError', code: 'ABORT_ERR' });
    control.onAttempt?.(retries + 1);
    try {
      return await execFileAsync(executable, args, { ...options, ...(signal ? { signal } : {}) });
    } catch (error) {
      if (signal?.aborted) throw error;
      if (!isRetryableDownloaderError(error) || retries >= maxRetries) throw error;
      retries += 1;
      control.onRetry?.(retries, classifyDownloaderError(error).code);
      await abortableDelay(control.retryDelayMs ?? (classifyDownloaderError(error).code === 'rate-limited' ? 1400 : 450), signal);
    }
  }
}

const MEDIA_FORMAT_PRESETS = Object.freeze({
  'video-wa': { label: 'Video WhatsApp standar', videoKbps: 1000, audioKbps: 96, detail: 'H.264 720p + AAC 96 kbps' },
  'video-compact': { label: 'Video hemat data', videoKbps: 650, audioKbps: 64, detail: 'H.264 480p + AAC 64 kbps' },
  'audio-mp3': { label: 'Audio MP3 standar', audioKbps: 128, detail: 'MP3 128 kbps' },
  'audio-high': { label: 'Audio kualitas tinggi', audioKbps: 192, detail: 'AAC/MP3 192 kbps' },
});

export function estimateMediaPresetSize(presetName, durationSeconds) {
  const preset = MEDIA_FORMAT_PRESETS[String(presetName || '').toLowerCase()];
  const duration = Number(durationSeconds);
  if (!preset || !Number.isFinite(duration) || !Number.isInteger(duration) || duration < 1 || duration > 4 * 60 * 60) return null;
  const totalKbps = Number(preset.videoKbps || 0) + Number(preset.audioKbps || 0);
  const bytes = Math.ceil((totalKbps * 1000 * duration / 8) * 1.08);
  return { preset: presetName, label: preset.label, detail: preset.detail, duration, bytes, megabytes: Number((bytes / 1024 / 1024).toFixed(2)) };
}

export function summarizeAvailableFormats(metadata = {}) {
  const rows = Array.isArray(metadata.formats) ? metadata.formats : [];
  const supportedVideo = new Set(['mp4', 'webm', 'm4v', 'mov', 'mkv']);
  const supportedAudio = new Set(['mp3', 'm4a', 'aac', 'ogg', 'opus', 'wav', 'flac', 'webm']);
  const candidates = rows.map(format => {
    const ext = String(format?.ext || '').toLowerCase();
    const hasVideo = Boolean(format?.vcodec && format.vcodec !== 'none');
    const hasAudio = Boolean(format?.acodec && format.acodec !== 'none');
    if (!ext || (!hasVideo && !hasAudio)) return null;
    if (hasVideo && !supportedVideo.has(ext)) return null;
    if (!hasVideo && hasAudio && !supportedAudio.has(ext)) return null;
    const height = Number(format.height || 0);
    const resolution = safeSongText(format.resolution || (height ? `${height}p` : 'resolusi tidak diketahui'), 30);
    const size = Number(format.filesize || format.filesize_approx || 0);
    return {
      id: safeSongText(format.format_id || '-', 16),
      ext,
      kind: hasVideo ? (hasAudio ? 'video + audio' : 'video saja') : 'audio saja',
      resolution,
      height,
      size: Number.isFinite(size) && size > 0 ? size : 0,
      fps: Number(format.fps || 0),
      preference: hasVideo && hasAudio ? 3 : hasVideo ? 2 : 1,
    };
  }).filter(Boolean);
  const unique = new Map();
  for (const item of candidates) {
    const key = `${item.id}:${item.ext}:${item.kind}`;
    if (!unique.has(key)) unique.set(key, item);
  }
  return [...unique.values()].sort((a, b) => b.preference - a.preference || b.height - a.height || a.ext.localeCompare(b.ext)).slice(0, 8);
}

export function buildMediaFormatGuide(prefix = '.') {
  return [
    '🧭 *MEDIA FORMAT EXPLORER*',
    'Kenali format yang dapat diproses sebelum meminta bot mengunduh media.',
    '',
    '*Format yang dikenali bot*',
    '• Video: MP4, WebM, M4V, MOV, MKV — batas kirim 50 MB.',
    '• Audio: MP3, M4A, AAC, OGG, OPUS, WAV, FLAC, WebM — batas 15 MB.',
    '• Gambar: JPG, PNG, WebP, GIF, BMP, AVIF — batas 10 MB; JPG/PNG/WebP paling disarankan.',
    '',
    '*Periksa sumber sebelum download*',
    `${prefix}mediaformat cek https://tautan-publik — membaca metadata dan format yang ditawarkan yt-dlp; tidak mengunduh file.`,
    '',
    '*Estimasi preset*',
    `${prefix}mediaformat estimasi video-wa 120 — perkiraan ukuran video 720p selama 120 detik.`,
    `${prefix}mediaformat estimasi video-compact 120`,
    `${prefix}mediaformat estimasi audio-mp3 240`,
    `${prefix}mediaformat estimasi audio-high 240`,
    '',
    'Estimasi ukuran memakai bitrate target dan overhead 8%; ukuran akhir bergantung pada konten, codec, dan sumber. Preset saat ini berupa rekomendasi/estimasi, bukan konversi otomatis. Akses provider tetap mengikuti dukungan yt-dlp, izin sumber, dan batas WhatsApp.',
  ].join('\n');
}

export async function inspectPublicMediaFormats(rawUrl, ctx = {}) {
  const validation = validateDownloadUrl(rawUrl);
  if (!validation.ok) return { ok: false, message: validation.reason };
  if (typeof ctx.execFileAsync !== 'function') return { ok: false, message: 'Pemeriksaan format otomatis tidak tersedia pada lingkungan ini.' };
  const fs = ctx.fs || { existsSync: () => false };
  const path = ctx.path || { delimiter: process.platform === 'win32' ? ';' : ':' };
  const python = getPythonExecutable(fs);
  try {
    const result = await ctx.execFileAsync(python, [
      '-m', 'yt_dlp', '--ignore-config', '--dump-single-json', '--skip-download', '--no-warnings', '--no-playlist',
      '--socket-timeout', '12', '--retries', '0', '--extractor-retries', '0', validation.url,
    ], { timeout: 25000, windowsHide: true, maxBuffer: 4 * 1024 * 1024, env: getPythonEnv(path) });
    const metadata = JSON.parse(String(result?.stdout || '{}'));
    const formats = summarizeAvailableFormats(metadata);
    return {
      ok: true,
      title: safeSongText(metadata.title || 'Judul tidak tersedia', 120),
      provider: safeSongText(metadata.extractor_key || metadata.extractor || 'Provider tidak diketahui', 50),
      duration: formatDuration(Number(metadata.duration)),
      formats,
    };
  } catch (error) {
    const diagnosis = classifyDownloaderError(error);
    return { ok: false, message: diagnosis.message };
  }
}

export function getVideoMimeType(extension) {
  const ext = String(extension || '').toLowerCase();
  return ({ '.mp4': 'video/mp4', '.m4v': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime', '.mkv': 'video/x-matroska' })[ext] || 'video/mp4';
}

export function getAudioMimeType(extension) {
  const ext = String(extension || '').toLowerCase();
  return ({
    '.mp3': 'audio/mpeg',
    '.m4a': 'audio/mp4',
    '.aac': 'audio/aac',
    '.ogg': 'audio/ogg',
    '.opus': 'audio/ogg; codecs=opus',
    '.wav': 'audio/wav',
    '.flac': 'audio/flac',
    '.webm': 'audio/webm',
  })[ext] || 'application/octet-stream';
}

export async function inspectAudioMetadata(filePath, execFileAsync, { signal } = {}) {
  if (typeof execFileAsync !== 'function') return null;
  try {
    const result = await execFileAsync('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration,format_name:format_tags=title,artist,album',
      '-of', 'json', filePath,
    ], { timeout: 10000, windowsHide: true, maxBuffer: 256 * 1024, ...(signal ? { signal } : {}) });
    const data = JSON.parse(String(result?.stdout || '{}'));
    const tags = data?.format?.tags || data?.streams?.[0]?.tags || {};
    const duration = Number(data?.format?.duration);
    return {
      title: String(tags.title || '').replace(/[\r\n\t]+/g, ' ').trim().slice(0, 100),
      artist: String(tags.artist || tags.album_artist || '').replace(/[\r\n\t]+/g, ' ').trim().slice(0, 100),
      album: String(tags.album || '').replace(/[\r\n\t]+/g, ' ').trim().slice(0, 100),
      duration: Number.isFinite(duration) && duration > 0 ? formatDuration(duration) : '',
      format: safeSongText(data?.format?.format_name || '', 40),
    };
  } catch (error) {
    if (signal?.aborted) throw error;
    return null;
  }
}

async function getDownloaderHealth(ctx) {
  const { fs, path, execFileAsync } = ctx;
  if (typeof execFileAsync !== 'function') {
    return '⚠️ Pemeriksaan otomatis tidak tersedia karena runner perintah tidak dikonfigurasi.';
  }
  const python = getPythonExecutable(fs);
  const env = getPythonEnv(path);
  const lines = ['🩺 *PEMERIKSAAN DOWNLOADER*'];
  let ytDlpOk = false;
  let ffmpegOk = false;
  let ffprobeOk = false;

  try {
    const result = await execFileAsync(python, ['-m', 'yt_dlp', '--version'], {
      timeout: 10000, windowsHide: true, maxBuffer: 256 * 1024, env,
    });
    const version = String(result?.stdout || '').trim().split(/\r?\n/)[0].slice(0, 40);
    ytDlpOk = true;
    lines.push(`✅ Python + yt-dlp: tersedia${version ? ` (versi ${version})` : ''}`);
  } catch (error) {
    const diagnosed = classifyDownloaderError(error);
    if (diagnosed.code === 'yt-dlp-missing') lines.push('❌ Python: tersedia, tetapi modul yt-dlp belum terpasang.');
    else if (diagnosed.code === 'python-missing') lines.push('❌ Python: tidak ditemukan. Periksa PYTHON_PATH/PATH.');
    else lines.push(`❌ Python + yt-dlp: ${diagnosed.message}`);
  }

  try {
    const result = await execFileAsync('ffmpeg', ['-version'], {
      timeout: 10000, windowsHide: true, maxBuffer: 256 * 1024,
    });
    const version = String(result?.stdout || '').match(/ffmpeg version\s+([^\s]+)/i)?.[1];
    ffmpegOk = true;
    lines.push(`✅ FFmpeg: tersedia${version ? ` (versi ${version})` : ''}`);
  } catch (error) {
    const diagnosed = classifyDownloaderError({ ...error, message: `ffmpeg ${error?.message || ''}`, stderr: error?.stderr || '' });
    lines.push(`❌ FFmpeg: ${diagnosed.code === 'ffmpeg-missing' || error?.code === 'ENOENT' ? 'tidak ditemukan; pasang FFmpeg dan tambahkan ke PATH.' : diagnosed.message}`);
  }

  try {
    const result = await execFileAsync('ffprobe', ['-version'], { timeout: 10000, windowsHide: true, maxBuffer: 256 * 1024 });
    const version = String(result?.stdout || '').match(/ffprobe version\s+([^\s]+)/i)?.[1];
    ffprobeOk = true;
    lines.push(`✅ FFprobe: tersedia${version ? ` (versi ${version})` : ''}`);
  } catch {
    lines.push('ℹ️ FFprobe: tidak tersedia; pemeriksaan metadata audio akan dilewati.');
  }

  lines.push('', ytDlpOk && ffmpegOk
    ? `✅ Komponen utama tersedia. FFprobe ${ffprobeOk ? 'siap untuk metadata audio' : 'opsional dan belum tersedia'}. Ini belum menjamin semua situs media dapat diunduh.`
    : '⚠️ Ada komponen yang perlu diperbaiki sebelum semua format download dapat berjalan.');
  return lines.join('\n');
}

export async function handleMediaDownloadCommands(ctx) {
  const { command, args, PREFIX = '.', reply, sock, remoteJid, userJid, msg, path, fs, execFileAsync, TEMP_DIR } = ctx;
  if (!MEDIA_DOWNLOAD_COMMANDS.has(command)) return;

  if (command === 'mediaformat') {
    const action = String(args[0] || 'help').toLowerCase();
    if (['help', 'bantuan'].includes(action)) return reply(buildMediaFormatGuide(PREFIX));
    if (action === 'estimasi' || action === 'estimate') {
      const estimate = estimateMediaPresetSize(args[1], args[2]);
      if (!estimate) return reply(`Preset/durasi tidak valid. Pilih: ${Object.keys(MEDIA_FORMAT_PRESETS).join(', ')}. Durasi 1–14400 detik.
Contoh: ${PREFIX}mediaformat estimasi video-wa 120`);
      return reply(`📐 *ESTIMASI MEDIA*
Preset: ${estimate.label}
Profil: ${estimate.detail}
Durasi: ${formatDuration(estimate.duration)}
Ukuran perkiraan: *${estimate.megabytes} MB*

Perkiraan bitrate dengan overhead 8%; hasil aktual dapat berbeda. Ini belum menjalankan konversi.`);
    }
    if (action === 'cek' || action === 'check') {
      const rawUrl = args[1] || '';
      if (!rawUrl) return reply(`Sertakan satu tautan publik.
Contoh: ${PREFIX}mediaformat cek https://example.com/video`);
      const validation = validateDownloadUrl(rawUrl);
      if (!validation.ok) return reply(`⚠️ Format belum dapat diperiksa: ${validation.reason}`);
      const inspectionKey = requesterKey(remoteJid, userJid);
      if (!reserveMediaInspection(inspectionKey)) return reply('⏳ Pemeriksaan format sedang dibatasi. Tunggu 15 detik atau coba lagi saat slot pemeriksaan tersedia.');
      let inspected;
      try {
        await reply('🔎 Memeriksa metadata provider. Bot tidak mengunduh file pada tahap ini…');
        inspected = await inspectPublicMediaFormats(validation.url, { execFileAsync, fs, path });
      } finally {
        activeMediaInspections = Math.max(0, activeMediaInspections - 1);
      }
      if (!inspected.ok) return reply(`⚠️ Format belum dapat diperiksa: ${inspected.message}`);
      if (!inspected.formats.length) return reply(`📄 *HASIL PEMERIKSAAN FORMAT*
Judul: ${inspected.title}
Provider: ${inspected.provider}
Durasi: ${inspected.duration}

Provider tidak mengembalikan format video/audio yang dikenali oleh pipeline PIR.`);
      const lines = inspected.formats.map(item => `• ${item.id} · ${item.ext.toUpperCase()} · ${item.kind} · ${item.resolution}${item.size ? ` · ${(item.size / 1024 / 1024).toFixed(1)} MB` : ''}`);
      return reply([`📄 *HASIL PEMERIKSAAN FORMAT*`, `Judul: ${inspected.title}`, `Provider: ${inspected.provider}`, `Durasi: ${inspected.duration}`, '', '*Format yang terdeteksi*', ...lines, '', 'Pemeriksaan metadata tidak menjamin file dapat diunduh atau dikirim; akses provider dan batas ukuran tetap berlaku.', `Unduh jika diizinkan: ${PREFIX}dl <tautan>`].join('\n'));
    }
    return reply(buildMediaFormatGuide(PREFIX));
  }

  const usage = `📥 *Download Media*\n\nFormat:\n• ${PREFIX}dl <link> — unduh media otomatis\n• ${PREFIX}dl video <link> — unduh video\n• ${PREFIX}dl audio <link> — unduh audio dari tautan\n• ${PREFIX}dl image <link> — unduh gambar/foto\n• ${PREFIX}song <judul lagu> — cari hingga 5 hasil lagu\n• ${PREFIX}song pilih <nomor> — unduh hasil pilihan\n• ${PREFIX}dl song <judul lagu> — alternatif pencarian lagu\n• ${PREFIX}dl status — lihat status antrean download\n• ${PREFIX}dl cancel — batalkan antrean atau proses aktif milikmu\n• ${PREFIX}dl health — periksa Python, yt-dlp, FFmpeg, dan FFprobe\n\nHasil pencarian berlaku 10 menit dan terpisah untuk tiap chat/pengirim. Apple Music hanya mendukung preview publik dari Apple, bukan unduhan lagu penuh/DRM. Untuk sumber lain, gunakan hanya media yang kamu miliki atau diizinkan untuk diunduh. Tautan harus publik dan didukung situsnya.`;
  if (!args.length || ['help', '--help'].includes(args[0].toLowerCase())) return reply(usage);

  if (command === 'dl' || command === 'download') {
    const firstArg = String(args[0] || '');
    const appleUrl = firstArg.toLowerCase() === 'apple' ? String(args[1] || '') : firstArg;
    if (firstArg.toLowerCase() === 'apple' && !appleUrl) {
      return reply(`Sertakan tautan satu lagu Apple Music.\nContoh: ${PREFIX}dl apple https://music.apple.com/id/album/judul-album/123?i=456`);
    }
    if (isAppleMusicLink(appleUrl)) {
      return downloadAppleMusicPreviewFromUrl(ctx, appleUrl);
    }
  }

  if (command === 'dl' || command === 'download') {
    if ((args[0] || '').toLowerCase() === 'cancel') {
      const requester = requesterKey(remoteJid, ctx.userJid || ctx.sender);
      const index = DOWNLOAD_QUEUE.findIndex(job => job.requester && job.requester === requester);
      if (index < 0) {
        if (activeDownloadJob?.requester === requester) {
          if (['sending', 'mengirim media', 'selesai'].includes(activeDownloadJob.phase)) {
            return reply('⚠️ File sedang dikirim ke WhatsApp dan tahap pengiriman tidak dapat dihentikan. Tunggu hasilnya.');
          }
          activeDownloadJob.controller.abort();
          return reply('🛑 Permintaan aktif ditandai untuk dibatalkan. Proses yt-dlp/FFmpeg akan dihentikan jika subprocess mendukung AbortSignal.');
        }
        return reply('ℹ️ Kamu tidak memiliki download yang sedang menunggu di antrean.');
      }
      const [cancelledJob] = DOWNLOAD_QUEUE.splice(index, 1);
      cancelledJob.controller.abort();
      cancelledJob.phase = 'dibatalkan';
      cancelledJob.resolveDone();
      if (typeof cancelledJob.cleanup === 'function') await cancelledJob.cleanup().catch(() => {});
      startNextDownload();
      return reply('✅ Permintaan download kamu yang masih menunggu berhasil dibatalkan.');
    }
    if ((args[0] || '').toLowerCase() === 'status') {
      const requester = requesterKey(remoteJid, ctx.userJid || ctx.sender);
      const active = activeDownloadJob;
      const waiting = DOWNLOAD_QUEUE.length;
      const total = waiting + (downloadQueueActive ? 1 : 0);
      let ownStatus = 'Tidak ada permintaan kamu yang sedang mengantre.';
      if (active && active.requester && active.requester === requester) {
        ownStatus = `Permintaan aktif: ${active.phase || 'diproses'}${active.attempt > 1 ? ` (percobaan ${active.attempt})` : ''}.`;
      } else {
        const ownIndex = DOWNLOAD_QUEUE.findIndex(job => job.requester && job.requester === requester);
        if (ownIndex >= 0) ownStatus = `Permintaan kamu berada di posisi ${ownIndex + (downloadQueueActive ? 2 : 1)}.`;
      }
      const activeText = downloadQueueActive ? 'Ada satu download yang sedang diproses.' : 'Belum ada download yang sedang diproses.';
      return reply(`📊 *STATUS ANTREAN DOWNLOAD*\n\n${activeText}\nMenunggu: ${waiting}\nTotal permintaan aktif + antrean: ${total}/${MAX_DOWNLOAD_QUEUE}\n\n👤 ${ownStatus}\nGunakan ${PREFIX}dl cancel untuk membatalkan permintaan milikmu yang masih berjalan/menunggu.`);
    }
    if ((args[0] || '').toLowerCase() === 'health') {
      return reply(await getDownloaderHealth(ctx));
    }
  }

  let kind = 'auto';
  let rawUrl = args.join(' ').trim();
  let isSongCommand = ['song', 'play', 'lagu'].includes(command);
  let songQuery = isSongCommand ? rawUrl : '';
  let wantsSongSearch = false;
  let selectedSong = null;
  const selectionKey = songSelectionKey(remoteJid, ctx.userJid || ctx.sender);

  if (!isSongCommand && ['song', 'play', 'lagu'].includes((args[0] || '').toLowerCase())) {
    args.shift();
    isSongCommand = true;
    kind = 'audio';
    songQuery = args.join(' ').trim();
    rawUrl = '';
  }
  if (isSongCommand) {
    kind = 'audio';
    const firstArg = (args[0] || '').toLowerCase();
    if (firstArg === 'pilih') {
      const number = Number(args[1]);
      if (!Number.isInteger(number) || number < 1 || number > SONG_SEARCH_LIMIT || args.length !== 2) {
        return reply(`Format pilihan: ${PREFIX}song pilih 1\nPilih nomor 1–${SONG_SEARCH_LIMIT} dari hasil pencarian terbaru.`);
      }
      pruneSongSelections();
      const saved = songSelections.get(selectionKey);
      if (!saved || saved.expiresAt <= Date.now()) {
        songSelections.delete(selectionKey);
        return reply(`⏰ Hasil pencarian sudah tidak tersedia atau belum ada. Cari ulang dengan ${PREFIX}song <judul lagu>.`);
      }
      selectedSong = saved.results[number - 1];
      if (!selectedSong) return reply('Nomor lagu tidak tersedia. Cari ulang dengan perintah .song.');
      songQuery = selectedSong.title;
    } else {
      songQuery = songQuery.trim();
      wantsSongSearch = true;
      if (!songQuery) return reply(`Format: ${PREFIX}song <judul lagu>\nContoh: ${PREFIX}song Hati-Hati di Jalan Tulus`);
      if (songQuery.length > 180) return reply('Judul lagu terlalu panjang. Maksimal 180 karakter.');
    }
  } else if (['video', 'audio', 'image', 'foto', 'gambar', 'musik'].includes((args[0] || '').toLowerCase())) {
    const mode = args.shift().toLowerCase();
    kind = ({ foto: 'image', gambar: 'image', musik: 'audio' })[mode] || mode;
    rawUrl = args.join(' ').trim();
  }

  let validation = null;
  if (!isSongCommand) {
    // Strip surrounding angle brackets/punctuation often included in forwarded links.
    rawUrl = rawUrl.replace(/^<|>$/g, '').trim();
    validation = validateDownloadUrl(rawUrl);
    if (!validation.ok) return reply(`❌ ${validation.reason}\n\nKetik ${PREFIX}dl help untuk melihat format penggunaan.`);
  }

  const stamp = Date.now();
  const prefix = `dl_${stamp}_${++downloadJobSequence}_`;
  const outputTemplate = path.join(path.resolve(TEMP_DIR || 'temp'), `${prefix}%(id)s.%(ext)s`);
  await fs.promises.mkdir(path.dirname(outputTemplate), { recursive: true });
  const queued = enqueueDownload(async ({ signal, setPhase, setAttempt }) => {
  let sent = false;
  try {
    await reply(wantsSongSearch ? '🔎 Sedang mencari lagu…' : (selectedSong ? '🎵 Lagu dipilih. 📥 Mulai mengunduh audio…' : '📥 Sedang mengunduh media…'));
    if (wantsSongSearch) {
      setPhase('mencari lagu');
      const searchArgs = [
        '--no-warnings', '--no-progress', '--flat-playlist', '--dump-single-json',
        '--socket-timeout', '20', '--retries', '0', '--extractor-retries', '0',
        `ytsearch${SONG_SEARCH_LIMIT}:${songQuery}`,
      ];
      const pythonExecutable = getPythonExecutable(fs);
      const pythonEnv = getPythonEnv(path);
      const searchResult = await runDownloaderWithRetry(execFileAsync, pythonExecutable, ['-m', 'yt_dlp', ...searchArgs], {
        timeout: 60000, windowsHide: true, maxBuffer: 4 * 1024 * 1024, env: pythonEnv,
      }, {
        signal, maxRetries: 1, retryDelayMs: 500,
        onAttempt: setAttempt,
        onRetry: () => setPhase('mengulang pencarian setelah gangguan jaringan'),
      });
      let searchData;
      try { searchData = JSON.parse(searchResult.stdout || '{}'); }
      catch { throw new Error('Hasil pencarian lagu tidak dapat dibaca. Coba lagi sebentar.'); }
      const entries = Array.isArray(searchData.entries) ? searchData.entries : [];
      const results = entries.filter(item => item && item.id).slice(0, SONG_SEARCH_LIMIT).map(item => ({
        id: String(item.id),
        title: safeSongText(item.title),
        artist: safeSongText(item.artist || item.creator || item.uploader || item.channel || 'Artis/kanal tidak tersedia', 100),
        duration: formatDuration(item.duration),
        views: Number.isFinite(Number(item.view_count)) ? Number(item.view_count) : null,
        uploadDate: /^\d{8}$/.test(String(item.upload_date || '')) ? `${String(item.upload_date).slice(0, 4)}-${String(item.upload_date).slice(4, 6)}-${String(item.upload_date).slice(6, 8)}` : '',
        url: item.webpage_url || item.url || `https://www.youtube.com/watch?v=${encodeURIComponent(item.id)}`,
      }));
      if (!results.length) {
        await reply('🔎 Tidak ada hasil lagu yang ditemukan. Coba judul atau nama artis yang lebih spesifik.');
        return;
      }
      pruneSongSelections();
      songSelections.set(selectionKey, { results, expiresAt: Date.now() + SONG_SELECTION_TTL_MS });
      pruneSongSelections();
      const list = results.map((item, index) => {
        const views = Number.isFinite(item.views) && item.views > 0 ? ` • ${item.views.toLocaleString('id-ID')} views` : '';
        const date = item.uploadDate ? ` • ${item.uploadDate}` : '';
        return `${index + 1}. *${item.title}*\n   Artis/Kanal: ${item.artist}\n   Durasi: ${item.duration}${views}${date}`;
      }).join('\n\n');
      await reply(`🎵 *HASIL PENCARIAN LAGU*\n\n${list}\n\nBalas dengan *${PREFIX}song pilih <nomor>* untuk mengunduh pilihan.\n⏰ Hasil berlaku 10 menit.\n\nGunakan hanya audio yang kamu miliki atau diizinkan untuk diunduh.`);
      return;
    }
    setPhase('mengunduh media');
    const commonArgs = [
      '--no-playlist', '--no-warnings', '--no-progress', '--restrict-filenames', '--windows-filenames',
      '--socket-timeout', '20', '--retries', '0', '--fragment-retries', '0', '--extractor-retries', '0',
      // Do not use yt-dlp --max-filesize here: some Pinterest extractors report
      // inaccurate/approximate sizes. Enforce actual size after download below.
      '-o', outputTemplate,
    ];
    if (kind === 'audio') commonArgs.push('-x', '--audio-format', 'mp3', '--audio-quality', '5');
    const downloadTarget = selectedSong ? selectedSong.url : validation.url;
    commonArgs.push(downloadTarget);
    const pythonExecutable = getPythonExecutable(fs);
      const pythonEnv = getPythonEnv(path);
    try {
      await runDownloaderWithRetry(execFileAsync, pythonExecutable, ['-m', 'yt_dlp', ...commonArgs], {
        timeout: 180000, windowsHide: true, maxBuffer: 2 * 1024 * 1024, env: pythonEnv,
      }, {
        signal, maxRetries: 1,
        onAttempt: setAttempt,
        onRetry: () => setPhase('mengulang unduhan setelah gangguan jaringan'),
      });
    } catch (ytError) {
      if (signal?.aborted) throw ytError;
      if (!validation || !shouldUsePinterestPublicFallback(ytError, validation.url)) throw ytError;
      console.warn('[MEDIA DOWNLOAD] Unsupported Pinterest format; trying public metadata-only fallback:', ytError?.stderr || ytError?.message || ytError);
      await pinterestPublicPageFallback(validation.url, outputTemplate, prefix, kind, fs, path, signal);
    }

    setPhase('memeriksa file'); 
    await reply('⚙️ Unduhan selesai. Menyiapkan dan memeriksa file…');
    const dir = path.dirname(outputTemplate);
    const files = (await fs.promises.readdir(dir))
      .filter(name => name.startsWith(prefix) && !name.endsWith('.part') && !name.endsWith('.ytdl'));
    if (!files.length) throw new Error('yt-dlp selesai tetapi file hasil tidak ditemukan.');

    // Prefer the final file and ignore sidecar metadata/subtitle files.
    const candidates = [];
    for (const name of files) {
      const filePath = path.join(dir, name);
      const stat = await fs.promises.stat(filePath).catch(() => null);
      if (stat?.isFile() && stat.size > 0) candidates.push({ name, filePath, size: stat.size, ext: path.extname(name).toLowerCase() });
    }
    const allowed = candidates.filter(file => {
      const detected = detectKind(file.ext);
      return kind === 'auto' ? detected !== 'unknown' : kind === detected || (kind === 'audio' && AUDIO_EXTS.has(file.ext));
    }).sort((a, b) => b.size - a.size);
    let file = allowed[0];
    if (!file) throw new Error(kind === 'auto' ? 'Format media tidak dikenali.' : `Tautan ini tidak menghasilkan file ${kind} yang didukung.`);
    const detectedKind = kind === 'auto' ? detectKind(file.ext) : kind;
    const max = MAX_BYTES[detectedKind] || MAX_BYTES.video;

    // Pinterest and other sites may return large media. Try compressing oversized
    // video, image, or audio with FFmpeg before rejecting it.
    if (file.size > max) {
      let compressedExt = file.ext;
      let compressionArgs = null;
      if (detectedKind === 'video') {
        compressedExt = '.mp4';
        compressionArgs = ['-y', '-i', file.filePath, '-vf', "scale=w='min(1280,iw)':h=-2", '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '29', '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart'];
      } else if (detectedKind === 'image') {
        compressedExt = '.jpg';
        compressionArgs = ['-y', '-i', file.filePath, '-vf', "scale=w='min(2560,iw)':h=-2", '-q:v', '5'];
      } else if (detectedKind === 'audio') {
        compressedExt = '.mp3';
        compressionArgs = ['-y', '-i', file.filePath, '-vn', '-c:a', 'libmp3lame', '-b:a', '96k'];
      }
      if (compressionArgs) {
        setPhase('mengompres file');
        const compressedPath = path.join(dir, `${prefix}compressed${compressedExt}`);
        try {
          await execFileAsync('ffmpeg', [...compressionArgs, compressedPath], { timeout: 180000, windowsHide: true, maxBuffer: 4 * 1024 * 1024, signal });
          const compressedStat = await fs.promises.stat(compressedPath).catch(() => null);
          if (compressedStat?.isFile() && compressedStat.size > 0 && compressedStat.size < file.size) {
            file = { ...file, name: path.basename(compressedPath), filePath: compressedPath, size: compressedStat.size, ext: compressedExt };
          }
        } catch (compressionError) {
          console.error('[MEDIA DOWNLOAD COMPRESSION ERROR]', compressionError?.stderr || compressionError?.message || compressionError);
        }
      }
    }

    if (file.size > max) {
      throw new Error(`File masih terlalu besar setelah diproses (${(file.size / 1024 / 1024).toFixed(1)} MB). Batas pengiriman ${detectedKind}: ${Math.round(max / 1024 / 1024)} MB. Coba tautan atau kualitas video yang lebih rendah.`);
    }
    if (signal?.aborted) throw Object.assign(new Error('Download dibatalkan.'), { name: 'AbortError', code: 'ABORT_ERR' });
    let audioMetadata = null;
    if (detectedKind === 'audio') {
      setPhase('memeriksa metadata audio');
      audioMetadata = await inspectAudioMetadata(file.filePath, execFileAsync, { signal });
    }
    const buffer = await fs.promises.readFile(file.filePath);
    if (signal?.aborted) throw Object.assign(new Error('Download dibatalkan.'), { name: 'AbortError', code: 'ABORT_ERR' });
    setPhase('menyiapkan pengiriman');
    const metadataLines = audioMetadata ? [
      audioMetadata.title ? `Judul: ${audioMetadata.title}` : '',
      audioMetadata.artist ? `Artis: ${audioMetadata.artist}` : '',
      audioMetadata.album ? `Album: ${audioMetadata.album}` : '',
      audioMetadata.duration ? `Durasi: ${audioMetadata.duration}` : '',
      audioMetadata.format ? `Format: ${audioMetadata.format}` : '',
    ].filter(Boolean) : [];
    await reply(`📤 File siap. Mengirim media ke WhatsApp…${metadataLines.length ? `\n${metadataLines.join('\n')}` : ''}`);
    if (signal?.aborted) throw Object.assign(new Error('Download dibatalkan.'), { name: 'AbortError', code: 'ABORT_ERR' });
    setPhase('mengirim media');
    const caption = isSongCommand
      ? `🎵 *${songQuery}*${selectedSong?.artist ? `\nArtis/Kanal: ${selectedSong.artist}` : ''}\n✅ Audio berhasil diunduh\n📦 ${(file.size / 1024 / 1024).toFixed(2)} MB`
      : `✅ Berhasil diunduh\n📦 ${(file.size / 1024 / 1024).toFixed(2)} MB`;
    if (detectedKind === 'image') {
      await sock.sendMessage(remoteJid, { image: buffer, caption }, { quoted: msg });
    } else if (detectedKind === 'video') {
      await sock.sendMessage(remoteJid, { video: buffer, mimetype: getVideoMimeType(file.ext), caption }, { quoted: msg });
    } else {
      await sock.sendMessage(remoteJid, { audio: buffer, mimetype: getAudioMimeType(file.ext), fileName: path.basename(file.name), ptt: false }, { quoted: msg });
    }
    sent = true;
  } catch (error) {
    console.error('[MEDIA DOWNLOAD ERROR]', error?.stderr || error?.message || error);
    const diagnosis = signal?.aborted ? { code: 'cancelled', message: 'Permintaan download dibatalkan.' } : classifyDownloaderError(error);
    let detail = diagnosis.message;
    if (diagnosis.code === 'unsupported' && validation && /(^|\.)pinterest\.com$|(^|\.)pin\.it$/i.test(new URL(validation.url).hostname)) {
      detail = 'yt-dlp tidak menemukan format media. Untuk Pinterest, pastikan Pin bersifat publik dan memiliki jenis media yang diminta. Jika Pin publik tetap gagal, extractor Pinterest mungkin belum bisa membaca media tersebut.';
    }
    if (!sent) {
      const prefixMessage = diagnosis.code === 'cancelled' ? '🛑 Download dibatalkan.' : '❌ Download gagal.';
      await reply(`${prefixMessage}\n${detail.slice(0, 500)}${diagnosis.code === 'cancelled' ? '' : `\n\nCoba tautan publik lain atau gunakan ${PREFIX}dl help.`}`).catch(() => {});
    }
  } finally {
    try {
      const dir = path.dirname(outputTemplate);
      const leftovers = (await fs.promises.readdir(dir)).filter(name => name.startsWith(prefix));
      await Promise.all(leftovers.map(name => fs.promises.unlink(path.join(dir, name)).catch(() => {})));
    } catch {}
  }
  }, {
    requester: requesterKey(remoteJid, ctx.userJid || ctx.sender),
    cleanup: async () => {
      try {
        const dir = path.dirname(outputTemplate);
        const leftovers = (await fs.promises.readdir(dir)).filter(name => name.startsWith(prefix));
        await Promise.all(leftovers.map(name => fs.promises.unlink(path.join(dir, name)).catch(() => {})));
      } catch {}
    },
  });
  if (!queued) {
    return reply(`⏳ Antrean download sedang penuh (maksimal ${MAX_DOWNLOAD_QUEUE} permintaan termasuk yang diproses). Coba lagi sebentar.`);
  }
  try {
    if (queued.position > 1) {
      await reply(`🕒 Permintaan masuk antrean download. Posisi kamu: ${queued.position}/${MAX_DOWNLOAD_QUEUE}. Bot akan memproses otomatis.`);
    }
  } finally {
    queued.start();
  }
  await queued.done;
}
