// Anime discovery commands powered by the public Jikan API (MyAnimeList data).
// Search-only: this module does not provide unofficial streaming or copyrighted downloads.
const API_BASE = 'https://api.jikan.moe/v4';
const ANILIST_API = 'https://graphql.anilist.co';
const MIN_REQUEST_INTERVAL_MS = 360; // Jikan public API pacing
const REQUEST_TIMEOUT_MS = 12_000;
const ANILIST_QUERY = `query ($search: String, $idMal: Int, $sort: [MediaSort], $season: MediaSeason, $seasonYear: Int) {\n  Page(page: 1, perPage: 5) {\n    media(type: ANIME, search: $search, idMal: $idMal, sort: $sort, season: $season, seasonYear: $seasonYear, isAdult: false) {\n      id idMal title { romaji english native } description(asHtml: false) episodes averageScore seasonYear format status genres isAdult siteUrl studios(isMain: true) { nodes { name } }\n    }\n  }\n}`;
const CACHE_LIMIT = 180;
const CACHE_TTLS = Object.freeze({
  search: 5 * 60 * 1000,
  top: 20 * 60 * 1000,
  season: 15 * 60 * 1000,
  detail: 60 * 60 * 1000,
});

export const ANIME_DISCOVERY_COMMANDS = new Set(['anime']);

const responseCache = new Map();
let requestChain = Promise.resolve();
let aniListRequestChain = Promise.resolve();
let lastRequestAt = 0;

function cleanText(value, maxLength = 220) {
  return String(value ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/[*_~`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function readCache(key) {
  const entry = responseCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    responseCache.delete(key);
    return null;
  }
  // Refresh insertion order for bounded LRU-style eviction.
  responseCache.delete(key);
  responseCache.set(key, entry);
  return entry.value;
}

function writeCache(key, value, ttl) {
  responseCache.delete(key);
  responseCache.set(key, { value, expiresAt: Date.now() + ttl });
  while (responseCache.size > CACHE_LIMIT) {
    responseCache.delete(responseCache.keys().next().value);
  }
}

function enqueueApiRequest(fetchImpl, url) {
  const task = requestChain.then(async () => {
    const waitMs = Math.max(0, MIN_REQUEST_INTERVAL_MS - (Date.now() - lastRequestAt));
    if (waitMs) await sleep(waitMs);
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
      const error = new Error(`Jikan API returned HTTP ${response?.status || 'unknown'}.`);
      error.status = Number(response?.status || 0);
      throw error;
    }

    const payload = await response.json();
    if (!payload || !Object.hasOwn(payload, 'data')) {
      throw new Error('Jikan API returned an unexpected response.');
    }
    return payload.data;
  });

  // A failed request must not poison the queue for later users.
  requestChain = task.catch(() => undefined);
  return task;
}

function createTimeoutSignal() {
  return typeof globalThis.AbortSignal?.timeout === 'function'
    ? globalThis.AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    : undefined;
}

function mapAniListAnime(item) {
  if (!item || !Number.isSafeInteger(Number(item.id))) return null;
  const title = item.title?.romaji || item.title?.english || item.title?.native || 'Judul tidak tersedia';
  const description = String(item.description || '')
    .replace(/<br\s*\/?\s*>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim();
  return {
    mal_id: Number.isSafeInteger(Number(item.idMal)) && Number(item.idMal) > 0 ? Number(item.idMal) : null,
    anilist_id: Number(item.id),
    title,
    title_english: item.title?.english || '',
    title_japanese: item.title?.native || '',
    type: item.format || '',
    episodes: item.episodes || null,
    year: item.seasonYear || null,
    score: item.averageScore !== null && item.averageScore !== undefined && Number.isFinite(Number(item.averageScore)) ? Number(item.averageScore) / 10 : null,
    synopsis: description,
    url: item.siteUrl || `https://anilist.co/anime/${Number(item.id)}`,
    genres: Array.isArray(item.genres) ? item.genres.map(name => ({ name })) : [],
    studios: Array.isArray(item.studios?.nodes) ? item.studios.nodes : [],
    status: String(item.status || '').replaceAll('_', ' '),
    isAdult: item.isAdult === true,
  };
}

function getCurrentAnimeSeason(date = new Date()) {
  const month = date.getUTCMonth() + 1;
  const season = month <= 3 ? 'WINTER' : month <= 6 ? 'SPRING' : month <= 9 ? 'SUMMER' : 'FALL';
  return { season, seasonYear: date.getUTCFullYear() };
}

function enqueueAniListRequest(fetchImpl, variables) {
  const task = aniListRequestChain.then(async () => {
    const signal = createTimeoutSignal();
    const response = await fetchImpl(ANILIST_API, {
      method: 'POST',
      headers: { accept: 'application/json', 'content-type': 'application/json' },
      body: JSON.stringify({ query: ANILIST_QUERY, variables }),
      ...(signal ? { signal } : {}),
    });
    if (!response?.ok) {
      const error = new Error(`AniList API returned HTTP ${response?.status || 'unknown'}.`);
      error.status = Number(response?.status || 0);
      throw error;
    }
    const payload = await response.json();
    if (Array.isArray(payload?.errors) && payload.errors.length) {
      throw new Error('AniList API returned a GraphQL error.');
    }
    const media = payload?.data?.Page?.media;
    if (!Array.isArray(media)) throw new Error('AniList API returned an unexpected response.');
    return media.map(mapAniListAnime).filter(Boolean);
  });
  aniListRequestChain = task.catch(() => undefined);
  return task;
}

async function requestAnimeData(path, cacheKey, ttl, fetchImpl, fallbackVariables) {
  const cached = readCache(cacheKey);
  if (cached !== null) return cached;
  try {
    const data = await enqueueApiRequest(fetchImpl, `${API_BASE}${path}`);
    const result = { data, provider: 'MyAnimeList / Jikan' };
    writeCache(cacheKey, result, ttl);
    return result;
  } catch (primaryError) {
    try {
      const data = await enqueueAniListRequest(fetchImpl, fallbackVariables);
      const result = { data, provider: 'AniList (cadangan)' };
      writeCache(cacheKey, result, ttl);
      return result;
    } catch (fallbackError) {
      const error = new Error('All anime providers failed.');
      error.primaryError = primaryError;
      error.fallbackError = fallbackError;
      error.status = Number(primaryError?.status || fallbackError?.status || 0);
      throw error;
    }
  }
}

function getFetch(ctx) {
  const fetchImpl = ctx.fetch || ctx.fetchImpl || globalThis.fetch;
  return typeof fetchImpl === 'function' ? fetchImpl : null;
}

function animeTitle(anime) {
  return cleanText(anime?.title_english || anime?.title || anime?.title_japanese || 'Judul tidak tersedia', 120);
}

function animeYear(anime) {
  const year = anime?.year || anime?.aired?.prop?.from?.year || anime?.aired?.from?.slice?.(0, 4);
  return year ? String(year) : 'tahun tidak diketahui';
}

function animeScore(anime) {
  return Number.isFinite(Number(anime?.score)) && anime?.score !== null
    ? `⭐ ${Number(anime.score).toFixed(2)}`
    : '⭐ Belum ada skor';
}

function animeUrl(anime) {
  const id = Number(anime?.mal_id);
  if (Number.isSafeInteger(id) && id > 0) return `https://myanimelist.net/anime/${id}`;
  const alternate = String(anime?.url || '');
  try {
    const parsed = new URL(alternate);
    return parsed.protocol === 'https:' && parsed.hostname === 'anilist.co' ? parsed.toString() : '';
  } catch { return ''; }
}

function formatAnimeCard(anime, index) {
  const title = animeTitle(anime);
  const meta = [
    cleanText(anime?.type, 24),
    anime?.episodes ? `${anime.episodes} episode` : '',
    animeYear(anime),
  ].filter(Boolean).join(' • ');
  const synopsis = cleanText(anime?.synopsis, 190) || 'Sinopsis belum tersedia.';
  const url = animeUrl(anime);
  return `${index + 1}. *${title}*\n   ${meta}\n   ${animeScore(anime)}\n   ${synopsis}${url ? `\n   ${url}` : ''}`;
}

function formatAnimeList(data, heading, query = '', provider = 'MyAnimeList melalui Jikan') {
  if (!Array.isArray(data) || !data.length) {
    return `🎬 *${heading}*\n\nBelum ada hasil yang cocok. Coba kata kunci lain atau ulangi beberapa saat lagi.`;
  }
  const items = data.slice(0, 5).map(formatAnimeCard).join('\n\n');
  return `🎬 *${heading}*${query ? `\nKata kunci: ${query}` : ''}\n\n${items}\n\n_Sumber data: ${provider}. Informasi dapat berubah._`;
}

function isExplicitAnime(anime) {
  const rating = cleanText(anime?.rating, 100).toLowerCase();
  return /\br\+|\brx\b|hentai|ecchi|mild nudity|explicit/i.test(rating);
}

function formatAnimeDetail(anime, provider = 'MyAnimeList melalui Jikan') {
  if (!anime || !Number.isSafeInteger(Number(anime.mal_id))) {
    return 'Detail anime tidak ditemukan. Periksa ID MyAnimeList lalu coba lagi.';
  }
  if (isExplicitAnime(anime)) {
    return 'Konten ini disaring karena rating atau penanda kontennya tidak sesuai untuk penelusuran aman.';
  }
  const genres = Array.isArray(anime.genres)
    ? anime.genres.map(item => cleanText(item?.name, 40)).filter(Boolean).slice(0, 8).join(', ')
    : '';
  const studios = Array.isArray(anime.studios)
    ? anime.studios.map(item => cleanText(item?.name, 60)).filter(Boolean).slice(0, 4).join(', ')
    : '';
  const synopsis = cleanText(anime.synopsis, 900) || 'Sinopsis belum tersedia.';
  const details = [
    `🎬 *${animeTitle(anime)}*`,
    anime.title_english && anime.title && anime.title_english !== anime.title
      ? `Judul alternatif: ${cleanText(anime.title, 120)}`
      : '',
    `${animeScore(anime)} • ${cleanText(anime.type, 24) || 'Format tidak diketahui'} • ${anime.episodes || '?'} episode`,
    anime.rating ? `Rating: ${cleanText(anime.rating, 80)}` : '',
    `Status: ${cleanText(anime.status, 60) || 'Tidak diketahui'} • Tahun: ${animeYear(anime)}`,
    genres ? `Genre: ${genres}` : '',
    studios ? `Studio: ${studios}` : '',
    '',
    `*Sinopsis*\n${synopsis}`,
    '',
    `MyAnimeList: ${animeUrl(anime)}`,
    `_Sumber data: ${provider}.`,
  ].filter(Boolean);
  return details.join('\n');
}

function usage(prefix = '.') {
  return [
    '🎬 *ANIME DISCOVERY*',
    '',
    `• ${prefix}anime cari <judul> — cari anime berdasarkan judul`,
    `• ${prefix}anime populer — daftar anime populer`,
    `• ${prefix}anime musim — anime yang tayang musim ini`,
    `• ${prefix}anime detail <ID> — informasi lengkap berdasarkan ID MyAnimeList`,
    '',
    'Contoh:',
    `• ${prefix}anime cari Frieren`,
    `• ${prefix}anime populer`,
    `• ${prefix}anime musim`,
    `• ${prefix}anime detail 52991`,
    '',
    'Sumber utama MyAnimeList/Jikan; jika bermasalah, PIR otomatis mencoba AniList sebagai cadangan.',
    'Fitur ini menampilkan informasi dan tautan referensi resmi; bukan layanan streaming atau download.',
  ].join('\n');
}

function errorMessage(error) {
  const primary = error?.primaryError || error;
  const fallback = error?.fallbackError;
  const statuses = [primary?.status, fallback?.status].map(Number);
  if (statuses.includes(429)) {
    return 'Jikan dan/atau AniList sedang membatasi permintaan. Tunggu sekitar satu menit sebelum mencoba lagi.';
  }
  if (statuses.some(status => status >= 500)) {
    return 'Penyedia data anime sedang mengalami gangguan. PIR sudah mencoba sumber cadangan; coba lagi beberapa saat.';
  }
  if ([primary, fallback].some(item => item?.name === 'TimeoutError' || item?.name === 'AbortError')) {
    return 'Koneksi ke penyedia data anime melewati batas waktu. PIR sudah mencoba sumber cadangan; coba lagi beberapa saat.';
  }
  if (primary?.name === 'TypeError' || fallback?.name === 'TypeError') {
    return 'Bot tidak dapat menjangkau penyedia data anime. Periksa DNS, firewall, dan koneksi keluar server.';
  }
  return 'Jikan dan AniList sama-sama belum dapat menyediakan data. Coba lagi nanti; fitur lain tetap bisa digunakan.';
}

export async function handleAnimeDiscoveryCommand(ctx) {
  const { command, args = [], PREFIX = '.', reply } = ctx;
  if (!ANIME_DISCOVERY_COMMANDS.has(command)) return false;

  const subcommand = String(args[0] || '').toLowerCase();
  const fetchImpl = getFetch(ctx);
  if (!fetchImpl) return reply('Fitur pencarian anime membutuhkan dukungan fetch pada Node.js 18 atau lebih baru.');

  if (!subcommand || ['help', 'bantuan', 'menu'].includes(subcommand)) {
    return reply(usage(PREFIX));
  }

  try {
    if (['cari', 'search'].includes(subcommand)) {
      const query = cleanText(args.slice(1).join(' '), 80);
      if (query.length < 2) return reply(`Masukkan judul minimal 2 karakter.\nContoh: ${PREFIX}anime cari Frieren`);
      const params = new URLSearchParams({ q: query, limit: '5', sfw: 'true', order_by: 'score', sort: 'desc' });
      const result = await requestAnimeData(
        `/anime?${params}`,
        `search:${query.toLowerCase()}`,
        CACHE_TTLS.search,
        fetchImpl,
        { search: query, sort: ['SEARCH_MATCH', 'POPULARITY_DESC'] },
      );
      return reply(formatAnimeList(result.data, 'HASIL PENCARIAN ANIME', query, result.provider));
    }

    if (['populer', 'popular', 'top'].includes(subcommand)) {
      const params = new URLSearchParams({ filter: 'bypopularity', limit: '5', sfw: 'true' });
      const result = await requestAnimeData(
        `/top/anime?${params}`,
        'top:popular',
        CACHE_TTLS.top,
        fetchImpl,
        { sort: ['POPULARITY_DESC'] },
      );
      return reply(formatAnimeList(result.data, 'ANIME POPULER', '', result.provider));
    }

    if (['musim', 'season', 'seasonal'].includes(subcommand)) {
      const params = new URLSearchParams({ limit: '5', sfw: 'true' });
      const season = getCurrentAnimeSeason();
      const result = await requestAnimeData(
        `/seasons/now?${params}`,
        `season:${season.season}:${season.seasonYear}`,
        CACHE_TTLS.season,
        fetchImpl,
        { season: season.season, seasonYear: season.seasonYear, sort: ['POPULARITY_DESC'] },
      );
      return reply(formatAnimeList(result.data, 'ANIME MUSIM INI', '', result.provider));
    }

    if (['detail', 'info'].includes(subcommand)) {
      const id = Number(args[1]);
      if (!Number.isSafeInteger(id) || id < 1) {
        return reply(`Masukkan ID MyAnimeList yang valid.\nContoh: ${PREFIX}anime detail 52991`);
      }
      const result = await requestAnimeData(
        `/anime/${id}/full`,
        `detail:${id}`,
        CACHE_TTLS.detail,
        fetchImpl,
        { idMal: id },
      );
      return reply(formatAnimeDetail(Array.isArray(result.data) ? result.data[0] : result.data, result.provider));
    }

    return reply(usage(PREFIX));
  } catch (error) {
    console.warn('[ANIME DISCOVERY]', error?.status || error?.message || error);
    return reply(`⚠️ ${errorMessage(error)}\n\nKetik ${PREFIX}anime help untuk melihat format penggunaan.`);
  }
}

// Test helper deliberately clears only this module's ephemeral cache/queue.
export function resetAnimeDiscoveryStateForTests() {
  responseCache.clear();
  requestChain = Promise.resolve();
  aniListRequestChain = Promise.resolve();
  lastRequestAt = 0;
}
