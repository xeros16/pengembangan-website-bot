import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const server = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../pir-public-polish.css', import.meta.url), 'utf8');
const js = fs.readFileSync(new URL('../pir-home-showcase.js', import.meta.url), 'utf8');
const home = server.slice(server.indexOf('async function renderHome()'), server.indexOf('function renderInfoPage'));

 test('homepage showcase is standalone and independent from the hero headline', () => {
  assert.match(home, /const homeSectionKeys = \['categories','talent','work','manifesto','join','faq'\]/);
  assert.match(home, /const showcaseMarkup = `<section class=\"pv-home-showcase\"/);
  assert.match(home, /Karya Terbaru/);
  assert.match(home, /Karya Unggulan/);
  assert.match(home, /Karya Termahal/);
  assert.match(home, /Karya Termurah/);
  assert.match(home, /Event PIR Visuals/);
  assert.match(home, /\$\{showcaseMarkup\}/);
  assert.doesNotMatch(home, /orderedHomeSections\.unshift\('banner'\)/);
});

test('work tabs use approved portfolio items, public designers, featured flags and listed prices', () => {
  assert.match(home, /const showcaseWorkFilter = \{ moderationStatus: 'approved', designerId: \{ \$in: showcaseDesignerIds \} \}/);
  assert.match(home, /featured: true/);
  assert.match(home, /priceFrom: \{ \$gt: 0 \}/);
  assert.match(home, /sort\(\{ priceFrom: -1/);
  assert.match(home, /sort\(\{ priceFrom: 1/);
  assert.match(home, /data-showcase-slide/);
  assert.match(home, /ownerEvents/);
  assert.doesNotMatch(home, /image:'\/editorial-art\.svg'/);
});

test('Owner Dashboard can add and manage works, profiles and five Owner events', () => {
  assert.match(server, /const ownerWorkManager =/);
  assert.match(server, /name=\"action\" value=\"create\"/);
  assert.match(server, /name=\"action\" value=\"update\"/);
  assert.match(server, /parts\[1\] === 'work' && req\.method === 'POST'/);
  assert.match(server, /parts\[1\] === 'designer' && req\.method === 'POST'/);
  assert.match(server, /const eventEditor = \[0,1,2,3,4\]/);
  assert.match(server, /name=\"event\$\{i\}Title\"/);
  assert.match(server, /events,layout,copy,categorySettings/);
});

test('mobile Quick View button no longer shares the header label row', () => {
  assert.match(css, /@media\(max-width:760px\)[\s\S]*?pv-quick-preview-trigger\s*\{[^}]*top:auto!important[^}]*bottom:10px!important/s);
  assert.match(css, /designer-card-cover-label\s*\{[^}]*white-space:normal!important/s);
});

test('standalone showcase preserves uploaded artwork ratio and has touch/tab navigation', () => {
  assert.match(css, /\.pv-showcase-art img,.pv-showcase-art video\s*\{[^}]*object-fit:contain/s);
  assert.match(css, /@media\(max-width:760px\)[\s\S]*?\.pv-showcase-art img,.pv-showcase-art video\s*\{[^}]*object-fit:contain/s);
  assert.match(js, /data-showcase-prev/);
  assert.match(js, /data-showcase-next/);
  assert.match(js, /touchstart/);
  assert.match(js, /ArrowRight/);
});
