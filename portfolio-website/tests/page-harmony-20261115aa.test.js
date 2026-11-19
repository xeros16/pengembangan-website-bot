import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const server = readFileSync(new URL('../server.js',import.meta.url),'utf8');
const styles = readFileSync(new URL('../pir-page-harmony.css',import.meta.url),'utf8');

test('public pages load the page-harmony stylesheet after party-paper overrides',()=>{
 const a=server.indexOf('/pir-party-paper.css?v=20261115z');
 const b=server.indexOf('/pir-page-harmony.css?v=20261115aa');
 assert.ok(a>=0 && b>a);
 assert.ok(server.includes("'pir-page-harmony.css'].includes(parts[0])"));
});
test('business CTA uses clear forest/ivory palette and fixes low-contrast eyebrow',()=>{
 assert.match(styles,/\.company-editorial-cta \.eyebrow\s*\{[\s\S]*?color:#cde2bd !important/);
 assert.match(styles,/\.company-editorial-cta h2\s*\{[\s\S]*?color:#f1f5e9 !important/);
 assert.doesNotMatch(server,/style="color:#C7DAAF">LET'S CREATE/);
});
test('three business card actions separate labels from moving decorative arrows',()=>{
 assert.match(server,/class="pv-action-label"/);
 assert.match(server,/class="pv-link-arrow" aria-hidden="true">↗<\/span><\/a><\/article>/);
 assert.match(styles,/\.company-editorial-card > a \{[\s\S]*?gap:11px !important/);
 assert.match(styles,/\.company-editorial-card > a \.pv-link-arrow/);
});
test('discover hero uses a contained square PIR mark without cropping',()=>{
 assert.match(styles,/background:url\('\/pir-footer-seal\.svg'\) center center \/ contain no-repeat !important/);
 assert.match(styles,/aspect-ratio:1;opacity:/);
 assert.match(styles,/max-width:min\(820px,67%\)/);
 assert.match(styles,/display:none !important;/);
});
test('discover filters and results have sage and warm-ivory alternation',()=>{
 assert.match(styles,/\.pv-discovery-shell\s*\{[\s\S]*?background:#e3eddc !important/);
 assert.match(styles,/\.pv-discovery-shell \.search-panel\.pv-discovery-filters\s*\{[\s\S]*?background:#f9faf5 !important/);
 assert.match(styles,/\.pv-match-finder\s*\{[\s\S]*?background:linear-gradient/);
});
test('shortlist toolbar and empty state are laid out as coherent cards',()=>{
 assert.match(styles,/\.shortlist-results\s*\{[\s\S]*?background:#e1ecda !important/);
 assert.match(styles,/\.shortlist-results > \.shortlist-toolbar/);
 assert.match(styles,/\.shortlist-results #shortlist-results > \.empty-state/);
 assert.match(styles,/display:flex;flex-direction:column;align-items:center;justify-content:center/);
});
test('responsive styles keep original page interactions and layout',()=>{
 assert.match(styles,/@media\(max-width:760px\)/);
 assert.match(server,/data-shortlist-clear/);
 assert.match(server,/data-shortlist-share/);
 assert.match(server,/data-shortlist-total/);
});
