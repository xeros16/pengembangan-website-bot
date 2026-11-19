/**
 * Pure validation helpers for public designer-brief submissions.
 * Kept separate from server.js so input and origin rules can be regression-tested.
 */
export function normalizeOptionalWhatsApp(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return { valid: true, value: '' };
  const normalized = raw.replace(/[\s()-]/g, '');
  if (!/^\+?[1-9]\d{7,14}$/.test(normalized)) {
    return { valid: false, value: '' };
  }
  return { valid: true, value: normalized };
}

export function isSameOriginRequest(headers = {}) {
  const fetchSite = String(headers['sec-fetch-site'] || '').trim().toLowerCase();
  if (fetchSite === 'cross-site') return false;

  const origin = String(headers.origin || '').trim();
  const host = String(headers.host || '').trim();
  // no-referrer can make a same-origin browser form send the literal string "null".
  // Fetch Metadata still distinguishes it from a form submitted from another site.
  if (origin === 'null') return fetchSite === 'same-origin';
  // Some non-browser clients omit Origin; other origins must match Host.
  if (!origin || !host) return true;

  try {
    const parsed = new URL(origin);
    return parsed.origin !== 'null' && parsed.host.toLowerCase() === host.toLowerCase();
  } catch {
    return false;
  }
}
