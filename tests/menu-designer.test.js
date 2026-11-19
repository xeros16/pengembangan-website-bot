import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const help = fs.readFileSync(path.join(root, 'features/commands/general-help.js'), 'utf8');
const texts = JSON.parse(fs.readFileSync(path.join(root, 'content/texts.json'), 'utf8'));

test('menu designer terdaftar sebagai kategori navigasi', () => {
  assert.match(help, /designer: 'menuDesigner'/);
  assert.match(help, /designer: 'designer'/);
  assert.match(help, /designer: 'Menu Designer'/);
  assert.ok(texts.mainMenu.includes('{prefix}menu designer'));
  assert.ok(texts.menuDesigner.includes('DESIGNER WORKSPACE'));
});

test('menu designer mengelompokkan tools Designer Workspace', () => {
  assert.match(texts.menuDesigner, /BRIEF & IDE/);
  assert.match(texts.menuDesigner, /FONT & TYPE/);
  assert.match(texts.menuDesigner, /QA & PRODUKSI/);
  assert.match(texts.menuDesigner, /fontpair/);
  assert.match(texts.menuDesigner, /typography/);
});


test('menu designer mencakup tools Designer Studio v5.21 dan contoh penggunaan', () => {
  for (const command of ['fontstudio', 'layoutstudio', 'socialkit', 'resourcefind', 'designsystem', 'uxaudit', 'uxflow', 'paletteview', 'palettekit']) {
    assert.ok(texts.menuDesigner.includes(`{prefix}${command}`), `menu harus memuat ${command}`);
  }
  assert.match(texts.menuDesigner, /ALUR/);
  assert.match(texts.menuDesigner, /lisensi font\/aset sebelum komersial/i);
  assert.ok(texts.menuDesigner.length <= 3500, 'menu harus muat dalam batas editor teks Owner');
});

test('katalog command studio memakai deskripsi dan contoh yang benar', async () => {
  const { COMMAND_CATALOG } = await import('../features/command-catalog.js');
  const expected = {
    fontstudio: '.fontstudio elegan poster',
    layoutstudio: '.layoutstudio poster',
    socialkit: '.socialkit instagram_story',
    resourcefind: '.resourcefind font serif',
  };
  for (const [command, example] of Object.entries(expected)) {
    const row = COMMAND_CATALOG.find(item => item.command === command);
    assert.ok(row, `${command} harus ada di katalog`);
    assert.equal(row.example, example);
    assert.match(row.description, /Studio|Toolkit|Finder/);
  }
});
