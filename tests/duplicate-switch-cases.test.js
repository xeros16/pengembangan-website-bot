import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const commandDir = path.resolve('features/commands');
const commandFiles = fs.readdirSync(commandDir).filter(name => name.endsWith('.js'));

test('active modular command files do not contain duplicate switch labels', () => {
  for (const file of commandFiles) {
    const source = fs.readFileSync(path.join(commandDir, file), 'utf8');
    const labels = [...source.matchAll(/\bcase\s+(['"])(.*?)\1\s*:/g)].map(match => match[2]);
    const seen = new Set();
    for (const label of labels) {
      assert.equal(seen.has(label), false, `${file} repeats case '${label}'`);
      seen.add(label);
    }
  }
});
