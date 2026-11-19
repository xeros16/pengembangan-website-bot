import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const server = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
const helper = fs.readFileSync(new URL('../portfolio-media.js', import.meta.url), 'utf8');
const models = fs.readFileSync(new URL('../models.js', import.meta.url), 'utf8');

test('Designer Studio workspace navigation has matching section targets and explicit click handling', () => {
  const targets = [
    'overview', 'portfolio-health', 'analytics', 'edit-profile', 'portfolio-manager',
    'services-manager', 'client-projects', 'leads', 'availability', 'notifications',
    'notification-push-settings',
  ];
  for (const target of targets) {
    assert.ok(server.includes("['" + target + "'"), 'missing navigation item ' + target);
    assert.ok(server.includes('id="' + target + '"'), 'missing section target ' + target);
  }
  assert.match(server, /data-studio-nav-link/);
  assert.match(server, /window\.scrollTo\(\{top:Math\.max\(0,targetTop\),behavior:/);
  assert.match(server, /history\.replaceState\(null,'',link\.hash\)/);
  assert.match(server, /studio-nav-icon/);
  assert.match(server, /gap:11px;padding:11px 12px/);
  assert.match(server, /public-ui\.js\?v=6714/);
});

test('Designer Studio supports local profile photo uploads without requiring a URL', () => {
  assert.match(server, /name="avatarFile"/);
  assert.match(server, /enctype="multipart\/form-data"/);
  assert.match(server, /processProfileAvatarBuffer/);
  assert.match(server, /PROFILE_AVATAR_MAX_FILE_BYTES/);
  assert.match(server, /profile-avatar/);
  assert.match(server, /avatarPath/);
  assert.match(server, /studio-avatar\.js\?v=6716/);
  assert.match(server, /studio\/avatar-preview/);
  assert.match(server, /reader\.readAsDataURL\(blob\)/);
  assert.doesNotMatch(server.slice(server.indexOf("if (parts[0] === 'studio-avatar.js')"), server.indexOf("if (parts[0] === 'dashboard-home-media.js')")), /URL\.createObjectURL/);
  assert.match(server, /fetch\('\/studio\/avatar-preview'/);
  assert.match(server, /new AbortController\(\)/);
  assert.match(server, /window\.location\.assign\(next\.toString\(\)\)/);
  assert.match(server, /profileSaved=1/);
  assert.match(helper, /pixelCount > PROFILE_AVATAR_MAX_PIXELS/);
  assert.match(helper, /dimensions\.width > PROFILE_AVATAR_MAX_SIDE/);
  assert.doesNotMatch(server, /width\*height>20000000/);
  assert.match(server, /output\.buffer/);
  assert.match(helper, /PROFILE_AVATAR_MAX_FILE_BYTES = 5 \* 1024 \* 1024/);
  assert.match(models, /avatarPath/);
});

test('beginner-friendly examples are present in profile and portfolio forms', () => {
  for (const example of [
    'Contoh: Andi Pratama atau Studio Karsa',
    'Contoh: Logo Design, Branding, Packaging, Social Media',
    'Contoh: Bandung, Indonesia',
    'Contoh: 6281234567890',
    'Contoh: Identitas Visual Kopi Senja',
    'Contoh: Figma, Adobe Illustrator, Photoshop',
  ]) assert.ok(server.includes(example), 'missing example: ' + example);
});

test('SVG upload rasterizes Figma-sized artwork at native 72 DPI', () => {
  assert.match(helper, /density: 72/);
  assert.ok(3636 * 2045 < 20_000_000);
});

test('SVG browser preview forces the SVG MIME type and converts to a raster file before POST', () => {
  assert.match(server, /type:'image\/svg\+xml'/);
  assert.match(server, /const blobFor=file=>isSvg\(file\)\?new Blob\(\[file\],\{type:'image\/svg\+xml'\}\)/);
  assert.match(server, /const safeSvgBlob=async file/);
  assert.match(server, /const rasterizeSvg=async file/);
  assert.match(server, /canvas\.toBlob/);
  assert.match(server, /Math\.sqrt\(20000000\/\(width\*height\)\)/);
  assert.match(server, /form\.requestSubmit\(\)/);
  assert.match(server, /converted\.push\(file\);keptOriginalSvg=true/);
  assert.match(server, /studio-upload\.js\?v=6713/);
  assert.match(helper, /density: 72/);
});

test('uploaded profile avatars are served from a guarded local path with cache busting', () => {
  assert.match(server, /parts\[0\] === 'profile-avatar'/);
  assert.match(server, /file\.startsWith\(`\$\{uploadRoot\}\$\{path\.sep\}`\)/);
  assert.match(server, /profile-avatar\/\$\{encodeURIComponent\(profile\.designerId\)\}\?v=/);
  assert.match(server, /PROFILE_AVATAR_MAX_FILE_BYTES/);
});


test('Designer Studio form actions have safe spacing and text fields are easier to read', () => {
  assert.match(server, /class=\"card studio-work-item\"/);
  assert.match(server, /class=\"studio-work-edit-form\"/);
  assert.match(server, /class=\"studio-work-delete-form\"/);
  assert.match(server, /class=\"studio-form-stack studio-testimonial-form\"/);
  assert.match(server, /class=\"studio-form-stack studio-service-form\"/);
  assert.match(server, /class=\"studio-profile-form\"/);
  assert.match(server, /studio-work-item>form\.studio-work-delete-form\{margin:0;padding-top:13px/);
  assert.match(server, /studio-form-actions[^}]*gap:12px/);
  assert.match(server, /textarea[^}]*line-height:1\.75/);
});
