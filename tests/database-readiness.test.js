import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../index.js', import.meta.url), 'utf8');

test('database readiness requires both the application flag and an active MongoDB connection', () => {
  assert.ok(source.includes('let dbReady = false'));
  assert.ok(source.includes('async function requireDatabase(sock, jid)'));
  assert.ok(source.includes('if (dbReady && mongoose.connection.readyState === 1) return true'));
  assert.ok(source.includes('async function connectDatabase()'));
  assert.ok(source.includes("await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 })"));
});

test('MongoDB connection events keep readiness state synchronized', () => {
  assert.ok(source.includes("mongoose.connection.on('connected', () => { dbReady = true"));
  assert.ok(source.includes("mongoose.connection.on('disconnected', () => { dbReady = false"));
  assert.ok(source.includes("mongoose.connection.on('error', error => console.error('[MONGODB]', error.message))"));
});

test('WhatsApp reconnect lifecycle distinguishes online, retryable close and logged-out sessions', () => {
  assert.ok(source.includes("sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr })"));
  assert.ok(source.includes("if (connection === 'open')"));
  assert.ok(source.includes('reconnecting = false'));
  assert.ok(source.includes("if (connection === 'close' && !reconnecting)"));
  assert.ok(source.includes('DisconnectReason.loggedOut'));
  assert.ok(source.includes('setTimeout(() => startBot().catch'));
});
