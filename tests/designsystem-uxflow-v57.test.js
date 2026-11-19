import test from 'node:test';
import assert from 'node:assert/strict';
import { DESIGNER_ASSISTANT_COMMANDS, handleDesignerAssistantCommands } from '../features/commands/designer-assistant.js';

async function run(command, args = []) {
  let output = '';
  await handleDesignerAssistantCommands({ command, args, PREFIX: '.', reply: async text => { output = text; } });
  return output;
}

test('designsystem and uxflow are registered and discoverable in command catalog', () => {
  assert.equal(DESIGNER_ASSISTANT_COMMANDS.has('designsystem'), true);
  assert.equal(DESIGNER_ASSISTANT_COMMANDS.has('uxflow'), true);
});

test('designsystem provides tokens and quality checks for supported style', async () => {
  const output = await run('designsystem', ['futuristik']);
  assert.match(output, /DESIGN SYSTEM: FUTURISTIK/);
  assert.match(output, /#00D9FF/);
  assert.match(output, /Focus state/);
  assert.match(output, /contrast/);
});

test('designsystem explains supported styles when input is missing or invalid', async () => {
  const output = await run('designsystem');
  assert.match(output, /minimalis, futuristik, elegan, playful, alam/);
});

test('uxflow marketplace includes client and designer journeys', async () => {
  const output = await run('uxflow', ['marketplace']);
  assert.match(output, /USER FLOW: MARKETPLACE/);
  assert.match(output, /Klien:/);
  assert.match(output, /Desainer:/);
  assert.match(output, /usability testing/);
});

test('uxflow shows available paths when input is missing', async () => {
  const output = await run('uxflow');
  assert.match(output, /web, app, bot, marketplace, checkout/);
});
