import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const server = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../pir-public-polish.css', import.meta.url), 'utf8');

test('Designer Studio exposes editable portfolio galleries, cover selection, removal and optional price', () => {
  assert.match(server, /studio-work-media-grid/);
  assert.match(server, /name="coverIndex"/);
  assert.match(server, /name="removeMedia\$\{index\}"/);
  assert.match(server, /name="additionalMedia"[^>]*multiple/);
  assert.match(server, /name="priceFrom" type="number"/);
  assert.match(server, /studio-work-id/);
});

test('Designer Studio edits gallery files through authenticated multipart handling and persists cover and price', () => {
  assert.match(server, /if \(action === 'edit'\) \{[\s\S]*?readMultipart\(req, PORTFOLIO_MAX_REQUEST_BYTES/);
  assert.match(server, /const currentMedia = \[\.\.\.new Set\(\[item\.imagePath/);
  assert.match(server, /const nextMedia = \[selectedCover,[\s\S]*?newRelativePaths/);
  assert.match(server, /priceFrom: Math\.round\(priceFrom\), imagePath: nextMedia\[0\], galleryPaths: nextMedia/);
  assert.match(server, /moderationStatus: 'pending', reviewedBy: '', reviewedAt: null/);
});

test('Private Designer Studio image preview is scoped to the authenticated designer', () => {
  assert.match(server, /parts\[0\] === 'studio' && parts\[1\] === 'media'/);
  assert.match(server, /PortfolioItem\.findOne\(\{ itemId: parts\[2\]\.toUpperCase\(\), designerId: session\.designerId \}\)/);
  assert.match(server, /'cache-control': 'private, no-store'/);
});

test('Designer Studio portfolio cards use a two-column desktop grid and collapse on mobile', () => {
  assert.match(server, /class="studio-work-grid"/);
  assert.match(css, /\.studio-work-grid\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css, /@media\(max-width:760px\)\{[\s\S]*?\.studio-work-grid\{grid-template-columns:minmax\(0,1fr\)\}/);
});

test('Owner portfolio previews preserve each uploaded image natural ratio', () => {
  assert.match(css, /#main-content \.owner-work-preview\{[^}]*aspect-ratio:auto!important/);
  assert.match(css, /#main-content \.owner-work-preview img,[\s\S]*?height:auto!important;max-height:none!important;object-fit:contain!important/);
});

test('Owner Visual Site Studio editor sections no longer render as framed cards', () => {
  assert.match(css, /#main-content \.studio-cms-shell,[\s\S]*?#main-content #studio-editor\{[^}]*border:0!important/);
  assert.match(css, /html\[data-theme="light"\] #main-content \.studio-editor-section,[\s\S]*?background:transparent!important;box-shadow:none!important/);
});

test('Owner Visual Site Studio editor overrides the global light-theme card background', () => {
  assert.match(css, /html\[data-theme=\"light\"\] body #main-content \.studio-cms-shell \.studio-cms-main form#studio-editor > \.studio-editor-section[\s\S]*?background:transparent!important;background-image:none!important;box-shadow:none!important/);
  assert.match(server, /pir-public-polish\.css\?v=20261118bi&rev=3612/);
});

test('Optional portfolio price is included in the public case study metadata', () => {
  assert.match(server, /\['STARTING PRICE',Number\(work\.priceFrom \|\| 0\) > 0 \? money\(work\.priceFrom\) : ''\]/);
});
