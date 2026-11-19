const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_BRIEF_CHARS = 1800;

function cleanText(value, max = MAX_BRIEF_CHARS) {
  return String(value ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);
}

function imageMime(buffer) {
  if (buffer?.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buffer?.[0] === 0xff && buffer?.[1] === 0xd8 && buffer?.[2] === 0xff) return 'image/jpeg';
  if (buffer?.toString('ascii', 0, 4) === 'RIFF' && buffer?.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  if (buffer?.toString('ascii', 4, 8) === 'ftypavif') return 'image/avif';
  return 'image/jpeg';
}

/** OpenAI-compatible multimodal design review. No credentials are stored in source code. */
export async function analyzeDesignWithVision({ brief, imageBuffer = null, sharp, env = process.env, fetchImpl = globalThis.fetch } = {}) {
  const apiKey = cleanText(env.OPENAI_API_KEY, 500);
  if (!apiKey) return { ok: false, reason: 'not_configured' };
  if (typeof fetchImpl !== 'function') return { ok: false, reason: 'fetch_unavailable' };
  if (imageBuffer && (!Buffer.isBuffer(imageBuffer) || imageBuffer.length > MAX_IMAGE_BYTES)) {
    return { ok: false, reason: 'image_too_large' };
  }

  const baseUrl = cleanText(env.OPENAI_BASE_URL || 'https://api.openai.com/v1', 500).replace(/\/+$/, '');
  const model = cleanText(env.OPENAI_VISION_MODEL || 'gpt-4o-mini', 120);
  const userText = cleanText(brief) || 'Analisis desain pada gambar ini.';
  const content = [{
    type: 'text',
    text: `Bertindak sebagai art director dan desainer senior. Analisis brief dan referensi berikut dalam bahasa Indonesia. Berikan: (1) ringkasan tujuan dan audiens, (2) analisis hierarki/layout/kontras/spacing, (3) karakter tipografi dan 2-3 pasangan font yang relevan dari font umum/Google Fonts, (4) palet 4-5 warna dengan HEX dan peran tiap warna, (5) art direction yang bisa ditindaklanjuti, (6) 5 prioritas perbaikan. Jika gambar tidak cukup jelas, nyatakan keterbatasannya. Jangan mengklaim identitas font dari gambar sebagai kepastian; sebut sebagai perkiraan. Bedakan observasi dari saran. Brief: ${userText}`
  }];
  if (imageBuffer) {
    const mime = imageMime(imageBuffer);
    content.push({ type: 'image_url', image_url: { url: `data:${mime};base64,${imageBuffer.toString('base64')}`, detail: 'high' } });
  }

  try {
    const response = await fetchImpl(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({ model, temperature: 0.35, max_tokens: 1200, messages: [
        { role: 'system', content: 'Anda adalah AI Design Copilot yang teliti, praktis, dan tidak mengarang fakta visual.' },
        { role: 'user', content }
      ] }),
      signal: AbortSignal.timeout(45000),
    });
    if (!response.ok) return { ok: false, reason: response.status === 401 ? 'auth_error' : response.status === 429 ? 'rate_limited' : 'provider_error' };
    const payload = await response.json();
    const result = cleanText(payload?.choices?.[0]?.message?.content, 6500);
    if (!result) return { ok: false, reason: 'empty_response' };
    return { ok: true, text: `🧠 *AI DESIGN COPILOT*\nModel: ${model}\n\n${result}\n\nCatatan: rekomendasi AI perlu ditinjau desainer. Verifikasi font, lisensi, kontras, dan keterbacaan sebelum produksi.` };
  } catch (error) {
    return { ok: false, reason: error?.name === 'TimeoutError' ? 'timeout' : 'network_error' };
  }
}
