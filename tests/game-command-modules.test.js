import test from 'node:test';
import assert from 'node:assert/strict';
import * as setup from '../games/pixel-realm/commands/modules/setup.js';
import * as world from '../games/pixel-realm/commands/modules/world.js';
import * as combat from '../games/pixel-realm/commands/modules/combat.js';
import * as quests from '../games/pixel-realm/commands/modules/quests.js';
import * as economy from '../games/pixel-realm/commands/modules/economy.js';
import * as pvp from '../games/pixel-realm/commands/modules/pvp.js';
import * as progression from '../games/pixel-realm/commands/modules/progression.js';
import * as social from '../games/pixel-realm/commands/modules/social.js';

test('Pixel Realm command modules route representative commands', () => {
  const ctx = (sub, args = [], game = { battle: null }) => ({ sub, args, game });
  assert.equal(setup.matches(ctx('mulai')), true);
  assert.equal(world.matches(ctx('jelajah')), true);
  assert.equal(combat.matches(ctx('serang')), true);
  assert.equal(quests.matches(ctx('quest')), true);
  assert.equal(economy.matches(ctx('toko')), true);
  assert.equal(pvp.matches(ctx('arena')), true);
  assert.equal(progression.matches(ctx('skillinfo')), true);
  assert.equal(social.matches(ctx('guild')), true);
  assert.equal(world.matches(ctx('not-a-command')), false);
});
