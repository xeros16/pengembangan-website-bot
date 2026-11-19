import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const js = fs.readFileSync(new URL('../pir-home-showcase.js', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../pir-showcase-editorial.css', import.meta.url), 'utf8');
const server = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
const responsive = css.slice(css.lastIndexOf('Zoom-safe showcase heading'));

test('heading aligns with carousel copy at every viewport width', () => {
  assert.match(js, /\.pv-showcase-heading > div:first-child/);
  assert.match(js, /\[data-showcase-panel\]:not\(\[hidden\]\) \.pv-showcase-slide\.is-active \[data-pv-showcase-copy\]/);
  assert.match(js, /copyRect\.left \+ copyBorderLeft \+ copyPaddingLeft/);
  assert.match(js, /safeLeft - headingBaseLeft/);
  assert.match(js, /safeRight - \(headingBaseLeft \+ headingRect\.width\)/);
  assert.match(js, /20261119d-base-rect-clamped/);
  assert.doesNotMatch(js, /matchMedia\('\(min-width: 901px\)'\);\s*let headingAlignFrame/);
});

test('alignment remains clamped inside the visible page and recalculates on resize', () => {
  assert.match(js, /Math\.max\(12, rootRect\.left \+ 12\)/);
  assert.match(js, /Math\.min\(window\.innerWidth - 12, rootRect\.right - 12\)/);
  assert.match(js, /window\.addEventListener\('resize', scheduleHeadingAlignment/);
  assert.match(js, /document\.fonts\?\.ready\?\.then\(scheduleHeadingAlignment\)/);
  assert.match(js, /scheduleHeadingAlignment\(\);\s*start\(\);/);
  assert.match(js, /ResizeObserver/);
});

test('responsive title sizing remains in place for narrow and zoomed layouts', () => {
  assert.match(responsive, /@media \(max-width: 900px\)/);
  assert.match(responsive, /grid-template-columns: minmax\(0, 1fr\)/);
  assert.match(responsive, /max-width: min\(12ch, 100%\)/);
  assert.match(responsive, /@media \(max-width: 560px\)/);
  assert.match(responsive, /overflow-wrap: break-word/);
});

test('the page loads the cache-busted heading assets', () => {
  assert.match(server, /pir-showcase-editorial\.css\?v=20261119-heading-zoom-safe-b/);
  assert.match(server, /pir-home-showcase\.js\?v=20261119-heading-align-active-slide-e/);
});

test('alignment recalculates from the unshifted heading rectangle to avoid cancelling itself', () => {
  assert.match(js, /headingBaseLeft = headingRect\.left - currentLeft/);
});
