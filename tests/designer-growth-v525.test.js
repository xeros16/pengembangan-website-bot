import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { DesignerProfile } from '../models/design-marketplace.js';
import { DesignerAnalytics } from '../models/designer-growth.js';
import { formatProfile } from '../features/design-marketplace/services/marketplace-service.js';

test('designer profile schema supports verification, featuring, language and watermark preferences', () => {
  for (const field of ['isVerified', 'isFeatured', 'language', 'watermarkEnabled', 'softwareSkills']) {
    assert.ok(DesignerProfile.schema.path(field), `missing ${field}`);
  }
  assert.deepEqual(DesignerProfile.schema.path('language').enumValues, ['id', 'en']);
});

test('analytics schema tracks profile, portfolio and direct-contact interactions', () => {
  for (const field of ['designerId', 'profileViews', 'portfolioViews', 'contactClicks', 'daily']) {
    assert.ok(DesignerAnalytics.schema.path(field), `missing ${field}`);
  }
});

test('profile formatter visibly marks verified and featured designers', () => {
  const text = formatProfile({ displayName: 'Studio Test', designerId: 'DSN-ABCD', isVerified: true, isFeatured: true }, 2);
  assert.match(text, /PROFIL DITINJAU PIR/);
  assert.match(text, /FEATURED/);
});

test('public portfolio server includes public profile, media, QR and direct contact routes', () => {
  const source = fs.readFileSync(new URL('../portfolio-website/server.js', import.meta.url), 'utf8');
  for (const route of ["parts[0] !== 'designer'", "parts[0] === 'media'", "parts[0] === 'qr'", "parts[0] === 'contact'"]) assert.ok(source.includes(route));
});

test('portfolio commands expose website, QR, analytics, language and watermark controls', () => {
  const source = fs.readFileSync(new URL('../features/design-marketplace/index.js', import.meta.url), 'utf8');
  for (const command of ["sub === 'website'", "sub === 'qr'", "sub === 'analytics'", "sub === 'bahasa'", "sub === 'watermark'", "sub === 'verified'", "sub === 'popular'"]) assert.ok(source.includes(command));
});


test('public WhatsApp contact is explicit and internal contact identity remains private', () => {
  assert.ok(DesignerProfile.schema.path('publicWhatsApp'));
  const source = fs.readFileSync(new URL('../features/design-marketplace/services/marketplace-service.js', import.meta.url), 'utf8');
  assert.match(source, /profile\.publicWhatsApp/);
  assert.doesNotMatch(source, /profile\.contactJid/);
});
