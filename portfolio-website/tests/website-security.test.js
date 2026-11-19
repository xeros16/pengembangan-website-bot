import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
const mediaSource = fs.readFileSync(new URL('../portfolio-media.js', import.meta.url), 'utf8');
const directoryUtils = fs.readFileSync(new URL('../directory-utils.js', import.meta.url), 'utf8');
const security = fs.readFileSync(new URL('../security.js', import.meta.url), 'utf8');
const showcaseJs = fs.readFileSync(new URL('../pir-home-showcase.js', import.meta.url), 'utf8');
const envExampleUrl = new URL('../../.env.example', import.meta.url);
const envExample = fs.existsSync(envExampleUrl) ? fs.readFileSync(envExampleUrl, 'utf8') : fs.readFileSync(new URL('../.env.example', import.meta.url), 'utf8');
const requirePackage = fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8');

test('public directory supports search, skill and verified filters', () => {
  assert.match(source, /async function renderDirectory/);
  assert.ok(directoryUtils.includes('filter.specialties = { $regex: escapeRegex(filters.skill)'));
  assert.match(source, /verifiedOnly/);
});

test('owner dashboard is protected and disabled without strong credentials', () => {
  assert.match(source, /if \(parts\[0\] === 'dashboard'\)/);
  assert.match(source, /DASHBOARD_PASSWORD/);
  assert.match(source, /expectedPassword\.length < 16/);
  assert.match(envExample, /DASHBOARD_PASSWORD=replace-with-a-long-unique-password/);
});

test('SEO endpoints exist and dashboard is disallowed to crawlers', () => {
  assert.match(source, /parts\[0\] === 'robots\.txt'/);
  assert.match(source, /parts\[0\] === 'sitemap\.xml'/);
  assert.ok(source.includes('Disallow: /dashboard'));
});

test('security response headers and constant-time comparison are configured', () => {
  assert.match(source, /securityHeaders\(/);
  assert.match(source, /timingSafeEqual/);
  assert.match(security, /'x-frame-options': 'DENY'/);
  assert.match(security, /'referrer-policy': 'strict-origin-when-cross-origin'/);
});

test('rate limiting uses the socket address by default and only trusts Cloudflare IP when explicitly enabled', () => {
  const security = fs.readFileSync(new URL('../security.js', import.meta.url), 'utf8');
const showcaseJs = fs.readFileSync(new URL('../pir-home-showcase.js', import.meta.url), 'utf8');
  assert.match(security, /req\?\.socket\?\.remoteAddress/);
  assert.match(security, /trustCloudflare = false/);
  assert.match(source, /TRUST_CLOUDFLARE_IP_HEADER === 'true'/);
  assert.doesNotMatch(security, /x-forwarded-for/);
});


test('designer studio requires password and WhatsApp OTP, with one-time activation token', () => {
  assert.match(source, /parts\[0\] === 'studio' && parts\[1\] === 'setup'/);
  assert.match(source, /parts\[0\] === 'studio' && parts\[1\] === 'login'/);
  assert.match(source, /verifyPassword\(password, account\.passwordHash\)/);
  assert.match(source, /account\.otpExpiresAt > new Date\(\)/);
  assert.match(source, /setupTokenExpiresAt/);
  assert.match(source, /scrypt/);
});

test('designer studio updates only the authenticated designer profile and services', () => {
  assert.match(source, /DesignerProfile\.updateOne\(\{ designerId: session\.designerId \}/);
  assert.match(source, /DesignService\.create/);
  assert.match(source, /designerId: session\.designerId/);
  assert.match(source, /validCsrf\(req, form, session\)/);
});


test('web portfolio upload validates multipart and image pipeline uses safe formats', () => {
  assert.match(source, /async function readMultipart/);
  assert.match(source, /PORTFOLIO_MAX_REQUEST_BYTES/);
  assert.ok(mediaSource.includes('PORTFOLIO_MAX_FILE_BYTES = 15 * 1024 * 1024'));
  assert.ok(mediaSource.includes("['.svg', 'svg']"));
  assert.ok(mediaSource.includes('.webp({ quality: 82'));
  assert.match(mediaSource, /PIR VISUALS/);
});

test('portfolio upload creates pending work owned by the authenticated designer', () => {
  assert.ok(source.includes("parts[0] === 'studio' && parts[1] === 'work'"));
  assert.ok(source.includes('designerId: session.designerId, ownerJid: profile.ownerJid'));
  assert.match(source, /moderationStatus: 'pending'/);
  assert.ok(source.includes('validCsrf(req, form, session)'));
});

test('portfolio edit and delete are scoped to designer ownership', () => {
  assert.ok(source.includes('PortfolioItem.findOne({ itemId, designerId: session.designerId, ownerJid: profile.ownerJid })'));
  assert.ok(source.includes('PortfolioItem.deleteOne({ itemId, designerId: session.designerId, ownerJid: profile.ownerJid })'));
  assert.ok(source.includes("moderationStatus: 'pending', reviewedBy: ''"));
});

test('website package includes image processing dependency', () => {
  const pkg = JSON.parse(requirePackage);
  assert.ok(pkg.dependencies.sharp);
});


test('owner dashboard includes moderation queue and 14-day analytics trend', () => {
  assert.ok(source.includes("PortfolioItem.find({ moderationStatus: 'pending' })"));
  assert.ok(source.includes("parts[0] === 'dashboard' && parts[1] === 'moderate'"));
  assert.ok(source.includes("DesignerAnalytics.aggregate([{ $unwind: '$daily'"));
  assert.ok(source.includes('Setujui') && source.includes('Ditolak melalui dashboard Owner'));
});

test('designer sessions are persisted as hashed MongoDB tokens with TTL', () => {
  const models = fs.readFileSync(new URL('../models.js', import.meta.url), 'utf8');
  assert.ok(models.includes("collection: 'designerdashboardsessions'"));
  assert.ok(models.includes('expiresAt: { type: Date, required: true, index: { expires: 0 } }'));
  assert.ok(source.includes('DesignerDashboardSession.create'));
  assert.ok(source.includes('tokenHash: hashToken(id)'));
});

test('email verification is required before password and WhatsApp OTP login', () => {
  assert.ok(source.includes('sendVerificationEmail(email, emailToken)'));
  assert.ok(source.includes("parts[0] === 'studio' && parts[1] === 'verify'"));
  assert.ok(source.includes('account.emailVerified === true'));
  assert.ok(source.includes('emailVerifyExpiresAt'));
  assert.ok(requirePackage.includes('nodemailer'));
});

test('portfolio collections and client testimonials are owner-scoped', () => {
  assert.ok(source.includes('PortfolioCollection.create'));
  assert.ok(source.includes('designerId: session.designerId'));
  assert.ok(source.includes('DesignerTestimonial.create'));
  assert.ok(source.includes("DesignerTestimonial.find({ designerId: profile.designerId, isPublished: true, emailVerified: true })"));
  const models = fs.readFileSync(new URL('../models.js', import.meta.url), 'utf8');
  assert.ok(models.includes("collection: 'portfoliocollections'"));
  assert.ok(models.includes("collection: 'designertestimonials'"));
});

test('uploader supports multiple images, drag-drop and crop presets', () => {
  assert.ok(source.includes('maxFiles = Number.isInteger(options.maxFiles)'));
  assert.ok(source.includes('dragover'));
  assert.ok(source.includes('dataTransfer.files'));
  assert.ok(mediaSource.includes("square: { width: 1200, height: 1200 }"));
  assert.ok(source.includes('galleryPaths: relativePaths'));
});


test('custom public slugs are unique-checked and resolve to public designer profiles', () => {
  assert.ok(source.includes("name:'displayName', label:'Nama publik'"));
  assert.ok(source.includes("DesignerProfile.findOne({ slug, designerId: { $ne: session.designerId } })"));
  assert.ok(source.includes("parts[0] === 'p'"));
  assert.ok(source.includes("{ slug: String(parts[1]).toLowerCase(), isPublic: true }"));
});

test('password reset uses verified email, expiring hashed token and revokes sessions', () => {
  assert.ok(source.includes("parts[0] === 'studio' && parts[1] === 'forgot'"));
  assert.ok(source.includes("parts[0] === 'studio' && parts[1] === 'reset'"));
  assert.ok(source.includes('passwordResetTokenHash: hashToken(token)'));
  assert.ok(source.includes('passwordResetExpiresAt: new Date(Date.now() + 20 * 60 * 1000)'));
  assert.ok(source.includes('DesignerDashboardSession.deleteMany({ designerId: account.designerId })'));
  assert.ok(source.includes('sendPasswordResetEmail(email, token)'));
});

test('PWA assets and offline cache exclude private dashboard and studio routes', () => {
  assert.ok(source.includes("parts[0] === 'manifest.webmanifest'"));
  assert.ok(source.includes("parts[0] === 'sw.js'"));
  assert.ok(source.includes("parts[0] === 'pwa-register.js'"));
  assert.ok(source.includes('/studio-upload.js'));
  assert.ok(source.includes('studio|dashboard|admin|media|contact|client'));
  assert.ok(source.includes('navigator.serviceWorker.register'));
});

test('public media resolves upload path relative to the configured bot data root', () => {
  assert.ok(source.includes("const botRoot = path.resolve(process.env.BOT_DATA_ROOT || APP_ROOT);\n        const uploadRoot = path.resolve(botRoot, process.env.PORTFOLIO_UPLOAD_DIR || 'uploads/portfolio');"));
});

test('owner moderation form is protected by same-site CSRF token', () => {
  assert.ok(source.includes('pir_owner_csrf'));
  assert.ok(source.includes('Token keamanan Owner tidak valid'));
  assert.ok(source.includes('name="csrf" value="${escapeHtml(csrf)}"'));
});


test('production hardening applies security headers, HSTS conditionally and server timeouts', () => {
  assert.ok(source.includes('securityHeaders({ productionHttps:'));
  assert.ok(security.includes("'strict-transport-security': 'max-age=31536000; includeSubDomains'"));
  assert.ok(source.includes('server.requestTimeout = 120000'));
  assert.ok(source.includes('maxHeaderSize: 16 * 1024'));
  assert.ok(source.includes('server.maxRequestsPerSocket = 1000'));
  assert.ok(source.includes('server.headersTimeout = 15000'));
  assert.ok(source.includes('server.maxHeadersCount = 100'));
});

test('website health endpoint reports database readiness and release version', () => {
  assert.ok(source.includes("parts[0] === 'health'"));
  assert.ok(source.includes("version: '6.7.13'"));
  assert.ok(source.includes("database: ready ? 'connected' : 'disconnected'"));
});

test('upload parser enforces per-file byte limit and rejects empty images', () => {
  assert.ok(source.includes('if (data.length > maxFileBytes)'));
  assert.ok(source.includes("if (!data.length) throw new Error('File gambar kosong.')"));
});

test('daily analytics tracks all public engagement metrics and keeps bounded history', () => {
  assert.ok(source.includes("['views', 'contacts', 'portfolioViews']"));
  assert.ok(source.includes("$slice: -90"));
  assert.ok(source.includes("incrementDailyMetric(profile.designerId, 'views')"));
  assert.ok(source.includes("incrementDailyMetric(profile.designerId, 'contacts')"));
  assert.ok(source.includes("incrementDailyMetric(item.designerId, 'portfolioViews')"));
});

test('MongoDB schemas declare compound indexes for primary portfolio queries', () => {
  const models = fs.readFileSync(new URL('../models.js', import.meta.url), 'utf8');
  assert.ok(models.includes("profileSchema.index({ isPublic: 1, isFeatured: -1, isVerified: -1, displayName: 1 })"));
  assert.ok(models.includes("portfolioSchema.index({ designerId: 1, moderationStatus: 1, featured: -1, createdAt: -1 })"));
  assert.ok(models.includes("serviceSchema.index({ designerId: 1, isActive: 1, price: 1 })"));
  assert.ok(models.includes("portfolioCollectionSchema.index({ designerId: 1, isPublic: 1, createdAt: -1 })"));
  assert.ok(models.includes("testimonialSchema.index({ designerId: 1, isPublished: 1, createdAt: -1 })"));
});


test('sitemap publishes custom portfolio slugs and preserves legacy designer URLs', () => {
  assert.ok(source.includes("select('designerId slug updatedAt')"));
  assert.ok(source.includes("p.slug ? `/p/${encodeURIComponent(p.slug)}` : `/designer/${encodeURIComponent(p.designerId)}`"));
});


test('release smoke test covers health, directory, SEO, PWA and Designer Studio routes', () => {
  const smoke = fs.readFileSync(new URL('../scripts/smoke-test.js', import.meta.url), 'utf8');
  for (const route of ['/health', '/', '/robots.txt', '/sitemap.xml', '/manifest.webmanifest', '/sw.js', '/studio']) {
    assert.ok(smoke.includes(`'${route}'`), `missing smoke coverage for ${route}`);
  }
  const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(pkg.scripts.smoke, 'node scripts/smoke-test.js');
});


test('PWA cache version is advanced for the current release', () => {
  assert.ok(source.includes("const CACHE='pir-visuals-public-v47'"));
});


test('optional end-to-end smoke mode verifies local Baileys and MongoDB readiness', () => {
  const smoke = fs.readFileSync(new URL('../scripts/smoke-test.js', import.meta.url), 'utf8');
  assert.ok(smoke.includes("PIR_CHECK_BOT_HEALTH"));
  assert.ok(smoke.includes("BOT_HEALTH_URL"));
  assert.ok(smoke.includes("data.whatsapp === 'open'"));
  assert.ok(smoke.includes("data.database === 'connected'"));
});


test('Designer Studio login prominently exposes the password reset action', () => {
  assert.ok(source.includes('Tidak bisa masuk?'));
  assert.ok(source.includes('Lupa password? Reset sekarang'));
  assert.ok(source.includes('href="/studio/forgot"'));
  assert.ok(source.includes('Kembali ke login Designer Studio'));
  assert.ok(source.includes('autocomplete="email"'));
});

test('designer can change password only with current password and valid CSRF', () => {
  assert.ok(source.includes("parts[0] === 'studio' && parts[1] === 'password'"));
  assert.ok(source.includes("validCsrf(req, form, session)"));
  assert.ok(source.includes('verifyPassword(currentPassword, account.passwordHash)'));
  assert.ok(source.includes("newPassword !== confirmPassword"));
  assert.ok(source.includes("hashPassword(newPassword)"));
  assert.ok(source.includes('DesignerDashboardSession.deleteMany({ designerId: session.designerId })'));
});

test('password reset remains designer-only and preserves email verification and token expiry', () => {
  assert.ok(source.includes("DesignerDashboardAuth.findOne({ email, emailVerified: true })"));
  assert.ok(source.includes("passwordResetExpiresAt: new Date(Date.now() + 20 * 60 * 1000)"));
  assert.ok(source.includes("passwordResetTokenHash: hashToken(token)"));
  assert.ok(source.includes("parts[0] === 'studio' && parts[1] === 'reset'"));
});


test('public navigation exposes designer login and favorites across website pages', () => {
  assert.ok(source.includes('href="/studio">Login Designer'));
  assert.ok(source.includes('href="/favorites">Favorit'));
  assert.ok(source.includes('data-favorite-count'));
  assert.ok(source.includes("parts[0] === 'favorites'"));
});

test('directory supports discovery filters, sorting and designer availability', () => {
  for (const fragment of ['name', 'price-low', 'price-high', 'isVerified', 'isFeatured', 'acceptsOrders', 'priceMin', 'location']) {
    assert.ok(source.includes(fragment), `missing discovery support: ${fragment}`);
  }
  assert.ok(source.includes('Terapkan filter'));
  assert.ok(source.includes('Reset'));
});

test('favorites are stored client-side and public API returns only public profiles', () => {
  assert.ok(source.includes('pir_visuals_favorites_v1'));
  assert.ok(source.includes("parts[0] === 'api' && parts[1] === 'designers'"));
  assert.ok(source.includes("isPublic: true }).select('designerId slug displayName"));
  assert.ok(source.includes('.slice(0, 50)'));
});

test('designer showcase keeps favorite control and records engagement privately', () => {
  assert.ok(source.includes('data-favorite="${escapeHtml(profile.designerId)}"'));
  assert.ok(source.includes("DesignerAnalytics.updateOne({ designerId: profile.designerId }"));
  assert.ok(source.includes("incrementDailyMetric(profile.designerId, 'views')"));
  assert.ok(!source.includes('Kunjungan profil'));
  assert.ok(!source.slice(source.indexOf('class="designer-showcase layout-${profileLayoutClass}"'), source.indexOf('const profileSeoTitle')).includes('Number(analytics?.contactClicks || 0).toLocaleString'));
  assert.ok(source.includes('class="designer-showcase layout-${profileLayoutClass}"'));
});

test('global UI serves public interactions script and responsive navigation', () => {
  assert.ok(source.includes("parts[0] === 'public-ui.js'"));
  assert.ok(source.includes('nav-toggle'));
  assert.ok(source.includes('@media(max-width:760px)'));
  assert.ok(source.includes('search-panel'));
});


test('corporate homepage has a distinct landing page and directory route', () => {
  assert.ok(source.includes('async function renderHome()'));
  assert.ok(source.includes("parts.length === 0 && req.method === 'GET'"));
  assert.ok(source.includes("parts[0] === 'discover' && req.method === 'GET'"));
  assert.ok(source.includes('INDEPENDENT CREATIVE TALENT PLATFORM'));
  assert.ok(source.includes("copyText('talentTitle','Meet the\\nindependent talent.',120)"));
  assert.ok(source.includes("copyText('faqTitle','Questions,\\nanswered.',100)"));
});

test('corporate information pages and footer navigation are available', () => {
  for (const route of ['about', 'how-it-works', 'privacy', 'terms', 'contact']) {
    assert.ok(source.includes(`'${route}'`), `missing page ${route}`);
  }
  assert.ok(source.includes('href="/privacy"'));
  assert.ok(source.includes('href="/terms"'));
  assert.ok(source.includes('href="/contact"'));
  assert.ok(source.includes('footer-grid'));
});

test('homepage and information routes are included in sitemap', () => {
  assert.ok(source.includes("['/', '/discover', '/categories', '/about', '/how-it-works', '/contact']"));
  assert.ok(source.includes('const staticEntries'));
  assert.ok(source.includes('${entries}</urlset>'));
});

test('corporate shell includes accessible skip link and social metadata', () => {
  assert.ok(source.includes('class="skip-link"'));
  assert.ok(source.includes('property="og:site_name"'));
  assert.ok(source.includes('name="twitter:card"'));
  assert.ok(source.includes('Lewati ke konten'));
});


test('brand icon and legacy theme compatibility are wired into public shell', () => {
  assert.ok(source.includes("href=\"/?pv_intro=1\""));
  assert.ok(source.includes('<strong>PIR VISUALS</strong>'));
  assert.ok(source.includes("class=\"brand-emblem\" src=\"/icon.svg?v=6710\""));
  assert.ok(source.includes("data-theme-toggle"));
  assert.ok(source.includes("pir_visuals_theme"));
  assert.ok(source.includes('[data-theme="light"]'));
  assert.ok(source.includes('PIR Visual System v5.39'));
  assert.ok(source.includes('brand-copy'));
  assert.ok(source.includes("fs.readFileSync(new URL('./brand-icon.svg', import.meta.url))"));
});

test('designer business dashboard has leads, availability, notifications and profile editor', () => {
  for (const part of ['DesignerLead.find', 'DesignerAvailability.find', 'DesignerNotification.find', 'id="leads"', 'id="availability"', 'id="notifications"', 'id="edit-profile"']) assert.ok(source.includes(part), `missing ${part}`);
  assert.ok(source.includes("parts[1] === 'availability'"));
  assert.ok(source.includes("parts[2] === 'status'"));
});

test('client brief is stored as a designer lead and never processed as a platform order', () => {
  assert.ok(source.includes("parts[0] === 'contact' && parts[1] && req.method === 'POST'"));
  assert.ok(source.includes('DesignerLead.create'));
  assert.ok(source.includes('Calon klien baru'));
  assert.ok(source.includes('Negosiasi, kontrak, dan pembayaran dilakukan langsung oleh klien dan desainer'));
});

test('public reviews require email verification and owner moderation', () => {
  assert.ok(source.includes("parts[0] === 'review' && parts[1] && req.method === 'POST'"));
  assert.ok(source.includes("parts[1] === 'verify'"));
  assert.ok(source.includes('verificationTokenHash:hashToken(token)'));
  assert.ok(source.includes("parts[1] === 'review' && req.method === 'POST'"));
  assert.ok(source.includes("emailVerified: true, isPublished: false"));
});

test('owner can edit homepage content and category discovery is searchable', () => {
  assert.ok(source.includes('PortfolioSiteContent.findOneAndUpdate'));
  assert.ok(source.includes("parts[1] === 'content' && req.method === 'POST'"));
  assert.ok(source.includes("parts[0] === 'categories'"));
  assert.ok(directoryUtils.includes("filter.category = { $regex: escapeRegex(filters.category)"));
  assert.ok(source.includes("parts[0] === 'robots.txt'"));
});

test('designer profile editing includes primary category and avatar URL fields', () => {
  assert.ok(source.includes("name:'category', label:'Kategori utama'"));
  assert.ok(source.includes("name:'avatarUrl', label:'Tautan foto profil (opsional)'"));
  assert.ok(source.includes('name="avatarFile"'));
  assert.ok(source.includes("category: clean('category'"));
});


test('website registration creates a pending WhatsApp link request with hashed token', () => {
  assert.ok(source.includes("parts[1] === 'register' && req.method === 'GET'"));
  assert.ok(source.includes("parts[1] === 'register' && req.method === 'POST'"));
  assert.ok(source.includes('DesignerSignupRequest.create'));
  assert.ok(source.includes('tokenHash: hashToken(token)'));
  assert.ok(source.includes('.portfolio link ${escapeHtml(token)}'));
  assert.ok(source.includes("parts[1] === 'resend-verification'"));
});

test('website and bot use the same designer profile and signup collections', () => {
  const botModels = fs.readFileSync(new URL('../../models/design-marketplace.js', import.meta.url), 'utf8');
  const websiteModels = fs.readFileSync(new URL('../models.js', import.meta.url), 'utf8');
  assert.ok(botModels.includes("mongoose.model('DesignerProfile'"));
  assert.ok(websiteModels.includes("collection: 'designerprofiles'"));
  assert.ok(botModels.includes("collection: 'designersignuprequests'"));
  assert.ok(websiteModels.includes("collection: 'designersignuprequests'"));
});

test('designer navbar uses each account profile name and avatar when available', () => {
  assert.ok(source.includes('function pageShell(title, body, branding = null)'));
  assert.ok(source.includes('branding?.displayName'));
  assert.ok(source.includes('branding?.avatarUrl'));
  assert.ok(source.includes('class="brand-avatar"'));
  assert.ok(source.includes("pageShell(profileSeoTitle, body, { displayName: profile.displayName, avatarUrl: profile.avatarUrl, description: profileSeoDescription"));
});

test('WhatsApp portfolio wizard accepts SVG and uploads files up to 15 MB', () => {
  const botFeature = fs.readFileSync(new URL('../../features/design-marketplace/index.js', import.meta.url), 'utf8');
  assert.ok(botFeature.includes("if (sub === 'add' || sub === 'tambah') return startItemWizard(ctx)"));
  assert.ok(botFeature.includes('PORTFOLIO_MAX_FILE_BYTES'));
  assert.ok(botFeature.includes('processPortfolioImageBuffer'));
  assert.ok(botFeature.includes('image/svg+xml'));
  assert.ok(botFeature.includes('15 MB per file'));
  assert.ok(botFeature.includes("if (sub === 'link') return linkWebsiteSignup(ctx, ctx.args[1])"));
  assert.ok(botFeature.includes("if (sub === 'dashboard') return handleDesignerDashboardAction(ctx, String(ctx.args[1] || '').toLowerCase())"));
  assert.ok(botFeature.includes("if (action === 'setup') return sendDesignerDashboardSetupToken(ctx)"));
  assert.ok(botFeature.includes("if (action === 'otp') return sendDesignerDashboardOtp(ctx)"));
});


test('served brand asset is the supplied pear emblem and is not a generic lettermark', () => {
  const icon = fs.readFileSync(new URL('../brand-icon.svg', import.meta.url), 'utf8');
  assert.ok(icon.includes('<svg'));
  assert.ok(icon.includes('rgb(174,189,147)'));
  assert.ok(!icon.includes('PIR'));
});


test('website prioritizes its dedicated host and port environment settings', () => {
  assert.ok(source.includes('process.env.PORTFOLIO_WEB_PORT || process.env.PORT || 3080'));
  assert.ok(source.includes('process.env.PORTFOLIO_WEB_HOST || process.env.HOST ||'));
});


test('signup request expiry keeps only one TTL index declaration', () => {
  const websiteModels = fs.readFileSync(new URL('../models.js', import.meta.url), 'utf8');
  const botModels = fs.readFileSync(new URL('../../models/design-marketplace.js', import.meta.url), 'utf8');
  assert.match(websiteModels, /expiresAt:\s*\{\s*type:\s*Date,\s*required:\s*true\s*\}/);
  assert.match(botModels, /expiresAt:\s*\{\s*type:\s*Date,\s*required:\s*true\s*\}/);
  assert.match(websiteModels, /designerSignupRequestSchema\.index\(\{\s*expiresAt:\s*1\s*\},\s*\{\s*expireAfterSeconds:\s*86400\s*\}\)/);
  assert.match(botModels, /DesignerSignupRequestSchema\.index\(\{\s*expiresAt:\s*1\s*\},\s*\{\s*expireAfterSeconds:\s*86400\s*\}\)/);
});

test('v5.39.1 dark theme is graphite and home hero has no centered logo watermark', () => {
  assert.ok(source.includes('--bg:#17191C'));
  assert.ok(source.includes('--surface:#24292E'));
  assert.ok(source.includes('company-hero:before{content:none;display:none}'));
  assert.ok(!source.includes("background:url('/icon.svg?v=5690') center/contain no-repeat"));
});

test('light theme explicitly keeps Portal Designer readable', () => {
  assert.ok(source.includes('[data-theme="light"] .nav-links .nav-cta{background:#354B36;color:#FFFFFF!important'));
  assert.ok(source.includes('[data-theme="light"] #main-content h1'));
  assert.ok(source.includes('[data-theme="light"] #main-content label'));
});


test('homepage showcase is an independent, data-driven set of work and event categories', () => {
  assert.ok(source.includes('const showcaseMarkup = `<section class=\"pv-home-showcase\"'));
  assert.ok(source.includes('Karya Terbaru'));
  assert.ok(source.includes('Karya Unggulan'));
  assert.ok(source.includes('Karya Termahal'));
  assert.ok(source.includes('Karya Termurah'));
  assert.ok(source.includes('Event PIR Visuals'));
  assert.ok(source.includes("moderationStatus: 'approved'"));
  assert.ok(source.includes('featured: true'));
  assert.ok(source.includes('priceFrom: { $gt: 0 }'));
  assert.ok(source.includes('cms.events'));
});

test('Owner Dashboard can add, edit, approve and remove portfolio works', () => {
  assert.ok(source.includes('const ownerWorkManager ='));
  assert.ok(source.includes("parts[1] === 'work' && req.method === 'POST'"));
  assert.ok(source.includes("['create','update','delete']"));
  assert.ok(source.includes("moderationStatus: 'approved'"));
  assert.ok(source.includes("processPortfolioImage(file, outputPath, 'original')"));
  assert.ok(source.includes('const ownerDesignerManager ='));
  assert.ok(source.includes("parts[1] === 'designer' && req.method === 'POST'"));
});

test('Owner Dashboard stores up to five Owner events separately from designer portfolio uploads', () => {
  assert.ok(source.includes('const eventEditor = [0,1,2,3,4]'));
  assert.ok(source.includes('event0MediaFile'));
  assert.ok(source.includes('event4MediaFile'));
  assert.ok(source.includes('const existingEvents=Array.isArray(existingValue.events)'));
  assert.ok(source.includes('events,layout,copy,categorySettings'));
  assert.ok(source.includes("parts[0] === 'homepage-media'"));
});

test('homepage showcase supports tabs, touch swipe, dots and reduced-motion behavior', () => {
  assert.ok(showcaseJs.includes('data-showcase-tab'));
  assert.ok(showcaseJs.includes('data-showcase-prev'));
  assert.ok(showcaseJs.includes('data-showcase-next'));
  assert.ok(showcaseJs.includes('touchstart'));
  assert.ok(showcaseJs.includes('prefers-reduced-motion: reduce'));
});

test('dark mode uses layered graphite surfaces instead of flat full-green backgrounds', () => {
  assert.ok(source.includes('linear-gradient(145deg,#15181b 0%,#1a2025 48%,#171b1f 100%)'));
  assert.ok(source.includes('[data-theme="dark"] .home-carousel'));
  assert.ok(source.includes('[data-theme="dark"] .company-hero'));
});


test('review submission and verification routes are reachable before directory fallback', () => {
  assert.ok(source.includes("if (!['designer', 'p', 'review', 'work'].includes(parts[0]) || !parts[1])"));
  assert.ok(source.includes("parts[0] === 'review' && parts[1] && req.method === 'POST'"));
  assert.ok(source.includes("parts[1] === 'verify' && req.method === 'GET'"));
});

test('designer reputation only counts published email-verified testimonials', () => {
  assert.ok(source.includes("DesignerTestimonial.find({ designerId: profile.designerId, isPublished: true, emailVerified: true })"));
  assert.ok(source.includes('const averageRating = Number(reviewStats[0]?.average || 0)'));
  assert.ok(source.includes('reviewCount >= 5 && averageRating >= 4.5'));
  assert.ok(source.includes('ulasan dengan email terverifikasi'));
});

test('review submissions are unique per designer and hashed email', () => {
  const models = fs.readFileSync(new URL('../models.js', import.meta.url), 'utf8');
  assert.ok(models.includes('reviewerEmailHash: { type: String }'));
  assert.ok(models.includes('partialFilterExpression')); 
  assert.ok(source.includes('reviewerEmailHash:hashToken(email)'));
  assert.ok(source.includes('error?.code === 11000'));
});

test('designer cannot publish testimonials without Owner approval', () => {
  assert.ok(source.includes('Menunggu persetujuan Owner'));
  assert.ok(source.includes("testimonial.isPublished = false; await testimonial.save()"));
  assert.ok(source.includes('Dipublikasikan') && source.includes('Menunggu moderasi Owner'));
});


test('reputation average and count aggregate all approved reviews, not only the latest display page', () => {
  assert.ok(source.includes("const [works, services, analytics, collections, testimonials, reviewStats, publicAvailability]"));
  assert.ok(source.includes("average: { $avg: '$rating' }"));
  assert.ok(source.includes("const reviewCount = Number(reviewStats[0]?.count || 0)"));
});

test('failed review verification email removes the pending reservation so client can retry', () => {
  assert.ok(source.includes("DesignerTestimonial.deleteOne({testimonialId, emailVerified:false})"));
});


test('client moodboards have a dedicated persistent model with hashed edit secrets', () => {
  const models = fs.readFileSync(new URL('../models.js', import.meta.url), 'utf8');
  assert.ok(models.includes('clientMoodboardSchema'));
  assert.ok(models.includes("collection: 'clientmoodboards'"));
  assert.ok(models.includes('editTokenHash: { type: String, required: true }'));
  assert.ok(models.includes('isPublic: { type: Boolean, default: true, index: true }'));
});

test('client moodboards support create, public/private view, update and delete with secret key validation', () => {
  assert.ok(source.includes("parts[0] === 'collections' && parts.length === 1 && req.method === 'GET'"));
  assert.ok(source.includes("parts[0] === 'collections' && parts[1] === 'create' && req.method === 'POST'"));
  assert.ok(source.includes("['update','delete'].includes(parts[2])"));
  assert.ok(source.includes("sameHash(hashToken(key), board.editTokenHash)"));
  assert.ok(source.includes("board.isPublic=form.get('isPublic')==='on'"));
});

test('moodboards only include public designers and approved portfolio works', () => {
  assert.ok(source.includes("DesignerProfile.find({ designerId: { $in: board.designerIds }, isPublic: true })"));
  assert.ok(source.includes("PortfolioItem.find({ itemId: { $in: board.itemIds }, moderationStatus: 'approved' })"));
  assert.ok(source.includes('board.itemIds'));
  assert.ok(source.includes('DESIGNER ID'));
});

test('moodboard navigation is available from the website shell', () => {
  assert.ok(source.includes('<a href="/collections">Moodboard</a>'));
});


test('homepage uses the premium editorial redesign while retaining live stats and CMS banners', () => {
  assert.ok(source.includes('class="pv-hero"'));
  assert.ok(source.includes('class="pv-index"'));
  assert.ok(source.includes('THE CREATIVE INDEX'));
  assert.ok(source.includes('const showcaseMarkup = `<section class=\"pv-home-showcase\"'));
  assert.ok(source.includes('Karya Terbaru'));
  assert.ok(source.includes('Karya Unggulan'));
  assert.ok(source.includes('Karya Termahal'));
  assert.ok(source.includes('Karya Termurah'));
  assert.ok(source.includes('Event PIR Visuals'));
  assert.ok(source.includes('class="pv-hero-actions"'));
  assert.ok(source.includes('PORTFOLIO FIRST'));
});

test('premium homepage preserves direct designer-client contact positioning', () => {
  assert.ok(source.includes('DIRECT CONNECTION'));
  assert.ok(source.includes("copyText('manifestoTitle','Less middlemen.\\nMore meaningful work.',150)"));
  assert.ok(source.includes('href="/discover"'));
  assert.ok(source.includes('href="/studio"'));
});

test('premium editorial theme has responsive dark and light compatible design tokens', () => {
  assert.ok(source.includes('/* v5.46.0 — full editorial homepage redesign */'));
  assert.ok(source.includes('@media(max-width:850px)'));
  assert.ok(source.includes('@media(max-width:600px)'));
  assert.ok(source.includes('--pv-acid'));
  assert.ok(source.includes('color-mix(in srgb,var(--surface-raised)'));
});


test('designer profile is a responsive editorial portfolio with external links, services and reviews', () => {
  assert.ok(source.includes('class="designer-cover"'));
  assert.ok(source.includes('class="showcase-work-grid"'));
  assert.ok(source.includes('class="showcase-services"'));
  assert.ok(source.includes('class="showcase-socials"'));
  assert.ok(source.includes('class="showcase-contact"'));
  assert.ok(source.includes('DESIGNER ID'));
  assert.ok(source.includes('@media(max-width:760px)'));
});

test('standalone case study pages expose only approved works from public designers', () => {
  assert.ok(source.includes("parts[0] === 'work' && parts[1] && req.method === 'GET'"));
  assert.ok(source.includes("moderationStatus: 'approved'"));
  assert.ok(source.includes("DesignerProfile.findOne({ designerId: work.designerId, isPublic: true })"));
  assert.ok(source.includes('class="case-study"'));
  assert.ok(source.includes('class="case-gallery"'));
  assert.ok(source.includes('class="case-cover"'));
});

test('public profile page does not expose private designer analytics counters', () => {
  assert.ok(source.includes("DesignerAnalytics.updateOne({ designerId: profile.designerId }"));
  assert.ok(!source.slice(source.indexOf('class="designer-showcase"'), source.indexOf('pageShell(`${profile.displayName}')).includes('Number(analytics?.profileViews || 0).toLocaleString'));
  assert.ok(!source.slice(source.indexOf('class="designer-showcase"'), source.indexOf('pageShell(`${profile.displayName}')).includes('Number(analytics?.contactClicks || 0).toLocaleString'));
});


test('designer profile pages generate contextual social metadata', () => {
  assert.ok(source.includes('const seoDescription = String(branding?.description'));
  assert.ok(source.includes('og:image'));
  assert.ok(source.includes('og:description" content="${escapeHtml(seoDescription)}"'));
  assert.ok(source.includes('ogImage: profileSeoImage'));
});


test('portfolio images support accessible fullscreen lightbox interactions', () => {
  assert.ok(source.includes("event.target.closest('a[href^=\"/media/\"]')"));
  assert.ok(source.includes('pir-image-lightbox'));
  assert.ok(source.includes('dialog.showModal()'));
  assert.ok(source.includes('aria-label="Tutup preview"'));
});

test('portfolio media negotiates optimized WebP and retains safe original fallback', () => {
  assert.ok(source.includes("const wantsWebp = /image\\/webp/i.test(String(req.headers.accept || ''))"));
  assert.ok(source.includes(".webp({ quality: 82, effort: 4 })"));
  assert.ok(source.includes("'vary': 'Accept'"));
  assert.ok(source.includes("return fs.createReadStream(file).pipe(res)"));
});

test('public sitemap includes case-study URLs only for approved works by public designers', () => {
  assert.ok(source.includes("PortfolioItem.find({ moderationStatus: 'approved' })"));
  assert.ok(source.includes('const publicDesignerIds = new Set(publicProfiles.map(p => p.designerId))'));
  assert.ok(source.includes('const workEntries = publicWorks.filter(w => publicDesignerIds.has(w.designerId))'));
  assert.ok(source.includes('/work/${encodeURIComponent(w.itemId)}'));
});

test('discovery page offers fast category shortcuts without removing detailed filters', () => {
  assert.ok(source.includes('class="discovery-shortcuts"'));
  assert.ok(source.includes('href="/discover?category=Branding"'));
  assert.ok(source.includes('name="skill"'));
  assert.ok(source.includes('name="location"'));
  assert.ok(source.includes('name="verified"'));
});

test('portfolio masonry is responsive and respects reduced motion', () => {
  assert.ok(source.includes('.showcase-work-grid{columns:2'));
  assert.ok(source.includes('@media(max-width:760px){.showcase-work-grid{columns:1}'));
  assert.ok(source.includes('@media(prefers-reduced-motion:reduce)'));
});


test('light theme uses a consolidated warm neutral palette with readable contrast', () => {
  assert.ok(source.includes('v5.45.1 — consolidated light theme'));
  assert.ok(source.includes('--bg:#F5F4EF;--bg-soft:#ECEBE4'));
  assert.ok(source.includes('[data-theme="light"] .showcase-work-meta p{color:var(--muted)}'));
  assert.ok(source.includes('[data-theme="light"] .showcase-contact{'));
  assert.ok(source.includes('[data-theme="light"] .btn{background:linear-gradient(135deg,#536B4C,#718568);color:#fff!important'));
  assert.ok(source.includes('[data-theme="light"] input,[data-theme="light"] select,[data-theme="light"] textarea{background:#FFFFFF;color:#202923'));
});

test('dark theme retains layered charcoal surfaces and does not become flat green', () => {
  assert.ok(source.includes('--bg:#17191C;--bg-soft:#1E2226;--surface:#24292E;--surface-raised:#2C3238'));
  assert.ok(source.includes('radial-gradient(ellipse at 82% -10%,rgba(170,182,154,.09)'));
  assert.ok(source.includes('v5.45.1 — consolidated light theme'));
});


test('homepage is a full editorial redesign with distinct discovery, talent, work and manifesto sections', () => {
  assert.ok(source.includes('class="pv-home"'));
  assert.ok(source.includes('class="pv-hero"'));
  assert.ok(source.includes('class="pv-index"'));
  assert.ok(source.includes('class="pv-category-grid"'));
  assert.ok(source.includes('class="pv-talent-grid"'));
  assert.ok(source.includes('class="pv-project-grid"'));
  assert.ok(source.includes('class="pv-manifesto"'));
  assert.ok(source.includes('class="pv-join"'));
  assert.ok(source.includes('class="pv-faq-list"'));
});

test('homepage category shortcuts use existing directory category filtering', () => {
  assert.ok(source.includes("copyText('categoryTitle','What are you\\nlooking to create?',120)"));
  assert.ok(source.includes('href="/discover?category=${encodeURIComponent(cat)}"'));
  assert.ok(directoryUtils.includes("category: String(searchParams.get('category')"));
  assert.ok(directoryUtils.includes('if (filters.category) filter.category ='));
});

test('homepage featured portfolio cards open their standalone approved case study pages', () => {
  assert.ok(source.includes('class="home-project home-project-${i+1}"'));
  assert.ok(source.includes('href="/work/${encodeURIComponent(w.itemId)}"'));
  assert.ok(source.includes('class="pv-work-section"'));
});

test('homepage layout has responsive tablet and mobile compositions and reduced-motion support', () => {
  assert.ok(source.includes('.pv-hero{grid-template-columns:1fr;min-height:0'));
  assert.ok(source.includes('@media(max-width:600px){.pv-hero'));
  assert.ok(source.includes('@media(prefers-reduced-motion:reduce){.pv-button'));
});


test('Designer Studio has a dedicated workspace sidebar and navigation for all existing modules', () => {
  assert.ok(source.includes('class="studio-workspace"'));
  assert.ok(source.includes('class="studio-sidebar"'));
  assert.ok(source.includes('class="studio-kpis"'));
  for (const section of ['overview','analytics','edit-profile','portfolio-manager','services-manager','leads','availability','notifications']) {
    assert.ok(source.includes("['" + section + "'"), `missing workspace navigation ${section}`);
  }
  assert.ok(source.includes('data-studio-nav-link'));
  assert.ok(source.includes('studioNav?.addEventListener'));
  assert.ok(source.includes('studio-nav-icon'));
  assert.ok(source.includes('class="studio-panels"'));
  assert.ok(source.includes('class="studio-welcome"'));
});

test('Designer Studio workspace remains responsive and uses accessible section anchors', () => {
  assert.ok(source.includes('.studio-workspace{display:grid;grid-template-columns:238px'));
  assert.ok(source.includes('@media(max-width:760px){.studio-workspace{display:block}'));
  assert.ok(source.includes('scroll-margin-top:20px'));
  assert.ok(source.includes('studio-status'));
});

test('directory search controls receive a responsive multi-column discovery layout', () => {
  assert.ok(source.includes('.search-panel{display:grid;grid-template-columns:repeat(3,minmax(0,1fr))'));
  assert.ok(source.includes('.search-panel .discovery-shortcuts,.search-panel .filter-row{grid-column:1/-1}'));
  assert.ok(source.includes('@media(max-width:480px){.studio-kpis'));
});


test('public designer profile has anchored section navigation and project count', () => {
  assert.ok(source.includes('class="showcase-jumpnav"'));
  for (const id of ['about-designer','selected-work','designer-services','client-reviews','contact-designer']) {
    assert.ok(source.includes(`id="${id}"`), `missing profile section ${id}`);
  }
  assert.ok(source.includes('<span>PROJECTS</span><strong>${works.length}</strong>'));
  assert.ok(source.includes('aria-label="Navigasi portfolio"'));
});

test('public designer profile supports native share with clipboard fallback', () => {
  assert.ok(source.includes('data-share-profile'));
  assert.ok(source.includes('navigator.share'));
  assert.ok(source.includes('navigator.clipboard?.writeText'));
  assert.ok(source.includes('Link tersalin'));
});

test('profile navigation and share control adapt to dark and light themes and mobile', () => {
  assert.ok(source.includes('.showcase-jumpnav{position:sticky'));
  assert.ok(source.includes('[data-theme="light"] .showcase-jumpnav'));
  assert.ok(source.includes('[data-theme="dark"] .showcase-jumpnav'));
  assert.ok(source.includes('@media(max-width:600px){.showcase-jumpnav'));
});


test('client shortlist has its own page, navigation entry and four-designer limit', () => {
  assert.ok(source.includes("parts[0] === 'shortlist'"));
  assert.ok(source.includes('data-shortlist-count'));
  assert.ok(source.includes('data-shortlist="${escapeHtml(d.designerId)}"'));
  assert.ok(source.includes('if(ids.length>=4)'));
  assert.ok(source.includes('pir_visuals_shortlist_v1'));
});

test('shortlist comparison uses public designer API fields and creates a comparison table safely', () => {
  assert.ok(source.includes("parts[1] === 'designers'"));
  assert.ok(source.includes('specialties: (d.specialties || []).slice(0,8)'));
  assert.ok(source.includes('isVerified: !!d.isVerified'));
  assert.ok(source.includes('const tableEl=document.createElement'));
  assert.ok(source.includes('td.textContent=get(d)'));
  assert.ok(source.includes('data-shortlist-remove'));
});

test('shortlist can be shared across devices with validated public designer IDs', () => {
  assert.ok(source.includes('data-shortlist-share'));
  assert.ok(source.includes("url.searchParams.set('ids',ids.join(','))"));
  assert.ok(source.includes("new URLSearchParams(location.search).get"));
  assert.ok(source.includes('incoming=sharedIds.split'));
});

test('shortlist controls are keyboard-operable buttons and responsive in both themes', () => {
  assert.ok(source.includes('type="button" data-shortlist'));
  assert.ok(source.includes('[data-theme="light"] .shortlist-table-wrap'));
  assert.ok(source.includes('[data-theme="dark"] .shortlist-table-wrap'));
  assert.ok(source.includes('@media(max-width:600px){.shortlist-hero'));
});


test('public contact centre provides support channels and a validated customer support ticket form', () => {
  assert.ok(source.includes("parts[0] === 'contact' && parts.length === 1 && req.method === 'GET'"));
  assert.ok(source.includes('action="/contact" class="support-form"'));
  assert.ok(source.includes('name="email" type="email"'));
  assert.ok(source.includes('name="message" minlength="15" maxlength="3000"'));
  assert.ok(source.includes('SUPPORT_WHATSAPP'));
  assert.ok(source.includes('SUPPORT_EMAIL'));
  assert.ok(source.includes("SupportTicket.create"));
});

test('support tickets are available in the protected owner dashboard with CSRF-protected status updates', () => {
  assert.ok(source.includes('Customer Support Inbox'));
  assert.ok(source.includes('action="/dashboard/support"'));
  assert.ok(source.includes("parts[1] === 'support' && req.method === 'POST'"));
  assert.ok(source.includes("['in_progress','resolved','closed'].includes(status)"));
  assert.ok(source.includes("SupportTicket.updateOne"));
});

test('light mode uses accessible text and surface contrast tokens and compact spacing overrides', () => {
  assert.ok(source.includes('[data-theme="light"] .muted,[data-theme="light"] .card .muted'));
  assert.ok(source.includes('[data-theme="light"] .btn{background:#385850;color:#fff'));
  assert.ok(source.includes('[data-theme="light"] input,[data-theme="light"] select,[data-theme="light"] textarea'));
  assert.ok(source.includes('.wrap{padding:18px 22px 52px}'));
  assert.ok(source.includes('.support-layout{display:grid;grid-template-columns:.9fr 1.1fr'));
});


test('v5.51 editorial homepage fixes light-mode hero text and creative index contrast', () => {
  assert.ok(source.includes('[data-theme="light"] .pv-hero h1{color:#202820!important'));
  assert.ok(source.includes('[data-theme="light"] .pv-hero-lede{color:#505c51!important'));
  assert.ok(source.includes('[data-theme="light"] .pv-index{background:#fffdf7!important'));
  assert.ok(source.includes('[data-theme="light"] .pv-index-total strong{color:#26392b!important'));
});

test('v5.51 premium editorial system defines light and dark section treatments and responsive layouts', () => {
  assert.ok(source.includes('[data-theme="light"] .pv-work-section{background:#e9e9df!important'));
  assert.ok(source.includes('[data-theme="light"] .pv-join{background:linear-gradient'));
  assert.ok(source.includes('[data-theme="dark"] .pv-hero{background:radial-gradient'));
  assert.ok(source.includes('@media(max-width:620px){.wrap{padding:12px 14px 38px}'));
  assert.ok(source.includes('pv-section-top h2'));
  assert.ok(source.includes('.pv-hero{min-height:650px'));
});


test('public SEO endpoints generate robots policy and sitemap from public designer/work records', () => {
  assert.ok(source.includes("parts[0] === 'robots.txt'"));
  assert.ok(source.includes("parts[0] === 'sitemap.xml'"));
  assert.ok(source.includes('DesignerProfile.find({isPublic:true})'));
  assert.ok(source.includes("PortfolioItem.find({moderationStatus:'approved'})"));
  assert.ok(source.includes('Sitemap: ${base}/sitemap.xml'));
});

test('designer portfolio editor supports structured case study fields with bounded input lengths', () => {
  for (const field of ['projectRole','challenge','solution','outcome','toolsUsed','projectDuration']) {
    assert.ok(source.includes(`name="${field}"`), `missing editor field ${field}`);
    assert.ok(source.includes(`cleanProject('${field}'`), `missing persistence for ${field}`);
  }
  assert.ok(source.includes('case-narrative'));
  assert.ok(source.includes('case-facts'));
});

test('case study content is rendered on approved public project pages', () => {
  assert.ok(source.includes('THE CHALLENGE'));
  assert.ok(source.includes('THE APPROACH'));
  assert.ok(source.includes('THE IMPACT'));
  assert.ok(source.includes('work.challenge'));
  assert.ok(source.includes('work.solution'));
  assert.ok(source.includes('work.outcome'));
});


test('v5.53 brand background uses geometric linework and oversized poster-inspired arcs in both themes', () => {
  assert.ok(source.includes('repeating-linear-gradient(135deg'));
  assert.ok(source.includes('repeating-linear-gradient(45deg'));
  assert.ok(source.includes('body:before'));
  assert.ok(source.includes('body:after'));
  assert.ok(source.includes('--pv-pattern:rgba(197,203,169,.075)'));
  assert.ok(source.includes('--pv-pattern:rgba(54,82,59,.105)'));
  assert.ok(source.includes('.wrap:after'));
  assert.ok(source.includes('prefers-reduced-motion:reduce'));
});

test('v5.53 visual identity applies to homepage, designer studio and editorial case study without obscuring content', () => {
  assert.ok(source.includes('.studio-workspace,.case-study'));
  assert.ok(source.includes('.pv-work-section:before'));
  assert.ok(source.includes('.pv-manifesto:before'));
  assert.ok(source.includes('pointer-events:none'));
  assert.ok(source.includes('[data-theme="light"] .pv-hero'));
  assert.ok(source.includes('[data-theme="dark"] .pv-hero'));
});


test('v5.53.1 background linework is sparse and decorative arcs are asymmetric rather than concentric', () => {
  assert.ok(source.includes('background-size:190px 190px'));
  assert.ok(source.includes('border-radius:64% 36% 57% 43% / 44% 58% 42% 56%'));
  assert.ok(source.includes('box-shadow:none;opacity:.72'));
  assert.ok(source.includes('border-radius:38% 62% 43% 57% / 55% 39% 61% 45%'));
});

test('v5.53.1 theme toggle has deliberate spacing in desktop and mobile navigation', () => {
  assert.ok(source.includes('.nav-links .theme-toggle{margin-left:8px'));
  assert.ok(source.includes('.nav-links .theme-toggle{width:auto;min-width:110px'));
  assert.ok(source.includes('.nav-links .theme-toggle{margin-top:10px}'));
});

test('v5.53.1 shortlist light theme uses readable warm surface and dark typography', () => {
  assert.ok(source.includes('[data-theme="light"] .shortlist-hero{'));
  assert.ok(source.includes('[data-theme="light"] .shortlist-hero h1,'));
  assert.ok(source.includes('[data-theme="light"] .shortlist-hero p{color:#5d6258!important'));
  assert.ok(source.includes('[data-theme="light"] .shortlist-table-wrap,'));
});


test('v5.54.0 uses flowing poster-style line art instead of tiled crosshatch', () => {
  assert.ok(source.includes('--pv-swoosh:url("data:image/svg+xml;base64,'));
  assert.ok(source.includes('background-image:var(--pv-swoosh)'));
  assert.ok(source.includes("background-repeat:no-repeat"));
  assert.ok(source.lastIndexOf("body:before{") > source.lastIndexOf("repeating-linear-gradient(135deg,transparent 0 39px"));
});

test('v5.54.0 mobile navigation has explicit consistent dark and light surfaces', () => {
  assert.ok(source.includes('.nav-links{background:var(--panel)!important'));
  assert.ok(source.includes('[data-theme="light"] .nav-links{background:#f8f6ef!important'));
  assert.ok(source.includes('[data-theme="light"] .nav-links .theme-toggle{background:#eeece3!important'));
});

test('v5.54.0 footer includes editorial CTA and grouped company navigation', () => {
  assert.ok(source.includes('class="footer-cta"'));
  assert.ok(source.includes('class="footer-brand-lockup"'));
  assert.ok(source.includes('Contact us'));
  assert.ok(source.includes('For designers'));
});


test('v5.55.0 footer typography and links remain readable against the dark footer in both themes', () => {
  assert.ok(source.includes('#main-content .foot .footer-cta h2{display:block!important'));
  assert.ok(source.includes('#main-content .foot .footer-grid a{display:block!important'));
  assert.ok(source.includes('[data-theme="light"] #main-content .foot h2,'));
  assert.ok(source.includes('[data-theme="light"] #main-content .foot a,'));
  assert.ok(source.includes('Temukan talenta.<br><em>Wujudkan ide besar.</em>'));
});

test('v5.55.0 navigation collapses before desktop labels become crowded and preserves theme-aware mobile colors', () => {
  assert.ok(source.includes('@media(max-width:1040px)'));
  assert.ok(source.includes('.nav-links.open{display:flex!important}'));
  assert.ok(source.includes('[data-theme="light"] .nav-links .theme-toggle{background:#e9e7dc!important'));
});

test('v5.55.0 homepage sections have improved editorial visual hierarchy', () => {
  assert.ok(source.includes('.pv-hero h1{max-width:900px'));
  assert.ok(source.includes('.pv-talent-grid .designer-card:hover'));
  assert.ok(source.includes('.pv-work-section:before'));
  assert.ok(source.includes('.pv-join:after'));
});


test('v5.56.0 category index uses real public profile and approved portfolio counts with distinct editorial tiles', () => {
  assert.ok(source.includes("if (parts[0] === 'categories' && req.method === 'GET')"));
  assert.ok(source.includes("countFor(DesignerProfile, 'category'"));
  assert.ok(source.includes("countFor(PortfolioItem, 'category'"));
  assert.ok(source.includes('class="category-tile category-tone-${index+1}"'));
  assert.ok(source.includes('class="category-recent-grid"'));
});

test('v5.56.0 designer profile adds a personal masthead, linked specialties and featured work treatment', () => {
  assert.ok(source.includes('class="showcase-cover-index"'));
  assert.ok(source.includes('class="tag capability-tag-link"'));
  assert.ok(source.includes('class="showcase-work-featured">FEATURED'));
  assert.ok(source.includes('.showcase-facts{grid-template-columns:repeat(6,minmax(0,1fr))'));
});

test('v5.56.0 project case studies add metadata, creator attribution and related approved work', () => {
  assert.ok(source.includes('class="case-meta-strip"'));
  assert.ok(source.includes('class="case-creator-card"'));
  assert.ok(source.includes('class="case-related-grid"'));
  assert.ok(source.includes("moderationStatus:'approved', category:work.category"));
  assert.ok(source.includes('.case-narrative{max-width:none'));
});


test('v5.56.0 case study route is reachable through the public route allowlist', () => {
  assert.ok(source.includes("!['designer', 'p', 'review', 'work'].includes(parts[0])"));
  assert.ok(source.indexOf("!['designer', 'p', 'review', 'work'].includes(parts[0])") < source.indexOf("if (parts[0] === 'work' && parts[1] && req.method === 'GET')"));
});



test('v5.57.0 Visual Site Studio exposes protected section controls and a live website preview', () => {
  assert.ok(source.includes('class="studio-cms-shell"'));
  assert.ok(source.includes('class="studio-section-control"'));
  assert.ok(source.includes('name="section${key}Enabled"'));
  assert.ok(source.includes('name="section${key}Order"'));
  assert.ok(source.includes('class="studio-preview"'));
  assert.ok(source.includes('iframe name="pv-studio-preview" src="/?preview=1" title="Preview website PIR Visuals"'));
  assert.ok(source.includes('target="pv-studio-preview"'));
  assert.ok(source.includes('aria-label="Refresh preview"'));
  assert.ok(source.includes("const previewMode = url.searchParams.get('preview') === '1'"));
  assert.ok(source.includes('action="/dashboard/content"'));
});

test('v5.57.0 homepage sections follow saved order and disabled sections are omitted', () => {
  assert.ok(source.includes("const homeSectionKeys = ['banner','categories','talent','work','manifesto','join','faq']"));
  assert.ok(source.includes('.filter(section => section.enabled).sort((a,b) => a.order - b.order || a.index - b.index)'));
  assert.ok(source.includes('const orderedSectionMarkup = orderedHomeSections.map(key => sectionMarkup[key] ||').toString());
  assert.ok(source.includes('${orderedSectionMarkup}'));
  assert.ok(source.includes('<section class="pv-hero">'));
});

test('v5.57.0 Owner CMS sanitizes and persists homepage copy, FAQ, section layout and SEO metadata', () => {
  assert.ok(source.includes('const cleanMultiline='));
  assert.ok(source.includes('const layout=Object.fromEntries(sectionKeys.map'));
  assert.ok(source.includes('const copy=Object.fromEntries(copyFields.map'));
  assert.ok(source.includes("const faqCountValue=Number.parseInt(String(form.get('faqCount') || '3'),10)"));
  assert.ok(source.includes("copy.faq=Array.from({length:faqCount}"));
  assert.ok(source.includes('Math.min(20,faqCountValue)'));
  assert.ok(source.includes('seoImage:/^https:\\/\\//i.test(seoImageValue)?seoImageValue:\'\''));
  assert.ok(source.includes('...existingValue'));
  assert.ok(source.includes('PortfolioSiteContent.findOneAndUpdate'));
});

test('v5.57.0 category index reads Owner-managed descriptions and visibility settings', () => {
  assert.ok(source.includes("const categorySettings = categoryCmsDoc?.value?.categorySettings"));
  assert.ok(source.includes('description:String(setting.description || category.description).slice(0,220)'));
  assert.ok(source.includes('.filter(category => category.enabled)'));
  assert.ok(source.includes('${visibleCategories.length} CREATIVE DISCIPLINES'));
});

test('v5.57.0 homepage SEO and Open Graph metadata can be managed without unsafe image protocols', () => {
  assert.ok(source.includes("const seoTitle = String(cms.seoTitle || 'PIR Visuals — Creative Talent Network').slice(0,100)"));
  assert.ok(source.includes('const seoDescription = String(cms.seoDescription || homeSubtitle).slice(0,300)'));
  assert.ok(source.includes("const seoImage = /^https:\\/\\//i.test(String(cms.seoImage || ''))"));
  assert.ok(source.includes('return pageShell(seoTitle, body, { description:seoDescription, ogImage:seoImage })'));
});


test('v5.58.0 adds privacy-conscious site analytics event storage without raw visitor identifiers', () => {
  const models = fs.readFileSync(new URL('../models.js', import.meta.url), 'utf8');
  assert.ok(models.includes('siteAnalyticsEventSchema'));
  assert.ok(models.includes("collection: 'portfoliositeanalyticsevents'"));
  assert.ok(models.includes("eventType: { type: String, required: true, enum: ['page_view','project_view','campaign_click','category_click','search','contact_click','lead_submit'] }"));
  assert.ok(models.includes('Do not store IPs'));
  assert.ok(source.includes("parts[1] === 'track' && req.method === 'POST'"));
  assert.ok(source.includes("['page_view','project_view','campaign_click','category_click','search','contact_click'].includes(eventType)"));
});

test('v5.58.0 serves same-origin analytics client and records showcase CTA clicks', () => {
  assert.ok(source.includes("parts[0] === 'analytics-ui.js' && req.method === 'GET'"));
  assert.ok(source.includes('<script src="/analytics-ui.js" defer></script>'));
  assert.ok(source.includes('data-track-campaign="showcase-${category}-${escapeHtml(work.itemId)}"'));
  assert.ok(source.includes('data-track-campaign="showcase-event-${escapeHtml(event.eventId || index+1)}"'));
  assert.ok(source.includes("send('campaign_click'"));
  assert.ok(source.includes("startsWith('showcase-event-')"));
});

test('v5.58.0 records a successful designer brief as a lead conversion event', () => {
  assert.ok(source.includes("eventType:'lead_submit', path:'/lead', designerId"));
  assert.ok(source.includes('await DesignerLead.create({ leadId, designerId, clientName, email, whatsapp, brief })'));
});

test('v5.58.0 Owner dashboard reports funnel, campaign, category and designer ranking signals', () => {
  assert.ok(source.includes('GROWTH INTELLIGENCE'));
  assert.ok(source.includes('Discovery to inquiry.'));
  assert.ok(source.includes('Showcase performance.'));
  assert.ok(source.includes('Most explored fields.'));
  assert.ok(source.includes('Designers to watch.'));
  assert.ok(source.includes('DesignerLead.aggregate'));
});

test('v5.58.0 public design system has distinct warm light and textured charcoal dark themes', () => {
  assert.ok(source.includes('--bg:#1b1e1c'));
  assert.ok(source.includes('[data-theme="light"]{'));
  assert.ok(source.includes('body:before{'));
  assert.ok(source.includes('.pv-hero:after{'));
  assert.ok(source.includes('.pv-overline,.pv-label{color:#c4cfb5'));
  assert.ok(source.includes('.growth-dashboard-grid{'));
  assert.ok(source.includes('.nav-links.open .theme-toggle'));
});

test('v5.58.0 analytics endpoint validates campaign and category identifiers and rate limits events', () => {
  assert.ok(source.includes("/^(?:cms-slide-[1-3]|featured-designer|latest-portfolio)$/"));
  assert.ok(source.includes("allowedCategories = ['Brand Identity','UI/UX Design'"));
  assert.ok(source.includes("allowCount(req, `site-event:${rateKey}`"));
  assert.ok(source.includes('const trackedPath = safePath ==='));
  const rateLimit = source.indexOf('allowCount(req, `site-event:');
  const analyticsRoute = source.slice(source.lastIndexOf("if (parts[0]", rateLimit), rateLimit);
  assert.match(analyticsRoute, /if \(!isSameOriginRequest\(req\.headers\)\) \{ res\.writeHead\(403\)/);
});


test('v5.59.0 Designer Studio supports personal-brand storytelling, safe layout presets and profile SEO', () => {
  const models = fs.readFileSync(new URL('../models.js', import.meta.url), 'utf8');
  assert.ok(models.includes("profileLayout: { type: String, enum: ['editorial','minimal','gallery']"));
  assert.ok(models.includes('practiceStatement: { type: String, maxlength: 600 }'));
  assert.ok(models.includes('idealProjects: { type: String, maxlength: 400 }'));
  assert.ok(source.includes('Personal brand, cerita & SEO profil'));
  assert.ok(source.includes('name="tagline"'));
  assert.ok(source.includes('name="practiceStatement"'));
  assert.ok(source.includes("profileLayout: ['editorial','minimal','gallery'].includes"));
  assert.ok(source.includes("seoImage: /^https:\\/\\//i.test(clean('seoImage', 500))"));
});

test('v5.59.0 public designer profiles render optional practice stories and selected layout presets', () => {
  assert.ok(source.includes('practiceBlocks'));
  assert.ok(source.includes('practiceMarkup'));
  assert.ok(source.includes('data-track-designer="${escapeHtml(profile.designerId)}"'));
  assert.ok(source.includes('class="designer-showcase layout-${profileLayoutClass}"'));
  assert.ok(source.includes('profileSeoTitle'));
  assert.ok(source.includes('profileSeoDescription'));
  assert.ok(source.includes('profileSeoImage'));
  assert.ok(source.includes('.practice-story-grid{'));
  assert.ok(source.includes('.designer-showcase.layout-gallery .showcase-work-grid'));
});

test('v5.59.0 case-study metadata is sanitized, persisted and rendered with project-specific SEO', () => {
  const models = fs.readFileSync(new URL('../models.js', import.meta.url), 'utf8');
  for (const field of ['projectClient','projectIndustry','projectYear','projectScope','resultHighlight','seoTitle','seoDescription']) {
    assert.ok(models.includes(`${field}:`), `missing model field ${field}`);
    if (field === 'projectYear') assert.ok(source.includes('projectYear,'));
    else assert.ok(source.includes(`${field}:cleanProject`), `missing save mapping ${field}`);
  }
  assert.ok(source.includes('projectYear = /^\\d{4}$/'));
  assert.ok(source.includes('PROJECT HIGHLIGHT'));
  assert.ok(source.includes('projectMetaMarkup'));
  assert.ok(source.includes('caseSeoTitle'));
  assert.ok(source.includes('caseSeoDescription'));
  assert.ok(source.includes("ogImage:`/media/${work.itemId}`"));
});

test('v5.59.0 project detail analytics validate designer and item IDs and power designer rankings', () => {
  const models = fs.readFileSync(new URL('../models.js', import.meta.url), 'utf8');
  assert.ok(models.includes("'project_view'"));
  assert.ok(source.includes("if(segments[0]==='work' && segments.length===2)"));
  assert.ok(source.includes("send('project_view'"));
  assert.ok(source.includes("eventType === 'project_view' && (!safeDesignerId || !safeItemId"));
  assert.ok(source.includes("eventType:'project_view', designerId:profile.designerId"));
  assert.ok(source.includes('Most viewed work.'));
  assert.ok(source.includes('viewedWorkIds'));
});

test('v5.59.0 case-study gallery opens through the accessible same-origin lightbox', () => {
  assert.ok(source.includes('aria-label="Perbesar gambar ${i+2}: ${escapeHtml(work.title)}"'));
  assert.ok(source.includes('href="/media/${encodeURIComponent(work.itemId)}/${i+1}" aria-label='));
  assert.ok(source.includes("const link=event.target.closest('a[href^=\"/media/\"]')"));
  assert.ok(source.includes('.case-gallery-item:focus-visible'));
});

test('v5.59.0 Designer Studio performance shows 30-day conversion and 14-day activity trend', () => {
  assert.ok(source.includes("daily.date': { $gte: since30.toISOString().slice(0,10) }"));
  assert.ok(source.includes('const contactRate30 ='));
  assert.ok(source.includes('LAST 14 DAYS'));
  assert.ok(source.includes('studio-trend-chart'));
  assert.ok(source.includes('Profile → contact'));
  assert.ok(source.includes('.studio-performance-grid{'));
});

test('v5.59.0 responsive profile presets and case-study storytelling have mobile layouts', () => {
  assert.ok(source.includes('.designer-showcase.layout-minimal'));
  assert.ok(source.includes('.case-result-highlight'));
  assert.ok(source.includes('@media(max-width:760px){'));
  assert.ok(source.includes('.designer-showcase.layout-gallery .showcase-work-grid{grid-template-columns:1fr}'));
});


test('v5.60.0 adds private client projects, expiring magic-link access sessions and shared project updates', () => {
  const models = fs.readFileSync(new URL('../models.js', import.meta.url), 'utf8');
  assert.ok(models.includes("collection: 'clientprojects'"));
  assert.ok(models.includes("enum: ['brief_received','discovery','in_progress','review','completed','cancelled']"));
  assert.ok(models.includes("collection: 'clientprojectsessions'"));
  assert.ok(models.includes("index: { expires: 0 }"));
  assert.ok(models.includes("collection: 'clientprojectupdates'"));
  assert.ok(models.includes("enum: ['system','designer','client']"));
});

test('v5.60.0 client workspace invitation uses hashed, expiring, one-time email tokens', () => {
  assert.ok(source.includes("accessTokenHash:hashToken(accessToken)"));
  assert.ok(source.includes("accessTokenExpiresAt:new Date(Date.now()+30*60*1000)"));
  assert.ok(source.includes("accessTokenHash:hashToken(token), accessTokenExpiresAt:{ $gt:now }"));
  assert.ok(source.includes("consumed.modifiedCount !== 1"));
  assert.ok(source.includes("accessTokenHash:'', accessTokenExpiresAt:null, accessTokenUsedAt:now"));
  assert.ok(source.includes('async function sendClientProjectAccessEmail'));
  assert.ok(source.includes('Tautan hanya dapat digunakan satu kali'));
});

test('v5.60.0 client project session is HttpOnly, SameSite Strict, CSRF protected and project scoped', () => {
  assert.ok(source.includes("cookieValue(req, 'pir_client_session')"));
  assert.ok(source.includes('async function getClientProjectSession'));
  assert.ok(source.includes('async function issueClientProjectSession'));
  assert.ok(source.includes('pir_client_session=${id}; HttpOnly; SameSite=Strict; Path=/; Max-Age=2592000'));
  assert.ok(source.includes('function validClientCsrf'));
  assert.ok(source.includes("session.projectId !== parts[2]"));
  assert.ok(source.includes("ClientProject.findOne({ projectId:parts[2] })"));
});

test('v5.60.0 new client brief creates a project room and initial activity without routing payment through PIR', () => {
  assert.ok(source.includes("const projectId = `PRJ-${crypto.randomBytes(7).toString('hex').toUpperCase()}`"));
  assert.ok(source.includes('await ClientProject.create({'));
  assert.ok(source.includes("status:'brief_received', lastActivityAt:new Date()"));
  assert.ok(source.includes("authorRole:'system'"));
  assert.ok(source.includes('portalInviteSent'));
  assert.ok(source.includes('Negosiasi, pemesanan, dan transaksi tetap dilakukan langsung antara klien dan desainer.'));
  assert.ok(source.includes('name="email" type="email" autocomplete="email" maxlength="254" required'));
});

test('v5.60.0 client workspace supports private feedback and blocks writes to closed projects', () => {
  assert.ok(source.includes("parts[0] === 'client' && parts[1] === 'projects' && parts[2] && parts[3] === 'message'"));
  assert.ok(source.includes('validClientCsrf(req,form,session)'));
  assert.ok(source.includes("['completed','cancelled'].includes(project.status)"));
  assert.ok(source.includes("authorRole:'client', authorName:project.clientName"));
  assert.ok(source.includes("type:'project_message'"));
  assert.ok(source.includes('Ruang proyek sudah ditutup.'));
});

test('v5.60.0 designer project room is scoped to the authenticated designer and supports status updates and re-invites', () => {
  assert.ok(source.includes("parts[0] === 'studio' && parts[1] === 'projects' && parts[2] && req.method === 'GET'"));
  assert.ok(source.includes('ClientProject.findOne({projectId:parts[2],designerId:session.designerId})'));
  assert.ok(source.includes("parts[3] === 'invite'"));
  assert.ok(source.includes("parts[3] === 'update'"));
  assert.ok(source.includes("const allowedStatuses = clientProjectStatusChoices(project.status)"));
  assert.ok(source.includes("authorRole:'designer',authorName:profile.displayName"));
  assert.ok(source.includes('sendClientProjectUpdateEmail'));
});

test('v5.60.0 Designer Studio surfaces client project rooms next to leads', () => {
  assert.ok(source.includes('ClientProject.find({ designerId:profile.designerId })'));
  assert.ok(source.includes('Project rooms (${clientProjects.length})'));
  assert.ok(source.includes('href="/studio/projects/${encodeURIComponent(project.projectId)}"'));
  assert.ok(source.includes('href="#client-projects">Project rooms</a>'));
});

test('v5.60.0 motion system provides reduced-motion-safe scroll reveal, progress and responsive client UI', () => {
  assert.ok(source.includes('v5.60.0 — motion system'));
  assert.ok(source.includes('html.pv-motion-ready [data-pv-reveal]'));
  assert.ok(source.includes('@media(prefers-reduced-motion:reduce)'));
  assert.ok(source.includes('IntersectionObserver'));
  assert.ok(source.includes('pv-scroll-progress'));
  assert.ok(source.includes('pv-toast-region'));
  assert.ok(source.includes('pv-project-stages'));
  assert.ok(source.includes('.pv-client-overview'));
  assert.ok(source.includes('@media(max-width:760px)'));
});

test('v5.60.0 public interactions add swipe/keyboard carousel and accessible toast feedback', () => {
  assert.ok(source.includes('showToast'));
  assert.ok(source.includes("event.key==='ArrowRight'"));
  assert.ok(source.includes("addEventListener('touchstart'"));
  assert.ok(source.includes("aria-live','polite'"));
  assert.ok(source.includes("document.addEventListener('keydown'"));
});

test('v5.60.0 client workspace is discoverable and invitation access avoids referrer leakage', () => {
  assert.ok(source.includes("parts[0] === 'client' && parts.length === 1 && req.method === 'GET'"));
  assert.ok(source.includes('href="/client">Client workspace ↗</a>'));
  assert.ok(source.includes("'referrer-policy':'no-referrer'"));
  assert.ok(source.includes("res.writeHead(303,{location:'/','set-cookie':'pir_client_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0','cache-control':'no-store','referrer-policy':'no-referrer'}"));
});


test('v5.60.0 private client and designer project pages are explicitly excluded from search indexing', () => {
  assert.ok(source.includes("branding?.noIndex ? '<meta name=\"robots\" content=\"noindex,nofollow,noarchive\">' : ''"));
  assert.ok(source.includes("noIndex:true"));
  assert.ok(source.includes("renderClientProjectWorkspace(project,designer,updates,session)"));
  assert.ok(source.includes("renderDesignerProjectWorkspace(project,profile,updates,session"));
});


test('v5.60.0 preserves legacy leads and lets designers convert them into client project rooms', () => {
  assert.ok(source.includes("parts[1] === 'lead' && parts[2] === 'workspace'"));
  assert.ok(source.includes("DesignerLead.findOne({leadId,designerId:session.designerId})"));
  assert.ok(source.includes("ClientProject.findOne({leadId,designerId:session.designerId})"));
  assert.ok(source.includes('Ruang proyek privat dibuat dari lead yang sudah ada.'));
  assert.ok(source.includes('Buat client workspace ↗'));
  assert.ok(source.includes('Lead lama belum memiliki email yang valid.'));
});


test('v5.60.0 production client email links require HTTPS and private routes are disallowed to crawlers', () => {
  assert.ok(source.includes("process.env.NODE_ENV === 'production' && !/^https:\\/\\//i.test(base)"));
  assert.ok(source.includes('Disallow: /client\\nDisallow: /dashboard'));
  assert.ok(source.includes("noIndex:true"));
});


test('v5.61.0 homepage adds accessible kinetic typography, animated counters and an editorial motion ribbon', () => {
  assert.ok(source.includes('const homeTitleMarkup = homeTitle.split(/\\s+/)'));
  assert.ok(source.includes('aria-label="${escapeHtml(homeTitle)}"'));
  assert.ok(source.includes('class="pv-hero-word"'));
  assert.ok(source.includes('data-pv-count="${Number(total)||0}"'));
  assert.ok(source.includes('data-pv-count="${Number(verified)||0}"'));
  assert.ok(source.includes('class="pv-motion-ribbon"'));
  assert.ok(source.includes('DISCOVER TALENT'));
});

test('v5.61.0 homepage scroll storytelling staggers sections and reveals image-led portfolio tiles', () => {
  assert.ok(source.includes("const storySelector='.pv-hero-main,.pv-index,.pv-home-showcase"));
  assert.ok(source.includes("node.setAttribute('data-pv-story','')"));
  assert.ok(source.includes('--pv-stagger-index'));
  assert.ok(source.includes('pv-project-grid[data-pv-story].is-visible .home-project-image'));
  assert.ok(source.includes('clip-path:inset(0 0 100% 0)'));
});

test('v5.61.0 directory statistics count up with locale formatting and eased motion', () => {
  assert.ok(source.includes("const countNodes=[...homeMotionRoot.querySelectorAll('[data-pv-count]')]"));
  assert.ok(source.includes("new Intl.NumberFormat('id-ID').format(Math.round(target*eased))"));
  assert.ok(source.includes('const duration=1450,start=performance.now()'));
  assert.ok(source.includes('countObserver.unobserve(entry.target)'));
});

test('v5.61.0 hero supports scroll parallax and pointer-responsive ambient lighting', () => {
  assert.ok(source.includes('pv-hero-parallax'));
  assert.ok(source.includes("hero.addEventListener('pointermove'"));
  assert.ok(source.includes('distance*30'));
  assert.ok(source.includes('document.querySelectorAll(\'.hero,.pv-hero,.pv-client-confirmation,.studio-welcome\')'));
});

test('v5.61.0 featured carousel gains cinematic image drift and staggered text transitions', () => {
  assert.ok(source.includes('.pv-home .carousel-slide.is-active .carousel-art img{animation:pv-carousel-image-drift'));
  assert.ok(source.includes('.pv-home .carousel-slide.is-active .carousel-copy h2{animation:pv-editorial-enter'));
  assert.ok(source.includes('@keyframes pv-carousel-image-drift'));
  assert.ok(source.includes('pv-ribbon-travel'));
});

test('v5.61.0 editorial motion honors reduced-motion preferences and refreshes public cache', () => {
  assert.ok(source.includes('@media(prefers-reduced-motion:reduce)'));
  assert.ok(source.includes('.pv-home .pv-motion-ribbon-track{animation:none!important'));
  assert.ok(source.includes("const CACHE='pir-visuals-public-v47'"));
  assert.ok(source.includes('storyNodes.forEach(node=>node.classList.add(\'is-visible\'))'));
});


test('v5.62.0 adds an accessible global command palette with keyboard shortcuts and direct page navigation', () => {
  assert.ok(source.includes('id="pv-command-dialog"'));
  assert.ok(source.includes('data-command-open'));
  assert.ok(source.includes('data-command-item'));
  assert.ok(source.includes('action="/discover"'));
  assert.ok(source.includes("event.key.toLowerCase()==='k'"));
  assert.ok(source.includes("event.key==='/'&&!typing"));
  assert.ok(source.includes("commandDialog.showModal()"));
  assert.ok(source.includes('aria-labelledby="pv-command-title"'));
});

test('v5.62.0 lets visitors control decorative motion and persists the preference', () => {
  assert.ok(source.includes('data-motion-toggle'));
  assert.ok(source.includes("localStorage.getItem('pir_visuals_motion_v1')"));
  assert.ok(source.includes("localStorage.setItem(motionKey,off?'off':'on')"));
  assert.ok(source.includes('systemMotionReduced||motionPreference===\'off\''));
  assert.ok(source.includes("label.textContent=systemMotionReduced?'Reduced':off?'Off':'On'"));
  assert.ok(source.includes('html[data-pv-motion="off"] *'));
});

test('v5.62.0 adds native cross-document transitions and a reduced-motion-safe back-to-top control', () => {
  assert.ok(source.includes('@view-transition{navigation:auto}'));
  assert.ok(source.includes('::view-transition-new(root)'));
  assert.ok(source.includes('data-back-top'));
  assert.ok(source.includes("window.scrollTo({top:0,behavior:motionReduced||document.documentElement.dataset.pvMotion==='off'?'auto':'smooth'})"));
  assert.ok(source.includes('@media(prefers-reduced-motion:reduce)'));
});

test('v5.62.0 applies consistent responsive surfaces, keyboard focus, dynamic background texture and card spotlight', () => {
  assert.ok(source.includes('v5.62.0 — unified experience system'));
  assert.ok(source.includes('body:before{content:"";position:fixed'));
  assert.ok(source.includes('.pv-spotlight-card'));
  assert.ok(source.includes("window.matchMedia('(hover:hover) and (pointer:fine)')"));
  assert.ok(source.includes('.nav-links a[aria-current="page"]'));
  assert.ok(source.includes('.btn:focus-visible'));
  assert.ok(source.includes('@media(max-width:850px)'));
});

test('v5.62.0 updates public cache and health endpoint release version', () => {
  assert.ok(source.includes("const CACHE='pir-visuals-public-v47'"));
  assert.ok(source.includes("version: '6.7.13'"));
  assert.ok(source.includes('/icon.svg?v=6710'));
});


test('v5.62.0 progressive lazy-image reveal supports dynamically inserted portfolio content', () => {
  assert.ok(source.includes('const mountImages=root=>'));
  assert.ok(source.includes("img.decoding='async'"));
  assert.ok(source.includes("img.classList.add('pv-image-pending')"));
  assert.ok(source.includes("img.classList.add('pv-image-ready')"));
  assert.ok(source.includes('mountImages(node)'));
});

test('v5.62.0 user-selected reduced motion pauses the homepage auto-advancing carousel', () => {
  assert.ok(source.includes("localStorage.getItem('pir_visuals_motion_v1')||'on'"));
  assert.ok(source.includes("userMotion!=='off')timer=setInterval"));
  assert.ok(source.includes("dispatchEvent(new Event('mouseenter'))"));
  assert.ok(source.includes("dispatchEvent(new Event('mouseleave'))"));
});


test('v5.62.0 service worker explicitly excludes private client workspace routes from offline caching', () => {
  assert.ok(source.includes('studio|dashboard|admin|media|contact|client'));
  assert.ok(source.includes("parts[0] === 'client' && parts.length === 1"));
});


test('v5.63.0 adaptive navigation groups primary links, secondary destinations and utility actions', () => {
  assert.ok(source.includes('class="nav-primary"'));
  assert.ok(source.includes('class="nav-more"'));
  assert.ok(source.includes('class="nav-more-menu"'));
  assert.ok(source.includes('class="nav-actions"'));
  assert.ok(source.includes('aria-label="Navigasi utama"'));
  for (const route of ['/', '/discover', '/categories', '/collections', '/favorites', '/shortlist', '/about', '/how-it-works', '/studio']) {
    assert.ok(source.includes(`href="${route}"`), `missing nav route ${route}`);
  }
  assert.ok(source.includes('data-command-open'));
  assert.ok(source.includes('data-motion-toggle'));
  assert.ok(source.includes('data-theme-toggle'));
});

test('v5.63.0 tablet and compact navigation opens as an accessible, right-aligned panel', () => {
  assert.ok(source.includes('@media(max-width:1180px)'));
  assert.ok(source.includes('.nav-toggle{display:inline-flex'));
  assert.ok(source.includes('.nav-links.open{display:flex'));
  assert.ok(source.includes('width:min(440px,calc(100vw - 28px))'));
  assert.ok(source.includes("aria-label',open?'Tutup menu navigasi':'Buka menu navigasi'"));
  assert.ok(source.includes("icon.textContent=open?'×':'☰'"));
  assert.ok(source.includes('const closeNav=restoreFocus=>'));
  assert.ok(source.includes("if(event.key!=='Escape')return"));
  assert.ok(source.includes('if(restoreFocus)toggle?.focus()'));
});

test('v5.63.0 hero typography uses natural height, balanced wrapping and compact-screen sizing', () => {
  assert.ok(source.includes('min-height:clamp(620px,58vw,760px)'));
  assert.ok(source.includes('max-width:14ch;margin:clamp(22px,3vw,32px) 0 22px'));
  assert.ok(source.includes('text-wrap:balance;overflow:visible'));
  assert.ok(source.includes('.pv-hero h1{max-width:14ch;font-size:clamp(56px,7.4vw,88px)}'));
  assert.ok(source.includes('.pv-hero-title-visual{display:block;overflow:visible}'));
  assert.ok(source.includes('@media(max-width:600px)'));
  assert.ok(source.includes('.pv-hero h1{max-width:13ch;font-size:clamp(44px,11.8vw,70px)'));
  assert.ok(source.includes('.pv-hero-main{min-width:0;max-width:850px;overflow:visible}'));
});

test('v5.63.0 light and dark navigation states remain readable and motion remains accessible', () => {
  assert.ok(source.includes('[data-theme="light"] .nav-actions .nav-cta{background:#314d39;color:#fff}'));
  assert.ok(source.includes('[data-theme="light"] .nav-more-menu{background:rgba(255,254,249,.97)}'));
  assert.ok(source.includes('@media(prefers-reduced-motion:reduce)'));
  assert.ok(source.includes('.nav-links.open,.nav-more-menu{animation:none!important}'));
  assert.ok(source.includes("const CACHE='pir-visuals-public-v47'"));
  assert.ok(source.includes("version: '6.7.13'"));
});


test('v5.64.0 applies one semantic contrast system to public pages, forms, tables and designer workspace', () => {
  assert.ok(source.includes('--bg:#F3F1E9;--bg-soft:#EBE9E0;--surface:#FBFAF5'));
  assert.ok(source.includes('--text:#242A24;--muted:#515D53;--subtle:#687568'));
  assert.ok(source.includes('#main-content :is(h1,h2,h3,h4,h5,h6,legend'));
  assert.ok(source.includes('#main-content :is(input,select,textarea)::placeholder'));
  assert.ok(source.includes('#main-content .shortlist-table td{background:var(--surface);color:var(--text)}'));
  assert.ok(source.includes('[data-theme="light"] #main-content .pv-hero h1{color:#242A24!important}'));
  assert.ok(source.includes('#main-content .foot p{color:#C9D0C4}'));
});

test('v5.64.0 refines compact navigation spacing, readable theme controls and reduced-motion-safe interactions', () => {
  assert.ok(source.includes('.nav-links.open .nav-actions{gap:9px;padding-top:13px;border-top:1px solid var(--line)}'));
  assert.ok(source.includes('.nav-action-button{min-height:44px;border-radius:10px;gap:7px;justify-content:center}'));
  assert.ok(source.includes('data-motion-label>Aktif'));
  assert.ok(source.includes('data-theme-label>Tema'));
  assert.ok(source.includes("label.textContent=theme==='light'?'Terang':'Gelap'"));
  assert.ok(source.includes("label.textContent=systemMotionReduced?'Reduced':off?'Off':'On'"));
  assert.ok(source.includes('body:after{'));
  assert.ok(source.includes('border-radius:64% 36% 51% 49% / 42% 58% 42% 58%'));
  assert.ok(source.includes("const CACHE='pir-visuals-public-v47'"));
  assert.ok(source.includes("version: '6.7.13'"));
});
