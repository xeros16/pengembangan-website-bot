import path from 'node:path';
import os from 'node:os';
import { randomUUID } from 'node:crypto';
import { readFile, rm } from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  searchPinterestImages,
  extractPinterestImageDetails,
  searchBingImages,
  handlePinterestSearchCommands,
  PINTEREST_SEARCH_COMMANDS,
  BING_IMAGE_SEARCH_COMMANDS,
} from '../features/commands/pinterest-search.js';

const historyPath = () => path.join(os.tmpdir(), `image-search-test-${randomUUID()}.json`);
const png = (width = 400, height = 400, marker = 1) => {
  const b = Buffer.alloc(25);
  Buffer.from([137,80,78,71,13,10,26,10]).copy(b,0);
  b.writeUInt32BE(width,16); b.writeUInt32BE(height,20); b[24] = marker;
  return b;
};
const responseHtml = (url, html) => ({ ok: true, status: 200, url, text: async () => html });
const responseImage = (url, bytes = png()) => ({
  ok: true, status: 200, url,
  headers: { get: n => n === 'content-type' ? 'image/png' : String(bytes.length) },
  arrayBuffer: async () => bytes,
});

test('Pinterest and Bing commands remain separate', () => {
  assert.ok(PINTEREST_SEARCH_COMMANDS.has('pinsearch'));
  assert.ok(PINTEREST_SEARCH_COMMANDS.has('pinterest'));
  assert.ok(!PINTEREST_SEARCH_COMMANDS.has('bingsearch'));
  assert.ok(BING_IMAGE_SEARCH_COMMANDS.has('bingsearch'));
});

test('Pinterest public-page extractor only accepts Pinterest CDN image URLs', () => {
  const html = `<script type="application/json">{"id":"123456789012345678","images":{"orig":{"url":"https://i.pinimg.com/originals/aa/bb/cc/abc123.jpg"}}}</script><meta property="og:image" content="https://example.com/placeholder.png">`;
  const result = extractPinterestImageDetails(html, 'https://www.pinterest.com/search/pins/?q=test');
  assert.equal(result.length, 1);
  assert.match(result[0].url, /i\.pinimg\.com\/originals\/.*\.jpg/);
  assert.match(result[0].pinUrl, /123456789012345678/);
});

test('searchPinterestImages fetches public search HTML without API token', async () => {
  let fetched = '';
  const result = await searchPinterestImages('Yae Miko', {
    fetchImpl: async (url) => { fetched = url; return responseHtml(url, '<script>{"url":"https://i.pinimg.com/originals/aa/bb/cc/yae.jpg"}</script>'); },
  });
  assert.equal(fetched, result.searchUrl);
  assert.equal(result.source, 'Pinterest public page');
  assert.equal(result.imageUrls.length, 1);
});

test('pinsearch downloads and sends a valid Pinterest image as WhatsApp media', async () => {
  const replies = [], sent = [];
  const fetchImpl = async url => String(url).includes('pinterest.com/search/pins')
    ? responseHtml(url, '<script>{"id":"123456789012345678","url":"https://i.pinimg.com/originals/aa/bb/cc/yae.jpg"}</script>')
    : responseImage(url, png(500, 500, 4));
  await handlePinterestSearchCommands({
    command: 'pinsearch', args: ['Yae', 'Miko'], fetchImpl, pinsearchHistoryPath: historyPath(),
    reply: async text => replies.push(text),
    sock: { sendMessage: async (...args) => sent.push(args) },
    remoteJid: 'group@g.us', msg: {},
  });
  assert.equal(sent.length, 1);
  assert.ok(Buffer.isBuffer(sent[0][1].image));
  assert.match(sent[0][1].caption, /HASIL PINSEARCH/);
  assert.match(sent[0][1].caption, /pinterest\.com\/pin\/123456789012345678/);
  assert.ok(replies.some(text => /Sedang mencari/.test(text)));
});

test('pinsearch requires a keyword', async () => {
  const replies = [];
  await handlePinterestSearchCommands({
    command: 'pinsearch', args: [], reply: async text => replies.push(text),
    sock: {}, remoteJid: 'group@g.us', msg: {},
  });
  assert.match(replies[0], /Contoh: \.pinsearch Yae Miko/);
});

test('Bing search uses Bing result candidates only', async () => {
  const result = await searchBingImages('Furina', {
    fetchImpl: async url => responseHtml(url, '<script>{"murl":"https://cdn.example.org/furina.png"}</script>'),
  });
  assert.deepEqual(result.imageUrls, ['https://cdn.example.org/furina.png']);
  assert.equal(result.imageDetails[0].source, 'Bing Images');
});

test('bingsearch remains an independent image command', async () => {
  const history = historyPath(), sent = [];
  const fetchImpl = async url => {
    if (String(url).includes('bing.com/images/search')) {
      return responseHtml(url, '<script>{"murl":"https://cdn.example.org/furina.png"}</script>');
    }
    return responseImage(url, png(500, 500, 2));
  };
  await handlePinterestSearchCommands({
    command: 'bingsearch', args: ['Furina'], fetchImpl, pinsearchHistoryPath: history,
    reply: async () => {},
    sock: { sendMessage: async (...args) => sent.push(args) },
    remoteJid: 'group@g.us', msg: {},
  });
  assert.equal(sent.length, 1);
  assert.match(sent[0][1].caption, /HASIL BINGSEARCH/);
  assert.match(sent[0][1].caption, /Bing Images/);
  await rm(history, { force: true });
});

test('image URL history still prevents duplicate Bing results', async () => {
  const history = historyPath(), sent = [];
  const imageUrl = 'https://cdn.example.org/same.png';
  const fetchImpl = async url => String(url).includes('bing.com/images/search')
    ? responseHtml(url, `<script>{"murl":"${imageUrl}"}</script>`)
    : responseImage(url, png(500, 500, 3));
  const run = () => handlePinterestSearchCommands({
    command: 'bingsearch', args: ['same'], fetchImpl, pinsearchHistoryPath: history,
    reply: async () => {},
    sock: { sendMessage: async (...args) => sent.push(args) },
    remoteJid: 'group@g.us', msg: {},
  });
  await run(); await run();
  assert.equal(sent.length, 1);
  const saved = JSON.parse(await readFile(history, 'utf8'));
  assert.deepEqual(saved.urls, [imageUrl]);
  await rm(history, { force: true });
});
