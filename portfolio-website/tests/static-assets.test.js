import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { serveStaticAsset } from '../static-assets.js';
test('static assets support GET, HEAD and conditional revalidation', async () => {
 const server = http.createServer((req,res) => serveStaticAsset(req,res,new URL('../visual-system.css',import.meta.url).pathname,'text/css'));
 await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
 try {
  const url = `http://127.0.0.1:${server.address().port}`;
  const first = await fetch(url); const body = await first.text();
  assert.equal(first.status,200); assert.ok(body.length > 100);
  const cached = await fetch(url,{headers:{'If-None-Match':'W/'+first.headers.get('etag')}});
  assert.equal(cached.status,304); assert.equal(await cached.text(),'');
  const head = await fetch(url,{method:'HEAD'});
  assert.equal(head.headers.get('content-length'),String(Buffer.byteLength(body))); assert.equal(await head.text(),'');
 } finally { server.closeAllConnections(); await new Promise(resolve=>server.close(resolve)); }
});

test('company stylesheet revalidates edits while the node process keeps running', async () => {
 const { mkdtemp, writeFile, rm } = await import('node:fs/promises');
 const { tmpdir } = await import('node:os');
 const { join } = await import('node:path');
 const temp = await mkdtemp(join(tmpdir(), 'pir-css-revalidate-'));
 const file = join(temp, 'company-editorial.css');
 await writeFile(file, 'body{color:#244B31}');
 const server = http.createServer((req,res) => serveStaticAsset(req,res,file,'text/css; charset=utf-8', {revalidate:true,cacheControl:'no-cache, must-revalidate'}));
 await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
 try {
  const url = `http://127.0.0.1:${server.address().port}`;
  const before = await fetch(url);
  const beforeTag = before.headers.get('etag');
  assert.equal(before.headers.get('cache-control'),'no-cache, must-revalidate');
  assert.equal(await before.text(),'body{color:#244B31}');
  await writeFile(file, 'body{color:#20372A}');
  const after = await fetch(url,{headers:{'If-None-Match':beforeTag}});
  assert.equal(after.status,200,'updated asset must not return stale 304');
  assert.equal(await after.text(),'body{color:#20372A}');
  assert.notEqual(beforeTag, after.headers.get('etag'));
 } finally {
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
  await rm(temp,{recursive:true,force:true});
 }
});
