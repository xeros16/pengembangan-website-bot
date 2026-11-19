import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../index.js', import.meta.url), 'utf8');

test('bot exposes local-only readiness endpoint for database and Baileys state', () => {
  assert.ok(source.includes("import http from 'node:http'"));
  assert.ok(source.includes("const healthPort = Number(process.env.BOT_HEALTH_PORT || 3091)"));
  assert.ok(source.includes("['127.0.0.1', '::1', 'localhost'].includes(healthHost)"));
  assert.ok(source.includes("['/health', '/ready'].includes"));
  assert.ok(source.includes("whatsapp: whatsappConnectionState"));
  assert.ok(source.includes("database: dbReady ? 'connected' : 'disconnected'"));
  assert.ok(source.includes("const ready = dbReady && whatsappConnectionState === 'open'"));
});

test('WhatsApp connection lifecycle updates health state', () => {
  assert.ok(source.includes("if (connection) whatsappConnectionState = connection"));
  assert.ok(source.includes("if (connection === 'open')"));
  assert.ok(source.includes("if (connection === 'close'"));
});


test('Owner command dependencies expose the live WhatsApp connection lifecycle state', () => {
  assert.ok(source.includes("getWhatsAppConnectionState: () => whatsappConnectionState"));
});
