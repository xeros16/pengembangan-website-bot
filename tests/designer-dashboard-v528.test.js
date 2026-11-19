import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../features/design-marketplace/index.js', import.meta.url), 'utf8');
const model = fs.readFileSync(new URL('../models/design-marketplace.js', import.meta.url), 'utf8');
const website = fs.readFileSync(new URL('../portfolio-website/server.js', import.meta.url), 'utf8');
const websiteModels = fs.readFileSync(new URL('../portfolio-website/models.js', import.meta.url), 'utf8');

test('WhatsApp bot issues one-time setup token only for profile owner', () => {
  assert.match(source, /sub === 'dashboard'/);
  assert.match(source, /DesignerProfile\.findOne\(\{ ownerJid: ctx\.userJid \}\)/);
  assert.match(source, /setupTokenHash/);
  assert.match(source, /20 \* 60 \* 1000/);
});

test('WhatsApp bot issues short-lived OTP for activated designer accounts', () => {
  assert.match(source, /action === 'otp'/);
  assert.match(source, /cryptoRandomInt\(100000, 1000000\)/);
  assert.match(source, /5 \* 60 \* 1000/);
  assert.match(source, /otpHash/);
});

test('dashboard auth data uses a dedicated shared MongoDB collection', () => {
  assert.match(model, /collection: 'designerdashboardauth'/);
  assert.match(websiteModels, /collection: 'designerdashboardauth'/);
});

test('designer dashboard mutations are scoped to session designer id', () => {
  assert.match(website, /DesignerProfile\.updateOne\(\{ designerId: session\.designerId \}/);
  assert.match(website, /DesignService\.create/);
  assert.match(website, /validCsrf\(req, form, session\)/);
});
