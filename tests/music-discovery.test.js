import test from 'node:test';
import assert from 'node:assert/strict';
import { handleMusicDiscoveryCommand, resetMusicDiscoveryStateForTests } from '../features/commands/music-discovery.js';

function makeResponse(results, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => ({ resultCount: results.length, results }) };
}
function makeCtx(args, fetchImpl, replies = []) {
  return {
    command: 'music', args, PREFIX: '!', fetch: fetchImpl,
    reply: async message => { replies.push(message); },
  };
}

test('music help is local and does not call provider', async () => {
  const replies = [];
  let calls = 0;
  await handleMusicDiscoveryCommand(makeCtx(['help'], async () => { calls += 1; }, replies));
  assert.equal(calls, 0);
  assert.match(replies[0], /MUSIC DISCOVERY/);
  assert.match(replies[0], /!music cari/);
});

test('song search uses iTunes API, filters explicit entries, and renders metadata', async () => {
  resetMusicDiscoveryStateForTests();
  const replies = [];
  let requested;
  const fetchImpl = async url => {
    requested = new URL(url);
    return makeResponse([
      { trackId: 11, trackName: 'Rumpang', artistName: 'Nadin Amizah', collectionName: 'Selamat Ulang Tahun', primaryGenreName: 'Pop', releaseDate: '2020-05-28T00:00:00Z', trackTimeMillis: 240000, trackViewUrl: 'https://music.apple.com/id/song/rum-pang/11', trackExplicitness: 'notExplicit' },
      { trackId: 12, trackName: 'Explicit Track', artistName: 'Artist', trackExplicitness: 'explicit' },
    ]);
  };
  await handleMusicDiscoveryCommand(makeCtx(['cari', 'Nadin', 'Amizah'], fetchImpl, replies));
  assert.equal(requested.hostname, 'itunes.apple.com');
  assert.equal(requested.pathname, '/search');
  assert.equal(requested.searchParams.get('entity'), 'song');
  assert.equal(requested.searchParams.get('term'), 'Nadin Amizah');
  assert.match(replies[0], /Rumpang/);
  assert.match(replies[0], /Nadin Amizah/);
  assert.match(replies[0], /Track ID: 11/);
  assert.match(replies[0], /Selamat Ulang Tahun/);
  assert.match(replies[0], /music\.apple\.com/);
  assert.doesNotMatch(replies[0], /Explicit Track/);
  assert.doesNotMatch(replies[0], /previewUrl/);
});

test('album and artist subcommands use the correct iTunes entities', async () => {
  resetMusicDiscoveryStateForTests();
  const replies = [];
  const entities = [];
  const fetchImpl = async url => {
    const parsed = new URL(url);
    entities.push(parsed.searchParams.get('entity'));
    if (parsed.searchParams.get('entity') === 'album') {
      return makeResponse([{ collectionName: 'Album Test', artistName: 'Artist Test', trackCount: 10, releaseDate: '2024-01-01', collectionViewUrl: 'https://music.apple.com/id/album/test/2' }]);
    }
    return makeResponse([{ artistName: 'Artist Test', primaryGenreName: 'Pop', artistLinkUrl: 'https://music.apple.com/artist/test/3' }]);
  };
  await handleMusicDiscoveryCommand(makeCtx(['album', 'Album', 'Test'], fetchImpl, replies));
  await handleMusicDiscoveryCommand(makeCtx(['artis', 'Artist', 'Test'], fetchImpl, replies));
  assert.deepEqual(entities, ['album', 'musicArtist']);
  assert.match(replies[0], /Album Test/);
  assert.match(replies[1], /Artist Test/);
});

test('detail validates track ID and looks up official metadata', async () => {
  resetMusicDiscoveryStateForTests();
  const replies = [];
  let requested;
  const fetchImpl = async url => {
    requested = new URL(url);
    return makeResponse([{ trackId: 144, trackName: 'Detail Song', artistName: 'Detail Artist', trackViewUrl: 'https://music.apple.com/id/song/detail/144', trackTimeMillis: 90000 }]);
  };
  await handleMusicDiscoveryCommand(makeCtx(['detail', '144'], fetchImpl, replies));
  assert.equal(requested.pathname, '/lookup');
  assert.equal(requested.searchParams.get('id'), '144');
  assert.match(replies[0], /Detail Song/);
  assert.match(replies[0], /Track ID: 144/);
  assert.match(replies[0], /Detail Artist/);
  const invalid = [];
  await handleMusicDiscoveryCommand(makeCtx(['detail', 'abc'], fetchImpl, invalid));
  assert.match(invalid[0], /track ID iTunes yang valid/);
});

test('music query validation and provider 429 errors are friendly', async () => {
  resetMusicDiscoveryStateForTests();
  const short = [];
  await handleMusicDiscoveryCommand(makeCtx(['cari', 'x'], async () => makeResponse([]), short));
  assert.match(short[0], /minimal 2 karakter/);
  const limited = [];
  await handleMusicDiscoveryCommand(makeCtx(['cari', 'Tulus'], async () => makeResponse([], 429), limited));
  assert.match(limited[0], /membatasi permintaan/);
});

test('music search cache avoids duplicate provider requests', async () => {
  resetMusicDiscoveryStateForTests();
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    return makeResponse([{ trackId: 1, trackName: 'Cached Song', artistName: 'Artist' }]);
  };
  await handleMusicDiscoveryCommand(makeCtx(['cari', 'Cached Song'], fetchImpl, []));
  await handleMusicDiscoveryCommand(makeCtx(['cari', 'Cached Song'], fetchImpl, []));
  assert.equal(calls, 1);
});

test('music top reads the Indonesian Apple RSS chart and renders official links', async () => {
  resetMusicDiscoveryStateForTests();
  const replies = [];
  let requested;
  const fetchImpl = async url => {
    requested = new URL(url);
    return {
      ok: true, status: 200,
      json: async () => ({ feed: { entry: [
        {
          'im:name': { label: 'Lagu Teratas' },
          'im:artist': { label: 'Artis Indonesia' },
          'im:collection': { 'im:name': { label: 'Album Indonesia' } },
          link: [{ attributes: { rel: 'alternate', href: 'https://music.apple.com/id/album/lagu/123' } }],
        },
      ] } }),
    };
  };
  await handleMusicDiscoveryCommand(makeCtx(['top'], fetchImpl, replies));
  assert.equal(requested.hostname, 'itunes.apple.com');
  assert.equal(requested.pathname, '/id/rss/topsongs/limit=10/json');
  assert.match(replies[0], /TOP 10 LAGU/);
  assert.match(replies[0], /Lagu Teratas/);
  assert.match(replies[0], /Artis Indonesia/);
  assert.match(replies[0], /Album Indonesia/);
  assert.match(replies[0], /music\.apple\.com/);
  assert.match(replies[0], /tidak mengunduh audio/);
});


test('Apple Music song URL downloads only the official preview supplied by Apple', async () => {
  resetMusicDiscoveryStateForTests();
  const replies = [];
  const sent = [];
  const calls = [];
  const trackUrl = 'https://music.apple.com/id/album/example-album/222?i=1440857781';
  const fetchImpl = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    if (String(url).includes('itunes.apple.com/lookup')) {
      const parsed = new URL(String(url));
      assert.equal(parsed.searchParams.get('id'), '1440857781');
      return makeResponse([{
        trackId: 1440857781,
        trackName: 'Example Song',
        artistName: 'Example Artist',
        trackExplicitness: 'notExplicit',
        previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview123.m4a',
      }]);
    }
    assert.equal(String(url), 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview123.m4a');
    assert.equal(options.method, 'GET');
    return {
      ok: true, status: 200,
      headers: { get: name => name.toLowerCase() === 'content-type' ? 'audio/mp4' : '12' },
      arrayBuffer: async () => Uint8Array.from([0, 1, 2, 3, 4, 5]).buffer,
    };
  };
  const ctx = {
    ...makeCtx(['preview', trackUrl], fetchImpl, replies),
    remoteJid: 'chat@g.us',
    msg: { key: { id: 'quoted' } },
    sock: { sendMessage: async (...args) => { sent.push(args); } },
  };
  await handleMusicDiscoveryCommand(ctx);
  assert.equal(calls.length, 2);
  assert.equal(sent.length, 1);
  assert.equal(sent[0][0], 'chat@g.us');
  assert.equal(sent[0][1].mimetype, 'audio/mp4');
  assert.match(sent[0][1].fileName, /Example Song - Example Artist\.m4a/);
  assert.equal(Buffer.isBuffer(sent[0][1].audio), true);
  assert.match(replies.at(-1), /Preview resmi Apple berhasil dikirim/);
  assert.match(replies.at(-1), /bukan lagu penuh/);
});

test('Apple Music preview rejects album-only links and does not fetch arbitrary preview hosts', async () => {
  resetMusicDiscoveryStateForTests();
  const albumReplies = [];
  let calls = 0;
  const fetchImpl = async () => { calls += 1; return makeResponse([]); };
  await handleMusicDiscoveryCommand(makeCtx(['preview', 'https://music.apple.com/id/album/example/123'], fetchImpl, albumReplies));
  assert.match(albumReplies[0], /tautan album belum menunjuk ke lagu tertentu/i);
  assert.equal(calls, 0);

  const unsafeReplies = [];
  const ctx = {
    ...makeCtx(['preview', 'https://music.apple.com/id/album/example/123?i=1440857782'], async url => {
      if (String(url).includes('/lookup')) return makeResponse([{
        trackId: 1440857782, trackName: 'Unsafe', artistName: 'Artist', previewUrl: 'https://attacker.example/audio.m4a',
      }]);
      throw new Error('Untrusted preview URL must never be fetched.');
    }, unsafeReplies),
    remoteJid: 'chat@g.us',
    sock: { sendMessage: async () => { throw new Error('must not send'); } },
  };
  await handleMusicDiscoveryCommand(ctx);
  assert.match(unsafeReplies.at(-1), /tidak menyediakan preview audio publik/i);
});

test('Apple Music preview reports when Apple has no public preview and never attempts a full-track download', async () => {
  resetMusicDiscoveryStateForTests();
  const replies = [];
  let sends = 0;
  const ctx = {
    ...makeCtx(['download', 'https://music.apple.com/id/song/example/789012345'], async () => makeResponse([{
      trackId: 789012345, trackName: 'No Preview Song', artistName: 'Artist',
    }]), replies),
    remoteJid: 'chat@g.us',
    sock: { sendMessage: async () => { sends += 1; } },
  };
  await handleMusicDiscoveryCommand(ctx);
  assert.equal(sends, 0);
  assert.match(replies.at(-1), /tidak menyediakan preview audio publik/i);
  assert.match(replies.at(-1), /tidak dapat mengunduh lagu penuh/i);
});


test('Apple preview refuses redirects outside the allowlisted Apple audio CDN', async () => {
  resetMusicDiscoveryStateForTests();
  const replies = [];
  const requested = [];
  const ctx = {
    ...makeCtx(['preview', 'https://music.apple.com/id/song/redirect-song/1440857790'], async (url, options = {}) => {
      requested.push({ url: String(url), options });
      if (String(url).includes('/lookup')) return makeResponse([{
        trackId: 1440857790,
        trackName: 'Redirect Song',
        artistName: 'Artist',
        previewUrl: 'https://audio-ssl.itunes.apple.com/redirect.m4a',
      }]);
      return {
        ok: false, status: 302,
        headers: { get: name => name.toLowerCase() === 'location' ? 'https://attacker.example/payload.m4a' : null },
      };
    }, replies),
    remoteJid: 'chat@g.us',
    sock: { sendMessage: async () => { throw new Error('must not send'); } },
  };
  await handleMusicDiscoveryCommand(ctx);
  assert.equal(requested.length, 2);
  assert.equal(requested[1].options.redirect, 'manual');
  assert.doesNotMatch(requested.map(item => item.url).join(' '), /attacker\\.example/);
  assert.match(replies.at(-1), /belum berhasil diambil/);
});
