import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const botModels = fs.readFileSync(path.join(root, 'models/design-marketplace.js'), 'utf8');
const botFeature = fs.readFileSync(path.join(root, 'features/design-marketplace/index.js'), 'utf8');
const websiteModels = fs.readFileSync(path.join(root, 'portfolio-website/models.js'), 'utf8');
const websiteServer = fs.readFileSync(path.join(root, 'portfolio-website/server.js'), 'utf8');

test('website and WhatsApp share designer profile, dashboard auth and pending signup collections', () => {
  assert.match(botModels, /mongoose\.model\('DesignerProfile'/);
  assert.match(websiteModels, /collection: 'designerprofiles'/);
  assert.match(botModels, /collection: 'designerdashboardauth'/);
  assert.match(websiteModels, /collection: 'designerdashboardauth'/);
  assert.match(botModels, /collection: 'designersignuprequests'/);
  assert.match(websiteModels, /collection: 'designersignuprequests'/);
});

test('website-first registration is verified by the WhatsApp account owner', () => {
  assert.match(websiteServer, /DesignerSignupRequest\.create/);
  assert.match(websiteServer, /phoneE164/);
  assert.match(websiteServer, /tokenHash: hashToken\(token\)/);
  assert.match(botFeature, /async function linkWebsiteSignup/);
  assert.match(botFeature, /dashboardPhoneDigits\(ctx\)/);
  assert.match(botFeature, /phoneDigits\.includes/);
  assert.match(botFeature, /DesignerDashboardAuth\.create/);
});

test('WhatsApp profile registration is immediately visible on the shared website database', () => {
  assert.match(botFeature, /DesignerProfile\.create/);
  assert.match(websiteModels, /collection: 'designerprofiles'/);
});

test('WhatsApp portfolio upload accepts SVG and uses the shared safe media pipeline', () => {
  assert.match(botFeature, /async function handleItemWizardMessage/);
  assert.match(botFeature, /processPortfolioImageBuffer/);
  assert.match(botFeature, /PORTFOLIO_MAX_FILE_BYTES/);
  assert.match(botFeature, /image\/svg\+xml/);
});

test('WhatsApp OTP is private, hashed and expires after five minutes', () => {
  assert.match(botFeature, /async function sendDesignerDashboardOtp/);
  assert.match(botFeature, /ctx\.isGroup/);
  assert.match(botFeature, /otpHash = createHash\('sha256'\)/);
  assert.match(botFeature, /Date\.now\(\) \+ 5 \* 60 \* 1000/);
});

test('website uses the bot project root for shared media storage and environment', () => {
  assert.match(websiteServer, /const APP_ROOT = path\.resolve/);
  assert.match(websiteServer, /dotenv\.config\(\{ path: path\.join\(APP_ROOT, '\.env'\) \}\)/);
  assert.match(websiteServer, /process\.env\.BOT_DATA_ROOT \|\| APP_ROOT/);
});


test('signup expiry field has a single TTL index declaration in bot model', () => {
  assert.match(botModels, /expiresAt:\s*\{\s*type:\s*Date,\s*required:\s*true\s*\}/);
  assert.match(botModels, /DesignerSignupRequestSchema\.index\(\{\s*expiresAt:\s*1\s*\},\s*\{\s*expireAfterSeconds:\s*86400\s*\}\)/);
});


test('bot and website share both WhatsApp contact field names without losing either alias', () => {
  assert.match(botModels, /publicWhatsApp:/);
  assert.match(botModels, /contactPhone:/);
  assert.match(botModels, /strict:\s*false/);
  assert.match(websiteModels, /publicWhatsApp:/);
  assert.match(websiteModels, /contactPhone:\s*String/);
  assert.match(botFeature, /wizard\.draft\.contactPhone = phone/);
  assert.match(botFeature, /profile\.contactPhone = phone/);
  assert.match(websiteServer, /publicWhatsApp:\s*\/\^\\d\{8,15\}\$\/\.test\(phone\)/);
  assert.match(websiteServer, /function getPublicContactPhone/);
  assert.match(websiteServer, /location:\s*`https:\/\/wa\.me\/\$\{phone\}/);
  assert.match(websiteServer, /parts\[0\] === 'out'/);
  assert.match(websiteServer, /direct-contact:\$\{designerId\}/);
  assert.match(websiteServer, /href="\/out\/\$\{encodeURIComponent\(profile\.designerId\)\}"/);
});

test('website notifications can be read only in the linked designer private chat', () => {
  assert.match(botModels, /collection:\s*'designernotifications'/);
  assert.match(websiteModels, /collection:\s*'designernotifications'/);
  assert.match(botFeature, /async function handlePortfolioNotifications/);
  assert.match(botFeature, /isPrivateNotificationContext\(ctx\)/);
  assert.match(botFeature, /DesignerNotification\.find\(filter\)/);
  assert.match(botFeature, /DesignerNotification\.updateMany/);
  assert.match(botFeature, /'notifikasi', 'notifications', 'notification', 'notif'/);
});

test('bot analytics schema retains website daily portfolio-view metrics', () => {
  const analyticsModel = fs.readFileSync(path.join(root, 'models/designer-growth.js'), 'utf8');
  assert.match(analyticsModel, /portfolioViews:\s*\{\s*type:\s*Number/);
  assert.match(analyticsModel, /strict:\s*false/);
});


test('WhatsApp Studio reads website service, collection, testimonial, availability, lead and project summaries', () => {
  const bridgeModels = fs.readFileSync(path.join(root, 'models/website-integration.js'), 'utf8');
  const marketplaceModels = fs.readFileSync(path.join(root, 'models/design-marketplace.js'), 'utf8');
  assert.match(marketplaceModels, /collection:\s*'designservices'/);
  for (const collection of ['portfoliocollections', 'designertestimonials', 'designerleads', 'designeravailability', 'clientprojects']) {
    assert.ok(bridgeModels.includes(collection), `missing shared website collection ${collection}`);
  }
  for (const query of [
    'DesignService.countDocuments',
    'PortfolioCollection.countDocuments',
    'DesignerTestimonial.countDocuments',
    'DesignerAvailability.countDocuments',
    'DesignerLead.countDocuments',
    'ClientProject.countDocuments',
  ]) assert.ok(botFeature.includes(query), `missing website summary query ${query}`);
  assert.match(botFeature, /Detail klien, email, nomor pribadi, brief, dan percakapan tidak ditampilkan/);
  assert.match(botFeature, /Ringkasan Designer Studio hanya dapat dibaca melalui chat pribadi/);
  assert.match(botFeature, /Analytics Designer Studio hanya dapat dibaca melalui chat pribadi/);
});
