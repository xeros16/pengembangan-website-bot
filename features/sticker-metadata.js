import webpmux from 'node-webpmux';

export async function addStickerPackMetadata(webpBuffer) {
  try {
    const image = new webpmux.Image();
    await image.load(webpBuffer);

    const metadata = {
      'sticker-pack-id': 'com.pirvisuals.stickers',
      'sticker-pack-name': 'Pir Visuals',
      'sticker-pack-publisher': 'bot @pir.visuals | Pir Visuals',
      emojis: [],
    };

    const jsonBuffer = Buffer.from(JSON.stringify(metadata), 'utf8');
    const exifHeader = Buffer.from([
      0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00,
      0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x16, 0x00, 0x00, 0x00,
    ]);
    exifHeader.writeUIntLE(jsonBuffer.length, 14, 4);

    image.exif = Buffer.concat([exifHeader, jsonBuffer]);

    // Menggunakan null secara eksplisit untuk memastikan metadata tersimpan ke buffer baru
    return await image.save(null);
  } catch (error) {
    console.error('[METADATA ERROR]', error);
    return webpBuffer;
  }
}
