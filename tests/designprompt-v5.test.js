import test from 'node:test';
import assert from 'node:assert/strict';
import { handleDesignToolsCommands, DESIGN_TOOLS_COMMANDS } from '../features/commands/design-tools.js';

test('designprompt is registered as a design tool', () => {
  assert.equal(DESIGN_TOOLS_COMMANDS.has('designprompt'), true);
});

test('designprompt builds a copy-ready prompt from pipe-separated fields', async () => {
  let output = '';
  const ctx = {
    command: 'designprompt',
    args: ['poster', '|', 'festival musik malam', '|', 'remaja', '|', 'futuristik neon'],
    PREFIX: '.',
    reply: async text => { output = text; },
  };
  await handleDesignToolsCommands(ctx);
  assert.match(output, /Jenis: poster/);
  assert.match(output, /Tema: festival musik malam/);
  assert.match(output, /Audiens: remaja/);
  assert.match(output, /Gaya: futuristik neon/);
  assert.match(output, /Create an original poster design/);
  assert.match(output, /do not imitate an existing brand/);
  assert.match(output, /bukan pembuat gambar otomatis/);
});

test('designprompt gives usage instructions when no arguments are supplied', async () => {
  let output = '';
  await handleDesignToolsCommands({ command: 'designprompt', args: [], PREFIX: '.', reply: async text => { output = text; } });
  assert.match(output, /PEMBUAT PROMPT DESAIN/);
  assert.match(output, /<jenis> \| <tema> \| <audiens> \| <gaya>/);
});
