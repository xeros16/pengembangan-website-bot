import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const texts = JSON.parse(fs.readFileSync(new URL('../content/texts.example.json', import.meta.url), 'utf8'));
const handler = fs.readFileSync(new URL('../features/command-handler.js', import.meta.url), 'utf8');
const catalog = fs.readFileSync(new URL('../features/command-catalog.js', import.meta.url), 'utf8');
const docs = fs.readFileSync(new URL('../games/README.md', import.meta.url), 'utf8');

test('Game Center lists all standalone games, not only Pixel Realm', () => {
  for (const command of ['tebak', 'angka', 'acak', 'misteri', 'multi', 'pr']) {
    assert.ok(texts.menuGame.includes(`{prefix}${command}`), `menuGame should include ${command}`);
    assert.ok(texts.tutorialGame.includes(`{prefix}${command}`), `tutorialGame should include ${command}`);
  }
});

test('runtime Game Center separates playable games from player support systems', () => {
  for (const command of ['pixelrealm', 'tebak', 'angka', 'acak', 'misteri', 'multi']) {
    assert.ok(handler.includes(`'${command}'`), `runtime Game Center should include ${command}`);
  }
  assert.ok(handler.includes('PROFIL PEMAIN & PROGRES'));
  assert.ok(handler.includes('MISI & HADIAH HARIAN'));
});

test('command catalog no longer categorizes every registered game as Pixel Realm', () => {
  assert.ok(catalog.includes("tebak: 'Game Tebak-Tebakan'"));
  assert.ok(catalog.includes("multi: 'Game Multiplayer'"));
  assert.ok(catalog.includes("pixelrealm: 'RPG Pixel Realm'"));
});

test('Game Center documentation explains all main games and support systems', () => {
  for (const name of ['Pixel Realm', 'Tebak-Tebakan Multikategori', 'Tebak Angka', 'Acak Kata', 'Misteri & Detektif', 'Multiplayer', '.player', '.mission']) {
    assert.ok(docs.includes(name), `documentation should include ${name}`);
  }
});
