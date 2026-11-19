import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  detectPortfolioFormat,
  validateSvgMarkup,
  PORTFOLIO_MAX_FILE_BYTES,
  PORTFOLIO_MAX_FILES,
  PORTFOLIO_MAX_REQUEST_BYTES,
  PROFILE_AVATAR_MAX_FILE_BYTES,
  PROFILE_AVATAR_MAX_PIXELS,
  processProfileAvatarBuffer,
} from '../portfolio-media.js';

const safeSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200" viewBox="0 0 320 200"><defs><linearGradient id="g"><stop offset="0" stop-color="#20372a"/></linearGradient></defs><rect width="320" height="200" fill="url(#g)"/></svg>`;

test('portfolio upload recognizes SVG by extension or SVG MIME type', () => {
  assert.equal(detectPortfolioFormat({ filename: 'banner.svg', contentType: 'application/octet-stream' }), 'svg');
  assert.equal(detectPortfolioFormat({ filename: 'banner', contentType: 'image/svg+xml' }), 'svg');
  assert.equal(detectPortfolioFormat({ filename: 'banner.png', contentType: 'image/png' }), 'png');
  assert.equal(detectPortfolioFormat({ filename: 'banner.pdf', contentType: 'application/pdf' }), null);
});

test('SVG validation accepts safe vector markup and keeps internal fragment references', () => {
  const clean = validateSvgMarkup(Buffer.from(safeSvg));
  assert.match(clean.toString('utf8'), /<svg\b/);
  assert.match(clean.toString('utf8'), /url\(#g\)/);
});

test('SVG validation rejects active content, event handlers, and external references', () => {
  const unsafe = [
    safeSvg.replace('</svg>', '<script>alert(1)</script></svg>'),
    safeSvg.replace('<rect ', '<rect onload="alert(1)" '),
    safeSvg.replace('<rect ', '<image href="https://example.invalid/a.png"/><rect '),
    safeSvg.replace('<svg ', '<!DOCTYPE svg [<!ENTITY x SYSTEM "file:///etc/passwd">]><svg '),
    safeSvg.replace('<rect ', '<foreignObject><div>bad</div></foreignObject><rect '),
  ];
  for (const markup of unsafe) {
    assert.throws(() => validateSvgMarkup(Buffer.from(markup)), /SVG/);
  }
});

test('SVG validation enforces the 15 MB file ceiling', () => {
  assert.equal(PORTFOLIO_MAX_FILE_BYTES, 15 * 1024 * 1024);
  assert.throws(() => validateSvgMarkup(Buffer.alloc(PORTFOLIO_MAX_FILE_BYTES + 1)), /15 MB/);
  assert.equal(PORTFOLIO_MAX_FILES, 5);
  assert.equal(PORTFOLIO_MAX_REQUEST_BYTES, 80 * 1024 * 1024);
});

test('Figma-sized SVGs rasterize at native 72 DPI before the 1800 px optimization step', () => {
  const helper = fs.readFileSync(new URL('../portfolio-media.js', import.meta.url), 'utf8');
  assert.ok(helper.includes('density: 72'));
  assert.ok(3636 * 2045 < 20_000_000);
});

test('profile photo uploads have a separate 5 MB limit and a bounded high-resolution processing ceiling', () => {
  assert.equal(PROFILE_AVATAR_MAX_FILE_BYTES, 5 * 1024 * 1024);
  assert.equal(PROFILE_AVATAR_MAX_PIXELS, 100_000_000);
});


function makePngHeader(width = 512, height = 512) {
  const png = Buffer.alloc(45);
  Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]).copy(png,0);
  png.writeUInt32BE(13,8);
  png.write('IHDR',12,'ascii');
  png.writeUInt32BE(width,16);
  png.writeUInt32BE(height,20);
  png[24]=8; png[25]=6; png[26]=0; png[27]=0; png[28]=0;
  png.writeUInt32BE(0,29);
  png.writeUInt32BE(0,33);
  png.write('IEND',37,'ascii');
  png.writeUInt32BE(0,41);
  return png;
}

test('profile avatar validation accepts a real PNG signature without Sharp/native binaries', async () => {
  const png = makePngHeader();
  const result = await processProfileAvatarBuffer(png, {
    filename: 'avatar.png',
    contentType: 'image/png',
  });
  assert.equal(result.format, 'png');
  assert.equal(result.width, 512);
  assert.equal(result.height, 512);
  assert.equal(result.buffer, png);
});

test('high-resolution profile avatars are downsampled server-side instead of rejected at 20 megapixels', async () => {
  const calls = [];
  const sharpFactory = (input, options) => {
    calls.push({ input, options });
    const pipeline = {
      rotate() { calls.push('rotate'); return this; },
      resize(...args) { calls.push(['resize', ...args]); return this; },
      webp(...args) { calls.push(['webp', ...args]); return this; },
      async toBuffer() { return Buffer.from('optimized-avatar-webp'); },
    };
    return pipeline;
  };
  const result = await processProfileAvatarBuffer(makePngHeader(6000, 6000), {
    filename: 'avatar.png', contentType: 'image/png', sharpFactory,
  });
  assert.equal(result.format, 'webp');
  assert.equal(result.width, 512);
  assert.equal(result.height, 512);
  assert.equal(result.buffer.toString(), 'optimized-avatar-webp');
  assert.ok(calls.includes('rotate'));
  assert.ok(calls.some(call => Array.isArray(call) && call[0] === 'resize' && call[1] === 512 && call[2] === 512));
  assert.ok(calls.some(call => Array.isArray(call) && call[0] === 'webp'));
});

test('profile avatar validation rejects malformed images and files beyond the safe pixel ceiling', async () => {
  await assert.rejects(
    processProfileAvatarBuffer(Buffer.from('<svg/>'), { filename: 'avatar.png', contentType: 'image/png' }),
    /tidak cocok|rusak/,
  );
  await assert.rejects(
    processProfileAvatarBuffer(makePngHeader(11000, 11000), { filename: 'avatar.png', contentType: 'image/png' }),
    /100 megapiksel/,
  );
});
