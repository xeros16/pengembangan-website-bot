import test from 'node:test';
import assert from 'node:assert/strict';
import { handleDesignToolsCommands, DESIGN_TOOLS_COMMANDS } from '../features/commands/design-tools.js';

async function run(args) {
  let output = '';
  await handleDesignToolsCommands({ command: 'designscore', args, PREFIX: '.', reply: async value => { output = value; } });
  return output;
}

test('designscore is registered', () => assert.equal(DESIGN_TOOLS_COMMANDS.has('designscore'), true));
test('designscore calculates score and prioritizes incomplete criteria', async () => {
  const output = await run(['web', '|', '2,1,2,1,0,2']);
  assert.match(output, /Skor: 8\/12 \(67%\)/);
  assert.match(output, /🔴 5\. State sistem: 0\/2/);
  assert.match(output, /Prioritas perbaikan/);
});
test('designscore rejects wrong number of ratings', async () => {
  const output = await run(['logo', '|', '2,1']);
  assert.match(output, /masukkan tepat 6 angka/);
});
test('designscore rejects values outside 0–2', async () => {
  const output = await run(['poster', '|', '2,1,3,1,0']);
  assert.match(output, /Nilai tidak valid/);
});
test('designscore help lists usage', async () => {
  const output = await run([]);
  assert.match(output, /DESIGN SCORECARD/);
  assert.match(output, /nilai dipisah koma/);
});
