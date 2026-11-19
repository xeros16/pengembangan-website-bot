import test from 'node:test';
import assert from 'node:assert/strict';
import { GAME_COMMAND_METADATA } from '../games/command-metadata.js';

test('lightweight game command metadata is complete and unique', () => {
  assert.equal(GAME_COMMAND_METADATA.length, 8);
  assert.equal(new Set(GAME_COMMAND_METADATA.map(item => item.command)).size, GAME_COMMAND_METADATA.length);
  assert.ok(GAME_COMMAND_METADATA.every(item => item.command && item.name && item.description));
});
