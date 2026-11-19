import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const router = fs.readFileSync(path.join(root, 'features/command-handler.js'), 'utf8');
const help = fs.readFileSync(path.join(root, 'features/commands/general-help.js'), 'utf8');

test('recent command capture runs only after a successful recognized command dispatch', () => {
  assert.match(router, /import \{ recordRecentCommand \} from '\.\/quick-access\.js'/);
  assert.match(router, /shouldRecordUsage = isCommand && COMMAND_CATALOG\.some/);
  assert.match(router, /commandExecutionFailed = true/);
  assert.match(router, /finally \{[\s\S]*if \(shouldRecordUsage && !commandExecutionFailed\)[\s\S]*recordRecentCommand/);
});

test('quick access is routed through the normal command handler and remains available in maintenance mode', () => {
  assert.match(help, /GENERAL_HELP_COMMANDS[\s\S]*'cepat'/);
  assert.match(help, /command === 'cepat'[\s\S]*handleQuickAccessCommand/);
  assert.match(router, /maintenanceAllowed = new Set\([\s\S]*'cepat'/);
});
