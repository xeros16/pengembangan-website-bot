import test from 'node:test';
import assert from 'node:assert/strict';
import { handleDesignerAssistantCommands, DESIGNER_ASSISTANT_COMMANDS } from '../features/commands/designer-assistant.js';
import { parseQaArgs, reviewDesign, QA_KINDS } from '../features/design-studio/qa-review.js';

async function qa(...tokens) {
  let output = '';
  await handleDesignerAssistantCommands({ command: 'qareview', args: tokens, PREFIX: '.', reply: async text => { output = String(text); } });
  return output;
}
async function contrast(fg, bg) {
  let output = '';
  await handleDesignerAssistantCommands({ command: 'contrast', args: [fg, bg], PREFIX: '.', reply: async text => { output = String(text); } });
  return output;
}
const review = (kind, input) => reviewDesign(kind, parseQaArgs(input.split(' ').filter(Boolean)).values);
const find = (result, pattern) => result.findings.find(item => pattern.test(item.text));

test('qareview is registered and shows usage for missing or unknown kinds', async () => {
  assert.equal(DESIGNER_ASSISTANT_COMMANDS.has('qareview'), true);
  assert.match(await qa(), /DESIGN QA REVIEW/);
  assert.match(await qa('hologram'), /Jenis: poster, sosial, logo, cetak, kemasan, web, app/);
});

test('qareview contrast result agrees with the existing contrast command', async () => {
  const text = await qa('web', 'teks=#999999', 'latar=#FFFFFF');
  const reference = await contrast('#999999', '#FFFFFF');
  const ratio = reference.match(/Rasio: \*([\d.]+):1\*/)[1];
  assert.match(text, new RegExp(`${ratio.replace('.', '\\.')}:1`));
  assert.match(text, /❌ Kontras teks/);
});

test('qareview grades contrast into AAA, AA, large-text-only, and failing', () => {
  assert.equal(find(review('web', 'teks=#000000 latar=#FFFFFF'), /Kontras teks/).level, 'ok');
  assert.match(find(review('web', 'teks=#000000 latar=#FFFFFF'), /Kontras teks/).text, /AAA/);
  assert.match(find(review('web', 'teks=#767676 latar=#FFFFFF'), /Kontras teks/).text, /AA teks normal/);
  assert.equal(find(review('web', 'teks=#8C8C8C latar=#FFFFFF'), /Kontras teks/).level, 'warn');
  assert.equal(find(review('web', 'teks=#CCCCCC latar=#FFFFFF'), /Kontras teks/).level, 'error');
});

test('qareview reports invalid input instead of silently passing it', async () => {
  const text = await qa('web', 'teks=zzz', 'latar=#FFFFFF');
  assert.match(text, /Input tidak valid, bagian ini tidak diperiksa: teks=zzz/);
  assert.match(text, /Belum diperiksa.*kontras teks/);
  assert.doesNotMatch(text, /Kontras teks #/);
});

test('qareview ignores unknown keys safely and caps the number of inputs', async () => {
  assert.match(await qa('web', 'warna=biru', 'body=16'), /Diabaikan: warna/);
  const many = Array.from({ length: 40 }, (_, i) => `k${i}=1`);
  assert.match(await qa('web', ...many), /Terlalu banyak isian/);
});

test('qareview checks typography hierarchy and body size with unit-aware rules', () => {
  assert.equal(find(review('web', 'body=16 judul=32'), /Judul .*hierarki jelas/).level, 'ok');
  assert.equal(find(review('web', 'body=16 judul=18'), /hierarki/).level, 'error');
  assert.equal(find(review('web', 'body=16 judul=16'), /tidak lebih besar/).level, 'error');
  assert.equal(find(review('web', 'body=11'), /Body 11 px/).level, 'error');
  assert.equal(find(review('web', 'body=15'), /Body 15 px/).level, 'warn');
  assert.equal(find(review('cetak', 'body=7'), /Body 7 pt/).level, 'error');
  assert.equal(find(review('cetak', 'body=10'), /Body 10 pt/).level, 'ok');
});

test('qareview does not apply absolute body size to canvas-dependent kinds', () => {
  const result = review('poster', 'body=24 judul=96');
  assert.equal(find(result, /Ukuran body absolut tidak dinilai/).level, 'info');
  assert.equal(find(result, /hierarki jelas/).level, 'ok');
});

test('qareview checks touch targets only for web and app', () => {
  assert.equal(find(review('app', 'tap=20'), /Target sentuh/).level, 'error');
  assert.equal(find(review('app', 'tap=32'), /Target sentuh/).level, 'warn');
  assert.equal(find(review('app', 'tap=48'), /Target sentuh/).level, 'ok');
  assert.equal(find(review('poster', 'tap=20'), /Target sentuh/), undefined);
});

test('qareview checks bleed and resolution only for print-oriented kinds with kind-specific thresholds', () => {
  assert.equal(find(review('cetak', 'bleed=0'), /Bleed/).level, 'error');
  assert.equal(find(review('cetak', 'bleed=2'), /Bleed/).level, 'warn');
  assert.equal(find(review('cetak', 'bleed=3'), /Bleed/).level, 'ok');
  assert.equal(find(review('cetak', 'dpi=150'), /Resolusi/).level, 'error');
  assert.equal(find(review('cetak', 'dpi=250'), /Resolusi/).level, 'warn');
  assert.equal(find(review('kemasan', 'dpi=300'), /Resolusi/).level, 'ok');
  assert.equal(find(review('poster', 'dpi=150'), /Resolusi/).level, 'ok');
  assert.equal(find(review('poster', 'dpi=90'), /Resolusi/).level, 'error');
  assert.equal(find(review('web', 'bleed=0 dpi=72'), /Bleed|Resolusi/), undefined);
});

test('qareview checks CTA and alt text only where they apply', () => {
  assert.equal(find(review('sosial', 'cta=tidak'), /CTA/).level, 'warn');
  assert.equal(find(review('sosial', 'cta=ya alt=ya'), /CTA/).level, 'ok');
  assert.equal(find(review('web', 'alt=tidak'), /Alt text/).level, 'warn');
  assert.equal(find(review('cetak', 'cta=tidak alt=tidak'), /CTA|Alt text/), undefined);
  assert.deepEqual(parseQaArgs(['cta=mungkin']).invalid.length, 1);
});

test('qareview checks accent contrast against background', () => {
  assert.equal(find(review('web', 'aksen=#2D6CDF latar=#FFFFFF'), /Kontras aksen/).level, 'ok');
  assert.equal(find(review('web', 'aksen=#CCCCCC latar=#FFFFFF'), /Kontras aksen/).level, 'warn');
  assert.match(review('web', 'aksen=#2D6CDF').notChecked.join(' '), /butuh latar/);
});

test('qareview validates numeric ranges and orders priorities by severity', async () => {
  assert.equal(parseQaArgs(['body=99999']).invalid.length, 1);
  assert.equal(parseQaArgs(['font=2.5']).invalid.length, 1);
  assert.equal(parseQaArgs(['bleed=-1']).invalid.length, 1);
  assert.deepEqual(parseQaArgs(['body=16px', 'bleed=3mm', 'dpi=300dpi']).values, { body: 16, bleed: 3, dpi: 300 });
  const result = review('web', 'teks=#CCCCCC latar=#FFFFFF body=15 font=3');
  const severities = result.priorities.map(item => item.level);
  assert.deepEqual(severities, [...severities].sort((a, b) => (a === 'error' ? 0 : 1) - (b === 'error' ? 0 : 1)));
});

test('qareview works for every supported kind without producing broken text', async () => {
  for (const kind of QA_KINDS) {
    const text = await qa(kind, 'teks=#222222', 'latar=#FFFFFF', 'body=12', 'judul=30', 'font=2');
    assert.match(text, new RegExp(`DESIGN QA REVIEW — ${kind.toUpperCase()}`));
    assert.doesNotMatch(text, /NaN|undefined|\[object/);
    assert.match(text, /tidak menilai tampilan visual/);
  }
});
