import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCropRatio, normalizeImageFormat, imageFormatLabel, getCenterCropRect } from '../features/image-utility-helpers.js';
import { validateImageDimensions, MAX_IMAGE_PIXELS, MAX_IMAGE_DIMENSION } from '../features/commands/image-processing.js';

test('crop ratio parser accepts common and custom ratios', () => {
  assert.deepEqual(parseCropRatio('1:1'), { width: 1, height: 1, ratio: 1 });
  assert.equal(parseCropRatio('4:5').ratio, 0.8);
  assert.equal(parseCropRatio('16:9').ratio, 16 / 9);
  assert.equal(parseCropRatio('0:4'), null);
  assert.equal(parseCropRatio('4/5'), null);
  assert.equal(parseCropRatio('1001:1'), null);
});

test('image format parser normalizes jpg and rejects unsupported formats', () => {
  assert.equal(normalizeImageFormat('jpg'), 'jpeg');
  assert.equal(normalizeImageFormat('.JPG'), 'jpeg');
  assert.equal(normalizeImageFormat('png'), 'png');
  assert.equal(normalizeImageFormat('webp'), 'webp');
  assert.equal(normalizeImageFormat('gif'), null);
  assert.equal(imageFormatLabel('jpeg'), 'JPG');
});


test('center crop rectangle preserves the requested aspect ratio and stays in bounds', () => {
  assert.deepEqual(getCenterCropRect(1600, 900, 1), { left: 350, top: 0, width: 900, height: 900 });
  assert.deepEqual(getCenterCropRect(900, 1600, 4 / 5), { left: 0, top: 237, width: 900, height: 1125 });
  assert.deepEqual(getCenterCropRect(800, 600, 16 / 9), { left: 0, top: 75, width: 800, height: 450 });
  assert.equal(getCenterCropRect(0, 600, 1), null);
  assert.equal(getCenterCropRect(800, 600, 0), null);
});


test('image processing rejects invalid and decompression-bomb dimensions before Sharp transforms', () => {
  assert.equal(validateImageDimensions({ width: 1920, height: 1080 }), '');
  assert.match(validateImageDimensions({ width: 0, height: 100 }), /tidak valid/);
  assert.match(validateImageDimensions({ width: MAX_IMAGE_DIMENSION + 1, height: 1 }), /terlalu besar/);
  assert.match(validateImageDimensions({ width: 8000, height: 6000 }), /terlalu besar/);
  assert.equal(MAX_IMAGE_PIXELS, 40_000_000);
  assert.equal(MAX_IMAGE_DIMENSION, 12_000);
});
