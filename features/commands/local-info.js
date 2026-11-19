const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const BMKG_EARTHQUAKE_URL = 'https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json';
const REQUEST_TIMEOUT_MS = 9_000;
const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_LIMIT = 100;

export const LOCAL_INFO_COMMANDS = new Set(['cuaca', 'weather', 'gempa']);
const responseCache = new Map();

function cleanText(value, max = 100) {
  return String(value ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

function cacheRead(key) {
  const entry = responseCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    responseCache.delete(key);
    return null;
  }
  return entry.value;
}

function cacheWrite(key, value) {
  responseCache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  while (responseCache.size > CACHE_LIMIT) responseCache.delete(responseCache.keys().next().value);
}

async function fetchJson(fetchImpl, url) {
  if (typeof fetchImpl !== 'function') throw new Error('Koneksi internet tidak tersedia pada runtime bot.');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetchImpl(url, {
      method: 'GET',
      headers: { accept: 'application/json' },
      signal: controller.signal,
    });
    if (!response?.ok) throw new Error(`Provider mengembalikan HTTP ${response?.status || 'unknown'}.`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

export function describeWeatherCode(code) {
  const value = Number(code);
  const descriptions = new Map([
    [0, 'Cerah'], [1, 'Cerah berawan'], [2, 'Berawan sebagian'], [3, 'Mendung'],
    [45, 'Kabut'], [48, 'Kabut beku'], [51, 'Gerimis ringan'], [53, 'Gerimis'], [55, 'Gerimis lebat'],
    [56, 'Gerimis beku ringan'], [57, 'Gerimis beku lebat'], [61, 'Hujan ringan'], [63, 'Hujan'], [65, 'Hujan lebat'],
    [66, 'Hujan beku ringan'], [67, 'Hujan beku lebat'], [71, 'Salju ringan'], [73, 'Salju'], [75, 'Salju lebat'],
    [77, 'Butiran salju'], [80, 'Hujan lokal ringan'], [81, 'Hujan lokal'], [82, 'Hujan lokal lebat'],
    [85, 'Hujan salju ringan'], [86, 'Hujan salju lebat'], [95, 'Badai petir'], [96, 'Badai petir dengan hujan es'], [99, 'Badai petir dengan hujan es lebat'],
  ]);
  return descriptions.get(value) || 'Kondisi tidak diketahui';
}

function formatNumber(value, digits = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toLocaleString('id-ID', { maximumFractionDigits: digits, minimumFractionDigits: digits }) : '—';
}

async function getWeather(city, fetchImpl) {
  const cacheKey = `weather:${city.toLowerCase()}`;
  const cached = cacheRead(cacheKey);
  if (cached) return cached;

  const geocodeUrl = new URL(GEOCODING_URL);
  geocodeUrl.search = new URLSearchParams({ name: city, count: '1', language: 'id', format: 'json' }).toString();
  const geocode = await fetchJson(fetchImpl, geocodeUrl);
  const place = geocode?.results?.[0];
  if (!place || !Number.isFinite(Number(place.latitude)) || !Number.isFinite(Number(place.longitude))) return null;

  const forecastUrl = new URL(FORECAST_URL);
  forecastUrl.search = new URLSearchParams({
    latitude: String(place.latitude),
    longitude: String(place.longitude),
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m',
    daily: 'temperature_2m_max,temperature_2m_min',
    forecast_days: '1',
    timezone: 'auto',
  }).toString();
  const forecast = await fetchJson(fetchImpl, forecastUrl);
  if (!forecast?.current) throw new Error('Provider cuaca tidak mengirim data kondisi saat ini.');
  const result = { place, forecast };
  cacheWrite(cacheKey, result);
  return result;
}

async function getLatestEarthquake(fetchImpl) {
  const cached = cacheRead('bmkg:latest-earthquake');
  if (cached) return cached;
  const payload = await fetchJson(fetchImpl, BMKG_EARTHQUAKE_URL);
  const quake = payload?.Infogempa?.gempa;
  if (!quake || !quake.Magnitude || !quake.Wilayah) throw new Error('Format data gempa BMKG belum sesuai.');
  cacheWrite('bmkg:latest-earthquake', quake);
  return quake;
}

export function resetLocalInfoCacheForTests() {
  responseCache.clear();
}

export async function handleLocalInfoCommands(ctx) {
  const { command, args = [], PREFIX = '.', reply } = ctx;
  const fetchImpl = ctx.fetch || ctx.fetchImpl || globalThis.fetch;

  if (command === 'cuaca' || command === 'weather') {
    const city = cleanText(args.join(' '), 80);
    if (!city) return reply(`🌦️ *CUACA KOTA*\nGunakan ${PREFIX}cuaca <nama kota>.\nContoh: ${PREFIX}cuaca Bandung`);
    try {
      const result = await getWeather(city, fetchImpl);
      if (!result) return reply(`Lokasi *${city}* tidak ditemukan. Coba nama kota yang lebih spesifik, misalnya ${PREFIX}cuaca Bandung, Indonesia.`);
      const { place, forecast } = result;
      const current = forecast.current;
      const daily = forecast.daily || {};
      const placeName = [place.name, place.admin1, place.country].filter(Boolean).map(value => cleanText(value, 60)).join(', ');
      const dayLabel = Number(current.is_day) === 1 ? 'Siang' : 'Malam';
      return reply([
        `🌦️ *CUACA ${placeName.toUpperCase()}*`,
        `• Kondisi: ${describeWeatherCode(current.weather_code)} (${dayLabel})`,
        `• Suhu: ${formatNumber(current.temperature_2m, 1)}°C`,
        `• Terasa seperti: ${formatNumber(current.apparent_temperature, 1)}°C`,
        `• Kelembapan: ${formatNumber(current.relative_humidity_2m)}%`,
        `• Curah hujan saat ini: ${formatNumber(current.precipitation, 1)} mm`,
        `• Angin: ${formatNumber(current.wind_speed_10m, 1)} km/jam`,
        `• Rentang hari ini: ${formatNumber(daily.temperature_2m_min?.[0], 1)}–${formatNumber(daily.temperature_2m_max?.[0], 1)}°C`,
        `• Waktu lokal: ${cleanText(current.time, 40)} ${cleanText(forecast.timezone_abbreviation, 12)}`,
        '',
        '_Sumber: Open-Meteo. Data prakiraan dapat berubah._',
      ].join('\n'));
    } catch (error) {
      const message = /abort|timeout/i.test(String(error?.name || error?.message))
        ? 'Permintaan cuaca melewati batas waktu. Coba lagi sebentar.'
        : `Data cuaca belum bisa diambil: ${cleanText(error?.message || 'provider tidak tersedia', 140)}`;
      return reply(message);
    }
  }

  if (command === 'gempa') {
    try {
      const quake = await getLatestEarthquake(fetchImpl);
      const lines = [
        '🌏 *INFO GEMPA TERBARU — BMKG*',
        `• Waktu: ${cleanText(quake.Tanggal, 40)} ${cleanText(quake.Jam, 30)}`,
        `• Magnitudo: ${formatNumber(quake.Magnitude, 1)}`,
        `• Kedalaman: ${cleanText(quake.Kedalaman, 24)}`,
        `• Lokasi: ${cleanText(quake.Wilayah, 180)}`,
        `• Koordinat: ${cleanText(quake.Lintang, 24)}, ${cleanText(quake.Bujur, 24)}`,
        `• Potensi: ${cleanText(quake.Potensi || 'Tidak ada keterangan', 180)}`,
      ];
      if (quake.Dirasakan) lines.push(`• Dirasakan: ${cleanText(quake.Dirasakan, 180)}`);
      lines.push('', '_Sumber: BMKG — informasi gempa terkini. Ikuti arahan resmi BMKG dan BPBD setempat._');
      return reply(lines.join('\n'));
    } catch (error) {
      return reply(`Data gempa BMKG belum bisa diambil: ${cleanText(error?.message || 'provider tidak tersedia', 140)}`);
    }
  }
}
