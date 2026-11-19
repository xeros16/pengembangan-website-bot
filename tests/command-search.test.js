import test from 'node:test';
import assert from 'node:assert/strict';
import { searchCommandsByNeed } from '../features/command-suggestions.js';

const commands = query => searchCommandsByNeed(query).map(item => item.command);

test('natural-language search finds poster workflow tools', () => {
  const results = commands('bikin poster acara');
  assert.ok(results.includes('wizard'));
  assert.ok(results.includes('creative'));
  assert.ok(results.includes('designqa') || results.includes('checklist'));
});

test('natural-language search finds image processing tools from everyday wording', () => {
  const results = commands('ubah ukuran foto dan kecilkan file gambar');
  assert.ok(results.includes('resize'));
  assert.ok(results.includes('compress'));
  assert.ok(results.includes('info'));
});

test('natural-language search finds marketplace commands', () => {
  const results = commands('mau mencari jasa desainer logo');
  assert.ok(results.includes('design'));
  assert.ok(results.includes('designer'));
  assert.ok(results.includes('portfolio'));
  assert.ok(!results.includes('requestdesign'));
  assert.ok(!results.includes('service'));
});

test('natural-language search finds learning and community tools', () => {
  assert.ok(commands('belajar desain untuk pemula').includes('designlearn'));
  assert.ok(commands('aturan grup komunitas').includes('rules'));
});

test('natural-language search discovers music metadata and audio tools', () => {
  for (const query of ['cari lagu Nadin Amizah', 'lihat album musik dan artis', 'music search soundtrack']) {
    const results = commands(query);
    assert.ok(results.includes('music'), `music discovery should be found for: ${query}`);
  }
});

test('search rejects empty or excessively long queries', () => {
  assert.deepEqual(searchCommandsByNeed(''), []);
  assert.deepEqual(searchCommandsByNeed('x'.repeat(121)), []);
});

test('search result scores are numeric and results are bounded', () => {
  const results = searchCommandsByNeed('poster', undefined, 99);
  assert.ok(results.length <= 12);
  assert.ok(results.every(item => Number.isFinite(item.score) && item.score > 0));
});


test('natural-language search discovers private quick access from favorites and history wording', () => {
  for (const query of ['simpan perintah favorit', 'lihat command terakhir', 'shortcut fitur yang sering dipakai']) {
    assert.ok(commands(query).includes('cepat'), `quick access should be found for: ${query}`);
  }
});

test('natural-language search discovers anime information commands', () => {
  for (const query of ['cari anime populer', 'lihat sinopsis anime', 'rekomendasi anime musim ini']) {
    assert.ok(commands(query).includes('anime'), `anime discovery should be found for: ${query}`);
  }
});


test('natural-language search discovers Design Battle and designer contribution profile', () => {
  assert.ok(commands('buat kompetisi desain di grup').includes('designchallenge'));
  assert.ok(commands('lihat profil kontribusi desainer').includes('designcommunity'));
});

test('natural-language search discovers read-only moderation status and safe presets', () => {
  assert.ok(commands('lihat status proteksi grup').includes('modstatus'));
  assert.ok(commands('pratinjau preset keamanan grup').includes('modpreset'));
});


test('natural-language search discovers multi-round Design Seasons and private asset collections', () => {
  assert.ok(commands('kompetisi desain beberapa ronde').includes('designseason'));
  assert.ok(commands('simpan aset desain pribadi').includes('assetstudio'));
});


test('natural-language search discovers Voice Lab audio effects', () => {
  for (const query of ['ubah suara voice note jadi robot', 'tambah bass dan echo pada audio', 'buat audio karaoke dan tempo cepat']) {
    const results = commands(query);
    assert.ok(results.includes('voice') || results.includes('bass') || results.includes('karaoke'), `Voice Lab should be found for: ${query}`);
  }
});

test('natural-language search discovers weather and BMKG earthquake utilities', () => {
  assert.ok(commands('cek cuaca hujan di Bandung').includes('cuaca'));
  assert.ok(commands('info gempa terbaru BMKG').includes('gempa'));
});
