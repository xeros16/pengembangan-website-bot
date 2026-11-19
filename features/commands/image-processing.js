// Extracted command module. Logic preserved from the original handler.
// Node 18+ provides a standards-compliant global fetch; keep this module dependency-free.
const fetch = globalThis.fetch.bind(globalThis);
import { parseCropRatio, normalizeImageFormat, imageFormatLabel, getCenterCropRect } from '../image-utility-helpers.js';
export { parseCropRatio, normalizeImageFormat, imageFormatLabel, getCenterCropRect } from '../image-utility-helpers.js';

export const IMAGE_PROCESSING_COMMANDS = new Set(["compress", "ratio", "resize", "crop", "imgconvert", "sticker", "sticker1:1", "hd", "palette"]);

export const MAX_IMAGE_PIXELS = 40_000_000;
export const MAX_IMAGE_DIMENSION = 12_000;
export const MAX_IMAGE_OUTPUT_BYTES = 12 * 1024 * 1024;

export function validateImageDimensions(metadata = {}) {
  const width = Number(metadata.width || 0);
  const height = Number(metadata.height || 0);
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) return 'Dimensi gambar tidak valid atau format tidak didukung.';
  if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION || width * height > MAX_IMAGE_PIXELS) {
    return 'Resolusi gambar terlalu besar. Batas proses adalah 40 megapiksel dan 12.000 px per sisi.';
  }
  return '';
}

async function downloadSafeImageBuffer(downloadMedia, sock, target, sharp) {
  const buffer = await downloadMedia(sock, target);
  if (!Buffer.isBuffer(buffer) || !buffer.length) throw new Error('File gambar kosong atau gagal diunduh.');
  const metadata = await sharp(buffer, { limitInputPixels: MAX_IMAGE_PIXELS }).metadata();
  const validationError = validateImageDimensions(metadata);
  if (validationError) throw new Error(validationError);
  return buffer;
}

async function makeStaticSticker(buffer, sharp, addStickerPackMetadata, fit = 'contain') {
  let webpBuffer;
  for (const quality of [82, 72, 62, 52, 42]) {
    webpBuffer = await sharp(buffer, { limitInputPixels: MAX_IMAGE_PIXELS })
      .rotate()
      .resize(512, 512, { fit, position: 'centre', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .webp({ quality, effort: 4 })
      .toBuffer();
    if (webpBuffer.length <= 1024 * 1024) break;
  }
  if (!webpBuffer || webpBuffer.length > 1024 * 1024) throw new Error('Hasil stiker masih melebihi batas WhatsApp 1 MB. Coba gambar yang lebih sederhana.');
  const sticker = await addStickerPackMetadata(webpBuffer);
  if (sticker.length > 1024 * 1024) throw new Error('Metadata stiker membuat file melebihi batas WhatsApp 1 MB.');
  return sticker;
}

export async function handleImageProcessingCommands(ctx) {
  const {
    makeWASocket, DisconnectReason, useMultiFileAuthState, jidNormalizedUser, fetchLatestBaileysVersion,
    downloadMediaMessage, Boom, qrcode, fs, path, execFile, promisify, sharp, webpmux, mongoose,
    GAME_LOCATIONS, GAME_MONSTERS, GAME_CLASSES, createInitialGameState, normalizeGameState,
    handleGameCommand, PREFIX, MONGO_URI, AUTH_DIR, TEMP_DIR, WELCOME_IMAGE, BACKUP_DIR,
    BACKUP_INTERVAL_HOURS, execFileAsync, MAX_IMAGE_BYTES, OWNER_JIDS_RAW, DEFAULT_GROUP_RULES,
    processedMessageIds, senderQueues, MESSAGE_DEDUPE_TTL_MS, MESSAGE_DEDUPE_MAX, rememberMessageId,
    serializeBySender, PartySchema, GuildSchema, AssetSchema, UserSchema, GroupSchema, FavoriteSchema,
    AssetAccessSchema, ReportSchema, TicketSchema, ModerationLogSchema, WarningSchema, Party, Guild,
    GuildWarSchema, GuildWar, MarketListingSchema, MarketListing, WorldBossSchema, WorldBoss,
    TerritorySchema, Territory, Asset, User, Group, Favorite, AssetAccess, Report, Ticket,
    Warning, ModerationLog, spamTracker, SPAM_WINDOW_MS, SPAM_MAX_MESSAGES, LINK_REGEX,
    logModeration, processGroupModeration, normalizeJid, ownerJidSet, ownerIdentityCandidates,
    isBotOwner, isGroupJid, unwrapMessage, getMessageText, getQuotedMessage, getImageTarget,
    downloadMedia, isGroupAdmin, isBotAdmin, sendText, requireDatabase, connectDatabase,
    addStickerPackMetadata, createDatabaseBackup, startBot, getDbReady, getReconnecting,
    sock, msg, remoteJid, isGroup, messageText, parts, command, args, sender, userJid,
    senderIdentityAliases, reply
  } = ctx;

  // `.sticker 1:1` diparse sebagai command `sticker` dengan argumen `1:1`.
  // Alihkan ke handler crop persegi agar argumen tersebut benar-benar diterapkan.
  const effectiveCommand = command === 'sticker' && args[0] === '1:1' ? 'sticker1:1' : command;
  switch (effectiveCommand) {
    case 'sticker': {
      const stickerAction = String(args[0] || '').toLowerCase();
      if (['help', 'bantuan', 'menu'].includes(stickerAction)) {
        return reply(`🎨 *STICKER STUDIO*\nBalas gambar dengan ${PREFIX}sticker untuk stiker transparan proporsional.\n${PREFIX}sticker bulat untuk crop lingkaran.\n${PREFIX}sticker 1:1 untuk crop persegi.\nVideo/stiker animasi: balas media dengan ${PREFIX}sticker.\nBatas hasil stiker statis: 1 MB; media masuk mengikuti batas unduhan bot.`);
      }
      const target = getImageTarget(msg);
      if (!target) return reply(`Kirim atau balas gambar/video dengan caption ${PREFIX}sticker.`);
      if (stickerAction === 'bulat' || stickerAction === 'round' || stickerAction === 'circle') {
        if (!target.message?.imageMessage && !target.message?.stickerMessage) return reply('Mode bulat hanya mendukung gambar atau stiker statis.');
        try {
          const buffer = await downloadSafeImageBuffer(downloadMedia, sock, target, sharp);
          const base = await sharp(buffer, { limitInputPixels: MAX_IMAGE_PIXELS }).rotate().resize(512, 512, { fit: 'cover', position: 'centre' }).png().toBuffer();
          const mask = Buffer.from('<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><circle cx="256" cy="256" r="252" fill="#fff"/></svg>');
          const rounded = await sharp(base).composite([{ input: mask, blend: 'dest-in' }]).webp({ quality: 82, effort: 4 }).toBuffer();
          if (rounded.length > 1024 * 1024) return reply('Hasil stiker bulat melebihi batas WhatsApp 1 MB. Gunakan gambar yang lebih sederhana.');
          const sticker = await addStickerPackMetadata(rounded);
          if (sticker.length > 1024 * 1024) return reply('Metadata stiker bulat membuat file melebihi batas WhatsApp 1 MB.');
          return sock.sendMessage(remoteJid, { sticker }, { quoted: msg });
        } catch (error) {
          return reply(`❌ Stiker bulat gagal dibuat: ${error.message}`);
        }
      }

      const isVideoTarget = Boolean(target.message?.videoMessage);
      const buffer = isVideoTarget ? await downloadMedia(sock, target) : await downloadSafeImageBuffer(downloadMedia, sock, target, sharp);
      let isAnimatedSticker = false;
      if (target.message?.stickerMessage) {
        try {
          const stickerMeta = await sharp(buffer, { animated: true }).metadata();
          isAnimatedSticker = Number(stickerMeta.pages || 1) > 1;
        } catch {}
      }
      const isVideo = Boolean(target.message?.videoMessage)
        || isAnimatedSticker
        || (target.message?.imageMessage === undefined && target.message?.stickerMessage === undefined);

      if (isVideo) {
        let inputPath = '';
        let currentOut = '';
        try {
          inputPath = path.join(TEMP_DIR, `input_${Date.now()}.${isAnimatedSticker ? 'webp' : 'mp4'}`);
          await fs.promises.writeFile(inputPath, buffer);

          let ffmpegCmd = 'ffmpeg';
          try {
            await execFileAsync('ffmpeg', ['-version']);
          } catch (e) {
            const commonPaths = ['C:\\ffmpeg\\bin\\ffmpeg.exe', 'C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe', 'D:\\ffmpeg\\bin\\ffmpeg.exe'];
            for (const p of commonPaths) {
              try { await execFileAsync(p, ['-version']); ffmpegCmd = p; break; } catch (err) {}
            }
          }

          let quality = 65;
          let webpBuffer;

          while (quality > 20) {
            currentOut = path.join(TEMP_DIR, `out_${Date.now()}.webp`);
            await execFileAsync(ffmpegCmd, [
              '-i', inputPath,
              '-t', '4',
              '-vf', `fps=15,scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000,format=yuva420p`,
              '-loop', '0',
              '-vcodec', 'libwebp',
              '-lossless', '0',
              '-q:v', quality.toString(),
              '-preset', 'default',
              '-an',
              '-f', 'webp',
              currentOut
            ], { timeout: 30000 });

            webpBuffer = await fs.promises.readFile(currentOut);
            await fs.promises.unlink(currentOut).catch(() => {});
            if (webpBuffer.length < 1024 * 1024) break;
            quality -= 15;
          }

          if (!webpBuffer || webpBuffer.length > 1024 * 1024) throw new Error('Hasil stiker animasi melebihi batas WhatsApp 1 MB.');
          if (!webpBuffer || webpBuffer.length > 1024 * 1024) throw new Error('Hasil stiker animasi melebihi batas WhatsApp 1 MB.');
          const sticker = await addStickerPackMetadata(webpBuffer);
          if (sticker.length > 1024 * 1024) throw new Error('Metadata stiker animasi membuat file melebihi batas 1 MB.');
          await fs.promises.unlink(inputPath).catch(() => {});
          return sock.sendMessage(remoteJid, { sticker }, { quoted: msg });
        } catch (error) {
          if (inputPath) await fs.promises.unlink(inputPath).catch(() => {});
          if (currentOut) await fs.promises.unlink(currentOut).catch(() => {});
          console.error('[STICKER VIDEO ERROR]', error);
          return reply(`❌ Gagal membuat stiker animasi.`);
        }
      } else {
        const sticker = await makeStaticSticker(buffer, sharp, addStickerPackMetadata, 'contain');
        return sock.sendMessage(remoteJid, { sticker }, { quoted: msg });
      }
    }

    case 'sticker1:1': {
      const target = getImageTarget(msg);
      if (!target) return reply(`Kirim atau balas gambar/video dengan caption ${PREFIX}sticker 1:1.`);

      const isVideoTarget = Boolean(target.message?.videoMessage);
      const buffer = isVideoTarget ? await downloadMedia(sock, target) : await downloadSafeImageBuffer(downloadMedia, sock, target, sharp);
      let isAnimatedSticker = false;
      if (target.message?.stickerMessage) {
        try {
          const stickerMeta = await sharp(buffer, { animated: true }).metadata();
          isAnimatedSticker = Number(stickerMeta.pages || 1) > 1;
        } catch {}
      }
      const isVideo = Boolean(target.message?.videoMessage)
        || isAnimatedSticker
        || (target.message?.imageMessage === undefined && target.message?.stickerMessage === undefined);

      if (isVideo) {
        let inputPath = '';
        let currentOut = '';
        try {
          inputPath = path.join(TEMP_DIR, `input11_${Date.now()}.${isAnimatedSticker ? 'webp' : 'mp4'}`);
          await fs.promises.writeFile(inputPath, buffer);

          let ffmpegCmd = 'ffmpeg';
          try { await execFileAsync('ffmpeg', ['-version']); } catch (e) {
            const commonPaths = ['C:\\ffmpeg\\bin\\ffmpeg.exe', 'C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe', 'D:\\ffmpeg\\bin\\ffmpeg.exe'];
            for (const p of commonPaths) { try { await execFileAsync(p, ['-version']); ffmpegCmd = p; break; } catch (err) {} }
          }

          let quality = 65;
          let webpBuffer;
          while (quality > 20) {
            currentOut = path.join(TEMP_DIR, `out11_${Date.now()}.webp`);
            await execFileAsync(ffmpegCmd, [
              '-i', inputPath,
              '-t', '4',
              '-vf', `crop=min(iw\\,ih):min(iw\\,ih):(iw-ow)/2:(ih-oh)/2,scale=512:512,fps=15,format=yuva420p`,
              '-loop', '0',
              '-vcodec', 'libwebp',
              '-lossless', '0',
              '-q:v', quality.toString(),
              '-preset', 'default',
              '-an',
              '-f', 'webp',
              currentOut
            ], { timeout: 30000 });
            webpBuffer = await fs.promises.readFile(currentOut);
            await fs.promises.unlink(currentOut).catch(() => {});
            if (webpBuffer.length < 1024 * 1024) break;
            quality -= 15;
          }
          const sticker = await addStickerPackMetadata(webpBuffer);
          if (sticker.length > 1024 * 1024) throw new Error('Metadata stiker animasi membuat file melebihi batas 1 MB.');
          await fs.promises.unlink(inputPath).catch(() => {});
          return sock.sendMessage(remoteJid, { sticker }, { quoted: msg });
        } catch (error) {
          if (inputPath) await fs.promises.unlink(inputPath).catch(() => {});
          if (currentOut) await fs.promises.unlink(currentOut).catch(() => {});
          console.error('[STICKER 1:1 VIDEO ERROR]', error);
          return reply(`❌ Gagal membuat stiker 1:1 animasi.`);
        }
      } else {
        const sticker = await makeStaticSticker(buffer, sharp, addStickerPackMetadata, 'cover');
        return sock.sendMessage(remoteJid, { sticker }, { quoted: msg });
      }
    }

    case 'resize': {
      const width = Number(args[0]);
      const height = Number(args[1]);
      if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width > 8000 || height > 8000 || width * height > MAX_IMAGE_PIXELS) {
        return reply(`Format: ${PREFIX}resize <lebar> <tinggi>\nContoh: ${PREFIX}resize 1080 1350 (maksimal 8000 × 8000).`);
      }
      const target = getImageTarget(msg);
      if (!target || (!target.message?.imageMessage && !target.message?.stickerMessage)) return reply(`Kirim atau balas gambar dengan caption ${PREFIX}resize ${width} ${height}.`);
      const buffer = await downloadSafeImageBuffer(downloadMedia, sock, target, sharp);
      const output = await sharp(buffer, { limitInputPixels: MAX_IMAGE_PIXELS }).rotate().resize(width, height, { fit: 'fill', withoutEnlargement: false }).png().toBuffer();
      if (output.length > MAX_IMAGE_OUTPUT_BYTES) return reply('Hasil resize melebihi 12 MB. Gunakan dimensi lebih kecil atau format WebP.');
      return sock.sendMessage(remoteJid, { image: output, caption: `✅ Ukuran hasil: ${width} × ${height} px (tepat sesuai ukuran yang diminta)` }, { quoted: msg });
    }

    case 'crop': {
      const ratio = parseCropRatio(args[0]);
      if (!ratio) return reply(`Format: ${PREFIX}crop <rasio>\nContoh: ${PREFIX}crop 1:1 atau ${PREFIX}crop 4:5 atau ${PREFIX}crop 16:9.\nPemotongan dilakukan dari tengah gambar.`);
      const target = getImageTarget(msg);
      if (!target || (!target.message?.imageMessage && !target.message?.stickerMessage)) return reply(`Kirim atau balas gambar dengan caption ${PREFIX}crop ${args[0]}.`);
      const buffer = await downloadSafeImageBuffer(downloadMedia, sock, target, sharp);
      const orientedBuffer = await sharp(buffer).rotate().toBuffer();
      const metadata = await sharp(orientedBuffer).metadata();
      const sourceWidth = Number(metadata.width || 0);
      const sourceHeight = Number(metadata.height || 0);
      if (!sourceWidth || !sourceHeight) return reply('❌ Dimensi gambar tidak dapat dibaca.');
      const cropRect = getCenterCropRect(sourceWidth, sourceHeight, ratio.ratio);
      if (!cropRect) return reply('❌ Gagal menentukan area crop gambar.');
      const output = await sharp(orientedBuffer).extract(cropRect).png().toBuffer();
      return sock.sendMessage(remoteJid, { image: output, caption: `✂️ Crop ${ratio.width}:${ratio.height} selesai.\nUkuran: ${cropRect.width} × ${cropRect.height} px\nFormat hasil: PNG` }, { quoted: msg });
    }

    case 'imgconvert': {
      const format = normalizeImageFormat(args[0]);
      const qualityArg = args[1] === undefined ? 85 : Number(args[1]);
      if (!format || !Number.isInteger(qualityArg) || qualityArg < 40 || qualityArg > 100) {
        return reply(`Format: ${PREFIX}imgconvert <jpg/png/webp> [kualitas 40-100]\nContoh: ${PREFIX}imgconvert webp 82\nFormat yang didukung: JPG, PNG, WebP.`);
      }
      const target = getImageTarget(msg);
      if (!target || (!target.message?.imageMessage && !target.message?.stickerMessage)) return reply(`Kirim atau balas gambar dengan caption ${PREFIX}imgconvert ${args[0] || 'webp'}.`);
      const buffer = await downloadSafeImageBuffer(downloadMedia, sock, target, sharp);
      let pipeline = sharp(buffer).rotate();
      if (format === 'jpeg') pipeline = pipeline.flatten({ background: '#FFFFFF' }).jpeg({ quality: qualityArg, mozjpeg: true });
      else if (format === 'png') pipeline = pipeline.png({ compressionLevel: 9, palette: true, quality: qualityArg });
      else pipeline = pipeline.webp({ quality: qualityArg, effort: 4 });
      const output = await pipeline.toBuffer();
      const saved = buffer.length ? ((1 - output.length / buffer.length) * 100) : 0;
      const change = saved >= 0 ? `ukuran turun ${saved.toFixed(1)}%` : `ukuran naik ${Math.abs(saved).toFixed(1)}%`;
      return sock.sendMessage(remoteJid, { image: output, caption: `🔄 Konversi ${imageFormatLabel(format)} selesai.\nSebelum: ${(buffer.length / 1024).toFixed(1)} KB\nSesudah: ${(output.length / 1024).toFixed(1)} KB\nPerubahan: ${change}\nKualitas: ${qualityArg}/100` }, { quoted: msg });
    }

    case 'compress': {
      const target = getImageTarget(msg);
      if (!target || (!target.message?.imageMessage && !target.message?.stickerMessage)) return reply(`Kirim atau balas gambar dengan caption ${PREFIX}compress.`);
      const buffer = await downloadSafeImageBuffer(downloadMedia, sock, target, sharp);
      const output = await sharp(buffer).rotate().flatten({ background: '#FFFFFF' }).jpeg({ quality: 78, mozjpeg: true }).toBuffer();
      return sock.sendMessage(remoteJid, { image: output, caption: `✅ Gambar dikompres.\nSebelum: ${(buffer.length / 1024).toFixed(1)} KB\nSesudah: ${(output.length / 1024).toFixed(1)} KB` }, { quoted: msg });
    }

    case 'ratio': {
      const target = getImageTarget(msg);
      if (!target || (!target.message?.imageMessage && !target.message?.stickerMessage)) return reply(`Kirim atau balas gambar dengan caption ${PREFIX}ratio.`);
      const meta = await sharp(await downloadSafeImageBuffer(downloadMedia, sock, target, sharp), { limitInputPixels: MAX_IMAGE_PIXELS }).metadata();
      const w = meta.width, h = meta.height;
      if (!w || !h) return reply('Tidak dapat membaca dimensi gambar.');
      const gcd = (a,b) => b ? gcd(b, a % b) : a;
      const d = gcd(w,h);
      return reply(`📐 *Rasio Gambar*\nResolusi: ${w} × ${h} px\nRasio: ${w/d}:${h/d}\nDesimal: ${(w/h).toFixed(4)}`);
    }

    case 'hd': {
      const target = getImageTarget(msg);
      if (!target || (!target.message?.imageMessage && !target.message?.stickerMessage)) return reply(`Kirim atau balas gambar dengan caption ${PREFIX}hd.`);
      await reply('🚀 *AI Upscaling Started...*\nMencoba server AI alternatif. Mohon tunggu sebentar...');
      try {
        const buffer = await downloadSafeImageBuffer(downloadMedia, sock, target, sharp);
        const response = await fetch('https://api-inference.huggingface.co/models/caidas/Real-ESRGAN', {
          method: 'POST',
          body: buffer,
          headers: { 'Content-Type': 'image/png', 'Accept': 'image/png' },
          signal: AbortSignal.timeout(60000)
        });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`AI Server Error (${response.status}): ${errorText || response.statusText}`);
        }
        const contentType = String(response.headers?.get?.('content-type') || '').toLowerCase();
        if (!contentType.startsWith('image/')) throw new Error('Provider tidak mengembalikan file gambar.');
        const resultBuffer = await response.arrayBuffer();
        if (resultBuffer.byteLength < 1 || resultBuffer.byteLength > MAX_IMAGE_OUTPUT_BYTES) throw new Error('Ukuran hasil AI di luar batas 1 byte–12 MB.');
        const outputBuffer = Buffer.from(resultBuffer);
        const outputMetadata = await sharp(outputBuffer, { limitInputPixels: MAX_IMAGE_PIXELS }).metadata();
        const outputError = validateImageDimensions(outputMetadata);
        if (outputError) throw new Error(outputError);
        return sock.sendMessage(remoteJid, {
          image: outputBuffer,
          caption: `✨ *AI Ultra HD Completed!*\n\nGambar telah diproses menggunakan AI Upscaler untuk hasil yang lebih tajam.`
        }, { quoted: msg });
      } catch (error) {
        console.error('[AI HD ERROR]', error);
        if (error.code === 'ENOTFOUND' || error.message.includes('getaddrinfo')) {
          return reply(`❌ *Koneksi Masih Gagal*\nDomain API AI tetap tidak ditemukan. Ini konfirmasi bahwa ISP Anda memblokir akses ke server AI.\n\n_Saran: Saya sangat menyarankan mengganti DNS ke 8.8.8.8 atau menggunakan API Key (Rencana C)._`);
        }
        return reply(`❌ Gagal melakukan AI Upscale: ${error.message}`);
      }
    }

    case 'palette': {
      const target = getImageTarget(msg);
      if (!target || (!target.message?.imageMessage && !target.message?.stickerMessage)) return reply(`Kirim atau balas gambar dengan caption ${PREFIX}palette.`);
      const buffer = await downloadSafeImageBuffer(downloadMedia, sock, target, sharp);
      const { data: smallImg, info } = await sharp(buffer, { limitInputPixels: MAX_IMAGE_PIXELS }).rotate().flatten({ background: '#FFFFFF' }).removeAlpha().toColourspace('srgb').resize(50, 50).raw().toBuffer({ resolveWithObject: true });
      const colors = {};
      for (let i = 0; i + 2 < smallImg.length; i += info.channels) {
        const r = smallImg[i], g = smallImg[i+1], b = smallImg[i+2];
        const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
        colors[hex] = (colors[hex] || 0) + 1;
      }
      const sortedColors = Object.entries(colors).sort((a, b) => b[1] - a[1]).slice(0, 5);
      const paletteText = sortedColors.map(([color, count], idx) => `${idx + 1}. ${color}`).join('\n');
      return reply(`🎨 *PALETTE WARNA DOMINAN*\n\nBerikut adalah warna utama dari gambar ini:\n\n${paletteText}\n\n${PREFIX}ratio untuk cek rasio gambar.`);
    }

    default: return;
  }
}
