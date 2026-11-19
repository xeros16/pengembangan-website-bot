import test from 'node:test';
import assert from 'node:assert/strict';
import { GAME_REGISTRY, getAvailableGames, dispatchGameCommand } from '../games/index.js';

test('Pixel Realm terdaftar dengan identitas kreator yang benar', () => {
  const game = GAME_REGISTRY.get('pixelrealm');
  assert.ok(game);
  assert.equal(game.id, 'pixel-realm');
  assert.equal(game.name, 'Pixel Realm');
  assert.equal(game.creator, '@pir.visuals');
  assert.equal(typeof game.handler, 'function');
});

test('registry menyediakan daftar game untuk command .games', () => {
  assert.ok(getAvailableGames().some(game => game.command === 'pixelrealm'));
});

test('dispatch mengabaikan command game yang tidak terdaftar', async () => {
  assert.equal(await dispatchGameCommand('unknown-game', {}), false);
});

test('game registry includes the mystery detective game', () => {
  const game = GAME_REGISTRY.get('misteri');
  assert.ok(game);
  assert.equal(game.id, 'misteri-detektif');
  assert.equal(typeof game.handler, 'function');
});
