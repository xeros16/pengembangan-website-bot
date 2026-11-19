import test from 'node:test';
import assert from 'node:assert/strict';
import {
  handleAnimeDiscoveryCommand,
  resetAnimeDiscoveryStateForTests,
} from '../features/commands/anime-discovery.js';
import { handleGeneralHelpCommands } from '../features/commands/general-help.js';

function anime(id, title = 'Frieren: Beyond Journey’s End') {
  return {
    mal_id: id,
    title,
    title_english: title,
    type: 'TV',
    episodes: 28,
    year: 2023,
    score: 9.2,
    synopsis: 'An elf mage travels after the hero party has defeated the Demon King.',
    url: `https://myanimelist.net/anime/${id}`,
    genres: [{ name: 'Adventure' }, { name: 'Drama' }],
    studios: [{ name: 'Madhouse' }],
    status: 'Finished Airing',
  };
}

function makeContext(args, fetch, replies = []) {
  return {
    command: 'anime',
    args,
    PREFIX: '.',
    fetch,
    reply: async (message) => { replies.push(message); return message; },
  };
}

test('anime help returns supported command syntax without making an API request', async () => {
  resetAnimeDiscoveryStateForTests();
  let calls = 0;
  const replies = [];
  await handleAnimeDiscoveryCommand(makeContext([], async () => { calls += 1; }, replies));
  assert.equal(calls, 0);
  assert.match(replies[0], /\.anime cari <judul>/);
  assert.match(replies[0], /\.anime detail <ID>/);
});

test('anime search requests safe results and renders title, score, synopsis, and MAL reference', async () => {
  resetAnimeDiscoveryStateForTests();
  const replies = [];
  let requestedUrl = '';
  const fetch = async (url, options) => {
    requestedUrl = String(url);
    assert.equal(options.method, 'GET');
    return { ok: true, status: 200, json: async () => ({ data: [anime(52991)] }) };
  };
  await handleAnimeDiscoveryCommand(makeContext(['cari', 'Frieren'], fetch, replies));
  assert.match(requestedUrl, /api\.jikan\.moe\/v4\/anime\?/);
  assert.match(requestedUrl, /sfw=true/);
  assert.match(requestedUrl, /q=Frieren/);
  assert.match(replies[0], /Frieren/);
  assert.match(replies[0], /9\.20/);
  assert.match(replies[0], /Madhouse|Beyond/);
  assert.match(replies[0], /https:\/\/myanimelist\.net\/anime\/52991/);
});

test('anime popular and seasonal commands call their dedicated Jikan endpoints', async () => {
  resetAnimeDiscoveryStateForTests();
  const replies = [];
  const urls = [];
  const fetch = async (url) => {
    urls.push(String(url));
    return { ok: true, status: 200, json: async () => ({ data: [anime(urls.length)] }) };
  };
  await handleAnimeDiscoveryCommand(makeContext(['populer'], fetch, replies));
  await handleAnimeDiscoveryCommand(makeContext(['musim'], fetch, replies));
  assert.match(urls[0], /\/top\/anime\?/);
  assert.match(urls[1], /\/seasons\/now\?/);
  assert.match(replies[0], /ANIME POPULER/);
  assert.match(replies[1], /ANIME MUSIM INI/);
});

test('anime detail validates the ID and renders metadata from the full endpoint', async () => {
  resetAnimeDiscoveryStateForTests();
  const replies = [];
  let calls = 0;
  const fetch = async (url) => {
    calls += 1;
    assert.match(String(url), /\/anime\/52991\/full$/);
    return { ok: true, status: 200, json: async () => ({ data: anime(52991) }) };
  };
  await handleAnimeDiscoveryCommand(makeContext(['detail', 'invalid'], fetch, replies));
  assert.equal(calls, 0);
  assert.match(replies[0], /ID MyAnimeList yang valid/);
  await handleAnimeDiscoveryCommand(makeContext(['detail', '52991'], fetch, replies));
  assert.equal(calls, 1);
  assert.match(replies[1], /Sinopsis/);
  assert.match(replies[1], /Adventure/);
  assert.match(replies[1], /Madhouse/);
});

test('anime search caches identical queries for a short period', async () => {
  resetAnimeDiscoveryStateForTests();
  let calls = 0;
  const fetch = async () => {
    calls += 1;
    return { ok: true, status: 200, json: async () => ({ data: [anime(1)] }) };
  };
  await handleAnimeDiscoveryCommand(makeContext(['cari', 'cached title'], fetch, []));
  await handleAnimeDiscoveryCommand(makeContext(['cari', 'cached title'], fetch, []));
  assert.equal(calls, 1);
});

test('anime API rate limiting returns a friendly retry message', async () => {
  resetAnimeDiscoveryStateForTests();
  const replies = [];
  const fetch = async () => ({ ok: false, status: 429, json: async () => ({}) });
  await handleAnimeDiscoveryCommand(makeContext(['cari', 'rate limit case'], fetch, replies));
  assert.match(replies[0], /membatasi permintaan/);
});

test('anime detail filters entries marked for mature or explicit content', async () => {
  resetAnimeDiscoveryStateForTests();
  const replies = [];
  const fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({ data: { ...anime(999), rating: 'Rx - Hentai' } }),
  });
  await handleAnimeDiscoveryCommand(makeContext(['detail', '999'], fetch, replies));
  assert.match(replies[0], /disaring/);
  assert.doesNotMatch(replies[0], /Frieren/);
});

test('anime rejects too-short search queries and unknown subcommands', async () => {
  resetAnimeDiscoveryStateForTests();
  const replies = [];
  let calls = 0;
  const fetch = async () => { calls += 1; return { ok: true, status: 200, json: async () => ({ data: [] }) }; };
  await handleAnimeDiscoveryCommand(makeContext(['cari', 'x'], fetch, replies));
  await handleAnimeDiscoveryCommand(makeContext(['tidak-ada'], fetch, replies));
  assert.equal(calls, 0);
  assert.match(replies[0], /minimal 2 karakter/);
  assert.match(replies[1], /ANIME DISCOVERY/);
});


test('anime help, menu, and need-based workflow are discoverable in WhatsApp navigation', async () => {
  const replies = [];
  const ctx = {
    command: 'menu',
    args: ['anime'],
    PREFIX: '.',
    reply: async (message) => { replies.push(message); },
  };
  await handleGeneralHelpCommands(ctx);
  assert.match(replies.at(-1), /ANIME & HIBURAN/);
  assert.match(replies.at(-1), /\.song/);

  await handleGeneralHelpCommands({ ...ctx, command: 'help', args: ['anime'] });
  assert.match(replies.at(-1), /MyAnimeList\/Jikan/);
  assert.match(replies.at(-1), /\.anime detail/);

  await handleGeneralHelpCommands({ ...ctx, command: 'alur', args: ['anime'] });
  assert.match(replies.at(-1), /MENJELAJAHI ANIME/i);
  assert.match(replies.at(-1), /\.anime musim/);
});


test('anime search automatically falls back to AniList when Jikan is unavailable', async () => {
  resetAnimeDiscoveryStateForTests();
  const replies = [];
  const calls = [];
  const fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    if (String(url).includes('api.jikan.moe')) {
      return { ok: false, status: 503, json: async () => ({}) };
    }
    assert.equal(String(url), 'https://graphql.anilist.co');
    assert.equal(options.method, 'POST');
    const body = JSON.parse(options.body);
    assert.equal(body.variables.search, 'Frieren');
    return {
      ok: true, status: 200,
      json: async () => ({
        data: { Page: { media: [{
          id: 123, idMal: 52991,
          title: { romaji: 'Sousou no Frieren', english: 'Frieren: Beyond Journey’s End', native: '葬送のフリーレン' },
          description: 'An elf mage travels after the hero party has defeated the Demon King.',
          episodes: 28, averageScore: 92, seasonYear: 2023, format: 'TV',
          status: 'FINISHED', genres: ['Adventure', 'Drama'], isAdult: false,
          siteUrl: 'https://anilist.co/anime/123',
          studios: { nodes: [{ name: 'Madhouse' }] },
        }] } },
      }),
    };
  };
  await handleAnimeDiscoveryCommand(makeContext(['cari', 'Frieren'], fetch, replies));
  assert.equal(calls.length, 2);
  assert.match(replies[0], /Frieren: Beyond Journey/);
  assert.match(replies[0], /9\.20/);
  assert.match(replies[0], /AniList \(cadangan\)/);
  assert.match(replies[0], /myanimelist\.net\/anime\/52991/);
});

test('anime popular and seasonal fallback use AniList filters when Jikan rate limits', async () => {
  resetAnimeDiscoveryStateForTests();
  const replies = [];
  const variables = [];
  const fetch = async (url, options = {}) => {
    if (String(url).includes('api.jikan.moe')) return { ok: false, status: 429, json: async () => ({}) };
    variables.push(JSON.parse(options.body).variables);
    return {
      ok: true, status: 200,
      json: async () => ({ data: { Page: { media: [{
        id: 1, idMal: 1, title: { romaji: 'Fallback Anime' }, averageScore: 80,
        episodes: 12, format: 'TV', isAdult: false, siteUrl: 'https://anilist.co/anime/1',
        studios: { nodes: [] }, genres: [],
      }] } } }),
    };
  };
  await handleAnimeDiscoveryCommand(makeContext(['populer'], fetch, replies));
  await handleAnimeDiscoveryCommand(makeContext(['musim'], fetch, replies));
  assert.deepEqual(variables[0].sort, ['POPULARITY_DESC']);
  assert.ok(['WINTER', 'SPRING', 'SUMMER', 'FALL'].includes(variables[1].season));
  assert.match(replies[0], /AniList \(cadangan\)/);
  assert.match(replies[1], /ANIME MUSIM INI/);
});

test('anime gives a provider-specific diagnostic when both providers fail', async () => {
  resetAnimeDiscoveryStateForTests();
  const replies = [];
  const fetch = async () => ({ ok: false, status: 429, json: async () => ({}) });
  await handleAnimeDiscoveryCommand(makeContext(['cari', 'limited anime'], fetch, replies));
  assert.match(replies[0], /Jikan dan\/atau AniList sedang membatasi/);
});
