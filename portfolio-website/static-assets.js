import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
// Immutable for the lifetime of a release; restart the process when deploying.
const assets = new Map();
export async function serveStaticAsset(req, res, file, type, options = {}) {
  const { revalidate = false, cacheControl = 'public, max-age=3600' } = options;
  let pending = revalidate ? null : assets.get(file);
  if (!pending) {
    pending = readFile(file).then(body => ({ body, etag: '"' + createHash('sha256').update(body).digest('hex') + '"' }));
    if (!revalidate) {
      assets.set(file, pending);
      pending.catch(() => assets.delete(file));
    }
  }
  const { body, etag } = await pending;
  return sendStaticBody(req, res, body, etag, type, cacheControl);
}

export function sendStaticBody(req, res, body, etag, type, cacheControl) {
  const headers = { 'content-type': type, 'cache-control': cacheControl, etag, 'x-content-type-options': 'nosniff' };
  const tags = String(req.headers['if-none-match'] || '').split(',').map(s => s.trim().replace(/^W\//, ''));
  if (tags.includes(etag) || tags.includes('*')) { res.writeHead(304, headers); return res.end(); }
  res.writeHead(200, { ...headers, 'content-length': body.length });
  res.end(req.method === 'HEAD' ? undefined : body);
}
