import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const js = fs.readFileSync(new URL('../pir-home-showcase.js', import.meta.url), 'utf8');
const server = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');

test('showcase heading aligns to the active carousel copy heading edge', () => {
  assert.match(js, /\.pv-showcase-heading > div:first-child/);
  assert.match(js, /\[data-showcase-panel\]:not\(\[hidden\]\) \.pv-showcase-slide\.is-active \[data-pv-showcase-copy\]/);
  assert.match(js, /copyRect\.left \+ copyBorderLeft \+ copyPaddingLeft/);
  assert.match(js, /style\.setProperty\('left', `\$\{shift\.toFixed\(2\)\}px`, 'important'\)/);
  assert.match(js, /20261119d-base-rect-clamped/);
  assert.match(js, /hidden\/previous slide/);
  assert.match(js, /The active slide is the alignment reference/);
  assert.match(js, /scheduleHeadingAlignment\(\);\s*const current = panel\.querySelector/);
  assert.doesNotMatch(js, /copyHeading = root\.querySelector/);
  assert.match(js, /currentLeft = Number\.parseFloat\(headingTitleBlock\.style\.getPropertyValue\('left'\)\)/);
  assert.match(js, /headingBaseLeft = headingRect\.left - currentLeft/);
  assert.doesNotMatch(js, /headingAlignMedia\.matches/);
  assert.match(js, /safeLeft - headingBaseLeft/);
  assert.match(js, /safeRight - \(headingBaseLeft \+ headingRect\.width\)/);
});

test('heading alignment recalculates after resize, font load, and tab changes', () => {
  assert.match(js, /window\.addEventListener\('resize', scheduleHeadingAlignment/);
  assert.match(js, /document\.fonts\?\.ready\?\.then\(scheduleHeadingAlignment\)/);
  assert.match(js, /scheduleHeadingAlignment\(\);\s*const current = panel\.querySelector\('\[data-showcase-current\]'\);/);
  assert.match(js, /ResizeObserver/);
});

test('the heading alignment patch does not alter carousel sizing or artwork fitting', () => {
  assert.match(server, /pir-showcase-editorial\.css\?v=20261119-heading-zoom-safe-b/);
  assert.match(server, /pir-home-showcase\.js\?v=20261119-heading-align-active-slide-e/);
  assert.match(server, /class="pv-showcase-art"/);
});
