import test from 'node:test';
import assert from 'node:assert/strict';
import { handleDesignToolsCommands, DESIGN_TOOLS_COMMANDS } from '../features/commands/design-tools.js';

function makeContext(args = []) {
  let output = '';
  return {
    ctx: { command: 'creative', args, PREFIX: '!', reply: async text => { output = String(text); } },
    get output() { return output; },
  };
}

test('creative command remains registered', () => {
  assert.equal(DESIGN_TOOLS_COMMANDS.has('creative'), true);
});

test('creative studio returns three distinct directions and production guidance', async () => {
  const result = makeContext(['kemasan kopi lokal', '|', 'organik premium', '|', 'pouch 250 gram']);
  await handleDesignToolsCommands(result.ctx);
  assert.match(result.output, /Kategori terdeteksi: kemasan/);
  assert.match(result.output, /A — Fokus & jelas/);
  assert.match(result.output, /B — Karakter & ekspresif/);
  assert.match(result.output, /C — Hangat & bercerita/);
  assert.match(result.output, /dieline/i);
  assert.match(result.output, /PROMPT SIAP SALIN/);
  assert.match(result.output, /colorpalette/);
  assert.match(result.output, /bukan AI image generator/);
});

test('creative studio detects digital interface and includes UX checks', async () => {
  const result = makeContext(['dashboard aplikasi kasir', '|', 'minimalis', '|', 'desktop dan mobile']);
  await handleDesignToolsCommands(result.ctx);
  assert.match(result.output, /Kategori terdeteksi: antarmuka digital/);
  assert.match(result.output, /loading\/empty\/error\/success/);
  assert.match(result.output, /kontras WCAG/i);
  assert.match(result.output, /designreview web/);
});

test('creative studio handles empty input with documented syntax', async () => {
  const result = makeContext([]);
  await handleDesignToolsCommands(result.ctx);
  assert.match(result.output, /CREATIVE CONCEPT STUDIO/);
  assert.match(result.output, /<topik> \| <gaya opsional> \| <platform\/ukuran opsional>/);
  assert.match(result.output, /!creative kemasan kopi lokal/);
});
