import { randomUUID } from 'node:crypto';

export const VOICE_EFFECT_COMMANDS = new Set([
  'voice', 'tempo', '8d', 'bass', 'bass2', 'bassboost', 'blown', 'chipmunk', 'clean',
  'compressor', 'deep', 'demon', 'distortion', 'echo', 'echo2', 'fast', 'fat', 'ghost',
  'haunted', 'helium', 'karaoke', 'loud', 'megaphone', 'metal', 'nightcore', 'normalize',
  'radio', 'reverb', 'reverb2', 'reverse', 'robot', 'slow', 'smooth', 'soft', 'squirrel',
  'stereo', 'telephone', 'tremolo', 'treble', 'treble2', 'tupai', 'underwater', 'vibra',
  'volumedown', 'volumeup', 'wide',
]);

const EFFECTS = Object.freeze({
  '8d': { label: '8D Audio', filter: 'apulsator=hz=0.08:amount=0.72:offset_l=0:offset_r=0.5', note: 'Efek stereo berputar.' },
  bass: { label: 'Bass Boost', filter: 'bass=g=7:f=110:w=0.5', note: 'Memperkuat frekuensi bass.' },
  bass2: { label: 'Bass Boost Plus', filter: 'bass=g=10:f=100:w=0.5,alimiter=limit=0.95', note: 'Bass lebih tebal dengan limiter.' },
  bassboost: { alias: 'bass' },
  blown: { label: 'Compressed Punch', filter: 'acompressor=threshold=0.12:ratio=5:attack=8:release=120,volume=1.12,alimiter=limit=0.95', note: 'Kompresi dinamis yang lebih tegas.' },
  chipmunk: { label: 'Chipmunk', filter: 'asetrate=44100*1.22,aresample=44100', note: 'Pitch lebih tinggi dan durasi lebih singkat.' },
  clean: { label: 'Clean Voice', filter: 'highpass=f=80,lowpass=f=12000,afftdn=nr=12:nf=-45', note: 'Filter dasar dan pengurangan noise; bukan pengganti rekaman studio.' },
  compressor: { label: 'Compressor', filter: 'acompressor=threshold=0.16:ratio=3:attack=20:release=220', note: 'Meratakan dinamika audio.' },
  deep: { label: 'Deep Voice', filter: 'asetrate=44100*0.86,aresample=44100', note: 'Pitch suara lebih rendah.' },
  demon: { alias: 'deep' },
  distortion: { label: 'Lo-fi Distortion', filter: 'acrusher=bits=10:mix=0.22,alimiter=limit=0.95', note: 'Tekstur lo-fi ringan dengan pembatas level.' },
  echo: { label: 'Echo', filter: 'aecho=0.8:0.82:70|140:0.28|0.16', note: 'Gema pendek.' },
  echo2: { label: 'Echo Wide', filter: 'aecho=0.8:0.86:120|240|360:0.24|0.16|0.1', note: 'Gema bertingkat.' },
  fast: { label: 'Fast', filter: 'atempo=1.25', note: 'Tempo 1,25× tanpa menaikkan pitch secara sengaja.' },
  fat: { alias: 'bass' },
  ghost: { label: 'Ghost', filter: 'aecho=0.72:0.84:180|360:0.32|0.18', note: 'Gema panjang dan lembut.' },
  haunted: { label: 'Haunted', filter: 'aecho=0.72:0.86:420|840:0.3|0.16', note: 'Gema panjang untuk nuansa menyeramkan.' },
  helium: { alias: 'chipmunk' },
  karaoke: { label: 'Karaoke Reduce', filter: 'stereotools=mode=lr>l-r', note: 'Mengurangi suara yang berada di tengah pada audio stereo. Hasil bergantung pada mixing lagu dan bukan pemisahan vokal berbasis AI.' },
  loud: { alias: 'normalize' },
  megaphone: { label: 'Megaphone', filter: 'highpass=f=450,lowpass=f=3400,acompressor=threshold=0.16:ratio=4', note: 'Warna suara seperti pengeras suara.' },
  metal: { label: 'Metallic', filter: 'acrusher=bits=12:mix=0.3,highpass=f=100,lowpass=f=9000', note: 'Tekstur digital metalik.' },
  nightcore: { label: 'Nightcore', filter: 'asetrate=44100*1.15,aresample=44100', note: 'Pitch dan tempo lebih tinggi.' },
  normalize: { label: 'Normalize', filter: 'loudnorm=I=-16:TP=-1.5:LRA=11', note: 'Menormalkan loudness dengan true-peak ceiling.' },
  radio: { label: 'Radio', filter: 'highpass=f=300,lowpass=f=3500,acompressor=threshold=0.14:ratio=4', note: 'Band-pass seperti audio radio.' },
  reverb: { label: 'Reverb', filter: 'aecho=0.82:0.72:45|90|135:0.22|0.16|0.1', note: 'Ruang gema ringan.' },
  reverb2: { label: 'Reverb Hall', filter: 'aecho=0.82:0.78:75|150|225|300:0.24|0.18|0.13|0.08', note: 'Ruang gema lebih panjang.' },
  reverse: { label: 'Reverse', filter: 'areverse', note: 'Memutar audio dari belakang.' },
  robot: { label: 'Robot', filter: 'tremolo=f=30:d=0.72,highpass=f=180,lowpass=f=3200', note: 'Modulasi suara robotik.' },
  slow: { label: 'Slow', filter: 'atempo=0.8', note: 'Tempo 0,8× tanpa menurunkan pitch secara sengaja.' },
  smooth: { label: 'Smooth', filter: 'lowpass=f=14000,acompressor=threshold=0.2:ratio=2', note: 'Kompresi lembut dan high-cut ringan.' },
  soft: { label: 'Soft', filter: 'volume=0.78,lowpass=f=12000', note: 'Volume dan frekuensi tinggi diturunkan.' },
  squirrel: { alias: 'chipmunk' },
  stereo: { label: 'Stereo', filter: 'stereotools=slev=1.35', note: 'Memperlebar komponen stereo.' },
  telephone: { label: 'Telephone', filter: 'highpass=f=300,lowpass=f=3400', note: 'Rentang frekuensi seperti telepon.' },
  tremolo: { label: 'Tremolo', filter: 'tremolo=f=8:d=0.65', note: 'Volume berdenyut secara periodik.' },
  treble: { label: 'Treble Boost', filter: 'treble=g=6:f=4000', note: 'Memperkuat frekuensi tinggi.' },
  treble2: { label: 'Treble Boost Plus', filter: 'treble=g=9:f=4500', note: 'Treble lebih kuat.' },
  tupai: { alias: 'chipmunk' },
  underwater: { label: 'Underwater', filter: 'lowpass=f=750,aecho=0.75:0.72:90|180:0.22|0.12', note: 'Frekuensi tinggi diredam dengan gema pendek.' },
  vibra: { label: 'Vibrato', filter: 'vibrato=f=6:d=0.35', note: 'Pitch bergetar secara halus.' },
  volumedown: { label: 'Volume Down', filter: 'volume=0.65', note: 'Volume diturunkan.' },
  volumeup: { label: 'Volume Up', filter: 'volume=1.35,alimiter=limit=0.95', note: 'Volume dinaikkan dengan limiter.' },
  wide: { label: 'Wide Stereo', filter: 'stereotools=slev=1.65', note: 'Lebar stereo ditingkatkan.' },
});

const MAX_INPUT_BYTES = 12 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 15 * 1024 * 1024;
const MAX_DURATION_SECONDS = 600;
const MAX_ACTIVE_VOICE_JOBS = 2;
let activeVoiceJobs = 0;

function canonicalEffect(name) {
  let current = String(name || '').toLowerCase();
  const seen = new Set();
  while (EFFECTS[current]?.alias && !seen.has(current)) {
    seen.add(current);
    current = EFFECTS[current].alias;
  }
  return current;
}

export function buildTempoFilter(rate) {
  const value = Number(rate);
  if (!Number.isFinite(value) || value < 0.5 || value > 2.5) {
    throw new Error('Tempo harus berupa angka antara 0.5 sampai 2.5.');
  }
  let remaining = value;
  const filters = [];
  while (remaining > 2) {
    filters.push('atempo=2');
    remaining /= 2;
  }
  while (remaining < 0.5) {
    filters.push('atempo=0.5');
    remaining /= 0.5;
  }
  filters.push(`atempo=${Number(remaining.toFixed(3))}`);
  return filters.join(',');
}

export function getVoiceEffectProfile(name, args = []) {
  const requested = String(name || '').toLowerCase();
  if (requested === 'tempo') {
    const rate = Number(args[0]);
    return { name: 'tempo', label: `Tempo ${rate}×`, filter: buildTempoFilter(rate), note: 'Mengubah kecepatan tanpa mengubah pitch secara sengaja.' };
  }
  const key = canonicalEffect(requested);
  const profile = EFFECTS[key];
  if (!profile || profile.alias) return null;
  return { name: key, ...profile };
}

function audioNode(message, unwrapMessage) {
  let current = typeof unwrapMessage === 'function' ? unwrapMessage(message) : message;
  for (let depth = 0; depth < 4 && current; depth += 1) {
    if (current.audioMessage) return { node: current.audioMessage, type: 'audio' };
    if (current.documentMessage && /^audio\//i.test(String(current.documentMessage.mimetype || ''))) {
      return { node: current.documentMessage, type: 'document' };
    }
    if (current.documentWithCaptionMessage?.message) {
      current = current.documentWithCaptionMessage.message;
      continue;
    }
    if (current.ephemeralMessage?.message) {
      current = current.ephemeralMessage.message;
      continue;
    }
    if (current.viewOnceMessage?.message) {
      current = current.viewOnceMessage.message;
      continue;
    }
    break;
  }
  return null;
}

function getAudioTarget(msg, getQuotedMessage, unwrapMessage) {
  const direct = audioNode(msg?.message, unwrapMessage);
  if (direct) return { key: msg.key, message: msg.message };
  const quoted = typeof getQuotedMessage === 'function' ? getQuotedMessage(msg) : null;
  if (!quoted?.message) return null;
  const quotedAudio = audioNode(quoted.message, unwrapMessage);
  return quotedAudio ? { ...quoted, message: quoted.message } : null;
}

function renderVoiceHelp(PREFIX) {
  return [
    '🎚️ *PIR VOICE LAB*',
    'Balas voice note, audio, atau dokumen audio dengan salah satu command berikut.',
    '',
    '*Pitch & tempo*',
    `• ${PREFIX}chipmunk / ${PREFIX}deep / ${PREFIX}nightcore / ${PREFIX}tempo 1.25`,
    `• ${PREFIX}fast / ${PREFIX}slow / ${PREFIX}reverse`,
    '',
    '*Audio treatment*',
    `• ${PREFIX}bass / ${PREFIX}treble / ${PREFIX}clean / ${PREFIX}compressor / ${PREFIX}normalize`,
    `• ${PREFIX}echo / ${PREFIX}reverb / ${PREFIX}telephone / ${PREFIX}radio`,
    '',
    '*Creative effects*',
    `• ${PREFIX}8d / ${PREFIX}robot / ${PREFIX}tremolo / ${PREFIX}underwater / ${PREFIX}karaoke`,
    `• ${PREFIX}stereo / ${PREFIX}wide / ${PREFIX}megaphone / ${PREFIX}metal`,
    '',
    `Cara cepat: balas audio dengan ${PREFIX}voice bass atau langsung ${PREFIX}bass.`,
    `Tempo: ${PREFIX}tempo 0.5 sampai ${PREFIX}tempo 2.5.`,
    'Batas input 12 MB, durasi maksimal 10 menit, output MP3 maksimal 15 MB. Memerlukan FFmpeg.',
    'Karaoke hanya mengurangi komponen tengah pada audio stereo; hasil tidak selalu bersih dan bukan pemisahan vokal AI.',
  ].join('\n');
}

async function resolveFFmpeg(execFileAsync) {
  const candidates = ['ffmpeg', 'C:\\ffmpeg\\bin\\ffmpeg.exe', 'C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe', 'D:\\ffmpeg\\bin\\ffmpeg.exe'];
  for (const candidate of candidates) {
    try {
      await execFileAsync(candidate, ['-version'], { timeout: 5000, maxBuffer: 1024 * 1024 });
      return candidate;
    } catch {}
  }
  throw new Error('FFmpeg belum ditemukan. Pasang FFmpeg dan pastikan tersedia di PATH, lalu restart bot.');
}

export async function handleVoiceEffectCommands(ctx) {
  const {
    command, args = [], PREFIX = '.', msg, sock, remoteJid, reply, getQuotedMessage,
    unwrapMessage, downloadMedia, fs, path, TEMP_DIR, execFileAsync,
  } = ctx;

  const requested = command === 'voice' ? String(args[0] || '').toLowerCase() : command;
  const effectArgs = command === 'voice' ? args.slice(1) : args;
  if (command === 'voice' && (!requested || ['help', 'bantuan', 'menu', 'list', 'daftar'].includes(requested))) {
    return reply(renderVoiceHelp(PREFIX));
  }
  const profile = getVoiceEffectProfile(requested, effectArgs);
  if (!profile) return reply(`Efek tidak dikenal. Ketik ${PREFIX}voice untuk melihat daftar efek.`);

  const target = getAudioTarget(msg, getQuotedMessage, unwrapMessage);
  if (!target) {
    return reply(`Balas voice note, audio, atau dokumen audio dengan ${PREFIX}${command === 'voice' ? `voice ${requested}` : command}${effectArgs.length ? ` ${effectArgs.join(' ')}` : ''}. Ketik ${PREFIX}voice untuk daftar efek.`);
  }

  if (typeof downloadMedia !== 'function' || typeof execFileAsync !== 'function' || !fs?.promises || !path?.join || !TEMP_DIR) {
    return reply('Voice Lab belum siap: dependensi pemrosesan media tidak tersedia.');
  }

  const inputNode = audioNode(target.message, unwrapMessage)?.node;
  const advertisedBytes = Number(inputNode?.fileLength || 0);
  if (advertisedBytes > MAX_INPUT_BYTES) return reply('Audio melebihi batas input 12 MB. Kirim file yang lebih kecil.');

  if (activeVoiceJobs >= MAX_ACTIVE_VOICE_JOBS) {
    return reply('Voice Lab sedang memproses dua audio lain. Tunggu sebentar lalu coba lagi.');
  }
  activeVoiceJobs += 1;
  const id = randomUUID();
  const inputPath = path.join(TEMP_DIR, `voice-${id}-input.bin`);
  const outputPath = path.join(TEMP_DIR, `voice-${id}-output.mp3`);
  let outputBuffer;
  try {
    const inputBuffer = await downloadMedia(sock, target);
    if (!Buffer.isBuffer(inputBuffer) || !inputBuffer.length) throw new Error('Audio kosong atau gagal diunduh.');
    if (inputBuffer.length > MAX_INPUT_BYTES) throw new Error('Audio melebihi batas input 12 MB.');
    await fs.promises.writeFile(inputPath, inputBuffer, { mode: 0o600 });

    const ffmpeg = await resolveFFmpeg(execFileAsync);
    await execFileAsync(ffmpeg, [
      '-hide_banner', '-loglevel', 'error', '-y', '-i', inputPath,
      '-t', String(MAX_DURATION_SECONDS), '-vn', '-af', profile.filter,
      '-map_metadata', '-1', '-codec:a', 'libmp3lame', '-b:a', '128k',
      '-ar', '44100', '-ac', '2', '-threads', '1', '-f', 'mp3', outputPath,
    ], { timeout: 60_000, maxBuffer: 2 * 1024 * 1024 });

    outputBuffer = await fs.promises.readFile(outputPath);
    if (!Buffer.isBuffer(outputBuffer) || !outputBuffer.length) throw new Error('FFmpeg tidak menghasilkan audio.');
    if (outputBuffer.length > MAX_OUTPUT_BYTES) throw new Error('Hasil audio melebihi batas 15 MB. Coba audio yang lebih pendek.');
    await sock.sendMessage(remoteJid, {
      audio: outputBuffer,
      mimetype: 'audio/mpeg',
      fileName: `pir-${profile.name}.mp3`,
      ptt: false,
    }, { quoted: msg });
    return;
  } catch (error) {
    const message = String(error?.message || 'proses gagal');
    console.error('[VOICE LAB]', profile.name, message.slice(0, 240));
    return reply(`❌ Voice Lab gagal: ${message.slice(0, 220)}`);
  } finally {
    activeVoiceJobs = Math.max(0, activeVoiceJobs - 1);
    await fs.promises.unlink(inputPath).catch(() => {});
    await fs.promises.unlink(outputPath).catch(() => {});
  }
}
