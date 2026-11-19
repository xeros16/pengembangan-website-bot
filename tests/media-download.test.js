import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { validateDownloadUrl, formatDuration, safeSongText, handleMediaDownloadCommands, classifyDownloaderError, isRetryableDownloaderError, runDownloaderWithRetry, getAudioMimeType, inspectAudioMetadata, shouldUsePinterestPublicFallback, getVideoMimeType, estimateMediaPresetSize, summarizeAvailableFormats, buildMediaFormatGuide, inspectPublicMediaFormats } from '../features/commands/media-download.js';

test('media downloader accepts public HTTP(S) links', () => {
  assert.equal(validateDownloadUrl('https://www.youtube.com/watch?v=abc').ok, true);
  assert.equal(validateDownloadUrl('https://www.tiktok.com/@user/video/123').ok, true);
});

test('media downloader rejects invalid schemes and local addresses', () => {
  assert.equal(validateDownloadUrl('javascript:alert(1)').ok, false);
  assert.equal(validateDownloadUrl('http://localhost:3000/file').ok, false);
  assert.equal(validateDownloadUrl('http://192.168.1.1/file').ok, false);
  assert.equal(validateDownloadUrl('http://127.0.0.1/file').ok, false);
  assert.equal(validateDownloadUrl('http://0.0.0.0/').ok, false);
  assert.equal(validateDownloadUrl('http://100.64.0.1/').ok, false);
  assert.equal(validateDownloadUrl('http://198.18.0.1/').ok, false);
  assert.equal(validateDownloadUrl('http://224.0.0.1/').ok, false);
  assert.equal(validateDownloadUrl('http://[::1]/').ok, false);
  assert.equal(validateDownloadUrl('http://[fd00::1]/').ok, false);
  assert.equal(validateDownloadUrl('http://[::ffff:127.0.0.1]/').ok, false);
  assert.equal(validateDownloadUrl('http://[2001:db8::1]/').ok, false);
  assert.equal(validateDownloadUrl('http://[2002:7f00:1::]/').ok, false);
  assert.equal(validateDownloadUrl('https://[2606:4700:4700::1111]/').ok, true);
  assert.equal(validateDownloadUrl('http://metadata.google.internal/').ok, false);
  assert.equal(validateDownloadUrl('http://printer.lan/').ok, false);
  assert.equal(validateDownloadUrl('http://router/').ok, false);
});

test('song result helpers format duration and sanitize titles', () => {
  assert.equal(formatDuration(242), '4:02');
  assert.equal(formatDuration(3661), '1:01:01');
  assert.equal(formatDuration(undefined), 'Durasi tidak tersedia');
  assert.equal(safeSongText('Lagu\nArtis'), 'Lagu Artis');
});

test('song command searches up to five results and user can select one', async () => {
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'bot-song-test-'));
  const sent = [];
  const replies = [];
  const downloaderArgs = [];
  const searchEntries = Array.from({ length: 5 }, (_, i) => ({
    id: `song${i + 1}`,
    title: `Lagu ${i + 1}`,
    artist: `Artis ${i + 1}`,
    view_count: 1200 + i,
    upload_date: '20240115',
    duration: 180 + i,
    webpage_url: `https://www.youtube.com/watch?v=song${i + 1}`,
  }));
  const ctxBase = {
    PREFIX: '.',
    remoteJid: 'chat-test@g.us',
    userJid: 'user-test@s.whatsapp.net',
    sender: 'user-test@s.whatsapp.net',
    msg: { key: { id: 'test-message' } },
    sock: { sendMessage: async (...args) => { sent.push(args); } },
    path,
    fs,
    TEMP_DIR: tempDir,
    reply: async (message) => { replies.push(message); },
    execFileAsync: async (_exe, args) => {
      downloaderArgs.push([...args]);
      if (args.some((arg) => String(arg).startsWith('ytsearch5:'))) {
        return { stdout: JSON.stringify({ entries: searchEntries }), stderr: '' };
      }
      const outputIndex = args.indexOf('-o');
      assert.notEqual(outputIndex, -1);
      const template = args[outputIndex + 1];
      const outputPath = template.replace('%(id)s', 'selected-song').replace('%(ext)s', 'mp3');
      await fs.promises.writeFile(outputPath, Buffer.from('fake-audio'));
      return { stdout: '', stderr: '' };
    },
  };
  try {
    await handleMediaDownloadCommands({ ...ctxBase, command: 'song', args: ['Hati-Hati', 'Tulus'] });
    assert.ok(downloaderArgs[0].includes('--retries'));
    assert.equal(downloaderArgs[0][downloaderArgs[0].indexOf('--retries') + 1], '0');
    assert.ok(replies.some((message) => message.includes('1. *Lagu 1*')));
    assert.ok(replies.some((message) => message.includes('Artis/Kanal: Artis 1')));
    assert.ok(replies.some((message) => message.includes('1.201 views')));
    assert.ok(replies.some((message) => message.includes('2024-01-15')));
    assert.ok(replies.some((message) => message.includes('.song pilih <nomor>')));

    await handleMediaDownloadCommands({ ...ctxBase, command: 'song', args: ['pilih', '2'] });
    assert.equal(downloaderArgs[1][downloaderArgs[1].indexOf('--retries') + 1], '0');
    assert.equal(downloaderArgs[1][downloaderArgs[1].indexOf('--fragment-retries') + 1], '0');
    assert.equal(sent.length, 1);
    assert.ok(replies.some((message) => message.includes('Lagu 2')));
  } finally {
    await fs.promises.rm(tempDir, { recursive: true, force: true });
  }
});


test('download queue reserves capacity atomically and rejects excess requests', async () => {
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'bot-queue-test-'));
  const replies = [];
  const sent = [];
  let releaseFirst;
  const firstGate = new Promise((resolve) => { releaseFirst = resolve; });
  let firstStartedResolve;
  const firstStarted = new Promise((resolve) => { firstStartedResolve = resolve; });
  let fullResolve;
  const fullSeen = new Promise((resolve) => { fullResolve = resolve; });
  let executionCount = 0;
  const ctxBase = {
    PREFIX: '.',
    remoteJid: 'queue-test@g.us',
    userJid: 'queue-user@s.whatsapp.net',
    sender: 'queue-user@s.whatsapp.net',
    msg: { key: { id: 'queue-test' } },
    sock: { sendMessage: async (...args) => { sent.push(args); } },
    path,
    fs,
    TEMP_DIR: tempDir,
    reply: async (message) => {
      replies.push(message);
      if (message.includes('Antrean download sedang penuh')) fullResolve();
    },
    execFileAsync: async (_exe, args) => {
      executionCount += 1;
      if (executionCount === 1) {
        firstStartedResolve();
        await firstGate;
      }
      const outputIndex = args.indexOf('-o');
      assert.notEqual(outputIndex, -1);
      const template = args[outputIndex + 1];
      const outputPath = template.replace('%(id)s', `queue-${executionCount}`).replace('%(ext)s', 'mp4');
      await fs.promises.writeFile(outputPath, Buffer.from('fake-video'));
      return { stdout: '', stderr: '' };
    },
  };

  try {
    const requests = Array.from({ length: 6 }, (_, index) => handleMediaDownloadCommands({
      ...ctxBase,
      command: 'dl',
      args: [`https://example.com/video-${index}.mp4`],
    }));
    await firstStarted;
    await fullSeen;
    assert.equal(replies.filter((message) => message.includes('Antrean download sedang penuh')).length, 1);
    releaseFirst();
    await Promise.all(requests);
    assert.equal(sent.length, 5);
    assert.equal(executionCount, 5);
  } finally {
    releaseFirst();
    await fs.promises.rm(tempDir, { recursive: true, force: true });
  }
});

test('download status reports queue totals and whether requester is active', async () => {
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'bot-queue-status-test-'));
  const replies = [];
  let releaseDownload;
  const downloadGate = new Promise((resolve) => { releaseDownload = resolve; });
  let startedResolve;
  const started = new Promise((resolve) => { startedResolve = resolve; });
  const ctxBase = {
    PREFIX: '.',
    remoteJid: 'queue-status-test@g.us',
    msg: { key: { id: 'queue-status-test' } },
    sock: { sendMessage: async () => {} },
    path,
    fs,
    TEMP_DIR: tempDir,
    reply: async (message) => { replies.push(message); },
    execFileAsync: async (_exe, args) => {
      startedResolve();
      await downloadGate;
      const outputIndex = args.indexOf('-o');
      const template = args[outputIndex + 1];
      const outputPath = template.replace('%(id)s', 'queue-status').replace('%(ext)s', 'mp4');
      await fs.promises.writeFile(outputPath, Buffer.from('fake-video'));
      return { stdout: '', stderr: '' };
    },
  };
  try {
    const activeRequest = handleMediaDownloadCommands({
      ...ctxBase,
      command: 'dl',
      args: ['https://example.com/status-video.mp4'],
      userJid: 'active-user@s.whatsapp.net',
      sender: 'active-user@s.whatsapp.net',
    });
    await started;
    replies.length = 0;
    await handleMediaDownloadCommands({
      ...ctxBase,
      command: 'dl',
      args: ['status'],
      userJid: 'active-user@s.whatsapp.net',
      sender: 'active-user@s.whatsapp.net',
    });
    assert.ok(replies.some(message => message.includes('1/5')));
    assert.ok(replies.some(message => message.includes('sedang diproses')));
    releaseDownload();
    await activeRequest;
  } finally {
    releaseDownload();
    await fs.promises.rm(tempDir, { recursive: true, force: true });
  }
});


test('dl cancel removes only the requester\'s waiting job and frees queue capacity', async () => {
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'bot-queue-cancel-test-'));
  const replies = [];
  let releaseDownload;
  const downloadGate = new Promise((resolve) => { releaseDownload = resolve; });
  let startedResolve;
  const started = new Promise((resolve) => { startedResolve = resolve; });
  let queuedNoticeResolve;
  const queuedNotice = new Promise((resolve) => { queuedNoticeResolve = resolve; });
  const base = {
    PREFIX: '.', remoteJid: 'cancel-chat@g.us', path, fs, TEMP_DIR: tempDir,
    msg: { key: { id: 'cancel-test' } }, sock: { sendMessage: async () => {} },
    reply: async (message) => {
      replies.push(message);
      if (message.includes('Permintaan masuk antrean download')) queuedNoticeResolve();
    },
    execFileAsync: async (_exe, args) => {
      startedResolve();
      await downloadGate;
      const outputIndex = args.indexOf('-o');
      const template = args[outputIndex + 1];
      const outputPath = template.replace('%(id)s', 'cancel-active').replace('%(ext)s', 'mp4');
      await fs.promises.writeFile(outputPath, Buffer.from('fake-video'));
      return { stdout: '', stderr: '' };
    },
  };
  const first = handleMediaDownloadCommands({ ...base, command: 'dl', args: ['https://example.com/active.mp4'], userJid: 'user-a@s.whatsapp.net', sender: 'user-a@s.whatsapp.net' });
  try {
    await started;
    const queued = handleMediaDownloadCommands({ ...base, command: 'dl', args: ['https://example.com/waiting.mp4'], userJid: 'user-b@s.whatsapp.net', sender: 'user-b@s.whatsapp.net' });
    await queuedNotice;
    await handleMediaDownloadCommands({ ...base, command: 'dl', args: ['cancel'], userJid: 'user-b@s.whatsapp.net', sender: 'user-b@s.whatsapp.net' });
    assert.ok(replies.some(message => message.includes('berhasil dibatalkan')));
    await queued;
    releaseDownload();
    await first;
  } finally {
    releaseDownload();
    await fs.promises.rm(tempDir, { recursive: true, force: true });
  }
});

test('downloader errors are mapped to clear actionable messages', () => {
  assert.equal(classifyDownloaderError({ message: 'spawn python ENOENT' }).code, 'python-missing');
  assert.equal(classifyDownloaderError({ message: 'No module named yt_dlp' }).code, 'yt-dlp-missing');
  assert.equal(classifyDownloaderError({ message: 'spawn ffmpeg ENOENT' }).code, 'ffmpeg-missing');
  assert.equal(classifyDownloaderError({ message: 'The read operation timed out' }).code, 'timeout');
  assert.equal(classifyDownloaderError({ stderr: 'ERROR: HTTP Error 429: Too Many Requests' }).code, 'rate-limited');
  assert.equal(classifyDownloaderError({ stderr: 'ERROR: Unsupported URL' }).code, 'unsupported');
});

test('dl health reports yt-dlp and FFmpeg versions without enqueuing a download', async () => {
  const replies = [];
  const ctx = {
    command: 'dl', args: ['health'], PREFIX: '.',
    fs, path, reply: async (message) => { replies.push(message); },
    execFileAsync: async (executable, args) => {
      if (args.includes('-version') && executable === 'ffmpeg') return { stdout: 'ffmpeg version 7.1-full_build\n', stderr: '' };
      if (args.includes('--version') && args.includes('yt_dlp')) return { stdout: '2026.10.20\n', stderr: '' };
      throw new Error(`Unexpected health command: ${executable} ${args.join(' ')}`);
    },
  };
  await handleMediaDownloadCommands(ctx);
  assert.equal(replies.length, 1);
  assert.match(replies[0], /Python \+ yt-dlp: tersedia \(versi 2026\.10\.20\)/);
  assert.match(replies[0], /FFmpeg: tersedia \(versi 7\.1-full_build\)/);
  assert.match(replies[0], /Komponen utama tersedia/);
});

test('dl health gives a repair hint when yt-dlp or FFmpeg is missing', async () => {
  const replies = [];
  const ctx = {
    command: 'download', args: ['health'], PREFIX: '.', fs, path,
    reply: async (message) => { replies.push(message); },
    execFileAsync: async (executable, args) => {
      if (args.includes('yt_dlp')) throw Object.assign(new Error('No module named yt_dlp'), { stderr: 'No module named yt_dlp' });
      throw Object.assign(new Error('spawn ffmpeg ENOENT'), { code: 'ENOENT' });
    },
  };
  await handleMediaDownloadCommands(ctx);
  assert.match(replies[0], /modul yt-dlp belum terpasang/);
  assert.match(replies[0], /FFmpeg: tidak ditemukan/);
  assert.match(replies[0], /perlu diperbaiki/);
});


test('downloader retries only transient network and 429 errors once', async () => {
  let networkCalls = 0;
  const networkResult = await runDownloaderWithRetry(async () => {
    networkCalls += 1;
    if (networkCalls === 1) throw Object.assign(new Error('ECONNRESET socket hang up'), { code: 'ECONNRESET' });
    return { stdout: 'ok' };
  }, 'python', ['-m', 'yt_dlp'], {}, { maxRetries: 1, retryDelayMs: 0 });
  assert.equal(networkCalls, 2);
  assert.equal(networkResult.stdout, 'ok');

  let limitedCalls = 0;
  await assert.rejects(() => runDownloaderWithRetry(async () => {
    limitedCalls += 1;
    throw new Error('HTTP Error 429: Too Many Requests');
  }, 'python', [], {}, { maxRetries: 1, retryDelayMs: 0 }));
  assert.equal(limitedCalls, 2);

  let deniedCalls = 0;
  await assert.rejects(() => runDownloaderWithRetry(async () => {
    deniedCalls += 1;
    throw new Error('HTTP Error 403: Forbidden');
  }, 'python', [], {}, { maxRetries: 1, retryDelayMs: 0 }));
  assert.equal(deniedCalls, 1);
  assert.equal(isRetryableDownloaderError(new Error('ECONNRESET')), true);
  assert.equal(isRetryableDownloaderError(new Error('HTTP Error 429')), true);
  assert.equal(isRetryableDownloaderError(new Error('HTTP Error 403')), false);
  assert.equal(isRetryableDownloaderError(new Error('Unsupported URL')), false);

  let invalidLimitCalls = 0;
  await runDownloaderWithRetry(async () => {
    invalidLimitCalls += 1;
    if (invalidLimitCalls === 1) throw Object.assign(new Error('ECONNRESET'), { code: 'ECONNRESET' });
    return { stdout: 'ok' };
  }, 'python', [], {}, { maxRetries: Number.NaN, retryDelayMs: 0 });
  assert.equal(invalidLimitCalls, 2, 'invalid retry limits still clamp to one retry');
});

test('downloader abort signal interrupts retry backoff', async () => {
  const controller = new AbortController();
  let calls = 0;
  const pending = runDownloaderWithRetry(async () => {
    calls += 1;
    throw Object.assign(new Error('ECONNRESET'), { code: 'ECONNRESET' });
  }, 'python', [], {}, { signal: controller.signal, maxRetries: 1, retryDelayMs: 1000 });
  await new Promise(resolve => setImmediate(resolve));
  controller.abort();
  await assert.rejects(pending, error => error.name === 'AbortError' || error.code === 'ABORT_ERR');
  assert.equal(calls, 1);
});

test('audio MIME types match their file extensions', () => {
  assert.equal(getAudioMimeType('.mp3'), 'audio/mpeg');
  assert.equal(getAudioMimeType('.m4a'), 'audio/mp4');
  assert.equal(getAudioMimeType('.opus'), 'audio/ogg; codecs=opus');
  assert.equal(getAudioMimeType('.wav'), 'audio/wav');
  assert.equal(getAudioMimeType('.flac'), 'audio/flac');
  assert.equal(getAudioMimeType('.unknown'), 'application/octet-stream');
});

test('ffprobe audio metadata is parsed safely and optional when unavailable', async () => {
  const metadata = await inspectAudioMetadata('/tmp/test.mp3', async (executable, args) => {
    assert.equal(executable, 'ffprobe');
    assert.ok(args.includes('/tmp/test.mp3'));
    return { stdout: JSON.stringify({ format: { duration: '125.4', format_name: 'mp3', tags: { title: 'Lagu Uji', artist: 'Artis Uji', album: 'Album Uji' } } }) };
  });
  assert.deepEqual(metadata, {
    title: 'Lagu Uji', artist: 'Artis Uji', album: 'Album Uji', duration: '2:05', format: 'mp3',
  });
  assert.equal(await inspectAudioMetadata('/tmp/missing.mp3', async () => { throw new Error('ffprobe missing'); }), null);
});

test('active download can be cancelled by its own requester', async () => {
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'bot-active-cancel-test-'));
  const replies = [];
  let startedResolve;
  const started = new Promise(resolve => { startedResolve = resolve; });
  const base = {
    PREFIX: '.', remoteJid: 'active-cancel-chat@g.us', userJid: 'active-cancel-user@s.whatsapp.net',
    sender: 'active-cancel-user@s.whatsapp.net', path, fs, TEMP_DIR: tempDir,
    msg: { key: { id: 'active-cancel-test' } }, sock: { sendMessage: async () => {} },
    reply: async message => { replies.push(String(message)); },
    execFileAsync: async (_exe, _args, options = {}) => new Promise((resolve, reject) => {
      startedResolve();
      const onAbort = () => reject(Object.assign(new Error('The operation was aborted'), { name: 'AbortError', code: 'ABORT_ERR' }));
      if (options.signal?.aborted) return onAbort();
      options.signal?.addEventListener('abort', onAbort, { once: true });
    }),
  };
  try {
    const active = handleMediaDownloadCommands({ ...base, command: 'dl', args: ['https://example.com/slow.mp4'] });
    await started;
    await handleMediaDownloadCommands({ ...base, command: 'dl', args: ['cancel'] });
    await active;
    assert.ok(replies.some(message => message.includes('ditandai untuk dibatalkan')));
    assert.ok(replies.some(message => message.includes('Download dibatalkan')));
  } finally {
    await fs.promises.rm(tempDir, { recursive: true, force: true });
  }
});


test('Pinterest public metadata fallback is limited to unsupported public formats', () => {
  assert.equal(shouldUsePinterestPublicFallback(new Error('No video formats found'), 'https://www.pinterest.com/pin/123/'), true);
  assert.equal(shouldUsePinterestPublicFallback(new Error('Unsupported URL'), 'https://pin.it/abc123'), true);
  assert.equal(shouldUsePinterestPublicFallback(new Error('HTTP Error 403: Forbidden'), 'https://www.pinterest.com/pin/123/'), false);
  assert.equal(shouldUsePinterestPublicFallback(new Error('HTTP Error 429: Too Many Requests'), 'https://www.pinterest.com/pin/123/'), false);
  assert.equal(shouldUsePinterestPublicFallback(Object.assign(new Error('ECONNRESET'), { code: 'ECONNRESET' }), 'https://www.pinterest.com/pin/123/'), false);
  assert.equal(shouldUsePinterestPublicFallback(new Error('No video formats found'), 'https://example.com/media'), false);
});


test('Media Format Explorer estimates bounded presets and summarizes only supported media formats', () => {
  const estimate = estimateMediaPresetSize('video-wa', 120);
  assert.ok(estimate);
  assert.equal(estimate.duration, 120);
  assert.ok(estimate.megabytes > 10 && estimate.megabytes < 25);
  assert.equal(estimateMediaPresetSize('video-wa', 0), null);
  assert.equal(estimateMediaPresetSize('unknown', 120), null);
  assert.equal(estimateMediaPresetSize('audio-high', 14401), null);
  const formats = summarizeAvailableFormats({ formats: [
    { format_id: '18', ext: 'mp4', vcodec: 'avc1', acodec: 'mp4a', height: 360, filesize: 1000 },
    { format_id: '137', ext: 'mp4', vcodec: 'avc1', acodec: 'none', height: 1080 },
    { format_id: '140', ext: 'm4a', vcodec: 'none', acodec: 'mp4a' },
    { format_id: '999', ext: 'm3u8', vcodec: 'av01', acodec: 'none', height: 2160 },
  ] });
  assert.equal(formats.length, 3);
  assert.equal(formats[0].id, '18', 'combined video/audio is preferred before video-only');
  assert.match(buildMediaFormatGuide('.'), /mediaformat cek/);
  assert.match(buildMediaFormatGuide('.'), /bukan konversi otomatis/);
});

test('Media Format Explorer inspects public metadata without downloading files', async () => {
  let capturedArgs = [];
  const result = await inspectPublicMediaFormats('https://example.com/public-video', {
    fs,
    path,
    execFileAsync: async (_executable, args, options) => {
      capturedArgs = args;
      assert.equal(options.timeout, 25000);
      return { stdout: JSON.stringify({ title: 'Demo Video', extractor_key: 'Example', duration: 42, formats: [{ format_id: '22', ext: 'mp4', vcodec: 'h264', acodec: 'aac', height: 720 }] }) };
    },
  });
  assert.equal(result.ok, true);
  assert.equal(result.title, 'Demo Video');
  assert.equal(result.provider, 'Example');
  assert.equal(result.formats[0].id, '22');
  assert.ok(capturedArgs.includes('--skip-download'));
  assert.ok(capturedArgs.includes('--ignore-config'));
  assert.ok(capturedArgs.includes('--dump-single-json'));
  assert.equal(capturedArgs[capturedArgs.indexOf('--retries') + 1], '0');
  const rejected = await inspectPublicMediaFormats('http://127.0.0.1/private', { execFileAsync: async () => { throw new Error('must not run'); } });
  assert.equal(rejected.ok, false);
});

test('mediaformat command supports preset estimates without starting a downloader job', async () => {
  const replies = [];
  await handleMediaDownloadCommands({ command: 'mediaformat', args: ['estimasi', 'audio-mp3', '180'], PREFIX: '.', reply: async value => replies.push(String(value)) });
  assert.match(replies[0], /ESTIMASI MEDIA/);
  assert.match(replies[0], /MP3 128 kbps/);
});


test('video MIME type follows the actual container extension', () => {
  assert.equal(getVideoMimeType('.mp4'), 'video/mp4');
  assert.equal(getVideoMimeType('.m4v'), 'video/mp4');
  assert.equal(getVideoMimeType('.webm'), 'video/webm');
  assert.equal(getVideoMimeType('.mov'), 'video/quicktime');
  assert.equal(getVideoMimeType('.mkv'), 'video/x-matroska');
});

test('media format inspection is rate-limited per requester and caps concurrent provider calls', async () => {
  let releaseFirst;
  const firstInspection = new Promise(resolve => { releaseFirst = resolve; });
  const replies = [];
  const base = {
    command: 'mediaformat', args: ['cek', 'https://example.com/video'], PREFIX: '.',
    remoteJid: 'media-check-group@g.us', userJid: 'media-check-user', fs, path,
    reply: async value => replies.push(String(value)),
    execFileAsync: async () => firstInspection,
  };
  const first = handleMediaDownloadCommands(base);
  await new Promise(resolve => setImmediate(resolve));
  await handleMediaDownloadCommands({ ...base, reply: async value => replies.push(String(value)) });
  assert.ok(replies.some(value => /dibatasi/.test(value)));
  releaseFirst({ stdout: JSON.stringify({ title: 'Ready', formats: [{ format_id: '18', ext: 'mp4', vcodec: 'h264', acodec: 'aac' }] }) });
  await first;
});


test('standard .dl command routes Apple Music links to official public previews', async () => {
  const replies = [];
  const sent = [];
  const trackId = 1440857783;
  const url = `https://music.apple.com/id/album/example/123?i=${trackId}`;
  const fetch = async rawUrl => {
    if (String(rawUrl).includes('/lookup')) {
      return {
        ok: true, status: 200,
        json: async () => ({ resultCount: 1, results: [{
          trackId, trackName: 'Apple Link Song', artistName: 'Preview Artist',
          previewUrl: 'https://audio-ssl.itunes.apple.com/preview.m4a',
        }] }),
      };
    }
    return {
      ok: true, status: 200,
      headers: { get: name => name === 'content-type' ? 'audio/mp4' : '8' },
      arrayBuffer: async () => Uint8Array.from([1, 2, 3, 4]).buffer,
    };
  };
  await handleMediaDownloadCommands({
    command: 'dl',
    args: ['apple', url],
    PREFIX: '.',
    fetch,
    remoteJid: 'group@g.us',
    msg: { key: { id: 'quoted' } },
    sock: { sendMessage: async (...args) => { sent.push(args); } },
    reply: async message => { replies.push(message); },
  });
  assert.equal(sent.length, 1);
  assert.equal(sent[0][0], 'group@g.us');
  assert.match(sent[0][1].fileName, /Apple Link Song/);
  assert.match(replies.at(-1), /Preview resmi Apple berhasil dikirim/);
});


test('.dl detects a direct Apple Music song link without the apple subcommand', async () => {
  const replies = [];
  const sent = [];
  const trackId = 1440857784;
  const url = `https://music.apple.com/id/song/direct-song/${trackId}`;
  const fetch = async rawUrl => {
    if (String(rawUrl).includes('/lookup')) {
      return {
        ok: true, status: 200,
        json: async () => ({ results: [{
          trackId, trackName: 'Direct Link Preview', artistName: 'Artist',
          previewUrl: 'https://audio-ssl.itunes.apple.com/direct-preview.m4a',
        }] }),
      };
    }
    return {
      ok: true, status: 200,
      headers: { get: name => name === 'content-type' ? 'audio/mp4' : '5' },
      arrayBuffer: async () => Uint8Array.from([1, 2, 3]).buffer,
    };
  };
  await handleMediaDownloadCommands({
    command: 'dl', args: [url], PREFIX: '.', fetch,
    remoteJid: 'chat@g.us', msg: {},
    sock: { sendMessage: async (...args) => { sent.push(args); } },
    reply: async message => { replies.push(message); },
  });
  assert.equal(sent.length, 1);
  assert.match(replies.at(-1), /Preview resmi Apple berhasil dikirim/);
});
