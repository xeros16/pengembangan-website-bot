import test from 'node:test';
import assert from 'node:assert/strict';
import { DESIGN_CATEGORIES, DESIGN_STYLES, formatProfile, getCommunityGroupIds, normalizeTags, isDesignerId, isPortfolioItemId, isMarketplaceReportId, isValidReportReason, normalizePublicWhatsApp } from '../features/design-marketplace/services/marketplace-service.js';

test('marketplace has starter design categories and styles', () => {
  assert.ok(DESIGN_CATEGORIES.includes('Logo & Branding'));
  assert.ok(DESIGN_CATEGORIES.includes('GFX & Gaming Design'));
  assert.ok(DESIGN_STYLES.includes('Anime'));
  assert.ok(DESIGN_STYLES.includes('Minimalist'));
});

test('tag input is trimmed, deduplicated, and bounded', () => {
  assert.deepEqual(normalizeTags(' Anime, anime, Pixel Art ,, Logo '), ['Anime', 'anime', 'Pixel Art', 'Logo']);
  assert.equal(normalizeTags(Array.from({ length: 15 }, (_, i) => `tag${i}`).join(',')).length, 12);
});

test('community group allowlist accepts group JIDs and rejects malformed values', () => {
  assert.deepEqual(getCommunityGroupIds('120363000000000000-1234567890@g.us, invalid,120363000000000000-1234567890@g.us'), ['120363000000000000-1234567890@g.us']);
  assert.deepEqual(getCommunityGroupIds(''), []);
});


test('marketplace IDs and report reasons are validated safely', () => {
  assert.equal(isDesignerId('DSN-A1B2C3D4'), true);
  assert.equal(isDesignerId('DSN-../../etc'), false);
  assert.equal(isPortfolioItemId('ART-1A2B3C4D'), true);
  assert.equal(isMarketplaceReportId('RPT-1A2B3C4D'), true);
  assert.equal(isMarketplaceReportId('RPT-short'), false);
  assert.equal(isValidReportReason('Karya menggunakan gambar saya tanpa izin'), true);
  assert.equal(isValidReportReason('bad'), false);
});




test('public WhatsApp contact is normalized and can be explicitly hidden', () => {
  assert.equal(normalizePublicWhatsApp('0812 3456 7890'), '6281234567890');
  assert.equal(normalizePublicWhatsApp('+62 812-3456-7890'), '6281234567890');
  assert.equal(normalizePublicWhatsApp('0062 812-3456-7890'), '6281234567890');
  assert.equal(normalizePublicWhatsApp('6281234567890'), '6281234567890');
  assert.equal(normalizePublicWhatsApp('off'), '');
  assert.equal(normalizePublicWhatsApp('-'), '');
  assert.equal(normalizePublicWhatsApp('123'), null);
  assert.equal(normalizePublicWhatsApp('6281234567890123456'), null);
});

test('public profile shows only explicitly configured contact and never leaks internal JID', () => {
  const profile = {
    displayName: 'Designer Test', designerId: 'DSN-A1B2C3D4', ownerJid: '628111111111@s.whatsapp.net',
    contactJid: '628111111111@s.whatsapp.net', publicWhatsApp: '', specialties: ['Logo'],
    isPublic: true, bio: 'Brand identity designer',
  };
  const hidden = formatProfile(profile, 3, { includeContact: true });
  assert.match(hidden, /Kontak belum dicantumkan/);
  const socialProfile = formatProfile({ ...profile, instagram: 'designer.test' }, 3, { includeContact: true });
  assert.match(socialProfile, /instagram\.com\/designer\.test/);
  assert.doesNotMatch(hidden, /628111111111/);
  const optedIn = formatProfile({ ...profile, publicWhatsApp: '6281234567890' }, 3, { includeContact: true });
  assert.match(optedIn, /https:\/\/wa\.me\/6281234567890/);
  assert.doesNotMatch(optedIn, /ownerJid|contactJid/);
});
