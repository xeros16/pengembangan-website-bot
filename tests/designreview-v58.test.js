import test from 'node:test';
import assert from 'node:assert/strict';
import { handleDesignToolsCommands, DESIGN_TOOLS_COMMANDS } from '../features/commands/design-tools.js';

async function run(args) {
  let output = '';
  await handleDesignToolsCommands({ command: 'designreview', args, PREFIX: '.', reply: async value => { output = value; } });
  return output;
}

test('designreview is registered', () => assert.equal(DESIGN_TOOLS_COMMANDS.has('designreview'), true));
test('designreview web covers UX and accessibility states', async () => {
  const output = await run(['web']);
  assert.match(output, /DESIGN REVIEW: WEBSITE/);
  assert.match(output, /Keyboard, focus, kontras/);
  assert.match(output, /0 = belum terpenuhi/);
  assert.match(output, /bukan analisis otomatis/);
});
test('designreview marketplace covers portfolio directory and direct-contact safeguards', async () => {
  const output = await run(['marketplace']);
  assert.match(output, /Kontak publik hanya tampil atas persetujuan desainer/);
  assert.match(output, /Tautan WhatsApp\/sosial valid/);
  assert.match(output, /JID internal dan data pribadi tidak bocor/);
  assert.doesNotMatch(output, /Status pesanan|Brief dan penawaran/);
});
test('designreview lists supported rubrics without an argument', async () => {
  const output = await run([]);
  assert.match(output, /poster, web, app, logo, sosial, marketplace/);
});
