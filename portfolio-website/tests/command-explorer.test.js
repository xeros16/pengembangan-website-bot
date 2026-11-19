import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { COMMAND_CATALOG, COMMAND_CATEGORIES, COMMAND_WORKFLOWS } from '../../features/command-catalog.js';

const server = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
const generated = JSON.parse(fs.readFileSync(new URL('../../docs/commands.json', import.meta.url), 'utf8'));

test('generated public command catalog is sourced from the bot registry', () => {
  assert.equal(generated.schemaVersion, 1);
  assert.equal(generated.commandCount, COMMAND_CATALOG.length);
  assert.deepEqual(generated.categories, COMMAND_CATEGORIES);
  assert.deepEqual(generated.commands, COMMAND_CATALOG);
  assert.ok(generated.commands.some(item => item.command === 'designchallenge'));
  assert.ok(generated.commands.some(item => item.command === 'modpreset'));
  assert.ok(generated.commands.some(item => item.command === 'music'));
  assert.ok(generated.commands.some(item => item.command === 'voice'));
  assert.ok(generated.commands.some(item => item.command === 'bass'));
  assert.ok(generated.commands.some(item => item.command === 'cuaca'));
  assert.ok(generated.commands.some(item => item.command === 'gempa'));
  assert.ok(generated.commands.some(item => item.command === 'cohort'));
  assert.ok(generated.commands.some(item => item.command === 'mediaformat'));
  assert.deepEqual(generated.workflows, COMMAND_WORKFLOWS);
  assert.ok(Array.isArray(generated.workflows));
  assert.ok(generated.workflows.some(item => item.id === 'apple-music-preview'));
  assert.ok(generated.workflows.some(item => item.id === 'voice-effects'));
  assert.ok(generated.workflows.some(item => item.id === 'local-information'));
  assert.ok(generated.workflows.some(item => item.id === 'cohort-participant'));
});

test('Command Explorer route reads the generated catalog and exposes accessible client-side search', () => {
  assert.ok(server.includes("parts[0] === 'commands' && parts.length === 1 && req.method === 'GET'"));
  assert.ok(server.includes("path.join(APP_ROOT, 'docs', 'commands.json')"));
  assert.ok(server.includes('id="command-search"'));
  assert.ok(server.includes('id="command-category"'));
  assert.ok(server.includes('aria-live="polite"'));
  assert.ok(server.includes('data-command-card'));
  assert.ok(server.includes('data-copy-command'));
  assert.ok(server.includes('GUIDED WORKFLOWS'));
  assert.ok(server.includes('command-explorer-workflow-grid'));
  assert.ok(server.includes('src="/command-explorer.js?v=6710" defer'));
  assert.ok(server.includes('data-workflow-card'));
  assert.ok(server.includes('id="command-no-results"'));
  assert.ok(server.includes('data-copy-label="Salin alur"'));
  const script = fs.readFileSync(new URL('../command-explorer.js', import.meta.url), 'utf8');
  assert.ok(script.includes('navigator.clipboard.writeText(value)'));
  assert.ok(script.includes("search.addEventListener('input', update)"));
  assert.ok(script.includes("document.querySelectorAll('[data-workflow-card]')"));
  assert.ok(script.includes('visibleWorkflows'));
  assert.ok(server.includes('escapeHtml(item.description)'));
  assert.ok(server.includes("pageShell('Command Explorer — PIR Visuals'"));
  assert.ok(server.includes("parts[0] === 'command-explorer.js'"));
  assert.ok(server.includes("parts[0] === 'visual-system.css'"));
  assert.ok(server.includes('href="/visual-system.css?v=6710"'));
  assert.ok(server.includes("script-src 'self'"));
  const routeStart = server.indexOf("parts[0] === 'commands' && parts.length === 1");
  const routeEnd = server.indexOf("if (parts[0] === 'vendor'", routeStart);
  const routeSource = server.slice(routeStart, routeEnd);
  assert.doesNotMatch(routeSource, /<script>\s*\(/, 'Command Explorer must not inject an inline script blocked by CSP');
});

test('Command Explorer is visible in the primary public website navigation', () => {
  const primaryStart = server.indexOf('<div class="nav-primary">');
  const primaryEnd = server.indexOf('</div>', primaryStart);
  const primary = server.slice(primaryStart, primaryEnd);
  assert.ok(primary.includes('<a href="/commands">Semua Fitur Bot</a>'));
  const moreStart = server.indexOf('<div class="nav-more-menu">');
  const moreEnd = server.indexOf('</div>', moreStart);
  assert.doesNotMatch(server.slice(moreStart, moreEnd), /href="\/commands"/);
  assert.ok(server.includes("{loc:`${base}/commands`,priority:'0.7'}"));
});
