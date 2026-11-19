import test from 'node:test';
import assert from 'node:assert/strict';
import {
  describeWeatherCode,
  handleLocalInfoCommands,
  resetLocalInfoCacheForTests,
} from '../features/commands/local-info.js';

function response(payload, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => payload };
}

function context(command, args, fetchImpl, replies = []) {
  return {
    command, args, PREFIX: '.', fetch: fetchImpl,
    reply: async value => replies.push(String(value)), replies,
  };
}

test('weather code descriptions cover clear, rain, fog, and thunderstorm conditions', () => {
  assert.equal(describeWeatherCode(0), 'Cerah');
  assert.equal(describeWeatherCode(63), 'Hujan');
  assert.equal(describeWeatherCode(45), 'Kabut');
  assert.equal(describeWeatherCode(95), 'Badai petir');
  assert.equal(describeWeatherCode(999), 'Kondisi tidak diketahui');
});

test('cuaca help is local and does not call the provider', async () => {
  const ctx = context('cuaca', [], async () => { throw new Error('must not fetch'); });
  await handleLocalInfoCommands(ctx);
  assert.match(ctx.replies[0], /CUACA KOTA/);
  assert.match(ctx.replies[0], /\.cuaca Bandung/);
});

test('cuaca resolves city and returns current conditions from Open-Meteo', async () => {
  resetLocalInfoCacheForTests();
  const urls = [];
  const fetchImpl = async url => {
    urls.push(String(url));
    if (String(url).includes('geocoding-api')) return response({ results: [{ name: 'Bandung', admin1: 'Jawa Barat', country: 'Indonesia', latitude: -6.9, longitude: 107.6 }] });
    return response({
      current: { time: '2026-11-14T10:00', temperature_2m: 28.2, relative_humidity_2m: 72, apparent_temperature: 31.1, is_day: 1, precipitation: 0.2, weather_code: 2, wind_speed_10m: 8.4 },
      daily: { temperature_2m_min: [22.1], temperature_2m_max: [30.4] },
      timezone_abbreviation: 'WIB',
    });
  };
  const ctx = context('cuaca', ['Bandung'], fetchImpl);
  await handleLocalInfoCommands(ctx);
  assert.equal(urls.length, 2);
  assert.match(urls[0], /name=Bandung/);
  assert.match(urls[1], /latitude=-6.9/);
  assert.match(ctx.replies[0], /CUACA BANDUNG, JAWA BARAT, INDONESIA/);
  assert.match(ctx.replies[0], /28,2°C/);
  assert.match(ctx.replies[0], /Berawan sebagian/);
  assert.match(ctx.replies[0], /Sumber: Open-Meteo/);
});

test('cuaca caches repeated city lookups and handles missing city results', async () => {
  resetLocalInfoCacheForTests();
  let requests = 0;
  const fetchImpl = async url => {
    requests += 1;
    if (String(url).includes('geocoding-api')) return response({ results: [{ name: 'Jakarta', country: 'Indonesia', latitude: -6.2, longitude: 106.8 }] });
    return response({ current: { time: '2026-11-14T10:00', temperature_2m: 30, relative_humidity_2m: 70, apparent_temperature: 33, is_day: 1, precipitation: 0, weather_code: 0, wind_speed_10m: 5 }, daily: {}, timezone_abbreviation: 'WIB' });
  };
  const first = context('cuaca', ['Jakarta'], fetchImpl);
  const second = context('weather', ['Jakarta'], fetchImpl);
  await handleLocalInfoCommands(first);
  await handleLocalInfoCommands(second);
  assert.equal(requests, 2, 'second request should be served from cache');

  resetLocalInfoCacheForTests();
  const missing = context('cuaca', ['Atlantis'], async () => response({ results: [] }));
  await handleLocalInfoCommands(missing);
  assert.match(missing.replies[0], /tidak ditemukan/);
});

test('gempa returns the latest BMKG event and its safety context', async () => {
  resetLocalInfoCacheForTests();
  let requested = '';
  const fetchImpl = async url => {
    requested = String(url);
    return response({ Infogempa: { gempa: {
      Tanggal: '14 Nov 2026', Jam: '09:12:00 WIB', Magnitude: '4.8', Kedalaman: '10 km',
      Wilayah: 'Pusat gempa berada di laut, 40 km barat daya Kota X',
      Lintang: '6.20 LS', Bujur: '107.60 BT', Potensi: 'Tidak berpotensi tsunami', Dirasakan: 'II-III Kota X',
    } } });
  };
  const ctx = context('gempa', [], fetchImpl);
  await handleLocalInfoCommands(ctx);
  assert.equal(requested, 'https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json');
  assert.match(ctx.replies[0], /INFO GEMPA TERBARU — BMKG/);
  assert.match(ctx.replies[0], /Magnitudo: 4,8/);
  assert.match(ctx.replies[0], /Tidak berpotensi tsunami/);
  assert.match(ctx.replies[0], /Ikuti arahan resmi BMKG dan BPBD/);
});

test('provider failures return concise diagnostics without exposing arbitrary URLs', async () => {
  resetLocalInfoCacheForTests();
  const ctx = context('cuaca', ['Bandung'], async () => response({}, 503));
  await handleLocalInfoCommands(ctx);
  assert.match(ctx.replies[0], /Data cuaca belum bisa diambil/);
  assert.doesNotMatch(ctx.replies[0], /https?:\/\//);
});
