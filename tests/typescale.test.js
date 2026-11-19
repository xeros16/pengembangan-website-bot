import test from 'node:test';
import assert from 'node:assert/strict';
import { DESIGNER_ASSISTANT_COMMANDS, handleDesignerAssistantCommands } from '../features/commands/designer-assistant.js';

async function run(args = []) {
  let output = '';
  await handleDesignerAssistantCommands({ command: 'typescale', args, PREFIX: '.', reply: async text => { output = text; } });
  return output;
}

test('typescale is registered as a designer tool', () => {
  assert.equal(DESIGNER_ASSISTANT_COMMANDS.has('typescale'), true);
});

test('typescale generates a useful default modular scale', async () => {
  const output = await run();
  assert.match(output, /TYPOGRAPHY SCALE/);
  assert.match(output, /Body: \*16 px\*/);
  assert.match(output, /Heading 1/);
  assert.match(output, /line-height/);
});

test('typescale accepts custom base, ratio, and steps', async () => {
  const output = await run(['18', '1.2', '4']);
  assert.match(output, /Base: 18 px · Ratio: 1.2 · Langkah: 4/);
  assert.match(output, /Body: \*18 px\*/);
});

test('typescale rejects out-of-range input and explains the format', async () => {
  const output = await run(['8', '1.8', '99']);
  assert.match(output, /Format: \.typescale/);
  assert.match(output, /Rentang:/);
});
