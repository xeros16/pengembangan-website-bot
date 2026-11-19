import test from 'node:test';
import assert from 'node:assert/strict';
import { buildBrandKit, formatBrandKit } from '../features/design-studio/brand-kit.js';

test('brand kit rejects missing brand name', () => {
  assert.deepEqual(buildBrandKit({ name: ' ' }), { ok: false, reason: 'name_required' });
});

test('brand kit selects a relevant visual profile and carries brief fields', () => {
  const kit = buildBrandKit({ name: 'Kopi Senja', industry: 'kopi lokal', audience: 'pekerja kreatif', personality: 'natural premium' });
  assert.equal(kit.ok, true);
  assert.equal(kit.style, 'alam');
  assert.equal(kit.industry, 'kopi lokal');
  assert.equal(kit.audience, 'pekerja kreatif');
  assert.equal(kit.colors.length, 4);
  assert.ok(kit.displayFont && kit.bodyFont);
});

test('brand kit sanitizes control characters and limits user-provided fields', () => {
  const kit = buildBrandKit({ name: 'A\nB', industry: 'x'.repeat(200) });
  assert.equal(kit.brand, 'A B');
  assert.equal(kit.industry.length, 80);
});

test('brand kit formatter produces practical guidance', () => {
  const output = formatBrandKit(buildBrandKit({ name: 'Studio Rona' }));
  assert.match(output, /Palet warna awal/);
  assert.match(output, /Tipografi rekomendasi/);
  assert.match(output, /Langkah validasi/);
});
