import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const server = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
const models = fs.readFileSync(path.join(root, 'models.js'), 'utf8');

test('client workspace sessions are hash-only, expiring, and bound to one project', () => {
  assert.match(server, /ClientProjectSession\.findOne\(\{ tokenHash: hashToken\(id\), expiresAt: \{ \$gt: new Date\(\) \} \}\)/);
  assert.match(server, /session\.projectId !== parts\[2\]/);
  assert.match(server, /session\.projectId !== parts\[2\].*Unauthorized/s);
  assert.match(models, /tokenHash: \{ type: String, required: true, unique: true, index: true \}/);
  assert.match(models, /expiresAt: \{ type: Date, required: true, index: \{ expires: 0 \} \}/);
});

test('client invite links are single-use, short-lived, and rate-limited', () => {
  assert.match(server, /scope: 'client-project-access', limit: 20, windowMs: 15 \* 60 \* 1000/);
  assert.match(server, /accessTokenExpiresAt:\{ \$gt:now \}/);
  assert.match(server, /consumed\.modifiedCount !== 1/);
  assert.match(server, /accessTokenHash:hashToken\(token\)/);
  assert.match(server, /clientAccessRevokedAt:null,clientAccessRevokedBy:''/);
  assert.match(server, /'referrer-policy':'no-referrer'/);
});

test('designer can revoke every client session and invalidate pending invite tokens', () => {
  assert.match(server, /parts\[3\] === 'revoke-access'/);
  assert.match(server, /ClientProjectSession\.deleteMany\(\{ projectId: project\.projectId \}\)/);
  assert.match(server, /accessTokenHash: '', accessTokenExpiresAt: null, clientAccessRevokedAt: new Date\(\)/);
  assert.match(server, /Cabut semua akses klien/);
  assert.match(server, /confirmRevocation/);
  assert.match(server, /Konfirmasi diperlukan sebelum semua akses klien dicabut/);
  assert.match(models, /clientAccessRevokedAt: \{ type: Date, default: null \}/);
  assert.match(models, /clientAccessRevokedBy: \{ type: String, default: '' \}/);
});

test('designer invite sending has a bounded rate limit', () => {
  assert.match(server, /scope: 'client-project-invite', identity: session\.designerId, limit: 10/);
});

test('client and designer workspace responses are private and not cacheable', () => {
  assert.match(server, /renderClientProjectWorkspace\(project,designer,updates,session\),\{'cache-control':'no-store','referrer-policy':'no-referrer'\}/);
  assert.match(server, /renderDesignerProjectWorkspace\(project,profile,updates,session,url\.searchParams\.get\('notice'\)\|\|''\),\{'cache-control':'no-store','referrer-policy':'no-referrer'\}/);
});


test('all designer project workspace HTML responses are no-store and no-referrer', () => {
  const start = server.indexOf("if (parts[0] === 'studio' && parts[1] === 'projects' && parts[2] && parts[3] && req.method === 'POST')");
  const end = server.indexOf("if (parts[0] === 'studio' && parts[1] === 'logout')", start);
  const route = server.slice(start, end);
  const lines = route.split(/\r?\n/);
  const renderLines = lines.map((line, index) => ({ line, index })).filter(item => item.line.includes('renderDesignerProjectWorkspace'));
  assert.ok(renderLines.length >= 8);
  for (const { index } of renderLines) {
    const context = lines.slice(index, index + 3).join(' ');
    assert.match(context, /cache-control'\s*:\s*'no-store'/);
    assert.match(context, /referrer-policy'\s*:\s*'no-referrer'/);
  }
});
