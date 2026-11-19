import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const help = fs.readFileSync(new URL('../features/commands/general-help.js', import.meta.url), 'utf8');
const handler = fs.readFileSync(new URL('../features/command-handler.js', import.meta.url), 'utf8');
const utils = fs.readFileSync(new URL('../features/whatsapp-utils.js', import.meta.url), 'utf8');

test('navigation menus use plain text and never send menu artwork or interactive lists/buttons', () => {
  assert.match(help, /return reply\(fallback\)/);
  assert.match(help, /return reply\(await renderMainMenu\(p\)\)/);
  assert.doesNotMatch(help, /sendFeatureMenuPoster|renderFeatureMenuCaption|pir_visuals_feature_menu/);
  assert.doesNotMatch(help, /buttonText|sections:\s*\[|sendInteractiveMenu|MENU_SECTIONS/);
  assert.doesNotMatch(help, /MENU INTERACTIVE FALLBACK/);
});

test('menu categories remain accessible through text commands', () => {
  for (const alias of ['tools:', 'market:', 'tutorial:', 'grup:', 'game:', 'owner:']) assert.ok(help.includes(alias), `missing alias ${alias}`);
  assert.match(help, /if \(command === 'menu' && categoryAliases\[selected\]\)/);
  assert.match(help, /renderMainMenu\(p\)/);
});

test('interactive response payloads are not required for bot navigation', () => {
  assert.doesNotMatch(handler, /menuRoutes|menu_action_|allowedMenuActions/);
  assert.doesNotMatch(utils, /listResponseMessage|buttonsResponseMessage|templateButtonReplyMessage|interactiveResponseMessage/);
});
