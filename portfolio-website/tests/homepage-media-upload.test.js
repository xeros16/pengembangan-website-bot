import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const server = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../pir-public-polish.css', import.meta.url), 'utf8');

test('homepage campaign media is stored independently from designer portfolio works', () => {
  assert.match(server, /name="slide\$\{i\}MediaFile"/);
  assert.match(server, /enctype="multipart\/form-data"/);
  assert.match(server, /saveHomepageMediaFile/);
  assert.match(server, /HOMEPAGE_MEDIA_MAX_FILE_BYTES = 50 \* 1024 \* 1024/);
  assert.match(server, /image\/jpeg,image\/png,image\/webp,video\/mp4,video\/webm/);
  assert.match(server, /mediaType: 'video'/);
  assert.match(server, /mediaType: 'image'/);
  assert.match(server, /parts\[0\] === 'homepage-media'/);
  assert.match(server, /accept-ranges/);
  assert.match(server, /content-range/);
  assert.doesNotMatch(server, /bannerSlides\.push\(\{ campaignId:'latest-portfolio'/);
  assert.doesNotMatch(server, /bannerSlides\.push\(\{ campaignId:'featured-designer'/);
});

test('homepage slide media can be previewed before save and retained or removed safely', () => {
  assert.match(server, /dashboard-home-media\.js\?v=3550/);
  assert.match(server, /data-home-media-preview/);
  assert.match(server, /data-home-media-input/);
  assert.match(server, /slide\$\{i\}RemoveMedia/);
  assert.match(server, /URL\.createObjectURL\(file\)/);
  assert.match(server, /new Set\(\[\.\.\.existingSlides,\.\.\.homeWorks,\.\.\.events\]\.map\(item=>item\.media\)/);
  assert.match(server, /name=\"homeWork\$\{i\}MediaFile\"/);
  assert.match(server, /homeWorks,events,layout,copy,categorySettings/);
});

test('standalone showcase renders published portfolio work and Owner event media', () => {
  assert.match(server, /PortfolioItem\.find\(showcaseWorkFilter\)/);
  assert.match(server, /const ownerEvents = \(Array\.isArray\(cms\.events\)/);
  assert.match(server, /event\.mediaType === 'video'/);
  assert.match(server, /<video src="\$\{escapeHtml\(media\)\}" controls muted playsinline/);
  assert.match(css, /pv-showcase-art img,.pv-showcase-art video/);
});

test('homepage and portfolio previews preserve source image aspect ratios on desktop and mobile', () => {
  assert.match(server, /class="studio-work-preview"/);
  assert.match(css, /\.studio-work-preview img[\s\S]*?object-fit:contain/);
  assert.match(css, /\.showcase-work-image img[\s\S]*?object-fit:contain/);
  assert.match(css, /\.home-project-image img[\s\S]*?object-fit:contain/);
  assert.match(css, /\.pv-upload-preview-card img[\s\S]*?object-fit:contain/);
  assert.match(css, /@media\(max-width:760px\)[\s\S]*?pv-showcase-slide[\s\S]*?grid-template-columns:1fr/);
});


test('homepage selected works use separate uploaded media instead of designer portfolio uploads', () => {
  const home = server.slice(server.indexOf('async function renderHome()'), server.indexOf('function renderInfoPage'));
  assert.match(home, /const homeWorkItems = \(Array\.isArray\(cms\.homeWorks\)/);
  assert.match(home, /const projectCards = homeWorkItems\.map/);
  assert.match(home, /work: homeWorkItems\.length/);
  assert.match(home, /<video src="\$\{escapeHtml\(work\.media\)\}" controls muted playsinline/);
  assert.match(home, /PortfolioItem\.find\(/);
  assert.doesNotMatch(home, /works\[0\]/);
  assert.match(server, /name="homeWork\$\{i\}MediaFile"/);
  assert.match(server, /homeWork0MediaFile/);
});

test('directory profile portrait is circular and does not cover its header label', () => {
  assert.match(css, /designer-card-portrait[\s\S]*?border-radius:50% !important/);
  assert.match(css, /designer-card-cover-label[\s\S]*?z-index:2/);
  assert.match(css, /designer-card-cover[\s\S]*?padding:16px 18px 16px 102px/);
});

test('discovery selected-work cards preserve natural image ratio without the old crop frame', () => {
  assert.match(css, /pv-selected-work-image[\s\S]*?aspect-ratio:auto !important/);
  assert.match(css, /pv-selected-work-image img[\s\S]*?height:auto !important/);
  assert.match(css, /object-fit:contain !important/);
});

test('homepage project media remains visible even if scroll-reveal animation does not initialize', () => {
  assert.match(css, /pv-project-grid\[data-pv-story\] > \.home-project[\s\S]*?opacity:1 !important/);
  assert.match(css, /home-project-image[\s\S]*?clip-path:none !important/);
});
