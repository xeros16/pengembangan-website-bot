import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeDesignWithVision } from '../features/design-studio/design-vision.js';

test('vision copilot explains optional configuration when API key is absent', async () => {
  const result = await analyzeDesignWithVision({ brief: 'poster musik', env: {} });
  assert.deepEqual(result, { ok: false, reason: 'not_configured' });
});

test('vision copilot rejects oversized image before network call', async () => {
  let called = false;
  const result = await analyzeDesignWithVision({
    brief: 'poster', imageBuffer: Buffer.alloc(8 * 1024 * 1024 + 1),
    env: { OPENAI_API_KEY: 'test' }, fetchImpl: async () => { called = true; }
  });
  assert.equal(result.reason, 'image_too_large');
  assert.equal(called, false);
});

test('vision copilot sends image and returns a bounded Indonesian analysis', async () => {
  let request;
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2]);
  const result = await analyzeDesignWithVision({
    brief: 'poster festival musik', imageBuffer: png,
    env: { OPENAI_API_KEY: 'secret', OPENAI_VISION_MODEL: 'vision-test' },
    fetchImpl: async (url, options) => {
      request = { url, options };
      return { ok: true, json: async () => ({ choices: [{ message: { content: 'Analisis visual dan saran tipografi.' } }] }) };
    }
  });
  assert.equal(result.ok, true);
  assert.match(result.text, /AI DESIGN COPILOT/);
  assert.match(request.url, /chat\/completions$/);
  const body = JSON.parse(request.options.body);
  assert.equal(body.model, 'vision-test');
  assert.equal(body.messages[1].content[1].image_url.url.startsWith('data:image/png;base64,'), true);
});

test('vision copilot maps provider errors without leaking credentials', async () => {
  const result = await analyzeDesignWithVision({
    brief: 'brand kopi', env: { OPENAI_API_KEY: 'secret' },
    fetchImpl: async () => ({ ok: false, status: 401 })
  });
  assert.deepEqual(result, { ok: false, reason: 'auth_error' });
  assert.equal(JSON.stringify(result).includes('secret'), false);
});
