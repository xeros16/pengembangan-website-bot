import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createWhatsAppUtils } from '../features/whatsapp-utils.js';
import {
  detectPortfolioFormat,
  validateSvgMarkup,
  PORTFOLIO_MAX_FILE_BYTES,
  PROFILE_AVATAR_MAX_FILE_BYTES,
  PROFILE_AVATAR_MAX_PIXELS,
} from '../portfolio-website/portfolio-media.js';

const feature = fs.readFileSync(new URL('../features/design-marketplace/index.js', import.meta.url), 'utf8');
const index = fs.readFileSync(new URL('../index.js', import.meta.url), 'utf8');

test('WhatsApp portfolio wizard accepts SVG documents and stores pending portfolio work', () => {
  assert.match(feature, /async function handleItemWizardMessage/);
  assert.match(feature, /documentMessage/);
  assert.match(feature, /image\/svg\+xml/);
  assert.match(feature, /processPortfolioImageBuffer/);
  assert.match(feature, /moderationStatus: 'pending'/);
  assert.match(feature, /isPrivateNotificationContext\(ctx\)/);
  assert.match(feature, /PORTFOLIO_MAX_FILE_BYTES/);
});

test('portfolio file ceiling is 15 MB without increasing the general bot media limit', () => {
  assert.equal(PORTFOLIO_MAX_FILE_BYTES, 15 * 1024 * 1024);
  assert.match(index, /const MAX_IMAGE_BYTES = 12 \* 1024 \* 1024/);
});

test('WhatsApp media downloader supports a per-call upload ceiling', async () => {
  const payload = Buffer.alloc(13 * 1024 * 1024, 1);
  const utils = createWhatsAppUtils({
    jidNormalizedUser: value => value,
    OWNER_JIDS_RAW: '',
    downloadMediaMessage: async () => payload,
    MAX_IMAGE_BYTES: 12 * 1024 * 1024,
  });
  await assert.rejects(() => utils.downloadMedia({}, {}), /12 MB/);
  const accepted = await utils.downloadMedia({}, {}, 15 * 1024 * 1024);
  assert.equal(accepted.length, payload.length);
});

test('bot and website share SVG validation and reject active/external SVG markup', () => {
  const safe = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10"/></svg>');
  assert.equal(detectPortfolioFormat({ filename: 'artwork.svg', contentType: 'application/octet-stream' }), 'svg');
  assert.doesNotThrow(() => validateSvgMarkup(safe));
  assert.throws(
    () => validateSvgMarkup(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>')),
    /elemen aktif/,
  );
});

test('shared SVG pipeline keeps large Figma exports within the 20 MP raster limit', () => {
  const helper = fs.readFileSync(new URL('../portfolio-website/portfolio-media.js', import.meta.url), 'utf8');
  assert.ok(helper.includes('density: 72'));
  assert.ok(3636 * 2045 < 20_000_000);
  assert.equal(PROFILE_AVATAR_MAX_FILE_BYTES, 5 * 1024 * 1024);
  assert.equal(PROFILE_AVATAR_MAX_PIXELS, 100_000_000);
});
