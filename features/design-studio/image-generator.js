const MAX_PROMPT_CHARS = 1800;
const MAX_OUTPUT_BYTES = 12 * 1024 * 1024;

export function buildDesignImagePrompt({ kind = 'poster', theme = '', audience = 'general audience', style = 'clean, polished, contemporary', details = '' } = {}) {
  const clean = (value, max) => String(value ?? '').replace(/[\u0000-\u001F]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
  const safeKind = clean(kind, 80) || 'poster';
  const safeTheme = clean(theme, 220) || 'an original creative concept';
  const safeAudience = clean(audience, 100) || 'general audience';
  const safeStyle = clean(style, 120) || 'clean, polished, contemporary';
  const safeDetails = clean(details, 240);
  return [
    `Create an original ${safeKind} visual concept about “${safeTheme}” for ${safeAudience}.`,
    `Art direction: ${safeStyle}. ${safeDetails}`,
    'Use a deliberate composition, clear focal point, strong visual hierarchy, balanced negative space, refined color harmony, and intentional typography treatment.',
    'If exact copy is not provided, use no legible text rather than inventing words. Do not add logos, signatures, watermarks, QR codes, or fake brand marks.',
    'Do not imitate a living artist, existing brand identity, copyrighted character, or a specific protected artwork. Create a distinct original concept.',
    'Keep important elements inside safe margins and make the result polished and suitable as a design direction reference.'
  ].join(' ').slice(0, MAX_PROMPT_CHARS);
}

export async function generateDesignImage({ prompt, env = process.env, fetchImpl = globalThis.fetch } = {}) {
  const apiKey = String(env.OPENAI_API_KEY || '').trim();
  if (!apiKey) return { ok: false, reason: 'not_configured' };
  if (typeof fetchImpl !== 'function') return { ok: false, reason: 'fetch_unavailable' };
  const finalPrompt = String(prompt || '').trim().slice(0, MAX_PROMPT_CHARS);
  if (!finalPrompt) return { ok: false, reason: 'empty_prompt' };
  const baseUrl = String(env.OPENAI_BASE_URL || 'https://api.openai.com/v1').trim().replace(/\/+$/, '');
  const model = String(env.OPENAI_IMAGE_MODEL || 'gpt-image-1').trim();
  try {
    const response = await fetchImpl(`${baseUrl}/images/generations`, {
      method: 'POST',
      headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({ model, prompt: finalPrompt, size: '1024x1024', quality: 'medium', output_format: 'png', n: 1 }),
      signal: AbortSignal.timeout(90000),
    });
    if (!response.ok) {
      let detail = '';
      try { detail = String((await response.json())?.error?.message || '').slice(0, 220); } catch {}
      return { ok: false, reason: response.status === 401 ? 'auth_error' : response.status === 429 ? 'rate_limited' : response.status === 400 ? 'bad_request' : 'provider_error', detail };
    }
    const payload = await response.json();
    const item = payload?.data?.[0];
    let buffer;
    if (item?.b64_json) buffer = Buffer.from(item.b64_json, 'base64');
    else if (item?.url) {
      const imageResponse = await fetchImpl(item.url, { signal: AbortSignal.timeout(45000) });
      if (!imageResponse.ok) return { ok: false, reason: 'download_failed' };
      buffer = Buffer.from(await imageResponse.arrayBuffer());
    }
    if (!buffer?.length || buffer.length > MAX_OUTPUT_BYTES) return { ok: false, reason: 'invalid_image' };
    return { ok: true, buffer, model };
  } catch (error) {
    return { ok: false, reason: error?.name === 'TimeoutError' ? 'timeout' : 'network_error' };
  }
}
