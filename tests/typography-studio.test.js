import test from 'node:test';
import assert from 'node:assert/strict';
import { handleDesignBriefCommands } from '../features/commands/design-brief.js';

async function run(args = []) {
  let output = '';
  await handleDesignBriefCommands({ command: 'fontpair', args, PREFIX: '.', reply: async text => { output = text; } });
  return output;
}

test('fontpair returns a concise default selection', async () => {
  const output = await run();
  assert.match(output, /REKOMENDASI PASANGAN FONT/);
  assert.match(output, /Playfair Display \+ Montserrat/);
  assert.match(output, /lisensi font/);
});

test('fontpair filters by design style tags', async () => {
  const output = await run(['futuristik']);
  assert.match(output, /Space Grotesk \+ Manrope/);
  assert.match(output, /desain digital/);
});

test('fontpair gives guidance when no style matches', async () => {
  const output = await run(['gaya-tidak-ada']);
  assert.match(output, /Belum ada pasangan yang cocok/);
  assert.match(output, /Kategori:/);
});

test('fontpair menyediakan kurasi luas dan mode semua', async () => {
  const output = await run(['semua']);
  assert.match(output, /Menampilkan 12 dari 33 pasangan/);
  assert.match(output, /Playfair Display/);
  assert.match(output, /lisensi font/);
});

test('fontpair dapat difilter untuk kebutuhan spesifik', async () => {
  const output = await run(['gaming']);
  assert.match(output, /Bungee \+ Rubik/);
  assert.match(output, /Teko \+ Rajdhani/);
});

test('fontpair mendukung pagination agar seluruh kurasi dapat diakses', async () => {
  const output = await run(['semua', '2']);
  assert.match(output, /Halaman 2\/3/);
  assert.match(output, /Sora \+ Inter/);
  assert.match(output, /Berikutnya: \.fontpair semua 3/);
});

import { buildFontPairPreviewSvg, sendFontPairPreview } from '../features/commands/design-brief.js';

test('fontpair preview builds an SVG specimen with escaped font names', () => {
  const svg = buildFontPairPreviewSvg({ fonts: 'A&B + <Body>', note: 'Preview pairing' }, 4);
  assert.match(svg, /PREVIEW 4/);
  assert.match(svg, /A&amp;B/);
  assert.match(svg, /&lt;Body&gt;/);
  assert.match(svg, /Ide yang kuat/);
});

test('fontpair preview sends a rendered image through the WhatsApp socket', async () => {
  let sent;
  const fakeSharp = () => ({ png() { return this; }, async toBuffer() { return Buffer.from('png-data'); } });
  await sendFontPairPreview({
    pair: { fonts: 'Bungee + Rubik', note: 'Untuk gaming.' }, index: 30,
    sharp: fakeSharp, sock: { async sendMessage(...args) { sent = args; } },
    remoteJid: '123@s.whatsapp.net', msg: { key: 'quoted' }, reply: async () => {}
  });
  assert.equal(sent[0], '123@s.whatsapp.net');
  assert.deepEqual(sent[1].image, Buffer.from('png-data'));
  assert.match(sent[1].caption, /Bungee \+ Rubik/);
  assert.deepEqual(sent[2], { quoted: { key: 'quoted' } });
});

import { rankFontPairs, buildGoogleFontsPreviewHtml, verifyGoogleFontPair } from '../features/commands/design-brief.js';

test('fontpair moodboard ranks relevant curated pairings first', async () => {
  const output = await run(['mood', 'premium fashion luxury']);
  assert.match(output, /HASIL KURASI BRAND & MOODBOARD/);
  assert.match(output, /Playfair Display \+ Montserrat/);
});

test('fontpair search finds font names and provides Google Fonts search link', async () => {
  const output = await run(['search', 'Inter']);
  assert.match(output, /PENCARIAN FONT: Inter/);
  assert.match(output, /fonts\.google\.com/);
});

test('Google Fonts live preview HTML loads both requested families from CSS2 API', () => {
  const html = buildGoogleFontsPreviewHtml('Playfair Display', 'Inter');
  assert.match(html, /fonts\.googleapis\.com\/css2/);
  assert.match(html, /Playfair Display/);
  assert.match(html, /Inter/);
  assert.match(html, /LIVE GOOGLE FONTS PREVIEW/);
});

test('Google Fonts verification reports availability and network errors', async () => {
  const ok = await verifyGoogleFontPair('Inter', 'Roboto', async () => ({ ok: true, text: async () => '@font-face { font-family: Inter; }' }));
  assert.equal(ok.ok, true);
  const missing = await verifyGoogleFontPair('No Such Font', 'Inter', async () => ({ ok: false, text: async () => '' }));
  assert.equal(missing.reason, 'not_found');
  const offline = await verifyGoogleFontPair('Inter', 'Roboto', async () => { throw new Error('offline'); });
  assert.equal(offline.reason, 'network_error');
});

test('fontpair matcher accepts Indonesian design briefs and returns ranked results', () => {
  const pairs = [
    { fonts: 'Playfair Display + Montserrat', note: 'premium fashion editorial', tags: ['premium', 'fashion', 'luxury'] },
    { fonts: 'Bungee + Rubik', note: 'gaming esports', tags: ['gaming', 'esports'] },
  ];
  const ranked = rankFontPairs(pairs, 'brand premium fashion', 2);
  assert.equal(ranked[0].pair.fonts, 'Playfair Display + Montserrat');
});

test('fontpair favorites save, list, and remove are scoped to the WhatsApp user', async () => {
  const store = [];
  class FakeSchema { index() {} }
  const mongoose = {
    Schema: FakeSchema,
    models: {},
    model(name) {
      class FontPairFavorite {
        static async updateOne(filter, update) {
          if (!store.some(item => item.jid === filter.jid && item.pairKey === filter.pairKey)) {
            store.push({ ...update.$setOnInsert, _id: `id-${store.length + 1}`, createdAt: new Date() });
          }
        }
        static find(filter) {
          return { sort() { return this; }, limit() { return this; }, async lean() { return store.filter(item => item.jid === filter.jid).sort((a, b) => b.createdAt - a.createdAt); } };
        }
        static async deleteOne(filter) {
          const index = store.findIndex(item => item._id === filter._id && item.jid === filter.jid);
          if (index >= 0) store.splice(index, 1);
        }
      }
      this.models[name] = FontPairFavorite;
      return FontPairFavorite;
    }
  };
  const invoke = async args => {
    let output = '';
    await handleDesignBriefCommands({ command: 'fontpair', args, PREFIX: '.', mongoose, getDbReady: () => true, userJid: 'user-a@s.whatsapp.net', sender: 'user-a@s.whatsapp.net', reply: async value => { output = value; } });
    return output;
  };
  assert.match(await invoke(['save', '1']), /disimpan ke favorit/);
  assert.match(await invoke(['favorites']), /Playfair Display \+ Montserrat/);
  assert.match(await invoke(['unsave', '1']), /dihapus/);
  assert.equal(store.length, 0);
});


import { buildFontPairAssistantResult, inspectDesignReference } from '../features/commands/design-brief.js';

test('fontpair AI assistant menyusun tipografi, palet, dan art direction dari brief', () => {
  const pairs = [
    { fonts: 'Playfair Display + Montserrat', note: 'Premium fashion editorial', tags: ['premium', 'fashion', 'luxury', 'elegan'] },
    { fonts: 'Bungee + Rubik', note: 'Gaming esports futuristik', tags: ['gaming', 'esports', 'futuristic'] },
  ];
  const output = buildFontPairAssistantResult(pairs, 'brand skincare premium elegan');
  assert.match(output, /FONTPAIR DESIGN ASSISTANT/);
  assert.match(output, /Playfair Display \+ Montserrat/);
  assert.match(output, /ARAH WARNA/);
  assert.match(output, /ART DIRECTION/);
});

test('fontpair AI assistant memasukkan hasil statistik warna gambar secara transparan', () => {
  const pairs = [{ fonts: 'Inter + Lora', note: 'Modern editorial', tags: ['modern', 'editorial'] }];
  const output = buildFontPairAssistantResult(pairs, 'poster modern', { width: 1200, height: 800, dominantHex: ['#123456'] });
  assert.match(output, /1200×800 px/);
  assert.match(output, /#123456/);
  assert.match(output, /bukan memahami objek\/teks seperti model vision/);
});

test('inspectDesignReference membaca metadata dan warna dari image pipeline', async () => {
  const fakePipeline = {
    rotate() { return this; },
    async metadata() { return { width: 640, height: 480 }; },
    async stats() { return { channels: [{ mean: 18 }, { mean: 52 }, { mean: 86 }] }; },
  };
  const result = await inspectDesignReference(Buffer.from('image'), () => fakePipeline);
  assert.deepEqual(result, { width: 640, height: 480, dominantHex: ['#123456'] });
});

test('fontpair AI assistant memberi petunjuk jika brief dan gambar tidak disertakan', async () => {
  let output = '';
  await handleDesignBriefCommands({ command: 'fontpair', args: ['ai'], PREFIX: '.', reply: async value => { output = value; } });
  assert.match(output, /FONTPAIR DESIGN ASSISTANT/);
  assert.match(output, /balas\/kirim gambar/);
});

test('fontpair assistant inspects an attached reference image and returns palette guidance', async () => {
  let output = '';
  const fakePipeline = {
    rotate() { return this; },
    async metadata() { return { width: 1080, height: 1350 }; },
    async stats() { return { channels: [{ mean: 12 }, { mean: 34 }, { mean: 56 }] }; },
  };
  await handleDesignBriefCommands({
    command: 'fontpair', args: ['ai', 'poster', 'modern'], PREFIX: '.',
    msg: { key: { id: 'image-message' } }, sock: {}, remoteJid: 'user@s.whatsapp.net',
    getImageTarget: () => ({ imageMessage: {} }), downloadMedia: async () => Buffer.from('fake-image'),
    sharp: () => fakePipeline,
    reply: async value => { output = value; },
  });
  assert.match(output, /1080×1350 px/);
  assert.match(output, /#0C2238/);
  assert.match(output, /ART DIRECTION/);
});
