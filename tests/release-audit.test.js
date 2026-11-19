import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const auditScript = fileURLToPath(new URL('../scripts/audit-release.js', import.meta.url));

function makeFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pir-release-audit-'));
  fs.mkdirSync(path.join(root, 'scripts'), { recursive: true });
  fs.copyFileSync(auditScript, path.join(root, 'scripts', 'audit-release.js'));
  return root;
}

function runAudit(root) {
  return spawnSync(process.execPath, [path.join(root, 'scripts', 'audit-release.js')], {
    cwd: root,
    encoding: 'utf8',
  });
}

test('release audit rejects private environment and runtime configuration files', () => {
  const root = makeFixture();
  try {
    fs.writeFileSync(path.join(root, '.env'), 'TOKEN=do-not-print');
    fs.mkdirSync(path.join(root, 'config'), { recursive: true });
    fs.writeFileSync(path.join(root, 'config', 'allowed-chats.json.bak'), '{}');
    fs.writeFileSync(path.join(root, 'config', 'command-aliases.json'), '{}');
    fs.writeFileSync(path.join(root, 'config', 'bot-settings.json'), '{}');
    fs.mkdirSync(path.join(root, 'content'), { recursive: true });
    fs.writeFileSync(path.join(root, 'content', 'texts.json'), '{}');

    const result = runAudit(root);
    const output = `${result.stdout}\n${result.stderr}`;
    assert.equal(result.status, 1);
    assert.match(output, /\.env/);
    assert.match(output, /allowed-chats\.json\.bak/);
    assert.match(output, /command-aliases\.json/);
    assert.match(output, /bot-settings\.json/);
    assert.match(output, /content\/texts\.json/);
    assert.ok(!output.includes('do-not-print'));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('release audit permits example environment files and ignores local node_modules', () => {
  const root = makeFixture();
  try {
    fs.writeFileSync(path.join(root, '.env.example'), 'TOKEN=replace-me');
    fs.mkdirSync(path.join(root, 'node_modules', 'example-package'), { recursive: true });
    fs.writeFileSync(path.join(root, 'node_modules', 'example-package', 'index.js'), 'export {};');

    const result = runAudit(root);
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.match(result.stdout, /Audit rilis lulus/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
