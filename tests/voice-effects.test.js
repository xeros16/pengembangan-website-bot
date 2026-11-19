import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  VOICE_EFFECT_COMMANDS,
  buildTempoFilter,
  getVoiceEffectProfile,
  handleVoiceEffectCommands,
} from '../features/commands/voice-effects.js';

function makeQuotedAudioMessage(fileLength = 1024) {
  const audioMessage = { mimetype: 'audio/ogg; codecs=opus', fileLength };
  return {
    key: { remoteJid: 'group@g.us', participant: 'user@s.whatsapp.net', id: 'command-1' },
    message: { extendedTextMessage: { text: '.bass', contextInfo: { quotedMessage: { audioMessage }, participant: 'user@s.whatsapp.net', stanzaId: 'audio-1' } } },
  };
}

function baseContext(overrides = {}) {
  const replies = [];
  const sent = [];
  return {
    command: 'voice', args: [], PREFIX: '.', remoteJid: 'group@g.us', msg: makeQuotedAudioMessage(),
    reply: async value => replies.push(String(value)),
    getQuotedMessage: msg => ({ key: { remoteJid: msg.key.remoteJid, participant: 'user@s.whatsapp.net', id: 'audio-1' }, message: { audioMessage: { mimetype: 'audio/ogg; codecs=opus', fileLength: 1024 } } }),
    unwrapMessage: value => value,
    downloadMedia: async () => Buffer.from('fake-opus-audio'),
    sock: { sendMessage: async (...args) => sent.push(args) },
    fs, path, TEMP_DIR: os.tmpdir(),
    execFileAsync: async (command, args) => {
      if (args[0] === '-version') return { stdout: 'ffmpeg version test', stderr: '' };
      await fs.promises.writeFile(args.at(-1), Buffer.from('fake-mp3-output'));
      return { stdout: '', stderr: '' };
    },
    replies, sent,
    ...overrides,
  };
}

test('Voice Lab registers the selected harmless audio effects and aliases', () => {
  for (const name of ['voice', '8d', 'bass', 'bass2', 'bassboost', 'chipmunk', 'clean', 'deep', 'echo', 'fast', 'karaoke', 'nightcore', 'normalize', 'reverse', 'robot', 'slow', 'tempo', 'treble', 'volumeup']) {
    assert.ok(VOICE_EFFECT_COMMANDS.has(name), `${name} should be registered`);
  }
  assert.equal(VOICE_EFFECT_COMMANDS.has('earrape'), false, 'unsafe extreme-volume effect is intentionally excluded');
});

test('tempo filters validate range and split values into FFmpeg-supported atempo factors', () => {
  assert.equal(buildTempoFilter(1.25), 'atempo=1.25');
  assert.equal(buildTempoFilter(2.5), 'atempo=2,atempo=1.25');
  assert.equal(buildTempoFilter(0.5), 'atempo=0.5');
  assert.throws(() => buildTempoFilter(0.2), /0.5 sampai 2.5/);
  assert.throws(() => buildTempoFilter('fast'), /0.5 sampai 2.5/);
});

test('effect aliases resolve to fixed profiles and do not accept user filter strings', () => {
  assert.equal(getVoiceEffectProfile('bassboost').name, 'bass');
  assert.equal(getVoiceEffectProfile('helium').name, 'chipmunk');
  assert.equal(getVoiceEffectProfile('tempo', ['1.5']).filter, 'atempo=1.5');
  assert.equal(getVoiceEffectProfile('not-a-filter'), null);
});

test('Voice Lab help is local and lists reply-based usage', async () => {
  const ctx = baseContext({ args: ['help'], downloadMedia: async () => { throw new Error('must not download'); } });
  await handleVoiceEffectCommands(ctx);
  assert.match(ctx.replies[0], /PIR VOICE LAB/);
  assert.match(ctx.replies[0], /Balas voice note/);
  assert.match(ctx.replies[0], /karaoke/);
});

test('Voice Lab processes a quoted audio message and sends an MP3 result', async () => {
  const ctx = baseContext({ command: 'bass' });
  await handleVoiceEffectCommands(ctx);
  assert.equal(ctx.sent.length, 1);
  assert.equal(ctx.sent[0][0], 'group@g.us');
  assert.equal(ctx.sent[0][1].mimetype, 'audio/mpeg');
  assert.equal(ctx.sent[0][1].fileName, 'pir-bass.mp3');
  assert.deepEqual(ctx.sent[0][1].audio, Buffer.from('fake-mp3-output'));
  assert.equal(ctx.sent[0][2].quoted, ctx.msg);
});

test('Voice Lab supports the generic command and tempo argument', async () => {
  const ctx = baseContext({ command: 'voice', args: ['tempo', '2.5'] });
  let ffmpegArgs;
  ctx.execFileAsync = async (command, args) => {
    if (args[0] === '-version') return { stdout: 'ffmpeg version test' };
    ffmpegArgs = args;
    await fs.promises.writeFile(args.at(-1), Buffer.from('mp3'));
    return { stdout: '', stderr: '' };
  };
  await handleVoiceEffectCommands(ctx);
  assert.ok(ffmpegArgs.includes('atempo=2,atempo=1.25'));
  assert.equal(ctx.sent.length, 1);
});

test('Voice Lab refuses oversized audio before downloading', async () => {
  const ctx = baseContext({
    command: 'bass',
    getQuotedMessage: msg => ({ key: msg.key, message: { audioMessage: { mimetype: 'audio/ogg', fileLength: 13 * 1024 * 1024 } } }),
    downloadMedia: async () => { throw new Error('should not download'); },
  });
  await handleVoiceEffectCommands(ctx);
  assert.match(ctx.replies[0], /input 12 MB/);
  assert.equal(ctx.sent.length, 0);
});

test('Voice Lab reports missing FFmpeg and does not leave temporary files', async () => {
  const temp = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'pir-voice-test-'));
  try {
    const ctx = baseContext({
      command: 'bass', TEMP_DIR: temp,
      execFileAsync: async () => { throw Object.assign(new Error('spawn ffmpeg ENOENT'), { code: 'ENOENT' }); },
    });
    await handleVoiceEffectCommands(ctx);
    assert.match(ctx.replies[0], /FFmpeg belum ditemukan/);
    assert.deepEqual(await fs.promises.readdir(temp), []);
  } finally {
    await fs.promises.rm(temp, { recursive: true, force: true });
  }
});

test('Voice Lab caps concurrent processing jobs to protect host resources', async () => {
  let releaseProcess;
  let signalSecond;
  let enteredCount = 0;
  const processGate = new Promise(resolve => { releaseProcess = resolve; });
  const secondEnteredGate = new Promise(resolve => { signalSecond = resolve; });
  const blockingContext = () => baseContext({
    command: 'bass',
    execFileAsync: async (command, args) => {
      if (args[0] === '-version') return { stdout: 'ffmpeg version test' };
      enteredCount += 1;
      if (enteredCount === 2) signalSecond();
      await processGate;
      await fs.promises.writeFile(args.at(-1), Buffer.from('job-mp3'));
      return { stdout: '', stderr: '' };
    },
  });
  const first = blockingContext();
  const second = blockingContext();
  const firstJob = handleVoiceEffectCommands(first);
  const secondJob = handleVoiceEffectCommands(second);
  await secondEnteredGate;
  const third = baseContext({ command: 'bass' });
  await handleVoiceEffectCommands(third);
  assert.match(third.replies[0], /dua audio lain/);
  releaseProcess();
  await Promise.all([firstJob, secondJob]);
  assert.equal(first.sent.length, 1);
  assert.equal(second.sent.length, 1);
});
