import test from 'node:test';
import assert from 'node:assert/strict';
import { handleDesignerAssistantCommands, DESIGNER_ASSISTANT_COMMANDS } from '../features/commands/designer-assistant.js';
import { analyzeTypography, parseSizes, parseFonts, parseLineHeight, TYPOGRAPHY_KINDS } from '../features/design-studio/typography-studio.js';

async function run(args, command = 'typography') {
  let output = '';
  await handleDesignerAssistantCommands({ command, args, PREFIX: '.', reply: async text => { output = String(text); } });
  return output;
}
const levels = analysis => analysis.findings.map(item => item.level);

test('typography is registered as a designer command', () => {
  assert.equal(DESIGNER_ASSISTANT_COMMANDS.has('typography'), true);
});

test('typography shows usage without arguments and for unknown actions', async () => {
  assert.match(await run([]), /TYPOGRAPHY STUDIO/);
  assert.match(await run(['bogus']), /typography check/);
});

test('typography hierarchy works for every supported kind and rejects unknown kinds', async () => {
  for (const kind of TYPOGRAPHY_KINDS) {
    const text = await run(['hierarchy', kind]);
    assert.match(text, new RegExp(`HIERARKI FONT — ${kind.toUpperCase()}`));
    assert.match(text, /Maksimal 2 keluarga font/);
    assert.doesNotMatch(text, /NaN|undefined/);
  }
  assert.match(await run(['hierarchy', 'hologram']), /Pilih jenis/);
  assert.match(await run(['hierarchy']), /Pilih jenis/);
});

test('typography hierarchy references the active command prefix and keeps print units sane', async () => {
  const text = await run(['hierarchy', 'cetak']);
  assert.match(text, /\.typescale/);
  assert.doesNotMatch(text, /\) pt/);
  assert.match(await run(['hierarchy', 'kemasan']), /regulasi dan vendor/);
});

test('typography size gives digital and print guidance and rejects other media', async () => {
  assert.match(await run(['size', 'digital']), /16–18 px/);
  assert.match(await run(['size', 'cetak']), /9–12 pt/);
  assert.match(await run(['size', 'hologram']), /digital atau cetak/);
});

test('typography check rates a healthy digital type system without serious problems', async () => {
  const text = await run(['check', 'digital', '|', 'Inter,', 'Playfair', 'Display', '|', '12', '14', '16*', '20', '25', '31', '|', '1.5']);
  assert.match(text, /TYPOGRAPHY CHECK — DIGITAL/);
  assert.match(text, /Tidak ada masalah serius|Tidak ada masalah terdeteksi/);
  assert.doesNotMatch(text, /❌/);
  assert.doesNotMatch(text, /NaN|undefined/);
});

test('typography check flags too many fonts, tiny text, tight leading, and near-duplicate sizes', async () => {
  const text = await run(['check', 'digital', '|', 'A,', 'B,', 'C,', 'D', '|', '10', '14', '15', '16*', '72', '|', '1.1']);
  assert.match(text, /Keluarga font: 4/);
  assert.match(text, /Ukuran terkecil 10 px/);
  assert.match(text, /Line-height 1\.1 terlalu rapat/);
  assert.match(text, /14↔15/);
  assert.match(text, /Prioritas perbaikan/);
});

test('typography check uses print thresholds for cetak medium', async () => {
  const bad = analyzeTypography({ medium: 'cetak', fonts: ['Serif'], sizes: [5, 7, 24], bodyMarked: 7, lineHeight: 1.0 });
  assert.ok(bad.errors >= 3);
  const good = analyzeTypography({ medium: 'cetak', fonts: ['Serif', 'Sans'], sizes: [8, 10, 14, 24], bodyMarked: 10, lineHeight: 1.3 });
  assert.equal(good.errors, 0);
  assert.equal(good.unit, 'pt');
});

test('typography check marks body explicitly or states the assumption', async () => {
  const marked = analyzeTypography({ medium: 'digital', fonts: ['Inter'], sizes: [12, 18, 40], bodyMarked: 18 });
  assert.equal(marked.body, 18);
  assert.equal(marked.bodyAssumed, false);
  const assumed = analyzeTypography({ medium: 'digital', fonts: ['Inter'], sizes: [12, 15, 24, 40] });
  assert.equal(assumed.body, 15);
  assert.equal(assumed.bodyAssumed, true);
  assert.ok(assumed.findings.some(item => /diasumsikan/.test(item.text)));
});

test('typography check detects missing hierarchy when body is the largest size', () => {
  const analysis = analyzeTypography({ medium: 'digital', fonts: ['Inter'], sizes: [12, 16], bodyMarked: 16 });
  assert.ok(analysis.findings.some(item => item.level === 'error' && /hierarki tidak terbentuk/.test(item.text)));
});

test('typography check suggests a modular ratio for inconsistent scales', () => {
  const analysis = analyzeTypography({ medium: 'digital', fonts: ['Inter'], sizes: [12, 13.5, 16, 40, 44, 90], bodyMarked: 16 });
  assert.ok(analysis.priorities.some(item => /typescale 16/.test(item.fix)));
});

test('typography check validates input and never echoes unsafe formatting', async () => {
  assert.match(await run(['check']), /Format: \.typography check/);
  assert.match(await run(['check', 'hologram', '|', 'Inter', '|', '12', '16']), /Format:/);
  assert.match(await run(['check', 'digital', '|', 'Inter', '|', '12', 'abc']), /Ukuran tidak valid: abc/);
  assert.match(await run(['check', 'digital', '|', 'Inter', '|', '16']), /minimal 2 ukuran/);
  assert.match(await run(['check', 'digital', '|', 'Inter', '|', '12*', '16*', '24']), /hanya satu ukuran body/);
  assert.match(await run(['check', 'digital', '|', 'Inter', '|', '12', '16', '24', '|', 'abc']), /Line-height tidak valid/);
  assert.match(await run(['check', 'digital', '|', 'Inter', '|', '1', '16']), /Ukuran tidak valid/);
  const text = await run(['check', 'digital', '|', '*Evil*_Font_~x~', '|', '12', '16*', '32']);
  assert.doesNotMatch(text, /\*Evil\*|_Font_|~x~/);
  assert.match(text, /EvilFontx/);
});

test('typography parsers handle units, decimal comma, duplicates, and limits', () => {
  assert.deepEqual(parseSizes('12px 14,16* 24pt').sizes, [12, 14, 16, 24]);
  assert.equal(parseSizes('12 16*').bodyMarked, 16);
  assert.deepEqual(parseSizes('2 500 x').invalid, ['2', '500', 'x']);
  assert.deepEqual(parseFonts('Inter, inter, Lato;  '), ['Inter', 'Lato']);
  assert.equal(parseLineHeight('1,5').value, 1.5);
  assert.equal(parseLineHeight('').value, null);
  assert.equal(parseLineHeight('9').invalid, true);
});

test('typography check output uses only known severity levels', () => {
  const analysis = analyzeTypography({ medium: 'digital', fonts: ['Inter'], sizes: [12, 16, 24, 32], bodyMarked: 16, lineHeight: 1.5 });
  assert.ok(levels(analysis).every(level => ['ok', 'warn', 'error', 'info'].includes(level)));
});
