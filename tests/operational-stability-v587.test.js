import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const root = new URL('../', import.meta.url);
const bot = fs.readFileSync(new URL('../index.js', import.meta.url), 'utf8');
const designer = fs.readFileSync(new URL('../features/design-marketplace/index.js', import.meta.url), 'utf8');
const profileSchema = fs.readFileSync(new URL('../models/design-marketplace.js', import.meta.url), 'utf8');
const profileFormatter = fs.readFileSync(new URL('../features/design-marketplace/services/marketplace-service.js', import.meta.url), 'utf8');
const website = fs.readFileSync(new URL('../portfolio-website/server.js', import.meta.url), 'utf8');
const rootPackage = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const rootLock = JSON.parse(fs.readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8'));
const websitePackage = JSON.parse(fs.readFileSync(new URL('../portfolio-website/package.json', import.meta.url), 'utf8'));

test('v6.5 release advances bot and website metadata plus public cache epoch', () => {
  assert.equal(rootPackage.version, '6.7.13');
  assert.equal(rootLock.version, '6.7.13');
  assert.equal(rootLock.packages[''].version, '6.7.13');
  assert.equal(websitePackage.version, '3.60.0');
  assert.ok(website.includes("version: '6.7.13'"));
  assert.ok(website.includes("const CACHE='pir-visuals-public-v47'"));
  assert.ok(website.includes('/public-ui.js?v=6714'));
});

test('database backup validates BSON output before creating a manifest', () => {
  assert.ok(bot.includes("execFileAsync('mongodump'"));
  assert.ok(bot.includes('if (!databaseEntries.length)'));
  assert.ok(bot.includes("file.endsWith('.bson')"));
  assert.ok(bot.includes("'backup-manifest.json'"));
  assert.ok(bot.includes("{ flag: 'wx', mode: 0o600 }"));
});

test('backup retention is bounded, safe and skips overlapping jobs', () => {
  assert.ok(bot.includes('BACKUP_RETENTION_DAYS'));
  assert.ok(bot.includes('backupInProgress'));
  assert.ok(bot.includes("console.log('[BACKUP] Backup berhasil:'"));
  assert.ok(bot.includes('fs.promises.rm(candidate'));
  assert.ok(bot.includes('void createDatabaseBackup()'));
  assert.ok(bot.includes("{ name: 'baileys-auth'"));
  assert.ok(bot.includes("{ name: 'portfolio-media'"));
  assert.ok(bot.includes("BACKUP_INCLUDE_LOCAL_STATE || 'false'"));
});

test('bot health endpoint is loopback-only and distinguishes liveness from readiness', () => {
  assert.ok(bot.includes("import http from 'node:http'"));
  assert.ok(bot.includes('const healthPort = Number(process.env.BOT_HEALTH_PORT || 3091)'));
  assert.ok(bot.includes("['127.0.0.1', '::1', 'localhost'].includes(healthHost)"));
  assert.ok(bot.includes("['/health', '/ready'].includes(pathname)"));
  assert.ok(bot.includes("const ready = dbReady && whatsappConnectionState === 'open'"));
  assert.ok(bot.includes("database: dbReady ? 'connected' : 'disconnected'"));
  assert.ok(bot.includes('if (connection) whatsappConnectionState = connection'));
});

test('Designer Studio activation token is issued only from the profile owner private chat', () => {
  assert.ok(designer.includes('async function sendDesignerDashboardSetupToken(ctx)'));
  assert.ok(designer.includes('DesignerProfile.findOne({ ownerJid: ctx.userJid })'));
  assert.ok(designer.includes('const setupTokenHash = createHash'));
  assert.ok(designer.includes('20 * 60 * 1000'));
  assert.ok(designer.includes("if (action === 'setup') return sendDesignerDashboardSetupToken(ctx)"));
  assert.ok(designer.includes("endsWith('@g.us')"));
  assert.ok(website.includes('setupTokenHash: account.setupTokenHash'));
  assert.ok(website.includes("setupTokenHash: ''"));
});

test('WhatsApp dashboard OTP is cryptographically generated, hashed and short-lived', () => {
  assert.ok(designer.includes('randomInt as cryptoRandomInt'));
  assert.ok(designer.includes('cryptoRandomInt(100000, 1000000)'));
  assert.ok(designer.includes("otpHash = createHash('sha256')"));
  assert.ok(designer.includes('Date.now() + 5 * 60 * 1000'));
  assert.ok(designer.includes("if (action === 'otp') return sendDesignerDashboardOtp(ctx)"));
});

test('designer profile supports public verification, featuring, language and watermark preferences', () => {
  for (const field of ['isVerified', 'isFeatured', 'watermarkEnabled']) {
    assert.ok(profileSchema.includes(`${field}: { type: Boolean`), `missing ${field}`);
  }
  assert.ok(profileSchema.includes("language: { type: String, enum: ['id', 'en']"));
  assert.ok(profileSchema.includes('softwareSkills'));
  assert.ok(profileFormatter.includes('PROFIL DITINJAU PIR'));
  assert.ok(profileFormatter.includes('FEATURED DESIGNER'));
});

test('portfolio management commands expose public link, QR, analytics, language and watermark controls', () => {
  for (const command of ["sub === 'website'", "sub === 'qr'", "sub === 'analytics'", "sub === 'bahasa'", "sub === 'watermark'", "sub === 'verified'", "sub === 'popular'"]) {
    assert.ok(designer.includes(command), `missing command ${command}`);
  }
  assert.ok(designer.includes('ctx.isBotOwner(ctx.userJid, ctx.senderIdentityAliases)'));
  assert.ok(designer.includes("const field = sub === 'verified' ? 'isVerified' : 'isFeatured'"));
});

test('public designer route is explicit and optional watermark is applied at media delivery', () => {
  assert.ok(website.includes("parts[0] === 'designer' && Boolean(parts[1])"));
  assert.ok(website.includes("parts[0] !== 'designer'"));
  assert.ok(website.includes("parts[0] === 'media'"));
  assert.ok(website.includes("select('displayName watermarkEnabled')"));
  assert.ok(website.includes('ownerProfile?.watermarkEnabled'));
  assert.ok(website.includes("parts[0] === 'qr'"));
  assert.ok(website.includes("parts[0] === 'contact'"));
});

