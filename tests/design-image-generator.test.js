import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDesignImagePrompt, generateDesignImage } from '../features/design-studio/image-generator.js';

test('buildDesignImagePrompt produces a bounded, original design brief', () => {
  const prompt = buildDesignImagePrompt({ kind: 'poster', theme: 'Festival Musik', audience: 'Remaja', style: 'Futuristik neon' });
  assert.match(prompt, /Festival Musik/);
  assert.match(prompt, /Futuristik neon/);
  assert.match(prompt, /Do not imitate/);
  assert.ok(prompt.length <= 1800);
});

test('generateDesignImage requires an API key', async () => {
  const result = await generateDesignImage({ prompt: 'poster', env: {} });
  assert.deepEqual(result, { ok: false, reason: 'not_configured' });
});

test('generateDesignImage sends the image request and decodes PNG base64', async () => {
  let request;
  const png = Buffer.from('fake-png');
  const result = await generateDesignImage({
    prompt: 'Create a poster', env: { OPENAI_API_KEY: 'test-key', OPENAI_IMAGE_MODEL: 'gpt-image-1' },
    fetchImpl: async (url, options) => {
      request = { url, options };
      return { ok: true, json: async () => ({ data: [{ b64_json: png.toString('base64') }] }) };
    }
  });
  assert.equal(result.ok, true);
  assert.deepEqual(result.buffer, png);
  assert.equal(request.url, 'https://api.openai.com/v1/images/generations');
  assert.match(request.options.headers.authorization, /Bearer test-key/);
  assert.equal(JSON.parse(request.options.body).model, 'gpt-image-1');
});

test('generateDesignImage reports provider errors without exposing secrets', async () => {
  const result = await generateDesignImage({
    prompt: 'poster', env: { OPENAI_API_KEY: 'secret' },
    fetchImpl: async () => ({ ok: false, status: 429, json: async () => ({ error: { message: 'quota reached' } }) })
  });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'rate_limited');
});
