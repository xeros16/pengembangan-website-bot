import { sendStaticBody, serveStaticAsset } from './static-assets.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { DesignerProfile, PortfolioItem, DesignService } from './models.js';
import { DesignerAnalytics, DesignerDashboardAuth, DesignerDashboardSession, PortfolioCollection, DesignerTestimonial, DesignerLead, DesignerAvailability, DesignerNotification, PortfolioSiteContent, SiteAnalyticsEvent, DesignerSignupRequest, ClientMoodboard, SupportTicket, ClientProject, ClientProjectSession, ClientProjectUpdate } from './models.js';
import crypto from 'node:crypto';
import sharp from 'sharp';
import nodemailer from 'nodemailer';
import { promisify } from 'node:util';
const scrypt = promisify(crypto.scrypt);
const dashboardLoginAttempts = new Map();
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRateLimiter, getClientAddress, readCookie, safeTokenEqual, securityHeaders } from './security.js';
import { isSameOriginRequest, normalizeOptionalWhatsApp } from './lead-utils.js';
import { DIRECTORY_PAGE_SIZE, parseDirectoryFilters, buildDirectoryMongoFilter, buildDirectorySort, buildDirectoryRelevancePipeline, getDirectoryPagination, buildDirectoryPageUrl } from './directory-utils.js';
import { buildDesignerFitPipeline } from './matchmaking-utils.js';
import { calculatePortfolioHealth } from './portfolio-health.js';
import { PORTFOLIO_MAX_FILE_BYTES, PORTFOLIO_MAX_FILES, PORTFOLIO_MAX_REQUEST_BYTES, PROFILE_AVATAR_MAX_FILE_BYTES, processPortfolioImageBuffer, processProfileAvatarBuffer } from './portfolio-media.js';
const APP_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(APP_ROOT, '.env') });
dotenv.config();
const securityRateLimiter = createRateLimiter({
  maxEntries: 30000,
  trustCloudflare: process.env.TRUST_CLOUDFLARE_IP_HEADER === 'true',
});

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
const money = value => Number(value) > 0 ? `Rp${Math.round(Number(value)).toLocaleString('id-ID')}` : 'Negosiasi';
function getDesignerAvatarSrc(profile) {
  if (profile?.avatarPath && profile?.designerId) return `/profile-avatar/${encodeURIComponent(profile.designerId)}?v=${encodeURIComponent(path.basename(profile.avatarPath))}`;
  const external = String(profile?.avatarUrl || '');
  return /^https:\/\//i.test(external) ? external : '';
}
const jakartaDateKey = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
function isCalendarDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

const formatDateKey = value => { const [year, month, day] = String(value || '').split('-').map(Number); return year && month && day ? new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : String(value || ''); };
const viewWindow = new Map();
function blockedRetryAfter(...budgets) {
  return Math.max(1, ...budgets.filter(budget => !budget.allowed).map(budget => budget.retryAfterSeconds || 1));
}
function allowCount(req, key, windowMs = 30 * 60 * 1000) {
  const ip = getClientAddress(req, { trustCloudflare: process.env.TRUST_CLOUDFLARE_IP_HEADER === 'true' });
  const digest = crypto.createHash('sha256').update(`${process.env.ANALYTICS_SALT || 'pir-visuals-local'}:${ip}:${key}`).digest('hex');
  const now = Date.now(); const previous = viewWindow.get(digest) || 0;
  if (now - previous < windowMs) return false;
  viewWindow.set(digest, now);
  if (viewWindow.size > 20000) for (const [k, t] of viewWindow) if (now - t > windowMs) viewWindow.delete(k);
  return true;
}
async function incrementDailyMetric(designerId, metric) {
  if (!['views', 'contacts', 'portfolioViews'].includes(metric)) return;
  const today = new Date().toISOString().slice(0, 10);
  const field = metric === 'views' ? 'views' : metric === 'contacts' ? 'contacts' : 'portfolioViews';
  const existing = await DesignerAnalytics.updateOne(
    { designerId, 'daily.date': today },
    { $inc: { [`daily.$.${field}`]: 1 } },
  );
  if (!existing.matchedCount) {
    const inserted = await DesignerAnalytics.updateOne(
      { designerId, 'daily.date': { $ne: today } },
      { $push: { daily: { $each: [{ date: today, views: metric === 'views' ? 1 : 0, contacts: metric === 'contacts' ? 1 : 0, portfolioViews: metric === 'portfolioViews' ? 1 : 0 }], $slice: -90 } } },
    );
    if (!inserted.modifiedCount) {
      await DesignerAnalytics.updateOne({ designerId, 'daily.date': today }, { $inc: { [`daily.$.${field}`]: 1 } });
    }
  }
}
// Filter before the limit so hidden authors never take a public result slot.
function findPublishedWorks(filter, sort, limit, projection) {
  return PortfolioItem.aggregate([
    { $match: filter },
    { $sort: sort },
    { $lookup: {
      from: DesignerProfile.collection.name,
      localField: 'designerId',
      foreignField: 'designerId',
      pipeline: [{ $match: { isPublic: true } }, { $project: { displayName: 1 } }, { $limit: 1 }],
      as: 'publicAuthor',
    } },
    { $unwind: '$publicAuthor' },
    { $limit: limit },
    { $project: projection },
  ]);
}

const editionAssets = new Map([
  ['pir-edition.css', 'text/css; charset=utf-8'],
  ['pir-edition.js', 'application/javascript; charset=utf-8'],
  ['manrope.woff2', 'font/woff2'],
  ['studio-print-560.webp', 'image/webp'],
  ['studio-print-1040.webp', 'image/webp'],
]);

const publicSeoPaths = new Set(['/', '/discover', '/categories', '/for-business', '/about', '/how-it-works', '/contact', '/commands', '/creative-studio']);
const workspaceRoots = new Set(['studio', 'client', 'dashboard', 'admin']);

function getSiteBase() {
  try {
    const url = new URL(process.env.SITE_URL || process.env.PORTFOLIO_PUBLIC_BASE_URL ||
      `http://localhost:${process.env.PORTFOLIO_WEB_PORT || process.env.PORT || 3080}`);
    if (['http:', 'https:'].includes(url.protocol) && !url.username && !url.password) return url.origin;
  } catch {
    return '';
  }
  return '';
}

const translations = {
  id: { portfolio: 'Portofolio', skills: 'Keahlian', pricing: 'Layanan & Harga', contact: 'Hubungi desainer', available: 'Workspace brief opsional aktif', unavailable: 'Workspace brief nonaktif', works: 'Karya pilihan', verified: 'Profil ditinjau PIR', featured: 'Desainer unggulan', empty: 'Belum ada karya yang dipublikasikan.' },
  en: { portfolio: 'Portfolio', skills: 'Skills', pricing: 'Services & Pricing', contact: 'Contact designer', available: 'Optional brief workspace enabled', unavailable: 'Optional brief workspace disabled', works: 'Selected work', verified: 'PIR-reviewed profile', featured: 'Featured designer', empty: 'No published work yet.' },
};

// Kept in the shell module with the shared page selectors and served as a
// cacheable resource so navigation does not resend the base style block.
const shellStyles = Buffer.from(`
  :root{color-scheme:dark;--bg:#101710;--panel:#192319;--panel2:#202d21;--line:#3a4a37;--muted:#b6bdab;--text:#f1f0e6;--mint:#c5c99e;--mint2:#526b45;--gold:#d2c59a}[data-theme="light"]{color-scheme:light;--bg:#f4f6f3;--panel:#fff;--panel2:#edf2ee;--line:#d7e0d8;--muted:#53665c;--text:#17231d;--mint:#167452;--mint2:#167452;--gold:#8a6a25}[data-theme="light"] body{background:radial-gradient(ellipse at 10% -10%,#e2efe7 0,transparent 36%),var(--bg);color:var(--text)}[data-theme="light"] .site-nav,[data-theme="light"] .card,[data-theme="light"] .feature-item,[data-theme="light"] .trust-item,[data-theme="light"] .stat,[data-theme="light"] .hero-panel{background:#fff;color:var(--text);border-color:var(--line)}[data-theme="light"] .nav-links a{color:#31463b}[data-theme="light"] input,[data-theme="light"] select,[data-theme="light"] textarea{background:#fff;color:#17231d;border-color:#cbd8ce}[data-theme="light"] .nav-toggle,[data-theme="light"] .favorite-btn{background:#edf3ee;color:#20352a}[data-theme="light"] .profile-hero,[data-theme="light"] .cta-band{background:linear-gradient(135deg,#e3f0e8,#f8faf8 65%,#e8eee9);color:#17231d;border-color:#cbd8ce}[data-theme="light"] .footer-grid strong{color:#17231d}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:radial-gradient(ellipse at 10% -10%,#293b2b 0,transparent 36%),var(--bg);color:var(--text);font:15px/1.65 Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}a{color:var(--mint);text-decoration:none}a:hover{color:#c0ffe9}.wrap{max-width:1180px;margin:auto;padding:22px 22px 64px}.site-nav{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:12px 16px;margin:0 0 26px;border:1px solid #2b3b4e;background:#0e1723eF;border-radius:18px;position:sticky;top:10px;z-index:20;backdrop-filter:blur(16px)}.brand{display:flex;align-items:center;gap:10px;color:var(--text);font-weight:850;letter-spacing:.02em}.brand-mark{display:grid;place-items:center;width:36px;height:36px;border-radius:12px;background:linear-gradient(135deg,#526b45,#d6d1b7);color:#182318;font-weight:900}.nav-links{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.nav-links a{padding:8px 12px;border-radius:10px;color:#c5d1df;font-weight:650}.nav-links a:hover{background:#1d2b3b;color:var(--mint)}.nav-links .nav-cta{background:var(--mint2);color:white}.theme-toggle{background:transparent;color:var(--text);border:1px solid var(--line);border-radius:10px;padding:8px 10px;cursor:pointer;font:inherit;font-weight:650}.nav-toggle{display:none;background:#1b2a3a;color:white;border:1px solid var(--line);padding:8px 12px;border-radius:10px}.card{background:linear-gradient(155deg,#172333,#111a27);border:1px solid var(--line);border-radius:20px;padding:22px;margin:16px 0;box-shadow:0 10px 30px #00000018}.muted{color:var(--muted)}.tag{display:inline-block;background:#203348;border:1px solid #30475f;color:#c5e9dc;border-radius:99px;padding:4px 10px;margin:3px;font-size:12px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr));gap:16px}.work{overflow:hidden;padding:0}.work img{width:100%;aspect-ratio:4/3;object-fit:cover;background:#222}.work div{padding:16px}.price{font-weight:800;color:var(--mint)}.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;background:linear-gradient(135deg,#16845f,#20a47b);color:white;padding:11px 17px;border:0;border-radius:12px;font-weight:750;cursor:pointer;box-shadow:0 6px 18px #08704b33}.btn:hover{color:white;filter:brightness(1.1);transform:translateY(-1px)}.btn-secondary{background:#203348;border:1px solid #39516b;box-shadow:none}.btn-ghost{background:transparent;border:1px solid var(--line);color:var(--text);box-shadow:none}.hero{padding:46px 0 30px}.hero h1{font-size:clamp(34px,6vw,64px);line-height:1.04;letter-spacing:-.045em;margin:0 0 18px;max-width:820px}.hero p{max-width:700px}.eyebrow{color:var(--mint);font-weight:800;text-transform:uppercase;letter-spacing:.14em;font-size:11px}.status{font-size:14px}.foot{color:#8290a3;text-align:center;font-size:13px;margin-top:48px;padding:22px;border-top:1px solid var(--line)}input,select,textarea{font:inherit;color:var(--text);background:#0b1420;border:1px solid #35485f;border-radius:11px;padding:12px;max-width:100%}input:focus,select:focus,textarea:focus{outline:2px solid #4cbf98;outline-offset:1px}label{font-weight:650;color:#d9e5f1}.search-panel{display:grid;grid-template-columns:2fr 1fr 1fr 1fr 1fr;gap:12px;align-items:end}.stat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.stat{padding:15px;border:1px solid var(--line);border-radius:15px;background:#101b28}.stat strong{display:block;font-size:25px;line-height:1.2}.designer-card{position:relative;display:flex;flex-direction:column;min-height:310px}.designer-card .card-bottom{margin-top:auto;padding-top:14px;display:flex;align-items:center;justify-content:space-between;gap:10px}.favorite-btn{background:#1a2939;color:#e6edf5;border:1px solid #3b5068;border-radius:999px;padding:8px 12px;cursor:pointer;font-weight:700}.favorite-btn[aria-pressed="true"]{color:#ff9aa9;border-color:#9c5362;background:#351f2a}.filter-row{display:flex;gap:12px;flex-wrap:wrap;align-items:center}.section-head{display:flex;align-items:end;justify-content:space-between;gap:16px;margin:26px 0 12px}.section-head h2{margin:0;font-size:25px}.profile-hero{padding:34px;border:1px solid var(--line);border-radius:24px;background:linear-gradient(135deg,#182e36,#172333 55%,#20273b)}.empty-state{text-align:center;padding:40px 20px}.pill-count{display:inline-grid;place-items:center;min-width:22px;height:22px;border-radius:99px;background:#244c42;color:#b5f4d7;font-size:12px;margin-left:4px}.footer-grid{display:grid;grid-template-columns:1.3fr 1fr 1fr 1fr;gap:20px;text-align:left;padding:8px 0 20px}.footer-grid strong{color:#eaf3fa}.footer-grid p{font-size:13px;line-height:1.9}.footer-bottom{border-top:1px solid var(--line);padding-top:18px}.company-hero{padding:76px 0 62px;display:grid;grid-template-columns:1.25fr .75fr;gap:36px;align-items:center}.company-hero h1{font-size:clamp(42px,6.5vw,76px);max-width:760px}.hero-panel{border:1px solid #355064;background:linear-gradient(150deg,#193b3c,#142535 65%,#22283a);border-radius:26px;padding:28px;box-shadow:0 25px 70px #0004}.hero-panel .mini-row{display:flex;justify-content:space-between;padding:13px 0;border-bottom:1px solid #ffffff1c}.hero-panel .mini-row:last-child{border:0}.trust-strip{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:14px 0 40px}.trust-item{padding:18px;border:1px solid var(--line);border-radius:15px;background:#111c29}.trust-item strong{display:block;font-size:23px}.feature-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}.feature-item{padding:24px;border:1px solid var(--line);border-radius:18px;background:linear-gradient(150deg,#172536,#111a26)}.feature-icon{width:42px;height:42px;display:grid;place-items:center;border-radius:13px;background:#21483e;color:#a9f3d5;font-size:20px;margin-bottom:14px}.cta-band{padding:32px;border:1px solid #3b655c;border-radius:22px;background:linear-gradient(110deg,#153b35,#152b37 65%,#242b3b);display:flex;justify-content:space-between;align-items:center;gap:24px;margin:36px 0}.eyebrow{display:inline-block}.section-space{margin:44px 0}.section-space>h2{font-size:30px;letter-spacing:-.03em}.designer-card{min-height:280px}.legal-copy{max-width:820px}.legal-copy h2{margin-top:28px}.skip-link{position:absolute;left:-9999px;top:8px;background:white;color:#111;padding:10px;z-index:100}.skip-link:focus{left:8px}@media(max-width:760px){.footer-grid{grid-template-columns:1fr 1fr}.company-hero{grid-template-columns:1fr;padding:42px 0 30px}.hero-panel{margin-top:4px}.trust-strip{grid-template-columns:1fr 1fr}.feature-grid{grid-template-columns:1fr}.cta-band{display:block}.wrap{padding:12px 14px 42px}.site-nav{top:6px;padding:10px 12px}.nav-toggle{display:block}.nav-links{display:none;position:absolute;top:62px;left:0;right:0;padding:12px;background:#101b28;border:1px solid var(--line);border-radius:14px;flex-direction:column;align-items:stretch}.nav-links.open{display:flex}.nav-links a{padding:11px}.hero{padding:30px 0 18px}.search-panel{grid-template-columns:1fr}.stat-grid{grid-template-columns:1fr 1fr}.profile-hero{padding:22px}.section-head{align-items:start;flex-direction:column}}@media(max-width:420px){.stat-grid{grid-template-columns:1fr 1fr}.brand{font-size:14px}}
  
/* PIR Visual System v5.39 — pear identity, premium contrast and accessible typography */
:root{color-scheme:dark;--bg:#17191C;--bg-soft:#1E2226;--surface:#24292E;--surface-raised:#2C3238;--line:#424A52;--text:#F1F2EF;--muted:#BBC1C6;--subtle:#9BA4AC;--accent:#AAB69A;--accent-strong:#C5CFB8;--accent-ink:#202820;--gold:#C5B990;--danger:#F1A6A0;--shadow:0 24px 70px rgba(0,0,0,.30)}
[data-theme="light"]{color-scheme:light;--bg:#F3F2ED;--bg-soft:#EAE9E2;--surface:#FCFBF8;--surface-raised:#FFFFFF;--line:#D5D6CF;--text:#202522;--muted:#515B55;--subtle:#66716A;--accent:#536B4C;--accent-strong:#354B36;--accent-ink:#FFFFFF;--gold:#78663D;--danger:#A53F3A;--shadow:0 22px 60px rgba(38,48,36,.10)}
html{background:var(--bg);scroll-padding-top:100px}
body{background:radial-gradient(ellipse at 82% -10%,rgba(170,182,154,.09),transparent 34%),radial-gradient(ellipse at 0% 22%,rgba(132,143,151,.07),transparent 34%),var(--bg);color:var(--text);font-family:Inter,"Aptos",ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:-.008em}
a{color:var(--accent-strong);text-underline-offset:3px}
a:hover{color:var(--gold)}
.wrap{max-width:1280px;padding:26px 28px 76px}
.site-nav{background:color-mix(in srgb,var(--surface) 90%,transparent);border:1px solid var(--line);border-radius:22px;padding:12px 18px;box-shadow:var(--shadow);backdrop-filter:blur(22px)}
.brand{min-width:210px;gap:12px;color:var(--text);text-decoration:none}
.brand img{border-radius:50%;object-fit:cover;border:1px solid var(--line);background:#DAD7CD;box-shadow:0 4px 18px rgba(0,0,0,.12)}.brand-emblem{width:44px;height:44px}.brand-avatar{width:34px;height:34px;margin-left:-4px}
.brand-copy{display:flex;flex-direction:column;line-height:1.18;gap:4px;min-width:0}
.brand-copy strong{font-size:14px;letter-spacing:.045em;color:var(--text);max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.brand-copy small{font-size:9px;letter-spacing:.15em;font-weight:800;color:var(--muted)}
.nav-links{gap:4px}
.nav-links a{color:var(--muted);font-size:13px;padding:9px 11px;border-radius:12px}
.nav-links a:hover{background:var(--surface-raised);color:var(--text)}
.nav-links .nav-cta{background:var(--accent);color:var(--accent-ink);font-weight:800}
.theme-toggle,.nav-toggle{background:var(--surface-raised);color:var(--text);border:1px solid var(--line);border-radius:12px;padding:9px 12px}
.card,.stat,.feature-item,.trust-item,.hero-panel{background:linear-gradient(145deg,var(--surface-raised),var(--surface));color:var(--text);border:1px solid var(--line);border-radius:22px;box-shadow:0 12px 34px rgba(0,0,0,.10)}
.card{padding:24px;margin:18px 0}
.stat{background:var(--surface);padding:18px}
.muted,.foot,.status{color:var(--muted)}
.eyebrow{color:var(--accent-strong);font-size:10px;letter-spacing:.19em}
h1,h2,h3,h4,strong{color:var(--text)}
h1{letter-spacing:-.045em}
.hero{padding:58px 0 38px}
.hero h1{font-size:clamp(40px,6vw,76px);line-height:.99;letter-spacing:-.055em;max-width:900px}
.hero p,.muted{color:var(--muted)}
.tag{background:color-mix(in srgb,var(--accent) 18%,var(--surface));border:1px solid color-mix(in srgb,var(--accent) 40%,var(--line));color:var(--accent-strong);font-weight:700}
.price{color:var(--accent-strong)}
.btn{background:linear-gradient(135deg,#899783,#B7C0AA);color:#203528;border:1px solid rgba(255,255,255,.12);border-radius:13px;font-weight:850;box-shadow:0 9px 24px rgba(0,0,0,.16)}
.btn:hover{color:#203528;filter:brightness(1.04)}
.btn-secondary{background:var(--surface-raised);border:1px solid var(--line);color:var(--text);box-shadow:none}
.btn-secondary:hover{color:var(--text)}
.btn-ghost{background:transparent;color:var(--text);border:1px solid var(--line)}
input,select,textarea{background:var(--bg-soft);color:var(--text);border:1px solid var(--line);border-radius:12px}
input::placeholder,textarea::placeholder{color:var(--subtle);opacity:1}
input:focus,select:focus,textarea:focus{outline:3px solid color-mix(in srgb,var(--accent) 42%,transparent);outline-offset:2px;border-color:var(--accent)}
label{color:var(--text)}
.profile-hero,.cta-band,.company-hero{background:linear-gradient(125deg,var(--surface-raised),var(--surface));color:var(--text);border:1px solid var(--line);border-radius:28px;box-shadow:var(--shadow)}
.designer-card{background:linear-gradient(155deg,var(--surface-raised),var(--surface))}
.work{background:var(--surface);border:1px solid var(--line);border-radius:20px;overflow:hidden}
.work img{background:var(--bg-soft)}
.favorite-btn{background:var(--surface-raised);color:var(--text);border-color:var(--line)}
.section-head h2{color:var(--text)}
.foot{border-color:var(--line)}
.search-panel{background:var(--surface);border:1px solid var(--line);padding:18px;border-radius:20px}
.pill-count{background:var(--accent);color:var(--accent-ink)}
[data-theme="light"] body{background:radial-gradient(ellipse at 82% -10%,rgba(120,132,108,.08),transparent 34%),var(--bg);color:var(--text)}
[data-theme="light"] .nav-links a{color:var(--muted)}
[data-theme="light"] .nav-links a:hover{background:var(--bg-soft);color:var(--text)}
[data-theme="light"] .card,[data-theme="light"] .stat,[data-theme="light"] .feature-item,[data-theme="light"] .trust-item,[data-theme="light"] .hero-panel,[data-theme="light"] .designer-card,[data-theme="light"] .work{background:var(--surface);color:var(--text);border-color:var(--line)}
[data-theme="light"] .tag{background:#E6EBDD;color:#385B43;border-color:#C9D4BE}
[data-theme="light"] .btn-secondary{background:#E8E5D9;color:#27382A;border-color:#D2CEBF}
[data-theme="light"] .btn-ghost{color:var(--text)}
[data-theme="light"] .profile-hero,[data-theme="light"] .cta-band,[data-theme="light"] .company-hero{background:linear-gradient(125deg,#E6EBDD,#FAF8F1 70%);color:var(--text)}

.company-hero{position:relative;overflow:hidden;padding:78px 42px 72px;isolation:isolate}
.company-hero:before{content:none;display:none}
.company-hero>*{position:relative;z-index:1}
.company-hero .hero-panel{background:color-mix(in srgb,var(--surface-raised) 94%,transparent);border-color:var(--line);backdrop-filter:blur(14px)}
.trust-strip{gap:14px;margin:22px 0 52px}
.trust-item{background:var(--surface);border-color:var(--line);border-radius:18px;padding:20px}
.trust-item strong{color:var(--accent-strong);font-size:26px}
.feature-item{background:var(--surface);border-color:var(--line);border-radius:20px}
.feature-icon{background:color-mix(in srgb,var(--accent) 24%,var(--surface));color:var(--accent-strong);border:1px solid var(--line)}
.footer-grid strong{color:var(--text)}
.footer-bottom,.foot{color:var(--muted)}
[data-theme="light"] .company-hero:before{content:none;display:none}
[data-theme="light"] .company-hero .hero-panel{background:rgba(255,255,255,.82)}
[data-theme="light"] .footer-grid strong{color:var(--text)}
[data-theme="light"] .nav-toggle{background:var(--surface-raised);color:var(--text)}
@media(max-width:850px){.wrap{padding:16px 16px 52px}.site-nav{align-items:flex-start;flex-wrap:wrap;top:6px}.brand{min-width:0}.nav-toggle{display:block;margin-left:auto}.nav-links{display:none;width:100%;padding-top:8px}.nav-links.open{display:flex;flex-direction:column;align-items:stretch}.nav-links a,.theme-toggle{width:100%;text-align:left}.search-panel{grid-template-columns:1fr 1fr}.hero{padding:36px 0 24px}}
@media(max-width:520px){.wrap{padding:12px 12px 40px}.site-nav{border-radius:16px;padding:10px 12px}.brand-emblem{width:40px;height:40px}.brand-copy strong{max-width:180px}.hero h1{font-size:clamp(36px,12vw,54px)}.card{padding:18px;border-radius:18px}.search-panel,.stat-grid{grid-template-columns:1fr}.section-head{align-items:flex-start;flex-direction:column}}

/* v5.39.1 contrast patch: neutral dark surfaces and readable designer portal */
.nav-links .nav-cta{background:#AAB69A;color:#202820;border:1px solid #899783}
.nav-links .nav-cta:hover{background:#C5CFB8;color:#202820}
[data-theme="light"] .nav-links .nav-cta{background:#354B36;color:#FFFFFF!important;border-color:#354B36}
[data-theme="light"] .nav-links .nav-cta:hover{background:#263B2A;color:#FFFFFF!important}
[data-theme="light"] #main-content{color:#202522}
[data-theme="light"] #main-content h1,
[data-theme="light"] #main-content h2,
[data-theme="light"] #main-content h3,
[data-theme="light"] #main-content h4,
[data-theme="light"] #main-content strong,
[data-theme="light"] #main-content legend{color:#202522}
[data-theme="light"] #main-content p,
[data-theme="light"] #main-content li,
[data-theme="light"] #main-content .muted,
[data-theme="light"] #main-content .status,
[data-theme="light"] #main-content .foot{color:#515B55}
[data-theme="light"] #main-content label{display:block;color:#303A33;font-weight:700}
[data-theme="light"] #main-content input,
[data-theme="light"] #main-content select,
[data-theme="light"] #main-content textarea{background:#FFFFFF!important;color:#202522!important;border:1px solid #BFC5BD!important}
[data-theme="light"] #main-content input::placeholder,
[data-theme="light"] #main-content textarea::placeholder{color:#68736B!important;opacity:1}
[data-theme="light"] #main-content input:focus,
[data-theme="light"] #main-content select:focus,
[data-theme="light"] #main-content textarea:focus{border-color:#536B4C!important;outline:3px solid rgba(83,107,76,.20)}
[data-theme="light"] #main-content .card,
[data-theme="light"] #main-content .stat,
[data-theme="light"] #main-content .feature-item,
[data-theme="light"] #main-content .trust-item,
[data-theme="light"] #main-content .hero-panel,
[data-theme="light"] #main-content .designer-card,
[data-theme="light"] #main-content .work,
[data-theme="light"] #main-content .search-panel{background:#FCFBF8;color:#202522;border-color:#D5D6CF}
[data-theme="light"] #main-content .btn{background:linear-gradient(135deg,#536B4C,#718568);color:#FFFFFF!important;border-color:#536B4C}
[data-theme="light"] #main-content .btn-secondary{background:#E8EAE4;color:#26352A!important;border-color:#C8CEC5}
[data-theme="light"] #main-content .btn-ghost{background:transparent;color:#354B36!important;border-color:#AEB8AA}
[data-theme="light"] #main-content .tag{background:#E9EDE5;color:#354B36;border-color:#C9D3C2}
[data-theme="light"] #main-content a:not(.btn):not(.nav-cta){color:#354B36}
[data-theme="light"] #main-content .eyebrow{color:#536B4C}
[data-theme="light"] #main-content .price{color:#354B36}
[data-theme="light"] .brand-copy strong{color:#202522}
[data-theme="light"] .brand-copy small{color:#515B55}
[data-theme="dark"] body{background:radial-gradient(ellipse at 80% -12%,rgba(170,182,154,.08),transparent 36%),var(--bg);color:var(--text)}
[data-theme="dark"] .company-hero:before{content:none;display:none}

/* v5.40 homepage carousel and dimensional premium dark theme */
:root{--bg:#15181b;--bg-soft:#1c2125;--surface:#22282d;--surface-raised:#2b3238;--line:#414a51;--text:#f2f2ed;--muted:#bbc1c4;--subtle:#99a3a9;--accent:#aab69a;--accent-strong:#c5cfb8;--accent-ink:#202820}
[data-theme="dark"] body{background:radial-gradient(ellipse at 12% 0%,rgba(145,160,133,.13),transparent 32%),radial-gradient(ellipse at 92% 22%,rgba(102,119,131,.13),transparent 34%),linear-gradient(145deg,#15181b 0%,#1a2025 48%,#171b1f 100%);background-attachment:fixed}
[data-theme="dark"] .card,[data-theme="dark"] .stat,[data-theme="dark"] .feature-item,[data-theme="dark"] .trust-item,[data-theme="dark"] .hero-panel{background:linear-gradient(145deg,rgba(49,58,64,.94),rgba(31,37,42,.98));border-color:rgba(190,202,194,.13);box-shadow:0 18px 48px rgba(0,0,0,.20),inset 0 1px 0 rgba(255,255,255,.035)}
[data-theme="dark"] .site-nav{background:rgba(31,37,42,.82);border-color:rgba(190,202,194,.16);backdrop-filter:blur(22px)}
[data-theme="dark"] .company-hero{background:radial-gradient(ellipse at 80% 0%,rgba(159,177,145,.15),transparent 45%),linear-gradient(135deg,#252d32,#1b2126 70%);border-color:rgba(190,202,194,.16)}
[data-theme="dark"] .btn{background:linear-gradient(135deg,#87977f,#b2bea5);color:#202820}
[data-theme="dark"] .tag{background:rgba(170,182,154,.13);border-color:rgba(170,182,154,.28)}
.home-carousel{position:relative;margin:26px 0 30px;padding:20px;border:1px solid var(--line);border-radius:28px;background:linear-gradient(145deg,var(--surface-raised),var(--surface));box-shadow:0 24px 60px rgba(0,0,0,.18);overflow:hidden}
[data-theme="dark"] .home-carousel{background:radial-gradient(ellipse at 80% 20%,rgba(164,181,151,.13),transparent 42%),linear-gradient(135deg,#2b3339,#20262c 68%,#252c30);border-color:rgba(198,208,198,.18)}
.carousel-topline,.carousel-controls{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:4px 4px 14px}
.carousel-count{font-size:12px;color:var(--muted);font-variant-numeric:tabular-nums}.carousel-count b{color:var(--text)}
.carousel-track{position:relative;min-height:310px}
.carousel-slide{display:none;position:relative;min-height:310px;overflow:hidden;border-radius:20px;background:linear-gradient(110deg,var(--surface-raised),var(--surface));isolation:isolate}
.carousel-slide.is-active{display:flex;animation:carouselIn .55s ease both}
@keyframes carouselIn{from{opacity:.55;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
.carousel-copy{position:relative;z-index:2;width:58%;padding:clamp(24px,4vw,54px);display:flex;flex-direction:column;align-items:flex-start;justify-content:center}
.carousel-kicker{font-size:10px;letter-spacing:.18em;font-weight:850;color:var(--accent-strong);text-transform:uppercase}
.carousel-kind{margin-top:12px;padding:6px 10px;border-radius:999px;background:rgba(170,182,154,.14);border:1px solid rgba(170,182,154,.26);font-size:11px;color:var(--text)}
.carousel-copy h2{font-size:clamp(28px,4vw,48px);line-height:1.05;letter-spacing:-.04em;margin:15px 0 10px;max-width:600px}
.carousel-copy p{font-size:14px;line-height:1.7;color:var(--muted);max-width:520px;margin:0 0 22px}
.carousel-cta{display:inline-flex;gap:12px;align-items:center;padding:12px 17px;border-radius:12px;background:var(--accent);color:#202820!important;font-size:13px;font-weight:850;text-decoration:none}
.carousel-art{position:absolute;right:0;top:0;bottom:0;width:48%;overflow:hidden;background:linear-gradient(135deg,#3c4943,#20282d)}
.carousel-art img{width:100%;height:100%;object-fit:cover;opacity:.86;mask-image:linear-gradient(90deg,transparent 0%,rgba(0,0,0,.55) 22%,#000 55%)}
.carousel-art:after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(32,39,43,.8),transparent 48%),linear-gradient(0deg,rgba(20,24,27,.32),transparent 50%)}
.carousel-art-placeholder{height:100%;display:grid;place-items:center;background:radial-gradient(circle at 60% 40%,rgba(177,193,159,.36),transparent 35%),linear-gradient(135deg,#35413c,#242b30)}
.carousel-art-placeholder span{font-size:100px;font-weight:900;letter-spacing:-.1em;color:rgba(238,242,231,.18)}
.carousel-controls{padding:15px 4px 2px}
.carousel-dots{display:flex;gap:7px;align-items:center}
.carousel-dots button{width:8px;height:8px;border:0;border-radius:99px;background:var(--subtle);opacity:.45;cursor:pointer;padding:0;transition:all .2s}
.carousel-dots button[aria-current="true"]{width:26px;opacity:1;background:var(--accent)}
.carousel-arrows{display:flex;gap:8px}
.carousel-arrows button{width:36px;height:36px;border-radius:50%;border:1px solid var(--line);background:var(--surface-raised);color:var(--text);cursor:pointer}
.banner-editor-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin:18px 0}
.banner-editor{margin:0!important;padding:18px!important}
.banner-editor label{display:block;margin:10px 0 5px;font-size:12px;font-weight:700}
.banner-editor input:not([type=checkbox]),.banner-editor textarea,.banner-editor select{width:100%;padding:10px;margin:4px 0 8px}
@media(max-width:760px){.home-carousel{padding:12px;border-radius:20px}.carousel-track,.carousel-slide{min-height:390px}.carousel-slide.is-active{display:flex;flex-direction:column-reverse}.carousel-copy{width:100%;padding:22px;justify-content:flex-end}.carousel-art{position:absolute;width:100%;height:52%;bottom:auto;mask-image:linear-gradient(#000 55%,transparent 100%)}.carousel-art img{mask-image:linear-gradient(180deg,#000 50%,transparent 100%)}.carousel-copy h2{font-size:30px;margin-top:10px}.carousel-copy p{font-size:13px;margin-bottom:15px}.banner-editor-grid{grid-template-columns:1fr}}
@media(prefers-reduced-motion:reduce){.carousel-slide.is-active{animation:none}}

/* Designer reputation system */
.reputation-summary{display:flex;align-items:center;gap:20px;padding:18px 0}
.reputation-score{font-size:46px;line-height:1;font-weight:850;letter-spacing:-.06em;color:var(--text)}
.reputation-score span{font-size:16px;color:var(--muted);letter-spacing:0}
.reputation-stars{color:#d6b66d;letter-spacing:2px;font-size:17px;white-space:nowrap}
.reputation-top{background:linear-gradient(120deg,rgba(193,163,99,.2),rgba(170,182,154,.16));border-color:rgba(193,163,99,.45)}
.reputation-panel{margin:24px 0}
.review-grid{margin-top:12px}
.review-card{padding:18px}
.review-card-head{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
.review-verified{color:#64875e;font-weight:700}
[data-theme="dark"] .review-verified{color:#b7c99f}

/* v5.43 premium editorial redesign */
:root{--pv-ink:#20231f;--pv-paper:#e9e7df;--pv-sage:#aab69a;--pv-olive:#65765c;--pv-gold:#c7b98d}
.wrap{max-width:1360px;padding:22px clamp(16px,4vw,58px) 90px}
.site-nav{border-radius:18px;padding:11px 16px;margin-bottom:34px}
.premium-intro{position:relative;display:grid;grid-template-columns:minmax(0,1.4fr) minmax(270px,.6fr);gap:clamp(28px,6vw,90px);align-items:end;padding:clamp(54px,8vw,112px) 0 clamp(52px,7vw,88px);overflow:hidden}
.premium-intro:before{content:"";position:absolute;width:460px;height:460px;border-radius:50%;right:7%;top:-25%;background:radial-gradient(circle,rgba(170,182,154,.15),transparent 68%);pointer-events:none}
.premium-intro-copy{position:relative;z-index:1}
.premium-intro .eyebrow,.section-space>.eyebrow,.section-head .eyebrow{font-size:10px;letter-spacing:.19em;font-weight:850;color:var(--accent-strong)}
.premium-intro .eyebrow i{display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--gold);margin-right:9px;box-shadow:0 0 0 5px rgba(199,185,141,.12)}
.premium-intro h1{font-size:clamp(48px,7.7vw,108px);line-height:.99;letter-spacing:-.075em;max-width:950px;margin:28px 0 22px;font-weight:760}
.premium-lede{font-size:clamp(16px,1.6vw,20px);line-height:1.65;color:var(--muted);max-width:680px}
.premium-actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:30px}
.premium-actions .btn{padding:14px 20px;border-radius:7px;letter-spacing:.01em}
.premium-actions .btn span{margin-left:16px}
.premium-proof{display:flex;gap:11px;align-items:center;flex-wrap:wrap;margin-top:40px;color:var(--subtle);font-size:9px;letter-spacing:.15em;font-weight:800}
.premium-stats{position:relative;z-index:1;border:1px solid var(--line);border-radius:18px;padding:24px;background:linear-gradient(145deg,color-mix(in srgb,var(--surface-raised) 92%,var(--accent) 8%),var(--surface));box-shadow:var(--shadow);overflow:hidden}
.premium-stats:after{content:"";position:absolute;width:190px;height:190px;right:-85px;bottom:-95px;border-radius:50%;border:1px solid color-mix(in srgb,var(--accent) 45%,transparent);box-shadow:0 0 0 18px color-mix(in srgb,var(--accent) 5%,transparent),0 0 0 38px color-mix(in srgb,var(--accent) 4%,transparent)}
.premium-stats-top{display:flex;justify-content:space-between;font-size:9px;letter-spacing:.16em;font-weight:850;color:var(--muted)}
.live-dot{color:var(--accent-strong)}
.premium-stat-main{display:flex;align-items:end;gap:15px;padding:36px 0 28px;border-bottom:1px solid var(--line)}
.premium-stat-main strong{font-size:clamp(56px,6vw,82px);line-height:.85;letter-spacing:-.08em;font-weight:750}
.premium-stat-main span{font-size:12px;line-height:1.35;color:var(--muted)}
.premium-stat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding-top:20px}
.premium-stat-grid div{display:flex;flex-direction:column;gap:4px}
.premium-stat-grid strong{font-size:22px;letter-spacing:-.04em}
.premium-stat-grid span{font-size:10px;color:var(--muted)}
.premium-stats>p{font-size:11px;color:var(--muted);margin:23px 0 0;letter-spacing:.02em}
.home-carousel{margin:4px 0 72px}
.carousel-slide{min-height:clamp(320px,43vw,510px);border-radius:18px}
.carousel-copy{padding:clamp(24px,5vw,64px);max-width:680px}
.carousel-copy h2{font-size:clamp(34px,5vw,65px);letter-spacing:-.06em;line-height:1.02}
.carousel-copy p{font-size:15px;max-width:470px}
.carousel-art{border-radius:0 18px 18px 0}
.carousel-art:before{content:"";position:absolute;inset:0;background:linear-gradient(90deg,var(--surface) 0%,transparent 55%);z-index:1;pointer-events:none}
.trust-strip{margin:0 0 84px;gap:0;border-top:1px solid var(--line);border-bottom:1px solid var(--line);padding:18px 0}
.trust-item{background:transparent!important;border:0;border-radius:0;padding:12px 20px;border-right:1px solid var(--line)}
.trust-item:last-child{border-right:0}
.trust-item strong{font-size:12px;color:var(--gold);letter-spacing:.15em}
.trust-item span{font-size:12px}
.section-space{margin:84px 0}
.section-space>h2,.section-head h2{font-size:clamp(32px,4vw,52px);letter-spacing:-.06em;line-height:1.05;margin:12px 0}
.section-head{align-items:end;margin-bottom:25px}
.section-head .btn{white-space:nowrap}
.feature-grid{gap:12px}
.feature-item{border-radius:14px;padding:28px;min-height:225px}
.feature-icon{background:color-mix(in srgb,var(--accent) 16%,var(--surface));color:var(--accent-strong);border:1px solid var(--line)}
.designer-card,.work{border-radius:15px;overflow:hidden}
.designer-card{padding:24px}
.work{padding:0}
.work img{width:100%;height:260px;object-fit:cover;display:block}
.work>div{padding:18px 20px}
.cta-band{border-radius:16px;padding:clamp(26px,5vw,56px);background:linear-gradient(115deg,color-mix(in srgb,var(--surface-raised) 86%,var(--accent) 14%),var(--surface));border-color:var(--line)}
.cta-band h2{font-size:clamp(30px,4vw,48px);letter-spacing:-.05em;line-height:1.05}
.foot{margin-top:90px;padding-top:32px;border-top:1px solid var(--line)}
@media(max-width:850px){.premium-intro{grid-template-columns:1fr;gap:30px;padding:54px 0}.premium-stats{max-width:520px}.trust-strip{grid-template-columns:repeat(2,1fr)}.trust-item:nth-child(2){border-right:0}.trust-item:nth-child(-n+2){border-bottom:1px solid var(--line)}}
@media(max-width:600px){.premium-intro{padding:36px 0 48px}.premium-intro h1{font-size:clamp(46px,13vw,70px)}.premium-proof{font-size:8px;gap:7px}.premium-stats{padding:18px}.home-carousel{margin-bottom:48px}.carousel-slide{min-height:420px}.carousel-copy{padding:24px}.carousel-art{opacity:.38;border-radius:16px}.carousel-art:before{background:linear-gradient(90deg,var(--surface) 0%,color-mix(in srgb,var(--surface) 75%,transparent) 100%)}.trust-strip{margin-bottom:56px}.trust-item{padding:12px 8px}.section-space{margin:60px 0}.section-head{align-items:start}.section-head>.btn{align-self:start}.work img{height:220px}}

/* v5.44 designer showcase and case-study system */
.designer-showcase,.case-study{max-width:1240px;margin:0 auto}
.showcase-breadcrumb{display:flex;gap:10px;align-items:center;color:var(--subtle);font-size:9px;letter-spacing:.15em;font-weight:800;padding:12px 0 26px;flex-wrap:wrap}
.showcase-breadcrumb a{color:var(--muted)}
.designer-cover{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(260px,.75fr);gap:clamp(28px,6vw,80px);align-items:center;padding:30px 0 60px}
.designer-cover-copy .eyebrow{display:block;margin:25px 0 16px}
.showcase-badges{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.showcase-availability{font-size:10px;letter-spacing:.12em;font-weight:800;color:var(--muted);padding:7px 10px;border:1px solid var(--line);border-radius:99px}
.showcase-availability.is-open{color:var(--accent-strong);border-color:color-mix(in srgb,var(--accent) 50%,var(--line))}
.designer-cover h1{font-size:clamp(52px,8vw,104px);line-height:.94;letter-spacing:-.075em;margin:16px 0 22px}
.designer-intro{font-size:clamp(16px,1.7vw,21px);line-height:1.65;color:var(--muted);max-width:690px}
.showcase-actions{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-top:26px}
.showcase-socials{display:flex;gap:18px;flex-wrap:wrap;margin-top:26px}
.showcase-socials a{font-size:11px;color:var(--muted);font-weight:750}
.designer-portrait{position:relative;min-height:390px;border-radius:18px;overflow:hidden;background:linear-gradient(145deg,var(--surface-raised),var(--surface));border:1px solid var(--line)}
.designer-portrait img{width:100%;height:100%;min-height:390px;max-height:560px;object-fit:cover;display:block}
.portrait-placeholder{display:grid;place-items:center;min-height:390px;font-size:160px;font-weight:800;color:var(--accent);background:radial-gradient(circle at 50% 35%,color-mix(in srgb,var(--accent) 20%,var(--surface)),var(--surface))}
.portrait-caption{position:absolute;bottom:14px;left:16px;color:white;text-shadow:0 1px 8px #000;font-size:9px;letter-spacing:.16em;font-weight:800}
.showcase-facts{display:grid;grid-template-columns:repeat(4,1fr);border-top:1px solid var(--line);border-bottom:1px solid var(--line);padding:22px 0;gap:18px}
.showcase-facts div{display:flex;flex-direction:column;gap:6px}
.showcase-facts span{font-size:9px;letter-spacing:.14em;color:var(--subtle);font-weight:800}
.showcase-facts strong{font-size:14px}
.showcase-section{margin:88px 0}
.showcase-section-heading{display:flex;justify-content:space-between;align-items:end;gap:30px;margin-bottom:28px}
.showcase-section-heading .eyebrow{font-size:10px;letter-spacing:.16em;font-weight:850;color:var(--accent-strong)}
.showcase-section-heading h2{font-size:clamp(34px,5vw,58px);line-height:1;letter-spacing:-.065em;margin:12px 0 0}
.showcase-section-heading>p{max-width:360px;color:var(--muted);font-size:13px}
.showcase-period{color:var(--gold)}
.capability-layout{display:grid;grid-template-columns:1fr 1fr;gap:30px;border-top:1px solid var(--line);padding-top:24px}
.capability-tags{display:flex;gap:9px;flex-wrap:wrap;align-content:start}
.capability-tags .tag{padding:9px 13px;border-radius:99px;background:var(--surface-raised);color:var(--text);border-color:var(--line)}
.capability-description{color:var(--muted);max-width:540px}
.showcase-work-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:34px 22px}
.showcase-work{display:block;color:var(--text);text-decoration:none;min-width:0}
.showcase-work-image{height:clamp(230px,31vw,420px);position:relative;overflow:hidden;border-radius:13px;background:var(--surface-raised)}
.showcase-work-image img{width:100%;height:100%;object-fit:cover;transition:transform .7s cubic-bezier(.2,.7,.2,1)}
.showcase-work:hover .showcase-work-image img{transform:scale(1.045)}
.showcase-work-index{position:absolute;top:14px;left:14px;background:#141815c9;color:#fff;padding:6px 9px;border-radius:5px;font-size:10px;letter-spacing:.12em}
.showcase-work-meta{display:flex;justify-content:space-between;gap:15px;align-items:start;padding:16px 2px}
.showcase-work-meta .eyebrow{font-size:9px;letter-spacing:.14em;color:var(--subtle)}
.showcase-work-meta h3{font-size:21px;letter-spacing:-.04em;margin:5px 0}
.showcase-work-meta p{font-size:11px;color:var(--muted);margin:0}
.showcase-work-price{font-size:11px;color:var(--accent-strong);white-space:nowrap;padding-top:12px}
.showcase-services{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.showcase-services>.card{margin:0;border-radius:13px}
.showcase-contact{margin:80px 0;padding:clamp(28px,6vw,68px);border-radius:17px;border:1px solid var(--line);background:radial-gradient(ellipse at 90% 0%,color-mix(in srgb,var(--accent) 16%,transparent),transparent 45%),var(--surface)}
.showcase-contact h2{font-size:clamp(34px,5vw,62px);letter-spacing:-.065em;line-height:1;margin:15px 0}
.showcase-contact p{max-width:570px;color:var(--muted);margin-bottom:24px}
.showcase-language{text-align:center;padding:20px;color:var(--muted);font-size:12px}
.case-heading{padding:30px 0 44px;max-width:920px}
.case-heading h1{font-size:clamp(48px,8vw,100px);line-height:.95;letter-spacing:-.075em;margin:16px 0}
.case-heading>p{font-size:18px;color:var(--muted);max-width:740px;line-height:1.7}
.case-byline{display:flex;gap:15px;align-items:center;flex-wrap:wrap;margin-top:24px;font-size:11px}
.case-byline span{color:var(--subtle);letter-spacing:.1em}
.case-byline a{font-weight:800}
.case-cover{margin:0;border-radius:16px;overflow:hidden;background:var(--surface-raised);border:1px solid var(--line)}
.case-cover img{display:block;width:100%;max-height:850px;object-fit:contain}
.case-gallery{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin:20px 0}
.case-gallery-item{display:block;border-radius:12px;overflow:hidden;background:var(--surface-raised)}
.case-gallery-item img{display:block;width:100%;height:100%;max-height:620px;object-fit:cover}
.case-footer{display:flex;justify-content:space-between;align-items:center;gap:20px;padding:36px 0;margin:45px 0;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.case-footer h2{font-size:clamp(24px,4vw,42px);letter-spacing:-.05em;margin:8px 0}
@media(max-width:760px){.designer-cover{grid-template-columns:1fr;padding-top:10px}.designer-portrait{grid-row:1;min-height:260px;max-height:380px}.designer-portrait img{min-height:260px;max-height:380px}.portrait-placeholder{min-height:260px}.showcase-facts{grid-template-columns:repeat(2,1fr)}.showcase-section{margin:60px 0}.showcase-section-heading{display:block}.showcase-section-heading>p{margin-top:14px}.capability-layout{grid-template-columns:1fr}.showcase-work-grid,.showcase-services{grid-template-columns:1fr}.showcase-work-image{height:clamp(230px,65vw,390px)}.case-footer{display:block}.case-footer .btn{display:inline-block;margin-top:12px}}
@media(prefers-reduced-motion:reduce){.showcase-work-image img{transition:none}.showcase-work:hover .showcase-work-image img{transform:none}}

/* v5.45 discovery, masonry and accessible image lightbox */
.showcase-work-grid{columns:2;column-gap:22px;display:block}
.showcase-work{display:inline-block;width:100%;break-inside:avoid;margin:0 0 28px}
.showcase-work-image{height:auto;aspect-ratio:4/3}
.showcase-work:nth-child(4n+2) .showcase-work-image{aspect-ratio:4/5}
.showcase-work:nth-child(4n+3) .showcase-work-image{aspect-ratio:5/4}
.showcase-work-image img{height:100%;object-fit:cover}
.pir-lightbox{position:fixed;inset:0;width:min(96vw,1400px);height:min(94vh,1000px);max-width:none;max-height:none;margin:auto;padding:54px 24px 22px;border:1px solid #ffffff26;border-radius:14px;background:#101310;color:#fff;overflow:hidden}
.pir-lightbox::backdrop{background:#050705e8;backdrop-filter:blur(8px)}
.pir-lightbox img{display:block;max-width:100%;max-height:calc(94vh - 115px);width:auto;height:auto;object-fit:contain;margin:auto}
.lightbox-close{position:absolute;right:16px;top:10px;border:0;background:#ffffff18;color:#fff;border-radius:50%;width:38px;height:38px;font-size:26px;cursor:pointer}
.lightbox-caption{text-align:center;color:#c9cec8;font-size:12px;margin:12px 0 0}
body.lightbox-open{overflow:hidden}
.search-panel input:focus,.search-panel select:focus{outline:2px solid var(--accent);outline-offset:2px}
.search-panel input,.search-panel select{border-radius:9px;min-height:42px}
.directory-results-meta{font-size:11px;color:var(--muted);letter-spacing:.04em}
@media(max-width:760px){.showcase-work-grid{columns:1}.pir-lightbox{padding:48px 12px 16px;width:100vw;height:100vh;border-radius:0}.pir-lightbox img{max-height:calc(100vh - 110px)}}
@media(prefers-reduced-motion:reduce){.showcase-work-image img{transition:none}}

.discovery-shortcuts{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:5px 0 12px;font-size:11px}
.discovery-shortcuts span{color:var(--muted);font-weight:700}
.discovery-shortcuts a{padding:7px 11px;border:1px solid var(--line);border-radius:99px;color:var(--text);background:var(--surface-raised)}
.discovery-shortcuts a:hover{border-color:var(--accent);color:var(--accent-strong)}

/* v5.45.1 — consolidated light theme: warm paper, ink, sage and consistent contrast */
[data-theme="light"]{
 color-scheme:light;
 --bg:#F5F4EF;--bg-soft:#ECEBE4;--surface:#FFFEFA;--surface-raised:#FFFFFF;
 --line:#DCDDD4;--text:#222923;--muted:#59645C;--subtle:#737D74;
 --accent:#657B5B;--accent-strong:#40563D;--accent-ink:#FFFFFF;
 --gold:#8B7448;--danger:#A9433D;--shadow:0 18px 48px rgba(34,41,35,.08)
}
[data-theme="light"] html{background:var(--bg)}
[data-theme="light"] body{background:radial-gradient(ellipse at 85% -10%,rgba(101,123,91,.10),transparent 35%),radial-gradient(ellipse at 4% 35%,rgba(191,184,160,.12),transparent 32%),var(--bg);color:var(--text)}
[data-theme="light"] .site-nav{background:rgba(255,254,250,.92);border-color:var(--line);box-shadow:var(--shadow)}
[data-theme="light"] .brand,[data-theme="light"] .brand-copy strong,[data-theme="light"] .brand-copy small{color:var(--text)}
[data-theme="light"] .nav-links a{color:#4B584E}
[data-theme="light"] .nav-links a:hover{background:#EEF0E9;color:#27382A}
[data-theme="light"] .nav-links .nav-cta{background:#40563D;color:#fff!important;border-color:#40563D}
[data-theme="light"] .theme-toggle,[data-theme="light"] .nav-toggle{background:#F0F1EB;color:#29372C;border-color:#D3D8CE}
[data-theme="light"] .card,[data-theme="light"] .stat,[data-theme="light"] .feature-item,[data-theme="light"] .trust-item,[data-theme="light"] .hero-panel,[data-theme="light"] .designer-card,[data-theme="light"] .work,[data-theme="light"] .search-panel{background:var(--surface);color:var(--text);border-color:var(--line);box-shadow:0 10px 28px rgba(34,41,35,.045)}
[data-theme="light"] h1,[data-theme="light"] h2,[data-theme="light"] h3,[data-theme="light"] h4,[data-theme="light"] strong,[data-theme="light"] legend{color:var(--text)}
[data-theme="light"] p,[data-theme="light"] li,[data-theme="light"] .muted,[data-theme="light"] .foot,[data-theme="light"] .status,[data-theme="light"] .subtle{color:var(--muted)}
[data-theme="light"] a{color:var(--accent-strong)}
[data-theme="light"] a:hover{color:#283F2B}
[data-theme="light"] .eyebrow{color:#536B4C}
[data-theme="light"] input,[data-theme="light"] select,[data-theme="light"] textarea{background:#FFFFFF;color:#202923;border:1px solid #C9D0C7}
[data-theme="light"] input::placeholder,[data-theme="light"] textarea::placeholder{color:#778178;opacity:1}
[data-theme="light"] input:focus,[data-theme="light"] select:focus,[data-theme="light"] textarea:focus{outline:3px solid rgba(83,107,76,.18);border-color:#657B5B}
[data-theme="light"] label{color:#303B32}
[data-theme="light"] .btn{background:linear-gradient(135deg,#536B4C,#718568);color:#fff!important;border-color:#536B4C}
[data-theme="light"] .btn:hover{color:#fff!important;filter:brightness(.96)}
[data-theme="light"] .btn-secondary{background:#E9ECE5;color:#2F4031!important;border-color:#D1D8CD}
[data-theme="light"] .btn-ghost{background:transparent;color:#40563D!important;border-color:#BFC9BA}
[data-theme="light"] .tag,[data-theme="light"] .capability-tags .tag{background:#EDF0E8;color:#40563D;border-color:#D5DDCF}
[data-theme="light"] .price,[data-theme="light"] .showcase-work-price{color:#40563D}
[data-theme="light"] .profile-hero,[data-theme="light"] .cta-band,[data-theme="light"] .company-hero{background:linear-gradient(125deg,#E9EDE4,#FFFEFA 72%);color:var(--text);border-color:var(--line)}
[data-theme="light"] .company-hero .hero-panel{background:rgba(255,254,250,.94)}
[data-theme="light"] .designer-cover{color:var(--text)}
[data-theme="light"] .designer-intro,[data-theme="light"] .capability-description,[data-theme="light"] .showcase-section-heading>p,[data-theme="light"] .showcase-contact p{color:var(--muted)}
[data-theme="light"] .showcase-breadcrumb,[data-theme="light"] .showcase-breadcrumb a{color:#68746A}
[data-theme="light"] .showcase-availability{color:#536257;border-color:#D0D8CF}
[data-theme="light"] .showcase-availability.is-open{color:#315A39;border-color:#9CB49A;background:#EFF4EC}
[data-theme="light"] .showcase-facts{border-color:var(--line)}
[data-theme="light"] .showcase-facts span{color:#69756B}
[data-theme="light"] .showcase-work-meta p{color:var(--muted)}
[data-theme="light"] .showcase-work-index{background:rgba(34,41,35,.78);color:#fff}
[data-theme="light"] .designer-portrait{background:linear-gradient(145deg,#E9EDE4,#F8F6EF);border-color:var(--line)}
[data-theme="light"] .portrait-placeholder{background:radial-gradient(circle at 50% 35%,#E3EBDD,#F8F6EF);color:#536B4C}
[data-theme="light"] .showcase-contact{background:radial-gradient(ellipse at 90% 0%,rgba(101,123,91,.12),transparent 45%),#F0F1E9;border-color:#D9DED4}
[data-theme="light"] .showcase-contact h2,[data-theme="light"] .case-heading h1,[data-theme="light"] .case-footer h2{color:var(--text)}
[data-theme="light"] .case-heading>p{color:var(--muted)}
[data-theme="light"] .case-byline span{color:#69756B}
[data-theme="light"] .case-cover,[data-theme="light"] .case-gallery-item{background:#ECEDE7;border-color:var(--line)}
[data-theme="light"] .case-footer{border-color:var(--line)}
[data-theme="light"] .showcase-language{color:var(--muted)}
[data-theme="light"] .favorite-btn{background:#EEF1EA;color:#354A37;border-color:#D2D9CE}
[data-theme="light"] .footer-grid strong,[data-theme="light"] .footer-bottom{color:var(--text)}
[data-theme="light"] .discovery-shortcuts a{background:#FFFEFA;color:#40563D;border-color:#D5DCD1}
[data-theme="light"] #main-content{color:var(--text)}
[data-theme="light"] #main-content h1,[data-theme="light"] #main-content h2,[data-theme="light"] #main-content h3,[data-theme="light"] #main-content h4,[data-theme="light"] #main-content strong{color:var(--text)}
[data-theme="light"] #main-content p,[data-theme="light"] #main-content li,[data-theme="light"] #main-content .muted{color:var(--muted)}
[data-theme="light"] #main-content a:not(.btn):not(.nav-cta){color:var(--accent-strong)}

/* v5.46.0 — full editorial homepage redesign */
.pv-home{--pv-ink:#e9e7de;--pv-muted:#a6aaa1;--pv-acid:#c4cead;--pv-line:rgba(235,235,224,.18);width:100%;overflow:hidden}
.pv-hero{position:relative;min-height:690px;padding:clamp(54px,8vw,112px) clamp(24px,6vw,84px) 72px;background:linear-gradient(115deg,#202723 0%,#29332d 52%,#202725 100%);color:#f1f0e8;border:1px solid #465047;border-radius:28px;display:grid;grid-template-columns:minmax(0,1.3fr) minmax(260px,.7fr);gap:clamp(30px,6vw,90px);align-items:center;isolation:isolate}
.pv-hero:before{content:"";position:absolute;inset:0;z-index:-1;opacity:.25;background:radial-gradient(ellipse at 85% 15%,#9da98c 0,transparent 32%),radial-gradient(ellipse at 8% 100%,#657a68 0,transparent 34%);border-radius:inherit}
.pv-hero-main{max-width:780px}
.pv-overline,.pv-label{font-size:9px;letter-spacing:.19em;font-weight:850;color:#c3c9b7}
.pv-overline{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.pv-overline i,.pv-index-heading i{display:inline-block;width:7px;height:7px;background:#c3d0a9;border-radius:50%;box-shadow:0 0 14px #b8c99b}
.pv-announcement{display:inline-block;margin:28px 0 0;padding:7px 11px;border:1px solid #82907d;border-radius:99px;color:#e4e8d9;font-size:10px}
.pv-hero h1{font-size:clamp(54px,8.5vw,112px);line-height:.91;letter-spacing:-.078em;font-weight:650;max-width:850px;margin:30px 0 24px;color:#f4f2e9}
.pv-hero-lede{max-width:590px;color:#c2c8bf;font-size:clamp(15px,1.6vw,19px);line-height:1.75}
.pv-hero-actions{display:flex;align-items:center;gap:25px;flex-wrap:wrap;margin-top:34px}
.pv-button{display:inline-flex;align-items:center;justify-content:space-between;gap:34px;padding:15px 19px;border-radius:4px;font-size:11px;font-weight:850;letter-spacing:.035em;text-decoration:none;transition:transform .2s ease,background .2s ease}
.pv-button:hover{transform:translateY(-2px)}
.pv-button-dark{background:#e4e6d9;color:#202820}
.pv-button-dark:hover{background:#fff;color:#202820}
.pv-text-link{font-size:11px;color:#e5e8dc;font-weight:750}
.pv-text-link span{margin-left:8px}
.pv-hero-foot{display:flex;gap:22px;flex-wrap:wrap;margin-top:72px;padding-top:17px;border-top:1px solid var(--pv-line);font-size:8px;letter-spacing:.16em;color:#aab2a7}
.pv-index{align-self:center;border:1px solid rgba(235,235,224,.23);background:rgba(15,22,18,.28);backdrop-filter:blur(14px);padding:25px;border-radius:12px;color:#f1f0e8}
.pv-index-heading{display:flex;justify-content:space-between;gap:12px;font-size:8px;letter-spacing:.15em;color:#b7c0b3;font-weight:850}
.pv-index-heading span:last-child{display:flex;align-items:center;gap:7px}
.pv-index-heading i{width:6px;height:6px}
.pv-index-total{display:flex;align-items:end;gap:14px;padding:36px 0 28px;border-bottom:1px solid var(--pv-line)}
.pv-index-total strong{font-size:clamp(58px,7vw,86px);letter-spacing:-.08em;line-height:.8;color:#f1f0e8}
.pv-index-total span{font-size:9px;line-height:1.5;letter-spacing:.12em;color:#bfc7b9}
.pv-index-metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding:23px 0}
.pv-index-metrics div{display:flex;flex-direction:column;gap:5px}
.pv-index-metrics b{font-size:24px;letter-spacing:-.05em;color:#e5e9dc}
.pv-index-metrics small{font-size:7px;letter-spacing:.11em;color:#aeb7a9}
.pv-index>p{font-size:10px;color:#b8c0b3;margin:0}
.pv-hero-bottom{position:absolute;bottom:24px;left:clamp(24px,6vw,84px);right:clamp(24px,6vw,84px);display:flex;justify-content:space-between;font-size:8px;letter-spacing:.18em;color:#aab2a7}
.pv-home .home-carousel{margin:26px 0 0}
.pv-home .carousel-slide{border-radius:15px;min-height:350px}
.pv-category-section,.pv-talent-section,.pv-work-section,.pv-faq{padding:clamp(72px,10vw,130px) 0}
.pv-section-top{display:flex;justify-content:space-between;align-items:end;gap:35px;margin-bottom:44px}
.pv-section-top h2,.pv-faq h2{font-size:clamp(42px,6vw,76px);line-height:.96;letter-spacing:-.075em;margin:16px 0 0;color:var(--text)}
.pv-section-top h2 em,.pv-manifesto h2 em,.pv-join h2 em,.pv-faq h2 em{font-family:Georgia,serif;font-weight:400}
.pv-section-top>p{max-width:350px;color:var(--muted);font-size:13px;line-height:1.8}
.pv-category-grid{display:grid;grid-template-columns:repeat(4,1fr);border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.pv-category-grid .home-category{position:relative;display:flex;flex-direction:column;gap:14px;padding:25px 20px 27px 0;border-right:1px solid var(--line);color:var(--text);min-height:175px;text-decoration:none}
.pv-category-grid .home-category:not(:first-child){padding-left:20px}
.pv-category-grid .home-category:last-child{border-right:0}
.home-category span{font-size:8px;letter-spacing:.16em;color:var(--subtle);font-weight:800}
.home-category strong{font-size:clamp(17px,2vw,23px);letter-spacing:-.04em}
.home-category small{font-size:10px;color:var(--muted);line-height:1.5}
.home-category>b{position:absolute;right:17px;bottom:26px;font-size:16px;color:var(--accent-strong);transition:transform .2s}
.home-category:hover>b{transform:translate(3px,-3px)}
.pv-outline-link{font-size:11px;font-weight:800;color:var(--accent-strong);border-bottom:1px solid var(--accent);padding-bottom:8px;white-space:nowrap}
.pv-talent-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}
.pv-talent-grid .designer-card{margin:0;border-radius:12px;overflow:hidden}
.pv-work-section{background:var(--bg-soft);padding-left:clamp(20px,4vw,55px);padding-right:clamp(20px,4vw,55px);border-radius:24px}
.pv-project-grid{display:grid;grid-template-columns:repeat(12,1fr);gap:34px 22px}
.home-project{grid-column:span 5;display:block;color:var(--text);text-decoration:none}
.home-project:nth-child(4n+1),.home-project:nth-child(4n+4){grid-column:span 7}
.home-project-image{position:relative;aspect-ratio:1.2;overflow:hidden;border-radius:8px;background:var(--surface-raised)}
.home-project:nth-child(4n+1) .home-project-image{aspect-ratio:1.45}
.home-project:nth-child(4n+2) .home-project-image{aspect-ratio:1.05}
.home-project-image img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .7s cubic-bezier(.2,.7,.2,1)}
.home-project:hover .home-project-image img{transform:scale(1.04)}
.home-project-image>span{position:absolute;left:15px;top:15px;background:rgba(20,26,22,.75);color:#fff;padding:6px 9px;font-size:9px;letter-spacing:.1em}
.home-project-caption{display:flex;justify-content:space-between;align-items:start;padding:14px 2px}
.home-project-caption div{display:flex;flex-direction:column;gap:4px}
.home-project-caption strong{font-size:17px;letter-spacing:-.035em}
.home-project-caption small{font-size:10px;color:var(--muted)}
.home-project-caption>b{font-size:16px;color:var(--accent-strong)}
.pv-work-foot{display:flex;justify-content:space-between;gap:15px;align-items:center;border-top:1px solid var(--line);padding-top:18px;margin-top:35px;font-size:8px;letter-spacing:.14em;color:var(--muted)}
.pv-work-foot a{font-size:11px;letter-spacing:0;font-weight:800;color:var(--accent-strong)}
.pv-manifesto{display:grid;grid-template-columns:.65fr 1.35fr;gap:35px;padding:clamp(75px,10vw,135px) 0}
.pv-manifesto-aside{display:flex;flex-direction:column;justify-content:space-between;align-items:start}
.pv-manifesto-index{font-size:9px;letter-spacing:.15em;color:var(--subtle)}
.pv-manifesto h2,.pv-join h2{font-size:clamp(44px,7vw,86px);line-height:.94;letter-spacing:-.075em;margin:0;color:var(--text)}
.pv-manifesto-copy>p,.pv-join p{max-width:590px;color:var(--muted);font-size:15px;line-height:1.8;margin:28px 0}
.pv-manifesto-points{border-top:1px solid var(--line);margin-top:42px}
.pv-manifesto-points div{display:flex;gap:25px;padding:16px 0;border-bottom:1px solid var(--line);font-size:12px}
.pv-manifesto-points b{color:var(--accent-strong);font-size:10px}
.pv-join{display:flex;justify-content:space-between;align-items:end;gap:30px;padding:clamp(38px,6vw,76px);border-radius:18px;background:#28342c;color:#f3f1e8}
.pv-join h2{color:#f3f1e8;margin-top:16px}
.pv-join p{color:#c0c8bd;margin-bottom:0}
.pv-button-light{background:#e4e6d9;color:#202820;white-space:nowrap}
.pv-faq{display:grid;grid-template-columns:.75fr 1.25fr;gap:50px}
.pv-faq-list details{border-bottom:1px solid var(--line);padding:20px 0}
.pv-faq-list details:first-child{border-top:1px solid var(--line)}
.pv-faq-list summary{cursor:pointer;list-style:none;font-size:15px;font-weight:750;color:var(--text)}
.pv-faq-list summary::-webkit-details-marker{display:none}
.pv-faq-list summary:after{content:"+";float:right;color:var(--accent-strong);font-size:20px}
.pv-faq-list details[open] summary:after{content:"−"}
.pv-faq-list p{max-width:650px;color:var(--muted);font-size:13px;line-height:1.8;margin:16px 35px 0 0}
.pv-empty{grid-column:1/-1;padding:32px;border:1px dashed var(--line);border-radius:12px;color:var(--muted)}
[data-theme="light"] .pv-hero{background:linear-gradient(115deg,#29332d,#354238 55%,#27322c);border-color:#566452}
[data-theme="light"] .pv-hero h1,[data-theme="light"] .pv-index-total strong{color:#F4F2E9}
[data-theme="light"] .pv-index-metrics b{color:#E5E9DC}
[data-theme="light"] .pv-join{background:#354638}
[data-theme="light"] .pv-section-top h2,[data-theme="light"] .pv-faq h2,[data-theme="light"] .pv-manifesto h2{color:#222923}
[data-theme="light"] .home-category strong,[data-theme="light"] .home-project-caption strong{color:#222923}
[data-theme="light"] .pv-work-section{background:#ECEBE4}
@media(max-width:900px){.pv-hero{grid-template-columns:1fr;min-height:0;padding-bottom:85px}.pv-index{max-width:520px}.pv-hero-foot{margin-top:45px}.pv-category-grid{grid-template-columns:repeat(2,1fr)}.pv-category-grid .home-category:nth-child(2){border-right:0}.pv-category-grid .home-category:nth-child(n+3){border-top:1px solid var(--line)}.pv-category-grid .home-category:nth-child(3){padding-left:0}.pv-talent-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.pv-manifesto{grid-template-columns:1fr}.pv-manifesto-aside{flex-direction:row}.pv-faq{grid-template-columns:1fr;gap:28px}}
@media(max-width:600px){.pv-hero{padding:45px 22px 76px;border-radius:18px}.pv-hero h1{font-size:clamp(48px,14vw,76px)}.pv-index{padding:18px}.pv-index-total strong{font-size:60px}.pv-hero-foot{gap:10px;font-size:7px}.pv-hero-bottom{left:22px;right:22px}.pv-section-top{display:block}.pv-section-top>p{margin-top:20px}.pv-category-grid{grid-template-columns:1fr 1fr}.pv-category-grid .home-category{min-height:155px;padding:18px 12px 18px 0}.pv-category-grid .home-category:not(:first-child){padding-left:12px}.pv-category-grid .home-category:nth-child(3){padding-left:0}.pv-category-grid .home-category:nth-child(2){border-right:0}.pv-category-grid .home-category:nth-child(odd){border-right:1px solid var(--line)}.pv-category-grid .home-category:nth-child(even){border-right:0}.pv-talent-grid{grid-template-columns:1fr}.pv-project-grid{display:block}.home-project{margin-bottom:25px}.home-project-image,.home-project:nth-child(4n+1) .home-project-image,.home-project:nth-child(4n+2) .home-project-image{aspect-ratio:1.1}.pv-work-foot{align-items:start;flex-direction:column}.pv-join{display:block;padding:30px 23px}.pv-button-light{margin-top:28px}.pv-faq-list summary{font-size:13px}}
@media(prefers-reduced-motion:reduce){.pv-button,.home-project-image img,.home-category>b{transition:none}.home-project:hover .home-project-image img{transform:none}}

/* v5.47.0 — Designer Studio workspace and directory experience */
.studio-workspace{display:grid;grid-template-columns:238px minmax(0,1fr);gap:30px;max-width:1500px;margin:0 auto;align-items:start}
.studio-sidebar{position:sticky;top:18px;min-height:calc(100vh - 36px);padding:22px 16px;background:var(--surface);border:1px solid var(--line);border-radius:16px;display:flex;flex-direction:column;gap:20px;box-shadow:0 12px 38px rgba(0,0,0,.045)}
.studio-sidebar-brand{display:flex;align-items:center;gap:11px;text-decoration:none;color:var(--text);padding:4px 5px 18px;border-bottom:1px solid var(--line)}
.studio-sidebar-brand>span{width:38px;height:38px;display:grid;place-items:center;background:#354638;color:#f4f2e9;border-radius:10px;font-weight:900;font-size:12px}
.studio-sidebar-brand>b{font-size:9px;letter-spacing:.16em;line-height:1.4}
.studio-sidebar-profile{display:flex;align-items:center;gap:11px;padding:12px 8px;background:var(--bg-soft);border-radius:10px;min-width:0}
.studio-sidebar-profile img,.studio-avatar-fallback{width:38px;height:38px;border-radius:50%;object-fit:cover;background:var(--surface-raised);display:grid;place-items:center;color:var(--accent-strong);font-weight:800}
.studio-sidebar-profile div{display:flex;flex-direction:column;gap:4px;min-width:0}
.studio-sidebar-profile strong{font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.studio-sidebar-profile small{font-size:9px;color:var(--muted)}
.studio-nav-label{font-size:8px;letter-spacing:.16em;font-weight:850;color:var(--subtle);padding:0 8px}
.studio-nav{display:grid;gap:5px}
.studio-nav a,.studio-sidebar-bottom a{display:flex;align-items:center;gap:11px;padding:11px 12px;border-radius:8px;text-decoration:none;color:var(--muted);font-size:11px;font-weight:700}
.studio-nav a:before{display:none}.studio-nav-icon{width:18px;height:18px;flex:0 0 18px;display:grid;place-items:center;color:var(--subtle)}.studio-nav-icon svg{width:17px;height:17px;display:block;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}.studio-nav a[aria-current="location"]{background:var(--bg-soft);color:var(--text)}.studio-nav a[aria-current="location"] .studio-nav-icon{color:var(--accent-strong)}.studio-nav a:focus-visible{outline:3px solid color-mix(in srgb,var(--accent) 55%,transparent);outline-offset:2px}
.studio-nav a:hover,.studio-sidebar-bottom a:hover{background:var(--bg-soft);color:var(--text)}
.studio-sidebar-bottom{margin-top:auto;border-top:1px solid var(--line);padding-top:12px;display:grid;gap:3px}.studio-sidebar-bottom form{margin:0}.studio-sidebar-bottom .studio-logout-button{width:100%;display:flex;align-items:center;gap:11px;padding:11px 12px;border:0;border-radius:8px;background:transparent;color:var(--muted);font:inherit;font-size:11px;font-weight:700;text-align:left;cursor:pointer}.studio-sidebar-bottom .studio-logout-button:hover{background:var(--bg-soft);color:var(--text)}.studio-inline-logout{display:inline-flex;margin:0;vertical-align:middle}.studio-inline-logout button{font:inherit;cursor:pointer}
.studio-main{min-width:0}.studio-main [id]{scroll-margin-top:180px}
.studio-welcome{display:flex;justify-content:space-between;align-items:end;gap:24px;padding:30px 0 25px}
.studio-welcome h1{font-size:clamp(28px,4vw,46px);letter-spacing:-.06em;line-height:1.05;margin:10px 0}
.studio-welcome p{color:var(--muted);font-size:12px;line-height:1.7;margin:0}
.studio-welcome-actions{display:flex;flex-direction:column;align-items:end;gap:12px;flex-shrink:0}
.studio-status{font-size:8px;letter-spacing:.13em;color:var(--muted);font-weight:850}
.studio-status.is-live{color:#4e895a}
.studio-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:8px 0 35px}
.studio-kpis article{padding:18px 17px;background:var(--surface);border:1px solid var(--line);border-radius:12px;display:flex;flex-direction:column;gap:8px;min-width:0}
.studio-kpis article>span{font-size:8px;letter-spacing:.13em;font-weight:850;color:var(--muted)}
.studio-kpis article strong{font-size:clamp(24px,3vw,36px);letter-spacing:-.06em;color:var(--text)}
.studio-kpis article small{font-size:9px;color:var(--subtle)}
.studio-content-heading{display:flex;justify-content:space-between;align-items:end;margin-bottom:18px;gap:15px}
.studio-content-heading h2{font-size:23px;letter-spacing:-.05em;margin:7px 0 0}
.studio-updated{font-size:8px;letter-spacing:.12em;color:var(--subtle)}
.studio-panels{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;align-items:start}
.studio-panel{min-width:0;margin:0!important;padding:22px!important;border-radius:13px!important;scroll-margin-top:20px}
.studio-panel h2{font-size:19px;letter-spacing:-.04em}
.studio-panel form{max-width:100%}
.studio-panel input:not([type=checkbox]):not([type=radio]),.studio-panel select,.studio-panel textarea{max-width:100%;box-sizing:border-box}
.studio-panel#edit-profile,.studio-panel#portfolio-manager,.studio-panel#analytics,.studio-panel#leads{grid-column:1/-1}
.studio-panel#analytics .grid{grid-template-columns:repeat(4,minmax(0,1fr))}
.studio-panel#analytics .stat-grid{grid-template-columns:repeat(3,minmax(0,1fr))}
.studio-panel .grid{gap:12px}
.studio-panel .stat{border-radius:9px}
.studio-workspace .studio-panel .btn{margin-top:8px}
.studio-workspace .studio-panel label{font-size:11px;font-weight:700}
.studio-workspace .studio-panel input,.studio-workspace .studio-panel select,.studio-workspace .studio-panel textarea{border-radius:8px}
.studio-main [id]{scroll-margin-top:118px}
.studio-field{display:grid;gap:6px;margin:0 0 13px;color:var(--text)}
.studio-field input,.studio-field textarea{width:100%;padding:11px 12px;margin:0}
.studio-field small,.studio-avatar-upload-fields>small{display:block;color:var(--muted);font-size:10px;font-weight:500;line-height:1.55}
.studio-field input::placeholder,.studio-field textarea::placeholder{color:var(--subtle);opacity:1}
.studio-avatar-upload{display:flex;align-items:center;gap:16px;margin:6px 0 18px;padding:15px;border:1px solid var(--line);border-radius:13px;background:var(--bg-soft)}
.studio-avatar-upload-preview{width:82px;height:82px;flex:0 0 82px;display:grid;place-items:center;overflow:hidden;border-radius:50%;background:var(--surface-raised);color:var(--accent-strong);font-size:28px;font-weight:800}
.studio-avatar-upload-preview img{width:100%;height:100%;object-fit:cover}
.studio-avatar-upload-fields{display:grid;gap:7px;min-width:0}
.studio-avatar-upload-fields>label:first-child{font-size:12px;font-weight:800}
.studio-avatar-upload-fields input[type=file]{max-width:100%;padding:8px;background:var(--surface)}
.studio-avatar-remove{display:flex;align-items:center;gap:7px;font-size:10px!important;font-weight:600!important}
.studio-avatar-remove input{width:auto!important}
.studio-avatar-upload-preview [hidden]{display:none!important}
.pv-upload-preview-card img{object-fit:contain;background:var(--bg-soft)}
.pv-upload-preview-fallback{height:108px;display:grid;place-items:center;padding:10px;text-align:center;color:var(--muted);font-size:11px;background:var(--bg-soft)}
@media(max-width:600px){.studio-avatar-upload{align-items:flex-start;flex-direction:column}.studio-avatar-upload-preview{width:72px;height:72px;flex-basis:72px}}

/* v3.55.0 — independent homepage media, reliable profile saving and full-ratio previews */
.studio-profile-form{display:grid;gap:15px;align-content:start}
.studio-profile-form>.studio-field{gap:8px;margin:0}
.studio-profile-form>.studio-avatar-upload{margin:0;align-items:center}
.studio-profile-form>.studio-story-editor,.studio-profile-form>details{margin:0}
.studio-profile-form>.studio-field input,.studio-profile-form>.studio-field textarea{width:100%;max-width:100%;padding:13px 14px;line-height:1.55}
.studio-profile-form>.studio-field small{font-size:11px;line-height:1.75;max-width:78ch}
.studio-profile-form>.studio-checkbox-field,.studio-profile-form .studio-checkbox-field{display:flex;align-items:flex-start;gap:10px;margin:0;line-height:1.65;font-size:11px;font-weight:650}
.studio-profile-form .studio-checkbox-field input{width:16px!important;height:16px;flex:0 0 16px;margin:2px 0 0!important}
.studio-checkbox-group{display:grid;gap:6px;padding:12px 14px;border:1px solid var(--line);border-radius:10px;background:var(--bg-soft)}
.studio-checkbox-group>small{display:block;padding-left:26px;color:var(--muted);font-size:10px;line-height:1.7}
.studio-form-actions{display:flex;align-items:flex-end;flex-wrap:wrap;gap:12px;margin-top:4px}
.studio-form-actions>label{display:grid;gap:7px;margin:0;min-width:88px;line-height:1.5}
.studio-form-actions select{min-width:88px;padding:10px 12px}
.studio-form-actions>.btn,.studio-form-stack>.btn,.studio-work-item .btn,.studio-profile-form .btn{min-height:44px;padding:11px 18px;line-height:1.35;white-space:normal}
.studio-profile-actions{margin-top:4px;padding-top:14px;border-top:1px solid var(--line)}
.studio-form-stack{display:grid;gap:11px;align-content:start;margin:14px 0 0}
.studio-form-stack>label{display:block;margin:0;line-height:1.6;font-size:11px;font-weight:700}
.studio-form-stack>input:not([type=hidden]),.studio-form-stack>textarea,.studio-form-stack>select{width:100%;max-width:100%;box-sizing:border-box;margin:0!important;padding:12px 13px!important;line-height:1.55}
.studio-form-stack>textarea{min-height:104px;line-height:1.75;resize:vertical}
.studio-form-stack>.btn{justify-self:start;margin:8px 0 0!important}
.studio-testimonial-form .studio-form-actions{margin-top:3px}
.studio-testimonial-form .studio-form-actions select{width:auto}
.studio-service-form>.btn{margin-top:9px!important}
.studio-work-item{display:grid;gap:13px;align-content:start;min-width:0}
.studio-work-item>strong{font-size:15px;line-height:1.45}
.studio-work-item>p{margin:0;line-height:1.75}
.studio-work-item>form.studio-work-edit-form{display:grid;gap:10px;margin:0}
.studio-work-item>form.studio-work-edit-form>label{display:block;margin:0;line-height:1.6;font-size:11px;font-weight:700}
.studio-work-item>form.studio-work-edit-form>input:not([type=hidden]),.studio-work-item>form.studio-work-edit-form>textarea{width:100%;max-width:100%;box-sizing:border-box;margin:0!important;padding:11px 12px!important;line-height:1.6}
.studio-work-item>form.studio-work-edit-form>textarea,.studio-work-item .case-builder-fields textarea{min-height:88px;line-height:1.75;resize:vertical}
.studio-work-item .case-builder-fields[open]{display:grid;gap:10px;margin:3px 0 0;padding-top:12px;border-top:1px solid var(--line)}
.studio-work-item .case-builder-fields>label{display:block;margin:0;line-height:1.6;font-size:11px;font-weight:700}
.studio-work-item .case-builder-fields>input,.studio-work-item .case-builder-fields>textarea{width:100%;max-width:100%;box-sizing:border-box;margin:0!important;padding:11px 12px!important;line-height:1.65}
.studio-work-item>form.studio-work-edit-form>.btn{justify-self:start;margin:8px 0 0!important}
.studio-work-item>form.studio-work-delete-form{margin:0;padding-top:13px;border-top:1px solid var(--line)}
.studio-work-item>form.studio-work-delete-form>.btn{margin:0!important;min-height:44px}
.studio-workspace .studio-panel textarea,.studio-workspace .studio-panel input:not([type=hidden]),.studio-workspace .studio-panel select{line-height:1.6;letter-spacing:.005em}
.studio-workspace .studio-panel textarea{min-height:100px;padding:12px 14px;line-height:1.75}
.studio-workspace .studio-panel>p,.studio-workspace .studio-panel .muted{line-height:1.75}
@media(max-width:600px){.studio-profile-form{gap:13px}.studio-profile-form>.studio-avatar-upload{align-items:flex-start}.studio-form-actions{align-items:stretch}.studio-form-actions>.btn{width:100%}.studio-work-item>form.studio-work-delete-form>.btn{width:100%}}
[data-theme="light"] .studio-sidebar{background:#fffefa;box-shadow:0 14px 38px rgba(34,41,35,.055)}
[data-theme="light"] .studio-sidebar-profile{background:#f0f0e9}
[data-theme="light"] .studio-kpis article{background:#fffefa}
[data-theme="light"] .studio-panel{background:#fffefa}
[data-theme="dark"] .studio-sidebar{background:#20252a}
[data-theme="dark"] .studio-sidebar-profile{background:#292f34}
[data-theme="dark"] .studio-kpis article{background:#242a2f}
[data-theme="dark"] .studio-panel{background:#242a2f}
.search-panel{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;padding:24px;border-radius:14px}
.search-panel>label{font-size:10px;font-weight:800;letter-spacing:.04em;color:var(--muted)}
.search-panel input,.search-panel select{min-height:44px;border-radius:8px;padding:10px 12px}
.search-panel .discovery-shortcuts,.search-panel .filter-row{grid-column:1/-1}
.search-panel .filter-row{display:flex;gap:18px;align-items:center;flex-wrap:wrap}
.search-panel .filter-row label{display:flex;align-items:center;gap:7px;font-size:10px}
@media(max-width:1050px){.studio-workspace{grid-template-columns:190px minmax(0,1fr);gap:18px}.studio-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.studio-panel#analytics .grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:760px){.studio-workspace{display:block}.studio-sidebar{position:relative;top:auto;min-height:0;padding:12px;margin-bottom:15px;gap:10px}.studio-sidebar-brand{padding-bottom:10px}.studio-sidebar-profile{display:none}.studio-nav-label,.studio-sidebar-bottom{display:none}.studio-nav{display:flex;overflow-x:auto;gap:5px;padding-bottom:3px}.studio-nav a{white-space:nowrap;padding:9px}.studio-nav a:before{display:none}.studio-welcome{display:block;padding:20px 0}.studio-welcome-actions{align-items:start;margin-top:16px}.studio-panels{grid-template-columns:1fr}.studio-panel#edit-profile,.studio-panel#portfolio-manager,.studio-panel#analytics,.studio-panel#leads{grid-column:auto}.studio-content-heading{align-items:start;flex-direction:column}.search-panel{grid-template-columns:1fr 1fr;padding:15px}.search-panel .discovery-shortcuts,.search-panel .filter-row{grid-column:1/-1}}
@media(max-width:480px){.studio-kpis{gap:8px}.studio-kpis article{padding:13px}.studio-kpis article strong{font-size:25px}.studio-panel{padding:16px!important}.studio-panel#analytics .grid,.studio-panel#analytics .stat-grid{grid-template-columns:1fr 1fr}.search-panel{grid-template-columns:1fr}}

/* v5.48.0 — public designer profile navigation, share and editorial polish */
.showcase-jumpnav{position:sticky;top:0;z-index:15;display:flex;align-items:center;gap:clamp(16px,3vw,34px);overflow-x:auto;padding:15px 18px;margin:0 0 22px;background:color-mix(in srgb,var(--bg) 90%,transparent);backdrop-filter:blur(16px);border-top:1px solid var(--line);border-bottom:1px solid var(--line);scrollbar-width:none}
.showcase-jumpnav::-webkit-scrollbar{display:none}
.showcase-jumpnav a{white-space:nowrap;font-size:9px;font-weight:850;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);text-decoration:none}
.showcase-jumpnav a:hover{color:var(--accent-strong)}
.designer-showcase [id]{scroll-margin-top:74px}
.showcase-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.share-profile-btn{border:1px solid var(--line);background:var(--surface);color:var(--text);padding:11px 14px;border-radius:99px;font-size:10px;font-weight:800;cursor:pointer}
.share-profile-btn:hover{border-color:var(--accent);color:var(--accent-strong)}
.showcase-facts{grid-template-columns:repeat(6,minmax(0,1fr))}
.showcase-facts>div:first-child strong{font-size:23px}
.showcase-work-grid{grid-template-columns:repeat(2,minmax(0,1fr));align-items:start}
.showcase-section{scroll-margin-top:80px}
.showcase-contact{scroll-margin-top:80px}
[data-theme="light"] .showcase-jumpnav{background:rgba(245,244,239,.9)}
[data-theme="light"] .share-profile-btn{background:#fffefa;color:#273329;border-color:#d8ddd3}
[data-theme="dark"] .showcase-jumpnav{background:rgba(23,26,28,.9)}
[data-theme="dark"] .share-profile-btn{background:#252b30;color:#e9e7de;border-color:#424b4f}
@media(max-width:850px){.showcase-facts{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media(max-width:600px){.showcase-jumpnav{margin-left:-4px;margin-right:-4px;padding:13px 10px;gap:20px}.showcase-actions{gap:7px}.share-profile-btn{padding:10px 12px}.showcase-facts{grid-template-columns:repeat(2,minmax(0,1fr))}}

/* v5.49.0 — client shortlist comparison workspace */
.shortlist-hero{padding:clamp(38px,7vw,84px);border-radius:22px;background:linear-gradient(120deg,#28352d,#202723);color:#f2f0e7;position:relative;overflow:hidden}
.shortlist-hero:after{content:"";position:absolute;width:380px;height:380px;border-radius:50%;right:-120px;top:-180px;background:radial-gradient(circle,rgba(185,202,164,.24),transparent 68%)}
.shortlist-hero h1{font-size:clamp(46px,8vw,86px);line-height:.95;letter-spacing:-.075em;margin:20px 0;color:#f5f2e9}
.shortlist-hero h1 em{font-family:Georgia,serif;font-weight:400}
.shortlist-hero p{max-width:620px;color:#c7cec2;line-height:1.8;font-size:14px}
.shortlist-actions{display:flex;gap:12px;align-items:center;margin-top:25px;flex-wrap:wrap}
.shortlist-hero .btn{position:relative;z-index:1}
.shortlist-results{padding:55px 0}
.shortlist-toolbar{display:flex;justify-content:space-between;align-items:end;gap:15px;margin-bottom:22px}
.shortlist-toolbar h2{font-size:clamp(22px,4vw,34px);letter-spacing:-.05em;margin:8px 0}
.shortlist-table-wrap{overflow-x:auto;border:1px solid var(--line);border-radius:14px;background:var(--surface)}
.shortlist-table{width:100%;min-width:680px;border-collapse:collapse;text-align:left}
.shortlist-table th,.shortlist-table td{padding:18px 16px;border-bottom:1px solid var(--line);vertical-align:top;font-size:12px;min-width:145px}
.shortlist-table tr:last-child th,.shortlist-table tr:last-child td{border-bottom:0}
.shortlist-table th:first-child{width:145px;min-width:120px;font-size:9px;letter-spacing:.12em;color:var(--muted);text-transform:uppercase}
.shortlist-table thead th:not(:first-child){background:var(--bg-soft)}
.shortlist-table thead strong{font-size:15px;letter-spacing:-.03em;color:var(--text)}
.shortlist-table a{display:inline-block;margin:8px 0;color:var(--accent-strong);font-size:10px;font-weight:800}
.shortlist-table button{border:1px solid var(--line);border-radius:99px;padding:6px 10px;background:transparent;color:var(--muted);font-size:9px;cursor:pointer}
.shortlist-table button:hover{border-color:var(--accent);color:var(--accent-strong)}
.shortlist-btn{border:1px solid var(--line);background:transparent;color:var(--text);border-radius:99px;padding:9px 12px;font-size:10px;font-weight:750;cursor:pointer}
.shortlist-btn[aria-pressed=true]{background:var(--bg-soft);border-color:var(--accent);color:var(--accent-strong)}
.designer-card .card-bottom{flex-wrap:wrap}
[data-theme="light"] .shortlist-table-wrap{background:#fffefa}
[data-theme="light"] .shortlist-table thead th:not(:first-child){background:#f0f0e9}
[data-theme="dark"] .shortlist-table-wrap{background:#242a2f}
[data-theme="dark"] .shortlist-table thead th:not(:first-child){background:#2b3236}
@media(max-width:600px){.shortlist-hero{padding:34px 23px;border-radius:16px}.shortlist-toolbar{align-items:start;flex-direction:column}.shortlist-results{padding:35px 0}}

/* v5.50.0 — accessible light surfaces, spacing normalization and support center */
[data-theme="light"]{--bg:#f4f3ed;--panel:#fffefa;--panel2:#eeeee6;--line:#d9d9cf;--muted:#535d55;--text:#202820;--mint:#45684e;--mint2:#385850;--gold:#80642c;--surface:#fffefa;--surface-raised:#f0f0e9;--bg-soft:#eeeee7;--subtle:#707a70;--accent:#8a9b7b;--accent-strong:#385850}
[data-theme="light"] body{background:radial-gradient(ellipse at 10% -10%,#e7e9df 0,transparent 38%),var(--bg);color:#202820}
[data-theme="light"] a{color:#385850}
[data-theme="light"] a:hover{color:#203d2a}
[data-theme="light"] .site-nav,[data-theme="light"] .card,[data-theme="light"] .feature-item,[data-theme="light"] .trust-item,[data-theme="light"] .stat,[data-theme="light"] .hero-panel,[data-theme="light"] .studio-panel{background:var(--surface)!important;color:var(--text)!important;border-color:var(--line)!important}
[data-theme="light"] .site-nav{box-shadow:0 8px 28px rgba(34,42,34,.06)}
[data-theme="light"] .nav-links a{color:#35463a}
[data-theme="light"] .nav-links a:hover{background:#e9eee7;color:#203d2a}
[data-theme="light"] .nav-links .nav-cta,[data-theme="light"] .btn{background:#385850;color:#fff;border-color:#385850}
[data-theme="light"] .btn:hover{background:#29452f;color:#fff}
[data-theme="light"] .btn-secondary,[data-theme="light"] .favorite-btn,[data-theme="light"] .shortlist-btn{background:#edf0e9;color:#263a2c;border:1px solid #d4ddd1}
[data-theme="light"] .muted,[data-theme="light"] .card .muted,[data-theme="light"] small.muted{color:#59645b!important}
[data-theme="light"] .eyebrow,[data-theme="light"] .label,[data-theme="light"] label{color:#46564a}
[data-theme="light"] input,[data-theme="light"] select,[data-theme="light"] textarea{background:#fffefa!important;color:#202820!important;border:1px solid #cbd3c9!important;box-shadow:none}
[data-theme="light"] input::placeholder,[data-theme="light"] textarea::placeholder{color:#858d83}
[data-theme="light"] .tag,[data-theme="light"] .pill-count{background:#e8eee5;color:#385850;border:1px solid #d2ddcf}
[data-theme="light"] .profile-hero,[data-theme="light"] .cta-band{background:linear-gradient(135deg,#e8ece3,#faf9f4 65%,#e7ebe3);color:#202820;border-color:#d4dbd0}
[data-theme="light"] .profile-hero h1,[data-theme="light"] .profile-hero h2,[data-theme="light"] .cta-band h1,[data-theme="light"] .cta-band h2{color:#202820}
[data-theme="light"] .footer-grid strong{color:#202820}
[data-theme="light"] .designer-card,[data-theme="light"] .work,[data-theme="light"] .home-project{color:#202820}
[data-theme="light"] .designer-card h2,[data-theme="light"] .designer-card h3,[data-theme="light"] .card h1,[data-theme="light"] .card h2,[data-theme="light"] .card h3{color:#202820}
[data-theme="light"] .studio-sidebar{background:#fffefa;border-color:#d9d9cf}
[data-theme="light"] .studio-kpis article{background:#fffefa;border-color:#d9d9cf}
[data-theme="light"] .studio-panel{background:#fffefa!important}
[data-theme="light"] .shortlist-table-wrap{background:#fffefa}
[data-theme="light"] .shortlist-table th,[data-theme="light"] .shortlist-table td{color:#303a31}
[data-theme="light"] .showcase-jumpnav{background:rgba(244,243,237,.94);border-color:#d9d9cf}
[data-theme="light"] .showcase-jumpnav a{color:#46564a}
[data-theme="light"] .showcase-jumpnav a:hover{color:#294c34}
[data-theme="light"] .support-hero{background:linear-gradient(120deg,#e8ece3,#f8f7f1 70%,#e7ebe3);color:#202820;border-color:#d4dbd0}
[data-theme="light"] .support-hero h1,[data-theme="light"] .support-info h2,[data-theme="light"] .support-form-card h2{color:#202820}
[data-theme="light"] .support-hero p{color:#59645b}
[data-theme="light"] .support-channel{background:#fffefa;border-color:#d9d9cf;color:#202820}
[data-theme="light"] .support-channel strong{color:#263a2c}
[data-theme="light"] .support-note{background:#edf0e9;border-color:#d9d9cf}
[data-theme="light"] .support-form-card{background:#fffefa;border-color:#d9d9cf}
[data-theme="light"] .support-admin-ticket{background:#f5f5ef;border-color:#d9d9cf}
[data-theme="light"] .support-success{background:#fffefa;color:#202820;border-color:#d9d9cf}
[data-theme="dark"] .support-channel{background:#222a25;border-color:#3b4840;color:#e9e9df}
[data-theme="dark"] .support-form-card{background:#202723;border-color:#3a473d}
[data-theme="dark"] .support-admin-ticket{background:#202723;border-color:#3a473d}
[data-theme="dark"] .support-note{background:#222a25;border-color:#3a473d}
.wrap{padding:18px 22px 52px}
.card{padding:clamp(18px,2.5vw,26px);margin:14px 0;border-radius:14px}
.grid{gap:14px}
.hero{padding:clamp(28px,5vw,56px);margin:14px 0 22px}
label{display:block;margin:0 0 7px;font-weight:700;font-size:12px}
input,select,textarea{padding:11px 13px;border-radius:8px;max-width:100%;font:inherit}
button,.btn{border-radius:8px}
.muted{line-height:1.7}
.footer-grid{gap:26px;padding:32px 0 20px}
.support-hero{padding:clamp(36px,7vw,82px);border:1px solid #475448;border-radius:22px;background:linear-gradient(120deg,#29362e,#202823 65%,#303b31);color:#f1f0e6;position:relative;overflow:hidden}
.support-hero h1{font-size:clamp(48px,8vw,88px);letter-spacing:-.075em;line-height:.94;margin:18px 0;color:#f4f2e9}
.support-hero h1 em{font-family:Georgia,serif;font-weight:400}
.support-hero p{max-width:630px;color:#c8d0c4;font-size:15px;line-height:1.8}
.support-hours{display:flex;align-items:center;gap:9px;margin-top:26px;font-size:9px;letter-spacing:.13em;color:#d4ddce;font-weight:800}
.support-dot{width:7px;height:7px;border-radius:50%;background:#b8c99e;box-shadow:0 0 12px #b8c99e}
.support-layout{display:grid;grid-template-columns:.9fr 1.1fr;gap:clamp(22px,5vw,65px);padding:clamp(38px,6vw,72px) 0}
.support-info h2,.support-form-card h2{font-size:clamp(30px,4vw,44px);letter-spacing:-.06em;line-height:1.05;margin:12px 0}
.support-info>p,.support-form-card>p{color:var(--muted);font-size:13px;line-height:1.8}
.support-channels{display:grid;gap:10px;margin-top:25px}
.support-channel{display:flex;flex-direction:column;gap:6px;padding:18px;border:1px solid var(--line);border-radius:12px;background:var(--surface);color:var(--text);text-decoration:none}
.support-channel>span{font-size:8px;letter-spacing:.15em;font-weight:850;color:var(--muted)}
.support-channel strong{font-size:14px;color:var(--text)}
.support-channel small{font-size:10px;color:var(--muted)}
.support-channel:hover{border-color:var(--accent);color:var(--text)}
.support-note{padding:18px;margin-top:20px;border:1px solid var(--line);border-radius:12px;background:var(--bg-soft)}
.support-note strong{font-size:12px}
.support-note p{font-size:11px;line-height:1.7;color:var(--muted)}
.support-note a{font-size:11px;font-weight:800}
.support-form-card{padding:clamp(22px,3vw,34px);border:1px solid var(--line);border-radius:16px;background:var(--surface);align-self:start}
.support-form{display:grid;gap:15px;margin-top:22px}
.support-form label{display:grid;gap:7px;font-size:11px}
.support-form input,.support-form select,.support-form textarea{width:100%;min-height:44px}
.support-form textarea{resize:vertical}
.support-form .btn{min-height:46px}
.support-form .muted{font-size:10px}
.support-honeypot{position:absolute!important;left:-10000px!important;width:1px!important;height:1px!important;overflow:hidden!important}
.support-success{max-width:680px;margin:35px auto;padding:clamp(28px,6vw,58px);border:1px solid var(--line);border-radius:18px;background:var(--surface);text-align:center}
.support-success h1{font-size:clamp(34px,6vw,58px);letter-spacing:-.06em}
.support-ticket-id{display:inline-block;padding:12px 18px;margin:12px auto;border:1px dashed var(--accent);border-radius:8px;font-weight:900;letter-spacing:.12em}
.support-admin-panel{margin-top:25px}
.support-admin-heading{display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap}
.support-admin-heading h2{margin:6px 0 15px}
.support-admin-ticket{padding:17px;margin:12px 0;border:1px solid var(--line);border-radius:11px;background:var(--bg-soft)}
.support-ticket-meta{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}
.support-ticket-meta strong{font-size:14px}
.support-ticket-meta span{font-size:9px;color:var(--muted)}
.support-admin-ticket p{font-size:12px;line-height:1.7;white-space:pre-wrap;overflow-wrap:anywhere}
.support-admin-ticket form{display:flex;gap:9px;align-items:center;flex-wrap:wrap}
.support-admin-ticket select{width:auto;min-width:160px}
@media(max-width:760px){.support-layout{grid-template-columns:1fr}.support-hero{padding:36px 24px}.wrap{padding:12px 14px 38px}.card{padding:17px;margin:10px 0}.hero{padding:28px 22px}.support-admin-ticket{padding:13px}}

/* v5.51.0 — full editorial art direction inspired by premium creative/academy websites */
:root{--bg:#121714;--panel:#1b221e;--panel2:#242d27;--line:#3a463d;--muted:#aab4a8;--text:#f0f0e8;--mint:#c5cba9;--mint2:#566c4f;--gold:#d2c59a;--pv-ink:#f1f0e8;--pv-muted:#c0c8bd;--pv-line:rgba(235,235,224,.2)}
[data-theme="light"]{color-scheme:light;--bg:#f3f1e9;--panel:#fffdf7;--panel2:#eae9df;--line:#d8d6c9;--muted:#5d665d;--text:#202820;--mint:#465e45;--mint2:#344e39;--gold:#806b3e;--pv-ink:#202820;--pv-muted:#596359;--pv-line:#d6d5c9}
html,body{background:var(--bg);color:var(--text)}
body{font-family:Inter,"Helvetica Neue",Arial,sans-serif;letter-spacing:-.012em}
.wrap{max-width:1440px;padding:20px clamp(18px,4vw,58px) 64px}
.site-nav{border-radius:999px;padding:10px 15px;margin-bottom:22px;gap:18px;background:rgba(25,33,28,.94);border-color:#3b493e;box-shadow:0 12px 36px rgba(0,0,0,.1)}
.brand{gap:11px;letter-spacing:-.025em}
.brand-mark{width:39px;height:39px;border-radius:50%;background:#d8ddc8;color:#263329}
.nav-links{gap:3px}
.nav-links a{font-size:11px;padding:9px 11px;border-radius:99px}
.theme-toggle{border-radius:99px;padding:9px 12px}
[data-theme="light"] .site-nav{background:rgba(255,253,247,.94)!important;border-color:#deddd2!important;box-shadow:0 10px 32px rgba(43,48,39,.07)}
[data-theme="light"] .brand,[data-theme="light"] .brand-mark{color:#263329}
[data-theme="light"] .nav-links a{color:#455248}
[data-theme="light"] .nav-links a:hover{background:#e9eade;color:#243b2b}
[data-theme="light"] .nav-links .nav-cta{background:#344e39;color:#fff}
[data-theme="light"] .theme-toggle{background:#eeede4;color:#263329;border:1px solid #d9d8cc}
[data-theme="light"] a{color:#3c5b42}
[data-theme="light"] a:hover{color:#213e2b}
[data-theme="light"] .card,[data-theme="light"] .feature-item,[data-theme="light"] .trust-item,[data-theme="light"] .stat,[data-theme="light"] .hero-panel{background:#fffdf7;color:#202820;border-color:#deddd2}
[data-theme="light"] .card h1,[data-theme="light"] .card h2,[data-theme="light"] .card h3,[data-theme="light"] .card strong{color:#202820}
[data-theme="light"] .muted,[data-theme="light"] .card .muted,[data-theme="light"] small.muted{color:#5d665d!important}
[data-theme="light"] label,[data-theme="light"] .eyebrow{color:#465548}
[data-theme="light"] input,[data-theme="light"] select,[data-theme="light"] textarea{background:#fffefa!important;color:#202820!important;border-color:#d0d2c7!important}
[data-theme="light"] input::placeholder,[data-theme="light"] textarea::placeholder{color:#858c80}
[data-theme="light"] .btn,[data-theme="light"] .nav-cta{background:#344e39;color:#fff;border-color:#344e39}
[data-theme="light"] .btn-secondary,[data-theme="light"] .favorite-btn{background:#eeefe6;color:#2c4030;border:1px solid #d8ddcf}
[data-theme="light"] .tag{background:#e8ecdf;color:#3b5940;border-color:#d3dccd}
[data-theme="light"] .footer-grid strong{color:#202820}
[data-theme="light"] .footer-grid a{color:#46594a}
[data-theme="light"] .footer-bottom{color:#687268}
.pv-home{--pv-ink:var(--text);--pv-muted:var(--muted);--pv-line:var(--line)}
.pv-hero{min-height:650px;padding:clamp(42px,7vw,96px) clamp(24px,6vw,86px) 70px;border-radius:4px;gap:clamp(28px,5vw,74px);border:1px solid #48564a;background:radial-gradient(ellipse at 82% 18%,rgba(132,151,111,.24),transparent 34%),linear-gradient(118deg,#202a23 0%,#29372d 56%,#1e2922 100%);box-shadow:0 18px 55px rgba(0,0,0,.08)}
.pv-hero:before{opacity:.22}
.pv-hero h1{font-size:clamp(58px,8.1vw,116px);line-height:.88;letter-spacing:-.085em;max-width:900px;margin:27px 0 26px}
.pv-overline,.pv-label{font-size:9px;letter-spacing:.2em}
.pv-hero-lede{max-width:560px;font-size:clamp(15px,1.35vw,18px);line-height:1.8;color:#d0d6ca}
.pv-button{border-radius:2px;padding:16px 20px;font-size:10px;letter-spacing:.04em}
.pv-index{border-radius:3px;background:rgba(13,20,15,.42);padding:clamp(20px,2.5vw,30px);border-color:rgba(232,237,223,.28);box-shadow:0 15px 40px rgba(0,0,0,.08)}
.pv-index-total strong{font-size:clamp(70px,8vw,100px)}
.pv-index-metrics{padding:26px 0}
.pv-hero-foot{margin-top:62px}
.pv-hero-bottom{bottom:20px}
[data-theme="light"] .pv-hero{background:radial-gradient(ellipse at 88% 12%,rgba(154,166,128,.22),transparent 31%),linear-gradient(125deg,#f0efe5 0%,#e7e9dc 58%,#f6f3e9 100%)!important;border:1px solid #d4d7c9!important;color:#202820!important;box-shadow:0 18px 55px rgba(48,55,42,.07)}
[data-theme="light"] .pv-hero:before{opacity:.12;background:radial-gradient(ellipse at 85% 15%,#a9b69a 0,transparent 35%),radial-gradient(ellipse at 8% 100%,#c6cdb6 0,transparent 38%)}
[data-theme="light"] .pv-overline,[data-theme="light"] .pv-label{color:#52634f!important}
[data-theme="light"] .pv-overline i{background:#5b7654;box-shadow:none}
[data-theme="light"] .pv-hero h1{color:#202820!important;text-shadow:none}
[data-theme="light"] .pv-hero-lede{color:#505c51!important}
[data-theme="light"] .pv-announcement{color:#344c37!important;border-color:#b8c2b1}
[data-theme="light"] .pv-button-dark{background:#344e39!important;color:#fff!important}
[data-theme="light"] .pv-button-dark:hover{background:#233c2b!important;color:#fff!important}
[data-theme="light"] .pv-text-link{color:#344e39!important}
[data-theme="light"] .pv-hero-foot,[data-theme="light"] .pv-hero-bottom{color:#667264!important;border-color:#cdd2c5}
[data-theme="light"] .pv-index{background:#fffdf7!important;border:1px solid #d5d9cc!important;color:#202820!important;box-shadow:0 16px 38px rgba(44,54,42,.08);backdrop-filter:none}
[data-theme="light"] .pv-index-heading{color:#53624f!important}
[data-theme="light"] .pv-index-heading i{background:#5d7955;box-shadow:none}
[data-theme="light"] .pv-index-total{border-color:#e0e1d7}
[data-theme="light"] .pv-index-total strong{color:#26392b!important}
[data-theme="light"] .pv-index-total span{color:#697366!important}
[data-theme="light"] .pv-index-metrics b{color:#304a35!important}
[data-theme="light"] .pv-index-metrics small{color:#70796e!important}
[data-theme="light"] .pv-index>p{color:#697366!important}
[data-theme="light"] .pv-category-section,[data-theme="light"] .pv-talent-section,[data-theme="light"] .pv-faq{color:#202820}
[data-theme="light"] .pv-section-top h2,[data-theme="light"] .pv-faq h2,[data-theme="light"] .pv-manifesto h2{color:#202820!important}
[data-theme="light"] .pv-section-top>p,[data-theme="light"] .pv-manifesto-copy>p,[data-theme="light"] .pv-faq-list p{color:#596359!important}
[data-theme="light"] .pv-category-grid{border-color:#d6d6ca}
[data-theme="light"] .pv-category-grid .home-category{color:#202820;border-color:#d6d6ca}
[data-theme="light"] .home-category span,[data-theme="light"] .home-category small{color:#657064}
[data-theme="light"] .home-category strong{color:#263329}
[data-theme="light"] .pv-work-section{background:#e9e9df!important;border:1px solid #deded2}
[data-theme="light"] .home-project{color:#202820}
[data-theme="light"] .home-project-caption strong{color:#202820}
[data-theme="light"] .home-project-caption small{color:#606b60}
[data-theme="light"] .pv-work-foot{border-color:#d0d1c5;color:#606b60}
[data-theme="light"] .pv-work-foot a,[data-theme="light"] .pv-outline-link{color:#35543b}
[data-theme="light"] .pv-manifesto{border-top:1px solid #deded2;border-bottom:1px solid #deded2}
[data-theme="light"] .pv-manifesto-index{color:#6b7569}
[data-theme="light"] .pv-manifesto-points{border-color:#d6d6ca}
[data-theme="light"] .pv-manifesto-points div{border-color:#d6d6ca;color:#364238}
[data-theme="light"] .pv-manifesto-points b{color:#486649}
[data-theme="light"] .pv-join{background:linear-gradient(115deg,#26382b,#354b38)!important;color:#f4f2e9!important;border:1px solid #4c614d;border-radius:4px}
[data-theme="light"] .pv-join h2{color:#f4f2e9!important}
[data-theme="light"] .pv-join p{color:#d0d9ce!important}
[data-theme="light"] .pv-button-light{background:#f0efe5!important;color:#26382b!important}
[data-theme="light"] .pv-faq-list details,[data-theme="light"] .pv-faq-list details:first-child{border-color:#d6d6ca}
[data-theme="light"] .pv-faq-list summary{color:#263329}
[data-theme="light"] .pv-faq-list p{color:#596359}
[data-theme="dark"] .pv-hero{background:radial-gradient(ellipse at 82% 18%,rgba(132,151,111,.18),transparent 34%),linear-gradient(118deg,#171e19,#263229 60%,#171f1a);border-radius:4px}
[data-theme="dark"] .pv-index{background:rgba(10,15,11,.42);border-radius:3px}
[data-theme="dark"] .pv-work-section{background:#1a211c;border:1px solid #303c32;border-radius:4px}
[data-theme="dark"] .pv-join{border-radius:4px;background:linear-gradient(115deg,#293a2d,#1c2920)}
[data-theme="light"] .home-carousel .carousel-slide{border-radius:4px}
.home-carousel{margin-top:clamp(18px,3vw,30px)}
.pv-category-section,.pv-talent-section,.pv-work-section,.pv-faq{padding-top:clamp(58px,7vw,100px);padding-bottom:clamp(58px,7vw,100px)}
.pv-section-top{margin-bottom:34px}
.pv-talent-grid{gap:22px}
.pv-talent-grid .designer-card{border-radius:4px}
.home-project-image{border-radius:3px}
.pv-empty{border-radius:4px}
.card{border-radius:10px}
@media(max-width:900px){.site-nav{border-radius:16px}.pv-hero{padding-bottom:84px;min-height:0}.pv-index{max-width:100%}.pv-category-grid{grid-template-columns:repeat(2,1fr)}}
@media(max-width:620px){.wrap{padding:12px 14px 38px}.site-nav{padding:9px 11px;margin-bottom:14px}.nav-links{gap:1px}.nav-links a{font-size:10px;padding:7px 8px}.pv-hero{padding:38px 22px 76px}.pv-hero h1{font-size:clamp(52px,14vw,76px)}.pv-hero-foot{gap:12px;margin-top:38px}.pv-index{padding:19px}.pv-index-total{padding:26px 0 20px}.pv-section-top{align-items:start;flex-direction:column;gap:15px}.pv-category-grid{grid-template-columns:1fr 1fr}.pv-category-grid .home-category{padding:18px 12px 22px 0;min-height:155px}.pv-category-grid .home-category:not(:first-child){padding-left:12px}.pv-category-grid .home-category:nth-child(3){padding-left:0}.pv-talent-grid{grid-template-columns:1fr}.pv-project-grid{display:grid;grid-template-columns:1fr;gap:20px}.home-project,.home-project:nth-child(4n+1),.home-project:nth-child(4n+4){grid-column:1}.home-project-image,.home-project:nth-child(4n+1) .home-project-image,.home-project:nth-child(4n+2) .home-project-image{aspect-ratio:1.25}.pv-manifesto{gap:22px}.pv-join{align-items:start;flex-direction:column;padding:30px 22px}.pv-faq{gap:25px}.pv-home .carousel-slide{min-height:300px}}
@media(prefers-reduced-motion:reduce){.pv-home *, .site-nav *{scroll-behavior:auto!important;transition:none!important;animation:none!important}}

.case-builder-fields{border:1px solid var(--line);border-radius:10px;padding:14px;margin:12px 0;background:var(--bg-soft)}
.case-builder-fields summary{cursor:pointer;font-weight:800;color:var(--accent-strong);padding:4px 0 10px}
.case-builder-fields label{display:block;margin:12px 0 5px}
.case-builder-fields input,.case-builder-fields textarea{display:block;width:100%;padding:10px;border:1px solid var(--line);border-radius:7px;background:var(--surface);color:var(--text);margin:5px 0}
.case-narrative{max-width:960px;margin:clamp(45px,7vw,90px) auto;padding:0 clamp(18px,4vw,48px)}
.case-facts{display:flex;gap:clamp(22px,5vw,65px);flex-wrap:wrap;padding:24px 0;border-top:1px solid var(--line);border-bottom:1px solid var(--line);margin-bottom:60px}
.case-facts div{display:flex;flex-direction:column;gap:7px;max-width:240px}
.case-facts small{font-size:9px;letter-spacing:.15em;color:var(--muted);font-weight:850}
.case-facts strong{font-size:13px;color:var(--text)}
.case-narrative article{max-width:720px;margin:48px 0 58px}
.case-narrative article h2{font-size:clamp(32px,5vw,54px);letter-spacing:-.06em;margin:12px 0;color:var(--text)}
.case-narrative article p{font-size:15px;line-height:1.9;color:var(--muted);white-space:pre-wrap}

/* v5.53.0 — PIR Visual Identity: architectural linework + poster-inspired arcs */
:root{
  --bg:#111814;--panel:#1a231d;--panel2:#222d25;--line:#39483c;
  --muted:#aeb8aa;--text:#f1f0e8;--mint:#c5cba9;--mint2:#52694c;--gold:#d0c39a;
  --pv-pattern:rgba(197,203,169,.075);--pv-orbit:rgba(197,203,169,.10);
}
[data-theme="light"]{
  color-scheme:light;
  --bg:#e9e6dc;--panel:#f7f5ee;--panel2:#dfddcf;--line:#d0cbbb;
  --muted:#686b60;--text:#252b25;--mint:#405e45;--mint2:#36563e;--gold:#89805d;
  --pv-pattern:rgba(54,82,59,.105);--pv-orbit:rgba(114,119,83,.22);
}
html{background:var(--bg);min-height:100%;scroll-behavior:smooth}
body{
  position:relative;isolation:isolate;min-height:100vh;overflow-x:clip;
  color:var(--text);
  background-color:var(--bg)!important;
  background-image:
    radial-gradient(ellipse at 8% 4%,rgba(123,143,101,.11),transparent 32%),
    radial-gradient(ellipse at 92% 78%,rgba(123,143,101,.08),transparent 34%)!important;
  background-attachment:fixed;
}
[data-theme="light"] body{
  background-image:
    radial-gradient(ellipse at 7% 2%,rgba(171,164,128,.23),transparent 34%),
    radial-gradient(ellipse at 94% 78%,rgba(190,181,151,.18),transparent 36%)!important;
}
body:before{
  content:"";position:fixed;inset:0;z-index:-1;pointer-events:none;
  background-image:
    repeating-linear-gradient(135deg,transparent 0 39px,var(--pv-pattern) 40px,transparent 41px 80px),
    repeating-linear-gradient(45deg,transparent 0 79px,var(--pv-pattern) 80px,transparent 81px 160px);
  opacity:.68;
  mask-image:linear-gradient(180deg,#000 0%,rgba(0,0,0,.72) 62%,transparent 100%);
}
body:after{
  content:"";position:fixed;z-index:-1;pointer-events:none;
  width:min(48vw,650px);height:min(48vw,650px);right:calc(-1 * min(19vw,240px));top:calc(-1 * min(22vw,270px));
  border:clamp(28px,5vw,76px) solid var(--pv-orbit);border-radius:50%;
  box-shadow:0 0 0 clamp(20px,3vw,44px) rgba(0,0,0,0),0 0 0 clamp(22px,3.2vw,48px) var(--pv-pattern);
  opacity:.9;
}
[data-theme="light"] body:after{border-color:rgba(133,128,94,.24);box-shadow:0 0 0 28px rgba(0,0,0,0),0 0 0 30px rgba(133,128,94,.10)}
/* A second poster-like sweep anchors the lower left without covering content */
.wrap,.studio-workspace,.case-study,.shortlist-page,.dashboard-shell{position:relative}
.wrap:after{
  content:"";position:absolute;z-index:-1;pointer-events:none;
  width:clamp(240px,34vw,480px);height:clamp(240px,34vw,480px);
  left:clamp(-300px,-18vw,-140px);bottom:4%;
  border:clamp(24px,4vw,58px) solid var(--pv-orbit);border-radius:50%;
  box-shadow:0 0 0 24px transparent,0 0 0 27px var(--pv-pattern);
}
[data-theme="light"] .wrap:after{border-color:rgba(133,128,94,.20);box-shadow:0 0 0 24px transparent,0 0 0 27px rgba(133,128,94,.09)}
/* Surfaces retain contrast while allowing the new background to frame the page */
.site-nav,.studio-sidebar,.studio-welcome,.card,.hero-panel,.pv-index{
  box-shadow:0 12px 34px rgba(12,20,14,.055);
}
[data-theme="light"] .site-nav,[data-theme="light"] .studio-sidebar,[data-theme="light"] .studio-welcome{
  background:rgba(248,247,240,.94);border-color:#d0cbbb;
}
[data-theme="light"] .card,[data-theme="light"] .hero-panel,[data-theme="light"] .stat{
  background:rgba(248,247,240,.94);border-color:#d0cbbb;
}
[data-theme="dark"] .site-nav,[data-theme="dark"] .studio-sidebar,[data-theme="dark"] .card{
  background-color:rgba(26,35,29,.94);border-color:#39483c;
}
.pv-home{position:relative}
.pv-category-section,.pv-talent-section,.pv-faq{background:transparent}
.pv-work-section{position:relative;overflow:hidden}
.pv-work-section:before{
  content:"";position:absolute;inset:0;pointer-events:none;opacity:.45;
  background:repeating-linear-gradient(135deg,transparent 0 43px,var(--pv-pattern) 44px,transparent 45px 88px);
}
.pv-work-section>*{position:relative}
.pv-manifesto{position:relative}
.pv-manifesto:before{
  content:"";position:absolute;right:-7%;top:12%;width:260px;height:260px;
  border:34px solid var(--pv-orbit);border-radius:50%;pointer-events:none;opacity:.55
}
[data-theme="light"] .pv-work-section{background:rgba(220,219,207,.88)!important}
[data-theme="dark"] .pv-work-section{background:rgba(27,36,30,.9)!important}
[data-theme="light"] .pv-hero{
  background:
    repeating-linear-gradient(135deg,transparent 0 42px,rgba(54,82,59,.055) 43px,transparent 44px 86px),
    radial-gradient(ellipse at 88% 10%,rgba(173,169,132,.25),transparent 32%),
    linear-gradient(125deg,#e5e2d6 0%,#f2f0e7 58%,#e5e2d6 100%)!important;
  border-color:#c9c5b5!important;
}
[data-theme="dark"] .pv-hero{
  background:
    repeating-linear-gradient(135deg,transparent 0 42px,rgba(197,203,169,.06) 43px,transparent 44px 86px),
    radial-gradient(ellipse at 88% 10%,rgba(132,151,111,.2),transparent 32%),
    linear-gradient(125deg,#172019 0%,#26342a 58%,#19231c 100%)!important;
}
@media(max-width:700px){
  body:after{width:270px;height:270px;right:-175px;top:-130px;border-width:30px}
  .wrap:after{width:220px;height:220px;left:-170px;border-width:25px;opacity:.7}
  .pv-manifesto:before{width:150px;height:150px;border-width:20px;right:-12%}
}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}

/* v5.53.1 — refinement pass: quieter linework, asymmetric forms, consistent surfaces */
:root{
  --bg:#171d18;--panel:#202821;--panel2:#29332b;--line:#3c493d;
  --muted:#b5bcae;--text:#f0efe7;--mint:#c4c9a5;--mint2:#52694b;--gold:#c9bb91;
  --pv-pattern:rgba(202,207,178,.055);--pv-orbit:rgba(185,190,151,.12);
}
[data-theme="light"]{
  --bg:#e9e6dc;--panel:#f7f5ee;--panel2:#e2dfd3;--line:#d2cdbf;
  --muted:#62665d;--text:#292d27;--mint:#405d43;--mint2:#36553c;--gold:#81764f;
  --pv-pattern:rgba(54,78,57,.075);--pv-orbit:rgba(133,126,91,.19);
}
/* One restrained diagonal drafting line, not a dense crosshatch */
body:before{
  background-image:linear-gradient(135deg,transparent 49.72%,var(--pv-pattern) 50%,transparent 50.28%);
  background-size:190px 190px;
  opacity:.42;
  mask-image:linear-gradient(115deg,rgba(0,0,0,.9),transparent 82%);
}
/* Organic off-axis arc: intentionally irregular, no concentric ring stack */
body:after{
  width:clamp(300px,39vw,540px);height:clamp(240px,32vw,430px);
  right:calc(-1 * min(16vw,205px));top:calc(-1 * min(13vw,170px));
  border-width:clamp(30px,4.5vw,62px);
  border-radius:64% 36% 57% 43% / 44% 58% 42% 56%;
  transform:rotate(-19deg);
  box-shadow:none;opacity:.72;
}
[data-theme="light"] body:after{border-color:rgba(133,126,91,.2);box-shadow:none}
.wrap:after{
  width:clamp(230px,29vw,390px);height:clamp(185px,24vw,320px);
  left:clamp(-260px,-15vw,-120px);bottom:7%;
  border-width:clamp(24px,3.5vw,48px);
  border-radius:38% 62% 43% 57% / 55% 39% 61% 45%;
  transform:rotate(24deg);box-shadow:none;opacity:.62;
}
[data-theme="light"] .wrap:after{border-color:rgba(133,126,91,.17);box-shadow:none}
/* Navigation spacing: theme control is visually distinct from the final link */
.nav-links{gap:8px}
.nav-links .theme-toggle{margin-left:8px;padding-inline:14px;white-space:nowrap}
.theme-toggle{min-height:40px}
@media(max-width:850px){
  .nav-links{gap:6px;padding:12px}
  .nav-links .theme-toggle{width:auto;min-width:110px;align-self:flex-start;margin:8px 0 2px;padding:10px 14px}
  .nav-links .nav-cta{margin-top:3px}
  .nav-links a{width:100%;text-align:left}
}
@media(max-width:520px){
  .site-nav{column-gap:10px}
  .nav-toggle{margin-left:auto}
  .nav-links{margin-top:5px;border-radius:14px}
  .nav-links .theme-toggle{margin-top:10px}
}
/* Theme-specific shortlist hero: prevent dark text on a dark panel in light mode */
[data-theme="light"] .shortlist-hero{
  background:
    linear-gradient(115deg,rgba(233,230,220,.96),rgba(247,245,238,.98) 58%,rgba(224,221,208,.96))!important;
  color:#292d27!important;border:1px solid #d2cdbf;
  box-shadow:0 18px 48px rgba(54,57,45,.07);
}
[data-theme="light"] .shortlist-hero .eyebrow{color:#52634d!important}
[data-theme="light"] .shortlist-hero h1,
[data-theme="light"] .shortlist-hero h1 em{color:#292d27!important}
[data-theme="light"] .shortlist-hero p{color:#5d6258!important}
[data-theme="light"] .shortlist-hero:after{
  background:radial-gradient(ellipse,rgba(133,126,91,.16),transparent 70%);
  border-radius:64% 36% 57% 43%;
}
[data-theme="light"] .shortlist-hero .btn-secondary{
  background:#e4e2d7!important;color:#334a36!important;border-color:#c9c8b9!important;
}
[data-theme="light"] .shortlist-hero .btn:not(.btn-secondary){
  background:#36553c!important;color:#fff!important;border-color:#36553c!important;
}
/* Unified light-theme typography and controls on all client workspaces */
[data-theme="light"] .shortlist-toolbar h2,
[data-theme="light"] .shortlist-results h2,
[data-theme="light"] .studio-workspace h1,
[data-theme="light"] .studio-workspace h2{color:#292d27}
[data-theme="light"] .shortlist-table-wrap,
[data-theme="light"] .shortlist-table{background:#f7f5ee;color:#292d27}
[data-theme="light"] .shortlist-table th{color:#435443;background:#eeece3}
[data-theme="light"] .shortlist-table td{color:#4f574d}
[data-theme="light"] .studio-sidebar a{color:#465648}
[data-theme="light"] .studio-sidebar a.active{background:#e4e6da;color:#2e4934}
[data-theme="light"] .studio-panel,
[data-theme="light"] .studio-welcome,
[data-theme="light"] .studio-kpi,
[data-theme="light"] .studio-panel .card{
  color:#292d27;border-color:#d2cdbf;
}
@media(max-width:700px){
  body:after{width:260px;height:210px;right:-145px;top:-105px;border-width:28px}
  .wrap:after{width:200px;height:160px;left:-145px;border-width:22px;opacity:.48}
}

/* v5.54.0 — poster-inspired visual identity and corporate footer */
:root{--pv-swoosh:url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNDQwIDEwMDAiPjxnIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2E5YjE3ZCIgc3Ryb2tlLXdpZHRoPSIyNCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNLTEyMCA3MDAgQzEyMCA1NzAgMTEwIDM2MCAzMDAgMzkwIFM0NjAgNjQwIDY1MCA1MjAgUzgzMCAyNDAgMTAxMCAzMDAgUzEyMjAgNTYwIDE1NzAgMzYwIi8+PHBhdGggZD0iTS04MCA5ODAgQzEzMCA4MjAgMjEwIDc2MCAzMzAgODIwIFM1MjAgMTAxMCA2OTAgODUwIFM5MTAgNjEwIDEwOTAgNjkwIFMxMzIwIDg4MCAxNTQwIDc2MCIvPjwvZz48L3N2Zz4=");--pv-swoosh-opacity:.15;}
[data-theme="light"]{--pv-swoosh:url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNDQwIDEwMDAiPjxnIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2QwNWIzNSIgc3Ryb2tlLXdpZHRoPSIyMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNLTEyMCA3MDAgQzEyMCA1NzAgMTEwIDM2MCAzMDAgMzkwIFM0NjAgNjQwIDY1MCA1MjAgUzgzMCAyNDAgMTAxMCAzMDAgUzEyMjAgNTYwIDE1NzAgMzYwIi8+PHBhdGggZD0iTS04MCA5ODAgQzEzMCA4MjAgMjEwIDc2MCAzMzAgODIwIFM1MjAgMTAxMCA2OTAgODUwIFM5MTAgNjEwIDEwOTAgNjkwIFMxMzIwIDg4MCAxNTQwIDc2MCIvPjwvZz48L3N2Zz4=");--pv-swoosh-opacity:.20;}
/* Hand-drawn flowing paths: one expressive gesture, not a tiled grid */
body:before{
  content:"";position:fixed;inset:0;z-index:-2;pointer-events:none;
  background-image:var(--pv-swoosh);background-repeat:no-repeat;
  background-position:center 10%;background-size:cover;
  opacity:var(--pv-swoosh-opacity);mask-image:linear-gradient(180deg,#000 0%,#000 68%,transparent 100%);
}
body:after{
  width:clamp(250px,31vw,440px);height:clamp(220px,27vw,380px);
  right:-155px;top:18%;border-width:clamp(25px,4vw,54px);
  border-radius:58% 42% 36% 64% / 47% 61% 39% 53%;
  transform:rotate(31deg);box-shadow:none;opacity:.42;
}
.wrap:after{
  width:clamp(260px,32vw,460px);height:clamp(190px,24vw,340px);
  left:-235px;bottom:5%;border-width:clamp(28px,4vw,52px);
  border-radius:61% 39% 54% 46% / 41% 57% 43% 59%;
  transform:rotate(-27deg);box-shadow:none;opacity:.5;
}
/* Mobile navigation uses the same palette and component surfaces as desktop */
@media(max-width:850px){
 .nav-links{background:var(--panel)!important;color:var(--text)!important;
   border:1px solid var(--line)!important;box-shadow:0 18px 44px rgba(0,0,0,.22);
   gap:5px!important;padding:12px!important;}
 .nav-links a{color:var(--text)!important;background:transparent!important;
   border:1px solid transparent;border-radius:10px;padding:11px 12px!important;}
 .nav-links a:hover{background:var(--panel2)!important;color:var(--text)!important;}
 .nav-links .nav-cta{background:var(--mint2)!important;color:#fff!important;
   border-color:var(--mint2)!important;margin-top:5px;}
 .nav-links .theme-toggle{background:var(--panel2)!important;color:var(--text)!important;
   border:1px solid var(--line)!important;border-radius:11px;min-width:120px;
   width:auto!important;margin:10px 0 2px!important;align-self:flex-start;}
 [data-theme="light"] .nav-links{background:#f8f6ef!important;border-color:#d5d0c2!important;}
 [data-theme="light"] .nav-links a{color:#30382f!important;}
 [data-theme="light"] .nav-links a:hover{background:#ece9df!important;}
 [data-theme="light"] .nav-links .nav-cta{background:#36553c!important;color:#fff!important;}
 [data-theme="light"] .nav-links .theme-toggle{background:#eeece3!important;color:#30382f!important;border-color:#d5d0c2!important;}
}
/* Full-width editorial footer with a strong conversion band */
.foot{position:relative;isolation:isolate;margin:clamp(56px,9vw,120px) calc(-1 * clamp(14px,3vw,34px)) 0;
 padding:0 clamp(22px,5vw,72px) 26px;background:#202820;color:#f2f0e6;
 border-top:5px solid var(--mint2);overflow:hidden;}
.foot:before{content:"";position:absolute;z-index:-1;inset:0;opacity:.12;
 background-image:var(--pv-swoosh);background-size:cover;background-position:center;pointer-events:none;}
.footer-cta{display:grid;grid-template-columns:1.2fr .8fr;align-items:end;gap:30px;
 padding:clamp(38px,6vw,76px) 0;border-bottom:1px solid rgba(240,240,225,.22);}
.footer-cta .eyebrow{color:#c7cba8;letter-spacing:.18em;font-size:10px;font-weight:800;text-transform:uppercase}
.footer-cta h2{max-width:720px;margin:15px 0 0;color:#f5f1e6;font-size:clamp(38px,6.5vw,82px);
 line-height:.94;letter-spacing:-.065em}
.footer-cta h2 em{font-family:Georgia,serif;font-weight:400}
.footer-cta p{color:#c5cabb;max-width:420px;line-height:1.8}
.footer-cta-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:20px}
.footer-cta .btn-secondary{background:transparent!important;color:#f5f1e6!important;border-color:#77816f!important}
.footer-grid{display:grid;grid-template-columns:1.5fr 1fr 1fr 1fr;gap:clamp(18px,3vw,42px);padding:40px 0 32px}
.footer-brand-lockup{font-size:clamp(24px,3vw,34px);font-weight:950;letter-spacing:-.06em;color:#f5f1e6}
.footer-grid strong{display:block;color:#e2dfc9;font-size:12px;letter-spacing:.12em;text-transform:uppercase;margin-bottom:15px}
.footer-grid p{margin:0;color:#bfc6b8;line-height:2;font-size:13px}
.footer-grid a{display:inline-block;color:#d9ddcf;margin:2px 0}
.footer-grid a:hover{color:#fff;text-decoration:underline;text-underline-offset:4px}
.footer-brand-copy{max-width:300px;color:#bfc6b8!important;margin-top:12px!important}
.footer-bottom{border-top:1px solid rgba(240,240,225,.18);padding-top:18px;color:#aeb7a9;font-size:11px;line-height:1.7}
[data-theme="light"] .foot{background:#292d26;color:#f4f1e6;border-top-color:#7c8658}
[data-theme="light"] .foot .footer-grid strong{color:#e7e4d2}
[data-theme="light"] .foot .footer-grid a{color:#dce1d2}
[data-theme="light"] .foot .footer-brand-lockup{color:#fff}
@media(max-width:760px){
 .footer-cta{grid-template-columns:1fr;gap:14px;padding:40px 0}
 .footer-cta h2{font-size:clamp(40px,12vw,62px)}
 .footer-grid{grid-template-columns:1fr 1fr;gap:28px 18px;padding:30px 0}
 .footer-grid>div:first-child{grid-column:1/-1}
 .foot{margin-top:60px;padding-inline:20px}
}
@media(max-width:420px){
 .footer-grid{grid-template-columns:1fr 1fr;gap:24px 12px}
 .footer-grid p{font-size:12px}
 .footer-cta-actions .btn{width:auto}
}

/* v5.55.0 — stronger editorial hierarchy, contrast and responsive navigation */
.pv-hero{border-radius:8px;min-height:720px;box-shadow:0 28px 70px rgba(12,18,13,.13)}
.pv-hero:after{content:"";position:absolute;z-index:-1;inset:0;pointer-events:none;
 background-image:var(--pv-swoosh);background-repeat:no-repeat;background-position:82% 55%;
 background-size:115% auto;opacity:.11;mask-image:linear-gradient(90deg,transparent 5%,#000 100%)}
.pv-hero h1{max-width:900px;font-size:clamp(58px,9vw,120px);letter-spacing:-.085em}
.pv-index{box-shadow:0 22px 55px rgba(0,0,0,.12)}
.pv-category-grid .home-category{transition:background-color .28s ease,transform .34s var(--pv-ease)}
.pv-category-grid .home-category:hover{background:color-mix(in srgb,var(--surface-raised) 72%,transparent);transform:translate3d(0,-3px,0)}
.pv-talent-grid .designer-card{box-shadow:0 12px 34px rgba(20,28,21,.07);transition:transform .25s ease,box-shadow .25s ease}
.pv-talent-grid .designer-card:hover{transform:translateY(-5px);box-shadow:0 22px 46px rgba(20,28,21,.13)}
.pv-work-section{border-radius:8px;position:relative;overflow:hidden}
.pv-work-section:before{content:"";position:absolute;top:-90px;right:-130px;width:330px;height:250px;border:28px solid var(--pv-orbit);border-radius:42% 58% 62% 38% / 54% 39% 61% 46%;transform:rotate(-25deg);pointer-events:none}
.home-project-image{border-radius:4px;box-shadow:0 14px 32px rgba(20,24,20,.1)}
.pv-join{position:relative;isolation:isolate;overflow:hidden;border-radius:6px;
 background:radial-gradient(ellipse at 88% 15%,rgba(157,174,128,.2),transparent 36%),
 linear-gradient(118deg,#202a23,#314333 62%,#202b23);box-shadow:0 24px 54px rgba(20,28,20,.12)}
.pv-join:after{content:"";position:absolute;z-index:-1;right:-90px;bottom:-160px;width:430px;height:310px;
 border:34px solid rgba(207,216,174,.14);border-radius:63% 37% 52% 48% / 45% 59% 41% 55%;
 transform:rotate(-18deg);pointer-events:none}
.pv-join .pv-label{color:#d5d9bd}
.pv-faq-list details{transition:padding .2s ease}
.pv-faq-list details[open]{padding:23px 18px;background:var(--surface-raised);border-radius:8px}
.pv-home .home-carousel{border-radius:8px}
.pv-home .carousel-slide{border-radius:5px}
/* Footer: force readable contrast over broad theme-level heading/link rules */
#main-content .foot{background:#202a23!important;color:#f4f1e7!important;border-top:5px solid #84916c!important}
#main-content .foot:before{opacity:.055!important;background-position:right bottom!important;background-size:88% auto!important;
 mask-image:linear-gradient(90deg,transparent 0%,#000 78%)}
#main-content .foot .footer-cta{align-items:center;grid-template-columns:1.12fr .88fr;gap:clamp(26px,5vw,76px);
 padding:clamp(48px,7vw,88px) 0;border-bottom:1px solid rgba(241,240,224,.24)}
#main-content .foot .footer-cta .eyebrow{display:inline-flex;color:#cbd4a9!important;font-size:10px;
 letter-spacing:.2em;font-weight:850}
#main-content .foot .footer-cta h2{display:block!important;visibility:visible!important;opacity:1!important;
 max-width:760px;margin:18px 0 0!important;color:#f7f4e9!important;
 font-size:clamp(46px,6.3vw,82px)!important;line-height:.94!important;letter-spacing:-.075em!important;
 font-weight:760!important}
#main-content .foot .footer-cta h2 em{color:#d6d8bf!important;font-family:Georgia,serif!important;font-weight:400!important}
#main-content .foot .footer-cta p{color:#d0d6c9!important;max-width:440px;font-size:14px;line-height:1.85}
#main-content .foot .footer-cta-actions{gap:12px}
#main-content .foot .footer-cta-actions .btn{background:#e7e8d9!important;color:#243128!important;border:1px solid #e7e8d9!important}
#main-content .foot .footer-cta-actions .btn:hover{background:#fff!important;color:#1e2b22!important}
#main-content .foot .footer-cta-actions .btn-secondary{background:transparent!important;color:#f5f2e8!important;border:1px solid rgba(235,238,220,.48)!important}
#main-content .foot .footer-grid{grid-template-columns:1.45fr 1fr 1fr 1fr;gap:clamp(22px,4vw,54px);padding:42px 0 36px}
#main-content .foot .footer-brand-lockup{color:#fff!important;font-size:clamp(27px,3.3vw,38px);letter-spacing:-.07em}
#main-content .foot .footer-brand-copy{color:#cbd2c5!important;max-width:310px;font-size:13px;line-height:1.9}
#main-content .foot .footer-grid strong{color:#dfe4cf!important;font-size:11px;letter-spacing:.16em;margin-bottom:16px}
#main-content .foot .footer-grid p{color:#cbd2c5!important;font-size:13px;line-height:2.05}
#main-content .foot .footer-grid a{display:block!important;width:fit-content;color:#e2e7d9!important;
 margin:3px 0!important;text-decoration:none!important;transition:color .18s ease,transform .18s ease}
#main-content .foot .footer-grid a:hover{color:#fff!important;transform:translateX(3px);text-decoration:underline!important;text-underline-offset:4px}
#main-content .foot .footer-bottom{color:#b9c3b5!important;border-top:1px solid rgba(241,240,224,.2);
 padding-top:20px;font-size:11px;line-height:1.8}
[data-theme="light"] #main-content .foot,
[data-theme="dark"] #main-content .foot{background:#202a23!important;color:#f4f1e7!important}
[data-theme="light"] #main-content .foot h2,
[data-theme="dark"] #main-content .foot h2{color:#f7f4e9!important}
[data-theme="light"] #main-content .foot p,
[data-theme="dark"] #main-content .foot p{color:#cbd2c5!important}
[data-theme="light"] #main-content .foot a,
[data-theme="dark"] #main-content .foot a{color:#e2e7d9!important}
/* Collapse the crowded desktop navigation before it begins squeezing labels */
@media(max-width:1040px){
 .site-nav{align-items:center!important;flex-wrap:wrap!important}
 .nav-toggle{display:block!important;margin-left:auto!important}
 .nav-links{display:none!important;width:100%!important;flex-direction:column!important;align-items:stretch!important;
   gap:5px!important;padding:12px!important;margin-top:8px!important;border-radius:14px!important;
   background:#202a23!important;color:#f4f1e7!important;border:1px solid #465448!important;
   box-shadow:0 18px 44px rgba(0,0,0,.22)}
 .nav-links.open{display:flex!important}
 .nav-links a{display:block!important;width:100%!important;text-align:left!important;padding:11px 12px!important;
   color:#e8ecdf!important;background:transparent!important;border-radius:9px!important;font-size:13px!important}
 .nav-links a:hover{background:#344338!important;color:#fff!important}
 .nav-links .nav-cta{background:#526b4c!important;color:#fff!important;margin-top:5px}
 .nav-links .theme-toggle{width:fit-content!important;min-width:124px!important;align-self:flex-start!important;
   margin:9px 0 1px!important;padding:10px 14px!important;background:#344338!important;
   color:#f4f1e7!important;border:1px solid #5c6b57!important;border-radius:10px!important}
 [data-theme="light"] .nav-links{background:#f8f6ef!important;color:#2c342c!important;border-color:#d3cebf!important}
 [data-theme="light"] .nav-links a{color:#303a31!important}
 [data-theme="light"] .nav-links a:hover{background:#e9e7dc!important;color:#243629!important}
 [data-theme="light"] .nav-links .nav-cta{background:#36553c!important;color:#fff!important}
 [data-theme="light"] .nav-links .theme-toggle{background:#e9e7dc!important;color:#29362d!important;border-color:#d3cebf!important}
 #main-content .foot .footer-cta{grid-template-columns:1fr;gap:12px}
 #main-content .foot .footer-grid{grid-template-columns:1fr 1fr;gap:28px 22px}
 #main-content .foot .footer-grid>div:first-child{grid-column:1/-1}
}
@media(max-width:560px){
 #main-content .foot{padding-inline:20px!important}
 #main-content .foot .footer-cta{padding:42px 0}
 #main-content .foot .footer-cta h2{font-size:clamp(42px,11vw,60px)!important}
 #main-content .foot .footer-grid{grid-template-columns:1fr 1fr;gap:25px 14px;padding:30px 0}
 #main-content .foot .footer-grid p{font-size:12px;line-height:1.95}
 .pv-hero:after{background-position:70% 55%;background-size:180% auto;opacity:.08}
}

/* v5.56.0 — creative index, designer identity and editorial case studies */
.category-editorial{max-width:1180px;margin:0 auto}
.category-intro{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(250px,.65fr);gap:clamp(30px,7vw,100px);align-items:end;padding:clamp(52px,8vw,105px) 0 72px;border-bottom:1px solid var(--line)}
.category-intro-copy>.eyebrow,.category-index-heading .eyebrow,.case-heading .eyebrow{color:var(--accent-strong);font-size:9px;letter-spacing:.2em;font-weight:900}
.category-intro h1{font-size:clamp(58px,9vw,116px);line-height:.88;letter-spacing:-.09em;margin:23px 0 24px;max-width:850px}
.category-intro h1 em{font-family:Georgia,serif;font-weight:400;color:var(--accent-strong)}
.category-intro-copy>p{max-width:610px;color:var(--muted);font-size:clamp(15px,1.6vw,18px);line-height:1.85}
.category-intro-note{border-left:1px solid var(--line);padding:10px 0 8px 26px}
.category-intro-note>span{font-size:8px;letter-spacing:.18em;font-weight:900;color:var(--subtle)}
.category-intro-note>strong{display:block;margin:18px 0 13px;font-size:clamp(23px,3vw,34px);line-height:1.05;letter-spacing:-.06em}
.category-intro-note>p{font-size:12px;line-height:1.8;color:var(--muted);margin:0 0 18px}
.category-intro-note>a,.category-index-heading>a{font-size:11px;font-weight:850;color:var(--accent-strong)}
.category-index{padding:clamp(58px,8vw,100px) 0}
.category-index-heading{display:flex;justify-content:space-between;align-items:end;gap:30px;margin-bottom:32px}
.category-index-heading h2{font-size:clamp(36px,5.4vw,68px);line-height:.95;letter-spacing:-.075em;margin:13px 0 0}
.category-index-heading h2>span{color:var(--accent-strong)}
.category-index-heading>p{max-width:360px;color:var(--muted);font-size:12px;line-height:1.8;margin:0}
.category-tile-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
.category-tile{--cat-bg:#25352b;--cat-ink:#f4f0e5;--cat-muted:#d0d8ca;--cat-accent:#d6cda9;
 position:relative;isolation:isolate;display:grid;grid-template-columns:minmax(110px,.62fr) minmax(0,1fr);
 align-items:center;gap:18px;min-height:255px;padding:22px 25px;border:1px solid color-mix(in srgb,var(--cat-ink) 17%,transparent);
 border-radius:5px;overflow:hidden;background:var(--cat-bg);color:var(--cat-ink);text-decoration:none;
 transition:transform .25s ease,box-shadow .25s ease}
.category-tile:hover{transform:translateY(-4px);box-shadow:0 20px 42px rgba(20,28,20,.15)}
.category-tile-top{position:absolute;left:22px;right:22px;top:17px;display:flex;justify-content:space-between;gap:12px;
 font-size:8px;letter-spacing:.14em;font-weight:850;color:var(--cat-muted)}
.category-tile-art{position:relative;display:grid;place-items:center;min-height:150px;overflow:hidden}
.category-tile-art>span{position:relative;z-index:1;font-size:clamp(54px,7vw,92px);line-height:1;font-weight:850;
 letter-spacing:-.1em;color:var(--cat-accent);text-shadow:0 12px 35px rgba(0,0,0,.12);transform:rotate(-7deg)}
.category-tile-art:before,.category-tile-art:after{content:"";position:absolute;border:1px solid color-mix(in srgb,var(--cat-accent) 55%,transparent);
 border-radius:50%;width:125px;height:125px;transform:rotate(-25deg)}
.category-tile-art:after{width:165px;height:90px;border-radius:50%;transform:rotate(36deg)}
.category-tile-art i{position:absolute;width:13px;height:13px;border-radius:50%;background:var(--cat-accent);right:15%;top:22%}
.category-tile-copy{padding:22px 0 4px}
.category-tile-copy h2{font-size:clamp(21px,2.5vw,31px);line-height:1;letter-spacing:-.055em;margin:0 0 10px;color:var(--cat-ink)}
.category-tile-copy p{max-width:290px;min-height:58px;margin:0;color:var(--cat-muted);font-size:11px;line-height:1.7}
.category-tile-foot{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:17px;padding-top:12px;border-top:1px solid color-mix(in srgb,var(--cat-ink) 20%,transparent)}
.category-tile-foot>span{font-size:7px;letter-spacing:.11em;color:var(--cat-muted);font-weight:850}
.category-tile-foot>b{font-size:11px;color:var(--cat-accent);white-space:nowrap}
.category-tone-1{--cat-bg:#25332a;--cat-ink:#f4f0e5;--cat-muted:#c7d0c3;--cat-accent:#d2c8a3}
.category-tone-2{--cat-bg:#dce3d6;--cat-ink:#202d24;--cat-muted:#536355;--cat-accent:#58744f}
.category-tone-3{--cat-bg:#b9583e;--cat-ink:#fff2e8;--cat-muted:#f5d5c8;--cat-accent:#f7d9a9}
.category-tone-4{--cat-bg:#e8d8d0;--cat-ink:#352a29;--cat-muted:#71605b;--cat-accent:#b55f4b}
.category-tone-5{--cat-bg:#343039;--cat-ink:#f5edf0;--cat-muted:#d0c3cd;--cat-accent:#d9a8c0}
.category-tone-6{--cat-bg:#c9d4d7;--cat-ink:#25343a;--cat-muted:#52656a;--cat-accent:#567f8c}
.category-tone-7{--cat-bg:#d9c9a8;--cat-ink:#342d22;--cat-muted:#75664c;--cat-accent:#8a673a}
.category-tone-8{--cat-bg:#66765a;--cat-ink:#f6f2e6;--cat-muted:#e0e6d5;--cat-accent:#e6d4a4}
.category-tone-9{--cat-bg:#e8e8dc;--cat-ink:#26332a;--cat-muted:#617065;--cat-accent:#405c47}
.category-tone-10{--cat-bg:#343b3b;--cat-ink:#f3f0e8;--cat-muted:#c7d0ca;--cat-accent:#c2d0c4}
.category-recent{padding:0 0 clamp(65px,9vw,110px)}
.category-recent-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}
.category-recent-card{display:block;color:var(--text);text-decoration:none;min-width:0}
.category-recent-image{position:relative;aspect-ratio:1.18;overflow:hidden;background:var(--surface-raised);border-radius:4px}
.category-recent-image img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .6s ease}
.category-recent-card:hover img{transform:scale(1.04)}
.category-recent-image>span,.case-related-image>span{position:absolute;top:12px;left:12px;padding:6px 8px;background:rgba(20,25,21,.78);color:#fff;font-size:9px;letter-spacing:.12em}
.category-recent-caption,.case-related-caption{display:flex;justify-content:space-between;align-items:start;gap:12px;padding:13px 1px}
.category-recent-caption>div,.case-related-caption>div{display:flex;flex-direction:column;gap:4px}
.category-recent-caption small,.case-related-caption small{font-size:8px;letter-spacing:.14em;color:var(--subtle);font-weight:850}
.category-recent-caption strong,.case-related-caption strong{font-size:16px;letter-spacing:-.035em}
.category-recent-caption span,.case-related-caption span{font-size:10px;color:var(--muted)}
.category-recent-caption>b,.case-related-caption>b{color:var(--accent-strong)}
.category-recent .category-index-heading{margin-bottom:26px}
.category-recent .category-index-heading h2{font-size:clamp(34px,4.5vw,56px)}
/* Designer profile: a clear personal masthead and intentional portfolio rhythm */
.designer-showcase{max-width:1240px;margin:0 auto}
.designer-cover{position:relative;isolation:isolate;min-height:490px;padding:clamp(25px,4vw,55px) 0 clamp(45px,6vw,75px)}
.designer-cover:before{content:"";position:absolute;z-index:-1;inset:0 0 20px;pointer-events:none;opacity:.13;
 background-image:var(--pv-swoosh);background-repeat:no-repeat;background-position:78% 48%;background-size:cover}
.showcase-cover-index{display:flex;justify-content:space-between;gap:15px;margin-bottom:25px;color:var(--subtle);
 font-size:8px;font-weight:900;letter-spacing:.16em}
.designer-cover-copy .eyebrow{color:var(--accent-strong);font-weight:850;letter-spacing:.16em}
.designer-cover h1{max-width:800px;font-size:clamp(60px,9vw,116px);letter-spacing:-.09em}
.designer-intro{max-width:620px}
.designer-portrait{border-radius:5px;min-height:440px;box-shadow:0 24px 50px rgba(20,28,20,.12)}
.designer-portrait img{min-height:440px;max-height:600px}
.portrait-caption{left:0;right:0;bottom:0;padding:18px 20px;display:flex;justify-content:space-between;align-items:center;gap:10px;
 background:linear-gradient(0deg,rgba(14,20,16,.78),transparent);font-size:8px}
.portrait-caption i{font-style:normal;letter-spacing:.12em}
.showcase-facts{grid-template-columns:repeat(6,minmax(0,1fr));gap:15px;padding:20px 0}
.showcase-facts strong{font-size:13px;line-height:1.4}
.showcase-section{margin:clamp(65px,8vw,105px) 0}
.showcase-section-heading{margin-bottom:32px}
.showcase-section-heading h2{font-size:clamp(40px,5.5vw,68px)}
.capability-tags .tag{transition:transform .2s ease,background .2s ease}
.capability-tags .capability-tag-link{display:inline-flex;text-decoration:none;font-size:11px}
.capability-tags .capability-tag-link:hover{transform:translateY(-2px);background:var(--surface)}
.showcase-work-grid{column-gap:26px}
.showcase-work{color:var(--text)}
.showcase-work-image{border-radius:4px;background:var(--surface-raised)}
.showcase-work-index{border-radius:2px}
.showcase-work-featured{position:absolute;top:14px;right:14px;background:#e8e4d1;color:#253329;padding:6px 8px;
 font-size:8px;font-weight:900;letter-spacing:.13em}
.showcase-work-meta{padding:15px 2px 20px}
.showcase-work-meta h3{font-size:clamp(19px,2vw,25px)}
.showcase-services>.card{border-radius:5px;padding:24px;border-color:var(--line);background:var(--surface)}
.showcase-contact{border-radius:5px;position:relative;overflow:hidden}
.showcase-contact:after{content:"";position:absolute;right:-100px;bottom:-150px;width:330px;height:260px;
 border:30px solid color-mix(in srgb,var(--accent) 22%,transparent);border-radius:48% 52% 62% 38% / 56% 44% 56% 44%;transform:rotate(-22deg);pointer-events:none}
.showcase-contact>*{position:relative;z-index:1}
/* Project case study: project metadata, narrative and creator attribution */
.case-study{max-width:1240px}
.case-heading{max-width:1000px;padding:34px 0 38px}
.case-heading-top{display:flex;justify-content:space-between;align-items:center;gap:18px}
.case-heading-index{font-size:8px;letter-spacing:.16em;font-weight:900;color:var(--subtle)}
.case-category-label{display:block;margin-top:35px;color:var(--accent-strong);font-size:9px;font-weight:900;letter-spacing:.18em;text-transform:uppercase}
.case-heading h1{max-width:1050px;font-size:clamp(58px,9.5vw,122px);letter-spacing:-.09em;line-height:.88;margin:15px 0 24px}
.case-heading>p{max-width:700px;font-size:clamp(16px,1.7vw,20px);line-height:1.8}
.case-byline{padding-top:20px;border-top:1px solid var(--line);max-width:700px}
.case-byline a{color:var(--accent-strong)}
.case-meta-strip{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px;padding:20px 0;margin:0 0 22px;
 border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.case-meta-strip>div{display:flex;flex-direction:column;gap:7px}
.case-meta-strip small{font-size:8px;letter-spacing:.16em;font-weight:900;color:var(--subtle)}
.case-meta-strip strong{font-size:12px;color:var(--text)}
.case-cover{position:relative;border-radius:4px;background:var(--surface-raised);border:0;overflow:hidden}
.case-cover img{width:100%;max-height:880px;object-fit:contain;display:block}
.case-cover figcaption{display:flex;justify-content:space-between;gap:15px;padding:12px 2px;color:var(--subtle);font-size:8px;letter-spacing:.14em;font-weight:850}
.case-gallery-section{margin:clamp(55px,7vw,90px) 0}
.case-subheading{display:flex;justify-content:space-between;align-items:end;margin-bottom:22px}
.case-subheading h2{font-size:clamp(30px,4vw,48px);letter-spacing:-.06em;margin:9px 0 0}
.case-gallery{margin:0;gap:16px}
.case-gallery-item{border-radius:4px}
.case-gallery-item:nth-child(3n){grid-column:span 2}
.case-narrative{max-width:none;margin:clamp(65px,9vw,110px) 0;padding:clamp(25px,5vw,60px) 0;
 border-top:1px solid var(--line);border-bottom:1px solid var(--line);display:grid;grid-template-columns:.7fr 1.3fr;gap:clamp(25px,7vw,95px)}
.case-narrative-heading{align-self:start;position:sticky;top:35px}
.case-narrative-heading h2{font-size:clamp(40px,5.5vw,68px);line-height:.95;letter-spacing:-.08em;margin:17px 0}
.case-narrative-heading h2 em{font-family:Georgia,serif;font-weight:400}
.case-narrative-content .case-facts{margin-bottom:42px}
.case-narrative-content article{max-width:680px;margin:0 0 46px}
.case-narrative-content article:last-child{margin-bottom:0}
.case-narrative-content article h3{font-size:clamp(23px,3vw,34px);letter-spacing:-.05em;margin:9px 0}
.case-narrative-content article p{color:var(--muted);font-size:14px;line-height:1.9;white-space:pre-line}
.case-creator-card{display:flex;align-items:center;gap:18px;padding:22px;border:1px solid var(--line);border-radius:5px;background:var(--surface)}
.case-creator-avatar{width:64px;height:64px;flex:0 0 64px;border-radius:50%;overflow:hidden;background:var(--surface-raised);display:grid;place-items:center}
.case-creator-avatar img{width:100%;height:100%;object-fit:cover}
.case-creator-avatar span{font-size:27px;font-weight:850;color:var(--accent-strong)}
.case-creator-copy{flex:1;min-width:0}
.case-creator-copy>span{font-size:8px;letter-spacing:.16em;font-weight:900;color:var(--subtle)}
.case-creator-copy h2{font-size:22px;letter-spacing:-.05em;margin:4px 0}
.case-creator-copy p{font-size:11px;color:var(--muted);margin:0}
.case-creator-card>a{font-size:11px;font-weight:850;color:var(--accent-strong);white-space:nowrap}
.case-related{margin:clamp(60px,8vw,100px) 0}
.case-related-heading{display:flex;justify-content:space-between;align-items:end;gap:20px;margin-bottom:24px}
.case-related-heading h2{font-size:clamp(34px,5vw,58px);letter-spacing:-.07em;line-height:.95;margin:10px 0 0}
.case-related-heading h2 span{color:var(--accent-strong)}
.case-related-heading>a{font-size:11px;font-weight:850;color:var(--accent-strong)}
.case-related-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}
.case-related-card{display:block;color:var(--text);text-decoration:none;min-width:0}
.case-related-image{position:relative;aspect-ratio:1.15;overflow:hidden;background:var(--surface-raised);border-radius:4px}
.case-related-image img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .6s ease}
.case-related-card:hover img{transform:scale(1.04)}
.case-related-caption span a{color:var(--accent-strong);font-weight:800}
.case-footer{align-items:center;margin-top:70px;padding:35px 0}
.case-footer p{max-width:560px;color:var(--muted);font-size:13px;line-height:1.8}
@media(max-width:900px){
 .category-intro{grid-template-columns:1fr;gap:25px}
 .category-intro-note{max-width:540px}
 .showcase-facts{grid-template-columns:repeat(3,minmax(0,1fr))}
 .case-narrative{grid-template-columns:1fr;gap:20px}
 .case-narrative-heading{position:static}
}
@media(max-width:650px){
 .category-intro{padding-top:40px;padding-bottom:48px}
 .category-intro h1{font-size:clamp(54px,14vw,78px)}
 .category-intro-note{padding-left:18px}
 .category-index-heading{display:block}
 .category-index-heading>p{margin-top:16px}
 .category-tile-grid{grid-template-columns:1fr;gap:12px}
 .category-tile{min-height:220px;padding:18px;grid-template-columns:minmax(90px,.55fr) minmax(0,1fr);gap:12px}
 .category-tile-top{left:17px;right:17px;top:13px;font-size:7px}
 .category-tile-art{min-height:130px}
 .category-tile-copy{padding-top:23px}
 .category-tile-copy p{min-height:0}
 .category-recent-grid{grid-template-columns:1fr;gap:16px}
 .category-recent-image{aspect-ratio:1.35}
 .showcase-cover-index{font-size:7px}
 .designer-cover{padding-top:18px;gap:24px}
 .designer-cover h1{font-size:clamp(52px,13vw,78px)}
 .designer-portrait,.designer-portrait img{min-height:280px;max-height:390px}
 .showcase-facts{grid-template-columns:repeat(2,minmax(0,1fr));gap:17px 12px}
 .showcase-work-grid{columns:1}
 .case-heading{padding-top:15px}
 .case-heading-top{align-items:start;flex-direction:column;gap:7px}
 .case-category-label{margin-top:26px}
 .case-heading h1{font-size:clamp(52px,13vw,78px)}
 .case-meta-strip{grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
 .case-cover{margin-inline:-2px}
 .case-gallery{grid-template-columns:1fr}
 .case-gallery-item:nth-child(3n){grid-column:auto}
 .case-gallery-item img{max-height:none}
 .case-narrative{padding:30px 0}
 .case-creator-card{align-items:flex-start;flex-wrap:wrap;padding:17px}
 .case-creator-copy{flex-basis:calc(100% - 84px)}
 .case-creator-card>a{margin-left:82px}
 .case-related-heading{align-items:start;flex-direction:column}
 .case-related-grid{grid-template-columns:1fr;gap:16px}
 .case-related-image{aspect-ratio:1.35}
 .case-footer{display:block}
}

/* v5.57.0 — Visual Site Studio */
.studio-cms-shell{margin:clamp(55px,7vw,90px) 0;padding:0;border:0;border-radius:0;background:transparent;box-shadow:none}.studio-cms-main,#studio-editor{background:transparent!important;border:0!important;outline:0!important;box-shadow:none!important}
.studio-cms-header{display:flex;justify-content:space-between;align-items:end;gap:24px;margin-bottom:26px}
.studio-cms-header .eyebrow{font-size:9px;letter-spacing:.18em;font-weight:900;color:var(--accent-strong)}
.studio-cms-header h2{font-size:clamp(32px,5vw,54px);letter-spacing:-.07em;margin:9px 0}
.studio-cms-header h2 span{color:var(--accent-strong)}
.studio-cms-header p{max-width:620px;color:var(--muted);font-size:13px;line-height:1.75;margin:0}
.studio-cms-actions{display:flex;gap:9px;flex-wrap:wrap}
.studio-cms-layout{display:grid;grid-template-columns:minmax(0,1fr) minmax(250px,340px);gap:20px;align-items:start}
.studio-cms-main{min-width:0}
.studio-editor-section{padding:25px 0;border-top:1px solid var(--line);background:transparent!important;border-radius:0!important;box-shadow:none!important}
.studio-editor-heading{margin-bottom:18px}
.studio-editor-heading>span,.studio-card-kicker{font-size:8px;letter-spacing:.17em;font-weight:900;color:var(--accent-strong)}
.studio-editor-heading h3{font-size:22px;letter-spacing:-.04em;margin:7px 0}
.studio-editor-heading p{max-width:620px;color:var(--muted);font-size:11px;line-height:1.7;margin:0}
.studio-section-list{display:grid;gap:8px}
.studio-section-control{display:grid;grid-template-columns:minmax(0,1fr) auto 88px;gap:15px;align-items:center;padding:13px 15px;border:1px solid var(--line);border-radius:10px;background:var(--surface)}
.studio-section-copy{display:flex;flex-direction:column;gap:4px;min-width:0}
.studio-section-copy strong{font-size:12px}
.studio-section-copy small{font-size:10px;color:var(--muted)}
.studio-toggle{display:inline-flex;align-items:center;gap:7px;font-size:10px;color:var(--muted);white-space:nowrap}
.studio-toggle input{width:16px;height:16px;accent-color:var(--accent)}
.studio-order{display:flex;align-items:center;gap:7px;font-size:10px;color:var(--muted)}
.studio-order select{width:52px;padding:6px}
.studio-form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px}
.studio-field{display:flex;flex-direction:column;gap:7px;font-size:11px;font-weight:750;color:var(--text)}
.studio-field-wide{grid-column:1/-1}
.studio-field input,.studio-field textarea,.studio-category-control textarea,.studio-faq-control input,.studio-faq-control textarea,.banner-editor input,.banner-editor textarea,.banner-editor select{width:100%;min-width:0;padding:11px 12px;border:1px solid var(--line);border-radius:8px;background:var(--surface);color:var(--text);font:inherit;font-size:12px;line-height:1.6}
.studio-field textarea,.studio-category-control textarea,.studio-faq-control textarea,.banner-editor textarea{min-height:88px;resize:vertical}
.studio-field input:focus,.studio-field textarea:focus,.studio-category-control textarea:focus,.studio-faq-control input:focus,.studio-faq-control textarea:focus,.banner-editor input:focus,.banner-editor textarea:focus,.banner-editor select:focus{outline:2px solid color-mix(in srgb,var(--accent) 55%,transparent);outline-offset:1px}
.studio-category-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.studio-category-control,.studio-faq-control{padding:14px;border:1px solid var(--line);border-radius:10px;background:var(--surface);min-width:0}
.studio-category-control>div{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:12px}
.studio-category-control strong{font-size:12px}
.studio-category-control textarea{font-size:11px}
.studio-faq-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.studio-faq-control{display:flex;flex-direction:column;gap:8px}
.studio-faq-control label,.banner-editor label{font-size:10px;font-weight:750;color:var(--muted)}
.studio-faq-control input,.studio-faq-control textarea{font-size:11px}
.banner-editor-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.banner-editor{display:flex;flex-direction:column;gap:8px;min-width:0;padding:15px;background:var(--surface);border:1px solid var(--line);border-radius:10px}
.banner-editor h3{font-size:15px;margin:0}
.banner-editor .studio-toggle{margin-bottom:4px}
.banner-editor input,.banner-editor textarea,.banner-editor select{font-size:11px;padding:9px}
.studio-savebar{position:sticky;bottom:10px;z-index:5;display:flex;justify-content:space-between;align-items:center;gap:16px;padding:15px 17px;margin-top:20px;border:1px solid var(--line);border-radius:12px;background:color-mix(in srgb,var(--surface) 92%,transparent);backdrop-filter:blur(14px);box-shadow:0 12px 35px rgba(0,0,0,.13)}
.studio-savebar>div{display:flex;flex-direction:column;gap:3px}
.studio-savebar strong{font-size:12px}
.studio-savebar span{font-size:10px;color:var(--muted)}
.studio-preview{position:sticky;top:20px;overflow:hidden;border:1px solid var(--line);border-radius:12px;background:var(--surface)}
.studio-preview-head{display:flex;justify-content:space-between;align-items:center;padding:13px 15px;border-bottom:1px solid var(--line)}
.studio-preview-head>div{display:flex;flex-direction:column;gap:4px}
.studio-preview-head .eyebrow{font-size:8px;letter-spacing:.16em;color:var(--accent-strong);font-weight:900}
.studio-preview-head strong{font-size:12px}
.studio-preview-head form button{padding:7px 10px;border:1px solid var(--line);border-radius:7px;background:var(--surface-raised);color:var(--text);font-size:10px;font-weight:800;cursor:pointer}
.studio-preview iframe{display:block;width:100%;height:650px;border:0;background:#101710}
.studio-preview>p{padding:11px 13px;margin:0;color:var(--muted);font-size:9px;line-height:1.6}
.pv-managed-title{white-space:normal}
@media(max-width:1050px){
 .studio-cms-layout{grid-template-columns:1fr}
 .studio-preview{position:static}
 .studio-preview iframe{height:460px}
}
@media(max-width:760px){
 .studio-cms-header{display:block}
 .studio-cms-actions{margin-top:16px}
 .studio-section-control{grid-template-columns:minmax(0,1fr) auto;gap:10px}
 .studio-order{grid-column:1/-1;justify-content:flex-end}
 .studio-form-grid,.studio-category-grid{grid-template-columns:1fr}
 .studio-faq-grid,.banner-editor-grid{grid-template-columns:1fr}
 .studio-savebar{align-items:flex-start;flex-direction:column}
 .studio-savebar .btn{width:100%;text-align:center}
}

/* v5.58.0 — PIR Visual Identity: warm editorial surfaces, flowing linework, balanced themes */
:root{
  color-scheme:dark;
  --bg:#1b1e1c;--bg-soft:#222824;--surface:#292e2a;--surface-raised:#343a34;
  --line:#4b5148;--text:#f3efe5;--muted:#c1bdb0;--subtle:#9e9e91;
  --accent:#aab69a;--accent-strong:#cbd2b8;--accent-ink:#20271f;
  --gold:#d5ad88;--danger:#e5a49b;--shadow:0 22px 60px rgba(0,0,0,.24);
}
[data-theme="light"]{
  color-scheme:light;
  --bg:#f1ede3;--bg-soft:#e8e2d5;--surface:#fbf8f0;--surface-raised:#fffdf7;
  --line:#d8d0c1;--text:#292a25;--muted:#625f55;--subtle:#817b70;
  --accent:#647b5b;--accent-strong:#354e39;--accent-ink:#fffaf0;
  --gold:#b45e42;--danger:#a63e35;--shadow:0 22px 60px rgba(58,49,35,.09);
}
html{background:var(--bg)}
body{
  position:relative;isolation:isolate;
  background:
    radial-gradient(ellipse at 84% 4%,color-mix(in srgb,var(--accent) 13%,transparent),transparent 32%),
    radial-gradient(ellipse at 8% 46%,color-mix(in srgb,var(--gold) 8%,transparent),transparent 30%),
    var(--bg);
  color:var(--text);
}
body:before{
  content:"";position:fixed;inset:0;z-index:0;pointer-events:none;opacity:.17;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1600 1000'%3E%3Cpath d='M-120 720 C 160 450 360 1010 690 690 S 1120 370 1710 650' fill='none' stroke='%23b85e42' stroke-width='22' stroke-linecap='round' opacity='.8'/%3E%3Cpath d='M-130 790 C 210 530 420 1050 740 760 S 1200 510 1700 770' fill='none' stroke='%237b8c70' stroke-width='9' stroke-linecap='round' opacity='.7'/%3E%3C/svg%3E");
  background-size:cover;background-position:center;background-repeat:no-repeat;
}
[data-theme="dark"] body:before{opacity:.10;mix-blend-mode:screen}
[data-theme="light"] body:before{opacity:.20;mix-blend-mode:multiply}
.wrap{position:relative;z-index:1;max-width:1360px;padding:24px clamp(14px,3vw,38px) 72px}
.site-nav{
  gap:18px;padding:11px 16px;border-radius:14px;
  background:color-mix(in srgb,var(--surface-raised) 92%,transparent);
  border:1px solid var(--line);box-shadow:0 12px 36px color-mix(in srgb,var(--text) 7%,transparent);
}
.brand{gap:11px;min-width:190px;color:var(--text)}
.brand .brand-emblem{width:42px;height:42px;border-radius:50%;object-fit:cover}
.nav-links{gap:7px}
.nav-links a{padding:9px 11px;border-radius:8px;color:var(--muted);font-size:11px}
.nav-links a:hover{background:var(--bg-soft);color:var(--text)}
.nav-links .nav-cta{background:var(--accent-strong);color:var(--accent-ink);margin-left:5px}
.theme-toggle{margin-left:7px;min-height:38px;padding:8px 12px;border-color:var(--line);background:var(--surface);color:var(--text);white-space:nowrap}
.nav-toggle{background:var(--surface-raised);color:var(--text);border-color:var(--line)}
.nav-links.open{background:var(--surface-raised);border-color:var(--line);box-shadow:var(--shadow)}
.nav-links.open a{color:var(--text)}
.nav-links.open .nav-cta{color:var(--accent-ink)}
.card,.feature-item,.trust-item,.stat,.hero-panel{
  background:var(--surface);color:var(--text);border-color:var(--line);box-shadow:0 12px 34px color-mix(in srgb,var(--text) 5%,transparent)
}
input,select,textarea{background:var(--surface-raised);color:var(--text);border-color:var(--line)}
label{color:var(--text)}
.btn{background:var(--accent-strong);color:var(--accent-ink);box-shadow:none;border-radius:7px}
.btn:hover{color:var(--accent-ink);filter:brightness(1.06)}
.btn-secondary{background:var(--surface-raised);border-color:var(--line);color:var(--text)}
.btn-ghost{background:transparent;color:var(--text);border-color:var(--line)}
.tag{background:color-mix(in srgb,var(--accent) 13%,var(--surface));border-color:color-mix(in srgb,var(--accent) 28%,var(--line));color:var(--text)}
.eyebrow,.pv-label{color:var(--accent-strong)}
.pill-count{background:var(--accent-strong);color:var(--accent-ink)}
/* Homepage art direction */
.pv-home{--pv-ink:var(--text);--pv-muted:var(--muted);--pv-acid:var(--accent);position:relative;overflow:visible}
.pv-hero{
  position:relative;isolation:isolate;min-height:650px;overflow:hidden;
  padding:clamp(40px,7vw,92px) clamp(22px,6vw,82px) 66px;
  border:1px solid var(--line);border-radius:12px;
  background:linear-gradient(128deg,#252d27 0%,#303932 53%,#242a26 100%);
  color:#f3efe5;box-shadow:var(--shadow);
}
[data-theme="light"] .pv-hero{
  background:linear-gradient(128deg,#e7e1d3 0%,#f5f0e5 55%,#dce1d5 100%);
  color:#292a25;border-color:var(--line);
}
.pv-hero:before{
  content:"";position:absolute;inset:0;z-index:-1;opacity:.65;border-radius:inherit;
  background:
    radial-gradient(ellipse at 88% 8%,rgba(116,137,105,.22),transparent 32%),
    radial-gradient(ellipse at 5% 100%,rgba(183,99,68,.12),transparent 38%);
}
.pv-hero:after{
  content:"";position:absolute;z-index:-1;pointer-events:none;
  width:clamp(300px,42vw,610px);height:clamp(190px,23vw,330px);
  right:-12%;top:6%;border:clamp(12px,2vw,24px) solid rgba(194,139,105,.18);
  border-radius:47% 53% 38% 62% / 58% 42% 58% 42%;transform:rotate(-28deg);
  box-shadow:0 0 0 22px rgba(180,194,163,.06),0 0 0 54px rgba(194,139,105,.035);
}
[data-theme="light"] .pv-hero:after{border-color:rgba(180,94,65,.17);box-shadow:0 0 0 22px rgba(104,126,94,.055),0 0 0 54px rgba(180,94,65,.035)}
.pv-hero-main{position:relative;z-index:1;max-width:780px}
 .pv-overline,.pv-label{color:#c4cfb5;font-size:9px;letter-spacing:.19em;font-weight:900}
[data-theme="light"] .pv-overline,[data-theme="light"] .pv-label{color:#52664d}
.pv-overline i,.pv-index-heading i{background:#7b936e;box-shadow:0 0 12px rgba(123,147,110,.5)}
.pv-announcement{border-color:#687a62;color:#e4e8d9;background:rgba(255,255,255,.04)}
[data-theme="light"] .pv-announcement{border-color:#a8a08d;color:#4e5c48;background:rgba(255,253,247,.48)}
.pv-hero h1{max-width:790px;color:#f5f1e7;font-size:clamp(56px,8.2vw,112px);letter-spacing:-.085em;line-height:.89;font-weight:720}
[data-theme="light"] .pv-hero h1{color:#262a24}
.pv-hero-lede{color:#c4cabe;max-width:560px;font-size:clamp(15px,1.5vw,18px);line-height:1.8}
[data-theme="light"] .pv-hero-lede{color:#5d6258}
.pv-button{border-radius:5px;padding:15px 19px;letter-spacing:.025em}
.pv-button-dark{background:#e6e3d7;color:#252b25}
.pv-button-dark:hover{background:#fff;color:#252b25}
[data-theme="light"] .pv-button-dark{background:#344d38;color:#fffaf0}
[data-theme="light"] .pv-button-dark:hover{background:#243b2a;color:#fff}
.pv-text-link{color:#e0e4d5;border-bottom:1px solid rgba(224,228,213,.35)}
[data-theme="light"] .pv-text-link{color:#455c42;border-color:rgba(69,92,66,.35)}
.pv-hero-foot{border-top-color:rgba(235,235,224,.2);color:#c0c8bd}
[data-theme="light"] .pv-hero-foot{border-color:rgba(70,80,65,.24);color:#6b7166}
.pv-index{
  position:relative;z-index:1;padding:22px;border-radius:7px;
  background:rgba(22,29,24,.56);border:1px solid rgba(235,235,224,.2);
  color:#f3efe5;backdrop-filter:blur(12px);box-shadow:0 16px 38px rgba(0,0,0,.18)
}
[data-theme="light"] .pv-index{background:rgba(255,253,247,.72);border-color:rgba(70,80,65,.22);color:#293029}
.pv-index-heading,.pv-index-heading span{color:inherit}
.pv-index-total strong{color:inherit}
.pv-index-total span,.pv-index-metrics small,.pv-index>p{color:#b9c0b2}
[data-theme="light"] .pv-index-total span,[data-theme="light"] .pv-index-metrics small,[data-theme="light"] .pv-index>p{color:#687267}
.pv-index-metrics{border-color:rgba(95,105,88,.22)}
.pv-index-metrics b{color:inherit}
.pv-hero-bottom{color:#b6c0b1}
[data-theme="light"] .pv-hero-bottom{color:#6b7166}
.pv-category-section,.pv-talent-section,.pv-work-section,.pv-faq{padding:clamp(58px,8vw,105px) 0}
.pv-section-top{margin-bottom:34px}
.pv-section-top h2,.pv-faq h2{font-size:clamp(40px,5.7vw,72px);letter-spacing:-.08em}
.pv-section-top>p{color:var(--muted)}
.pv-category-grid{gap:12px;border:0}
.pv-category-grid .home-category{
  min-height:190px;padding:22px!important;border:1px solid var(--line)!important;
  border-radius:7px;background:var(--surface);transition:transform .22s ease,background .22s ease;
}
.pv-category-grid .home-category:hover{transform:translateY(-4px);background:var(--surface-raised)}
.home-category span{color:var(--accent-strong)}
.home-category strong{font-size:clamp(17px,2vw,22px);letter-spacing:-.045em}
.home-category small{color:var(--muted);line-height:1.65}
.home-category>b{color:var(--gold)}
.pv-talent-grid{gap:18px}
.pv-talent-grid .designer-card{border-radius:7px;background:var(--surface);border-color:var(--line)}
.pv-work-section{
  padding-top:clamp(38px,5vw,62px);padding-bottom:clamp(38px,5vw,62px);
  border:1px solid var(--line);border-radius:9px;background:var(--surface);
}
.home-project-image{border-radius:5px}
.home-project-caption{color:var(--text)}
.home-project-caption small{color:var(--muted)}
.pv-work-foot{border-color:var(--line)}
.pv-manifesto{
  position:relative;isolation:isolate;overflow:hidden;margin:clamp(22px,4vw,50px) 0;
  padding:clamp(44px,7vw,88px) clamp(22px,4vw,52px);
  grid-template-columns:.7fr 1.3fr;gap:clamp(24px,6vw,84px);
  border:1px solid var(--line);border-radius:9px;background:var(--surface)
}
.pv-manifesto:after{content:"";position:absolute;z-index:-1;right:-130px;top:-170px;width:390px;height:330px;
 border:24px solid color-mix(in srgb,var(--gold) 19%,transparent);border-radius:43% 57% 65% 35% / 48% 42% 58% 52%;transform:rotate(27deg)}
.pv-manifesto h2{font-size:clamp(42px,6.2vw,78px)}
.pv-manifesto-copy>p{color:var(--muted)}
.pv-manifesto-points{border-color:var(--line)}
.pv-manifesto-points div{border-color:var(--line);color:var(--text)}
.pv-join{
  position:relative;isolation:isolate;overflow:hidden;align-items:center;
  border:1px solid #53634d;border-radius:9px;padding:clamp(32px,5vw,68px);
  background:linear-gradient(118deg,#334a37,#26362c 58%,#303a31);color:#f5f0e5
}
.pv-join:after{content:"";position:absolute;z-index:-1;right:-100px;bottom:-210px;width:430px;height:300px;
 border:24px solid rgba(208,143,107,.25);border-radius:51% 49% 34% 66% / 59% 42% 58% 41%;transform:rotate(-18deg)}
.pv-join h2{color:#f5f0e5}
.pv-join p{color:#d4d8cc}
.pv-faq-list details{border-color:var(--line)}
.pv-faq-list summary{color:var(--text)}
.pv-faq-list p{color:var(--muted)}
.home-carousel{
  margin:24px 0 30px;padding:16px;border-radius:9px;border-color:var(--line);
  background:var(--surface);box-shadow:var(--shadow)
}
[data-theme="dark"] .home-carousel{background:linear-gradient(135deg,#2a302b,#242a26 68%,#30322d);border-color:var(--line)}
.pv-home .carousel-slide{border-radius:6px;background:var(--surface-raised)}
.carousel-copy h2{letter-spacing:-.065em}
.carousel-kind{background:color-mix(in srgb,var(--accent) 14%,transparent);border-color:color-mix(in srgb,var(--accent) 32%,transparent)}
.carousel-arrows button{border-radius:5px;background:var(--surface-raised);color:var(--text);border-color:var(--line)}
.carousel-dots button{background:var(--subtle)}
.carousel-dots button[aria-current="true"]{background:var(--accent-strong)}
/* Footer intentionally remains a deep, high-contrast brand anchor in both themes */
.foot{
  margin-top:clamp(55px,8vw,100px);padding:0 clamp(18px,4vw,50px) 24px;
  border:1px solid #4a5146;border-radius:10px;background:#252a25;color:#eeeadd;text-align:left
}
.footer-cta{border-bottom-color:rgba(240,240,225,.18)}
.footer-cta h2{color:#f5f1e6}
.footer-grid strong{color:#e5e2d2}
.footer-grid a{color:#d8ddcf}
.footer-bottom{color:#aeb7a9}
[data-theme="light"] .foot{background:#252a25;color:#eeeadd;border-color:#4a5146}
[data-theme="light"] .foot .footer-grid strong{color:#e5e2d2}
[data-theme="light"] .foot .footer-grid a{color:#d8ddcf}
[data-theme="light"] .foot .footer-brand-lockup{color:#fff}
[data-theme="dark"] .foot{background:#171b18;border-color:#41483f}
/* Growth intelligence dashboard */
.growth-intelligence{margin:32px 0 38px;padding:clamp(18px,3vw,32px);border:1px solid var(--line);border-radius:13px;background:linear-gradient(145deg,var(--surface-raised),var(--surface))}
.growth-heading{display:flex;justify-content:space-between;align-items:start;gap:20px;margin-bottom:24px}
.growth-heading .eyebrow{font-size:9px;letter-spacing:.18em;font-weight:900;color:var(--accent-strong)}
.growth-heading h2{font-size:clamp(30px,4.6vw,52px);line-height:.98;letter-spacing:-.075em;margin:10px 0}
.growth-heading h2 em{font-family:Georgia,serif;font-weight:400;color:var(--gold)}
.growth-heading p{max-width:650px;color:var(--muted);font-size:12px;line-height:1.8;margin:0}
.growth-period{flex:0 0 auto;padding:8px 11px;border:1px solid var(--line);border-radius:4px;font-size:8px;letter-spacing:.15em;font-weight:900;color:var(--accent-strong)}
.growth-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:14px}
.growth-kpis article{display:flex;flex-direction:column;gap:7px;padding:17px;border:1px solid var(--line);border-radius:7px;background:var(--surface)}
.growth-kpis small{font-size:8px;letter-spacing:.13em;font-weight:900;color:var(--subtle)}
.growth-kpis strong{font-size:clamp(24px,3vw,36px);line-height:1;letter-spacing:-.06em;color:var(--text);font-variant-numeric:tabular-nums}
.growth-kpis span{font-size:10px;color:var(--muted)}
.growth-dashboard-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.growth-panel{min-width:0;padding:19px;border:1px solid var(--line);border-radius:7px;background:var(--surface)}
.growth-panel-head{display:flex;justify-content:space-between;align-items:start;gap:12px;margin-bottom:15px}
.growth-panel-head>div>span{font-size:8px;letter-spacing:.15em;font-weight:900;color:var(--accent-strong)}
.growth-panel-head h3{font-size:20px;letter-spacing:-.05em;margin:6px 0 0}
.growth-panel-head>a,.growth-panel-head>small{font-size:9px;color:var(--muted);font-weight:800}
.growth-funnel-step{margin:15px 0}
.growth-funnel-step>div{display:flex;justify-content:space-between;gap:10px;margin-bottom:7px;font-size:11px}
.growth-funnel-step>div span{color:var(--muted)}
.growth-funnel-step>div b{font-variant-numeric:tabular-nums}
.growth-funnel-step>i{display:block;height:7px;border-radius:20px;background:var(--bg-soft);overflow:hidden}
.growth-funnel-step>i span{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,var(--accent-strong),var(--gold))}
.growth-rates{display:flex;gap:22px;padding-top:15px;border-top:1px solid var(--line)}
.growth-rates>div{display:flex;flex-direction:column;gap:3px}
.growth-rates b{font-size:21px;letter-spacing:-.05em}
.growth-rates span,.growth-footnote{font-size:9px;color:var(--muted)}
.growth-footnote{line-height:1.7;margin:14px 0 0}
.growth-ranking{display:grid;gap:0}
.growth-ranking-row{display:grid;grid-template-columns:minmax(0,1fr) 64px 64px 15px;gap:10px;align-items:center;padding:10px 0;border-bottom:1px solid var(--line);color:var(--text);text-decoration:none}
.growth-rank-name{display:flex;flex-direction:column;min-width:0}
.growth-rank-name b{font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.growth-rank-name small,.growth-ranking-row>span small{font-size:8px;color:var(--muted)}
.growth-ranking-row>span:not(.growth-rank-name){display:flex;flex-direction:column;align-items:flex-start}
.growth-ranking-row>span b{font-size:12px;font-variant-numeric:tabular-nums}
.growth-ranking-row>i{font-style:normal;color:var(--gold)}
.growth-bar-row{display:grid;grid-template-columns:minmax(0,1fr) 35px;gap:9px;align-items:center;margin:14px 0;font-size:10px}
.growth-bar-row>b{text-align:right;font-size:11px}
.growth-bar-row>i{grid-column:1/-1;display:block;height:6px;border-radius:20px;background:var(--bg-soft);overflow:hidden}
.growth-bar-row>i:after{content:"";display:block;width:var(--bar);height:100%;background:var(--gold);border-radius:inherit}
.growth-category-row{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--line);font-size:10px}
.growth-category-row>b{white-space:nowrap;font-size:11px}
.growth-category-row small{font-size:8px;color:var(--muted);font-weight:500}
.growth-status-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:7px}
.growth-status-grid>div{display:flex;flex-direction:column;gap:4px;padding:10px 8px;background:var(--surface-raised);border-radius:5px}
.growth-status-grid b{font-size:20px;line-height:1}
.growth-status-grid span{font-size:8px;color:var(--muted)}
.growth-source-list{margin-top:15px}
.growth-empty{font-size:10px;line-height:1.7;color:var(--muted);padding:10px 0}
@media(max-width:900px){
 .pv-hero{min-height:590px;grid-template-columns:minmax(0,1fr) minmax(230px,.75fr);gap:22px}
 .growth-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}
}
@media(max-width:760px){
 .wrap{padding:12px 14px 42px}
 .site-nav{gap:10px;padding:10px 12px}
 .nav-links{gap:5px}
 .nav-links.open{gap:5px}
 .nav-links.open a,.nav-links.open .theme-toggle{width:100%;text-align:left;justify-content:flex-start;margin:0}
 .theme-toggle{margin-left:0;min-height:42px}
 .pv-hero{display:flex;flex-direction:column;align-items:stretch;min-height:0;padding:38px 23px 34px;gap:30px}
 .pv-hero h1{font-size:clamp(52px,12.5vw,82px);margin:24px 0 18px}
 .pv-index{width:100%;max-width:420px;align-self:flex-end}
 .pv-hero-bottom{margin-top:5px}
 .pv-section-top{display:block}
 .pv-section-top>p{margin-top:15px}
 .pv-category-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
 .pv-category-grid .home-category{min-height:175px}
 .pv-talent-grid{grid-template-columns:1fr 1fr}
 .pv-manifesto{grid-template-columns:1fr;gap:22px}
 .pv-manifesto-aside{gap:16px}
 .pv-join{display:block}
 .pv-join .pv-button{margin-top:22px}
 .pv-faq{grid-template-columns:1fr;gap:24px}
 .growth-heading{display:block}
 .growth-period{display:inline-block;margin-top:15px}
 .growth-dashboard-grid{grid-template-columns:1fr}
 .growth-status-grid{grid-template-columns:repeat(5,minmax(0,1fr))}
 .foot{padding:0 18px 20px}
}
@media(max-width:480px){
 .pv-category-grid{grid-template-columns:1fr}
 .pv-category-grid .home-category{min-height:150px}
 .pv-talent-grid{grid-template-columns:1fr}
 .pv-work-section{padding-left:17px;padding-right:17px}
 .growth-kpis{grid-template-columns:1fr 1fr;gap:7px}
 .growth-kpis article{padding:12px}
 .growth-kpis small{font-size:7px}
 .growth-ranking-row{grid-template-columns:minmax(0,1fr) 52px 52px 12px;gap:7px}
 .growth-status-grid{grid-template-columns:repeat(3,minmax(0,1fr))}
 .footer-grid{grid-template-columns:1fr 1fr}
 .footer-cta{display:block}
 .footer-cta>div+div{margin-top:18px}
}
@media(prefers-reduced-motion:reduce){
 *,*:before,*:after{scroll-behavior:auto!important;animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}
}

/* v5.59.0 — Experience 2.0: designer storytelling, case-study depth and measurable work */
.designer-tagline{
  max-width:660px;margin:13px 0 0;color:var(--gold);font-size:clamp(14px,1.5vw,19px);
  font-weight:650;letter-spacing:-.025em;line-height:1.55
}
.practice-story{position:relative;isolation:isolate;overflow:hidden;padding:clamp(26px,4vw,52px);
  border:1px solid var(--line);border-radius:10px;background:linear-gradient(135deg,var(--surface-raised),var(--surface))}
.practice-story:after{content:"";position:absolute;z-index:-1;right:-120px;top:-180px;width:350px;height:300px;
  border:22px solid color-mix(in srgb,var(--gold) 15%,transparent);border-radius:44% 56% 37% 63% / 52% 44% 56% 48%;transform:rotate(22deg)}
.practice-story .showcase-section-heading{align-items:end}
.practice-story .showcase-section-heading h2{max-width:560px}
.practice-story .showcase-section-heading h2 em{font-family:Georgia,serif;font-weight:400;color:var(--gold)}
.practice-story-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
.practice-story-card{min-width:0;padding:22px;border:1px solid var(--line);border-radius:7px;background:color-mix(in srgb,var(--surface) 88%,transparent)}
.practice-story-card>span{font-size:8px;letter-spacing:.15em;font-weight:900;color:var(--accent-strong)}
.practice-story-card h3{margin:18px 0 9px;font-size:clamp(18px,2vw,24px);letter-spacing:-.045em}
.practice-story-card p{margin:0;color:var(--muted);font-size:12px;line-height:1.85;white-space:pre-line}
.designer-showcase.layout-minimal .designer-cover{border-radius:4px;box-shadow:none}
.designer-showcase.layout-minimal .showcase-section{padding-top:clamp(38px,5vw,62px);padding-bottom:clamp(38px,5vw,62px)}
.designer-showcase.layout-minimal .showcase-work{border-radius:3px}
.designer-showcase.layout-minimal .showcase-work-image{border-radius:2px}
.designer-showcase.layout-gallery .showcase-work-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
.designer-showcase.layout-gallery .showcase-work-image{aspect-ratio:4/5}
.designer-showcase.layout-gallery .showcase-work-meta{padding:13px 2px}
.designer-showcase.layout-gallery .showcase-work-meta h3{font-size:17px}
.case-meta-strip{grid-template-columns:repeat(auto-fit,minmax(145px,1fr))}
.case-meta-strip>div{min-width:0}
.case-meta-strip strong{overflow-wrap:anywhere}
.case-result-highlight{display:grid;grid-template-columns:minmax(130px,.35fr) minmax(0,1fr);gap:22px;align-items:center;
  margin:clamp(26px,4vw,46px) 0;padding:clamp(20px,3vw,34px);border:1px solid color-mix(in srgb,var(--gold) 42%,var(--line));
  border-radius:8px;background:color-mix(in srgb,var(--gold) 9%,var(--surface))}
.case-result-highlight .eyebrow{font-size:9px;letter-spacing:.16em;font-weight:900;color:var(--gold)}
.case-result-highlight p{margin:0;font-family:Georgia,serif;font-size:clamp(18px,2.5vw,27px);line-height:1.45;color:var(--text)}
.case-gallery-item{display:block;cursor:zoom-in;outline-offset:4px}
.case-gallery-item:focus-visible{outline:2px solid var(--accent-strong)}
.studio-story-editor{margin:16px 0;padding:17px;border:1px solid var(--line);border-radius:8px;background:var(--surface)}
.studio-story-editor>summary{cursor:pointer;font-weight:800;color:var(--accent-strong)}
.studio-story-editor>p{font-size:11px;line-height:1.7}
.studio-story-editor label{display:block;margin:13px 0 5px;font-size:11px;font-weight:750}
.studio-story-editor input,.studio-story-editor textarea,.studio-story-editor select{display:block;width:100%;padding:10px;margin-top:5px;border:1px solid var(--line);border-radius:5px;background:var(--surface-raised);color:var(--text)}
.studio-story-seo{margin-top:20px;padding-top:16px;border-top:1px solid var(--line)}
.studio-story-seo>.eyebrow{font-size:9px;letter-spacing:.15em;font-weight:900}
.studio-performance-grid{display:grid;grid-template-columns:1.1fr .9fr;gap:12px;margin-top:16px}
.studio-performance-card{min-width:0;padding:18px;border:1px solid var(--line);border-radius:8px;background:var(--surface)}
.studio-performance-head{display:flex;justify-content:space-between;align-items:start;gap:12px;margin-bottom:18px}
.studio-performance-head .eyebrow{font-size:8px;letter-spacing:.14em;font-weight:900;color:var(--accent-strong)}
.studio-performance-head h3{margin:5px 0 0;font-size:20px;letter-spacing:-.045em}
.studio-performance-head>small{font-size:8px;color:var(--muted);font-weight:850;white-space:nowrap}
.studio-trend-chart{display:flex;align-items:stretch;gap:5px;min-height:150px;padding:12px 4px 0;border-bottom:1px solid var(--line)}
.studio-trend-day{display:flex;flex:1;min-width:0;flex-direction:column;justify-content:end;align-items:center;gap:8px}
.studio-trend-day i{display:block;width:min(100%,18px);height:var(--trend-height);min-height:3px;border-radius:4px 4px 1px 1px;background:linear-gradient(180deg,var(--gold),var(--accent-strong))}
.studio-trend-day small{font-size:7px;color:var(--muted);white-space:nowrap;transform:rotate(-35deg);transform-origin:top center}
.studio-performance-card>.muted{font-size:9px;line-height:1.7;margin:18px 0 0}
.studio-top-project-list{display:grid;gap:0}
.studio-top-project{display:grid;grid-template-columns:28px minmax(0,1fr) auto;gap:10px;align-items:center;padding:12px 0;border-bottom:1px solid var(--line);color:var(--text);text-decoration:none}
.studio-top-project-rank{font-size:10px;color:var(--gold);font-weight:900}
.studio-top-project>span:nth-child(2){display:flex;min-width:0;flex-direction:column;gap:3px}
.studio-top-project b{font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.studio-top-project small{font-size:8px;color:var(--muted)}
.studio-top-project>strong{font-size:12px;white-space:nowrap}
.studio-top-project>strong small{font-weight:500}
@media(max-width:760px){
 .practice-story-grid{grid-template-columns:1fr}
 .practice-story .showcase-section-heading{display:block}
 .practice-story .showcase-section-heading>p{margin-top:12px}
 .case-result-highlight{grid-template-columns:1fr;gap:10px}
 .studio-performance-grid{grid-template-columns:1fr}
 .designer-showcase.layout-gallery .showcase-work-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
}
@media(max-width:480px){
 .designer-showcase.layout-gallery .showcase-work-grid{grid-template-columns:1fr}
 .practice-story{padding:20px}
 .studio-performance-card{padding:13px}
 .studio-trend-chart{gap:3px}
}

/* v5.60.0 — motion system: calm, intentional, accessible */
html{scroll-padding-top:112px}
.pv-scroll-progress{position:fixed;z-index:120;left:0;top:0;height:2px;width:100%;background:linear-gradient(90deg,var(--accent),var(--gold));box-shadow:0 0 14px color-mix(in srgb,var(--accent) 45%,transparent);pointer-events:none;transform:scaleX(0);transform-origin:left;will-change:transform}
html.pv-motion-ready [data-pv-reveal]{opacity:0;transform:translate3d(0,20px,0) scale(.995);transition:opacity .7s cubic-bezier(.2,.75,.25,1),transform .7s cubic-bezier(.2,.75,.25,1);transition-delay:var(--pv-reveal-delay,0ms)}
html.pv-motion-ready [data-pv-reveal].is-visible{opacity:1;transform:translate3d(0,0,0) scale(1);will-change:auto}

@keyframes pv-soft-float{0%,100%{transform:translate3d(0,0,0) rotate(-2deg)}50%{transform:translate3d(0,-9px,0) rotate(1deg)}}
@keyframes pv-pulse-ring{0%{box-shadow:0 0 0 0 color-mix(in srgb,var(--accent) 28%,transparent)}100%{box-shadow:0 0 0 12px transparent}}
.pv-motion-ready .hero:before,.pv-motion-ready .pv-client-confirmation:before{animation:pv-soft-float 12s ease-in-out infinite}
.btn,.nav-cta,.theme-toggle,.nav-toggle,.favorite-btn,[data-shortlist]{transition:transform .2s ease,box-shadow .2s ease,background .2s ease,border-color .2s ease,color .2s ease}
.btn:active,.nav-cta:active,.theme-toggle:active,.favorite-btn:active,[data-shortlist]:active{transform:translateY(1px) scale(.985)}
.btn:focus-visible,.nav-links a:focus-visible,.theme-toggle:focus-visible,.nav-toggle:focus-visible{outline:2px solid var(--gold);outline-offset:3px}
@media(hover:hover) and (pointer:fine){
 .card,.designer-card,.work,.feature-item,.trust-item,.pv-client-card,.pv-project-list-card,.growth-panel,.studio-performance-card{transition:transform .28s cubic-bezier(.2,.75,.25,1),border-color .28s ease,box-shadow .28s ease}
 .designer-card:hover,.work:hover,.pv-project-list-card:hover{transform:translateY(-4px);border-color:color-mix(in srgb,var(--accent) 55%,var(--line));box-shadow:0 18px 42px rgba(0,0,0,.12)}
 .pv-client-card:hover,.studio-performance-card:hover{border-color:color-mix(in srgb,var(--accent) 45%,var(--line))}
 .nav-links a:hover{transform:translateY(-1px)}
}
.pv-client-shell,.pv-designer-project{max-width:1120px;margin:clamp(22px,4vw,52px) auto 70px}
.pv-client-heading{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;margin-bottom:26px}
.pv-client-heading h1{font-size:clamp(34px,6vw,64px);line-height:1.03;letter-spacing:-.065em;margin:9px 0 12px;max-width:820px}
.pv-client-kicker{font-size:9px;letter-spacing:.2em;font-weight:900;color:var(--gold);margin:0}
.pv-project-status{display:inline-flex;align-items:center;gap:7px;padding:8px 12px;border:1px solid var(--line);border-radius:999px;background:var(--surface-raised);font-size:10px;font-weight:850;white-space:nowrap;color:var(--text)}
.pv-project-status:before{content:"";width:7px;height:7px;border-radius:50%;background:var(--accent)}
.pv-project-status.status-completed:before{background:#3c9b6d}
.pv-project-status.status-cancelled:before{background:#b75a50}
.pv-client-overview{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(280px,.75fr);gap:14px;margin:16px 0}
.pv-client-card{min-width:0;padding:clamp(20px,3vw,32px);border:1px solid var(--line);border-radius:12px;background:var(--surface);box-shadow:var(--shadow)}
.pv-client-card h2{font-size:clamp(22px,3vw,30px);letter-spacing:-.05em;margin:8px 0 18px}
.pv-client-card p{color:var(--muted);line-height:1.8;white-space:pre-wrap}
.pv-client-card .eyebrow{font-size:9px;letter-spacing:.16em;font-weight:900;color:var(--gold)}
.pv-project-stages{display:grid;gap:0;margin-top:24px}
.pv-project-stage{position:relative;display:grid;grid-template-columns:38px minmax(0,1fr);gap:12px;min-height:70px}
.pv-project-stage:not(:last-child):after{content:"";position:absolute;left:17px;top:34px;bottom:-1px;width:1px;background:var(--line)}
.pv-stage-dot{position:relative;z-index:1;display:grid;place-items:center;width:35px;height:35px;border:1px solid var(--line);border-radius:50%;background:var(--panel);font-size:10px;font-weight:900;color:var(--muted)}
.pv-project-stage.is-done .pv-stage-dot{background:var(--accent);border-color:var(--accent);color:#fff}
.pv-project-stage.is-current .pv-stage-dot{border-color:var(--gold);color:var(--gold);animation:pv-pulse-ring 1.8s ease-out infinite}
.pv-project-stage strong{display:block;padding-top:2px;font-size:13px}
.pv-project-stage small{display:block;color:var(--muted);font-size:10px;line-height:1.55;margin-top:3px}
.pv-brief-meta{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:20px 0}
.pv-brief-meta span{font-size:8px;letter-spacing:.12em;color:var(--muted);font-weight:850}
.pv-brief-meta strong{display:block;color:var(--text);font-size:11px;letter-spacing:0;margin-top:4px}
.pv-client-activity{margin-top:16px}
.pv-section-heading{display:flex;justify-content:space-between;align-items:center;gap:16px}
.pv-section-heading h2{margin-bottom:0}
.pv-live-indicator{font-size:8px;letter-spacing:.12em;color:var(--accent-strong);font-weight:900;white-space:nowrap}
.pv-activity-list{display:grid;gap:0;margin:22px 0}
.pv-activity-item{display:grid;grid-template-columns:34px minmax(0,1fr);gap:12px;padding:15px 0;border-bottom:1px solid var(--line)}
.pv-activity-marker{display:grid;place-items:center;width:30px;height:30px;border-radius:50%;background:var(--panel2);color:var(--text);font-size:10px;font-weight:900}
.pv-activity-item.role-designer .pv-activity-marker{background:color-mix(in srgb,var(--accent) 16%,var(--surface));color:var(--accent-strong)}
.pv-activity-item.role-client .pv-activity-marker{background:color-mix(in srgb,var(--gold) 18%,var(--surface));color:var(--gold)}
.pv-activity-head{display:flex;align-items:center;justify-content:space-between;gap:12px}
.pv-activity-head strong{font-size:11px}
.pv-activity-head small{font-size:9px;color:var(--muted)}
.pv-activity-copy p{margin:7px 0 0;font-size:12px;line-height:1.75;overflow-wrap:anywhere}
.pv-activity-status{display:inline-block;margin-top:8px;padding:4px 8px;border-radius:99px;background:var(--panel2);font-size:9px;color:var(--accent-strong)}
.pv-client-message-form{margin-top:24px;padding-top:20px;border-top:1px solid var(--line)}
.pv-client-message-form label{display:block;font-size:11px;font-weight:800;margin-bottom:7px}
.pv-client-message-form textarea,.pv-client-message-form select{display:block;width:100%;padding:13px 14px;border:1px solid var(--line);border-radius:8px;background:var(--panel);color:var(--text);font:inherit;resize:vertical}
.pv-client-message-form textarea:focus,.pv-client-message-form select:focus{outline:2px solid color-mix(in srgb,var(--accent) 45%,transparent);outline-offset:2px}
.pv-client-message-form select{margin:7px 0 16px}
.pv-form-footer{display:flex;justify-content:space-between;align-items:center;gap:14px;margin-top:12px}
.pv-form-footer small{font-size:9px;color:var(--muted)}
.pv-client-foot{display:flex;justify-content:space-between;gap:16px;margin-top:22px;font-size:10px;color:var(--muted)}
.pv-client-foot a{color:var(--accent-strong);font-weight:750}
.pv-client-confirmation{position:relative;isolation:isolate;overflow:hidden;max-width:780px;margin:clamp(42px,8vw,100px) auto;padding:clamp(28px,6vw,64px);border:1px solid var(--line);border-radius:16px;background:linear-gradient(135deg,var(--surface),var(--panel2));box-shadow:var(--shadow)}
.pv-client-confirmation:before{content:"";position:absolute;z-index:-1;right:-80px;top:-110px;width:260px;height:260px;border:1px solid color-mix(in srgb,var(--gold) 50%,transparent);border-radius:42% 58% 60% 40%;box-shadow:0 0 0 22px color-mix(in srgb,var(--gold) 5%,transparent),0 0 0 50px color-mix(in srgb,var(--accent) 5%,transparent)}
.pv-client-confirmation h1{font-size:clamp(36px,6vw,64px);letter-spacing:-.065em;line-height:1.04;margin:12px 0}
.pv-invite-success,.pv-invite-pending{margin:22px 0;padding:18px 20px;border:1px solid var(--line);border-radius:10px;background:var(--surface)}
.pv-invite-success{border-color:color-mix(in srgb,#399a70 45%,var(--line))}
.pv-invite-success strong{color:#3c9b6d}
.pv-invite-pending strong{color:var(--gold)}
.pv-project-notice{padding:12px 15px;border:1px solid var(--line);border-radius:8px;background:var(--panel2);color:var(--text)}
.pv-projects-panel{margin:20px 0}
.pv-project-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:18px 0 12px}
.pv-project-summary article{display:grid;gap:5px;min-width:0;padding:12px 14px;border:1px solid var(--line);border-radius:9px;background:var(--panel)}
.pv-project-summary span{font-size:8px;letter-spacing:.12em;font-weight:850;color:var(--muted)}
.pv-project-summary strong{font-size:22px;line-height:1.1;letter-spacing:-.04em;color:var(--text);font-variant-numeric:tabular-nums}
.pv-project-toolbar{display:grid;grid-template-columns:minmax(180px,1.4fr) minmax(150px,.7fr) auto;align-items:end;gap:10px;margin:14px 0}
.pv-project-toolbar label{display:grid;gap:6px;min-width:0;font-size:10px;font-weight:800;color:var(--text)}
.pv-project-toolbar input,.pv-project-toolbar select{width:100%;min-width:0;min-height:42px;padding:10px 12px;border:1px solid var(--line);border-radius:8px;background:var(--surface);color:var(--text);font:inherit}
.pv-project-toolbar input:focus-visible,.pv-project-toolbar select:focus-visible{outline:2px solid var(--accent-strong);outline-offset:2px}
.pv-project-toolbar>p{margin:0 0 10px;font-size:9px;line-height:1.5;color:var(--muted);text-align:right}
.pv-project-filter-empty[hidden]{display:none!important}
.pv-project-closed-state,.pv-project-readonly-note{margin:16px 0;padding:16px 18px;border:1px solid var(--line);border-radius:10px;background:var(--panel2);color:var(--text)}
.pv-project-closed-state strong{display:block;font-size:13px}
.pv-project-closed-state p,.pv-project-readonly-note p{margin:5px 0 0;font-size:11px;line-height:1.65;color:var(--muted)}
.pv-project-readonly-note .eyebrow{font-size:8px;letter-spacing:.14em;font-weight:900;color:var(--accent-strong)}
.pv-project-list{display:grid;gap:8px;margin-top:16px}
.pv-project-list-card{display:grid;grid-template-columns:38px minmax(0,1fr) auto;align-items:center;gap:12px;padding:13px;border:1px solid var(--line);border-radius:9px;background:var(--surface);color:var(--text)}
.pv-project-list-icon{display:grid;place-items:center;width:36px;height:36px;border-radius:8px;background:var(--panel2);color:var(--accent-strong);font-weight:900}
.pv-project-list-copy{display:grid;gap:3px;min-width:0}
.pv-project-list-copy strong{font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pv-project-list-copy small{font-size:9px;color:var(--muted)}
.pv-project-empty{padding:22px;border:1px dashed var(--line);border-radius:9px}
.pv-project-empty p{font-size:11px;color:var(--muted)}
.pv-designer-project .pv-client-overview{grid-template-columns:1fr 1fr}
@media(max-width:760px){
 .pv-client-heading{display:block}
 .pv-client-heading>.pv-project-status{margin-top:14px}
 .pv-client-overview,.pv-designer-project .pv-client-overview{grid-template-columns:1fr}
 .pv-client-card{padding:20px}
 .pv-section-heading{align-items:flex-start;flex-direction:column}
 .pv-project-list-card{grid-template-columns:34px minmax(0,1fr)}
 .pv-project-list-card>.pv-project-status{grid-column:2;justify-self:start}
 .pv-project-toolbar{grid-template-columns:1fr}
 .pv-project-toolbar>p{text-align:left;margin:0}
 .pv-form-footer{align-items:flex-start;flex-direction:column}
 .pv-form-footer .btn{width:100%}
 .pv-client-foot{flex-direction:column}
}
@media(max-width:520px){.pv-project-summary{grid-template-columns:repeat(2,minmax(0,1fr))}.pv-project-summary article{padding:11px}}
@media(max-width:420px){.pv-brief-meta{grid-template-columns:1fr}.pv-client-heading h1{font-size:34px}}
@media(prefers-reduced-motion:reduce){
 html{scroll-behavior:auto}
 html.pv-motion-ready [data-pv-reveal],.pv-motion-ready .site-nav{opacity:1!important;transform:none!important;transition:none!important;animation:none!important}
 .pv-project-stage.is-current .pv-stage-dot{animation:none}
 .pv-client-confirmation:before{animation:none}
}

.pv-toast-region{position:fixed;z-index:130;right:22px;bottom:22px;max-width:min(360px,calc(100vw - 32px));padding:12px 16px;border:1px solid var(--line);border-radius:10px;background:var(--surface-raised);color:var(--text);font-size:11px;font-weight:750;box-shadow:var(--shadow);opacity:0;transform:translateY(10px);pointer-events:none;transition:opacity .22s ease,transform .22s ease}
.pv-toast-region.is-visible{opacity:1;transform:translateY(0)}
.pv-client-confirmation{background-image:radial-gradient(circle at var(--pv-pointer-x,90%) var(--pv-pointer-y,10%),color-mix(in srgb,var(--gold) 10%,transparent),transparent 35%),linear-gradient(135deg,var(--surface),var(--panel2))}
.pv-client-card{background-image:radial-gradient(circle at var(--pv-pointer-x,100%) var(--pv-pointer-y,0%),color-mix(in srgb,var(--accent) 5%,transparent),transparent 40%)}
@media(max-width:600px){.pv-toast-region{right:12px;bottom:12px;left:12px;max-width:none;text-align:center}}
@media(prefers-reduced-motion:reduce){.pv-toast-region{transition:none}}

/* v5.61.0 — editorial motion language inspired by Bettr Academy */
.pv-home-motion .pv-hero-word{display:inline-block;opacity:0;transform:translate3d(0,14px,0) rotate(2deg);animation:pv-hero-word-in .9s cubic-bezier(.18,.78,.22,1) both;animation-delay:calc(var(--pv-word-index,0)*65ms + 120ms)}
@keyframes pv-hero-word-in{0%{opacity:0;transform:translate3d(0,14px,0) rotate(2deg)}65%{opacity:1}100%{opacity:1;transform:translate3d(0,0,0) rotate(0)}}
.pv-home-motion .pv-overline{animation:pv-editorial-enter .75s .05s cubic-bezier(.2,.75,.25,1) both}
.pv-home-motion .pv-hero-lede{animation:pv-editorial-enter .8s .52s cubic-bezier(.2,.75,.25,1) both}
.pv-home-motion .pv-hero-actions{animation:pv-editorial-enter .8s .65s cubic-bezier(.2,.75,.25,1) both}
.pv-home-motion .pv-hero-foot{animation:pv-editorial-enter .8s .8s cubic-bezier(.2,.75,.25,1) both}
.pv-home-motion .pv-index{animation:pv-index-enter 1.05s .3s cubic-bezier(.16,.8,.2,1) both}
@keyframes pv-editorial-enter{from{opacity:0;transform:translate3d(0,22px,0)}to{opacity:1;transform:translate3d(0,0,0)}}
@keyframes pv-index-enter{from{opacity:0;transform:translate3d(20px,14px,0) scale(.985)}to{opacity:1;transform:translate3d(0,0,0) scale(1)}}
.pv-home .pv-hero:before{transform:translate3d(0,var(--pv-hero-parallax,0px),0) scale(1.05);transition:none}
.pv-home .pv-hero{background-image:linear-gradient(115deg,#202723 0%,#29332d 52%,#202725 100%),radial-gradient(ellipse at var(--pv-pointer-x,82%) var(--pv-pointer-y,20%),rgba(192,211,165,.13),transparent 34%)}
.pv-home .pv-index-total strong,.pv-home .pv-index-metrics b{font-variant-numeric:tabular-nums}
.pv-home .pv-motion-ribbon{position:relative;overflow:hidden;margin:34px 0 0;padding:18px 0;border-top:1px solid var(--line);border-bottom:1px solid var(--line);background:var(--bg-soft)}
.pv-home .pv-motion-ribbon-track{display:flex;align-items:center;gap:clamp(22px,4vw,58px);width:max-content;animation:pv-ribbon-travel 38s linear infinite;will-change:transform}
.pv-home .pv-motion-ribbon-track span{font-size:clamp(10px,1.15vw,13px);font-weight:900;letter-spacing:.2em;color:var(--text);white-space:nowrap}
.pv-home .pv-motion-ribbon-track i{font-size:19px;font-style:normal;color:var(--accent-strong)}
@keyframes pv-ribbon-travel{from{transform:translate3d(0,0,0)}to{transform:translate3d(-50%,0,0)}}
.pv-home-motion [data-pv-story]{opacity:0;transform:translate3d(0,42px,0);transition:opacity .85s cubic-bezier(.2,.75,.25,1),transform .9s cubic-bezier(.2,.75,.25,1);transition-delay:var(--pv-story-delay,0ms);will-change:opacity,transform}
.pv-home-motion [data-pv-story].is-visible{opacity:1;transform:translate3d(0,0,0);will-change:auto}
.pv-home-motion .pv-category-grid[data-pv-story]>.home-category,.pv-home-motion .pv-talent-grid[data-pv-story]>.designer-card,.pv-home-motion .pv-project-grid[data-pv-story]>.home-project{opacity:0;transform:translate3d(0,28px,0) scale(.99);transition:opacity .75s cubic-bezier(.2,.75,.25,1),transform .8s cubic-bezier(.2,.75,.25,1);transition-delay:calc(var(--pv-stagger-index,0)*95ms)}
.pv-home-motion .pv-category-grid[data-pv-story].is-visible>.home-category,.pv-home-motion .pv-talent-grid[data-pv-story].is-visible>.designer-card,.pv-home-motion .pv-project-grid[data-pv-story].is-visible>.home-project{opacity:1;transform:translate3d(0,0,0) scale(1)}
.pv-home-motion .pv-project-grid[data-pv-story] .home-project-image{clip-path:inset(0 0 100% 0);transition:clip-path 1.05s cubic-bezier(.7,0,.2,1)}
.pv-home-motion .pv-project-grid[data-pv-story].is-visible .home-project-image{clip-path:inset(0 0 0 0)}
.pv-home-motion .pv-project-grid[data-pv-story] .home-project-image img{transform:scale(1.12);transition:transform 1.25s cubic-bezier(.2,.75,.25,1)}
.pv-home-motion .pv-project-grid[data-pv-story].is-visible .home-project-image img{transform:scale(1)}
.pv-home-motion .pv-section-top h2{overflow:hidden}
.pv-home-motion .pv-section-top[data-pv-story] h2{transition:letter-spacing .9s cubic-bezier(.2,.75,.25,1)}
.pv-home-motion .pv-section-top[data-pv-story].is-visible h2{letter-spacing:-.065em}
.pv-home .pv-manifesto-aside{position:sticky;top:112px;align-self:start;min-height:180px}
.pv-home .home-category{transition:background-color .32s ease,color .32s ease,transform .38s var(--pv-ease)}
.pv-home .home-category:hover{background:color-mix(in srgb,var(--accent) 5%,transparent);transform:translate3d(0,-3px,0)}
.pv-home .carousel-slide.is-active .carousel-art img{animation:pv-carousel-image-drift 7s cubic-bezier(.2,.7,.2,1) both}
.pv-home .carousel-slide.is-active .carousel-kicker{animation:pv-editorial-enter .55s .06s both}
.pv-home .carousel-slide.is-active .carousel-kind{animation:pv-editorial-enter .6s .12s both}
.pv-home .carousel-slide.is-active .carousel-copy h2{animation:pv-editorial-enter .7s .18s both}
.pv-home .carousel-slide.is-active .carousel-copy p{animation:pv-editorial-enter .7s .25s both}
.pv-home .carousel-slide.is-active .carousel-cta{animation:pv-editorial-enter .7s .32s both}
@keyframes pv-carousel-image-drift{from{transform:scale(1.12) translate3d(1.5%,0,0)}to{transform:scale(1.02) translate3d(-1.5%,0,0)}}
.pv-home .pv-manifesto-copy .pv-manifesto-points div{transition:transform .32s var(--pv-ease),background-color .32s ease}
.pv-home .pv-manifesto-copy .pv-manifesto-points div:hover{transform:translate3d(6px,0,0);background:color-mix(in srgb,var(--accent) 5%,transparent)}
@media(max-width:900px){.pv-home .pv-manifesto-aside{position:static;min-height:0}}
@media(max-width:600px){.pv-home .pv-motion-ribbon{margin-top:22px;padding:14px 0}.pv-home .pv-motion-ribbon-track{animation-duration:42s}.pv-home .pv-manifesto-aside{position:static}}
@media(prefers-reduced-motion:reduce){
 .pv-home-motion .pv-hero-word,.pv-home-motion .pv-overline,.pv-home-motion .pv-hero-lede,.pv-home-motion .pv-hero-actions,.pv-home-motion .pv-hero-foot,.pv-home-motion .pv-index{opacity:1!important;transform:none!important;filter:none!important;animation:none!important}
 .pv-home .pv-motion-ribbon-track{animation:none!important;transform:none!important}
 .pv-home-motion [data-pv-story],.pv-home-motion .pv-category-grid[data-pv-story]>.home-category,.pv-home-motion .pv-talent-grid[data-pv-story]>.designer-card,.pv-home-motion .pv-project-grid[data-pv-story]>.home-project{opacity:1!important;transform:none!important;transition:none!important}
 .pv-home-motion .pv-project-grid[data-pv-story] .home-project-image{clip-path:none!important;transition:none!important}
 .pv-home .carousel-slide.is-active .carousel-art img,.pv-home .carousel-slide.is-active .carousel-copy>*{animation:none!important}
}

/* v5.62.0 — unified experience system, editorial surfaces and purposeful interaction */
@view-transition{navigation:auto}
::view-transition-old(root){animation:pv-view-out .16s ease both}
::view-transition-new(root){animation:pv-view-in .3s cubic-bezier(.22,.75,.25,1) both}
@keyframes pv-view-out{to{opacity:0}}
@keyframes pv-view-in{from{opacity:0;transform:translate3d(0,8px,0)}to{opacity:1;transform:translate3d(0,0,0)}}
:root{--pv-ease:cubic-bezier(.2,.75,.25,1);--pv-fast:180ms;--pv-medium:360ms;--pv-slow:720ms;--pv-content:1260px}
html{scroll-padding-top:110px;scroll-behavior:smooth}
body{isolation:isolate;min-height:100vh}
body:before{content:"";position:fixed;inset:0;z-index:-1;pointer-events:none;opacity:.18;background-image:linear-gradient(to right,color-mix(in srgb,var(--line) 26%,transparent) 1px,transparent 1px),linear-gradient(to bottom,color-mix(in srgb,var(--line) 22%,transparent) 1px,transparent 1px);background-size:76px 76px;mask-image:radial-gradient(ellipse at 76% 7%,#000 0%,transparent 67%)}
body:after{content:"";position:fixed;z-index:-1;pointer-events:none;width:min(44vw,620px);height:min(44vw,620px);right:-18vw;top:18vh;border:1px solid color-mix(in srgb,var(--accent) 13%,transparent);border-radius:42% 58% 61% 39%;box-shadow:0 0 0 22px color-mix(in srgb,var(--accent) 2%,transparent),0 0 0 64px color-mix(in srgb,var(--gold) 3%,transparent);opacity:.5;transform:rotate(-18deg)}
[data-theme="light"] body:before{opacity:.28}
[data-theme="light"] body:after{opacity:.24}
.wrap{max-width:var(--pv-content);padding-left:clamp(16px,3vw,34px);padding-right:clamp(16px,3vw,34px)}
.site-nav{gap:14px;padding:12px 15px;border-radius:15px;background:color-mix(in srgb,var(--surface) 88%,transparent);border-color:color-mix(in srgb,var(--line) 82%,transparent);box-shadow:0 12px 38px rgba(0,0,0,.09);backdrop-filter:blur(20px) saturate(135%)}
.brand{gap:11px;min-width:max-content}
.brand-emblem{width:40px;height:40px;object-fit:contain;filter:drop-shadow(0 5px 10px rgba(0,0,0,.12))}
.nav-links{gap:4px}
.nav-links a{font-size:12px;letter-spacing:.005em;padding:9px 11px;border-radius:9px;transition:background var(--pv-fast) ease,color var(--pv-fast) ease,transform var(--pv-fast) ease}
.nav-links a[aria-current="page"]{background:color-mix(in srgb,var(--accent) 12%,var(--surface));color:var(--text);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--accent) 20%,transparent)}
.nav-links .nav-cta{margin-left:4px;padding-inline:14px}
.theme-toggle{min-height:38px;padding:8px 11px;border-radius:9px;font-size:11px;white-space:nowrap;transition:background var(--pv-fast) ease,border-color var(--pv-fast) ease,transform var(--pv-fast) ease}
.theme-toggle:hover{background:var(--surface-raised);border-color:var(--accent);transform:translateY(-1px)}
[data-theme="light"] .site-nav{background:rgba(255,254,250,.9);border-color:var(--line);box-shadow:0 12px 38px rgba(35,45,36,.08)}
[data-theme="light"] .nav-links a[aria-current="page"]{background:#e9ede5;color:#263b2a}
.card,.feature-item,.trust-item,.stat,.hero-panel,.designer-card,.work,.pv-client-card,.studio-panel,.growth-panel{border-color:color-mix(in srgb,var(--line) 86%,transparent);box-shadow:0 14px 38px rgba(0,0,0,.075);transition:transform .32s var(--pv-ease),border-color .32s ease,box-shadow .32s ease,background-color .32s ease}
[data-theme="light"] .card,[data-theme="light"] .feature-item,[data-theme="light"] .trust-item,[data-theme="light"] .stat,[data-theme="light"] .hero-panel,[data-theme="light"] .designer-card,[data-theme="light"] .work,[data-theme="light"] .pv-client-card,[data-theme="light"] .studio-panel,[data-theme="light"] .growth-panel{box-shadow:0 12px 34px rgba(38,48,36,.055)}
.btn,.favorite-btn,.shortlist-btn,.carousel-arrows button,.carousel-dots button,.theme-toggle,.nav-toggle{transition:transform var(--pv-fast) var(--pv-ease),box-shadow var(--pv-fast) ease,background var(--pv-fast) ease,border-color var(--pv-fast) ease,color var(--pv-fast) ease}
.btn:active,.favorite-btn:active,.shortlist-btn:active,.carousel-arrows button:active{transform:translateY(1px) scale(.985)}
.btn:focus-visible,.favorite-btn:focus-visible,.shortlist-btn:focus-visible,.theme-toggle:focus-visible,.nav-toggle:focus-visible,.nav-links a:focus-visible,.pv-command-items button:focus-visible,.pv-command-close:focus-visible,.pv-back-top:focus-visible{outline:2px solid var(--gold);outline-offset:3px}
input,select,textarea{transition:border-color var(--pv-fast) ease,box-shadow var(--pv-fast) ease,background var(--pv-fast) ease}
input:focus,select:focus,textarea:focus{box-shadow:0 0 0 4px color-mix(in srgb,var(--accent) 14%,transparent)}
img{max-width:100%}
img.pv-image-pending{opacity:0;transform:scale(1.012);background:var(--bg-soft)}
img.pv-image-ready{opacity:1;transform:none;transition:opacity .42s ease,transform .6s var(--pv-ease)}
.work img,.showcase-work img,.home-project-image img,.pv-project-list-card img{transition:transform .8s var(--pv-ease),filter .5s ease}
@media(hover:hover) and (pointer:fine){
 .designer-card:hover,.work:hover,.feature-item:hover,.trust-item:hover,.pv-client-card:hover,.studio-panel:hover,.growth-panel:hover{transform:translateY(-3px);border-color:color-mix(in srgb,var(--accent) 44%,var(--line));box-shadow:0 22px 54px rgba(0,0,0,.14)}
 .work:hover img,.showcase-work:hover img,.home-project:hover .home-project-image img{transform:scale(1.035)}
 .nav-links a:hover{transform:translateY(-1px)}
}
.pv-motion-ready [data-pv-reveal]{transition-duration:.62s;transition-timing-function:var(--pv-ease)}
.pv-scroll-progress{height:2px;box-shadow:0 0 12px color-mix(in srgb,var(--accent) 34%,transparent)}
.pv-command-dialog{width:min(620px,calc(100vw - 28px));max-width:none;max-height:min(78vh,760px);padding:0;border:1px solid var(--line);border-radius:18px;background:var(--surface);color:var(--text);box-shadow:0 32px 110px rgba(0,0,0,.38);overflow:hidden}
.pv-command-dialog::backdrop{background:rgba(8,12,10,.62);backdrop-filter:blur(8px)}
.pv-command-head{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;padding:22px 22px 15px}
.pv-command-head h2{font-size:25px;letter-spacing:-.055em;margin:5px 0 0}
.pv-command-close{width:34px;height:34px;border:1px solid var(--line);border-radius:9px;background:var(--surface-raised);color:var(--text);font-size:22px;cursor:pointer}
.pv-command-search{display:flex;align-items:center;gap:11px;margin:0 18px 17px;padding:0 13px;border:1px solid var(--line);border-radius:11px;background:var(--bg-soft);color:var(--muted)}
.pv-command-search>span{font-size:23px}
.pv-command-search input{flex:1;min-width:0;border:0!important;outline:0!important;box-shadow:none!important;background:transparent!important;color:var(--text)!important;padding:14px 0;font-size:13px}
.pv-command-search kbd,.pv-command-foot kbd,.pv-command-items kbd{font:10px/1.2 ui-monospace,monospace;color:var(--muted);padding:4px 6px;border:1px solid var(--line);border-radius:5px;background:var(--surface-raised)}
.pv-command-label{margin:0 22px 8px;font-size:9px;font-weight:900;letter-spacing:.16em;color:var(--subtle)}
.pv-command-results{margin:-7px 22px 10px;min-height:1.4em;font-size:11px;line-height:1.45;color:var(--muted)}
.pv-command-items button:focus-visible{outline:2px solid var(--accent-strong);outline-offset:-2px;background:var(--surface-raised)}
.pv-command-items{display:grid;gap:3px;padding:0 10px 12px;max-height:48vh;overflow:auto}
.pv-command-items button{display:grid;grid-template-columns:34px minmax(0,1fr) auto;align-items:center;gap:10px;width:100%;padding:10px 12px;border:0;border-radius:9px;background:transparent;color:var(--text);text-align:left;cursor:pointer}
.pv-command-items button:hover{background:var(--bg-soft)}
.pv-command-items button>span:first-child{display:grid;place-items:center;width:32px;height:32px;border:1px solid var(--line);border-radius:8px;color:var(--accent-strong);background:var(--surface-raised);font-size:15px}
.pv-command-items strong,.pv-command-items small{display:block}
.pv-command-items strong{font-size:12px}
.pv-command-items small{margin-top:2px;color:var(--muted);font-size:10px}
.pv-command-items button[hidden]{display:none}
.pv-command-foot{display:flex;justify-content:space-between;gap:12px;padding:12px 20px;border-top:1px solid var(--line);background:var(--bg-soft);font-size:10px;color:var(--muted)}
.pv-back-top{position:fixed;z-index:90;right:22px;bottom:22px;display:grid;place-items:center;gap:0;width:48px;height:48px;border:1px solid var(--line);border-radius:12px;background:color-mix(in srgb,var(--surface-raised) 90%,transparent);color:var(--text);box-shadow:0 12px 32px rgba(0,0,0,.17);cursor:pointer;opacity:0;visibility:hidden;transform:translateY(9px);transition:opacity .22s ease,visibility .22s ease,transform .22s ease,background .22s ease}
.pv-back-top.is-visible{opacity:1;visibility:visible;transform:translateY(0)}
.pv-back-top span{font-size:21px;line-height:1}
.pv-back-top small{font-size:7px;letter-spacing:.14em;font-weight:900}
.pv-toast-region{z-index:140}
.pv-spotlight-card{background-image:radial-gradient(circle at var(--pv-card-x,50%) var(--pv-card-y,50%),color-mix(in srgb,var(--accent) 11%,transparent),transparent 48%),linear-gradient(145deg,var(--surface-raised),var(--surface))}
[data-theme="light"] .pv-spotlight-card{background-image:radial-gradient(circle at var(--pv-card-x,50%) var(--pv-card-y,50%),rgba(83,107,76,.07),transparent 48%),linear-gradient(145deg,var(--surface-raised),var(--surface))}
@media(max-width:900px){.site-nav{gap:10px}.nav-links{gap:3px}.theme-toggle{padding-inline:9px}.pv-back-top{right:14px;bottom:14px}}
@media(max-width:850px){.site-nav{align-items:center}.nav-links.open{padding:12px;background:var(--surface);border:1px solid var(--line);box-shadow:var(--shadow)}.nav-links a[aria-current="page"]{background:var(--bg-soft)}.nav-links .nav-cta{margin-left:0}.theme-toggle{width:100%;text-align:left}.pv-command-dialog{border-radius:14px}.pv-command-foot{font-size:9px}}
@media(max-width:520px){.pv-command-head{padding:18px 16px 12px}.pv-command-search{margin-inline:12px}.pv-command-label{margin-inline:16px}.pv-command-items{padding-inline:7px}.pv-command-foot{padding-inline:14px}.pv-back-top{width:43px;height:43px;right:12px;bottom:12px}}
@media(prefers-reduced-motion:reduce){
 html{scroll-behavior:auto}
 ::view-transition-old(root),::view-transition-new(root){animation:none!important}
 body:after{display:none}
 .pv-back-top{transition:none}
 .pv-command-dialog{scroll-behavior:auto}
}
html[data-pv-motion="off"] *,html[data-pv-motion="off"] *:before,html[data-pv-motion="off"] *:after{animation:none!important;transition:none!important;scroll-behavior:auto!important}
html[data-pv-motion="off"] [data-pv-reveal],html[data-pv-motion="off"] [data-pv-story]{opacity:1!important;transform:none!important;filter:none!important;clip-path:none!important;will-change:auto!important}
html[data-pv-motion="off"] .pv-home-motion .pv-category-grid[data-pv-story]>.home-category,html[data-pv-motion="off"] .pv-home-motion .pv-talent-grid[data-pv-story]>.designer-card,html[data-pv-motion="off"] .pv-home-motion .pv-project-grid[data-pv-story]>.home-project{opacity:1!important;transform:none!important}
/* v5.63.0 — responsive editorial refinement and adaptive navigation */
:root{
  --pv-nav-height:68px;
  --pv-nav-radius:16px;
  --pv-focus:color-mix(in srgb,var(--accent-strong) 78%,white);
  --pv-nav-panel:color-mix(in srgb,var(--surface) 96%,transparent);
}
html{scroll-padding-top:calc(var(--pv-nav-height) + 24px)}
h1,h2,h3,h4,.pv-managed-title,.showcase-section-heading{text-wrap:balance}
p,li,.muted,.pv-hero-lede{text-wrap:pretty}
.wrap{min-width:0}
.site-nav{
  position:sticky;top:10px;z-index:80;isolation:isolate;
  display:flex;align-items:center;justify-content:space-between;
  min-height:var(--pv-nav-height);gap:clamp(12px,1.5vw,22px);
  padding:9px 13px;border-radius:var(--pv-nav-radius)
}
.brand{flex:0 0 auto;min-width:0;gap:10px}
.brand-emblem{width:42px;height:42px;flex:0 0 42px}
.brand-copy{display:grid;min-width:0;line-height:1.15}
.brand-copy strong{font-size:12px;letter-spacing:.035em;white-space:nowrap}
.brand-copy small{margin-top:4px;font-size:7px;letter-spacing:.12em;color:var(--muted);white-space:nowrap}
.nav-toggle{
  display:none;align-items:center;justify-content:center;gap:12px;
  min-height:42px;padding:0 14px;border:1px solid var(--line);
  border-radius:11px;background:var(--surface-raised);color:var(--text);
  font:inherit;font-size:12px;font-weight:700;line-height:1;cursor:pointer
}
.nav-toggle-icon{font-size:18px;line-height:1}
.nav-links{display:flex;align-items:center;justify-content:flex-end;gap:clamp(8px,1.1vw,16px);flex:1;min-width:0;flex-wrap:nowrap}
.nav-primary{display:flex;align-items:center;gap:3px;min-width:0}
.nav-primary>a,.nav-more>summary{
  display:inline-flex;align-items:center;justify-content:center;gap:6px;
  min-height:38px;padding:8px clamp(8px,.85vw,12px);border-radius:9px;
  color:var(--text);font-size:11px;font-weight:700;letter-spacing:0;
  white-space:nowrap;cursor:pointer;list-style:none;transition:background .18s ease,color .18s ease,transform .18s ease
}
.nav-primary>a:hover,.nav-more>summary:hover{background:var(--surface-raised);color:var(--text)}
.nav-primary>a[aria-current="page"]{background:color-mix(in srgb,var(--accent) 13%,var(--surface));color:var(--text)}
.nav-more{position:relative;flex:0 0 auto}
.nav-more>summary::-webkit-details-marker{display:none}
.nav-more>summary span{font-size:13px;color:var(--muted);transition:transform .2s ease}
.nav-more[open]>summary span{transform:rotate(180deg)}
.nav-more-menu{
  position:absolute;top:calc(100% + 10px);right:0;z-index:95;
  display:grid;gap:3px;width:210px;padding:8px;
  border:1px solid var(--line);border-radius:13px;background:var(--pv-nav-panel);
  box-shadow:0 22px 60px rgba(0,0,0,.2);backdrop-filter:blur(18px);
  animation:pv-nav-pop .2s cubic-bezier(.2,.75,.25,1) both
}
.nav-more-menu a{
  display:flex;align-items:center;justify-content:space-between;gap:8px;
  padding:10px 11px;border-radius:8px;color:var(--text);font-size:11px;font-weight:650
}
.nav-more-menu a:hover,.nav-more-menu a[aria-current="page"]{background:var(--surface-raised);color:var(--text)}
.nav-actions{display:flex;align-items:center;gap:6px;flex:0 0 auto}
.nav-actions .nav-cta{
  display:inline-flex;align-items:center;justify-content:center;gap:8px;
  min-height:40px;margin:0;padding:0 14px;border-radius:9px;
  background:var(--accent-ink);color:white;font-size:11px;font-weight:800;white-space:nowrap
}
[data-theme="light"] .nav-actions .nav-cta{background:#314d39;color:#fff}
.nav-action-button{
  display:inline-flex;align-items:center;justify-content:center;gap:5px;
  width:auto;min-width:40px;min-height:40px;margin:0;padding:0 9px;
  border-radius:9px;background:transparent;color:var(--text);font-size:10px;font-weight:750
}
.nav-action-button>span:first-child{font-size:16px;line-height:1}
[data-theme="light"] .nav-action-button{background:#f4f2e9;color:#26372c;border-color:#d9d5c8}
[data-theme="light"] .nav-more-menu{background:rgba(255,254,249,.97)}
[data-theme="light"] .nav-more-menu a{color:#26372c}
[data-theme="light"] .nav-more-menu a:hover{background:#ecefe7}
.nav-more:focus-within>summary,.nav-primary a:focus-visible,.nav-actions a:focus-visible,.nav-action-button:focus-visible,.nav-toggle:focus-visible{outline:2px solid var(--pv-focus);outline-offset:3px}
@keyframes pv-nav-pop{from{opacity:0;transform:translateY(-6px) scale(.985)}to{opacity:1;transform:translateY(0) scale(1)}}

/* The headline is allowed to grow naturally; no fixed-height clipping. */
.pv-home{overflow:clip}
.pv-hero{
  min-height:clamp(620px,58vw,760px);
  grid-template-columns:minmax(0,1.2fr) minmax(280px,.8fr);
  align-items:center;gap:clamp(28px,4.8vw,72px);
  padding:clamp(52px,6.5vw,92px) clamp(26px,5.2vw,74px) 88px
}
.pv-hero-main{min-width:0;max-width:850px;overflow:visible}
.pv-hero h1{
  max-width:14ch;margin:clamp(22px,3vw,32px) 0 22px;
  font-size:clamp(50px,7.2vw,104px);line-height:.98;
  letter-spacing:-.078em;text-wrap:balance;overflow:visible
}
.pv-hero-title-visual{display:block;overflow:visible}
.pv-home-motion .pv-hero-word{
  display:inline-block;vertical-align:baseline;white-space:normal;
  padding-block:.035em;margin-block:-.035em;
  animation-duration:.78s;animation-timing-function:cubic-bezier(.18,.78,.22,1)
}
.pv-hero-lede{max-width:56ch;font-size:clamp(14px,1.35vw,17px);line-height:1.72}
.pv-hero-actions{gap:clamp(14px,2vw,24px);margin-top:28px}
.pv-hero-foot{gap:clamp(12px,1.8vw,22px);margin-top:clamp(36px,4.5vw,62px);flex-wrap:wrap}
.pv-index{width:100%;max-width:470px;min-width:0;padding:clamp(18px,2vw,25px)}
.pv-index-heading{flex-wrap:wrap}
.pv-index-total{gap:12px;padding:clamp(24px,3vw,36px) 0 25px}
.pv-index-total strong{font-size:clamp(56px,6.5vw,82px);line-height:.92}
.pv-hero-bottom{bottom:23px}
.pv-home .pv-motion-ribbon{margin-top:clamp(22px,3vw,34px)}

/* Responsive layout changes before navigation and hero columns become crowded. */
@media(max-width:1180px){
  .site-nav{min-height:64px}
  .nav-toggle{display:inline-flex;flex:0 0 auto}
  .nav-links{
    display:none;position:absolute;top:calc(100% + 9px);left:auto;right:0;
    width:min(440px,calc(100vw - 28px));max-height:min(76vh,680px);
    margin-left:auto;padding:14px;overflow:auto;overscroll-behavior:contain;
    border:1px solid var(--line);border-radius:15px;background:var(--pv-nav-panel);
    box-shadow:0 24px 70px rgba(0,0,0,.22);backdrop-filter:blur(22px) saturate(130%);
    flex-direction:column;align-items:stretch;justify-content:flex-start;gap:10px
  }
  .nav-links.open{display:flex;animation:pv-menu-enter .22s cubic-bezier(.2,.75,.25,1) both}
  .nav-primary{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px}
  .nav-primary>a{justify-content:flex-start;white-space:normal;min-height:42px;padding:10px 11px}
  .nav-more{width:100%}
  .nav-more>summary{justify-content:space-between;width:100%;min-height:42px;padding:10px 11px;background:var(--bg-soft)}
  .nav-more-menu{position:static;width:100%;margin-top:6px;box-shadow:none;background:var(--surface-raised);backdrop-filter:none;animation:none}
  .nav-actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;width:100%;padding-top:10px;border-top:1px solid var(--line)}
  .nav-actions .nav-cta{grid-column:1/-1;min-height:44px}
  .nav-action-button{width:100%;min-height:42px;padding:0 7px}
  [data-theme="light"] .nav-links{background:rgba(255,254,249,.98)}
  [data-theme="light"] .nav-more>summary{background:#f0efe7}
  .pv-hero{
    min-height:0;grid-template-columns:minmax(0,1fr);
    gap:clamp(28px,5vw,48px);padding:clamp(44px,7vw,76px) clamp(26px,5vw,64px) 88px
  }
  .pv-hero-main{max-width:900px}
  .pv-hero h1{max-width:14ch;font-size:clamp(56px,7.4vw,88px)}
  .pv-index{max-width:560px;justify-self:end}
  .pv-hero-foot{margin-top:clamp(34px,5vw,52px)}
}
@keyframes pv-menu-enter{from{opacity:0;transform:translateY(-7px)}to{opacity:1;transform:translateY(0)}}
@media(max-width:600px){
  .site-nav{top:7px;min-height:58px;padding:8px 10px;border-radius:13px}
  .brand{gap:8px}
  .brand-emblem{width:37px;height:37px;flex-basis:37px}
  .brand-copy strong{font-size:11px}
  .brand-copy small{font-size:6px;letter-spacing:.09em}
  .nav-toggle{min-height:40px;padding-inline:12px;border-radius:10px}
  .nav-links{width:calc(100vw - 28px);max-height:calc(100dvh - 92px);padding:11px}
  .nav-primary{gap:4px}
  .nav-primary>a{font-size:11px}
  .nav-actions{gap:5px}
  .nav-action-button{font-size:10px;min-height:40px}
  .pv-hero{padding:40px 21px 78px;border-radius:17px;gap:27px}
  .pv-hero h1{max-width:13ch;font-size:clamp(44px,11.8vw,70px);line-height:1.01;letter-spacing:-.074em;margin:22px 0 18px}
  .pv-hero-lede{font-size:14px;line-height:1.7}
  .pv-hero-actions{align-items:stretch;gap:12px}
  .pv-hero-actions .pv-button{min-height:46px}
  .pv-hero-foot{gap:10px 14px;margin-top:32px;font-size:7px}
  .pv-index{max-width:none;padding:17px}
  .pv-index-heading{font-size:7px}
  .pv-index-total{padding:23px 0 18px}
  .pv-index-total strong{font-size:58px}
  .pv-index-metrics{gap:8px;padding:17px 0}
  .pv-index-metrics b{font-size:21px}
  .pv-index-metrics small{font-size:6px}
  .pv-hero-bottom{left:21px;right:21px;bottom:20px}
}
@media(max-width:380px){
  .nav-toggle{gap:8px;padding-inline:10px}
  .nav-toggle-label{font-size:11px}
  .nav-links{width:calc(100vw - 24px)}
  .nav-actions{grid-template-columns:1fr 1fr}
  .nav-actions .nav-cta{grid-column:1/-1}
  .nav-action-button:last-child{grid-column:1/-1}
  .pv-hero h1{font-size:clamp(42px,11vw,56px)}
}
@media(prefers-reduced-motion:reduce){
  .nav-links.open,.nav-more-menu{animation:none!important}
  .pv-home-motion .pv-hero-word{animation:none!important;opacity:1!important;transform:none!important}
}


/* v5.64.0 — accessible color system, calm editorial canvas and refined navigation */
:root{
  --pv-nav-gap:10px;
  --pv-focus:#A8BD91;
  --pv-panel-shadow:0 24px 64px rgba(12,18,13,.18);
}
[data-theme="dark"]{
  --bg:#171B18;--bg-soft:#202720;--surface:#252D27;--surface-raised:#2D372F;
  --line:#465247;--text:#F2F1E8;--muted:#C1C8BC;--subtle:#A4AEA2;
  --accent:#AAB99A;--accent-strong:#D0D9C4;--accent-ink:#202820;
  --gold:#D1C49A;--danger:#F1A6A0;--pv-nav-panel:rgba(35,43,37,.985);
  --pv-focus:#C3D3AD;
}
[data-theme="light"]{
  color-scheme:light;
  --bg:#F3F1E9;--bg-soft:#EBE9E0;--surface:#FBFAF5;--surface-raised:#FFFFFF;
  --line:#D5D8CD;--text:#242A24;--muted:#515D53;--subtle:#687568;
  --accent:#536B4C;--accent-strong:#344B36;--accent-ink:#FFFFFF;
  --gold:#80683C;--danger:#A53F3A;--pv-nav-panel:rgba(255,254,249,.985);
  --pv-focus:#536B4C;
}
html{background:var(--bg);color:var(--text);scroll-padding-top:112px}
body{
  color:var(--text);
  background:
    radial-gradient(ellipse at 84% -8%,color-mix(in srgb,var(--accent) 9%,transparent),transparent 34%),
    radial-gradient(ellipse at 4% 42%,color-mix(in srgb,var(--gold) 5%,transparent),transparent 31%),
    var(--bg);
  transition:background-color .28s ease,color .28s ease;
}
/* Sparse diagonal linework and one irregular organic outline; no dense grid or concentric rings. */
body:before{
  opacity:.20;
  background-image:repeating-linear-gradient(132deg,transparent 0 118px,color-mix(in srgb,var(--line) 30%,transparent) 119px,color-mix(in srgb,var(--line) 30%,transparent) 120px,transparent 121px 238px);
  background-size:auto;
  mask-image:linear-gradient(120deg,transparent 4%,#000 48%,transparent 92%);
}
body:after{
  width:min(43vw,560px);height:min(43vw,560px);right:-20vw;top:17vh;
  border:1px solid color-mix(in srgb,var(--accent) 17%,transparent);
  border-radius:64% 36% 51% 49% / 42% 58% 42% 58%;
  box-shadow:none;opacity:.42;transform:rotate(-24deg);
  background:radial-gradient(ellipse at 36% 38%,color-mix(in srgb,var(--accent) 5%,transparent),transparent 68%);
}
[data-theme="light"] body:before{opacity:.17}
[data-theme="light"] body:after{opacity:.28;border-color:rgba(83,107,76,.16)}
#main-content{color:var(--text)}
#main-content :is(h1,h2,h3,h4,h5,h6,legend,.section-head h2,.studio-content-heading h2){color:var(--text)}
#main-content :is(p,li,dd,dt,td,th,label,.muted,.status,.designer-tagline,.capability-description,.growth-footnote,.studio-section-copy,.studio-updated,.showcase-section-heading>p){color:var(--muted)}
#main-content :is(strong,b,.price,.metric-value,.kpi-value){color:var(--text)}
#main-content :is(.eyebrow,.pv-overline,.pv-label,.studio-card-kicker){color:var(--accent-strong)}
#main-content a:not(.btn):not(.nav-cta):not(.brand){color:var(--accent-strong);text-underline-offset:3px}
#main-content a:not(.btn):not(.nav-cta):not(.brand):hover{color:var(--gold)}
#main-content :is(.card,.stat,.feature-item,.trust-item,.hero-panel,.designer-card,.work,.search-panel,.pv-client-card,.studio-panel,.growth-panel,.review-card,.reputation-panel,.category-index,.category-intro-note){color:var(--text);border-color:var(--line)}
#main-content :is(.card,.stat,.feature-item,.trust-item,.hero-panel,.designer-card,.work,.search-panel,.pv-client-card,.studio-panel,.growth-panel,.review-card,.reputation-panel){background:linear-gradient(145deg,var(--surface-raised),var(--surface))}
#main-content :is(input,select,textarea){background:var(--surface-raised)!important;color:var(--text)!important;border:1px solid var(--line)!important;caret-color:var(--accent-strong)}
#main-content :is(input,select,textarea)::placeholder{color:var(--subtle)!important;opacity:1}
#main-content :is(input,select,textarea):focus-visible{outline:3px solid color-mix(in srgb,var(--accent) 28%,transparent)!important;outline-offset:2px;border-color:var(--accent)!important}
#main-content select option{background:var(--surface-raised);color:var(--text)}
#main-content label{display:block;color:var(--text);font-weight:700}
#main-content :is(.btn-secondary,.btn-ghost,.favorite-btn,.shortlist-btn){background:var(--surface-raised);color:var(--text);border:1px solid var(--line);box-shadow:none}
#main-content .btn-secondary:hover,#main-content .btn-ghost:hover{background:var(--bg-soft);color:var(--text)}
#main-content .btn{background:linear-gradient(135deg,var(--accent),color-mix(in srgb,var(--accent) 74%,var(--gold)));color:var(--accent-ink);border:1px solid color-mix(in srgb,var(--accent) 65%,var(--line));box-shadow:0 8px 22px color-mix(in srgb,var(--accent) 17%,transparent)}
#main-content .tag{background:color-mix(in srgb,var(--accent) 13%,var(--surface));color:var(--accent-strong);border:1px solid color-mix(in srgb,var(--accent) 30%,var(--line))}
#main-content :is(table,.shortlist-table){color:var(--text);border-color:var(--line)}
#main-content :is(th,td){border-color:var(--line)}
#main-content :is(th){background:var(--bg-soft);color:var(--text)}
#main-content :is(.studio-sidebar,.studio-sidebar-profile,.studio-nav a,.studio-sidebar-bottom a,.studio-kpi,.studio-welcome,.studio-savebar,.studio-preview,.studio-order,.studio-toggle){color:var(--text);border-color:var(--line)}
#main-content .studio-sidebar{background:var(--surface)}
#main-content .studio-sidebar-profile{background:var(--bg-soft)}
#main-content .studio-nav a{color:var(--muted)}
#main-content .studio-nav a:hover,#main-content .studio-nav a.active{background:var(--bg-soft);color:var(--text)}
#main-content .studio-sidebar-profile small{color:var(--muted)}
#main-content .shortlist-table-wrap{background:var(--surface);border-color:var(--line)}
#main-content .shortlist-table td{background:var(--surface);color:var(--text)}
#main-content .shortlist-table th{background:var(--bg-soft);color:var(--text)}
#main-content .shortlist-hero{color:#F5F2E9}
#main-content .shortlist-hero h1{color:#F5F2E9}
#main-content .shortlist-hero p{color:#D8DED3}
#main-content .shortlist-hero .eyebrow{color:#D2DCC4}
#main-content .foot{background:#202820;color:#E8E9DF;border-color:#465247}
#main-content .foot :is(h2,h3,strong){color:#F5F3E9}
#main-content .foot p{color:#C9D0C4}
#main-content .foot a{color:#DDE7D4}
#main-content .foot a:hover{color:#FFFFFF}
[data-theme="light"] #main-content .pv-hero{color:#242A24;border-color:#D5D8CD}
[data-theme="light"] #main-content .pv-hero h1{color:#242A24!important}
[data-theme="light"] #main-content .pv-hero-lede{color:#515D53!important}
[data-theme="light"] #main-content .pv-hero-foot,[data-theme="light"] #main-content .pv-hero-bottom{color:#596558!important}
[data-theme="light"] #main-content .pv-index{background:rgba(255,254,249,.88);color:#242A24;border-color:#D5D8CD}
[data-theme="light"] #main-content .pv-index :is(strong,b){color:#242A24}
[data-theme="light"] #main-content .pv-index :is(span,small,p){color:#586257}
[data-theme="light"] #main-content .pv-button-dark{background:#344B36;color:#FFFFFF!important}
[data-theme="light"] #main-content .pv-text-link{color:#344B36!important;border-color:rgba(52,75,54,.35)}
[data-theme="light"] #main-content .category-intro-copy,
[data-theme="light"] #main-content .category-intro-note,
[data-theme="light"] #main-content .category-index-heading,
[data-theme="light"] #main-content .category-recent-caption{color:#515D53}
[data-theme="light"] #main-content .category-tile-copy :is(h2,h3,p),
[data-theme="light"] #main-content .category-tile-foot{color:inherit}
[data-theme="light"] #main-content .showcase-badges .tag{color:#344B36}

/* Navigation: clear grouping, predictable hit areas and breathing room between utilities. */
.site-nav{gap:clamp(12px,1.6vw,22px);padding:10px 14px}
.nav-links{gap:clamp(9px,1.2vw,16px)}
.nav-primary{gap:5px}
.nav-primary>a,.nav-more>summary{min-height:40px;padding-inline:11px}
.nav-actions{gap:9px}
.nav-action-button{min-width:44px;min-height:42px;padding-inline:10px;border:1px solid var(--line);background:var(--surface-raised);color:var(--text)}
.nav-action-button>span:first-child{font-size:15px}
.nav-toggle{min-width:88px;gap:12px;border-radius:11px;background:var(--surface-raised);color:var(--text);box-shadow:0 5px 16px rgba(0,0,0,.08)}
.nav-toggle-icon{display:inline-grid;place-items:center;transition:transform .24s cubic-bezier(.2,.75,.25,1)}
.nav-toggle[aria-expanded="true"] .nav-toggle-icon{transform:rotate(90deg)}
.nav-links.open{gap:13px;padding:16px}
.nav-links.open .nav-primary{gap:7px}
.nav-links.open .nav-primary>a{min-height:44px;padding:11px 12px;border:1px solid color-mix(in srgb,var(--line) 78%,transparent);background:color-mix(in srgb,var(--surface-raised) 72%,transparent);font-size:12px}
.nav-links.open .nav-primary>a[aria-current="page"]{background:color-mix(in srgb,var(--accent) 16%,var(--surface-raised));border-color:color-mix(in srgb,var(--accent) 35%,var(--line))}
.nav-links.open .nav-more>summary{min-height:44px;padding:11px 12px;border:1px solid var(--line);border-radius:10px;background:var(--bg-soft);color:var(--text);font-size:12px}
.nav-links.open .nav-more-menu{gap:4px;padding:7px;border:1px solid var(--line);border-radius:11px;background:var(--surface-raised)}
.nav-links.open .nav-more-menu a{min-height:40px;padding:10px 12px;color:var(--text);font-size:12px}
.nav-links.open .nav-actions{gap:9px;padding-top:13px;border-top:1px solid var(--line)}
.nav-actions .nav-cta{min-height:46px;border-radius:10px}
.nav-action-button{min-height:44px;border-radius:10px;gap:7px;justify-content:center}
.nav-action-button:hover,.nav-toggle:hover{border-color:color-mix(in srgb,var(--accent) 55%,var(--line));background:color-mix(in srgb,var(--accent) 9%,var(--surface-raised))}
[data-theme="light"] .site-nav{background:rgba(255,254,249,.94);border-color:#D5D8CD;box-shadow:0 12px 36px rgba(40,48,39,.08)}
[data-theme="light"] .nav-links.open{background:rgba(255,254,249,.99);border-color:#D5D8CD;box-shadow:0 24px 58px rgba(36,44,36,.15)}
[data-theme="light"] .nav-links.open .nav-primary>a{color:#344238;border-color:#E0E2D8;background:#F8F8F2}
[data-theme="light"] .nav-links.open .nav-primary>a:hover{background:#ECEFE7;color:#263B2A}
[data-theme="light"] .nav-links.open .nav-more>summary{background:#F0F0E8;color:#26372C;border-color:#D5D8CD}
[data-theme="light"] .nav-links.open .nav-more-menu{background:#FFFFFF;border-color:#D5D8CD}
[data-theme="light"] .nav-links.open .nav-more-menu a{color:#26372C}
[data-theme="light"] .nav-links.open .nav-more-menu a:hover{background:#EEF0E8;color:#26372C}
[data-theme="light"] .nav-action-button{background:#F5F5EF;color:#2D3B30;border-color:#D5D8CD}
[data-theme="light"] .nav-action-button:hover{background:#E9EEE5;color:#263B2A}
[data-theme="light"] .nav-toggle{background:#F8F8F2;color:#26372C;border-color:#D5D8CD}
@media(max-width:1180px){
  .site-nav{position:sticky;align-items:center}
  .nav-links.open{width:min(460px,calc(100vw - 28px));max-height:min(78dvh,700px);overflow:auto;overscroll-behavior:contain}
  .nav-actions{grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}
  .nav-actions .nav-cta{grid-column:1/-1}
  .nav-action-button{width:100%;min-width:0;padding-inline:7px;font-size:11px}
}
@media(max-width:600px){
  .wrap{padding-left:14px;padding-right:14px}
  .site-nav{padding:8px 10px;gap:10px}
  .brand-copy strong{max-width:min(42vw,190px)}
  .nav-toggle{min-width:82px;min-height:42px;padding-inline:11px}
  .nav-links.open{width:calc(100vw - 28px);padding:12px;gap:12px}
  .nav-primary>a{font-size:11px}
  .nav-actions{gap:8px;padding-top:12px}
  .nav-actions .nav-cta{min-height:44px}
  .nav-action-button{min-height:44px;font-size:10px}
}
@media(max-width:380px){
  .brand-copy small{letter-spacing:.055em}
  .nav-links.open{width:calc(100vw - 24px)}
  .nav-actions{grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
  .nav-action-button{gap:4px;padding-inline:3px;font-size:9px}
  .nav-action-button>span:first-child{font-size:14px}
  .nav-actions .nav-cta{grid-column:1/-1}
}

/* Motion is expressive but restrained, and always respects reduced-motion preferences. */
@media(hover:hover) and (pointer:fine){
  .nav-action-button:hover,.nav-primary>a:hover,.nav-more>summary:hover{transform:translateY(-1px)}
  .btn:hover,.nav-actions .nav-cta:hover{transform:translateY(-2px)}
}
.nav-links.open{transform-origin:top right}
.nav-links.open .nav-primary>a{transition:background .2s ease,border-color .2s ease,color .2s ease,transform .2s ease}
.nav-action-button:active,.nav-toggle:active{transform:scale(.975)}
:where(button,a,input,select,textarea,summary):focus-visible{outline:2px solid var(--pv-focus);outline-offset:3px}
@media(prefers-reduced-motion:reduce){
  html{scroll-behavior:auto}
  *,*::before,*::after{scroll-behavior:auto!important;animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}
}


/* v5.65.0 — theme-safe component contrast and reliable primary actions */
:root{
  --pv-contrast-ink:#242A24;
  --pv-contrast-muted:#515D53;
  --pv-contrast-dark-ink:#F4F1E8;
  --pv-contrast-dark-muted:#C7CEC2;
}
[data-theme="dark"]{
  --pv-nav-cta-bg:#CDD7BF;
  --pv-nav-cta-ink:#202820;
  --pv-hero-button-bg:#E8E8DC;
  --pv-hero-button-ink:#202820;
  --pv-light-button-bg:#F0EFE5;
  --pv-light-button-ink:#263329;
}
[data-theme="light"]{
  --pv-nav-cta-bg:#344B36;
  --pv-nav-cta-ink:#FFFFFF;
  --pv-hero-button-bg:#344B36;
  --pv-hero-button-ink:#FFFFFF;
  --pv-light-button-bg:#F0EFE5;
  --pv-light-button-ink:#263329;
}

/* Keep each editorial category tile's own palette in both themes.
   The previous global #main-content heading/body/link rules must not overwrite it. */
#main-content .category-tile,
#main-content .category-tile:visited{
  color:var(--cat-ink)!important;
  background:var(--cat-bg)!important;
  border-color:color-mix(in srgb,var(--cat-ink) 24%,transparent)!important;
  text-decoration:none!important;
}
#main-content .category-tile .category-tile-top,
#main-content .category-tile .category-tile-copy p,
#main-content .category-tile .category-tile-foot>span{
  color:var(--cat-muted)!important;
  -webkit-text-fill-color:var(--cat-muted)!important;
}
#main-content .category-tile .category-tile-copy h2,
#main-content .category-tile .category-tile-copy h3,
#main-content .category-tile .category-tile-foot>b{
  color:var(--cat-ink)!important;
  -webkit-text-fill-color:var(--cat-ink)!important;
}
#main-content .category-tile .category-tile-art>span{color:var(--cat-accent)!important;-webkit-text-fill-color:var(--cat-accent)!important}
#main-content .category-tile .category-tile-art:before,
#main-content .category-tile .category-tile-art:after{border-color:color-mix(in srgb,var(--cat-accent) 58%,transparent)}
#main-content .category-tile:hover{filter:saturate(1.04);box-shadow:0 18px 40px rgba(12,20,14,.18)}
#main-content .category-tile:focus-visible{outline:3px solid var(--pv-focus);outline-offset:4px}

/* Slightly tune selected fixed category palettes so every small text label clears AA contrast. */
#main-content .category-tone-3{--cat-bg:#AD4F37;--cat-ink:#FFF6ED;--cat-muted:#FFECE4}
#main-content .category-tone-4{--cat-muted:#62514B}
#main-content .category-tone-6{--cat-muted:#46595E}
#main-content .category-tone-7{--cat-muted:#5F523D}
#main-content .category-tone-8{--cat-bg:#5D6F50;--cat-ink:#FFF9EC;--cat-muted:#F0F0E5}
#main-content .category-tone-9{--cat-muted:#4F5D52}

/* Navigation CTA is a real primary action, never a pale-on-pale ghost button. */
#main-content .site-nav .nav-actions>a.nav-cta,
#main-content .site-nav .nav-links .nav-actions>a.nav-cta{
  background:var(--pv-nav-cta-bg)!important;
  color:var(--pv-nav-cta-ink)!important;
  -webkit-text-fill-color:var(--pv-nav-cta-ink)!important;
  border:1px solid color-mix(in srgb,var(--pv-nav-cta-bg) 72%,var(--line))!important;
  opacity:1!important;filter:none!important;text-shadow:none!important;
  box-shadow:0 7px 18px rgba(12,20,14,.13);
}
#main-content .site-nav .nav-actions>a.nav-cta span{
  color:inherit!important;-webkit-text-fill-color:inherit!important;opacity:1!important
}
#main-content .site-nav .nav-actions>a.nav-cta:hover{
  background:color-mix(in srgb,var(--pv-nav-cta-bg) 90%,var(--gold))!important;
  color:var(--pv-nav-cta-ink)!important;transform:translateY(-2px)
}
#main-content .site-nav .nav-actions>a.nav-cta:focus-visible{outline:3px solid var(--pv-focus)!important;outline-offset:3px}

/* Editorial hero buttons use deliberate foreground/background pairs, not generic link color. */
#main-content .pv-hero .pv-button-dark{
  background:var(--pv-hero-button-bg)!important;
  color:var(--pv-hero-button-ink)!important;
  -webkit-text-fill-color:var(--pv-hero-button-ink)!important;
  border:1px solid color-mix(in srgb,var(--pv-hero-button-ink) 15%,transparent)!important;
  opacity:1!important;text-shadow:none!important
}
#main-content .pv-hero .pv-button-dark:hover{
  background:color-mix(in srgb,var(--pv-hero-button-bg) 90%,var(--gold))!important;
  color:var(--pv-hero-button-ink)!important
}
#main-content .pv-join{color:#F4F1E8!important}
#main-content .pv-join h2{color:#F4F1E8!important;-webkit-text-fill-color:#F4F1E8!important}
#main-content .pv-join p{color:#D6DED2!important;-webkit-text-fill-color:#D6DED2!important}
#main-content .pv-join .pv-label{color:#D7E0C6!important;-webkit-text-fill-color:#D7E0C6!important}
#main-content .pv-join .pv-button-light{
  background:var(--pv-light-button-bg)!important;
  color:var(--pv-light-button-ink)!important;
  -webkit-text-fill-color:var(--pv-light-button-ink)!important;
  border:1px solid rgba(32,40,32,.18)!important;
  opacity:1!important;text-shadow:none!important
}
#main-content .pv-join .pv-button-light:hover{
  background:#FFFFFF!important;color:#202820!important;-webkit-text-fill-color:#202820!important
}

/* Light theme keeps intentionally dark editorial panels readable rather than recoloring them as light cards. */
[data-theme="light"] #main-content .pv-join{background:linear-gradient(118deg,#334A37,#26362C 58%,#303A31)!important}
[data-theme="light"] #main-content .pv-join :is(h2,p,.pv-label){text-shadow:none}
[data-theme="light"] #main-content .pv-hero h1{color:#202820!important;-webkit-text-fill-color:#202820!important}
[data-theme="light"] #main-content .pv-hero .pv-hero-lede{color:#505C51!important;-webkit-text-fill-color:#505C51!important}
[data-theme="light"] #main-content .pv-hero .pv-overline,
[data-theme="light"] #main-content .pv-hero .pv-label{color:#52634F!important;-webkit-text-fill-color:#52634F!important}
[data-theme="light"] #main-content .pv-hero .pv-text-link{color:#344E39!important;-webkit-text-fill-color:#344E39!important}
[data-theme="light"] #main-content .pv-hero .pv-hero-foot,
[data-theme="light"] #main-content .pv-hero .pv-hero-bottom{color:#667264!important;-webkit-text-fill-color:#667264!important}

/* Consistent helper text and form labels in both public and studio workspaces. */
#main-content :is(.form-hint,.field-help,.helper-text,.studio-updated,.studio-sidebar-profile small){color:var(--muted)!important}
#main-content :is(input,select,textarea)::placeholder{color:var(--subtle)!important;opacity:1}
#main-content :is(input,select,textarea):focus-visible{outline:3px solid color-mix(in srgb,var(--accent) 28%,transparent)!important;outline-offset:2px}


/* v5.66.0 — mobile navigation spacing, touch targets and readable utility layout */
@media(max-width:600px){
  .site-nav{gap:12px;min-height:62px;padding:9px 11px;border-radius:15px}
  .brand{gap:9px}
  .brand-emblem{width:39px;height:39px;flex-basis:39px}
  .brand-copy strong{font-size:11.5px;letter-spacing:.025em}
  .brand-copy small{font-size:6.5px;letter-spacing:.075em}
  .nav-toggle{min-width:92px;min-height:46px;padding:0 13px;gap:11px;border-radius:12px;font-size:12px}
  .nav-toggle-label{font-size:12px}
  .nav-toggle-icon{font-size:19px}

  /* Keep the menu aligned to the actual header width, not wider than the phone. */
  .nav-links.open{
    left:0;right:0;width:100%;max-width:100%;
    max-height:calc(100dvh - 108px);padding:16px;
    gap:15px;border-radius:17px;overflow-x:hidden;overflow-y:auto;
    overscroll-behavior:contain;-webkit-overflow-scrolling:touch;
    scrollbar-width:thin;touch-action:pan-y
  }
  .nav-primary{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
  .nav-links.open .nav-primary>a{
    min-width:0;min-height:50px;padding:12px 13px;
    border-radius:11px;font-size:12.5px;line-height:1.25
  }
  .nav-links.open .nav-more>summary{
    min-height:50px;padding:12px 14px;border-radius:11px;font-size:12.5px
  }
  .nav-links.open .nav-more-menu{gap:6px;margin-top:8px;padding:9px;border-radius:12px}
  .nav-links.open .nav-more-menu a{min-height:46px;padding:12px 13px;border-radius:9px;font-size:12.5px}

  /* Primary action gets its own row. Search gets a full-width row; preferences share a calm 2-col row. */
  .nav-links.open .nav-actions{
    display:grid;grid-template-columns:repeat(2,minmax(0,1fr));
    gap:10px;padding-top:16px;margin-top:1px;border-top:1px solid var(--line)
  }
  .nav-links.open .nav-actions .nav-cta{
    grid-column:1/-1;min-height:52px;padding:0 16px;
    border-radius:12px;font-size:13px;letter-spacing:.005em
  }
  .nav-links.open .nav-actions [data-command-open]{
    grid-column:1/-1;justify-content:flex-start;min-height:49px;
    padding:0 15px;border-radius:11px;font-size:12px;gap:10px
  }
  .nav-links.open .nav-actions [data-motion-toggle],
  .nav-links.open .nav-actions [data-theme-toggle]{
    grid-column:auto;min-width:0;min-height:49px;padding:0 11px;
    border-radius:11px;gap:8px;font-size:12px;white-space:nowrap
  }
  .nav-links.open .nav-actions .nav-action-button>span:first-child{font-size:17px}
  [data-theme="light"] .nav-links.open .nav-actions [data-command-open],
  [data-theme="light"] .nav-links.open .nav-actions [data-motion-toggle],
  [data-theme="light"] .nav-links.open .nav-actions [data-theme-toggle]{
    background:#F5F5EF;color:#2D3B30;border-color:#D5D8CD
  }
  [data-theme="dark"] .nav-links.open .nav-actions [data-command-open],
  [data-theme="dark"] .nav-links.open .nav-actions [data-motion-toggle],
  [data-theme="dark"] .nav-links.open .nav-actions [data-theme-toggle]{
    background:#303A32;color:#F2F1E8;border-color:#536052
  }
}
@media(max-width:380px){
  .site-nav{padding-inline:9px}
  .nav-links.open{padding:14px;gap:14px}
  .nav-links.open .nav-primary{gap:7px}
  .nav-links.open .nav-primary>a{min-height:48px;padding-inline:11px;font-size:12px}
  .nav-links.open .nav-actions{grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}
  .nav-links.open .nav-actions .nav-cta,
  .nav-links.open .nav-actions [data-command-open]{grid-column:1/-1}
  .nav-links.open .nav-actions [data-motion-toggle],
  .nav-links.open .nav-actions [data-theme-toggle]{grid-column:auto;min-height:48px;padding-inline:8px;font-size:11px}
}
@media(prefers-reduced-motion:reduce){
  .nav-toggle-icon{transition:none!important}
}

/* v5.67.0 — precise mobile button alignment and icon-label rhythm */
@media(max-width:600px){
  .site-nav{
    align-items:center;
    gap:12px;
  }
  .nav-toggle{
    display:inline-flex!important;
    flex:0 0 auto;
    align-items:center;
    justify-content:center;
    gap:12px!important;
    width:auto;
    min-width:108px;
    min-height:48px!important;
    padding:0 15px!important;
    line-height:1!important;
    text-align:center;
  }
  .nav-toggle-label{
    display:block;
    flex:0 0 auto;
    line-height:1!important;
    white-space:nowrap;
    letter-spacing:.01em;
  }
  .nav-toggle-icon{
    display:inline-grid;
    place-items:center;
    flex:0 0 22px;
    width:22px;
    height:22px;
    margin:0 0 0 1px;
    font-family:Arial,sans-serif;
    font-size:20px!important;
    font-weight:500;
    line-height:1!important;
    text-align:center;
  }

  .nav-links.open{
    gap:16px;
    padding:16px;
  }
  .nav-links.open .nav-primary>a,
  .nav-links.open .nav-more>summary{
    display:flex;
    align-items:center;
    min-height:50px;
    line-height:1.2;
  }
  .nav-links.open .nav-actions{
    display:grid!important;
    grid-template-columns:repeat(2,minmax(0,1fr))!important;
    grid-template-areas:"portal portal" "search search" "motion theme"!important;
    align-items:stretch;
    gap:10px 12px!important;
    width:100%;
    padding-top:16px;
    margin-top:0;
  }
  .nav-links.open .nav-actions .nav-cta,
  .nav-links.open .nav-actions .nav-action-button{
    box-sizing:border-box;
    display:inline-flex!important;
    align-items:center;
    min-width:0;
    width:100%!important;
    min-height:50px;
    margin:0;
    padding:0 15px;
    border-radius:12px;
    font-size:12px;
    font-weight:750;
    line-height:1.15;
    letter-spacing:0;
    white-space:nowrap;
    text-align:center;
  }
  .nav-links.open .nav-actions .nav-cta{
    grid-area:portal;
    grid-column:1/-1!important;
    justify-self:stretch;
    justify-content:center;
    gap:10px;
    min-height:54px;
    padding-inline:18px;
    font-size:13px;
  }
  .nav-links.open .nav-actions [data-command-open]{
    grid-area:search;
    grid-column:1/-1!important;
    justify-self:stretch;
    justify-content:flex-start;
    gap:11px;
    min-height:50px;
    padding-inline:16px;
    text-align:left;
  }
  .nav-links.open .nav-actions [data-motion-toggle],
  .nav-links.open .nav-actions [data-theme-toggle]{
    grid-column:auto!important;
    justify-self:stretch;
    justify-content:center;
    gap:9px!important;
    min-height:50px;
    padding-inline:10px;
  }
  .nav-links.open .nav-actions [data-motion-toggle]{grid-area:motion!important}
  .nav-links.open .nav-actions [data-theme-toggle]{grid-area:theme!important}
  .nav-links.open .nav-actions .nav-action-button>span:first-child{
    display:inline-flex;
    align-items:center;
    justify-content:center;
    flex:0 0 21px;
    width:21px;
    height:21px;
    margin:0;
    font-size:17px!important;
    line-height:1!important;
  }
  .nav-links.open .nav-actions .nav-action-button>span:not(:first-child){
    display:inline-block;
    min-width:0;
    line-height:1.2;
  }
  .nav-links.open .nav-actions .nav-cta>span{
    display:inline-flex;
    align-items:center;
    line-height:1!important;
  }
}
@media(max-width:380px){
  .site-nav{padding-inline:10px}
  .nav-toggle{min-width:104px;padding-inline:13px!important;gap:11px!important}
  .nav-links.open{padding:14px;gap:14px}
  .nav-links.open .nav-actions{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:9px 10px!important}
  .nav-links.open .nav-actions .nav-cta,
  .nav-links.open .nav-actions [data-command-open]{grid-column:1/-1}
  .nav-links.open .nav-actions [data-motion-toggle],
  .nav-links.open .nav-actions [data-theme-toggle]{grid-column:auto!important;min-height:49px;padding-inline:8px}
  .nav-links.open .nav-actions [data-motion-toggle]{grid-area:motion!important}
  .nav-links.open .nav-actions [data-theme-toggle]{grid-area:theme!important}
}


/* v5.68.1 — motion refinement, persistent navigation and editorial micro-interactions */
:root{--pv-motion-ease:cubic-bezier(.22,.75,.25,1);--pv-motion-fast:180ms;--pv-motion-medium:340ms;--pv-motion-slow:680ms}
.site-nav{view-transition-name:pv-site-nav}
.pv-motion-ready .site-nav{animation:none!important;opacity:1!important;transform:none!important}
.site-nav{transition:background-color .24s ease,border-color .24s ease,box-shadow .24s ease}
.site-nav.is-scrolled{box-shadow:0 16px 42px rgba(0,0,0,.16);border-color:color-mix(in srgb,var(--accent) 28%,var(--line))}
[data-theme="light"] .site-nav.is-scrolled{box-shadow:0 14px 38px rgba(38,48,36,.12)}
::view-transition-group(pv-site-nav){animation-duration:1ms}
::view-transition-old(pv-site-nav),::view-transition-new(pv-site-nav){animation:none!important;mix-blend-mode:normal}
::view-transition-old(root){animation:pv-view-out .14s ease both}
::view-transition-new(root){animation:pv-view-in .3s var(--pv-motion-ease) both}
.nav-primary>a,.nav-more>summary{position:relative}
.nav-primary>a:after{content:"";position:absolute;left:12px;right:12px;bottom:5px;height:1px;background:var(--accent-strong);transform:scaleX(0);transform-origin:left;transition:transform .28s var(--pv-motion-ease);pointer-events:none}
.nav-primary>a[aria-current="page"]:after,.nav-primary>a:hover:after{transform:scaleX(1)}
.nav-more>summary span{display:inline-block;transition:transform .26s var(--pv-motion-ease)}
.nav-more[open]>summary span{transform:rotate(180deg)}
.nav-toggle-icon{transition:transform .3s var(--pv-motion-ease),opacity .2s ease}
.nav-toggle[aria-expanded="true"] .nav-toggle-icon{transform:rotate(90deg)}
.nav-links.open{transform-origin:top center}
.nav-links.open .nav-primary>a{transition:background-color .2s ease,border-color .2s ease,transform .24s var(--pv-motion-ease)}
.nav-links.open .nav-primary>a:active{transform:scale(.985)}
.btn,.pv-button,.nav-cta,.footer-cta-actions a{transition:transform .28s var(--pv-motion-ease),box-shadow .28s ease,background-color .28s ease,border-color .28s ease,color .28s ease}
.pv-button span:last-child,.nav-cta span:last-child,.footer-cta-actions a span:last-child{display:inline-block;transition:transform .28s var(--pv-motion-ease)}
.pv-magnetic{translate:var(--pv-magnetic-x,0px) var(--pv-magnetic-y,0px)!important;transition:translate .18s cubic-bezier(.2,.75,.25,1);will-change:translate}.pv-button-pointer-hover{filter:brightness(1.035)}
@media(hover:hover) and (pointer:fine){
 .btn:hover,.pv-button:hover,.nav-cta:hover,.footer-cta-actions a:hover{transform:translate3d(0,-2px,0)}
 .pv-button:hover span:last-child,.nav-cta:hover span:last-child,.footer-cta-actions a:hover span:last-child{transform:translate3d(3px,-1px,0)}
 .category-tile .category-tile-art>span{transition:transform .5s var(--pv-motion-ease)}
 .category-tile:hover .category-tile-art>span{transform:translate3d(0,-4px,0) rotate(-4deg) scale(1.045)}
 .pv-project-list-card .pv-project-list-icon{transition:transform .35s var(--pv-motion-ease),background-color .25s ease}
 .pv-project-list-card:hover .pv-project-list-icon{transform:translate3d(3px,-3px,0) rotate(5deg)}
 .showcase-work-image{overflow:hidden}
 .showcase-work-image img{transition:transform .85s var(--pv-motion-ease)}
 .showcase-work:hover .showcase-work-image img{transform:scale(1.055)}
 .showcase-work[data-pv-reveal] .showcase-work-image img{transform:scale(1.075)}
 .showcase-work[data-pv-reveal].is-visible .showcase-work-image img{transform:scale(1)}
 .home-project-image img{transition:transform .85s var(--pv-motion-ease)}
 .pv-home .home-category:hover>b{transform:translate3d(3px,-3px,0) rotate(2deg)}
 .pv-home .home-project:hover .home-project-image img{transform:scale(1.045)}
 .pv-home .pv-manifesto-copy .pv-manifesto-points div:hover{transform:translate3d(6px,0,0)}
}
.pv-motion-ready [data-pv-reveal]{transition-duration:.58s;transition-timing-function:var(--pv-motion-ease);transition-delay:var(--pv-reveal-delay,0ms)}
.pv-motion-ready [data-pv-reveal][data-pv-motion-kind="media"]{transform:translate3d(0,22px,0) scale(.985)}
.pv-motion-ready [data-pv-reveal][data-pv-motion-kind="panel"]{transform:translate3d(0,18px,0) scale(.992)}
.pv-motion-ready [data-pv-reveal].is-visible{will-change:auto}
.pv-home .pv-hero:before{will-change:transform}
.pv-home .pv-motion-ribbon-track{will-change:transform}
.pv-home .home-category,.pv-home .pv-manifesto-copy .pv-manifesto-points div{transition-property:transform,background-color,color}
.pv-scroll-progress{transition:none!important}

/* Portfolio image curtain: a single transform-only wipe, never an opacity/layout hide. */
.pv-motion-ready .showcase-work[data-pv-reveal] .showcase-work-image:after{content:"";position:absolute;inset:0;z-index:1;background:var(--surface-raised);transform:scaleX(1);transform-origin:right;transition:transform .72s var(--pv-motion-ease);transition-delay:var(--pv-reveal-delay,0ms);pointer-events:none}
.showcase-work-index,.showcase-work-featured{z-index:2}
.pv-motion-ready .showcase-work[data-pv-reveal].is-visible .showcase-work-image:after{transform:scaleX(0);transition-delay:calc(var(--pv-reveal-delay,0ms) + 70ms)}
.pv-motion-ready .showcase-work[data-pv-reveal].is-visible:hover{transform:translate3d(0,-3px,0)}

html[data-pv-motion="off"] .pv-home-motion .pv-hero-word{opacity:1!important;transform:none!important;filter:none!important;animation:none!important}
html[data-pv-motion="off"] .pv-home-motion .pv-overline,
html[data-pv-motion="off"] .pv-home-motion .pv-hero-lede,
html[data-pv-motion="off"] .pv-home-motion .pv-hero-actions,
html[data-pv-motion="off"] .pv-home-motion .pv-hero-foot,
html[data-pv-motion="off"] .pv-home-motion .pv-index{opacity:1!important;transform:none!important;filter:none!important;animation:none!important}
html[data-pv-motion="off"] .pv-home-motion .pv-project-grid[data-pv-story] .home-project-image{clip-path:none!important;transition:none!important}
html[data-pv-motion="off"] .pv-home .pv-motion-ribbon-track{animation:none!important;transform:none!important}
html[data-pv-motion="off"] .showcase-work-image:after{display:none!important}
html[data-pv-motion="off"] .pv-home .carousel-slide.is-active .carousel-art img,
html[data-pv-motion="off"] .pv-home .carousel-slide.is-active .carousel-copy>*{animation:none!important}
html[data-pv-motion="off"] .site-nav{animation:none!important;opacity:1!important;transform:none!important}
html[data-pv-motion="off"] .pv-magnetic{translate:none!important}
html[data-pv-motion="off"] .btn:hover,
html[data-pv-motion="off"] .pv-button:hover,
html[data-pv-motion="off"] .nav-cta:hover,
html[data-pv-motion="off"] .category-tile:hover .category-tile-art>span,
html[data-pv-motion="off"] .pv-home .home-category:hover,
html[data-pv-motion="off"] .pv-home .home-category:hover>b,
html[data-pv-motion="off"] .pv-home .home-project:hover .home-project-image img,
html[data-pv-motion="off"] .showcase-work:hover .showcase-work-image img,
html[data-pv-motion="off"] .pv-project-list-card:hover .pv-project-list-icon,
html[data-pv-motion="off"] .pv-button:hover span:last-child,
html[data-pv-motion="off"] .nav-cta:hover span:last-child,
html[data-pv-motion="off"] .footer-cta-actions a:hover span:last-child{transform:none!important}

html[data-pv-motion="off"] ::view-transition-old(root),
html[data-pv-motion="off"] ::view-transition-new(root),
html[data-pv-motion="off"] ::view-transition-old(pv-site-nav),
html[data-pv-motion="off"] ::view-transition-new(pv-site-nav){animation:none!important}
@keyframes pv-ambient-drift{0%{transform:translate3d(0,0,0) rotate(-3deg)}100%{transform:translate3d(-16px,12px,0) rotate(4deg)}}
@media(prefers-reduced-motion:no-preference){
 body:after{animation:pv-ambient-drift 42s ease-in-out infinite alternate}
}
@media(max-width:850px){
 .site-nav.is-scrolled{box-shadow:0 10px 26px rgba(0,0,0,.12)}
 .nav-primary>a:after{left:13px;right:auto;width:28px;bottom:7px}
}
@media(max-width:600px){
 .pv-motion-ready [data-pv-reveal][data-pv-motion-kind="media"],
 .pv-motion-ready [data-pv-reveal][data-pv-motion-kind="panel"]{transform:translate3d(0,14px,0)}
 .pv-home .pv-motion-ribbon-track{animation-duration:44s}
}
@media(prefers-reduced-motion:reduce){
 .pv-motion-ready .site-nav,.site-nav{animation:none!important;transition:none!important;transform:none!important;opacity:1!important}
 ::view-transition-old(root),::view-transition-new(root),::view-transition-old(pv-site-nav),::view-transition-new(pv-site-nav){animation:none!important}
 body:after{animation:none!important}
 .showcase-work-image:after{display:none!important}
 .nav-primary>a:after,.nav-more>summary span,.nav-toggle-icon{transition:none!important}
 .showcase-work-image img,.category-tile .category-tile-art>span,.pv-project-list-card .pv-project-list-icon,.pv-magnetic{transition:none!important;transform:none!important;translate:none!important}
 .btn:hover,.pv-button:hover,.nav-cta:hover,.footer-cta-actions a:hover,
 .pv-button:hover span:last-child,.nav-cta:hover span:last-child,.footer-cta-actions a:hover span:last-child,
 .category-tile:hover .category-tile-art>span,.pv-home .home-category:hover,
 .pv-home .home-project:hover .home-project-image img,.showcase-work:hover .showcase-work-image img,
 .pv-project-list-card:hover .pv-project-list-icon{transform:none!important}
}



/* v5.69.0 — immersive motion choreography, media depth and discovery UX */
:root{--pv-motion-ease:cubic-bezier(.18,.78,.22,1);--pv-motion-fast:190ms;--pv-motion-medium:420ms;--pv-motion-long:820ms}
/* Section entrances use opacity/transform only; content remains readable when motion is disabled. */
.pv-motion-ready [data-pv-reveal][data-pv-motion-kind="heading"]{transform:translate3d(0,26px,0);transition-duration:.78s}
.pv-motion-ready [data-pv-reveal][data-pv-motion-kind="media"]{transform:translate3d(0,28px,0) scale(.975);transition-duration:.86s}
.pv-motion-ready [data-pv-reveal][data-pv-motion-kind="card"]{transform:translate3d(0,24px,0) scale(.982);transition-duration:.76s}
.pv-motion-ready [data-pv-reveal][data-pv-motion-kind="panel"]{transform:translate3d(0,22px,0) scale(.988);transition-duration:.82s}
.pv-motion-ready [data-pv-reveal][data-pv-motion-kind="content"]{transform:translate3d(0,18px,0);transition-duration:.7s}
.pv-motion-ready [data-pv-reveal].is-visible{opacity:1;transform:translate3d(0,0,0) scale(1)}
.pv-motion-ready .category-index-heading h2,.pv-motion-ready .showcase-section-heading h2,.pv-motion-ready .shortlist-toolbar h2{transition:letter-spacing .72s var(--pv-motion-ease),color .3s ease}
.pv-motion-ready .category-index-heading[data-pv-reveal].is-visible h2,.pv-motion-ready .showcase-section-heading[data-pv-reveal].is-visible h2,.pv-motion-ready .shortlist-toolbar[data-pv-reveal].is-visible h2{letter-spacing:-.055em}
.pv-motion-ready .category-intro-note,.pv-motion-ready .showcase-facts,.pv-motion-ready .showcase-jumpnav{transition-delay:var(--pv-reveal-delay,0ms)}
/* Fine-pointer image depth: the media frame tilts, not the card or its text. */
.pv-depth-frame,.showcase-work-image,.home-project-image,.category-tile-art,.category-recent-image,.case-related-image,.case-gallery-item,.case-cover,.designer-portrait{transform-style:preserve-3d;backface-visibility:hidden}
.pv-depth-active{transform:perspective(1050px) rotateX(var(--pv-tilt-x,0deg)) rotateY(var(--pv-tilt-y,0deg));transition:transform .42s var(--pv-motion-ease),box-shadow .42s ease;will-change:transform;box-shadow:0 22px 48px rgba(0,0,0,.17)}
.pv-depth-active img{transform-origin:center;transition:transform .62s var(--pv-motion-ease)}

[data-theme="light"] .pv-depth-active{box-shadow:0 20px 42px rgba(35,50,38,.13)}
/* Stronger, clearer interactive feedback without shifting layout. */
.btn:active,.pv-button:active,.nav-cta:active,.theme-toggle:active,.nav-toggle:active,.favorite-btn:active,[data-shortlist]:active{transform:translate3d(0,1px,0) scale(.975)}
:where(a,button,input,select,textarea,[tabindex]):focus-visible{outline:2px solid var(--pv-focus,var(--accent-strong));outline-offset:3px;scroll-margin-top:120px}
.btn:focus-visible,.pv-button:focus-visible,.nav-cta:focus-visible{box-shadow:0 0 0 4px color-mix(in srgb,var(--accent) 22%,transparent)}
input,select,textarea{transition:border-color .22s ease,box-shadow .22s ease,background-color .22s ease}
input:focus,select:focus,textarea:focus{box-shadow:0 0 0 4px color-mix(in srgb,var(--accent) 15%,transparent)}
.pv-toast-region{transition:opacity .28s ease,transform .38s var(--pv-motion-ease)}
.pv-toast-region.is-visible{animation:pv-toast-enter .38s var(--pv-motion-ease) both}
@keyframes pv-toast-enter{from{opacity:0;transform:translate3d(0,14px,0) scale(.97)}to{opacity:1;transform:translate3d(0,0,0) scale(1)}}
/* Native dialog gets a short scale/fade entrance; browser handles focus and modal semantics. */
.pv-command-dialog[open]{animation:pv-dialog-enter .34s var(--pv-motion-ease) both}
@keyframes pv-dialog-enter{from{opacity:0;transform:translate3d(0,14px,0) scale(.975)}to{opacity:1;transform:translate3d(0,0,0) scale(1)}}
.pv-command-dialog::backdrop{background:rgba(8,12,9,.54);backdrop-filter:blur(5px)}
.pv-faq-list details[open] p{animation:pv-faq-enter .42s var(--pv-motion-ease) both}
@keyframes pv-faq-enter{from{opacity:0;transform:translate3d(0,8px,0)}to{opacity:1;transform:translate3d(0,0,0)}}
/* Mobile discovery: keep keyword search visible and place advanced filters in a compact disclosure. */
.pv-discovery-filters{grid-template-columns:minmax(0,1fr);align-items:stretch}
.pv-discovery-filters .pv-filter-keyword{grid-column:1/-1}
.pv-filter-toggle{display:none;align-items:center;justify-content:space-between;gap:12px;width:100%;min-height:48px;padding:11px 14px;border:1px solid var(--line);border-radius:12px;background:var(--surface-raised);color:var(--text);font:inherit;font-weight:750;text-align:left;cursor:pointer}
.pv-filter-count{display:inline-grid;place-items:center;min-width:23px;height:23px;padding:0 6px;border-radius:99px;background:var(--accent);color:var(--accent-ink);font-size:11px;font-weight:900}
.pv-filter-count[hidden]{display:none}
.pv-filter-chevron{margin-left:auto;font-size:18px;transition:transform .28s var(--pv-motion-ease)}
.pv-filter-toggle[aria-expanded="true"] .pv-filter-chevron{transform:rotate(180deg)}
.pv-filter-panel{grid-column:1/-1;display:grid;grid-template-rows:1fr;min-height:0}
.pv-filter-panel-inner{min-height:0;overflow:visible}
.pv-filter-fields{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;align-items:end}
.pv-filter-fields label{min-width:0}
.pv-filter-fields input,.pv-filter-fields select{width:100%;min-width:0}
.pv-filter-actions{margin-top:14px}
.pv-filter-actions .btn{min-height:46px}
.pv-discovery-filters[data-pv-submitting] .pv-filter-actions button[type="submit"]{position:relative;pointer-events:none}
.pv-discovery-filters[data-pv-submitting] .pv-filter-actions button[type="submit"]:after{content:"";width:13px;height:13px;margin-left:8px;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;animation:pv-submit-spin .7s linear infinite}
@keyframes pv-submit-spin{to{transform:rotate(360deg)}}
@media(max-width:850px){.pv-filter-fields{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:760px){
 .pv-discovery-filters{grid-template-columns:minmax(0,1fr);gap:10px}
 .pv-motion-ready .pv-filter-toggle{display:flex}
 .pv-motion-ready .pv-filter-panel{grid-template-rows:0fr;opacity:0;transition:grid-template-rows .42s var(--pv-motion-ease),opacity .28s ease}
 .pv-motion-ready .pv-filter-panel.is-expanded{grid-template-rows:1fr;opacity:1}
 .pv-motion-ready .pv-filter-panel-inner{overflow:hidden}
 .pv-filter-fields{grid-template-columns:1fr 1fr;gap:10px}
 .pv-filter-fields label{font-size:12px}
 .pv-filter-actions{display:grid;grid-template-columns:1.3fr 1fr}
 .pv-filter-actions .btn{width:100%;padding-inline:10px}
}
@media(max-width:360px){.pv-filter-fields{grid-template-columns:1fr}.pv-filter-actions{grid-template-columns:1fr 1fr}}
@media(prefers-reduced-motion:reduce){
 .pv-depth-active,.pv-depth-active img{transform:none!important;transition:none!important;box-shadow:none!important}
 .pv-toast-region.is-visible,.pv-command-dialog[open],.pv-faq-list details[open] p{animation:none!important}
 .pv-filter-chevron,.pv-filter-panel,.pv-filter-toggle,input,select,textarea{transition:none!important}
 .pv-discovery-filters[data-pv-submitting] .pv-filter-actions button[type="submit"]:after{animation:none!important}
}
html[data-pv-motion="off"] .pv-depth-active,html[data-pv-motion="off"] .pv-depth-active img{transform:none!important;transition:none!important;box-shadow:none!important}
html[data-pv-motion="off"] .pv-command-dialog[open],html[data-pv-motion="off"] .pv-toast-region.is-visible,html[data-pv-motion="off"] .pv-faq-list details[open] p{animation:none!important}
html[data-pv-motion="off"] .pv-filter-chevron,html[data-pv-motion="off"] .pv-filter-panel,html[data-pv-motion="off"] input,html[data-pv-motion="off"] select,html[data-pv-motion="off"] textarea{transition:none!important}


/* v5.70.0 — editorial case-study navigation, curated moodboards and studio onboarding */
.pv-collection-builder{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(260px,.65fr);gap:18px;align-items:start;margin:8px 0 36px}
.pv-collection-create{margin:0;padding:clamp(20px,3vw,34px);border-radius:18px;background:linear-gradient(145deg,var(--surface-raised),var(--surface));border-color:var(--line)}
.pv-collection-create-head{max-width:620px;margin-bottom:22px}
.pv-collection-create-head h2{font-size:clamp(28px,4vw,42px);letter-spacing:-.06em;line-height:1.04;margin:10px 0}
.pv-collection-create-head p{max-width:540px;line-height:1.75}
.pv-collection-create form{display:grid;gap:5px}
.pv-collection-create .pv-field-help{display:block;margin:-1px 0 10px;color:var(--muted);font-size:10px;line-height:1.5}
.pv-collection-create label{font-size:12px;color:var(--text)}
.pv-collection-create input:not([type=checkbox]),.pv-collection-create textarea{width:100%;min-height:48px;background:var(--surface-raised);color:var(--text);border:1px solid var(--line);border-radius:10px;padding:12px}
.pv-collection-create textarea{min-height:112px;resize:vertical}
.pv-collection-create .btn{color:var(--accent-ink)!important;background:linear-gradient(135deg,var(--accent-strong),var(--accent))!important;border:1px solid color-mix(in srgb,var(--accent-strong) 65%,var(--line))!important}
.pv-collection-public-toggle{display:flex;align-items:center;gap:9px;margin:8px 0;color:var(--text);font-size:12px}
.pv-collection-public-toggle input{width:17px;height:17px;accent-color:var(--accent)}
.pv-collection-builder-aside{display:grid;gap:14px}
.pv-collection-live-preview,.pv-collection-steps{padding:20px;border:1px solid var(--line);border-radius:16px;background:var(--surface)}
.pv-collection-live-preview{position:relative;overflow:hidden;min-height:245px;background:radial-gradient(ellipse at 90% 0%,color-mix(in srgb,var(--accent) 22%,transparent),transparent 55%),var(--surface)}
.pv-preview-art{height:88px;display:flex;gap:7px;align-items:end;margin:18px 0 14px;overflow:hidden}
.pv-preview-art i{display:block;flex:1;border-radius:7px;background:linear-gradient(145deg,color-mix(in srgb,var(--accent) 75%,var(--surface)),color-mix(in srgb,var(--gold) 58%,var(--surface)));height:72%;transform:skewY(-8deg)}
.pv-preview-art i:nth-child(2){height:100%;background:linear-gradient(145deg,color-mix(in srgb,var(--gold) 70%,var(--surface)),color-mix(in srgb,var(--accent) 45%,var(--surface)))}
.pv-preview-art i:nth-child(3){height:54%;background:linear-gradient(145deg,color-mix(in srgb,var(--surface-raised) 85%,var(--accent)),color-mix(in srgb,var(--accent) 55%,var(--surface)))}
.pv-collection-live-preview h3{font-size:22px;letter-spacing:-.045em;margin:0 0 5px;overflow-wrap:anywhere}
.pv-collection-live-preview p{font-size:11px;line-height:1.6;color:var(--muted);min-height:34px;margin:0}
.pv-collection-live-preview>div:last-child{display:flex;gap:18px;margin-top:17px;padding-top:12px;border-top:1px solid var(--line)}
.pv-collection-live-preview>div:last-child span{font-size:8px;letter-spacing:.1em;color:var(--muted)}
.pv-collection-live-preview>div:last-child b{color:var(--text);font-size:13px}
.pv-collection-steps ol{list-style:none;padding:0;margin:14px 0 0;display:grid;gap:13px}
.pv-collection-steps li{display:grid;grid-template-columns:30px minmax(0,1fr);gap:10px;align-items:start}
.pv-collection-steps li>b,.pv-collection-steps li>span:first-child{font-size:10px;color:var(--accent-strong);font-weight:900}
.pv-collection-steps li span{display:grid;gap:2px}
.pv-collection-steps li strong{font-size:11px;color:var(--text)}
.pv-collection-steps li small{font-size:10px;color:var(--muted);line-height:1.5}
.pv-collection-page{max-width:1240px;margin:0 auto}
.pv-collection-cover{position:relative;min-height:clamp(300px,42vw,560px);overflow:hidden;display:flex;align-items:end;padding:clamp(24px,5vw,64px);border-radius:20px;border:1px solid var(--line);background:linear-gradient(135deg,var(--surface-raised),var(--surface));isolation:isolate}
.pv-collection-cover>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:-2;filter:saturate(.78);transform:scale(1.015)}
.pv-collection-cover-shade{position:absolute;inset:0;z-index:-1;background:linear-gradient(90deg,rgba(9,15,11,.82),rgba(9,15,11,.42) 56%,rgba(9,15,11,.1)),linear-gradient(0deg,rgba(9,15,11,.58),transparent 60%)}
.pv-collection-cover-copy{max-width:760px;color:#fff}
.pv-collection-cover-copy h2{color:#fff!important}
.pv-collection-cover-copy p{color:rgba(255,255,255,.88)!important}
.pv-collection-cover-copy>span{color:#e0e8d4!important}
.pv-collection-cover-copy>span,.pv-collection-cover-empty>div>span{font-size:9px;font-weight:900;letter-spacing:.18em;color:#d4dfc5}
.pv-collection-cover-copy h2,.pv-collection-cover-empty h2{font-size:clamp(38px,7vw,88px);line-height:.94;letter-spacing:-.075em;margin:14px 0}
.pv-collection-cover-copy p,.pv-collection-cover-empty p{max-width:600px;color:rgba(255,255,255,.82);font-size:clamp(13px,1.5vw,17px);line-height:1.65;margin:0}
.pv-collection-cover-index{position:absolute;right:22px;top:22px;color:#fff;font-size:9px;letter-spacing:.16em;font-weight:900}
.pv-collection-cover-empty{background:radial-gradient(ellipse at 78% 18%,color-mix(in srgb,var(--accent) 28%,transparent),transparent 48%),repeating-linear-gradient(135deg,transparent 0 44px,color-mix(in srgb,var(--line) 45%,transparent) 45px 46px),var(--surface-raised)}
.pv-collection-cover-empty>div{max-width:760px;color:var(--text)}
.pv-collection-cover-empty h2{color:var(--text)}
.pv-collection-cover-empty p{color:var(--muted)}
.pv-collection-summary{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:20px 32px;align-items:end;padding:25px 0 28px;border-bottom:1px solid var(--line)}
.pv-collection-summary>div:first-child p{max-width:680px;color:var(--muted);font-size:13px;line-height:1.7;margin:8px 0}
.pv-collection-private{display:inline-flex;margin-top:8px;padding:6px 9px;border:1px solid var(--line);border-radius:99px;font-size:8px;letter-spacing:.12em;color:var(--muted);font-weight:850}
.pv-collection-stats{display:flex;gap:clamp(16px,3vw,36px)}
.pv-collection-stats div{display:grid;gap:2px}
.pv-collection-stats strong{font-size:clamp(20px,3vw,30px);letter-spacing:-.06em;color:var(--text)}
.pv-collection-stats small{font-size:8px;letter-spacing:.12em;color:var(--muted);font-weight:850}
.pv-collection-share{grid-column:1/-1;display:flex;align-items:center;gap:12px;min-height:38px}
.pv-collection-share [role=status],.pv-collection-private-note{font-size:10px;color:var(--muted)}
.pv-collection-section{margin:64px 0}
.pv-collection-section-heading{display:flex;justify-content:space-between;align-items:end;gap:20px;margin-bottom:24px}
.pv-collection-section-heading h2{font-size:clamp(30px,4.5vw,52px);letter-spacing:-.065em;line-height:1;margin:10px 0 0}
.pv-collection-section-heading>span{font-size:8px;letter-spacing:.14em;color:var(--muted);font-weight:900}
.pv-collection-people{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.pv-collection-designer{display:flex;align-items:center;gap:13px;min-width:0;padding:15px;border:1px solid var(--line);border-radius:12px;background:var(--surface)}
.pv-collection-avatar{width:48px;height:48px;flex:0 0 48px;border-radius:50%;overflow:hidden;background:var(--bg-soft);display:grid;place-items:center;color:var(--accent-strong);font-weight:900}
.pv-collection-avatar img{width:100%;height:100%;object-fit:cover}
.pv-collection-designer>div:last-child{min-width:0}
.pv-collection-designer strong{font-size:13px;color:var(--text)}
.pv-collection-designer p{font-size:10px;color:var(--muted);margin:3px 0 4px;overflow-wrap:anywhere}
.pv-collection-designer a{font-size:10px;font-weight:800;color:var(--accent-strong)}
.pv-collection-work-grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:28px 16px}
.pv-collection-work{grid-column:span 5;display:block;min-width:0;color:var(--text);text-decoration:none}
.pv-collection-work:nth-child(4n+1),.pv-collection-work:nth-child(4n+4){grid-column:span 7}
.pv-collection-work-image{position:relative;aspect-ratio:5/4;overflow:hidden;border-radius:13px;background:var(--bg-soft)}
.pv-collection-work:nth-child(4n+1) .pv-collection-work-image{aspect-ratio:16/10}
.pv-collection-work:nth-child(4n+2) .pv-collection-work-image{aspect-ratio:4/5}
.pv-collection-work-image img{width:100%;height:100%;display:block;object-fit:cover;transition:transform .8s var(--pv-motion-ease),filter .8s ease}
.pv-collection-work-image>span{position:absolute;left:13px;top:13px;padding:6px 8px;border-radius:5px;background:rgba(12,17,13,.72);color:white;font-size:9px;letter-spacing:.12em}
.pv-collection-work:hover .pv-collection-work-image img{transform:scale(1.045);filter:saturate(1.08)}
.pv-collection-work-caption{display:flex;justify-content:space-between;gap:14px;align-items:start;padding:13px 2px}
.pv-collection-work-caption div{display:grid;gap:3px}
.pv-collection-work-caption strong{font-size:15px;letter-spacing:-.025em}
.pv-collection-work-caption small{font-size:9px;letter-spacing:.12em;color:var(--muted);text-transform:uppercase}
.pv-collection-work-caption>b{font-size:18px;transition:transform .25s ease}
.pv-collection-work:hover .pv-collection-work-caption>b{transform:translate(3px,-3px)}
.pv-collection-empty{grid-column:1/-1;padding:34px;border:1px dashed var(--line);border-radius:14px;background:var(--surface)}
.pv-collection-empty h3{margin:0 0 6px;color:var(--text)}
.pv-collection-empty p{margin:0;color:var(--muted)}
.pv-collection-editor{padding:clamp(18px,3vw,30px);border-radius:16px}
.pv-collection-editor-heading h2{font-size:clamp(25px,4vw,36px);letter-spacing:-.06em;margin:8px 0}
.pv-collection-editor>form{display:grid;gap:6px}
.pv-collection-editor label{font-size:11px;color:var(--text)}
.pv-collection-editor input:not([type=checkbox]),.pv-collection-editor textarea{width:100%;background:var(--surface-raised);color:var(--text);border:1px solid var(--line);border-radius:9px}
.pv-board-order-hint{font-size:10px;color:var(--muted);margin:0 0 8px}
.pv-board-order-editor{display:none;padding:14px;border:1px solid var(--line);border-radius:12px;background:var(--bg-soft)}
.pv-board-order-heading{display:flex;justify-content:space-between;gap:12px;align-items:start;margin-bottom:10px}
.pv-board-order-heading div{display:grid;gap:3px}
.pv-board-order-heading strong{font-size:12px;color:var(--text)}
.pv-board-order-heading small,.pv-board-order-heading>span{font-size:9px;color:var(--muted)}
.pv-motion-ready .pv-board-order-editor{display:block}
.pv-board-order-list{display:grid;gap:7px}
.pv-board-order-item{display:grid;grid-template-columns:18px 25px minmax(0,1fr) auto;gap:9px;align-items:center;padding:9px;border:1px solid var(--line);border-radius:9px;background:var(--surface);cursor:grab;transition:border-color .2s ease,transform .2s ease,opacity .2s ease}
.pv-board-order-item:active{cursor:grabbing}
.pv-board-order-item.is-dragging{opacity:.42;transform:scale(.985);border-style:dashed}
.pv-board-drag-handle{font-size:17px;color:var(--muted);line-height:1}
.pv-board-order-index{font-size:9px;font-weight:900;color:var(--accent-strong)}
.pv-board-order-copy{display:grid;min-width:0;gap:2px}
.pv-board-order-copy strong{font-size:10px;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pv-board-order-copy small{font-size:8px;color:var(--muted)}
.pv-board-order-actions{display:flex;gap:4px}
.pv-board-order-actions button{width:34px;height:34px;border:1px solid var(--line);border-radius:7px;background:var(--bg-soft);color:var(--text);font:inherit;font-weight:900;cursor:pointer}
.pv-board-order-actions button:disabled{opacity:.35;cursor:not-allowed}
.pv-board-order-actions [data-pv-order-remove]{color:var(--danger);font-size:15px}
.pv-board-order-status{min-height:14px;margin:8px 0 0;font-size:9px;color:var(--accent-strong)}
.pv-collection-backlink{margin:30px 0;color:var(--muted)}
.pv-case-chapters{position:sticky;top:88px;z-index:12;display:flex;align-items:center;gap:18px;max-width:100%;margin:4px 0 28px;padding:10px 13px;border:1px solid var(--line);border-radius:12px;background:color-mix(in srgb,var(--surface) 92%,transparent);backdrop-filter:blur(16px) saturate(130%);box-shadow:0 8px 26px rgba(0,0,0,.06)}
.pv-case-chapters-label{flex:0 0 auto;font-size:8px;letter-spacing:.15em;color:var(--muted);font-weight:900}
.pv-case-chapters>div{display:flex;gap:5px;min-width:0;overflow-x:auto;scrollbar-width:none}
.pv-case-chapters>div::-webkit-scrollbar{display:none}
.pv-case-chapters a{display:inline-flex;align-items:center;gap:6px;flex:0 0 auto;padding:8px 10px;border-radius:8px;color:var(--muted);font-size:9px;font-weight:800;white-space:nowrap;transition:background .2s ease,color .2s ease}
.pv-case-chapters a:hover,.pv-case-chapters a.is-active{background:var(--bg-soft);color:var(--text)}
.pv-case-chapters a[aria-current="location"]{background:var(--accent);color:var(--accent-ink)}
.pv-case-chapters a>span{font-size:10px}
.case-study [id]{scroll-margin-top:156px}
.pv-studio-setup{margin:0 0 24px;padding:clamp(17px,2.5vw,25px);border:1px solid var(--line);border-radius:15px;background:radial-gradient(ellipse at 100% 0%,color-mix(in srgb,var(--accent) 13%,transparent),transparent 48%),var(--surface)}
.pv-studio-setup-head{display:flex;justify-content:space-between;align-items:start;gap:18px}
.pv-studio-setup-head h2{font-size:clamp(20px,3vw,29px);letter-spacing:-.055em;margin:7px 0 5px;color:var(--text)}
.pv-studio-setup-head p{max-width:660px;font-size:11px;color:var(--muted);line-height:1.65;margin:0}
.pv-studio-setup-score{display:grid;gap:2px;text-align:right;flex:0 0 auto}
.pv-studio-setup-score strong{font-size:clamp(27px,4vw,40px);line-height:1;letter-spacing:-.06em;color:var(--accent-strong)}
.pv-studio-setup-score small{font-size:8px;letter-spacing:.12em;color:var(--muted);font-weight:900}
.pv-studio-setup-track{height:6px;margin:17px 0 14px;overflow:hidden;border-radius:99px;background:var(--bg-soft)}
.pv-studio-setup-track span{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,var(--accent),var(--gold));transition:width .7s var(--pv-motion-ease)}
.pv-studio-setup-list{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}
.pv-studio-setup-task{display:grid;grid-template-columns:25px minmax(0,1fr);gap:8px;align-items:start;min-width:0;padding:10px;border:1px solid var(--line);border-radius:9px;background:var(--surface-raised);color:var(--text);text-decoration:none;transition:transform .22s ease,border-color .22s ease,background .22s ease}
.pv-studio-setup-task:hover{transform:translateY(-2px);border-color:var(--accent)}
.pv-studio-setup-check{display:grid;place-items:center;width:24px;height:24px;border:1px solid var(--line);border-radius:50%;font-size:9px;font-weight:900;color:var(--muted)}
.pv-studio-setup-task.is-complete .pv-studio-setup-check{background:var(--accent);border-color:var(--accent);color:var(--accent-ink)}
.pv-studio-setup-task>span:nth-child(2){display:grid;gap:3px;min-width:0}
.pv-studio-setup-task strong{font-size:9px;line-height:1.35;color:var(--text)}
.pv-studio-setup-task small{font-size:8px;line-height:1.45;color:var(--muted)}
.pv-studio-setup-task>b{display:none}
[data-theme="light"] .pv-collection-cover-shade{background:linear-gradient(90deg,rgba(9,15,11,.78),rgba(9,15,11,.38) 56%,rgba(9,15,11,.08)),linear-gradient(0deg,rgba(9,15,11,.5),transparent 60%)}
@media(max-width:1000px){.pv-studio-setup-list{grid-template-columns:repeat(3,minmax(0,1fr))}.pv-collection-builder{grid-template-columns:1fr}.pv-collection-builder-aside{grid-template-columns:1fr 1fr}}
@media(max-width:760px){.pv-case-chapters{top:76px;gap:8px;padding:8px 9px;margin-bottom:20px}.pv-case-chapters-label{font-size:7px}.pv-case-chapters a{padding:8px;font-size:8px}.case-study [id]{scroll-margin-top:132px}.pv-collection-cover{min-height:330px;border-radius:14px}.pv-collection-summary{grid-template-columns:1fr;gap:15px}.pv-collection-stats{justify-content:space-between}.pv-collection-people{grid-template-columns:1fr}.pv-collection-section{margin:46px 0}.pv-collection-work-grid{grid-template-columns:1fr 1fr;gap:20px 10px}.pv-collection-work,.pv-collection-work:nth-child(4n+1),.pv-collection-work:nth-child(4n+2),.pv-collection-work:nth-child(4n+4){grid-column:auto}.pv-collection-work-image,.pv-collection-work:nth-child(4n+1) .pv-collection-work-image,.pv-collection-work:nth-child(4n+2) .pv-collection-work-image{aspect-ratio:4/5}.pv-collection-work-caption strong{font-size:12px}.pv-collection-builder-aside{grid-template-columns:1fr}.pv-studio-setup-list{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:420px){.pv-collection-work-grid{grid-template-columns:1fr}.pv-collection-work-image,.pv-collection-work:nth-child(4n+1) .pv-collection-work-image,.pv-collection-work:nth-child(4n+2) .pv-collection-work-image{aspect-ratio:1.28}.pv-studio-setup-head{display:block}.pv-studio-setup-score{text-align:left;display:flex;align-items:baseline;gap:8px;margin-top:12px}.pv-studio-setup-list{grid-template-columns:1fr}.pv-case-chapters{top:70px}.pv-case-chapters-label{display:none}}
@media(prefers-reduced-motion:reduce){.pv-collection-work-image img,.pv-collection-work-caption>b,.pv-studio-setup-track span,.pv-studio-setup-task,.pv-board-order-item,.pv-case-chapters a{transition:none!important}.pv-collection-work:hover .pv-collection-work-image img,.pv-collection-work:hover .pv-collection-work-caption>b,.pv-studio-setup-task:hover{transform:none!important}}
html[data-pv-motion="off"] .pv-collection-work-image img,html[data-pv-motion="off"] .pv-collection-work-caption>b,html[data-pv-motion="off"] .pv-studio-setup-track span,html[data-pv-motion="off"] .pv-studio-setup-task,html[data-pv-motion="off"] .pv-board-order-item,html[data-pv-motion="off"] .pv-case-chapters a{transition:none!important}
html[data-pv-motion="off"] .pv-collection-work:hover .pv-collection-work-image img,html[data-pv-motion="off"] .pv-collection-work:hover .pv-collection-work-caption>b,html[data-pv-motion="off"] .pv-studio-setup-task:hover{transform:none!important}
[data-theme="light"] #main-content .pv-collection-create .btn{color:#fff!important;background:linear-gradient(135deg,#344B36,#536B4C)!important;border-color:#344B36!important;transition:transform .22s ease,box-shadow .22s ease!important}
[data-theme="dark"] #main-content .pv-collection-create .btn{color:#202820!important;background:linear-gradient(135deg,#C5CFB8,#AAB69A)!important;border-color:#AAB69A!important;transition:transform .22s ease,box-shadow .22s ease!important}
/* v5.71.0 — immersive portfolio exploration and workspace controls */
.designer-card>div:first-child{min-height:30px;padding-right:100px}
.pv-quick-preview-trigger{position:absolute;top:16px;right:16px;z-index:2;display:inline-flex;align-items:center;gap:7px;min-height:34px;padding:7px 11px;border:1px solid var(--line);border-radius:999px;background:color-mix(in srgb,var(--surface-raised) 92%,transparent);color:var(--text);font:inherit;font-size:10px;font-weight:850;cursor:pointer;backdrop-filter:blur(12px);transition:transform .25s var(--pv-motion-ease),background .25s ease,border-color .25s ease}
.pv-quick-preview-trigger:hover{transform:translateY(-2px);border-color:var(--accent-strong);background:var(--surface-raised)}
.pv-quick-view-dialog{width:min(560px,calc(100vw - 28px));max-width:none;max-height:min(86vh,760px);margin:auto;padding:clamp(20px,4vw,34px);border:1px solid var(--line);border-radius:18px;background:var(--surface);color:var(--text);box-shadow:0 34px 110px rgba(0,0,0,.36);overflow:auto}
.pv-quick-view-dialog::backdrop{background:rgba(5,9,6,.68);backdrop-filter:blur(8px)}
.pv-quick-view-dialog[open]{animation:pv-quick-view-enter .36s var(--pv-motion-ease) both}
@keyframes pv-quick-view-enter{from{opacity:0;transform:translateY(18px) scale(.975)}to{opacity:1;transform:translateY(0) scale(1)}}
.pv-quick-view-head{display:grid;grid-template-columns:58px minmax(0,1fr) 38px;gap:14px;align-items:center}
.pv-quick-view-avatar{width:58px;height:58px;display:grid;place-items:center;overflow:hidden;border-radius:50%;background:var(--surface-raised);color:var(--accent-strong);font-weight:900;font-size:18px}
.pv-quick-view-avatar img{width:100%;height:100%;object-fit:cover}
.pv-quick-view-head h2{margin:5px 0 2px;font-size:clamp(24px,5vw,34px);line-height:1.05;letter-spacing:-.06em;overflow-wrap:anywhere}
.pv-quick-view-head p{margin:0;font-size:11px}
.pv-quick-view-close{width:38px;height:38px;border:1px solid var(--line);border-radius:50%;background:var(--surface-raised);color:var(--text);font-size:24px;cursor:pointer}
.pv-quick-view-bio{margin:24px 0;color:var(--muted);font-size:13px;line-height:1.8;white-space:pre-line}
.pv-quick-view-meta{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.pv-quick-view-meta>div{display:grid;gap:5px;padding:14px;border:1px solid var(--line);border-radius:10px;background:var(--surface-raised)}
.pv-quick-view-meta small{font-size:8px;letter-spacing:.14em;color:var(--muted);font-weight:900}
.pv-quick-view-meta strong{font-size:13px;color:var(--text);overflow-wrap:anywhere}
.pv-quick-view-skills{display:flex;flex-wrap:wrap;gap:7px;margin:17px 0 22px}
.pv-quick-view-skill{padding:6px 9px;border:1px solid var(--line);border-radius:99px;color:var(--text);font-size:10px;background:var(--surface-raised)}
.pv-quick-view-actions{display:flex;flex-wrap:wrap;gap:9px}
.pv-selected-work-section{margin:clamp(54px,8vw,104px) 0;padding:clamp(22px,4vw,42px);border:1px solid var(--line);border-radius:16px;background:linear-gradient(145deg,color-mix(in srgb,var(--accent) 7%,var(--surface)),var(--surface));overflow:hidden}
.pv-selected-work-heading{display:flex;align-items:end;justify-content:space-between;gap:24px;margin-bottom:28px}
.pv-selected-work-heading h2{margin:10px 0;font-size:clamp(34px,5.5vw,66px);line-height:.98;letter-spacing:-.075em}
.pv-selected-work-heading h2 em{font-family:Georgia,serif;font-weight:500;color:var(--accent-strong)}
.pv-selected-work-heading p{max-width:540px;font-size:12px;line-height:1.8}
.pv-selected-work-index{font-size:8px;letter-spacing:.16em;color:var(--muted);font-weight:900;white-space:nowrap;padding-bottom:8px}
.pv-selected-work-tools{display:flex;justify-content:space-between;align-items:center;gap:14px;margin-bottom:20px}
.pv-work-filter-chips{display:flex;flex-wrap:wrap;gap:7px}
.pv-work-filter-chip{min-height:34px;padding:7px 11px;border:1px solid var(--line);border-radius:99px;background:var(--surface-raised);color:var(--muted);font:inherit;font-size:10px;font-weight:800;cursor:pointer;transition:background .2s ease,color .2s ease,border-color .2s ease}
.pv-work-filter-chip[aria-pressed="true"]{background:var(--accent-strong);border-color:var(--accent-strong);color:var(--accent-ink)}
.pv-work-search-label{flex:0 1 230px;min-width:150px}
.pv-work-search-label input{width:100%;min-height:38px;padding:8px 12px;border:1px solid var(--line);border-radius:99px;background:var(--surface-raised);color:var(--text);font-size:11px}
.pv-selected-work-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px 13px}
.pv-selected-work-card{display:block;min-width:0;color:var(--text);text-decoration:none}
.pv-selected-work-image{position:relative;aspect-ratio:4/5;overflow:hidden;border-radius:9px;background:var(--surface-raised)}
.pv-selected-work-image img{display:block;width:100%;height:100%;object-fit:cover;transition:transform .8s var(--pv-motion-ease),filter .6s ease}
.pv-selected-work-image>span{position:absolute;left:10px;right:10px;bottom:10px;color:#fff;font-size:8px;letter-spacing:.12em;font-weight:900;text-shadow:0 2px 12px #000;background:linear-gradient(90deg,rgba(0,0,0,.42),transparent);padding:6px}
.pv-selected-work-card:hover .pv-selected-work-image img{transform:scale(1.045);filter:saturate(1.06)}
.pv-selected-work-copy{display:grid;gap:4px;padding:11px 2px}
.pv-selected-work-copy small{font-size:8px;letter-spacing:.13em;text-transform:uppercase;color:var(--accent-strong);font-weight:900}
.pv-selected-work-copy strong{font-size:13px;line-height:1.35;color:var(--text)}
.pv-selected-work-copy>span{font-size:10px;color:var(--muted)}
.pv-selected-work-card[hidden]{display:none!important}
.pv-work-filter-status{min-height:18px;margin:15px 0 0;color:var(--muted);font-size:10px}
.pv-analytics-switch{display:flex;flex-wrap:wrap;gap:6px;margin:-5px 0 8px}
.pv-analytics-switch button{min-height:30px;padding:6px 10px;border:1px solid var(--line);border-radius:99px;background:var(--surface-raised);color:var(--muted);font:inherit;font-size:9px;font-weight:850;cursor:pointer}
.pv-analytics-switch button[aria-pressed="true"]{background:var(--accent-strong);border-color:var(--accent-strong);color:var(--accent-ink)}
.pv-upload-dropzone{border:1px dashed var(--line)!important;background:var(--surface-raised)!important;transition:border-color .2s ease,background .2s ease}
.pv-upload-dropzone.is-dragover{border-color:var(--accent-strong)!important;background:color-mix(in srgb,var(--accent) 12%,var(--surface-raised))!important}
.pv-upload-dropzone>p:first-child{color:var(--text);font-size:12px;line-height:1.7}
.pv-upload-status{min-height:18px;margin:8px 0;color:var(--muted);font-size:10px}
.pv-upload-status.is-error{color:#b83e35}
.pv-upload-preview{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:10px;margin-top:12px}
.pv-upload-preview-card{position:relative;min-width:0;overflow:hidden;border:1px solid var(--line);border-radius:9px;background:var(--surface)}
.pv-upload-preview-card img{display:block;width:100%;height:108px;object-fit:cover;background:var(--surface-raised)}
.pv-upload-preview-card small{display:block;padding:7px 8px;font-size:9px;line-height:1.4;color:var(--muted);overflow-wrap:anywhere}
.pv-upload-remove{position:absolute;right:6px;top:6px;width:28px;height:28px;border:1px solid #fff8;border-radius:50%;background:#17231de8;color:#fff;font-size:18px;cursor:pointer}
.pir-lightbox[open]{display:grid;grid-template-rows:auto minmax(0,1fr) auto;gap:12px}
.pir-lightbox{padding:18px 22px 18px;width:min(96vw,1480px);height:min(94vh,1050px);border-radius:16px}
.pir-lightbox-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;color:#fff}
.pir-lightbox-toolbar small{font-size:9px;letter-spacing:.16em;color:#c9d2c8;font-weight:900}
.pir-lightbox-stage{display:grid;grid-template-columns:48px minmax(0,1fr) 48px;align-items:center;gap:12px;min-height:0}
.pir-lightbox-stage img{max-width:100%;max-height:100%;width:auto;height:auto;min-height:0;object-fit:contain;justify-self:center;border-radius:3px;box-shadow:0 20px 80px #0008}
.lightbox-nav{width:44px;height:44px;display:grid;place-items:center;border:1px solid #ffffff38;border-radius:50%;background:#ffffff12;color:#fff;font-size:22px;cursor:pointer;transition:background .2s ease,transform .2s ease}
.lightbox-nav:hover{background:#ffffff28;transform:scale(1.05)}
.lightbox-nav:disabled{opacity:.25;cursor:default;transform:none}
.pir-lightbox-footer{display:flex;justify-content:space-between;align-items:center;gap:12px;min-height:22px}
.pir-lightbox-footer .lightbox-caption{margin:0;text-align:left;color:#e2e8df;font-size:11px;line-height:1.4}
.pir-lightbox-footer .lightbox-hint{font-size:8px;color:#aeb9ad;letter-spacing:.08em;white-space:nowrap}
@media(max-width:900px){.pv-selected-work-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media(max-width:760px){.pv-selected-work-heading{display:block}.pv-selected-work-index{display:block;margin-top:16px}.pv-selected-work-tools{display:grid;grid-template-columns:1fr}.pv-work-search-label{width:100%;max-width:none}.pv-selected-work-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:16px 10px}.pv-quick-view-dialog{padding:20px}.pir-lightbox[open]{width:100vw;height:100dvh;max-height:100dvh;border-radius:0;padding:12px 10px 16px;gap:8px}.pir-lightbox-stage{grid-template-columns:38px minmax(0,1fr) 38px;gap:5px}.lightbox-nav{width:36px;height:36px;font-size:18px}.pir-lightbox-stage img{max-height:calc(100dvh - 150px)}.pir-lightbox-footer{display:block}.pir-lightbox-footer .lightbox-hint{display:block;margin-top:4px}}
@media(max-width:420px){.pv-selected-work-grid{grid-template-columns:1fr 1fr}.pv-selected-work-section{padding:18px 13px}.pv-selected-work-copy strong{font-size:11px}.pv-quick-view-meta{grid-template-columns:1fr}.pv-quick-view-head{grid-template-columns:48px minmax(0,1fr) 34px;gap:10px}.pv-quick-view-avatar{width:48px;height:48px}}
@media(prefers-reduced-motion:reduce){.pv-quick-view-dialog[open],.pv-selected-work-image img,.pv-quick-preview-trigger,.pv-work-filter-chip,.pv-upload-dropzone,.pir-lightbox *{animation:none!important;transition:none!important}.pv-selected-work-card:hover .pv-selected-work-image img{transform:none!important}}
html[data-pv-motion="off"] .pv-quick-view-dialog[open],html[data-pv-motion="off"] .pv-selected-work-image img,html[data-pv-motion="off"] .pv-quick-preview-trigger,html[data-pv-motion="off"] .pv-work-filter-chip,html[data-pv-motion="off"] .pv-upload-dropzone,html[data-pv-motion="off"] .pir-lightbox *{animation:none!important;transition:none!important}
html[data-pv-motion="off"] .pv-selected-work-card:hover .pv-selected-work-image img{transform:none!important}
[data-theme="light"] .pv-quick-view-dialog{background:#fff;color:#17231d}
[data-theme="light"] .pv-quick-view-meta>div,[data-theme="light"] .pv-quick-view-avatar,[data-theme="light"] .pv-work-filter-chip,[data-theme="light"] .pv-work-search-label input{background:#f2f5f1}
[data-theme="light"] .pv-quick-view-meta strong,[data-theme="light"] .pv-quick-view-head h2,[data-theme="light"] .pv-selected-work-copy strong{color:#17231d}
[data-theme="light"] .pv-quick-preview-trigger{background:rgba(255,255,255,.94);color:#17231d}


/* v5.72.0 — navigation restoration: closed disclosure panels must not cover controls. */
.site-nav{z-index:240}
.nav-more>summary{cursor:pointer}
.nav-more>summary:focus-visible{outline:2px solid var(--pv-focus);outline-offset:3px}
.nav-more:not([open])>.nav-more-menu{display:none!important}
.nav-more[open]>.nav-more-menu{display:grid}
.nav-more-menu{z-index:242}
.nav-links.open{z-index:241;pointer-events:auto}
@media(max-width:1180px){
  .site-nav{z-index:240}
  .nav-links:not(.open){display:none!important}
  .nav-links.open{display:flex!important;z-index:241;visibility:visible;pointer-events:auto}
  .nav-more:not([open])>.nav-more-menu{display:none!important}
  .nav-more[open]>.nav-more-menu{position:static;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));}
}
@media(max-width:600px){
  .nav-links.open{left:0;right:0;width:100%;max-width:100%;max-height:min(78dvh,calc(100dvh - 104px));overflow-x:hidden;overflow-y:auto;overscroll-behavior:contain;touch-action:pan-y}
  .nav-more[open]>.nav-more-menu{grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}
  .nav-links.open .nav-more-menu a{min-height:46px;padding:11px 12px}
  .nav-links.open .nav-actions .nav-action-button{min-height:50px}
}
/* v5.72.0 — restore the immersive motion language and add progressive page transitions */
@view-transition{navigation:auto}
#main-content{view-transition-name:pv-main-content}
::view-transition-old(root){animation:pv-root-exit .18s ease both}
::view-transition-new(root){animation:pv-root-enter .42s cubic-bezier(.2,.75,.25,1) both}
::view-transition-old(pv-main-content){animation:pv-content-exit .16s ease both}
::view-transition-new(pv-main-content){animation:pv-content-enter .46s cubic-bezier(.2,.75,.25,1) both}
@keyframes pv-root-exit{to{opacity:0}}
@keyframes pv-root-enter{from{opacity:0}to{opacity:1}}
@keyframes pv-content-exit{to{opacity:0;transform:translate3d(0,-5px,0)}}
@keyframes pv-content-enter{from{opacity:0;transform:translate3d(0,12px,0)}to{opacity:1;transform:translate3d(0,0,0)}}
.pv-case-chapters{position:relative;overflow:hidden;isolation:isolate}
.pv-case-chapters:after{content:"";position:absolute;left:0;bottom:0;width:var(--pv-chapter-progress,0%);height:2px;background:linear-gradient(90deg,var(--accent),var(--gold));box-shadow:0 0 12px color-mix(in srgb,var(--accent) 38%,transparent);transition:width .12s linear;pointer-events:none}
.pv-motion-ready .case-cover img{transform:translate3d(0,var(--pv-case-parallax,0px),0) scale(1.045);will-change:transform}
.pv-motion-ready .case-cover.is-visible img{animation:pv-case-image-enter .82s cubic-bezier(.2,.75,.25,1) both}
@keyframes pv-case-image-enter{from{opacity:.72;transform:translate3d(0,18px,0) scale(1.085)}to{opacity:1;transform:translate3d(0,var(--pv-case-parallax,0px),0) scale(1.045)}}
.pv-selected-work-card.pv-filter-enter{animation:pv-work-filter-enter .46s cubic-bezier(.2,.75,.25,1) both;animation-delay:var(--pv-filter-delay,0ms)}
@keyframes pv-work-filter-enter{from{opacity:0;transform:translate3d(0,14px,0) scale(.985)}to{opacity:1;transform:translate3d(0,0,0) scale(1)}}
.pir-lightbox img.is-changing{animation:pv-lightbox-image-enter .44s cubic-bezier(.2,.75,.25,1) both}
@keyframes pv-lightbox-image-enter{from{opacity:.35;transform:translate3d(0,10px,0) scale(.985)}to{opacity:1;transform:translate3d(0,0,0) scale(1)}}
.pv-depth-active.case-cover{box-shadow:0 30px 90px rgba(0,0,0,.16)}
.pv-depth-active.case-cover:after{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle at var(--pv-depth-x,50%) var(--pv-depth-y,50%),rgba(255,255,255,.12),transparent 42%);mix-blend-mode:screen}
html[data-pv-motion="off"]::view-transition-old(root),html[data-pv-motion="off"]::view-transition-new(root),html[data-pv-motion="off"]::view-transition-old(pv-main-content),html[data-pv-motion="off"]::view-transition-new(pv-main-content){animation:none!important}
html[data-pv-motion="off"] .case-cover img{transform:none!important;animation:none!important;will-change:auto}
html[data-pv-motion="off"] .pv-case-chapters:after{transition:none}
html[data-pv-motion="off"] .pv-selected-work-card.pv-filter-enter,html[data-pv-motion="off"] .pir-lightbox img.is-changing{animation:none!important}
@media(prefers-reduced-motion:reduce){
  ::view-transition-old(root),::view-transition-new(root),::view-transition-old(pv-main-content),::view-transition-new(pv-main-content){animation:none!important}
  .case-cover img{transform:none!important;animation:none!important;will-change:auto}
  .pv-case-chapters:after{transition:none}
  .pv-selected-work-card.pv-filter-enter,.pir-lightbox img.is-changing{animation:none!important}
}
</style><style>
/* PIR Visuals v5.74.0 — unified premium visual system */
:root{
  color-scheme:dark;
  --bg:#111713;
  --bg-soft:#18211b;
  --surface:#1b251e;
  --surface-raised:#243027;
  --line:rgba(199,211,190,.17);
  --text:#f2f1e9;
  --muted:#b7c0b3;
  --subtle:#8e9b90;
  --accent:#a9b99b;
  --accent-strong:#cbd6bb;
  --accent-ink:#1b281f;
  --gold:#d7bd8d;
  --danger:#e6a49e;
  --shadow:0 24px 64px rgba(0,0,0,.22);
  --pv-pattern:rgba(202,214,193,.055);
  --pv-orbit:rgba(215,189,141,.19);
  --pv-radius:20px;
}
[data-theme="light"]{
  color-scheme:light;
  --bg:#f4f2e9;
  --bg-soft:#ecece3;
  --surface:#fbfaf5;
  --surface-raised:#fffef9;
  --line:#d9ddd1;
  --text:#202a22;
  --muted:#59665b;
  --subtle:#748075;
  --accent:#58704f;
  --accent-strong:#38533d;
  --accent-ink:#fffdf6;
  --gold:#876f43;
  --danger:#a84640;
  --shadow:0 20px 52px rgba(46,57,43,.085);
  --pv-pattern:rgba(63,83,59,.052);
  --pv-orbit:rgba(165,111,80,.17);
}
html{background:var(--bg);color:var(--text);scroll-padding-top:112px}
body{
  position:relative;isolation:isolate;
  background:
    radial-gradient(ellipse at 88% 2%,color-mix(in srgb,var(--accent) 10%,transparent),transparent 31%),
    radial-gradient(ellipse at 2% 44%,color-mix(in srgb,var(--gold) 5%,transparent),transparent 28%),
    var(--bg);
  background-attachment:fixed;
  color:var(--text);
  font-family:Inter,"Aptos",ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;
  letter-spacing:-.012em;
}
body:before{
  content:"";position:fixed;inset:0;z-index:0;pointer-events:none;opacity:.58;
  background:repeating-linear-gradient(135deg,transparent 0 118px,var(--pv-pattern) 119px,transparent 120px 238px);
  mask-image:linear-gradient(180deg,#000 0%,rgba(0,0,0,.78) 54%,transparent 100%);
}
body:after{
  content:"";position:fixed;z-index:0;pointer-events:none;right:-230px;top:18vh;
  width:min(48vw,540px);height:min(38vw,410px);min-height:230px;
  border:1px solid var(--pv-orbit);
  border-radius:61% 39% 47% 53% / 44% 56% 44% 56%;
  transform:rotate(-22deg);opacity:.46;
}
.wrap{position:relative;z-index:1;max-width:1480px;padding:22px clamp(16px,4vw,58px) 76px}
h1,h2,h3,h4,.pv-managed-title,.showcase-section-heading{text-wrap:balance;color:var(--text)}
p,li,.muted{ text-wrap:pretty }
.muted{color:var(--muted)!important}
.eyebrow,.pv-label{color:var(--accent-strong)}
a{color:var(--accent-strong);text-underline-offset:3px}
a:hover{color:var(--gold)}
::selection{background:color-mix(in srgb,var(--accent) 42%,transparent);color:var(--text)}
:focus-visible{outline:2px solid var(--gold);outline-offset:3px}
.site-nav{
  gap:clamp(12px,1.4vw,20px);min-height:68px;padding:10px 16px;
  border:1px solid var(--line);border-radius:18px;
  background:color-mix(in srgb,var(--surface-raised) 91%,transparent);
  box-shadow:0 14px 38px rgba(0,0,0,.11);backdrop-filter:blur(22px) saturate(135%);
}
[data-theme="light"] .site-nav{background:rgba(255,254,249,.94);border-color:var(--line);box-shadow:0 12px 34px rgba(45,55,42,.075)}
.nav-primary{gap:5px}
.nav-primary>a,.nav-more>summary{min-height:40px;padding-inline:12px;border-radius:11px;font-size:11px}
.nav-primary>a[aria-current="page"]{background:color-mix(in srgb,var(--accent) 14%,var(--surface));color:var(--text)}
.nav-actions{gap:10px;padding-left:10px;border-left:1px solid var(--line)}
.nav-actions .nav-cta{min-height:42px;padding-inline:16px;border-radius:11px;background:var(--accent);color:var(--accent-ink);font-size:11px}
.nav-action-button{min-height:42px;min-width:42px;padding:0 12px;gap:7px;border:1px solid var(--line);border-radius:11px;background:var(--surface);color:var(--text);font-size:11px}
.nav-action-button:hover,.nav-toggle:hover{background:var(--surface-raised);border-color:color-mix(in srgb,var(--accent) 55%,var(--line));color:var(--text)}
[data-theme="light"] .nav-action-button{background:#f7f6ef;color:#26372b;border-color:#d9ddd1}
.nav-more-menu{border-radius:15px;background:var(--surface-raised);border-color:var(--line);box-shadow:0 22px 54px rgba(0,0,0,.18)}
.nav-more-menu a{min-height:40px;border-radius:10px}
.nav-toggle{border-radius:11px;min-height:42px}
.btn,.pv-button,.nav-cta,.theme-toggle,.nav-toggle,.favorite-btn,.shortlist-btn{
  transition:transform .2s cubic-bezier(.2,.75,.25,1),box-shadow .2s ease,background .2s ease,border-color .2s ease,color .2s ease;
}
.btn{
  min-height:44px;padding:11px 17px;border:1px solid color-mix(in srgb,var(--accent) 35%,transparent);
  border-radius:12px;background:linear-gradient(135deg,#879a7c,#bdc8ad);color:#1d2a20;
  font-weight:800;box-shadow:0 8px 22px rgba(0,0,0,.13);
}
.btn:hover{color:#17251b;filter:brightness(1.045);transform:translateY(-2px);box-shadow:0 12px 28px rgba(0,0,0,.16)}
.btn-secondary{background:var(--surface-raised);color:var(--text);border:1px solid var(--line);box-shadow:none}
.btn-secondary:hover{background:color-mix(in srgb,var(--accent) 12%,var(--surface-raised));color:var(--text)}
.btn-ghost{background:transparent;color:var(--text);border:1px solid var(--line);box-shadow:none}
.btn-ghost:hover{background:var(--surface-raised);color:var(--text)}
.card,.stat,.feature-item,.trust-item,.hero-panel,.designer-card,.work,.growth-intelligence,.growth-panel,.studio-panel,.support-form-card,.support-channel,.support-note{
  border-color:var(--line);box-shadow:none;
}
.card,.feature-item,.trust-item,.hero-panel,.designer-card,.work,.growth-intelligence,.growth-panel,.studio-panel{border-radius:var(--pv-radius)}
.card{background:var(--surface);color:var(--text)}
.feature-item,.trust-item,.stat,.growth-panel,.studio-panel{background:var(--surface)}
.designer-card{background:linear-gradient(145deg,var(--surface-raised),var(--surface))}
.work{background:var(--surface)}
.tag{background:color-mix(in srgb,var(--accent) 14%,var(--surface));border-color:color-mix(in srgb,var(--accent) 30%,var(--line));color:var(--accent-strong)}
input,select,textarea{
  min-height:44px;max-width:100%;border:1px solid var(--line);border-radius:12px;
  background:var(--surface-raised);color:var(--text);padding:11px 13px;
}
textarea{min-height:120px;line-height:1.65}
input::placeholder,textarea::placeholder{color:var(--subtle);opacity:1}
input:focus,select:focus,textarea:focus{outline:3px solid color-mix(in srgb,var(--accent) 32%,transparent);outline-offset:2px;border-color:var(--accent)}
label{color:var(--text);font-weight:700}
input[type="checkbox"],input[type="radio"]{accent-color:var(--accent)}
table{border-collapse:separate;border-spacing:0;background:var(--surface);color:var(--text)}
th,td{border-color:var(--line)}
.empty-state{border:1px solid var(--line);border-radius:18px;background:var(--surface)}
.pv-hero{
  min-height:clamp(570px,55vw,710px);padding:clamp(44px,6vw,84px) clamp(24px,5.2vw,74px) 82px;
  border:1px solid color-mix(in srgb,var(--accent) 24%,var(--line));border-radius:28px;
  background:linear-gradient(122deg,#1c2820 0%,#2a382d 55%,#1d2921 100%);
  box-shadow:0 26px 70px rgba(0,0,0,.16);
}
.pv-hero:before{
  opacity:1;
  background:
    repeating-linear-gradient(135deg,transparent 0 104px,rgba(222,230,211,.045) 105px,transparent 106px 208px),
    radial-gradient(ellipse at 82% 14%,rgba(157,178,137,.18),transparent 32%),
    radial-gradient(ellipse at 8% 96%,rgba(193,151,112,.08),transparent 34%);
}
.pv-hero:after{
  width:clamp(260px,34vw,460px);height:clamp(210px,26vw,340px);right:-6%;top:7%;
  border:1px solid rgba(215,189,141,.22);border-radius:61% 39% 45% 55% / 48% 52% 48% 52%;
  transform:rotate(-21deg);box-shadow:none;opacity:.7;
}
.pv-hero h1{max-width:12ch;font-size:clamp(58px,7.5vw,108px);line-height:.94;letter-spacing:-.082em;font-weight:680}
.pv-hero-lede{max-width:54ch;color:#cbd3c6;font-size:clamp(15px,1.35vw,18px);line-height:1.78}
.pv-overline,.pv-label{font-size:9px;letter-spacing:.18em}
.pv-button{min-height:48px;padding:14px 19px;border-radius:12px;font-size:11px;font-weight:800}
.pv-button-dark{background:#e8e7dc;color:#243126}
.pv-button-dark:hover{background:#fff;color:#1e2a21}
.pv-index{border-radius:18px;background:rgba(14,22,16,.54);border-color:rgba(232,238,224,.2);box-shadow:0 18px 44px rgba(0,0,0,.16)}
.pv-index-total strong{font-size:clamp(62px,7vw,90px)}
[data-theme="light"] .pv-hero{
  background:linear-gradient(126deg,#f0eee4 0%,#e7ebdf 58%,#f8f5ec 100%)!important;
  border:1px solid #d5dbce!important;color:#202a22!important;
  box-shadow:0 24px 62px rgba(49,61,45,.08);
}
[data-theme="light"] .pv-hero:before{
  opacity:1;background:
    repeating-linear-gradient(135deg,transparent 0 104px,rgba(61,83,58,.045) 105px,transparent 106px 208px),
    radial-gradient(ellipse at 86% 10%,rgba(143,164,125,.18),transparent 32%),
    radial-gradient(ellipse at 4% 100%,rgba(187,131,95,.07),transparent 34%);
}
[data-theme="light"] .pv-hero:after{border-color:rgba(146,104,75,.2)}
[data-theme="light"] .pv-hero h1{color:#202a22!important}
[data-theme="light"] .pv-hero-lede{color:#566256!important}
[data-theme="light"] .pv-overline,[data-theme="light"] .pv-label{color:#496247!important}
[data-theme="light"] .pv-index{background:rgba(255,254,248,.9)!important;border:1px solid #d8ddd1!important;color:#202a22!important;box-shadow:0 16px 38px rgba(45,56,42,.075)}
[data-theme="light"] .pv-index-total strong,[data-theme="light"] .pv-index-metrics b{color:#304a35!important}
[data-theme="light"] .pv-index-total span,[data-theme="light"] .pv-index-metrics small,[data-theme="light"] .pv-index>p{color:#647064!important}
[data-theme="light"] .pv-index-heading{color:#52644f!important}
[data-theme="light"] .pv-hero-foot,[data-theme="light"] .pv-hero-bottom{color:#667264!important;border-color:#d0d7ca}
[data-theme="light"] .pv-button-dark{background:#344f39!important;color:#fffdf6!important}
[data-theme="light"] .pv-text-link{color:#344f39!important;border-color:rgba(52,79,57,.36)}
.pv-category-section,.pv-talent-section,.pv-work-section,.pv-faq{padding-block:clamp(64px,7.5vw,104px)}
.pv-section-top{gap:clamp(20px,4vw,54px);margin-bottom:clamp(25px,3.4vw,40px)}
.pv-section-top h2,.pv-faq h2{font-size:clamp(38px,5.4vw,68px);line-height:.98;letter-spacing:-.075em}
.pv-section-top>p{max-width:54ch;color:var(--muted);font-size:13px;line-height:1.85}
.pv-category-grid{gap:14px}
.pv-category-grid .home-category{
  min-height:190px;padding:25px!important;border:1px solid var(--line)!important;border-radius:18px;
  background:linear-gradient(145deg,var(--surface-raised),var(--surface));
  transition:transform .24s ease,border-color .24s ease,background .24s ease;
}
.pv-category-grid .home-category:hover{transform:translateY(-5px);border-color:color-mix(in srgb,var(--accent) 58%,var(--line))!important;background:var(--surface-raised)}
.home-category span{color:var(--accent-strong)}
.home-category strong{font-size:clamp(18px,2vw,23px);letter-spacing:-.045em}
.home-category small{color:var(--muted);line-height:1.7}
.home-category>b{color:var(--gold)}
.pv-talent-grid{gap:18px}
.pv-talent-grid .designer-card{border-radius:18px;background:linear-gradient(145deg,var(--surface-raised),var(--surface));border-color:var(--line)}
.pv-work-section{padding:clamp(28px,4vw,48px);border:1px solid var(--line);border-radius:24px;background:var(--surface);}
.pv-work-section:before{display:none!important}
.home-project-image{border-radius:14px;overflow:hidden}
.home-project-caption{padding-top:13px;color:var(--text)}
.home-project-caption small{color:var(--muted)}
.pv-work-foot{border-color:var(--line)}
.pv-manifesto{margin:clamp(28px,4.5vw,58px) 0;padding:clamp(38px,6vw,78px);border:1px solid var(--line);border-radius:24px;background:var(--surface)}
.pv-manifesto:before{display:none!important}
.pv-manifesto:after{
  right:-115px;top:-145px;width:340px;height:300px;border:1px solid var(--pv-orbit);
  border-radius:62% 38% 42% 58% / 52% 48% 52% 48%;transform:rotate(24deg);opacity:.8;
}
.pv-manifesto h2{font-size:clamp(40px,5.8vw,74px);letter-spacing:-.075em}
.pv-manifesto-copy>p{max-width:66ch;color:var(--muted);line-height:1.9}
.pv-manifesto-points{border-color:var(--line)}
.pv-manifesto-points div{border-color:var(--line);color:var(--text)}
.pv-join{border:1px solid rgba(183,200,164,.28);border-radius:24px;padding:clamp(32px,5vw,64px);background:linear-gradient(118deg,#2e4634,#23352a 62%,#26372b);box-shadow:0 22px 54px rgba(0,0,0,.13)}
.pv-join:after{right:-110px;bottom:-180px;width:360px;height:260px;border:1px solid rgba(215,189,141,.24);border-radius:62% 38% 46% 54% / 54% 46% 54% 46%;box-shadow:none}
.pv-join h2{color:#f5f2e9}
.pv-join p{color:#d2dbcf}
.pv-button-light{border-radius:12px;background:#f1f0e7;color:#27382b}
.pv-faq-list{display:grid;gap:9px}
.pv-faq-list details{padding:17px 19px;border:1px solid var(--line);border-radius:14px;background:var(--surface)}
.pv-faq-list details[open]{background:var(--surface-raised)}
.pv-faq-list summary{color:var(--text);font-weight:750}
.pv-faq-list p{color:var(--muted);line-height:1.8}
.home-carousel{border-radius:20px;border-color:var(--line);background:var(--surface);padding:clamp(12px,2vw,18px)}
.pv-home .carousel-slide{border-radius:15px}
.carousel-arrows button{border-radius:11px}
.foot{margin-top:clamp(54px,8vw,96px);padding:clamp(22px,3vw,40px);border:1px solid #465347;border-radius:24px;background:#202820;color:#eeeadd;text-align:left;box-shadow:0 22px 54px rgba(0,0,0,.12)}
.footer-cta{gap:clamp(22px,4vw,52px);padding-bottom:clamp(24px,3vw,38px);border-bottom-color:rgba(240,240,225,.18)}
.footer-cta h2{font-size:clamp(30px,4vw,48px);line-height:1.03;letter-spacing:-.06em;color:#f5f1e6}
.footer-cta p{max-width:55ch;color:#cbd2c6;line-height:1.85}
.footer-grid{gap:clamp(18px,3vw,34px);padding:28px 0 20px}
.footer-grid strong{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#e5e2d2}
.footer-grid p{color:#c2cbbf;line-height:2}
.footer-grid a{color:#d8ddcf}
.footer-grid a:hover{color:#e6d0a5}
.footer-bottom{color:#aeb7a9;border-color:rgba(240,240,225,.16);font-size:11px;line-height:1.7}
[data-theme="light"] .foot{background:#202820;color:#eeeadd;border-color:#465347}
[data-theme="light"] .foot .footer-grid strong{color:#e5e2d2}
[data-theme="light"] .foot .footer-grid a{color:#d8ddcf}
[data-theme="light"] .foot .footer-brand-lockup{color:#fff}
/* Customer care is treated as a first-class product surface. */
.support-hero{
  display:grid;grid-template-columns:minmax(0,1.2fr) minmax(230px,.62fr);align-items:end;gap:clamp(24px,5vw,64px);
  padding:clamp(34px,6vw,76px);border:1px solid rgba(190,207,177,.23);border-radius:28px;
  background:linear-gradient(122deg,#202d23 0%,#304233 58%,#202b22 100%);box-shadow:0 24px 62px rgba(0,0,0,.13);
}
.support-hero:after{content:"";position:absolute;right:-90px;top:-145px;width:340px;height:280px;border:1px solid rgba(215,189,141,.2);border-radius:61% 39% 48% 52% / 45% 55% 45% 55%;transform:rotate(-22deg);pointer-events:none}
.support-hero-main,.support-hero-aside{position:relative;z-index:1}
.support-hero h1{font-size:clamp(46px,6.8vw,82px);letter-spacing:-.075em;line-height:.96;color:#f5f2e9}
.support-hero h1 em{font-family:Georgia,serif;font-weight:400;color:#d7dfc9}
.support-hero p{max-width:60ch;color:#d0d8cb;font-size:14px;line-height:1.85}
.support-hours{color:#d9e1d2}
.support-hero-aside{padding:22px;border:1px solid rgba(237,241,228,.18);border-radius:18px;background:rgba(13,21,15,.34);backdrop-filter:blur(12px)}
.support-aside-index{display:block;margin-bottom:20px;color:#cbd5bc;font-size:9px;letter-spacing:.18em;font-weight:900}
.support-hero-aside>strong{display:block;max-width:15ch;color:#f4f1e8;font-size:clamp(20px,2.2vw,28px);line-height:1.12;letter-spacing:-.04em}
.support-hero-aside ul{display:grid;gap:0;margin:20px 0 0;padding:0;list-style:none}
.support-hero-aside li{display:flex;align-items:center;gap:12px;padding:10px 0;border-top:1px solid rgba(237,241,228,.14);color:#d2dacd;font-size:11px}
.support-hero-aside li span{color:#b9c99f;font-size:9px;font-weight:900;letter-spacing:.12em}
.support-layout{grid-template-columns:minmax(0,.86fr) minmax(0,1.14fr);gap:clamp(24px,4.5vw,62px);padding:clamp(34px,5vw,64px) 0}
.support-info h2,.support-form-card h2{font-size:clamp(30px,3.8vw,44px);letter-spacing:-.065em}
.support-info>p,.support-form-card>p{font-size:13px;line-height:1.85}
.support-channels{grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px}
.support-channel{min-height:142px;padding:18px;border-radius:16px;background:var(--surface);transition:transform .2s ease,border-color .2s ease,background .2s ease}
.support-channel:hover{transform:translateY(-3px);border-color:var(--accent);background:var(--surface-raised)}
.support-channel>span{color:var(--accent-strong);font-size:8px;letter-spacing:.16em}
.support-channel strong{font-size:14px;line-height:1.4}
.support-channel small{font-size:10px;line-height:1.6}
.support-channel-ticket{border-style:dashed;background:color-mix(in srgb,var(--accent) 7%,var(--surface))}
.support-channel-ticket>a{margin-top:auto;font-size:10px;font-weight:850}
.support-note{padding:20px;border-radius:16px;background:var(--bg-soft)}
.support-note p{line-height:1.8}
.support-quick-links{display:flex;flex-wrap:wrap;gap:8px;margin-top:18px}
.support-quick-links a{padding:9px 12px;border:1px solid var(--line);border-radius:999px;color:var(--text);font-size:10px;font-weight:750}
.support-quick-links a:hover{background:var(--surface-raised);border-color:var(--accent)}
.support-form-card{padding:clamp(22px,3vw,36px);border-radius:22px;background:var(--surface-raised);box-shadow:var(--shadow)}
.support-form{gap:16px;margin-top:24px}
.support-form label{gap:8px;color:var(--text);font-size:11px}
.support-form input,.support-form select,.support-form textarea{border-radius:12px;background:var(--bg-soft)}
.support-form .btn{min-height:48px}
.support-success{border-radius:24px;background:var(--surface-raised);box-shadow:var(--shadow)}
.support-ticket-id{padding:14px 20px;border-radius:12px;background:var(--bg-soft);font-size:16px}
.support-ticket-actions{display:flex;justify-content:center;align-items:center;gap:12px;flex-wrap:wrap;margin:8px 0 18px}
.support-copy-status{color:var(--muted);font-size:11px}
[data-theme="light"] .support-channel{background:#fffef9}
[data-theme="light"] .support-channel-ticket{background:#f0f3eb}
[data-theme="light"] .support-form-card{background:#fffef9}
[data-theme="light"] .support-form input,[data-theme="light"] .support-form select,[data-theme="light"] .support-form textarea{background:#f7f7f0;color:#202a22}
[data-theme="light"] .support-note{background:#eeefe7}
@media(max-width:1180px){
  .nav-actions{border-left:0;padding-left:0}
  .nav-links.open{gap:12px;padding:16px;border-radius:18px;background:var(--surface-raised)}
  .nav-links.open .nav-actions{gap:9px;padding-top:13px;border-top:1px solid var(--line)}
  .nav-links.open .nav-action-button{min-height:43px;padding-inline:10px}
  .nav-links.open .nav-actions .nav-cta{min-height:46px}
  [data-theme="light"] .nav-links.open{background:rgba(255,254,249,.99);border-color:var(--line)}
}
@media(max-width:900px){
  .support-hero{grid-template-columns:1fr;align-items:start}
  .support-hero-aside{max-width:540px}
  .support-layout{grid-template-columns:1fr}
}
@media(max-width:760px){
  .wrap{padding:14px 16px 48px}
  .site-nav{border-radius:16px}
  .nav-links.open{width:min(460px,calc(100vw - 32px));max-height:calc(100dvh - 96px);overflow:auto}
  .nav-actions{gap:8px}
  .nav-action-button{min-height:42px}
  .pv-hero{min-height:0;padding:42px 24px 76px;border-radius:22px}
  .pv-hero h1{font-size:clamp(48px,11vw,78px);max-width:13ch}
  .pv-hero:after{width:270px;height:210px;right:-90px;top:10%;opacity:.48}
  .pv-section-top{display:block}
  .pv-section-top>p{margin-top:15px}
  .pv-category-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
  .pv-talent-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
  .pv-manifesto{grid-template-columns:1fr;gap:22px}
  .support-hero{padding:32px 24px;border-radius:22px}
  .support-hero h1{font-size:clamp(42px,10vw,66px)}
  .support-form-card{padding:22px}
  .footer-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
}
@media(max-width:520px){
  .wrap{padding:12px 13px 40px}
  .site-nav{padding:9px 11px;border-radius:14px}
  .nav-links.open{width:calc(100vw - 26px);padding:12px}
  .nav-actions{grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}
  .nav-actions .nav-cta{grid-column:1/-1}
  .nav-action-button{justify-content:center;gap:5px;padding-inline:6px;font-size:10px}
  .pv-hero{padding:36px 20px 72px;border-radius:19px;gap:24px}
  .pv-hero h1{font-size:clamp(44px,11.8vw,62px);line-height:1.02}
  .pv-hero-actions{align-items:stretch;gap:10px;flex-wrap:wrap}
  .pv-hero-actions .pv-button{flex:1 1 100%;justify-content:center}
  .pv-hero-foot{gap:9px 13px;margin-top:28px;font-size:7px}
  .pv-index{padding:16px}
  .pv-category-grid,.pv-talent-grid{grid-template-columns:1fr}
  .pv-category-grid .home-category{min-height:148px}
  .pv-work-section{padding:18px;border-radius:18px}
  .pv-manifesto{padding:30px 22px;border-radius:19px}
  .pv-join{padding:30px 22px;border-radius:19px}
  .pv-join{align-items:start;flex-direction:column}
  .support-hero{padding:28px 20px;border-radius:19px}
  .support-hero-aside{padding:17px}
  .support-layout{padding:30px 0}
  .support-channels{grid-template-columns:1fr}
  .support-channel{min-height:0}
  .support-form-card{padding:18px;border-radius:18px}
  .footer-cta{display:block}
  .footer-cta>div+div{margin-top:16px}
  .foot{padding:20px 17px;border-radius:19px}
  .footer-grid{grid-template-columns:1fr 1fr;gap:16px}
}
@media(max-width:360px){
  .nav-toggle{min-width:78px;padding-inline:9px;gap:7px}
  .nav-actions{grid-template-columns:1fr 1fr}
  .nav-actions .nav-cta,.nav-actions .nav-action-button:last-child{grid-column:1/-1}
  .footer-grid{grid-template-columns:1fr}
}
@media(prefers-reduced-motion:reduce){
  body:before,body:after{display:none!important}
  .pv-category-grid .home-category,.support-channel,.btn,.pv-button{transition:none!important}
}

</style><style>
/* PIR Visuals v5.76.0 — discovery cards, route awareness and shared page rhythm */
#main-content{--pv-page-gap:clamp(24px,3.2vw,42px)}
#main-content>.hero:not(.pv-hero){position:relative;margin:0 0 var(--pv-page-gap);padding:clamp(32px,5vw,62px) clamp(4px,1vw,12px) clamp(24px,3vw,38px);border-bottom:1px solid var(--line)}
#main-content>.hero:not(.pv-hero) h1{max-width:16ch;margin:10px 0 14px;font-size:clamp(38px,5.5vw,68px);line-height:.99;letter-spacing:-.075em;font-weight:690}
#main-content>.hero:not(.pv-hero)>p{max-width:66ch;color:var(--muted);font-size:14px;line-height:1.85}
#main-content .section-head{margin:clamp(28px,4vw,48px) 0 18px;align-items:end}
#main-content .section-head h2{font-size:clamp(25px,3.2vw,36px);letter-spacing:-.06em;line-height:1.05}
#main-content .stat-grid{gap:12px;margin:22px 0 8px}
#main-content .stat{min-height:104px;padding:18px 19px;border:1px solid var(--line);border-radius:16px;background:linear-gradient(145deg,var(--surface-raised),var(--surface));box-shadow:0 10px 28px rgba(20,28,21,.035)}
#main-content .stat strong{font-size:clamp(25px,3vw,34px);letter-spacing:-.055em;color:var(--text)}
#main-content .stat span{font-size:10px;letter-spacing:.02em}
#main-content .search-panel{padding:clamp(18px,2.6vw,28px);border:1px solid var(--line);border-radius:20px;background:var(--surface);box-shadow:var(--shadow)}
#main-content .search-panel label{display:grid;gap:7px;color:var(--text);font-size:11px}
#main-content .search-panel input,#main-content .search-panel select{width:100%;margin:0!important}
#main-content .feature-grid{grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));gap:14px}
#main-content .feature-item{border-radius:18px;background:linear-gradient(145deg,var(--surface-raised),var(--surface));transition:transform .24s ease,border-color .24s ease,box-shadow .24s ease}
#main-content .feature-item:hover{transform:translateY(-3px);border-color:color-mix(in srgb,var(--accent) 52%,var(--line));box-shadow:0 18px 42px rgba(0,0,0,.08)}
#main-content .card{border-radius:var(--pv-radius);background:var(--surface);box-shadow:0 14px 38px rgba(20,28,21,.035)}
#main-content .designer-card{display:flex;flex-direction:column;min-width:0;min-height:0;padding:0!important;overflow:hidden;border:1px solid var(--line);border-radius:20px;background:var(--surface);box-shadow:0 14px 38px rgba(20,28,21,.055);transition:transform .28s cubic-bezier(.2,.75,.25,1),border-color .28s ease,box-shadow .28s ease}
#main-content .designer-card:hover{transform:translateY(-5px);border-color:color-mix(in srgb,var(--accent) 48%,var(--line));box-shadow:0 24px 54px rgba(20,28,21,.11)}
.designer-card-cover{position:relative;min-height:126px;overflow:visible;padding:15px 17px;background:linear-gradient(122deg,#26392d 0%,#3d5140 54%,#68735a 100%);isolation:isolate}
.designer-card-cover:before{content:"";position:absolute;z-index:-1;right:-34px;top:-90px;width:210px;height:190px;border:1px solid rgba(235,239,222,.26);border-radius:61% 39% 47% 53% / 44% 56% 44% 56%;transform:rotate(-23deg)}
.designer-card-cover:after{content:"";position:absolute;z-index:-1;right:48px;bottom:-92px;width:170px;height:150px;border:1px solid rgba(224,203,161,.23);border-radius:48% 52% 62% 38% / 48% 38% 62% 52%;transform:rotate(22deg)}
.designer-card-cover-label{color:rgba(247,246,234,.76);font-size:8px;font-weight:900;letter-spacing:.17em}
.designer-card-cover-label i{font-style:normal;color:rgba(247,246,234,.52)}
.designer-card-cover-art{position:absolute;right:18px;bottom:15px;display:flex;align-items:end;gap:6px;opacity:.48}
.designer-card-cover-art i{display:block;width:26px;height:32px;border:1px solid rgba(248,246,231,.48);border-radius:48% 52% 42% 58%}
.designer-card-cover-art i:nth-child(2){height:46px;width:34px;border-radius:58% 42% 55% 45%}
.designer-card-cover-art i:nth-child(3){height:23px;width:20px;border-radius:42% 58% 48% 52%}
.designer-card-portrait{position:absolute;z-index:1;left:18px;bottom:-31px;width:76px;height:76px;display:grid;place-items:center;overflow:hidden;border:4px solid var(--surface);border-radius:23px;background:linear-gradient(145deg,#d4d8c6,#87977d);color:#263629;font-size:27px;font-weight:850;box-shadow:0 8px 22px rgba(0,0,0,.18)}
.designer-card-portrait img{width:100%;height:100%;object-fit:cover}
.designer-card-content{display:flex;flex:1;flex-direction:column;min-width:0;padding:42px 19px 18px}
.designer-card-badges{display:flex;flex-wrap:wrap;gap:6px;min-height:22px;margin-bottom:12px}
.designer-card-badge{display:inline-flex;align-items:center;min-height:22px;padding:4px 8px;border:1px solid var(--line);border-radius:999px;background:var(--bg-soft);color:var(--muted);font-size:8px;font-weight:850;letter-spacing:.04em}
.designer-card-badge.is-featured{background:color-mix(in srgb,var(--gold) 14%,var(--surface));border-color:color-mix(in srgb,var(--gold) 35%,var(--line));color:var(--gold)}
.designer-card-badge.is-verified{background:color-mix(in srgb,var(--accent) 12%,var(--surface));border-color:color-mix(in srgb,var(--accent) 35%,var(--line));color:var(--accent-strong)}
.designer-card-heading{display:flex;align-items:start;justify-content:space-between;gap:10px;min-width:0}
.designer-card-heading>div{min-width:0}
.designer-card-heading h2{margin:0;color:var(--text);font-size:clamp(19px,2vw,23px);line-height:1.1;letter-spacing:-.055em;overflow-wrap:anywhere}
.designer-card-heading p{margin:6px 0 0;color:var(--muted);font-size:10px;line-height:1.45}
.designer-card-availability{display:inline-flex;align-items:center;gap:6px;flex:0 0 auto;padding:6px 8px;border:1px solid var(--line);border-radius:999px;color:var(--muted);font-size:8px;font-weight:850;white-space:nowrap}
.designer-card-availability i{width:6px;height:6px;border-radius:50%;background:var(--subtle)}
.designer-card-availability.is-open{border-color:color-mix(in srgb,#6d9d72 38%,var(--line));background:color-mix(in srgb,#6d9d72 10%,var(--surface));color:var(--accent-strong)}
.designer-card-availability.is-open i{background:#78a77b;box-shadow:0 0 0 3px color-mix(in srgb,#78a77b 18%,transparent)}
.designer-card-bio{display:-webkit-box;min-height:57px;margin:14px 0 13px;overflow:hidden;color:var(--muted);font-size:11px;line-height:1.72;-webkit-box-orient:vertical;-webkit-line-clamp:3}
.designer-card-skills{display:flex;flex-wrap:wrap;gap:6px;min-height:26px}
.designer-card-skills span{padding:5px 8px;border:1px solid var(--line);border-radius:7px;background:var(--bg-soft);color:var(--text);font-size:8px;font-weight:750}
.designer-card-price{display:grid;grid-template-columns:1fr auto;align-items:end;gap:4px;margin-top:16px;padding:12px 0;border-top:1px solid var(--line)}
.designer-card-price span{grid-column:1/-1;color:var(--subtle);font-size:7px;font-weight:900;letter-spacing:.16em}
.designer-card-price strong{color:var(--accent-strong);font-size:17px;letter-spacing:-.04em}
.designer-card-price small{color:var(--subtle);font-size:8px}
#main-content .designer-card .card-bottom{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:7px;align-items:center;margin-top:auto;padding-top:13px;border-top:1px solid var(--line)}
#main-content .designer-card .designer-card-profile-link{min-height:40px;padding:9px 11px;border-radius:10px;font-size:10px}
#main-content .designer-card .favorite-btn,#main-content .designer-card .shortlist-btn{min-height:38px;padding:7px 9px;border-radius:10px;background:var(--surface-raised);border-color:var(--line);color:var(--text);font-size:9px;white-space:nowrap}
#main-content .designer-card .favorite-btn[aria-pressed="true"]{background:color-mix(in srgb,#b95d68 12%,var(--surface));border-color:#b95d68;color:#b95d68}
#main-content .designer-card .shortlist-btn[aria-pressed="true"]{background:color-mix(in srgb,var(--accent) 14%,var(--surface));border-color:var(--accent);color:var(--accent-strong)}
.nav-primary>a[aria-current="page"],.nav-actions>a[aria-current="page"],.nav-more-menu a[aria-current="page"]{background:color-mix(in srgb,var(--accent) 15%,var(--surface));color:var(--text)!important;box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--accent) 22%,transparent)}
.nav-primary>a[aria-current="page"]:after{content:"";display:block;width:14px;height:2px;margin:3px auto -5px;border-radius:9px;background:var(--accent-strong)}
.nav-more.has-current>summary{background:color-mix(in srgb,var(--accent) 13%,var(--surface));color:var(--text)}
.nav-more.has-current>summary:after{content:"";width:5px;height:5px;margin-left:2px;border-radius:50%;background:var(--accent-strong)}
.nav-more-menu a[aria-current="page"]{font-weight:900}
.nav-actions>a.nav-cta[aria-current="page"]{background:var(--accent)!important;color:var(--accent-ink)!important;box-shadow:0 8px 22px color-mix(in srgb,var(--accent) 22%,transparent)}
@media(max-width:900px){.designer-card-heading{display:block}.designer-card-availability{margin-top:9px}.designer-card-bio{min-height:0}}
@media(max-width:600px){#main-content>.hero:not(.pv-hero){padding-top:26px}#main-content .stat-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.designer-card-cover{min-height:116px}.designer-card-content{padding:40px 15px 15px}.designer-card-heading h2{font-size:20px}#main-content .designer-card .card-bottom{grid-template-columns:1fr 1fr}.designer-card-profile-link{grid-column:1/-1}}
@media(max-width:360px){#main-content .stat-grid{grid-template-columns:1fr}.designer-card-price{grid-template-columns:1fr}.designer-card-price small{margin-top:3px}}
@media(prefers-reduced-motion:reduce){#main-content .designer-card,#main-content .feature-item{transition:none!important}#main-content .designer-card:hover,#main-content .feature-item:hover{transform:none!important}}
html[data-pv-motion="off"] #main-content .designer-card,html[data-pv-motion="off"] #main-content .feature-item{transition:none!important}
html[data-pv-motion="off"] #main-content .designer-card:hover,html[data-pv-motion="off"] #main-content .feature-item:hover{transform:none!important}

/* PIR Visuals v5.76.0 — Light Mode contrast & surface harmonization */
[data-theme="light"]{
  color-scheme:light;
  --bg:#F4F2EC;
  --bg-soft:#ECEFE8;
  --surface:#FFFEFA;
  --surface-raised:#F7F8F2;
  --line:#D1D8CD;
  --text:#202820;
  --muted:#4E5B50;
  --subtle:#5D6B60;
  --accent:#3F6544;
  --accent-strong:#31583A;
  --accent-ink:#FFFFFF;
  --gold:#765C2F;
  --danger:#A23F3A;
  --shadow:0 20px 54px rgba(37,49,38,.085);
  --panel:var(--surface);
  --panel2:var(--surface-raised);
  --mint:var(--accent-strong);
  --mint2:var(--accent);
  --pv-orbit:rgba(49,88,58,.14);
}
[data-theme="light"] body{
  background:
    radial-gradient(ellipse at 8% -8%,rgba(160,178,145,.18),transparent 34%),
    radial-gradient(ellipse at 96% 16%,rgba(191,174,139,.11),transparent 28%),
    linear-gradient(180deg,#F6F4EE 0%,var(--bg) 58%,#F0EFE8 100%);
  color:var(--text);
}
[data-theme="light"] #main-content{color:var(--text)}
[data-theme="light"] .muted,
[data-theme="light"] .status,
[data-theme="light"] .support-copy-status{color:var(--muted)!important}
[data-theme="light"] .eyebrow,
[data-theme="light"] .pv-overline,
[data-theme="light"] .pv-label{color:#3F6544}
[data-theme="light"] .site-nav{
  background:rgba(255,254,250,.96);
  border-color:#D1D8CD;
  box-shadow:0 12px 34px rgba(37,49,38,.075);
}
[data-theme="light"] .brand-copy strong,
[data-theme="light"] .nav-links a,
[data-theme="light"] .nav-more>summary{color:#26382B}
[data-theme="light"] .nav-links a:hover,
[data-theme="light"] .nav-more>summary:hover{background:#EEF2EA;color:#203B29}
[data-theme="light"] .nav-more-menu{
  background:#FFFEFA;
  border-color:#D1D8CD;
  box-shadow:0 22px 54px rgba(37,49,38,.14);
}
[data-theme="light"] .nav-more-menu a{color:#314B37}
[data-theme="light"] .nav-more-menu a:hover{background:#EEF2EA;color:#203B29}
[data-theme="light"] .theme-toggle,
[data-theme="light"] .nav-toggle,
[data-theme="light"] .nav-action-button{
  background:#F0F2EB;
  color:#293A2E;
  border-color:#CDD5CA;
}
[data-theme="light"] .theme-toggle:hover,
[data-theme="light"] .nav-toggle:hover,
[data-theme="light"] .nav-action-button:hover{background:#E7EDE3;color:#203B29}
[data-theme="light"] #main-content .card,
[data-theme="light"] #main-content .stat,
[data-theme="light"] #main-content .feature-item,
[data-theme="light"] #main-content .trust-item,
[data-theme="light"] #main-content .hero-panel,
[data-theme="light"] #main-content .designer-card,
[data-theme="light"] #main-content .work,
[data-theme="light"] #main-content .growth-intelligence,
[data-theme="light"] #main-content .growth-panel,
[data-theme="light"] #main-content .studio-sidebar,
[data-theme="light"] #main-content .studio-panel,
[data-theme="light"] #main-content .studio-kpis article,
[data-theme="light"] #main-content .support-channel,
[data-theme="light"] #main-content .support-form-card,
[data-theme="light"] #main-content .support-note,
[data-theme="light"] #main-content .support-success,
[data-theme="light"] #main-content .support-admin-ticket,
[data-theme="light"] #main-content .shortlist-table-wrap,
[data-theme="light"] #main-content .pv-work-section,
[data-theme="light"] #main-content .pv-manifesto,
[data-theme="light"] #main-content .pv-faq-list details,
[data-theme="light"] #main-content .home-carousel,
[data-theme="light"] #main-content .showcase-jumpnav,
[data-theme="light"] #main-content .empty-state,
[data-theme="light"] #main-content .studio-performance-card,
[data-theme="light"] #main-content .pv-client-card,
[data-theme="light"] #main-content .pv-client-confirmation,
[data-theme="light"] #main-content .pv-project-list-card,
[data-theme="light"] #main-content .shortlist-toolbar{
  color:var(--text);
  border-color:var(--line);
  background:linear-gradient(145deg,var(--surface-raised),var(--surface));
  box-shadow:0 12px 30px rgba(37,49,38,.045);
}
[data-theme="light"] #main-content .card :is(p,small,li,figcaption,.muted),
[data-theme="light"] #main-content .feature-item :is(p,small,.muted),
[data-theme="light"] #main-content .trust-item :is(p,small,.muted),
[data-theme="light"] #main-content .studio-panel :is(p,small,.muted),
[data-theme="light"] #main-content .studio-sidebar :is(small,.muted),
[data-theme="light"] #main-content .growth-panel :is(p,small,.muted),
[data-theme="light"] #main-content .growth-intelligence :is(p,small,.muted),
[data-theme="light"] #main-content .pv-client-card :is(p,small,.muted),
[data-theme="light"] #main-content .pv-project-list-card :is(p,small,.muted){
  color:var(--muted);
}
[data-theme="light"] #main-content .section-head h2,
[data-theme="light"] #main-content .card :is(h1,h2,h3,h4),
[data-theme="light"] #main-content .studio-panel :is(h1,h2,h3,h4),
[data-theme="light"] #main-content .studio-sidebar :is(h1,h2,h3,h4),
[data-theme="light"] #main-content .growth-panel :is(h1,h2,h3,h4){color:var(--text)}
[data-theme="light"] #main-content .stat strong,
[data-theme="light"] #main-content .stat span{color:var(--text)}
[data-theme="light"] #main-content .stat span{color:var(--muted)}
[data-theme="light"] #main-content .designer-card{
  background:linear-gradient(150deg,#FFFEFA 0%,#F7F8F2 100%);
  border-color:#D1D8CD;
}
[data-theme="light"] #main-content .designer-card-badge,
[data-theme="light"] #main-content .designer-card-availability,
[data-theme="light"] #main-content .designer-card-skills span{
  background:#EEF2EA;color:#344A38;border-color:#D1DACE;
}
[data-theme="light"] #main-content .designer-card-badge.is-featured{
  background:#F5EFDF;color:#6F5427;border-color:#DCCB9E;
}
[data-theme="light"] #main-content .designer-card-badge.is-verified,
[data-theme="light"] #main-content .designer-card-availability.is-open{
  background:#E9F1E6;color:#31583A;border-color:#BFCFBA;
}
[data-theme="light"] #main-content .designer-card-heading h2,
[data-theme="light"] #main-content .designer-card-price strong{color:#31583A}
[data-theme="light"] #main-content .designer-card-heading p,
[data-theme="light"] #main-content .designer-card-bio,
[data-theme="light"] #main-content .designer-card-price span,
[data-theme="light"] #main-content .designer-card-price small{color:#536256}
[data-theme="light"] #main-content .designer-card .favorite-btn,
[data-theme="light"] #main-content .designer-card .shortlist-btn{
  background:#FFFEFA;color:#314B37;border-color:#D1D8CD;
}
[data-theme="light"] #main-content .designer-card .shortlist-btn[aria-pressed="true"]{
  background:#E8F0E5;color:#31583A;border-color:#91AA8C;
}
[data-theme="light"] input,
[data-theme="light"] select,
[data-theme="light"] textarea{
  background:#FFFEFA;
  color:#202820;
  border-color:#C5D0C3;
}
[data-theme="light"] input::placeholder,
[data-theme="light"] textarea::placeholder{color:#657266;opacity:1}
[data-theme="light"] select option{background:#FFFEFA;color:#202820}
[data-theme="light"] label{color:#293A2E}
[data-theme="light"] input:focus,
[data-theme="light"] select:focus,
[data-theme="light"] textarea:focus{
  outline:3px solid rgba(63,101,68,.22);
  border-color:#3F6544;
}
[data-theme="light"] table{background:#FFFEFA;color:#202820;border-color:#D1D8CD}
[data-theme="light"] th{background:#EEF2EA;color:#314B37}
[data-theme="light"] td{background:#FFFEFA;color:#344238}
[data-theme="light"] th,
[data-theme="light"] td{border-color:#D1D8CD}
[data-theme="light"] .tag,
[data-theme="light"] .pill-count{
  background:#EAF0E7;
  color:#31583A;
  border-color:#C8D5C4;
}
[data-theme="light"] .btn-secondary{
  background:#FFFEFA;color:#26382B;border-color:#C8D2C6;
}
[data-theme="light"] .btn-secondary:hover{background:#EEF2EA;color:#203B29}
[data-theme="light"] .btn-ghost{
  background:transparent;color:#314B37;border-color:#BFCBBB;
}
[data-theme="light"] .btn-ghost:hover{background:#EEF2EA;color:#203B29}
[data-theme="light"] :is(button,a,input,select,textarea,[tabindex]):focus-visible{
  outline:3px solid rgba(63,101,68,.38);
  outline-offset:3px;
}

/* Customer Support: opaque light surface, dark editorial type and legible metadata. */
[data-theme="light"] .support-hero{
  background:
    radial-gradient(ellipse at 92% 12%,rgba(160,178,145,.16),transparent 34%),
    linear-gradient(126deg,#F0F2E9 0%,#F8F8F2 62%,#E9EFE5 100%);
  border-color:#CCD6C9;
  color:#202820;
  box-shadow:0 22px 54px rgba(37,49,38,.075);
}
[data-theme="light"] .support-hero .eyebrow{color:#3F6544}
[data-theme="light"] .support-hero h1{color:#202820}
[data-theme="light"] .support-hero h1 em{
  color:#31583A!important;
  text-shadow:none;
}
[data-theme="light"] .support-hero p{color:#4E5B50}
[data-theme="light"] .support-hours{color:#405445;font-size:10px;letter-spacing:.1em}
[data-theme="light"] .support-dot{background:#477A4D;box-shadow:0 0 0 4px rgba(71,122,77,.13)}
[data-theme="light"] .support-hero-aside{
  background:linear-gradient(145deg,#FFFEFA 0%,#EEF3E9 100%)!important;
  border:1px solid #C7D3C4;
  color:#1F2C22!important;
  box-shadow:0 14px 32px rgba(37,49,38,.075);
  backdrop-filter:none;
}
[data-theme="light"] .support-aside-index{color:#49664C!important}
[data-theme="light"] .support-hero-aside>strong{color:#1F2C22!important}
[data-theme="light"] .support-hero-aside li{
  color:#405445!important;
  border-color:#D5DED2!important;
}
[data-theme="light"] .support-hero-aside li span{color:#31583A!important}
[data-theme="light"] .support-info h2,
[data-theme="light"] .support-form-card h2{color:#202820}
[data-theme="light"] .support-info>p,
[data-theme="light"] .support-form-card>p{color:#4E5B50}
[data-theme="light"] .support-channel{
  background:#FFFEFA!important;color:#202820;border-color:#CDD7CA;
}
[data-theme="light"] .support-channel>span{color:#3F6544!important}
[data-theme="light"] .support-channel strong{color:#202820!important}
[data-theme="light"] .support-channel small{color:#536256!important}
[data-theme="light"] .support-channel-ticket{background:#EEF3E9!important;border-style:solid}
[data-theme="light"] .support-note{background:#EEF2EA!important;border-color:#CCD6C9}
[data-theme="light"] .support-note strong{color:#26382B}
[data-theme="light"] .support-note p{color:#4E5B50!important}
[data-theme="light"] .support-quick-links a{background:#FFFEFA;color:#31583A;border-color:#C8D2C6}
[data-theme="light"] .support-quick-links a:hover{background:#EAF0E7;color:#203B29}
[data-theme="light"] .support-form-card{background:#FFFEFA!important;border-color:#CDD7CA}
[data-theme="light"] .support-form label{color:#293A2E}
[data-theme="light"] .support-form input,
[data-theme="light"] .support-form select,
[data-theme="light"] .support-form textarea{background:#F8F9F4;color:#202820;border-color:#C5D0C3}
[data-theme="light"] .support-form .muted{color:#536256!important}
[data-theme="light"] .support-success{background:#FFFEFA;color:#202820;border-color:#CDD7CA}
[data-theme="light"] .support-ticket-id{background:#EEF3E9;color:#26382B;border-color:#C8D4C5}
[data-theme="light"] .support-admin-ticket{background:#FFFEFA;color:#202820;border-color:#CDD7CA}
[data-theme="light"] .support-admin-ticket p{color:#4E5B50}
[data-theme="light"] .foot{background:#202820;color:#EEEADD;border-color:#465347}
[data-theme="light"] .foot .footer-cta h2,
[data-theme="light"] .foot .footer-grid strong{color:#F0EDDF}
[data-theme="light"] .foot .footer-cta p,
[data-theme="light"] .foot .footer-grid p{color:#D0D8CB}
[data-theme="light"] .foot .footer-grid a{color:#E1E6D9}
[data-theme="light"] .foot .footer-bottom{color:#C1CBBB}
[data-theme="light"] .foot .muted{color:#D0D8CB!important}
@media(max-width:760px){
  .foot{margin-inline:-16px}
  [data-theme="light"] .support-hero-aside{max-width:100%;padding:19px}
  [data-theme="light"] .support-hero h1 em{display:inline-block}
}
@media(max-width:520px){
  .foot{margin-inline:-13px}
}
@media(prefers-reduced-motion:reduce){
  [data-theme="light"] #main-content .designer-card,
  [data-theme="light"] #main-content .feature-item,
  [data-theme="light"] .support-channel{transition:none!important}
}


/* PIR Visuals v5.77.0 — Universal Design System */
html[data-theme="dark"]{
  color-scheme:dark;
  --bg:#111713;
  --bg-soft:#18211B;
  --surface:#1C2720;
  --surface-raised:#263229;
  --surface-elevated:#2D3A30;
  --line:rgba(205,219,202,.20);
  --text:#F0F2E9;
  --muted:#B8C3B5;
  --subtle:#9EAA9F;
  --accent:#A9BC9D;
  --accent-strong:#CBD9BE;
  --accent-ink:#1C2A20;
  --gold:#D5BD8C;
  --danger:#E6A09A;
  --success:#8FC59A;
  --info:#9BC7DA;
  --shadow:0 22px 58px rgba(0,0,0,.24);
  --panel:var(--surface);
  --panel2:var(--surface-raised);
  --mint:var(--accent);
  --mint2:var(--accent-strong);
  --border:var(--line);
  --pv-pattern:rgba(202,214,193,.035);
  --pv-orbit:rgba(215,189,141,.13);
}
html[data-theme="light"]{
  color-scheme:light;
  --bg:#F3F2EB;
  --bg-soft:#E9EDE5;
  --surface:#FFFEFA;
  --surface-raised:#F5F7F1;
  --surface-elevated:#FFFFFF;
  --line:#CDD7CC;
  --text:#202820;
  --muted:#4B594E;
  --subtle:#5E6B60;
  --accent:#426B49;
  --accent-strong:#2F5838;
  --accent-ink:#FFFFFF;
  --gold:#765C2F;
  --danger:#9D3D37;
  --success:#2F6C43;
  --info:#315F78;
  --shadow:0 20px 52px rgba(37,49,38,.085);
  --panel:var(--surface);
  --panel2:var(--surface-raised);
  --mint:var(--accent);
  --mint2:var(--accent-strong);
  --border:var(--line);
  --pv-pattern:rgba(63,83,59,.028);
  --pv-orbit:rgba(165,111,80,.10);
}
html,body{background-color:var(--bg);color:var(--text)}
body{
  background:
    radial-gradient(ellipse at 8% -8%,color-mix(in srgb,var(--accent) 9%,transparent),transparent 34%),
    radial-gradient(ellipse at 96% 14%,color-mix(in srgb,var(--gold) 5%,transparent),transparent 29%),
    linear-gradient(180deg,var(--bg) 0%,var(--bg-soft) 100%)!important;
  color:var(--text)!important;
}
body:before{opacity:.22!important;background:repeating-linear-gradient(135deg,transparent 0 154px,var(--pv-pattern) 155px,transparent 156px 310px)!important}
body:after{opacity:.22!important;border-color:var(--pv-orbit)!important}
#main-content{color:var(--text)}
#main-content :is(h1,h2,h3,h4,h5,h6,.pv-managed-title,.showcase-section-heading){color:var(--text)}
#main-content :is(p,li,dd,figcaption,.muted,.pv-field-help,.growth-footnote,.studio-section-copy){color:var(--muted)}
#main-content :is(.eyebrow,.pv-overline,.pv-label,.studio-card-kicker,.studio-nav-label,.growth-panel-head>div>span,.support-aside-index,.pv-case-chapters-label){color:var(--accent-strong)}
#main-content a:not(.btn):not(.pv-button):not(.nav-cta){color:var(--accent-strong);text-underline-offset:3px}
#main-content a:not(.btn):not(.pv-button):not(.nav-cta):hover{color:var(--gold)}
#main-content hr{border:0;border-top:1px solid var(--line)}
::selection{background:color-mix(in srgb,var(--accent) 35%,transparent);color:var(--text)}
:where(button,a,input,select,textarea,[tabindex]):focus-visible{outline:3px solid color-mix(in srgb,var(--accent) 72%,transparent)!important;outline-offset:3px!important}

/* Shared navigation and action controls */
.site-nav{
  background:color-mix(in srgb,var(--surface) 94%,transparent)!important;
  border-color:var(--line)!important;
  box-shadow:0 12px 34px color-mix(in srgb,var(--text) 7%,transparent)!important;
  backdrop-filter:blur(18px);
}
.brand-copy strong,.nav-primary a,.nav-actions a,.nav-more>summary{color:var(--text)}
.nav-primary>a:hover,.nav-actions>a:hover,.nav-more>summary:hover,.nav-more-menu a:hover{
  background:var(--surface-raised)!important;color:var(--text)!important
}
.nav-more-menu{
  background:var(--surface-elevated)!important;border-color:var(--line)!important;
  box-shadow:var(--shadow)!important
}
.nav-more-menu a{color:var(--text)!important}
.nav-primary>a[aria-current="page"],.nav-actions>a[aria-current="page"],.nav-more-menu a[aria-current="page"],.nav-more.has-current>summary{
  background:color-mix(in srgb,var(--accent) 14%,var(--surface))!important;
  color:var(--text)!important;border-color:color-mix(in srgb,var(--accent) 32%,var(--line))!important
}
.nav-cta,.btn:not(.btn-secondary):not(.btn-ghost),.pv-button:not(.pv-button-light):not(.pv-button-dark){
  background:var(--accent)!important;color:var(--accent-ink)!important;
  border:1px solid var(--accent)!important;box-shadow:0 8px 22px color-mix(in srgb,var(--accent) 18%,transparent)
}
.nav-cta:hover,.btn:not(.btn-secondary):not(.btn-ghost):hover,.pv-button:not(.pv-button-light):not(.pv-button-dark):hover{
  background:var(--accent-strong)!important;color:var(--accent-ink)!important;
  border-color:var(--accent-strong)!important;transform:translateY(-1px)
}
.btn-secondary,.btn-ghost,.theme-toggle,.nav-toggle,.nav-action-button,.favorite-btn,.shortlist-btn,.pv-button-light,.pv-button-dark{
  background:var(--surface-raised)!important;color:var(--text)!important;
  border:1px solid var(--line)!important;box-shadow:none!important
}
.btn-secondary:hover,.btn-ghost:hover,.theme-toggle:hover,.nav-toggle:hover,.nav-action-button:hover,.favorite-btn:hover,.shortlist-btn:hover,.pv-button-light:hover,.pv-button-dark:hover{
  background:var(--surface-elevated)!important;color:var(--text)!important;border-color:var(--accent)!important
}
.btn-ghost{background:transparent!important}
.btn:disabled,.pv-button:disabled,button:disabled{opacity:.55;cursor:not-allowed;transform:none!important}
.tag,.pill-count,.designer-card-badge,.designer-card-availability,.pv-project-status,.pv-live-indicator,.studio-status,.pv-activity-status,.pv-upload-status,.pv-board-order-status{
  border-color:var(--line);background:var(--surface-raised);color:var(--muted)
}

/* Shared cards and content surfaces across every page family */
#main-content :is(
  .card,.stat,.feature-item,.trust-item,.hero-panel,.search-panel,.work,
  .studio-sidebar,.studio-panel,.studio-editor-section,.studio-story-editor,
  .studio-preview,.studio-performance-card,.studio-top-project,.studio-kpis article,
  .growth-panel,.growth-intelligence,.growth-empty,.growth-kpis article,
  .pv-client-card,.pv-project-list-card,.pv-client-confirmation,.pv-invite-pending,
  .support-channel,.support-form-card,.support-note,.support-success,.support-admin-ticket,
  .pv-faq-list details,.pv-collection-create,.pv-collection-live-preview,
  .pv-collection-steps,.pv-collection-stats,.pv-collection-private-note,
  .pv-board-order-editor,.pv-selected-work-card,.pv-case-chapters,
  .shortlist-table-wrap,.shortlist-toolbar,.empty-state,.home-carousel,
  .showcase-jumpnav,.pv-studio-setup,.pv-studio-setup-task,.pv-project-notice,
  .pv-spotlight-card,.pv-upload-preview-card
){
  background:linear-gradient(145deg,var(--surface-raised),var(--surface))!important;
  color:var(--text);
  border-color:var(--line)!important;
  box-shadow:0 12px 32px color-mix(in srgb,var(--text) 4%,transparent);
}
#main-content :is(.card,.stat,.feature-item,.trust-item,.hero-panel,.search-panel,.studio-sidebar,.studio-panel,.studio-editor-section,.studio-story-editor,.studio-preview,.studio-performance-card,.studio-top-project,.studio-kpis article,.growth-panel,.growth-intelligence,.growth-empty,.growth-kpis article,.pv-client-card,.pv-project-list-card,.pv-client-confirmation,.pv-invite-pending,.support-channel,.support-form-card,.support-note,.support-success,.support-admin-ticket,.pv-faq-list details,.pv-collection-create,.pv-collection-live-preview,.pv-collection-steps,.pv-collection-stats,.pv-collection-private-note,.pv-board-order-editor,.pv-selected-work-card,.pv-case-chapters,.shortlist-table-wrap,.shortlist-toolbar,.empty-state,.home-carousel,.showcase-jumpnav,.pv-studio-setup,.pv-studio-setup-task,.pv-project-notice,.pv-spotlight-card,.pv-upload-preview-card) :is(h1,h2,h3,h4,h5,h6,strong,b,summary){
  color:var(--text)
}
#main-content :is(.card,.stat,.feature-item,.trust-item,.hero-panel,.search-panel,.studio-sidebar,.studio-panel,.studio-editor-section,.studio-story-editor,.studio-preview,.studio-performance-card,.studio-top-project,.studio-kpis article,.growth-panel,.growth-intelligence,.growth-empty,.growth-kpis article,.pv-client-card,.pv-project-list-card,.pv-client-confirmation,.pv-invite-pending,.support-channel,.support-form-card,.support-note,.support-success,.support-admin-ticket,.pv-faq-list details,.pv-collection-create,.pv-collection-live-preview,.pv-collection-steps,.pv-collection-stats,.pv-collection-private-note,.pv-board-order-editor,.pv-selected-work-card,.pv-case-chapters,.shortlist-table-wrap,.shortlist-toolbar,.empty-state,.home-carousel,.showcase-jumpnav,.pv-studio-setup,.pv-studio-setup-task,.pv-project-notice,.pv-spotlight-card,.pv-upload-preview-card) :is(p,li,small,figcaption,dt,dd,.muted,.description,.help-text){
  color:var(--muted)!important
}
#main-content .card{border-radius:18px}
#main-content .stat,#main-content .feature-item,#main-content .trust-item{border-radius:16px}
#main-content .studio-panel,#main-content .growth-panel,#main-content .pv-client-card{border-radius:18px}
#main-content .empty-state{border-style:dashed!important}
#main-content .work{overflow:hidden;border-radius:16px}
#main-content .work img{background:var(--bg-soft)}
#main-content .pv-project-list-card{border-radius:13px}
#main-content .pv-activity-item{border-color:var(--line)}
#main-content .pv-activity-marker,#main-content .pv-stage-dot{background:var(--surface-raised);color:var(--accent-strong);border:1px solid var(--line)}
#main-content .pv-stage-dot{box-shadow:0 0 0 4px var(--surface)}
#main-content .pv-project-stage.is-current .pv-stage-dot{background:var(--accent);color:var(--accent-ink);border-color:var(--accent)}
#main-content .pv-project-stage.is-done .pv-stage-dot{background:var(--success);color:#fff;border-color:var(--success)}
#main-content .pv-project-notice{border-left:3px solid var(--accent)!important}
#main-content .pv-live-indicator{color:var(--success)!important}
#main-content .pv-project-status.status-completed{color:var(--success);border-color:color-mix(in srgb,var(--success) 48%,var(--line))}
#main-content .pv-project-status.status-cancelled{color:var(--danger);border-color:color-mix(in srgb,var(--danger) 42%,var(--line))}

/* Homepage, category, directory, profile and portfolio */
#main-content .pv-category-grid .home-category{color:var(--text);border-color:var(--line)}
#main-content .home-category span,#main-content .home-category small{color:var(--muted)}
#main-content .home-category>b{color:var(--accent-strong)}
#main-content .pv-manifesto{color:var(--text)}
#main-content .pv-manifesto-index,#main-content .pv-manifesto-copy>p{color:var(--muted)}
#main-content .pv-manifesto-points{border-color:var(--line)}
#main-content .pv-manifesto-points div{border-color:var(--line);color:var(--text)}
#main-content .pv-manifesto-points b{color:var(--accent-strong)}
#main-content .designer-card{
  background:linear-gradient(155deg,var(--surface-elevated),var(--surface))!important;
  border-color:var(--line)!important;box-shadow:0 14px 36px color-mix(in srgb,var(--text) 6%,transparent)!important
}
#main-content .designer-card-heading h2,#main-content .designer-card-price strong{color:var(--text)}
#main-content .designer-card-heading p,#main-content .designer-card-bio,#main-content .designer-card-price span,#main-content .designer-card-price small{color:var(--muted)}
#main-content .designer-card-availability,#main-content .designer-card-skills span{background:var(--surface-raised);color:var(--muted);border-color:var(--line)}
#main-content .designer-card-badge.is-featured{background:color-mix(in srgb,var(--gold) 13%,var(--surface));color:var(--gold);border-color:color-mix(in srgb,var(--gold) 42%,var(--line))}
#main-content .designer-card-badge.is-verified,#main-content .designer-card-availability.is-open{background:color-mix(in srgb,var(--success) 12%,var(--surface));color:var(--success);border-color:color-mix(in srgb,var(--success) 42%,var(--line))}
#main-content .designer-card .favorite-btn,#main-content .designer-card .shortlist-btn{background:var(--surface-raised)!important;color:var(--text)!important;border-color:var(--line)!important}
#main-content .designer-card .shortlist-btn[aria-pressed="true"]{background:color-mix(in srgb,var(--accent) 16%,var(--surface))!important;color:var(--accent-strong)!important;border-color:var(--accent)!important}
#main-content .designer-card .favorite-btn[aria-pressed="true"]{background:color-mix(in srgb,var(--danger) 12%,var(--surface))!important;color:var(--danger)!important;border-color:var(--danger)!important}
#main-content .showcase-availability{color:var(--muted);border-color:var(--line)}
#main-content .showcase-availability.is-open{color:var(--success)}
#main-content .pv-collection-summary,#main-content .pv-collection-private-note{color:var(--muted)}
#main-content .pv-collection-work{background:var(--surface)!important;border-color:var(--line)!important}
#main-content .pv-collection-work-caption{color:var(--text)}
#main-content .pv-collection-work-caption small{color:var(--muted)}
#main-content .pv-work-filter-chip{background:var(--surface-raised);color:var(--muted);border-color:var(--line)}
#main-content .pv-work-filter-chip[aria-pressed="true"]{background:color-mix(in srgb,var(--accent) 15%,var(--surface));color:var(--accent-strong);border-color:var(--accent)}
#main-content .pv-filter-panel,#main-content .pv-discovery-filters{background:var(--surface)!important;border-color:var(--line)!important}
#main-content .pv-filter-toggle{color:var(--text)}
#main-content .pv-filter-count{background:var(--accent);color:var(--accent-ink)}
#main-content .pv-case-chapters{background:var(--surface)!important}
#main-content .pv-case-chapters-label{color:var(--accent-strong)}

/* Designer Studio, analytics, content management and forms */
#main-content .studio-sidebar{background:var(--surface)!important}
#main-content .studio-sidebar-brand{color:var(--text);border-color:var(--line)}
#main-content .studio-sidebar-brand>span{background:var(--accent);color:var(--accent-ink)}
#main-content .studio-sidebar-profile{background:var(--surface-raised);border:1px solid var(--line);color:var(--text)}
#main-content .studio-nav a,#main-content .studio-sidebar-bottom a{color:var(--muted)}
#main-content .studio-nav a:hover,#main-content .studio-sidebar-bottom a:hover{background:var(--surface-raised);color:var(--text)}
#main-content .studio-nav a[aria-current="page"],#main-content .studio-nav a.is-active{background:color-mix(in srgb,var(--accent) 14%,var(--surface));color:var(--accent-strong);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--accent) 25%,transparent)}
#main-content .studio-kpis article,#main-content .growth-kpis article{background:var(--surface)!important;border-color:var(--line)!important}
#main-content .studio-kpis article>span,#main-content .growth-kpis small{color:var(--muted)}
#main-content .studio-kpis article strong,#main-content .growth-kpis strong{color:var(--text)}
#main-content .studio-field,#main-content .studio-editor-section,#main-content .studio-story-editor,#main-content .studio-preview,#main-content .studio-performance-card,#main-content .studio-top-project{
  background:var(--surface)!important;border-color:var(--line)!important;color:var(--text)
}
#main-content .studio-editor-heading,#main-content .studio-content-heading,#main-content .growth-panel-head{border-color:var(--line)}
#main-content .studio-toggle{background:var(--surface-raised);border-color:var(--line);color:var(--text)}
#main-content .studio-toggle[aria-pressed="true"],#main-content .studio-toggle.is-active{background:color-mix(in srgb,var(--accent) 18%,var(--surface));color:var(--accent-strong);border-color:var(--accent)}
#main-content .growth-ranking-row,#main-content .growth-category-row,#main-content .growth-source-list li{border-color:var(--line);color:var(--text)}
#main-content .growth-ranking-row small,#main-content .growth-category-row small{color:var(--muted)}
#main-content .growth-funnel-step>i,#main-content .growth-bar-row i{background:var(--surface-raised)}
#main-content .growth-funnel-step>i>i,#main-content .growth-bar-row i>i{background:var(--accent)}
#main-content .pv-studio-setup-track{background:var(--surface-raised)}
#main-content .pv-studio-setup-track>span{background:var(--accent)}
#main-content .pv-studio-setup-check{background:color-mix(in srgb,var(--success) 15%,var(--surface));color:var(--success)}
#main-content .pv-upload-dropzone{background:var(--surface-raised);border-color:var(--line);color:var(--text)}
#main-content .pv-upload-status{color:var(--muted)}
#main-content .pv-field-help{color:var(--muted)}
#main-content label{color:var(--text)}
#main-content input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="file"]),
#main-content select,#main-content textarea{
  background:var(--surface-elevated)!important;color:var(--text)!important;
  border:1px solid var(--line)!important;border-radius:11px;
  box-shadow:inset 0 1px 2px color-mix(in srgb,var(--text) 3%,transparent)
}
#main-content input::placeholder,#main-content textarea::placeholder{color:var(--subtle)!important;opacity:1}
#main-content select option{background:var(--surface-elevated);color:var(--text)}
#main-content input:focus,#main-content select:focus,#main-content textarea:focus{border-color:var(--accent)!important;box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 17%,transparent)}
#main-content input[type="checkbox"],#main-content input[type="radio"]{accent-color:var(--accent)}
#main-content input[type="file"]{color:var(--muted)}
#main-content input[type="file"]::file-selector-button{background:var(--surface-raised);color:var(--text);border:1px solid var(--line);border-radius:8px;padding:8px 11px;margin-right:10px}

/* Tables, data grids and status feedback */
#main-content table{width:100%;border-collapse:separate;border-spacing:0;background:var(--surface);color:var(--text);border:1px solid var(--line);border-radius:14px;overflow:hidden}
#main-content thead th,#main-content th{background:var(--surface-raised);color:var(--text);font-weight:800}
#main-content td{background:var(--surface);color:var(--muted)}
#main-content th,#main-content td{border-color:var(--line);padding:11px 13px}
#main-content tbody tr:hover td{background:color-mix(in srgb,var(--accent) 5%,var(--surface))}
#main-content .shortlist-table-wrap{overflow-x:auto}
#main-content .shortlist-table{min-width:620px}
#main-content .shortlist-table th{color:var(--text)}
#main-content .status,#main-content .studio-status{color:var(--muted)}
#main-content .status-completed{color:var(--success)}
#main-content .status-cancelled{color:var(--danger)}
#main-content .pv-toast-region{background:var(--surface-elevated);border-color:var(--line);color:var(--text);box-shadow:var(--shadow)}
#main-content .pv-project-notice[role="status"]{color:var(--text)}
#main-content .support-ticket-id{background:var(--surface-raised);border-color:var(--line);color:var(--text)}

/* Dialogs, quick views, command palette and lightbox */
#main-content :is(.pv-command-dialog,.pv-quick-view-dialog){
  background:var(--surface-elevated)!important;color:var(--text)!important;border-color:var(--line)!important;box-shadow:0 32px 100px rgba(0,0,0,.32)
}
#main-content .pv-command-head,#main-content .pv-quick-view-head{border-color:var(--line)}
#main-content .pv-command-label{color:var(--accent-strong)}
#main-content .pv-command-items a,#main-content .pv-command-items button{color:var(--text);border-color:var(--line)}
#main-content .pv-command-items a:hover,#main-content .pv-command-items button:hover{background:var(--surface-raised)}
#main-content .pv-quick-view-meta{color:var(--muted)}
#main-content .pv-quick-view-skill{background:var(--surface-raised);color:var(--muted);border-color:var(--line)}
#main-content .pv-command-close,#main-content .pv-quick-view-close{background:var(--surface-raised);color:var(--text);border-color:var(--line)}
#main-content dialog::backdrop{background:rgba(4,8,5,.62);backdrop-filter:blur(7px)}

/* Keep intentionally art-directed dark editorial panels dark in both themes. */
#main-content :is(.pv-hero,.pv-join,.shortlist-hero,.profile-hero,.designer-card-cover){
  color:#F0F2E9!important;border-color:#465448!important
}
#main-content .pv-hero,#main-content .pv-join,#main-content .shortlist-hero,#main-content .profile-hero{
  background:linear-gradient(122deg,#202D23 0%,#304233 58%,#202B22 100%)!important
}
#main-content :is(.pv-hero,.pv-join,.shortlist-hero,.profile-hero) :is(h1,h2,h3,h4,strong,b,.eyebrow,.pv-overline,.pv-label){color:#F0F2E9!important}
#main-content :is(.pv-hero,.pv-join,.shortlist-hero,.profile-hero) :is(p,li,small,.muted,.pv-hero-foot,.pv-index-heading,.pv-index-total){color:#D0D9CD!important}
#main-content :is(.pv-hero,.pv-join,.shortlist-hero,.profile-hero) :is(a:not(.btn):not(.pv-button),.pv-text-link){color:#E5EBDD!important}
#main-content :is(.pv-hero,.pv-join,.shortlist-hero,.profile-hero) :is(a:not(.btn):not(.pv-button),.pv-text-link):hover{color:#F0D8A7!important}
#main-content .pv-hero .pv-button-dark,#main-content .pv-hero .pv-button-light,#main-content .pv-join .pv-button-light{
  background:#F0EFE5!important;color:#26372A!important;border-color:#F0EFE5!important
}
#main-content .pv-collection-cover{color:#fff}
#main-content .pv-collection-cover-copy :is(h1,h2,h3,p,small,.eyebrow){color:#fff!important}
#main-content .designer-card-cover :is(span,b,i){color:#F0F2E9}
.foot{
  background:#202820!important;color:#EEEADD!important;border-color:#465347!important;
  box-shadow:0 22px 54px rgba(0,0,0,.12)!important
}
.foot :is(h1,h2,h3,h4,strong,b){color:#F0EDDF!important}
.foot :is(p,small,li,.muted,.footer-bottom){color:#D0D8CB!important}
.foot a{color:#E1E6D9!important}
.foot a:hover{color:#F0D8A7!important}

/* Light Mode: remove legacy low-contrast grey panels and pale secondary text. */
html[data-theme="light"] #main-content :is(.card,.stat,.feature-item,.trust-item,.hero-panel,.search-panel,.studio-sidebar,.studio-panel,.studio-editor-section,.studio-story-editor,.studio-preview,.studio-performance-card,.studio-top-project,.studio-kpis article,.growth-panel,.growth-intelligence,.growth-empty,.growth-kpis article,.pv-client-card,.pv-project-list-card,.pv-client-confirmation,.pv-invite-pending,.support-channel,.support-form-card,.support-note,.support-success,.support-admin-ticket,.pv-faq-list details,.pv-collection-create,.pv-collection-live-preview,.pv-collection-steps,.pv-collection-stats,.pv-collection-private-note,.pv-board-order-editor,.pv-selected-work-card,.pv-case-chapters,.shortlist-table-wrap,.shortlist-toolbar,.empty-state,.home-carousel,.showcase-jumpnav,.pv-studio-setup,.pv-studio-setup-task,.pv-project-notice,.pv-spotlight-card,.pv-upload-preview-card){
  background:linear-gradient(145deg,#FFFFFF 0%,#F6F8F2 100%)!important;
  border-color:#CDD7CC!important;color:#202820!important;
  box-shadow:0 12px 30px rgba(38,52,39,.055)!important
}
html[data-theme="light"] #main-content :is(.card,.stat,.feature-item,.trust-item,.hero-panel,.search-panel,.studio-sidebar,.studio-panel,.studio-editor-section,.studio-story-editor,.studio-preview,.studio-performance-card,.studio-top-project,.studio-kpis article,.growth-panel,.growth-intelligence,.growth-empty,.growth-kpis article,.pv-client-card,.pv-project-list-card,.pv-client-confirmation,.pv-invite-pending,.support-channel,.support-form-card,.support-note,.support-success,.support-admin-ticket,.pv-faq-list details,.pv-collection-create,.pv-collection-live-preview,.pv-collection-steps,.pv-collection-stats,.pv-collection-private-note,.pv-board-order-editor,.pv-selected-work-card,.pv-case-chapters,.shortlist-table-wrap,.shortlist-toolbar,.empty-state,.home-carousel,.showcase-jumpnav,.pv-studio-setup,.pv-studio-setup-task,.pv-project-notice,.pv-spotlight-card,.pv-upload-preview-card) :is(h1,h2,h3,h4,h5,h6,strong,b,summary){
  color:#202820!important
}
html[data-theme="light"] #main-content :is(.card,.stat,.feature-item,.trust-item,.hero-panel,.search-panel,.studio-sidebar,.studio-panel,.studio-editor-section,.studio-story-editor,.studio-preview,.studio-performance-card,.studio-top-project,.studio-kpis article,.growth-panel,.growth-intelligence,.growth-empty,.growth-kpis article,.pv-client-card,.pv-project-list-card,.pv-client-confirmation,.pv-invite-pending,.support-channel,.support-form-card,.support-note,.support-success,.support-admin-ticket,.pv-faq-list details,.pv-collection-create,.pv-collection-live-preview,.pv-collection-steps,.pv-collection-stats,.pv-collection-private-note,.pv-board-order-editor,.pv-selected-work-card,.pv-case-chapters,.shortlist-table-wrap,.shortlist-toolbar,.empty-state,.home-carousel,.showcase-jumpnav,.pv-studio-setup,.pv-studio-setup-task,.pv-project-notice,.pv-spotlight-card,.pv-upload-preview-card) :is(p,li,small,figcaption,dt,dd,.muted,.description,.help-text){
  color:#4B594E!important
}
html[data-theme="light"] #main-content :is(.pv-overline,.pv-label,.eyebrow,.studio-card-kicker,.studio-nav-label,.growth-panel-head>div>span,.support-aside-index,.pv-case-chapters-label){color:#315B39!important}
html[data-theme="light"] #main-content :is(input,select,textarea){background:#FFFFFF!important;color:#202820!important;border-color:#C5D0C4!important}
html[data-theme="light"] #main-content :is(input,textarea)::placeholder{color:#657266!important}
html[data-theme="light"] #main-content .tag,
html[data-theme="light"] #main-content .pill-count,
html[data-theme="light"] #main-content .designer-card-badge,
html[data-theme="light"] #main-content .designer-card-availability,
html[data-theme="light"] #main-content .pv-project-status{
  background:#EDF2E9!important;color:#344C38!important;border-color:#CAD7C8!important
}
html[data-theme="light"] #main-content .designer-card-badge.is-featured{background:#F5EFDF!important;color:#72572B!important;border-color:#DCCB9E!important}
html[data-theme="light"] #main-content .designer-card-badge.is-verified,
html[data-theme="light"] #main-content .designer-card-availability.is-open{background:#E7F1E5!important;color:#2F6940!important;border-color:#BBD1B9!important}
html[data-theme="light"] #main-content .pv-toast-region{background:#FFFFFF!important;color:#202820!important;border-color:#CDD7CC!important}
html[data-theme="light"] #main-content table{background:#FFFFFF!important;color:#202820!important;border-color:#CDD7CC!important}
html[data-theme="light"] #main-content th{background:#EDF2E9!important;color:#263B2B!important}
html[data-theme="light"] #main-content td{background:#FFFFFF!important;color:#4B594E!important}
html[data-theme="light"] #main-content .pv-activity-marker,
html[data-theme="light"] #main-content .pv-stage-dot{background:#EDF2E9!important;color:#315B39!important;border-color:#CAD7C8!important}
html[data-theme="light"] #main-content .pv-project-stage.is-current .pv-stage-dot{background:#426B49!important;color:#fff!important}
html[data-theme="light"] #main-content .pv-project-stage.is-done .pv-stage-dot{background:#2F6C43!important;color:#fff!important}
html[data-theme="light"] #main-content .pv-activity-head strong{color:#202820!important}
html[data-theme="light"] #main-content .pv-activity-head small{color:#5B685D!important}

/* Mobile and narrow-screen consistency */
@media(max-width:900px){
  #main-content .studio-workspace{grid-template-columns:1fr;gap:18px}
  #main-content .studio-sidebar{position:relative;top:auto;min-height:0}
  #main-content .studio-kpis,#main-content .growth-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}
}
@media(max-width:760px){
  .wrap{overflow-x:clip}
  #main-content :is(.pv-client-overview,.pv-faq,.designer-cover,.growth-dashboard-grid,.studio-cms-layout){grid-template-columns:1fr}
  #main-content .pv-client-heading{align-items:flex-start;flex-wrap:wrap}
  #main-content .pv-client-foot{flex-wrap:wrap;gap:12px}
  #main-content .shortlist-table-wrap{max-width:100%}
  #main-content :is(.studio-panels,.studio-performance-grid){grid-template-columns:minmax(0,1fr)}
  #main-content .studio-sidebar{padding:16px}
  #main-content .studio-nav{display:flex;flex-wrap:wrap;gap:6px}
  #main-content .studio-nav a{flex:1 1 130px}
}
@media(max-width:520px){
  #main-content .studio-kpis,#main-content .growth-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}
  #main-content .pv-form-footer{align-items:stretch;flex-direction:column}
  #main-content .pv-form-footer .btn{width:100%}
  #main-content :is(.card,.studio-panel,.growth-panel,.pv-client-card){border-radius:15px}
}
@media(prefers-reduced-motion:reduce){
  html{scroll-behavior:auto}
  *,*:before,*:after{scroll-behavior:auto!important;transition-duration:.01ms!important;animation-duration:.01ms!important;animation-iteration-count:1!important}
}


/* v5.77.0 visual QA corrections — legacy hero overrides and mixed-surface contrast */
html[data-theme="light"] #main-content .pv-hero h1,
html[data-theme="light"] #main-content .pv-hero h1 em,
html[data-theme="light"] #main-content .pv-hero .pv-overline,
html[data-theme="light"] #main-content .pv-hero .pv-label,
html[data-theme="light"] #main-content .pv-hero .pv-hero-lede,
html[data-theme="light"] #main-content .pv-hero .pv-hero-foot,
html[data-theme="light"] #main-content .pv-join .eyebrow,
html[data-theme="light"] #main-content .shortlist-hero .eyebrow,
html[data-theme="light"] #main-content .shortlist-hero h1 em{
  color:#F0F2E9!important;
}
html[data-theme="light"] #main-content .pv-hero .pv-index{
  background:rgba(255,254,248,.96)!important;
  color:#202820!important;
  border-color:#CDD7CC!important;
  box-shadow:0 18px 42px rgba(0,0,0,.12)!important;
}
html[data-theme="light"] #main-content .pv-hero .pv-index :is(span,strong,b,small){
  color:#263B2B!important;
}
html[data-theme="light"] #main-content .pv-hero .pv-index .pv-index-heading,
html[data-theme="light"] #main-content .pv-hero .pv-index .pv-index-metrics{
  color:#526354!important;
}
html[data-theme="light"] #main-content .pv-hero .pv-index-total{
  color:#315B39!important;
}
html[data-theme="light"] #main-content .pv-hero .pv-index-metrics span{
  border-color:#D7DFD4!important;
}
html[data-theme="dark"] #main-content .pv-hero .pv-index{
  background:rgba(19,29,22,.72)!important;
  color:#F0F2E9!important;
  border-color:rgba(205,219,202,.24)!important;
}
html[data-theme="dark"] #main-content .pv-hero .pv-index :is(span,strong,b,small){color:#E7EEE1!important}
html[data-theme="dark"] #main-content .pv-hero .pv-index-total{color:#D7E4C9!important}
html[data-theme="dark"] #main-content .pv-hero :is(h1,h1 em,.pv-overline,.pv-label,.pv-hero-lede,.pv-hero-foot),
html[data-theme="dark"] #main-content .pv-join .eyebrow,
html[data-theme="dark"] #main-content .shortlist-hero :is(.eyebrow,h1 em){color:#F0F2E9!important}


/* Text-fill compatibility: older kinetic headline rules used -webkit-text-fill-color. */
html[data-theme="light"] #main-content .pv-hero h1,
html[data-theme="light"] #main-content .pv-hero h1 em,
html[data-theme="light"] #main-content .pv-hero .pv-overline,
html[data-theme="light"] #main-content .pv-hero .pv-label,
html[data-theme="light"] #main-content .pv-hero .pv-hero-lede,
html[data-theme="light"] #main-content .pv-hero .pv-hero-foot,
html[data-theme="light"] #main-content .pv-hero .pv-hero-bottom,
html[data-theme="light"] #main-content .pv-hero .pv-text-link,
html[data-theme="light"] #main-content .pv-join .eyebrow,
html[data-theme="light"] #main-content .shortlist-hero .eyebrow,
html[data-theme="light"] #main-content .shortlist-hero h1 em{
  -webkit-text-fill-color:#F0F2E9!important;
}
html[data-theme="light"] #main-content .pv-hero .pv-hero-lede,
html[data-theme="light"] #main-content .pv-hero .pv-hero-foot,
html[data-theme="light"] #main-content .pv-hero .pv-hero-bottom{
  color:#D0D9CD!important;-webkit-text-fill-color:#D0D9CD!important;
}
html[data-theme="light"] #main-content .pv-hero .pv-index :is(span,strong,b,small){
  color:#263B2B!important;-webkit-text-fill-color:#263B2B!important;
}
html[data-theme="light"] #main-content .pv-hero .pv-index .pv-index-heading,
html[data-theme="light"] #main-content .pv-hero .pv-index .pv-index-metrics{
  color:#526354!important;-webkit-text-fill-color:#526354!important;
}
html[data-theme="light"] #main-content .pv-hero .pv-index-total{
  color:#315B39!important;-webkit-text-fill-color:#315B39!important;
}
html[data-theme="dark"] #main-content .pv-hero :is(h1,h1 em,.pv-overline,.pv-label,.pv-hero-lede,.pv-hero-foot,.pv-hero-bottom),
html[data-theme="dark"] #main-content .pv-join .eyebrow,
html[data-theme="dark"] #main-content .shortlist-hero :is(.eyebrow,h1 em){
  -webkit-text-fill-color:#F0F2E9!important;
}


/* PIR Visuals v5.78.0 — Light Mode nested-surface contrast repair */
html[data-theme="light"] #main-content .pv-hero .pv-index{
  background:#FFFEFA!important;
  color:#202820!important;
  border-color:#CDD7CC!important;
}
html[data-theme="light"] #main-content .pv-hero .pv-index .pv-index-heading,
html[data-theme="light"] #main-content .pv-hero .pv-index .pv-index-heading span,
html[data-theme="light"] #main-content .pv-hero .pv-index .pv-index-total span,
html[data-theme="light"] #main-content .pv-hero .pv-index .pv-index-metrics small,
html[data-theme="light"] #main-content .pv-hero .pv-index > p{
  color:#4B594E!important;
  -webkit-text-fill-color:#4B594E!important;
}
html[data-theme="light"] #main-content .pv-hero .pv-index .pv-index-total strong,
html[data-theme="light"] #main-content .pv-hero .pv-index .pv-index-metrics b{
  color:#263B2B!important;
  -webkit-text-fill-color:#263B2B!important;
}
html[data-theme="light"] #main-content .pv-hero .pv-index .pv-index-heading{
  font-size:9px;
}
html[data-theme="light"] #main-content .pv-hero .pv-index .pv-index-total span{
  font-size:9px;
  line-height:1.5;
}
html[data-theme="light"] #main-content .pv-hero .pv-index .pv-index-metrics small{
  font-size:8px;
  letter-spacing:.09em;
  font-weight:750;
}
html[data-theme="light"] #main-content .pv-hero .pv-index > p{
  font-size:11px;
  line-height:1.55;
  font-weight:600;
  margin-top:2px;
}
html[data-theme="light"] #main-content .pv-hero .pv-index .pv-index-total{
  border-color:#D7DFD4!important;
}
html[data-theme="light"] #main-content .pv-hero .pv-index .pv-index-metrics{
  border-color:#D7DFD4!important;
}
/* GSAP takes ownership only of nodes it animates; CSS fallback stays intact. */
.pv-gsap-ready [data-pv-gsap-reveal],
.pv-gsap-ready [data-pv-gsap-story],
.pv-gsap-ready [data-pv-gsap-story-item]{
  transition:none!important;
  will-change:transform,opacity;
}
.pv-gsap-ready .pv-home-motion .pv-hero-word,
.pv-gsap-ready .pv-home-motion .pv-overline,
.pv-gsap-ready .pv-home-motion .pv-hero-lede,
.pv-gsap-ready .pv-home-motion .pv-hero-actions,
.pv-gsap-ready .pv-home-motion .pv-hero-foot,
.pv-gsap-ready .pv-home-motion .pv-index{
  animation:none!important;
}
.pv-gsap-ready .pv-home .pv-motion-ribbon-track{
  animation:none!important;
  will-change:transform;
}
@media(max-width:760px){
  .pv-gsap-ready [data-pv-gsap-reveal],
  .pv-gsap-ready [data-pv-gsap-story],
  .pv-gsap-ready [data-pv-gsap-story-item]{will-change:auto}
}
@media(prefers-reduced-motion:reduce){
  .pv-gsap-ready [data-pv-gsap-reveal],
  .pv-gsap-ready [data-pv-gsap-story],
  .pv-gsap-ready [data-pv-gsap-story-item]{transition:none!important;will-change:auto!important}
}

/* PIR Visuals v5.79.0 — motion-safe visual regression repair */
#main-content .category-tile{
  box-shadow:0 14px 30px rgba(18,28,20,.12)!important;
}
#main-content .category-tile .category-tile-top{
  align-items:center;
}
#main-content .category-tile .category-tile-top span{
  display:inline-flex;
  align-items:center;
  min-height:24px;
  padding:6px 10px;
  border-radius:999px;
  background:color-mix(in srgb,var(--cat-bg) 82%,rgba(255,255,255,.14));
  border:1px solid color-mix(in srgb,var(--cat-ink) 18%,transparent);
}
#main-content .category-tile .category-tile-copy p{
  max-width:32ch;
  font-size:12px;
  line-height:1.78;
}
#main-content .category-tile .category-tile-foot>span{
  font-size:7.5px;
  letter-spacing:.12em;
}
#main-content .category-tone-2{--cat-bg:#D5DDD2;--cat-ink:#1E2B22;--cat-muted:#4D5D50;--cat-accent:#456148}
#main-content .category-tone-4{--cat-bg:#E6D3CB;--cat-ink:#2F2523;--cat-muted:#5F4F4A;--cat-accent:#A95542}
#main-content .category-tone-6{--cat-bg:#C7D3D7;--cat-ink:#203036;--cat-muted:#44585D;--cat-accent:#4F7D89}
#main-content .category-tone-9{--cat-bg:#E6E7DB;--cat-ink:#233129;--cat-muted:#506156;--cat-accent:#335542}
html[data-theme="dark"] #main-content .category-tile .category-tile-top span{
  background:color-mix(in srgb,var(--cat-bg) 78%,rgba(255,255,255,.06));
}
#main-content .pv-hero-main{
  min-width:0;
}
#main-content .pv-hero h1{
  max-width:9.6ch;
  text-wrap:balance;
}
#main-content .pv-home-motion .pv-hero h1{
  overflow:visible;
}
#main-content .pv-home-motion .pv-hero-word{
  margin-right:.035em;
}
@media(max-width:1150px){
  #main-content .pv-hero{
    grid-template-columns:minmax(0,1.08fr) minmax(240px,.92fr);
    gap:clamp(24px,4vw,40px);
    padding:clamp(44px,5vw,72px) clamp(22px,4vw,44px) 70px;
  }
  #main-content .pv-hero h1{
    font-size:clamp(50px,6.4vw,76px);
    margin:24px 0 18px;
    line-height:.92;
    max-width:10.2ch;
  }
  #main-content .pv-hero-lede{
    max-width:54ch;
    font-size:14px;
    line-height:1.78;
  }
  #main-content .pv-hero-actions{gap:14px}
  #main-content .pv-hero-foot{margin-top:44px}
  #main-content .pv-index{padding:22px}
  #main-content .pv-index-total{padding:28px 0 22px}
}
@media(max-width:880px){
  #main-content .pv-hero h1{max-width:11ch}
}
html[data-theme="light"] #main-content .support-hero h1{
  max-width:10.2ch;
  text-wrap:balance;
}
html[data-theme="light"] #main-content .support-hero h1 em{
  color:#55775A!important;
}
html[data-theme="light"] #main-content .support-hero-aside{
  padding:24px 22px;
}
html[data-theme="light"] #main-content .support-hero-aside>strong{
  max-width:16ch;
}

/* PIR Visuals v5.80.0 — fix animated hero overlap and stable category hover palettes. */
/* Keep the responsive one-column hero at tablet and split-screen widths. */
#main-content .pv-hero h1{
  max-width:13ch;
  line-height:1.02;
  text-wrap:balance;
  overflow:visible;
}
#main-content .pv-hero-title-visual{
  display:block;
  line-height:inherit;
  overflow:visible;
}
#main-content .pv-home-motion .pv-hero-word{
  display:inline-block;
  vertical-align:baseline;
  line-height:inherit;
  padding-block:0;
  margin-block:0;
  margin-right:.035em;
}
@media(max-width:1180px){
  #main-content .pv-hero{
    min-height:0!important;
    grid-template-columns:minmax(0,1fr)!important;
    align-items:stretch!important;
    gap:clamp(28px,5vw,48px)!important;
    padding:clamp(44px,7vw,76px) clamp(26px,5vw,64px) 88px!important;
  }
  #main-content .pv-hero-main{
    max-width:900px!important;
  }
  #main-content .pv-hero h1{
    max-width:14ch!important;
    font-size:clamp(56px,7.4vw,88px)!important;
    line-height:1.02!important;
    margin:clamp(22px,3vw,32px) 0 22px!important;
  }
  #main-content .pv-index{
    max-width:560px!important;
    justify-self:end!important;
  }
  #main-content .pv-hero-foot{
    margin-top:clamp(34px,5vw,52px)!important;
  }
}
@media(max-width:600px){
  #main-content .pv-hero{
    padding:40px 21px 78px!important;
    gap:27px!important;
  }
  #main-content .pv-hero h1{
    max-width:13ch!important;
    font-size:clamp(44px,11.8vw,70px)!important;
    line-height:1.04!important;
    margin:22px 0 18px!important;
  }
  #main-content .pv-hero-lede{
    font-size:14px!important;
    line-height:1.7!important;
  }
}

/* A category keeps its own palette in every pointer, keyboard, and visited state. */
#main-content .category-tile,
#main-content .category-tile:visited,
#main-content .category-tile:hover,
#main-content .category-tile:active,
#main-content .category-tile:focus-visible{
  color:var(--cat-ink)!important;
  background-color:var(--cat-bg)!important;
  border-color:color-mix(in srgb,var(--cat-ink) 24%,transparent)!important;
  filter:none!important;
  text-decoration:none!important;
}
#main-content .category-tile{
  transition:transform .25s ease,box-shadow .25s ease!important;
}
#main-content .category-tile:hover{
  transform:translateY(-3px);
  box-shadow:0 18px 38px rgba(12,20,14,.15)!important;
}
#main-content .category-tile .category-tile-top,
#main-content .category-tile .category-tile-copy p,
#main-content .category-tile .category-tile-foot>span{
  color:var(--cat-muted)!important;
  -webkit-text-fill-color:var(--cat-muted)!important;
}
#main-content .category-tile .category-tile-copy h2,
#main-content .category-tile .category-tile-copy h3,
#main-content .category-tile .category-tile-foot>b{
  color:var(--cat-ink)!important;
  -webkit-text-fill-color:var(--cat-ink)!important;
}
#main-content .category-tile .category-tile-art>span{
  color:var(--cat-accent)!important;
  -webkit-text-fill-color:var(--cat-accent)!important;
  transition:transform .5s var(--pv-motion-ease)!important;
}
#main-content .category-tile:hover .category-tile-art>span{
  transform:translate3d(0,-4px,0) rotate(-4deg) scale(1.045);
}
#main-content .category-tile .category-tile-top span{
  background:color-mix(in srgb,var(--cat-bg) 82%,rgba(255,255,255,.14))!important;
  border-color:color-mix(in srgb,var(--cat-ink) 18%,transparent)!important;
  color:var(--cat-muted)!important;
  -webkit-text-fill-color:var(--cat-muted)!important;
  transition:none!important;
}
#main-content .category-tile:hover .category-tile-top span{
  background:color-mix(in srgb,var(--cat-bg) 82%,rgba(255,255,255,.14))!important;
  color:var(--cat-muted)!important;
  -webkit-text-fill-color:var(--cat-muted)!important;
}
#main-content .category-tile .category-tile-copy *,
#main-content .category-tile .category-tile-foot>*{
  transition:none!important;
}

/* PIR Visuals v5.80.2 — preserve category palettes and strengthen hero CTA contrast. */
#main-content .pv-hero .pv-hero-actions > .pv-button.pv-button-dark{
  background:#F0EFE5!important;
  color:#26372A!important;
  -webkit-text-fill-color:#26372A!important;
  border:1px solid #D8D8C9!important;
  min-height:48px!important;
  padding:14px 20px!important;
  font-size:12px!important;
  line-height:1.25!important;
  font-weight:850!important;
  letter-spacing:.01em!important;
  opacity:1!important;
  filter:none!important;
  text-shadow:none!important;
}
#main-content .pv-hero .pv-hero-actions > .pv-button.pv-button-dark :is(span){
  color:#26372A!important;
  -webkit-text-fill-color:#26372A!important;
  opacity:1!important;
}
#main-content .pv-hero .pv-hero-actions > .pv-button.pv-button-dark:hover{
  background:#FFFFFF!important;
  color:#26372A!important;
  -webkit-text-fill-color:#26372A!important;
  border-color:#C9D0C5!important;
}


/* PIR Visuals v5.80.5 — compact checkbox sizing and verification form spacing. */
#main-content input[type="checkbox"],
#main-content input[type="radio"]{
  appearance:auto!important;
  -webkit-appearance:auto!important;
  width:18px!important;
  height:18px!important;
  min-width:18px!important;
  min-height:18px!important;
  max-width:18px!important;
  max-height:18px!important;
  padding:0!important;
  margin:0!important;
  border-radius:4px!important;
  box-shadow:none!important;
  outline-offset:2px;
  accent-color:var(--accent);
  flex:0 0 18px;
  vertical-align:middle;
  cursor:pointer;
}
#main-content .filter-row label{
  display:inline-flex!important;
  flex-direction:row!important;
  align-items:center!important;
  justify-content:flex-start;
  gap:8px!important;
  width:auto!important;
  min-height:32px;
  line-height:1.3;
  white-space:nowrap;
}
#main-content .filter-row input[type="checkbox"]{
  display:inline-block!important;
  flex:0 0 18px!important;
}
#main-content .pv-resend-verification-form{
  display:grid;
  grid-template-columns:minmax(0,1fr);
  gap:9px;
  width:100%;
}
#main-content .pv-resend-verification-form>label{
  margin:0;
}
#main-content .pv-resend-verification-controls{
  display:grid;
  grid-template-columns:minmax(0,1fr) max-content;
  align-items:center;
  gap:12px;
  width:100%;
}
#main-content .pv-resend-verification-controls input[type="email"]{
  display:block;
  width:100%;
  min-width:0;
  margin:0!important;
}
#main-content .pv-resend-verification-controls button{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  min-height:44px;
  margin:0!important;
  white-space:nowrap;
}
@media(max-width:480px){
  #main-content .pv-resend-verification-controls{
    grid-template-columns:minmax(0,1fr);
    gap:10px;
  }
  #main-content .pv-resend-verification-controls button{
    justify-self:start;
  }
}

/* PIR Visuals v5.80.6 — remove the nested frame around discovery filters. */
#main-content>.pv-discovery-shell{
  margin:clamp(22px,3vw,38px) 0!important;
  padding:0!important;
  border:0!important;
  border-radius:0!important;
  background:transparent!important;
  box-shadow:none!important;
}
#main-content>.pv-discovery-shell>.section-head{
  margin:0 0 18px!important;
}
#main-content>.pv-discovery-shell>.pv-discovery-filters{
  margin:0!important;
  padding:0!important;
  border:0!important;
  border-radius:0!important;
  background:transparent!important;
  box-shadow:none!important;
}
#main-content>.pv-discovery-shell>.pv-discovery-filters .pv-filter-panel{
  border:0!important;
  background:transparent!important;
  box-shadow:none!important;
}



/* PIR Visuals v5.83.0 — consistent feedback for native form and copy actions */
.pv-action-status{display:inline-block;margin:6px 0 0 10px;font-size:12px;line-height:1.45;color:var(--muted);vertical-align:middle}
.pv-action-status.is-error{color:var(--danger,var(--text))}
.pv-form-submit-status{display:block;flex-basis:100%;margin-top:8px;font-size:12px;line-height:1.45;color:var(--muted)}
.pv-form-submitting button.pv-submit-locked,.pv-form-submitting button[type=submit],.pv-form-submitting button:not([type]),.pv-form-submitting input[type=submit]{pointer-events:none;opacity:.78;cursor:progress}
.pv-submit-locked:after{content:"";display:inline-block;width:11px;height:11px;margin-inline-start:9px;vertical-align:-1px;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;animation:pv-submit-spin .7s linear infinite}
@media(prefers-reduced-motion:reduce){.pv-submit-locked:after{animation:none;border-right-color:currentColor}}
/* PIR Visuals v5.81.0 — universal navigation state, safe-area and responsive hardening */
.site-nav{isolation:isolate}
.site-nav>.brand{min-width:0;flex:0 1 auto}
.site-nav>.brand .brand-copy{min-width:0}
.nav-links,.nav-primary,.nav-actions{min-width:0}
.nav-links a,.nav-more>summary,.nav-more-menu a{overflow-wrap:anywhere}
.nav-primary>a:focus-visible,.nav-more>summary:focus-visible,.nav-more-menu a:focus-visible,.nav-actions a:focus-visible,.nav-action-button:focus-visible,.nav-toggle:focus-visible{outline:2px solid var(--pv-focus,var(--accent-strong));outline-offset:3px}
@media(max-width:1180px){
  .site-nav{position:sticky;z-index:240}
  .nav-links{left:auto!important;right:0!important;width:min(440px,calc(100vw - 28px - env(safe-area-inset-left,0px) - env(safe-area-inset-right,0px)))!important;max-width:calc(100vw - 24px)!important;max-height:min(78dvh,calc(100dvh - 104px));overflow-x:hidden!important;overflow-y:auto!important;overscroll-behavior:contain;touch-action:pan-y;scrollbar-gutter:stable;padding-bottom:max(12px,env(safe-area-inset-bottom,0px))}
  .nav-links.open{z-index:241;pointer-events:auto}
  .nav-primary>a,.nav-more>summary,.nav-more-menu a,.nav-actions .nav-action-button,.nav-actions .nav-cta{min-height:44px}
}
@media(max-width:600px){
  .site-nav{top:max(7px,env(safe-area-inset-top,0px))}
  .nav-links{max-height:calc(100dvh - 92px - env(safe-area-inset-top,0px));width:calc(100vw - 24px - env(safe-area-inset-left,0px) - env(safe-area-inset-right,0px))!important}
  .nav-links.open{animation:pv-menu-enter .22s cubic-bezier(.2,.75,.25,1) both}
}
@media(min-width:1181px){
  .nav-toggle{display:none!important}
  .nav-links{display:flex!important;position:static!important;width:auto!important;max-width:none!important;max-height:none!important;overflow:visible!important;padding-bottom:0!important}
}
@media(max-width:360px){
  .site-nav{gap:8px;flex-wrap:nowrap;align-items:center;padding:8px 10px}
  .site-nav>.brand{gap:8px;flex:1 1 0;min-width:0}
  .site-nav>.brand .brand-emblem{width:36px;height:36px}
  .site-nav>.brand .brand-copy strong{max-width:112px;font-size:12px}
  .site-nav>.brand .brand-copy small{font-size:8px;letter-spacing:.08em}
  .site-nav>.nav-toggle{min-width:76px!important;min-height:40px!important;padding-inline:8px!important;gap:6px!important;font-size:11px}
  .nav-links{max-height:min(78dvh,calc(100dvh - 104px - env(safe-area-inset-top,0px) - env(safe-area-inset-bottom,0px)))!important}
}
@media(prefers-reduced-motion:reduce){.nav-links.open{animation:none!important}.nav-toggle-icon,.nav-more>summary span{transition:none!important}}
.pv-directory-pagination{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;margin:24px 0 42px;padding:16px 0;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.pv-directory-page-summary{font-size:13px;color:var(--muted);font-weight:650}
.pv-directory-page-links{display:flex;align-items:center;justify-content:flex-end;gap:7px;flex-wrap:wrap}
.pv-directory-page-links .btn{min-width:42px;min-height:42px;padding:9px 12px}
.pv-directory-page-links .pv-page-current{background:var(--accent-strong);color:var(--accent-ink);box-shadow:none;cursor:default}
.pv-directory-filter-error{padding:12px 15px;border:1px solid var(--danger);border-radius:12px;color:var(--danger);background:color-mix(in srgb,var(--danger) 8%,transparent)}
.pv-public-availability{margin:30px 0;padding:24px;border:1px solid var(--line);border-radius:20px;background:var(--surface)}
.pv-public-availability-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-top:16px}
.pv-public-availability-item{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;border:1px solid var(--line);border-radius:12px;background:var(--surface-raised);font-size:13px}
.pv-public-availability-item strong{font-size:12px}
.pv-availability-status{color:var(--muted);font-size:11px}
.pv-hybrid-workspace-note{margin-top:12px;padding:14px 16px;border:1px solid var(--line);border-radius:14px;background:var(--surface-raised)}
.pv-hybrid-workspace-note p{margin:6px 0 0;color:var(--muted);font-size:13px}
@media(max-width:600px){.pv-directory-pagination{align-items:flex-start;flex-direction:column}.pv-directory-page-links{justify-content:flex-start}.pv-directory-page-links .btn{min-width:38px;padding:8px 10px}.pv-public-availability{padding:17px}}


/* v6.4.0 — guided designer matching and private portfolio readiness */
.pv-match-finder{display:grid;grid-template-columns:minmax(220px,.72fr) minmax(0,1.28fr);gap:20px 28px;margin:28px 0;padding:clamp(18px,2.5vw,28px);border:1px solid var(--line);border-radius:20px;background:radial-gradient(ellipse at 0 0,color-mix(in srgb,var(--accent) 10%,transparent),transparent 52%),var(--surface);box-shadow:0 16px 42px rgba(18,28,19,.045)}
.pv-match-finder-copy h2,.pv-portfolio-health-head h2{margin:7px 0 8px;font-size:clamp(22px,3vw,31px);letter-spacing:-.055em;color:var(--text)}
.pv-match-finder-copy p,.pv-portfolio-health-head p{margin:0;color:var(--muted);font-size:12px;line-height:1.75}
.pv-match-finder-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.pv-match-finder-form label{display:grid;gap:6px;min-width:0;color:var(--text);font-size:10px;font-weight:800}
.pv-match-finder-form input,.pv-match-finder-form select{width:100%;min-width:0;min-height:44px;padding:10px 12px;border:1px solid var(--line);border-radius:9px;background:var(--surface-raised);color:var(--text);font:inherit;font-size:12px}
.pv-match-finder-keyword,.pv-match-finder-actions{grid-column:1/-1}
.pv-match-finder-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.pv-match-finder-note,.pv-match-result-note{grid-column:1/-1;margin:0;color:var(--muted);font-size:10px;line-height:1.65}
.pv-match-result-note{margin-top:7px}
.designer-card-match-reasons{display:flex;align-items:center;gap:5px;flex-wrap:wrap;margin-top:9px}
.designer-card-match-reasons small{width:100%;color:var(--subtle);font-size:7px;font-weight:900;letter-spacing:.12em}
.designer-card-match-reasons span{padding:4px 7px;border:1px solid color-mix(in srgb,var(--accent) 24%,var(--line));border-radius:99px;background:color-mix(in srgb,var(--accent) 8%,var(--surface));color:var(--accent-strong);font-size:8px;font-weight:750}
.pv-portfolio-health{margin:0 0 24px;padding:clamp(17px,2.5vw,25px);border:1px solid var(--line);border-radius:16px;background:linear-gradient(125deg,color-mix(in srgb,var(--accent) 8%,var(--surface)),var(--surface) 58%)}
.pv-portfolio-health-head{display:flex;align-items:start;justify-content:space-between;gap:18px}
.pv-health-score{text-align:right;flex:0 0 auto;display:grid;gap:3px}.pv-health-score strong{font-size:clamp(28px,4vw,42px);line-height:1;color:var(--accent-strong);letter-spacing:-.06em}.pv-health-score small{font-size:8px;font-weight:900;letter-spacing:.12em;color:var(--muted)}
.pv-health-track{height:7px;margin:16px 0;border-radius:99px;background:var(--bg-soft);overflow:hidden}.pv-health-track span{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,var(--accent),var(--gold))}
.pv-health-task-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.pv-health-task{display:grid;grid-template-columns:25px minmax(0,1fr) auto;align-items:center;gap:9px;padding:10px;border:1px solid var(--line);border-radius:10px;background:var(--surface-raised);color:var(--text);text-decoration:none}
.pv-health-task-icon{display:grid;place-items:center;width:24px;height:24px;border:1px solid var(--line);border-radius:50%;color:var(--muted);font-size:12px}.pv-health-task.is-complete .pv-health-task-icon{background:var(--accent);border-color:var(--accent);color:var(--accent-ink)}
.pv-health-task>span:nth-child(2){display:grid;gap:3px;min-width:0}.pv-health-task strong{font-size:10px}.pv-health-task small{font-size:9px;color:var(--muted);line-height:1.4}.pv-health-task>b{font-size:9px;color:var(--accent-strong);white-space:nowrap}
.pv-health-disclaimer{margin:13px 0 0;color:var(--muted);font-size:9px;line-height:1.6}
[data-theme=light] .pv-match-finder,[data-theme=light] .pv-portfolio-health{box-shadow:0 12px 32px rgba(40,50,35,.04)}
@media(max-width:760px){.pv-match-finder{grid-template-columns:1fr;gap:15px}.pv-match-finder-form{grid-template-columns:1fr}.pv-match-finder-keyword,.pv-match-finder-actions{grid-column:auto}.pv-health-task-list{grid-template-columns:1fr}}
@media(max-width:440px){.pv-portfolio-health-head{display:block}.pv-health-score{display:flex;align-items:baseline;gap:8px;text-align:left;margin-top:12px}}

</style><style id="pv-showcase-right-details-align">
@media (min-width: 901px) {
  html body #main-content .pv-home-showcase [data-pv-showcase-copy] .pv-showcase-meta strong,
  html body #main-content .pv-home-showcase [data-pv-showcase-copy] .pv-showcase-byline a {
    position: static !important; left: auto !important; transform: none !important;
  }
  html body #main-content .pv-home-showcase [data-pv-showcase-copy] .pv-showcase-byline::before { right: 0 !important; }
}
`);
const shellStylesEtag = '"' + crypto.createHash('sha256').update(shellStyles).digest('hex') + '"';

function pageShell(title, body, branding = null) {
  const seoDescription = String(branding?.description || 'Temukan talenta kreatif, jelajahi portfolio dan hubungi desainer secara langsung.').slice(0, 300);
  const seoImageRaw = String(branding?.ogImage || branding?.avatarUrl || '');
  let seoImage = /^https:\/\//i.test(seoImageRaw) || /^\/(?:media\/[A-Za-z0-9_-]+(?:\/[1-8])?|profile-avatar\/[A-Za-z0-9_-]+(?:\?v=[A-Za-z0-9_.-]+)?)$/.test(seoImageRaw) ? seoImageRaw : '';
  if (seoImage.startsWith('/')) {
    const base = getSiteBase();
    if (base) seoImage = new URL(seoImage, base).href;
  }
  // Platform identity must be consistent on every page, including a designer's public profile.
  // Individual designer names/photos belong in the designer showcase, not in the global logo.
  const brandMarkup = `<a class="brand" href="/" aria-label="PIR Visuals — ke beranda"><img class="brand-emblem" src="/icon.svg?v=6710" alt="" width="44" height="44" loading="eager"><span class="brand-copy"><strong>PIR VISUALS</strong><small>CREATIVE TALENT NETWORK</small></span></a>`;
  return `<!doctype html><html lang="id" data-theme="light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#20372A"><meta name="description" content="${escapeHtml(seoDescription)}">${branding?.noIndex ? '<meta name="robots" content="noindex,nofollow,noarchive">' : ''}<meta property="og:site_name" content="PIR Visuals"><meta property="og:type" content="website"><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(seoDescription)}">${seoImage ? `<meta property="og:image" content="${escapeHtml(seoImage)}">` : ''}<meta name="twitter:card" content="${seoImage ? 'summary_large_image' : 'summary'}"><link rel="manifest" href="/manifest.webmanifest"><link rel="icon" href="/icon.svg?v=6710" type="image/svg+xml"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"><title>${escapeHtml(title)}</title><script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization","name":"PIR Visuals","description":"Creative talent network untuk menemukan desainer dan portfolio kreatif."}</script><link rel="stylesheet" href="/shell.css?v=3670"><link rel="stylesheet" href="/visual-system.css?v=6710"><link rel="stylesheet" href="/editorial-theme.css?v=2"><link rel="stylesheet" href="/company-editorial.css?v=20261114e"><link rel="stylesheet" href="/pir-permanent-theme.css?v=20261114g"><link rel="stylesheet" href="/pir-footer-refinement.css?v=20261115z"><link rel="stylesheet" href="/pir-motion-refinement.css?v=20261114k"><link rel="stylesheet" href="/pir-motion-polish.css?v=20261114n"><link rel="stylesheet" href="/pir-site-consistency.css?v=20261114p"><link rel="stylesheet" href="/pir-intro-experience.css?v=20261114t"><link rel="stylesheet" href="/pir-party-paper.css?v=20261115z"><link rel="stylesheet" href="/pir-page-harmony.css?v=20261115ab"><link rel="stylesheet" href="/pir-public-polish.css?v=20261118bi&rev=3612&cms=3613&fieldfix=3614"><link rel="stylesheet" href="/pir-creative-studio-layout.css?v=20261116az"><link rel="stylesheet" href="/pir-page-transitions.css?v=20261116bd"><link rel="stylesheet" href="/pir-agency-system.css?v=20261118c"><link rel="stylesheet" href="/pir-showcase-editorial.css?v=20261119-heading-zoom-safe-b"><link rel="stylesheet" href="/pir-desktop-refinement.css?v=20261119a"><link rel="stylesheet" href="/pir-reference-blend-v3.62.css?v=20261119b"><style id="pv-showcase-copy-inset-runtime-m">
/* Highest-specificity desktop override: keep the existing left inset and
   mirror it on the right so the copy column has matching side margins. */
@media (min-width: 901px) {
  html body #main-content .pv-home .pv-home-showcase .pv-showcase-slide > .pv-showcase-copy[data-pv-showcase-copy] {
    box-sizing: border-box !important;
    padding-left: clamp(44px, 3.8vw, 56px) !important;
    padding-right: clamp(16px, 1.8vw, 24px) !important;
  }
}
</style><link rel="stylesheet" href="/pir-whole-site-v3.64.css?v=20261119a"><link rel="stylesheet" href="/pir-functional-qa-v3.65.css?v=20261119a"><link rel="stylesheet" href="/edition/pir-edition.css?v=2"><script src="/edition/pir-edition.js?v=1" defer></script><script src="/pir-home-showcase.js?v=20261119-heading-align-active-slide-e" defer></script><script src="/pir-page-transitions.js?v=20261116bd"></script><script src="/pir-intro-boot.js?v=20261114r"></script><meta name="color-scheme" content="light"></head><body><div id="pv-intro-overlay" role="status" aria-label="PIR Visuals mempersiapkan halaman"><button type="button" class="pv-intro-skip" data-pv-intro-skip>Lewati animasi ↗</button><div class="pv-intro-stage"><div class="pv-intro-wordmark" aria-hidden="true">PIR<br>VISUALS<span>.</span></div><div class="pv-intro-sticker" aria-hidden="true"><img src="/pir-intro-sticker.svg" width="440" height="370" alt=""></div></div><span class="pv-intro-progress" aria-hidden="true"></span><p class="pv-intro-caption">Ide berani · Karya berarti</p></div><a class="skip-link" href="#page-content">Lewati ke konten</a><span id="pv-page-top" class="pv-page-top-marker" aria-hidden="true"></span><main class="wrap" id="main-content"><header class="site-nav">
  ${brandMarkup}
  <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="main-nav" aria-label="Buka menu navigasi"><span class="nav-toggle-label">Menu</span><span class="nav-toggle-icon" aria-hidden="true">☰</span></button>
  <nav class="nav-links" id="main-nav" aria-label="Navigasi utama">
    <div class="nav-primary">
      <a href="/">Beranda</a><a href="/discover">Jelajahi</a><a href="/for-business">Untuk Bisnis</a><a href="/commands">Semua Fitur Bot</a>
    </div>
    <details class="nav-more">
      <summary aria-label="Menu lainnya" aria-expanded="false">Lainnya <span aria-hidden="true">⌄</span></summary>
      <div class="nav-more-menu">
        <a href="/favorites">Favorit <span class="pill-count" data-favorite-count>0</span></a>
        <a href="/shortlist">Shortlist <span class="pill-count" data-shortlist-count>0</span></a><a href="/collections">Moodboard</a>
        <a href="/about">Tentang</a><a href="/categories">Kategori</a>
        
        <a href="/creative-studio">Creative Studio</a>
        <a href="/how-it-works">Cara kerja</a>
        <a href="/client">Ruang klien <span aria-hidden="true">↗</span></a>
        <a href="/contact">Contact &amp; support <span aria-hidden="true">↗</span></a>
      </div>
    </details>
    <div class="nav-actions">
      <a class="nav-cta" href="/studio">Portal desainer <span aria-hidden="true">↗</span></a>
      <button type="button" class="theme-toggle nav-action-button" data-command-open aria-haspopup="dialog" aria-controls="pv-command-dialog" aria-label="Cari cepat"><span aria-hidden="true">⌕</span><span>Cari</span></button>
      <button type="button" class="theme-toggle nav-action-button" data-appearance-toggle aria-pressed="false" aria-label="Mode gelap"><span aria-hidden="true">◐</span></button>
      <button type="button" class="theme-toggle nav-action-button" data-motion-toggle aria-pressed="false" aria-label="Atur animasi website"><span data-motion-icon aria-hidden="true">◌</span><span data-motion-label>Aktif</span></button>
    </div>
  </nav>
</header><span id="page-content" tabindex="-1"></span>${body}<footer class="foot pv-footer" aria-label="Informasi dan navigasi PIR Visuals">
  <section class="pv-footer-feature footer-cta" aria-labelledby="pv-footer-feature-title">
    <div class="pv-footer-feature-copy">
      <span class="pv-footer-kicker">PIR VISUALS / CREATIVE TALENT NETWORK</span>
      <h2 id="pv-footer-feature-title">Temukan talenta.<br><em>Wujudkan ide besar.</em></h2>
      <p>Setiap karya besar berawal dari pertemuan yang tepat. Jelajahi talenta, temukan gaya yang cocok, dan wujudkan ide bersama kreatornya.</p>
      <div class="pv-footer-feature-actions"><a class="pv-footer-button" href="/discover">Temukan desainer <span class="pv-link-arrow" aria-hidden="true">↗</span></a><a class="pv-footer-textlink" href="/contact">Hubungi kami <span class="pv-link-arrow" aria-hidden="true">↗</span></a></div>
    </div>
    <div class="pv-footer-feature-graphic" aria-hidden="true"><img class="pv-footer-feature-art" src="/pir-footer-seal.svg" alt="" width="560" height="560" loading="eager" decoding="async"></div>
  </section>
  <div class="pv-footer-main">
    <div class="pv-footer-top">
      <div class="pv-footer-identity">
        <a class="footer-brand-lockup" href="/" aria-label="PIR Visuals — kembali ke beranda">PIR<br>VISUALS<span>.</span></a>
        <p class="footer-brand-copy">Ruang temu untuk ide berani, kreator independen, dan karya yang berarti.</p>
        <a class="pv-footer-contact" href="/contact">Punya ide? Mari ngobrol <span aria-hidden="true">↗</span></a>
      </div>
      <nav class="pv-footer-navigation footer-grid" aria-label="Navigasi footer">
        <div class="pv-footer-column"><h3>Jelajahi</h3><a href="/discover">Temukan desainer</a><a href="/categories">Kategori</a><a href="/favorites">Favorit</a><a href="/collections">Moodboard</a><a href="/creative-studio">Creative Studio</a><a href="/how-it-works">Cara kerja</a></div>
        <div class="pv-footer-column"><h3>Perusahaan</h3><a href="/about">Tentang PIR</a><a href="/for-business">Untuk bisnis</a><a href="/contact">Kontak</a><a href="/privacy">Kebijakan privasi</a><a href="/terms">Syarat &amp; ketentuan</a></div>
        <div class="pv-footer-column"><h3>Untuk kreator</h3><a href="/studio">Designer Studio <span aria-hidden="true">↗</span></a><a href="/client">Ruang klien <span aria-hidden="true">↗</span></a><a href="/studio/register">Daftar desainer</a><a href="/contact">Bantuan</a><div class="pv-footer-side-note">BERKARYA · TERHUBUNG · BERKEMBANG</div></div>
      </nav>
    </div>
    <div class="pv-footer-landscape" aria-hidden="true"><img src="/pir-footer-landscape.svg" alt="" loading="lazy" decoding="async"></div>
  </div>
  <div class="pv-footer-bottom footer-bottom"><span>© ${new Date().getFullYear()} PIR Visuals. Semua hak dilindungi.</span><span><a href="/privacy">Privasi</a><a href="/terms">Ketentuan</a></span><span>Dibuat untuk ide-ide yang berarti.</span></div>
</footer></main>
<noscript><style>@media(max-width:1180px){.site-nav .nav-toggle{display:none!important}.site-nav .nav-links{display:flex!important;position:static!important;width:100%!important;max-width:none!important;max-height:none!important;overflow:visible!important;flex-direction:column!important;align-items:stretch!important;margin-top:10px!important}}</style></noscript>
<dialog class="pv-command-dialog" id="pv-command-dialog" aria-labelledby="pv-command-title">
  <div class="pv-command-head"><div><span class="eyebrow">PIR VISUALS · QUICK NAVIGATION</span><h2 id="pv-command-title">Mau ke mana?</h2></div><button type="button" class="pv-command-close" data-command-close aria-label="Tutup pencarian">×</button></div>
  <form class="pv-command-search" method="get" action="/discover"><span aria-hidden="true">⌕</span><input id="pv-command-input" name="q" type="search" autocomplete="off" placeholder="Cari desainer, skill, atau buka halaman…" aria-label="Cari desainer atau halaman"><kbd>ENTER</kbd></form>
  <p class="pv-command-results" id="pv-command-status" role="status" aria-live="polite" aria-atomic="true">8 tujuan tersedia</p>
  <p class="pv-command-label">NAVIGASI CEPAT</p>
  <div class="pv-command-items" id="pv-command-items">
    <button type="button" data-command-item data-command-href="/creative-studio"><span>✳</span><span><strong>Creative Studio</strong><small>Asset library, sticker, image tools, dan Design Seasons</small></span><kbd>↵</kbd></button>
    <button type="button" data-command-item data-command-href="/discover"><span>◫</span><span><strong>Jelajahi desainer</strong><small>Temukan talenta berdasarkan skill dan harga</small></span><kbd>↵</kbd></button>
    <button type="button" data-command-item data-command-href="/categories"><span>▦</span><span><strong>Kategori kreatif</strong><small>Jelajahi spesialisasi desain</small></span><kbd>↵</kbd></button>
    <button type="button" data-command-item data-command-href="/favorites"><span>♡</span><span><strong>Favorit</strong><small>Desainer yang kamu simpan</small></span><kbd>↵</kbd></button>
    <button type="button" data-command-item data-command-href="/shortlist"><span>≋</span><span><strong>Shortlist</strong><small>Bandingkan desainer pilihan</small></span><kbd>↵</kbd></button>
    <button type="button" data-command-item data-command-href="/collections"><span>▧</span><span><strong>Moodboard & collection</strong><small>Kumpulkan inspirasi visual</small></span><kbd>↵</kbd></button>
    <button type="button" data-command-item data-command-href="/studio"><span>↗</span><span><strong>Designer Studio</strong><small>Kelola profil dan portfolio</small></span><kbd>↵</kbd></button>
    <button type="button" data-command-item data-command-href="/client"><span>◷</span><span><strong>Client Workspace</strong><small>Lihat ruang proyek privat</small></span><kbd>↵</kbd></button>
    <button type="button" data-command-item data-command-href="/contact"><span>✳</span><span><strong>Contact & support</strong><small>Hubungi tim PIR Visuals</small></span><kbd>↵</kbd></button>
  </div>
  <div class="pv-command-foot"><span><kbd>CTRL</kbd> <kbd>K</kbd> untuk membuka</span><span><kbd>ESC</kbd> untuk menutup</span></div>
</dialog>
<dialog class="pv-quick-view-dialog" id="pv-designer-quick-view" aria-labelledby="pv-quick-view-title"><div class="pv-quick-view-head"><div class="pv-quick-view-avatar" data-pv-quick-avatar aria-hidden="true">PV</div><div><span class="eyebrow">PIR VISUALS / CREATIVE PROFILE</span><h2 id="pv-quick-view-title" data-pv-quick-name>Designer preview</h2><p data-pv-quick-location class="muted"></p></div><button type="button" class="pv-quick-view-close" data-pv-quick-close aria-label="Tutup preview">×</button></div><p class="pv-quick-view-bio" data-pv-quick-bio></p><div class="pv-quick-view-meta"><div><small>DISCIPLINE</small><strong data-pv-quick-category></strong></div><div><small>STARTING AT</small><strong data-pv-quick-price></strong></div></div><div class="pv-quick-view-skills" data-pv-quick-skills></div><div class="pv-quick-view-actions"><a class="btn" data-pv-quick-profile href="/discover">Lihat portfolio ↗</a><button type="button" class="btn btn-ghost" data-pv-quick-close>Close</button></div></dialog>
<a href="#pv-page-top" class="pv-back-top" data-back-top aria-label="Kembali ke bagian paling atas"><span aria-hidden="true">↑</span><small>TOP</small></a>
<script src="/pir-intro-experience.js?v=20261114t" defer></script><script src="/pir-back-to-top.js?v=20261114t" defer></script><script src="/pir-faq-accordion.js?v=20261114m" defer></script><script src="/analytics-ui.js" defer></script><script src="/vendor/gsap.min.js?v=6710" defer></script><script src="/vendor/ScrollTrigger.min.js?v=6710" defer></script><script src="/public-ui.js?v=6714" defer></script><script src="/pir-scroll-experience.js?v=20261114n" defer></script><script src="/pir-marquee.js?v=20261114t" defer></script><script src="/pir-editorial-reveal.js?v=20261114p" defer></script><script src="/pir-party-paper.js?v=20261115y" defer></script><script src="/pir-shared-ornaments.js?v=20261116at" defer></script><script src="/pwa-register.js?v=6710" defer></script></body></html>`;
}

function sendHtml(res, status, html, extra = {}) {
  const base = getSiteBase();
  if (base) {
    const pathname = new URL(res.req?.url || '/', base).pathname.replace(/\/+$/, '') || '/';
    const workspace = workspaceRoots.has(pathname.split('/')[1]);
    if (workspace) {
      html = html.replace('<body>', '<body data-area="workspace">');
      extra = { 'x-robots-tag': 'noindex, nofollow, noarchive', 'referrer-policy': 'no-referrer', ...extra, 'cache-control': 'no-store' };
    } else if (status === 200 && (publicSeoPaths.has(pathname) || /^\/(?:work|designer|p)\/[A-Za-z0-9_-]+$/.test(pathname))) {
      const canonical = escapeHtml(base + pathname);
      html = html.replace('</head>', `<link rel="canonical" href="${canonical}"><meta property="og:url" content="${canonical}"></head>`);
    }
  }
  res.writeHead(status, {
    'content-type': 'text/html; charset=utf-8',
    ...securityHeaders({ productionHttps: process.env.NODE_ENV === 'production' && String(process.env.PORTFOLIO_PUBLIC_BASE_URL || process.env.SITE_URL || '').startsWith('https://') }),
    'content-security-policy': "default-src 'self'; script-src 'self'; connect-src 'self'; img-src 'self' data: https: blob:; media-src 'self' data: blob: https:; style-src 'self' 'unsafe-inline'; font-src 'self' data:; form-action 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none';",
    ...extra,
  });
  return res.end(html);
}

function basicAuth(req, res) {
  const expectedUser = String(process.env.DASHBOARD_USER || '').trim();
  const expectedPassword = String(process.env.DASHBOARD_PASSWORD || '');
  if (!expectedUser || expectedPassword.length < 16) {
    res.writeHead(503, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Dashboard disabled: configure DASHBOARD_USER and DASHBOARD_PASSWORD (minimum 16 characters).');
    return false;
  }
  const match = String(req.headers.authorization || '').match(/^Basic\s+(.+)$/i);
  let supplied = '';
  try { supplied = match ? Buffer.from(match[1], 'base64').toString('utf8') : ''; } catch {}
  const split = supplied.indexOf(':');
  const user = split >= 0 ? supplied.slice(0, split) : '';
  const password = split >= 0 ? supplied.slice(split + 1) : '';
  const safeEqual = (a, b) => crypto.timingSafeEqual(
    crypto.createHash('sha256').update(String(a)).digest(),
    crypto.createHash('sha256').update(String(b)).digest(),
  );
  if (!safeEqual(user, expectedUser) || !safeEqual(password, expectedPassword)) {
    const ipBudget = securityRateLimiter.consume(req, { scope: 'owner-basic-ip', limit: 30, windowMs: 15 * 60 * 1000 });
    const userBudget = securityRateLimiter.consume(req, { scope: 'owner-basic-user', identity: user, limit: 10, windowMs: 15 * 60 * 1000 });
    if (!ipBudget.allowed || !userBudget.allowed) {
      const retryAfter = blockedRetryAfter(ipBudget, userBudget);
      res.writeHead(429, { 'retry-after': String(retryAfter), 'cache-control': 'no-store', 'content-type': 'text/plain; charset=utf-8' });
      res.end('Terlalu banyak percobaan autentikasi. Coba lagi setelah beberapa menit.');
      return false;
    }
    res.writeHead(401, { 'www-authenticate': 'Basic realm="PIR Visuals Dashboard", charset="UTF-8"', 'cache-control': 'no-store' });
    res.end('Authentication required');
    return false;
  }
  return true;
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}


function getPublicContactPhone(profile) {
  const candidates = [profile?.publicWhatsApp, profile?.contactPhone];
  for (const value of candidates) {
    const digits = String(value || '').replace(/\D/g, '');
    if (/^\d{8,15}$/.test(digits)) return digits;
  }
  return '';
}

async function renderHome() {
  const [total, verified, accepting, featured, publishedTestimonials] = await Promise.all([
    DesignerProfile.countDocuments({ isPublic: true }),
    DesignerProfile.countDocuments({ isPublic: true, isVerified: true }),
    DesignerProfile.countDocuments({ isPublic: true, acceptsOrders: true }),
    DesignerProfile.find({ isPublic: true, isFeatured: true }).select('designerId slug displayName avatarUrl avatarPath location bio specialties priceMin isFeatured isVerified acceptsOrders contactPhone publicWhatsApp').sort({ isVerified: -1, displayName: 1 }).limit(3).lean(),
    DesignerTestimonial.find({ isPublished: true, emailVerified: true })
      .select('clientName project message rating')
      .sort({ createdAt: -1, _id: -1 })
      .limit(3)
      .lean(),
  ]);
  const contentDoc = await PortfolioSiteContent.findOne({ key: 'homepage' }).lean();
  const cms = contentDoc?.value || {};
  const homeCopy = cms.copy && typeof cms.copy === 'object' ? cms.copy : {};
  const copyText = (key, fallback, max = 300) => String(homeCopy[key] || fallback).slice(0, max);
  const copyLines = value => escapeHtml(value).replace(/\r?\n/g, '<br>');
  const homeLayoutConfig = cms.layout && typeof cms.layout === 'object' ? cms.layout : {};
  // Community showcase is a standalone homepage feature, independent from
  // the hero headline and the owner's ordering of editorial sections.
  const homeSectionKeys = ['categories','talent','work','manifesto','join','faq'];
  const orderedHomeSections = homeSectionKeys.map((key,index) => {
    const setting = homeLayoutConfig[key] && typeof homeLayoutConfig[key] === 'object' ? homeLayoutConfig[key] : {};
    const order = Number(setting.order);
    return { key, enabled: setting.enabled !== false, order: Number.isInteger(order) && order >= 1 && order <= 6 ? order : index + 1, index };
  }).filter(section => section.enabled)
    .sort((a,b) => a.order - b.order || a.index - b.index)
    .map(section => section.key);
  const homeTitle = String(cms.title || 'Ide berani. Karya berarti.').slice(0,120);
  const titleParts = homeTitle.match(/^(.+?[.!?])\s+(.+)$/);
  const homeTitleMarkup = titleParts
    ? `${escapeHtml(titleParts[1])}<br><em>${escapeHtml(titleParts[2])}</em>`
    : escapeHtml(homeTitle);
  const homeSubtitle = String(cms.subtitle || 'PIR Visuals adalah ruang untuk menemukan desainer kreatif, menjelajahi karya terbaik, dan membangun kolaborasi secara langsung.').slice(0,300);
  const homeAnnouncement = String(cms.announcement || '').slice(0,180);
  const safeBannerUrl = value => {
    const raw = String(value || '').trim();
    if (!raw) return '';
    try { const parsed = new URL(raw); return parsed.protocol === 'https:' ? parsed.href : ''; }
    catch { return /^\/(?:media\/[A-Za-z0-9_-]+(?:\/[1-4])?|homepage-media\/home-[A-Za-z0-9_-]+\.(?:webp|mp4|webm))$/.test(raw) ? raw : ''; }
  };
  const safeHomeWorkHref = value => {
    const raw = String(value || '').trim();
    if (raw.startsWith('/') && !raw.startsWith('//')) return raw;
    try { const parsed = new URL(raw); return parsed.protocol === 'https:' ? parsed.href : ''; } catch { return ''; }
  };
  const homeWorkItems = (Array.isArray(cms.homeWorks) ? cms.homeWorks : []).slice(0,4).map((work,index) => ({
    title: String(work?.title || `Media pilihan ${index+1}`).slice(0,80),
    description: String(work?.description || '').slice(0,180),
    media: safeBannerUrl(work?.media),
    mediaType: work?.mediaType === 'video' ? 'video' : 'image',
    href: safeHomeWorkHref(work?.href) || '/discover',
  })).filter(work => work.media);
  const showcaseProfiles = await DesignerProfile.find({ isPublic: true }).select('designerId displayName slug').lean();
  const showcaseProfileById = new Map(showcaseProfiles.map(profile => [profile.designerId, profile]));
  const showcaseDesignerIds = showcaseProfiles.map(profile => profile.designerId);
  const showcaseWorkFilter = { moderationStatus: 'approved', designerId: { $in: showcaseDesignerIds } };
  const [latestShowcaseWorks, featuredShowcaseWorks, expensiveShowcaseWorks, affordableShowcaseWorks] = await Promise.all([
    PortfolioItem.find(showcaseWorkFilter).sort({ createdAt: -1, _id: -1 }).limit(8).lean(),
    PortfolioItem.find({ ...showcaseWorkFilter, featured: true }).sort({ createdAt: -1, _id: -1 }).limit(8).lean(),
    PortfolioItem.find({ ...showcaseWorkFilter, priceFrom: { $gt: 0 } }).sort({ priceFrom: -1, createdAt: -1, _id: -1 }).limit(8).lean(),
    PortfolioItem.find({ ...showcaseWorkFilter, priceFrom: { $gt: 0 } }).sort({ priceFrom: 1, createdAt: -1, _id: -1 }).limit(8).lean(),
  ]);
  const renderShowcaseWorkSlides = (items, category) => items.map((work,index) => {
    const designer = showcaseProfileById.get(work.designerId);
    const price = Number(work.priceFrom || 0);
    const categoryLabel = String(work.category || 'Creative project').slice(0,60);
    const title = String(work.title || 'Untitled project').slice(0,100);
    const description = String(work.description || '').slice(0,220);
    const href = `/work/${encodeURIComponent(work.itemId)}`;
    return `<article class="pv-showcase-slide ${index === 0 ? 'is-active' : ''}" data-showcase-slide="${category}" data-index="${index}">
      <a class="pv-showcase-art" href="${href}" data-track-campaign="showcase-${category}-${escapeHtml(work.itemId)}" aria-label="Lihat karya ${escapeHtml(title)}"><img src="/media/${encodeURIComponent(work.itemId)}" alt="${escapeHtml(title)}" loading="${index === 0 ? 'eager' : 'lazy'}" decoding="async"></a>
      <div class="pv-showcase-copy" data-pv-showcase-copy><div class="pv-showcase-meta"><span>${escapeHtml(categoryLabel)}</span>${price > 0 ? `<strong>Mulai ${money(price)}</strong>` : '<strong>Negosiasi</strong>'}</div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(description || 'Lihat detail karya dan pendekatan kreatif dari pembuatnya.')}</p><div class="pv-showcase-byline"><span>BY ${escapeHtml(designer?.displayName || 'PIR VISUALS CREATOR')}</span><a href="${designer?.slug ? `/p/${encodeURIComponent(designer.slug)}` : `/designer/${encodeURIComponent(work.designerId)}`}">Profil kreator ↗</a></div><a class="pv-showcase-cta" data-track-campaign="showcase-${category}-${escapeHtml(work.itemId)}" href="${href}">Lihat karya <span aria-hidden="true">↗</span></a></div>
    </article>`;
  }).join('');
  const ownerEvents = (Array.isArray(cms.events) ? cms.events : []).filter(event => event && event.enabled !== false && String(event.title || '').trim()).slice(0,5);
  const renderShowcaseEventSlides = ownerEvents.map((event,index) => {
    const title = String(event.title || 'Event PIR Visuals').slice(0,100);
    const description = String(event.description || '').slice(0,220);
    const media = safeBannerUrl(event.media || '');
    const mediaType = event.mediaType === 'video' ? 'video' : 'image';
    const href = safeHomeWorkHref(event.href) || '/contact';
    const date = formatDateKey(event.date || '');
    const mediaMarkup = media
      ? (mediaType === 'video' ? `<video src="${escapeHtml(media)}" controls muted playsinline preload="metadata" aria-label="${escapeHtml(title)}"></video>` : `<img src="${escapeHtml(media)}" alt="${escapeHtml(title)}" loading="${index === 0 ? 'eager' : 'lazy'}" decoding="async">`)
      : `<div class="pv-showcase-art-placeholder"><span>EVENT</span></div>`;
    return `<article class="pv-showcase-slide ${index === 0 ? 'is-active' : ''}" data-showcase-slide="events" data-index="${index}"><div class="pv-showcase-art">${mediaMarkup}</div><div class="pv-showcase-copy" data-pv-showcase-copy><div class="pv-showcase-meta"><span>${escapeHtml(event.kind || 'EVENT PIR VISUALS')}</span><strong>${escapeHtml(date || 'Tanggal menyusul')}</strong></div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(description || 'Ikuti informasi dan kegiatan terbaru dari komunitas PIR Visuals.')}</p><div class="pv-showcase-byline"><span>OFFICIAL EVENT / PIR VISUALS</span><span>OWNER ANNOUNCEMENT</span></div><a class="pv-showcase-cta" data-track-campaign="showcase-event-${escapeHtml(event.eventId || index+1)}" href="${escapeHtml(href)}">Lihat informasi <span aria-hidden="true">↗</span></a></div></article>`;
  }).join('');
  const showcaseGroups = [
    ['latest','Karya Terbaru',latestShowcaseWorks,'Belum ada karya terbaru yang disetujui.'],
    ['featured','Karya Unggulan',featuredShowcaseWorks,'Owner belum memilih karya unggulan.'],
    ['expensive','Karya Termahal',expensiveShowcaseWorks,'Belum ada karya dengan harga yang dicantumkan.'],
    ['affordable','Karya Termurah',affordableShowcaseWorks,'Belum ada karya dengan harga yang dicantumkan.'],
    ['events','Event PIR Visuals',ownerEvents,'Belum ada event dari Owner.'],
  ];
  const showcasePanels = showcaseGroups.map(([key,label,items,empty]) => {
    const slides = key === 'events' ? renderShowcaseEventSlides : renderShowcaseWorkSlides(items,key);
    const count = items.length;
    return `<section class="pv-showcase-panel" data-showcase-panel="${key}" ${key !== 'latest' ? 'hidden' : ''}>
      <div class="pv-showcase-track" data-showcase-track>${slides || `<div class="pv-showcase-empty"><span>0${showcaseGroups.findIndex(group => group[0] === key)+1} / ${escapeHtml(label.toUpperCase())}</span><h3>${escapeHtml(empty)}</h3><p>Konten akan muncul otomatis setelah karya disetujui atau Owner menambahkan event.</p></div>`}</div>
      <div class="pv-showcase-controls" ${count ? '' : 'hidden'}><span class="pv-showcase-counter"><b data-showcase-current>01</b> / ${String(Math.max(1,count)).padStart(2,'0')}</span><div class="pv-showcase-dots">${items.map((_,index) => `<button type="button" data-showcase-dot="${index}" aria-label="Tampilkan ${escapeHtml(label)} ${index+1}" aria-current="${index === 0 ? 'true' : 'false'}"></button>`).join('')}</div><div class="pv-showcase-arrows"><button type="button" data-showcase-prev aria-label="${escapeHtml(label)} sebelumnya" ${count < 2 ? 'disabled' : ''}>←</button><button type="button" data-showcase-next aria-label="${escapeHtml(label)} berikutnya" ${count < 2 ? 'disabled' : ''}>→</button></div></div>
    </section>`;
  }).join('');
  const showcaseMarkup = `<section class="pv-home-showcase" data-pv-showcase aria-labelledby="pv-showcase-title"><div class="pv-showcase-heading"><div><span class="pv-label">PIR VISUALS / COMMUNITY SHOWCASE</span><h2 id="pv-showcase-title">Karya & aktivitas komunitas<span>.</span></h2></div><p>Jelajahi karya yang dipublikasikan, pilihan Owner, dan kegiatan resmi PIR Visuals.</p></div><div class="pv-showcase-tabs" role="tablist" aria-label="Kategori etalase PIR Visuals">${showcaseGroups.map(([key,label],index) => `<button type="button" role="tab" id="pv-showcase-tab-${key}" aria-controls="pv-showcase-panel-${key}" aria-selected="${index === 0 ? 'true' : 'false'}" data-showcase-tab="${key}">${escapeHtml(label)}</button>`).join('')}</div><div class="pv-showcase-panels">${showcasePanels.replace(/data-showcase-panel="([^"]+)"/g,'id="pv-showcase-panel-$1" role="tabpanel" aria-labelledby="pv-showcase-tab-$1" data-showcase-panel="$1"')}</div></section>`;
  // Keep the featured-designer collection available to the homepage talent section.
  // This declaration must remain inside renderHome after the featured query resolves.
  const featuredCards = featured.map(designerCard).join('');
  const projectCards = homeWorkItems.map((work,i) => {
    const mediaMarkup = work.mediaType === 'video'
      ? `<video src="${escapeHtml(work.media)}" controls muted playsinline preload="metadata" aria-label="${escapeHtml(work.title)}"></video>`
      : `<img loading="lazy" decoding="async" src="${escapeHtml(work.media)}" alt="${escapeHtml(work.title)}">`;
    return `<a class="home-project home-project-${i+1}" href="${escapeHtml(work.href)}"><div class="home-project-image">${mediaMarkup}<span>0${i+1}</span></div><div class="home-project-caption"><div><strong>${escapeHtml(work.title)}</strong>${work.description ? `<small>${escapeHtml(work.description)}</small>` : '<small>Homepage showcase</small>'}</div><b>↗</b></div></a>`;
  }).join('');
  const categoryTiles = [
    ['01','Brand identity','Logo, visual systems & art direction','Brand Identity'],
    ['02','Digital experiences','UI/UX, product & web design','UI/UX Design'],
    ['03','Visual storytelling','Illustration, 3D & motion','Illustration'],
    ['04','Campaign & content','Social, editorial & campaign assets','Social Media'],
  ];
  const categoryMarkup = categoryTiles.map(([n,title,desc,cat])=>`<a class="home-category" href="/discover?category=${encodeURIComponent(cat)}"><span>${n} / EXPLORE</span><strong>${escapeHtml(title)}</strong><small>${escapeHtml(desc)}</small><b aria-hidden="true">↗</b></a>`).join('');
  const journeyMarkup = `<section class="pv-journey-section">
    <div class="pv-journey-wrap">
      <div class="pv-journey-head">
        <div><span class="pv-label">PIR VISUALS / CHOOSE YOUR PATH</span><h2>Pilih jalur yang sesuai dengan tujuanmu.</h2></div>
        <p>Mulai dari kebutuhanmu, bukan dari daftar menu. Setiap jalur membawa kamu ke ruang yang tepat untuk menemukan talenta, membangun portfolio, atau melanjutkan kolaborasi.</p>
      </div>
      <div class="pv-journey-grid" aria-label="Jalur pengguna PIR Visuals">
        <a class="pv-journey-card" href="/discover">
          <span class="pv-journey-number">01 / CLIENT</span>
          <h3>Saya mencari desainer.</h3>
          <p>Jelajahi karya, skill, lokasi, kisaran harga, dan ketersediaan sebelum menghubungi kreator secara langsung.</p>
          <strong>Temukan talenta</strong>
        </a>
        <a class="pv-journey-card" href="/studio">
          <span class="pv-journey-number">02 / CREATOR</span>
          <h3>Saya ingin menampilkan karya.</h3>
          <p>Bangun profil profesional, kelola layanan, unggah portfolio, dan biarkan karya terbaikmu ditemukan.</p>
          <strong>Buka Designer Studio</strong>
        </a>
        <a class="pv-journey-card" href="/client">
          <span class="pv-journey-number">03 / COLLABORATE</span>
          <h3>Saya sedang menjalankan proyek.</h3>
          <p>Gunakan ruang klien untuk mengikuti progres, membaca update, dan menjaga feedback tetap berada dalam konteks.</p>
          <strong>Masuk ruang klien</strong>
        </a>
      </div>
    </div>
  </section>`;
  const testimonialMarkup = Array.isArray(publishedTestimonials) && publishedTestimonials.length
    ? `<section class="pv-home-testimonials">
        <div class="pv-testimonials-wrap">
          <div class="pv-testimonials-head">
            <div><span class="pv-label">PIR VISUALS / SOCIAL PROOF</span><h2>Cerita dari orang yang pernah bekerja bersama.</h2></div>
            <p>Ulasan di bawah hanya berasal dari testimonial yang sudah diverifikasi email dan dipublikasikan melalui proses moderasi PIR Visuals.</p>
          </div>
          <div class="pv-testimonials-grid">
            ${publishedTestimonials.map(item => {
              const rating = Math.max(1, Math.min(5, Number(item?.rating || 5)));
              const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
              const quote = String(item?.message || '').trim().slice(0, 360);
              const client = String(item?.clientName || 'Client PIR Visuals').trim().slice(0, 80);
              const project = String(item?.project || '').trim().slice(0, 100);
              if (!quote) return '';
              return `<article class="pv-testimonial-card">
                <div><div class="pv-testimonial-stars" aria-label="Rating ${rating} dari 5">${stars}</div><blockquote>“${escapeHtml(quote)}”</blockquote></div>
                <div class="pv-testimonial-meta"><strong>${escapeHtml(client)}</strong>${project ? `<small>${escapeHtml(project)}</small>` : ''}</div>
              </article>`;
            }).join('')}
          </div>
        </div>
      </section>`
    : '';
  const faqDefaults = [
    { question:'Apakah PIR Visuals menjadi perantara transaksi?', answer:'Tidak. PIR Visuals adalah platform portfolio dan discovery. Klien menghubungi desainer secara langsung dan mengatur kesepakatan di antara mereka.' },
    { question:'Bagaimana cara menemukan desainer yang tepat?', answer:'Gunakan direktori untuk menyaring spesialisasi, lokasi, kisaran harga, verifikasi, dan ketersediaan. Lalu periksa portfolio dan layanan mereka.' },
    { question:'Bagaimana desainer bergabung?', answer:'Buka Designer Studio untuk membuat atau mengelola akun, profil, layanan, dan portfolio.' },
  ];
  const faqItems = Array.isArray(homeCopy.faq)
    ? homeCopy.faq.slice(0,20).map(saved => ({
        question:String(saved?.question || '').slice(0,140),
        answer:String(saved?.answer || '').slice(0,400),
      })).filter(item => item.question && item.answer)
    : faqDefaults;
  const sectionMarkup = {
    categories: `<section class="pv-category-section"><div class="pv-section-top"><div><span class="pv-label">${escapeHtml(copyText('categoryLabel','FIND YOUR CREATIVE MATCH',70))}</span><h2 class="pv-managed-title">${copyLines(copyText('categoryTitle','What are you\nlooking to create?',120))}</h2></div><p>${escapeHtml(copyText('categoryDescription','Mulai dari kebutuhanmu. Temukan spesialis yang tepat melalui karya, skill, dan layanan yang mereka tampilkan.',300))}</p></div><div class="pv-category-grid">${categoryMarkup}</div></section>`,
    talent: `<section class="pv-talent-section"><div class="pv-section-top"><div><span class="pv-label">${escapeHtml(copyText('talentLabel','THE PEOPLE BEHIND THE WORK',70))}</span><h2 class="pv-managed-title">${copyLines(copyText('talentTitle','Meet the\nindependent talent.',120))}</h2></div><a class="pv-outline-link" href="/discover">Jelajahi semua desainer ↗</a></div><div class="pv-talent-grid">${featuredCards || '<div class="pv-empty">Talenta unggulan akan tampil di sini. <a href="/discover">Jelajahi direktori ↗</a></div>'}</div></section>`,
    work: homeWorkItems.length ? `<section class="pv-work-section"><div class="pv-section-top"><div><span class="pv-label">${escapeHtml(copyText('workLabel','A SELECTION OF IDEAS',70))}</span><h2 class="pv-managed-title">${copyLines(copyText('workTitle','Made to\nmake an impact.',120))}</h2></div><p>${escapeHtml(copyText('workDescription','Foto dan video pilihan yang diunggah khusus untuk Beranda. Media ini dikelola terpisah dari portofolio desainer.',300))}</p></div><div class="pv-project-grid">${projectCards}</div><div class="pv-work-foot"><span>HOMEPAGE MEDIA · INDEPENDENTLY CURATED</span><a href="/discover">Lihat lebih banyak karya ↗</a></div></section>` : '',
    manifesto: `<section class="pv-manifesto"><div class="pv-manifesto-aside"><span class="pv-label">${escapeHtml(copyText('manifestoLabel','A BETTER WAY TO COLLABORATE',70))}</span><span class="pv-manifesto-index">PV / 2026</span></div><div class="pv-manifesto-copy"><h2 class="pv-managed-title">${copyLines(copyText('manifestoTitle','Less middlemen.\nMore meaningful work.',150))}</h2><p>${escapeHtml(copyText('manifestoDescription','PIR Visuals mempertemukan klien dengan desainer melalui portfolio yang transparan. Kamu melihat karya, memahami spesialisasi dan kisaran harga, lalu berdiskusi langsung dengan kreatornya.',500))}</p><div class="pv-manifesto-points"><div><b>01</b><span>Jelajahi karya dan profil</span></div><div><b>02</b><span>Bandingkan layanan dan harga</span></div><div><b>03</b><span>Hubungi desainer secara langsung</span></div></div></div></section>`,
    join: `<section class="pv-join"><div><span class="pv-label">${escapeHtml(copyText('joinLabel','YOUR WORK. YOUR SPACE.',70))}</span><h2 class="pv-managed-title">${copyLines(copyText('joinTitle','Make your work\nimpossible to ignore.',150))}</h2><p>${escapeHtml(copyText('joinDescription','Bangun kehadiran profesional, tampilkan karya terbaik, dan biarkan klien menemukanmu.',300))}</p></div><a class="pv-button pv-button-light" href="/studio">${escapeHtml(copyText('joinCta','Bangun portfolio kamu ↗',50))}</a></section>`,
    faq: `<section class="pv-faq"><div><span class="pv-label">${escapeHtml(copyText('faqLabel','GOOD TO KNOW',70))}</span><h2 class="pv-managed-title">${copyLines(copyText('faqTitle','Questions,\nanswered.',100))}</h2></div><div class="pv-faq-list">${faqItems.map(item=>`<details><summary>${escapeHtml(item.question)}</summary><div class="pv-faq-panel"><p>${escapeHtml(item.answer)}</p></div></details>`).join('')}</div></section>`,
  };
  const orderedSectionMarkup = orderedHomeSections.map(key => sectionMarkup[key] || '').filter(Boolean).join('\n');
  const body = `<div class="pv-home">
    <section class="edition-hero" aria-labelledby="edition-home-title">
      <div class="edition-hero-copy">
        <p class="edition-kicker"><span aria-hidden="true"></span> INDEPENDENT CREATIVE TALENT PLATFORM</p>
        ${homeAnnouncement ? `<p class="edition-announcement">${escapeHtml(homeAnnouncement)}</p>` : ''}
        <h1 id="edition-home-title">${homeTitleMarkup}</h1>
        <p class="edition-lede">${escapeHtml(homeSubtitle)}</p>
        <div class="edition-actions">
          <a class="edition-action" href="/discover">Temukan desainer <span class="edition-arrow" aria-hidden="true"></span></a>
          <a class="edition-link" href="/studio">Untuk desainer <span class="edition-arrow" aria-hidden="true"></span></a>
        </div>
        ${total ? `<dl class="edition-index">
          <div><dt>Desainer publik</dt><dd>${total.toLocaleString('id-ID')}</dd></div>
          <div><dt>Ditinjau PIR</dt><dd>${verified.toLocaleString('id-ID')}</dd></div>
          <div><dt>Terima brief</dt><dd>${accepting.toLocaleString('id-ID')}</dd></div>
        </dl>` : ''}
      </div>
      <figure class="edition-hero-art">
        <img src="/edition/studio-print-1040.webp" srcset="/edition/studio-print-560.webp 560w, /edition/studio-print-1040.webp 1040w" sizes="(max-width: 760px) 100vw, 48vw" alt="Studi cetak dengan kertas berwarna tanah, daun hijau, dan buah pir" width="1040" height="1300" fetchpriority="high" decoding="async">
        <figcaption>Studi visual PIR <span>Objek &amp; bentuk</span></figcaption>
      </figure>
    </section>
    ${journeyMarkup}
    ${showcaseMarkup}
    ${orderedSectionMarkup}
    ${testimonialMarkup}
  </div>`;
  const seoTitle = String(cms.seoTitle || 'PIR Visuals — Creative Talent Network').slice(0,100);
  const seoDescription = String(cms.seoDescription || homeSubtitle).slice(0,300);
  const seoImage = /^https:\/\//i.test(String(cms.seoImage || '')) ? String(cms.seoImage).slice(0,500) : '';
  return pageShell(seoTitle, body, { description:seoDescription, ogImage:seoImage });
}
function renderInfoPage(kind) {
  const pages = {
    about: ['Tentang PIR Visuals', 'Ruang temu antara kebutuhan visual dan talenta kreatif.', `<p>PIR Visuals membantu pengunjung menemukan desainer melalui portfolio, spesialisasi, layanan, dan informasi harga yang ditampilkan oleh masing-masing desainer.</p><p>Platform ini berfokus pada discovery dan publikasi portfolio. PIR Visuals bukan perantara transaksi, tidak menerima pembayaran klien, dan tidak menentukan kesepakatan kerja antara pihak-pihak yang berkolaborasi.</p><h2>Prinsip kami</h2><ul><li>Informasi portfolio yang jelas dan mudah dijelajahi.</li><li>Kontak langsung antara calon klien dan desainer.</li><li>Visibilitas status verifikasi dan ketersediaan desainer.</li><li>Pengelolaan karya dan profil melalui Designer Studio.</li></ul>`],
    'how-it-works': ['Cara kerja', 'Dari eksplorasi portfolio hingga percakapan langsung.', `<h2>1. Jelajahi direktori</h2><p>Gunakan pencarian dan filter untuk menemukan desainer sesuai kebutuhan, skill, lokasi, dan kisaran harga.</p><h2>2. Evaluasi portfolio</h2><p>Baca profil, lihat karya yang dipublikasikan, periksa layanan, harga, dan ketersediaan.</p><h2>3. Hubungi desainer</h2><p>Gunakan tombol kontak pada profil untuk memulai percakapan langsung. Sampaikan brief, referensi, anggaran, dan tenggat waktu.</p><h2>4. Sepakati pekerjaan secara langsung</h2><p>Klien dan desainer membahas ruang lingkup, revisi, timeline, metode pembayaran, dan kontrak secara langsung. PIR Visuals tidak memproses pembayaran atau mengambil komisi transaksi.</p>`],
    privacy: ['Kebijakan privasi', 'Ringkasan penggunaan informasi di PIR Visuals.', `<p>Halaman ini menjelaskan secara ringkas bagaimana fitur publik website bekerja. Profil dan karya yang ditampilkan merupakan informasi yang dipublikasikan oleh desainer melalui platform.</p><h2>Favorit</h2><p>Daftar favorit pengunjung disimpan di penyimpanan lokal browser perangkat yang digunakan. Data favorit tidak disinkronkan ke akun server.</p><h2>Analitik</h2><p>Website menghitung metrik agregat seperti kunjungan profil, preview portfolio, dan klik kontak untuk membantu desainer memahami performa portfolio. Metrik tersebut bukan laporan identitas pengunjung.</p><h2>Kontak langsung</h2><p>Ketika pengunjung memilih menghubungi desainer, mereka akan diarahkan ke kanal kontak milik desainer. Kebijakan layanan pihak ketiga berlaku pada kanal tersebut.</p><h2>Keamanan akun desainer</h2><p>Designer Studio menggunakan autentikasi akun dan sesi login. Jangan membagikan password, kode OTP, atau tautan reset password kepada pihak lain.</p><p class="muted">Dokumen ini merupakan ringkasan informasi produk, bukan nasihat hukum. Operator platform perlu menyesuaikannya dengan praktik pemrosesan data dan ketentuan hukum yang berlaku sebelum peluncuran publik.</p>`],
    terms: ['Ketentuan penggunaan', 'Panduan penggunaan direktori dan portfolio.', `<h2>Penggunaan platform</h2><p>Pengunjung dapat menjelajahi profil publik, menyimpan favorit secara lokal, dan menghubungi desainer secara langsung.</p><h2>Tanggung jawab desainer</h2><p>Desainer bertanggung jawab atas keakuratan informasi, hak penggunaan karya, harga, ketersediaan, dan komunikasi yang dipublikasikan pada profilnya.</p><h2>Hubungan klien dan desainer</h2><p>Setiap brief, penawaran, kontrak, pembayaran, revisi, dan penyelesaian pekerjaan disepakati langsung oleh klien dan desainer. PIR Visuals tidak bertindak sebagai agen, escrow, atau pihak pembayaran.</p><h2>Konten dan moderasi</h2><p>Konten portfolio dapat melalui proses moderasi sebelum tampil secara publik. Konten yang melanggar hukum, hak pihak lain, atau kebijakan platform dapat ditolak atau disembunyikan.</p><h2>Ketersediaan layanan</h2><p>Platform disediakan sebagaimana tersedia. Informasi profil dapat berubah dan pengunjung sebaiknya mengonfirmasi detail proyek secara langsung dengan desainer.</p><p class="muted">Ketentuan ini adalah draft produk dan perlu ditinjau secara hukum sebelum menjadi ketentuan resmi yang mengikat.</p>`],
    'for-business': ['Solusi kreatif untuk bisnis', 'Temukan desainer independen untuk setiap ide dan kebutuhan visual bisnis Anda.', `<p>Gunakan PIR Visuals untuk menemukan desainer berdasarkan bidang keahlian, gaya karya, dan kebutuhan proyek. Jelajahi portfolio mereka sebelum menghubungi kreator secara langsung.</p><h2>Area kebutuhan kreatif</h2><ul><li>Brand identity dan sistem visual.</li><li>Desain UI/UX untuk produk digital.</li><li>Ilustrasi, motion, dan visual storytelling.</li><li>Konten serta materi kampanye digital.</li></ul><h2>Alur kolaborasi</h2><p>Temukan desainer, evaluasi karya serta layanan, kemudian kirimkan brief. Harga, ruang lingkup, tenggat, kontrak, dan pembayaran dibahas langsung antara klien dan desainer. PIR Visuals tidak berperan sebagai perantara pembayaran.</p>`],
    contact: ['Hubungi PIR Visuals', 'Pilih jalur yang sesuai dengan kebutuhanmu.', `<div class="feature-grid"><article class="feature-item"><h3>Saya mencari desainer</h3><p class="muted">Mulai dari direktori, buka profil, lalu gunakan kontak langsung yang disediakan desainer.</p><a class="btn" href="/discover">Jelajahi desainer</a></article><article class="feature-item"><h3>Saya seorang desainer</h3><p class="muted">Kelola profil, karya, layanan, dan statistik melalui Designer Studio.</p><a class="btn btn-secondary" href="/studio">Buka Designer Studio</a></article></div><p class="muted">Untuk pertanyaan operasional, gunakan kanal dukungan resmi yang disediakan pengelola PIR Visuals.</p>`],
  };
  const [title, subtitle, content] = pages[kind] || pages.about;
  if (kind === 'about' || kind === 'how-it-works' || kind === 'for-business') {
    const journey = kind === 'about' ? [
      ['01 / DISCOVER', 'Orang di balik karya', 'Lihat karya dan sudut pandang kreator sebelum memulai kerja sama.', '/discover', 'Jelajahi desainer'],
      ['02 / EXPLORE', 'Ide lintas disiplin', 'Mulai dari identitas merek hingga pengalaman produk digital.', '/categories', 'Lihat kategori'],
      ['03 / CONNECT', 'Kolaborasi langsung', 'Terhubung dengan desainer yang sesuai dengan kebutuhan proyek Anda.', '/how-it-works', 'Pelajari caranya'],
    ] : kind === 'how-it-works' ? [
      ['01 / DISCOVER', 'Cari yang tepat', 'Gunakan kategori, filter dan pencarian untuk memilih talenta kreatif.', '/discover', 'Mulai mencari'],
      ['02 / CURATE', 'Pilih karya favorit', 'Bandingkan portofolio, layanan, ketersediaan, dan shortlist.', '/shortlist', 'Buka shortlist'],
      ['03 / CONNECT', 'Bicarakan proyek', 'Sampaikan brief dan sepakati kebutuhan langsung dengan desainer.', '/contact', 'Butuh bantuan?'],
    ] : [
      ['01 / IDENTITY', 'Identitas merek', 'Logo, sistem visual, dan kebutuhan komunikasi merek.', '/discover?category=Brand%20Identity', 'Cari spesialis'],
      ['02 / PRODUCT', 'Produk digital', 'Desain antarmuka dan pengalaman pengguna untuk produk digital.', '/discover?category=UI%2FUX%20Design', 'Lihat desainer'],
      ['03 / CAMPAIGN', 'Konten & kampanye', 'Aset visual dan materi komunikasi kreatif lintas kanal.', '/discover?category=Social%20Media', 'Cari kreator'],
    ];
    const cards = journey.map(([number, heading, summary, link, action]) => `<article class="company-editorial-card"><span>${escapeHtml(number)}</span><h2>${escapeHtml(heading)}</h2><p>${escapeHtml(summary)}</p><a href="${link}"><span class="pv-action-label">${escapeHtml(action)}</span><span class="pv-link-arrow" aria-hidden="true">↗</span></a></article>`).join('');
    const heroSide = kind === 'about' ? 'A creative network built around the work.' : kind === 'how-it-works' ? 'Find a fit. Make it happen.' : 'Your next big idea starts with the right people.';
    const lowerHeading = kind === 'about' ? 'Bukan sekadar direktori.' : kind === 'how-it-works' ? 'Proses yang lebih jelas.' : 'Kolaborasi sesuai kebutuhan bisnis.';
    const ctaHeading = kind === 'about' ? 'Mari bikin karya berarti.' : kind === 'how-it-works' ? 'Sudah siap memulai?' : 'Temukan partner kreatif Anda.';
    const ctaText = kind === 'about' ? 'Jelajahi kreator, karya, dan berbagai pendekatan kreatif di PIR Visuals.' : kind === 'how-it-works' ? 'Mulai dari inspirasi dan lanjutkan ke percakapan langsung.' : 'Pilih spesialis yang cocok berdasarkan karya, layanan, dan pendekatan mereka.';
    const heroMarkup = `<section class="company-editorial-hero"><div><span class="eyebrow">PIR VISUALS / ${kind==='about'?'OUR STORY':kind==='how-it-works'?'HOW IT WORKS':'FOR BUSINESS'}</span><h1>${escapeHtml(title)}.</h1><p>${escapeHtml(subtitle)}</p><a class="btn" href="/discover">Jelajahi talenta ↗</a></div><div class="company-editorial-hero-aside"><span>CREATIVE IDEAS / REAL CONNECTIONS</span><strong>${escapeHtml(heroSide)}</strong><span>INDEPENDENT CREATORS / INDONESIA</span></div></section>`;
    const editorialBodyMarkup = `<div class="company-editorial-grid">${cards}</div><section class="company-editorial-copy"><div><span class="eyebrow">OUR APPROACH / 01</span><h2>${escapeHtml(lowerHeading)}</h2></div><div class="copy">${content}</div></section><section class="company-editorial-cta"><div><span class="eyebrow">LET'S CREATE / PIR VISUALS</span><h2>${escapeHtml(ctaHeading)}</h2><p>${escapeHtml(ctaText)}</p></div><a class="btn" href="/discover"><span>Lihat direktori</span><span class="pv-link-arrow" aria-hidden="true">↗</span></a></section>`;
    if (kind === 'for-business') {
      return pageShell(`${title} — PIR Visuals`, `<div class="company-editorial company-editorial-business"><section class="company-editorial-band company-editorial-business-hero-band"><div class="company-editorial-business-inner">${heroMarkup}</div></section><section class="company-editorial-band company-editorial-business-main-band"><div class="company-editorial-business-inner">${editorialBodyMarkup}</div></section></div>`);
    }
    return pageShell(`${title} — PIR Visuals`, `<div class="company-editorial">${heroMarkup}${editorialBodyMarkup}</div>`);
  }
  return pageShell(`${title} — PIR Visuals`, `<section class="hero legal-copy"><span class="eyebrow">PIR Visuals · Information</span><h1>${title}</h1><p class="muted">${subtitle}</p><article class="card">${content}</article><p><a class="btn btn-secondary" href="/contact">Hubungi tim PIR Visuals</a> <a class="btn btn-ghost" href="/">Kembali ke beranda</a></p></section>`);
}


function renderMoodboardPage(title, content) {
  return pageShell(`PIR Visuals — ${title}`, `<section class="hero"><span class="eyebrow">PIR VISUALS COLLECTIONS</span><h1>${escapeHtml(title)}</h1><p class="muted">Kumpulkan inspirasi, portfolio, dan desainer pilihan sebelum menghubungi mereka secara langsung.</p></section>${content}`);
}
async function renderMoodboard(slug, editToken = '') {
  const board = await ClientMoodboard.findOne({ slug: String(slug).toLowerCase() }).lean();
  if (!board || (!board.isPublic && (!editToken || !sameHash(hashToken(editToken), board.editTokenHash)))) return null;
  const canEdit = Boolean(editToken && sameHash(hashToken(editToken), board.editTokenHash));
  if (board.isPublic) await ClientMoodboard.updateOne({ _id: board._id }, { $inc: { viewCount: 1 } });
  const [designers, works] = await Promise.all([
    DesignerProfile.find({ designerId: { $in: board.designerIds }, isPublic: true }).select('designerId slug displayName avatarUrl avatarPath location specialties').lean(),
    PortfolioItem.find({ itemId: { $in: board.itemIds }, moderationStatus: 'approved' }).select('itemId designerId title category imagePath').lean(),
  ]);
  const workById = new Map(works.map(work => [work.itemId, work]));
  const designerById = new Map(designers.map(designer => [designer.designerId, designer]));
  const orderedWorks = (board.itemIds || []).map(id => workById.get(id)).filter(Boolean);
  const orderedDesigners = (board.designerIds || []).map(id => designerById.get(id)).filter(Boolean);
  const designerCards = orderedDesigners.map(d => { const avatar = getDesignerAvatarSrc(d); return `<article class="pv-collection-designer"><div class="pv-collection-avatar">${avatar ? `<img loading="lazy" src="${escapeHtml(avatar)}" alt="">` : `<span>${escapeHtml(String(d.displayName || 'D').slice(0,1).toUpperCase())}</span>`}</div><div><strong>${escapeHtml(d.displayName)}</strong><p>${escapeHtml(d.location || 'Independent creative')} · ${(d.specialties || []).slice(0,3).map(escapeHtml).join(' · ')}</p><a href="${d.slug ? `/p/${encodeURIComponent(d.slug)}` : `/designer/${encodeURIComponent(d.designerId)}`}">Lihat portfolio ↗</a></div></article>`; }).join('');
  const workCards = orderedWorks.map((w,index) => `<a class="pv-collection-work" href="/work/${encodeURIComponent(w.itemId)}"><div class="pv-collection-work-image"><img loading="lazy" decoding="async" src="/media/${encodeURIComponent(w.itemId)}" alt="${escapeHtml(w.title || 'Karya inspirasi')}"/><span>0${index+1}</span></div><div class="pv-collection-work-caption"><div><strong>${escapeHtml(w.title || 'Selected work')}</strong><small>${escapeHtml(w.category || 'Creative project')}</small></div><b aria-hidden="true">↗</b></div></a>`).join('');
  const privateNotice = board.isPublic ? '' : '<span class="pv-collection-private">PRIVATE BOARD · LINK ACCESS</span>';
  const coverWork = orderedWorks[0];
  const boardOrderMarkup = canEdit ? `<div class="pv-board-order-editor" data-pv-order-editor><div class="pv-board-order-heading"><div><strong>Urutkan karya</strong><small>Seret kartu, atau gunakan tombol naik/turun. Urutan ini akan dipakai di halaman publik.</small></div><span>${board.itemIds.length} ITEMS</span></div><div class="pv-board-order-list" data-pv-order-list>${(board.itemIds || []).map((id,index) => { const item=workById.get(id); return `<article class="pv-board-order-item" draggable="true" data-pv-sort-item data-item-id="${escapeHtml(id)}"><span class="pv-board-drag-handle" aria-hidden="true">⠿</span><span class="pv-board-order-index" data-pv-order-index>0${index+1}</span><span class="pv-board-order-copy"><strong>${escapeHtml(item?.title || 'Karya tidak tersedia')}</strong><small>${escapeHtml(id)}</small></span><span class="pv-board-order-actions"><button type="button" data-pv-order-move="up" aria-label="Pindahkan ${escapeHtml(id)} ke atas">↑</button><button type="button" data-pv-order-move="down" aria-label="Pindahkan ${escapeHtml(id)} ke bawah">↓</button><button type="button" data-pv-order-remove aria-label="Hapus ${escapeHtml(id)} dari collection">×</button></span></article>`; }).join('')}</div><p class="pv-board-order-status" data-pv-order-status role="status" aria-live="polite"></p></div>` : '';
  const editLink = canEdit ? `<section class="card pv-collection-editor"><div class="pv-collection-editor-heading"><span class="eyebrow">BOARD SETTINGS</span><h2>Curate this collection.</h2><p class="muted">Simpan link pengelolaan secara pribadi. Siapa pun yang memilikinya dapat mengubah collection.</p></div><label>Link pengelolaan rahasia</label><input readonly value="${escapeHtml(`/collections/${board.slug}?key=${encodeURIComponent(editToken)}`)}" style="width:100%;padding:10px" data-pv-select-on-click><form method="post" action="/collections/${encodeURIComponent(board.slug)}/update"><input type="hidden" name="key" value="${escapeHtml(editToken)}"><label>Nama collection</label><input name="title" maxlength="100" required value="${escapeHtml(board.title)}" style="width:100%;padding:10px;margin:5px 0"><label>Deskripsi</label><textarea name="description" maxlength="500" style="width:100%;padding:10px;margin:5px 0">${escapeHtml(board.description || '')}</textarea><label>ID desainer (pisahkan koma)</label><input name="designerIds" value="${escapeHtml(board.designerIds.join(', '))}" style="width:100%;padding:10px;margin:5px 0"><label>ID karya (pisahkan koma)</label><input name="itemIds" data-pv-order-input value="${escapeHtml(board.itemIds.join(', '))}" style="width:100%;padding:10px;margin:5px 0"><p class="pv-board-order-hint">Urutan ID karya akan mengikuti susunan kartu di bawah. Kamu juga tetap bisa mengedit ID secara manual.</p>${boardOrderMarkup}<label class="pv-collection-public-toggle"><input type="checkbox" name="isPublic" ${board.isPublic ? 'checked' : ''}> Collection publik dan dapat dibagikan</label><button class="btn" style="margin-top:12px">Simpan perubahan</button></form><form method="post" action="/collections/${encodeURIComponent(board.slug)}/delete" data-pv-confirm="Hapus collection ini?"><input type="hidden" name="key" value="${escapeHtml(editToken)}"><button class="btn btn-secondary" style="margin-top:10px">Hapus collection</button></form></section>` : '';
  const coverMarkup = coverWork ? `<div class="pv-collection-cover"><img src="/media/${encodeURIComponent(coverWork.itemId)}" alt="${escapeHtml(coverWork.title || board.title)}" fetchpriority="high"><div class="pv-collection-cover-shade"></div><div class="pv-collection-cover-copy"><span>CURATED BY PIR VISUALS</span><h2>${escapeHtml(board.title)}</h2><p>${escapeHtml(board.description || 'A curated collection of creative work and independent talent.')}</p></div><span class="pv-collection-cover-index">01 / ${String(orderedWorks.length).padStart(2,'0')}</span></div>` : `<div class="pv-collection-cover pv-collection-cover-empty"><div><span>CURATED BY PIR VISUALS</span><h2>${escapeHtml(board.title)}</h2><p>${escapeHtml(board.description || 'A curated collection of creative work and independent talent.')}</p></div></div>`;
  const boardSummary = `<section class="pv-collection-summary"><div><span class="eyebrow">VISUAL DIRECTION / COLLECTION</span><p>${escapeHtml(board.description || 'Kumpulan karya dan desainer yang dipilih untuk satu arah kreatif.')}</p>${privateNotice}</div><div class="pv-collection-stats"><div><strong>${orderedWorks.length.toLocaleString('id-ID')}</strong><small>SELECTED WORKS</small></div><div><strong>${orderedDesigners.length.toLocaleString('id-ID')}</strong><small>CREATIVE TALENT</small></div><div><strong>${Number(board.viewCount || 0).toLocaleString('id-ID')}</strong><small>BOARD VIEWS</small></div></div><div class="pv-collection-share">${board.isPublic ? `<button class="btn btn-secondary" type="button" data-share-board data-share-url="/collections/${encodeURIComponent(board.slug)}">Salin link publik ↗</button><span data-share-board-status role="status" aria-live="polite"></span>` : '<span class="pv-collection-private-note">Koleksi privat · link pengelolaan hanya untuk pemilik.</span>'}</div></section>`;
  return pageShell(`PIR Visuals — ${board.title}`, `<div class="pv-collection-page"><div class="showcase-breadcrumb"><a href="/collections">COLLECTIONS</a><span>/</span><span>${escapeHtml(board.title)}</span></div>${coverMarkup}${boardSummary}${orderedDesigners.length ? `<section class="pv-collection-section"><div class="pv-collection-section-heading"><div><span class="eyebrow">01 / CREATIVE PEOPLE</span><h2>People behind the work.</h2></div><span>${orderedDesigners.length} DESIGNERS</span></div><div class="pv-collection-people">${designerCards}</div></section>` : ''}<section class="pv-collection-section"><div class="pv-collection-section-heading"><div><span class="eyebrow">02 / VISUAL REFERENCES</span><h2>Selected work<span>.</span></h2></div><span>${orderedWorks.length} PROJECTS</span></div><div class="pv-collection-work-grid">${workCards || '<div class="pv-collection-empty"><h3>Belum ada karya inspirasi.</h3><p>Tambahkan karya yang sudah dipublikasikan untuk membangun arah visual board ini.</p></div>'}</div></section>${editLink}<p class="pv-collection-backlink"><a href="/collections">Buat collection sendiri ↗</a></p></div>`);
}

function designerCard(d) {
  const href = d.slug ? `/p/${encodeURIComponent(d.slug)}` : `/designer/${encodeURIComponent(d.designerId)}`;
  const displayName = String(d.displayName || 'Designer');
  const previewAvatar = getDesignerAvatarSrc(d);
  const previewSpecialties = (d.specialties || []).slice(0, 5).join(' · ');
  const avatarMarkup = previewAvatar
    ? `<img src="${escapeHtml(previewAvatar)}" alt="Foto profil ${escapeHtml(displayName)}" loading="lazy" decoding="async">`
    : `<span aria-hidden="true">${escapeHtml(displayName.trim().slice(0, 1).toUpperCase() || 'P')}</span>`;
  const badges = [
    d.isFeatured ? '<span class="designer-card-badge is-featured">★ Featured</span>' : '',
    d.isVerified ? '<span class="designer-card-badge is-verified" title="Profil telah ditinjau tim PIR; bukan verifikasi transaksi atau hasil kerja">✓ Ditinjau PIR</span>' : '',
    d.category ? `<span class="designer-card-badge">${escapeHtml(d.category)}</span>` : '',
  ].filter(Boolean).join('');
  const skills = (d.specialties || []).slice(0, 4).map(x => `<span>${escapeHtml(x)}</span>`).join('');
  const fitReasons = Array.isArray(d._fitReasons) ? d._fitReasons.slice(0, 4) : [];
  const fitReasonsMarkup = fitReasons.length ? `<div class="designer-card-match-reasons" aria-label="Alasan kecocokan"><small>MATCH SIGNALS</small>${fitReasons.map(reason => `<span>${escapeHtml(reason)}</span>`).join('')}</div>` : '';
  const hasDirectContact = Boolean(getPublicContactPhone(d));
  return `<article class="card designer-card" data-designer-id="${escapeHtml(d.designerId)}">
    <div class="designer-card-cover"><span class="designer-card-cover-label">PIR VISUALS <i> / CREATIVE INDEX</i></span><span class="designer-card-cover-art" aria-hidden="true"><i></i><i></i><i></i></span><div class="designer-card-portrait">${avatarMarkup}</div>
      <button class="pv-quick-preview-trigger" type="button" data-pv-designer-preview data-preview-name="${escapeHtml(displayName)}" data-preview-location="${escapeHtml(d.location || 'Lokasi belum diatur')}" data-preview-bio="${escapeHtml(String(d.bio || '').slice(0, 500))}" data-preview-category="${escapeHtml(d.category || 'Independent creative')}" data-preview-price="${escapeHtml(money(d.priceMin))}" data-preview-specialties="${escapeHtml(previewSpecialties)}" data-preview-avatar="${escapeHtml(previewAvatar)}" data-preview-profile="${href}" aria-label="Preview singkat ${escapeHtml(displayName)}">Quick view <span aria-hidden="true">↗</span></button>
    </div>
    <div class="designer-card-content">
      <div class="designer-card-badges">${badges}</div>
      <div class="designer-card-heading"><div><h2>${escapeHtml(displayName)}</h2><p>⌖ ${escapeHtml(d.location || 'Lokasi belum diatur')}</p></div><span class="designer-card-availability ${hasDirectContact ? 'is-open' : ''}"><i></i>${hasDirectContact ? 'Kontak tersedia' : 'Kontak belum dicantumkan'}</span></div>
      <p class="designer-card-bio">${escapeHtml(String(d.bio || 'Desainer independen yang siap membangun solusi visual untuk kebutuhan brand dan bisnis.').slice(0, 180))}</p>
      <div class="designer-card-skills">${skills || '<span>Creative design</span>'}</div>${fitReasonsMarkup}
      <div class="designer-card-price"><span>STARTING AT</span><strong>${money(d.priceMin)}</strong><small>ID ${escapeHtml(d.designerId)}</small></div>
      <div class="card-bottom"><a class="btn designer-card-profile-link" href="${href}">Lihat portfolio <span aria-hidden="true">↗</span></a><button class="favorite-btn" type="button" data-favorite="${escapeHtml(d.designerId)}" aria-pressed="false" aria-label="Simpan ${escapeHtml(displayName)} ke favorit">♡ Favorit</button><button class="shortlist-btn" type="button" data-shortlist="${escapeHtml(d.designerId)}" aria-pressed="false">＋ Bandingkan</button></div>
    </div>
  </article>`;
}
async function renderDirectory(url) {
  const filters = parseDirectoryFilters(url.searchParams);
  const { q, skill, category, location, verifiedOnly, featuredOnly, acceptingOnly, min, max, sort } = filters;
  const filter = buildDirectoryMongoFilter(filters, escapeRegex);
  const [filteredTotal, total, verified, accepting] = await Promise.all([
    DesignerProfile.countDocuments(filter),
    DesignerProfile.countDocuments({ isPublic: true }),
    DesignerProfile.countDocuments({ isPublic: true, isVerified: true }),
    DesignerProfile.countDocuments({ isPublic: true, acceptsOrders: true }),
  ]);
  const pagination = getDirectoryPagination(filters.page, filteredTotal, DIRECTORY_PAGE_SIZE);
  const designers = sort === 'fit' && filters.hasMatchCriteria
    ? await DesignerProfile.aggregate(buildDesignerFitPipeline(filter, filters, pagination.skip, pagination.pageSize, escapeRegex))
    : sort === 'relevance' && q
      ? await DesignerProfile.aggregate(buildDirectoryRelevancePipeline(filter, q, pagination.skip, pagination.pageSize, escapeRegex))
      : await DesignerProfile.find(filter)
        .select('designerId slug displayName location bio specialties priceMin priceMax isFeatured isVerified acceptsOrders contactPhone publicWhatsApp avatarUrl avatarPath category createdAt')
        .sort(buildDirectorySort(sort))
        .skip(pagination.skip)
        .limit(pagination.pageSize)
        .lean();
  const cards = designers.map(designerCard).join('');
  const workConditions = [{ moderationStatus: 'approved' }];
  if (category) workConditions.push({ category: { $regex: escapeRegex(category), $options: 'i' } });
  if (q) workConditions.push({ $or: [
    { title: { $regex: escapeRegex(q), $options: 'i' } },
    { description: { $regex: escapeRegex(q), $options: 'i' } },
    { category: { $regex: escapeRegex(q), $options: 'i' } },
  ] });
  const workFilter = workConditions.length > 1 ? { $and: workConditions } : workConditions[0];
  const selectedWorks = await findPublishedWorks(workFilter, { featured: -1, createdAt: -1, _id: -1 }, 8, {
    itemId: 1, title: 1, category: 1, description: 1, publicAuthor: 1,
  });
  const workCategories = [...new Set(selectedWorks.map(work => String(work.category || 'Creative project').trim()).filter(Boolean))];
  const workFilterChips = ['Semua', ...workCategories].map((name,index) => `<button type="button" class="pv-work-filter-chip" data-pv-work-filter="${index === 0 ? 'all' : escapeHtml(name)}" aria-pressed="${index === 0 ? 'true' : 'false'}">${escapeHtml(name)}</button>`).join('');
  const selectedWorkCards = selectedWorks.map((work,index) => {
    const author = work.publicAuthor;
    return `<a class="pv-selected-work-card" data-pv-work-card data-pv-work-category="${escapeHtml(work.category || 'Creative project')}" href="/work/${encodeURIComponent(work.itemId)}"><div class="pv-selected-work-image"><img src="/media/${encodeURIComponent(work.itemId)}" alt="${escapeHtml(work.title || 'Selected work')}" loading="lazy" decoding="async"><span>0${index+1} / VIEW PROJECT ↗</span></div><div class="pv-selected-work-copy"><small>${escapeHtml(work.category || 'Creative project')}</small><strong>${escapeHtml(work.title || 'Untitled project')}</strong><span>By ${escapeHtml(author?.displayName || 'PIR Visuals creator')}</span></div></a>`;
  }).join('');
  const selectedWorkSection = selectedWorks.length ? `<section class="pv-selected-work-section" data-pv-work-explorer><div class="pv-selected-work-heading"><div><span class="eyebrow">THE COMMUNITY / SELECTED WORK</span><h2>Look closer.<br><em>Find your direction.</em></h2><p class="muted">Jelajahi karya yang sudah dipublikasikan. Filter berdasarkan bidang atau cari judul yang menarik perhatianmu.</p></div><span class="pv-selected-work-index">${selectedWorks.length.toString().padStart(2,'0')} SELECTED PROJECTS</span></div><div class="pv-selected-work-tools"><div class="pv-work-filter-chips" role="group" aria-label="Filter kategori karya">${workFilterChips}</div><label class="pv-work-search-label"><span class="sr-only">Cari karya pilihan</span><input type="search" data-pv-work-search placeholder="Cari karya atau kategori…" autocomplete="off"></label></div><div class="pv-selected-work-grid">${selectedWorkCards}</div><p class="pv-work-filter-status" data-pv-work-filter-status role="status" aria-live="polite">Menampilkan ${selectedWorks.length} karya.</p></section>` : '';
  const activeFilterCount = [skill, category, location, min ? String(min) : '', max ? String(max) : '', sort !== (q ? 'relevance' : 'featured') ? sort : '', verifiedOnly ? 'verified' : '', featuredOnly ? 'featured' : '', acceptingOnly ? 'available' : ''].filter(Boolean).length;
  const paginationMarkup = pagination.totalPages > 1 ? `<nav class="pv-directory-pagination" aria-label="Halaman hasil desainer"><span class="pv-directory-page-summary">Halaman ${pagination.page} dari ${pagination.totalPages}</span><div class="pv-directory-page-links">${pagination.hasPrevious ? `<a class="btn btn-ghost" rel="prev" href="${escapeHtml(buildDirectoryPageUrl(url.searchParams, pagination.page - 1))}">← Sebelumnya</a>` : ''}${pagination.pages.map(pageNumber => pageNumber === pagination.page ? `<span class="btn pv-page-current" aria-current="page">${pageNumber}</span>` : `<a class="btn btn-ghost" href="${escapeHtml(buildDirectoryPageUrl(url.searchParams, pageNumber))}">${pageNumber}</a>`).join('')}${pagination.hasNext ? `<a class="btn btn-ghost" rel="next" href="${escapeHtml(buildDirectoryPageUrl(url.searchParams, pagination.page + 1))}">Berikutnya →</a>` : ''}</div></nav>` : '';
  const budgetError = filters.budgetInvalid ? '<p class="pv-directory-filter-error" role="alert">Harga minimum tidak boleh lebih besar dari harga maksimum. Periksa kembali rentang anggaranmu.</p>' : '';
  const matchCategories = ['Branding','UI/UX','Graphic Design','Illustration','Motion Design','3D Design','Packaging','Social Media','Web Design','Photography'];
  const matchCategoryOptions = [`<option value="">Pilih bidang kreatif</option>`, ...(category && !matchCategories.includes(category) ? [`<option value="${escapeHtml(category)}" selected>${escapeHtml(category)}</option>`] : []), ...matchCategories.map(name => `<option value="${escapeHtml(name)}" ${category === name ? 'selected' : ''}>${escapeHtml(name)}</option>`)].join('');
  const matchFinder = `<section class="pv-match-finder" aria-labelledby="pv-match-finder-title"><div class="pv-match-finder-copy"><span class="eyebrow">GUIDED DESIGNER FINDER / 01</span><h2 id="pv-match-finder-title">Mulai dari kebutuhanmu.</h2><p>Jawab beberapa hal sederhana. PIR akan mengurutkan profil berdasarkan kecocokan bidang, skill, lokasi, dan rentang anggaran yang tersedia.</p></div><form method="get" action="/discover" class="pv-match-finder-form"><input type="hidden" name="sort" value="fit"><label>Bidang yang kamu butuhkan<select name="category">${matchCategoryOptions}</select></label><label>Skill atau spesialisasi<input name="skill" maxlength="50" value="${escapeHtml(skill)}" placeholder="Contoh: brand identity, product UI"></label><label>Rentang anggaran<select name="budget"><option value="any" ${filters.budget === 'any' ? 'selected' : ''}>Belum ditentukan</option><option value="under-500k" ${filters.budget === 'under-500k' ? 'selected' : ''}>Di bawah Rp500 ribu</option><option value="500k-1.5m" ${filters.budget === '500k-1.5m' ? 'selected' : ''}>Rp500 ribu–1,5 juta</option><option value="1.5m-5m" ${filters.budget === '1.5m-5m' ? 'selected' : ''}>Rp1,5–5 juta</option><option value="above-5m" ${filters.budget === 'above-5m' ? 'selected' : ''}>Di atas Rp5 juta</option></select></label><label>Lokasi (opsional)<input name="location" maxlength="60" value="${escapeHtml(location)}" placeholder="Contoh: Bandung, Jakarta"></label><label class="pv-match-finder-keyword">Kata kunci tambahan (opsional)<input name="q" maxlength="80" value="${escapeHtml(q)}" placeholder="Contoh: minimalis, kemasan kopi, dashboard"></label><div class="pv-match-finder-actions"><button class="btn" type="submit">Temukan desainer yang cocok ↗</button><a href="/discover" class="btn btn-ghost">Mulai ulang</a></div></form><p class="pv-match-finder-note">Pencocokan memakai data profil dan kisaran harga yang dipublikasikan. Hasil bukan penilaian kualitas, jaminan ketersediaan, atau rekomendasi transaksi. Kamu tetap menghubungi desainer secara langsung.</p></section>`;
  const matchResultNote = sort === 'fit' && filters.hasMatchCriteria ? '<p class="pv-match-result-note">Diurutkan berdasarkan kecocokan kriteria yang kamu isi. Sinyal kecocokan ditampilkan pada setiap profil; profil unggulan atau ditinjau tidak otomatis mendapat skor lebih tinggi.</p>' : '';
  const body = `<section class="edition-directory-hero">
    <div class="edition-directory-heading"><p class="edition-kicker"><span aria-hidden="true"></span> Direktori kreatif</p><h1>Temukan desainer<br><em>yang tepat.</em></h1></div>
    <div class="edition-directory-intro"><p>Jelajahi portfolio, bandingkan keahlian dan harga, lalu hubungi desainer secara langsung.</p>
      <a class="edition-link" href="/categories">Jelajahi kategori <span class="edition-arrow" aria-hidden="true"></span></a>
      <dl class="edition-index"><div><dt>Desainer publik</dt><dd>${total.toLocaleString('id-ID')}</dd></div><div><dt>Ditinjau PIR</dt><dd>${verified.toLocaleString('id-ID')}</dd></div><div><dt>Terima brief</dt><dd>${accepting.toLocaleString('id-ID')}</dd></div></dl>
    </div>
  </section><section class="pv-discovery-stage"><div class="pv-directory-layout"><section class="pv-discovery-search-band" aria-label="Pencarian dan filter talenta"><section class="pv-discovery-shell"><div class="section-head"><div><span class="eyebrow">Smart discovery</span><h2>Cari talenta</h2><p class="muted">Gunakan filter untuk menemukan kecocokan.</p></div></div><form method="get" action="/discover" class="search-panel pv-discovery-filters" data-discovery-filters data-pv-submit-feedback data-filter-active="${activeFilterCount}"><label class="pv-filter-keyword">Kata kunci<input name="q" value="${escapeHtml(q)}" placeholder="Nama, skill, bio..." style="display:block;width:100%;margin-top:6px"></label><button class="edition-search-button" type="submit">Cari</button><button class="pv-filter-toggle" type="button" data-filter-toggle aria-expanded="${activeFilterCount > 0 ? 'true' : 'false'}" aria-controls="pv-filter-panel"><span>Filter &amp; urutkan</span><span class="pv-filter-count" data-filter-count ${activeFilterCount ? '' : 'hidden'}>${activeFilterCount}</span><span class="pv-filter-chevron" aria-hidden="true">⌄</span></button><div class="pv-filter-panel ${activeFilterCount ? 'is-expanded' : ''}" id="pv-filter-panel" data-filter-panel><div class="pv-filter-panel-inner"><div class="pv-filter-fields"><label>Skill<input name="skill" value="${escapeHtml(skill)}" placeholder="Branding, UI/UX..." style="display:block;width:100%;margin-top:6px"></label><label>Kategori<input name="category" value="${escapeHtml(category)}" placeholder="Branding, UI/UX..." style="display:block;width:100%;margin-top:6px"></label><label>Lokasi<input name="location" value="${escapeHtml(location)}" placeholder="Bandung, Jakarta..." style="display:block;width:100%;margin-top:6px"></label><label>Urutkan<select name="sort" style="display:block;width:100%;margin-top:6px"><option value="relevance" ${sort==='relevance'?'selected':''}>Paling relevan</option><option value="fit" ${sort==='fit'?'selected':''}>Kecocokan kebutuhan</option><option value="featured" ${sort==='featured'?'selected':''}>Unggulan</option><option value="newest" ${sort==='newest'?'selected':''}>Terbaru</option><option value="name" ${sort==='name'?'selected':''}>Nama A–Z</option><option value="price-low" ${sort==='price-low'?'selected':''}>Harga terendah</option><option value="price-high" ${sort==='price-high'?'selected':''}>Harga tertinggi</option></select></label><label>Harga minimum<input type="number" min="0" name="min" value="${min||''}" placeholder="Rp" style="display:block;width:100%;margin-top:6px"></label><label>Harga maksimum<input type="number" min="0" name="max" value="${max||''}" placeholder="Rp" style="display:block;width:100%;margin-top:6px"></label></div><div class="discovery-shortcuts"><span>Popular:</span><a href="/discover?category=Branding">Branding</a><a href="/discover?category=UI%2FUX">UI/UX</a><a href="/discover?category=Illustration">Illustration</a><a href="/discover?category=Motion">Motion</a></div><div class="filter-row"><label><input type="checkbox" name="verified" value="1" ${verifiedOnly?'checked':''}> Profil ditinjau PIR</label><label><input type="checkbox" name="featured" value="1" ${featuredOnly?'checked':''}> Featured</label><label><input type="checkbox" name="available" value="1" ${acceptingOnly?'checked':''}> Terima brief via workspace</label></div><div class="filter-row pv-filter-actions"><button class="btn" type="submit">Terapkan filter</button><a class="btn btn-ghost" href="/discover">Reset</a></div></div></div></form></section></section><div class="pv-directory-results"><div class="section-head"><div><span class="eyebrow">Directory</span><h2>${sort === 'fit' ? 'Kecocokan untuk kebutuhanmu' : 'Desainer pilihan'}</h2><p class="muted">${pagination.total ? `Menampilkan ${pagination.start.toLocaleString('id-ID')}–${pagination.end.toLocaleString('id-ID')} dari ${pagination.total.toLocaleString('id-ID')} desainer yang cocok.` : total === 0 ? 'Belum ada profil desainer publik. Direktori akan terisi setelah profil diterbitkan.' : 'Belum ada desainer yang cocok dengan filter ini.'}</p>${matchResultNote}</div></div>${budgetError}<section class="grid">${cards || (total === 0 ? '<div class="card empty-state"><h2>Direktori sedang menanti karya pertamanya</h2><p class="muted">Belum ada profil desainer yang dipublikasikan. Jika kamu seorang desainer, bangun profil dan unggah portofoliomu di Designer Studio.</p><a class="btn btn-secondary" href="/studio">Mulai membuat profil ↗</a></div>' : '<div class="card empty-state"><h2>Belum ada desainer yang cocok</h2><p class="muted">Coba ubah kata kunci, rentang harga, atau hapus beberapa filter.</p><a class="btn btn-secondary" href="/discover">Lihat semua desainer</a></div>')}</section>${paginationMarkup}</div></div>${selectedWorkSection}${matchFinder}<section id="cara-kerja" class="card"><span class="eyebrow">Simple workflow</span><h2>Cara kerja PIR Visuals</h2><div class="grid"><div><h3>01 · Temukan</h3><p class="muted">Cari desainer berdasarkan skill, lokasi, harga dan status ketersediaan.</p></div><div><h3>02 · Lihat karya</h3><p class="muted">Periksa portfolio, layanan, harga dan pengalaman sebelum memilih.</p></div><div><h3>03 · Hubungi langsung</h3><p class="muted">Diskusikan kebutuhan dan pemesanan langsung dengan desainer pilihanmu.</p></div></div></section></section>`;
  return pageShell('PIR Visuals — Direktori Desainer', body);
}

async function renderDashboard(csrf) {
  const [designers, verified, featured, works, pending, services, analytics, daily, totalReviews, publishedReviews] = await Promise.all([
    DesignerProfile.countDocuments({ isPublic: true }),
    DesignerProfile.countDocuments({ isPublic: true, isVerified: true }),
    DesignerProfile.countDocuments({ isPublic: true, isFeatured: true }),
    PortfolioItem.countDocuments({ moderationStatus: 'approved' }),
    PortfolioItem.find({ moderationStatus: 'pending' }).sort({ createdAt: 1 }).limit(50).lean(),
    DesignService.countDocuments({ isActive: true }),
    DesignerAnalytics.aggregate([{ $group: { _id: null, views: { $sum: '$profileViews' }, contacts: { $sum: '$contactClicks' }, portfolioViews: { $sum: '$portfolioViews' } } }]),
    DesignerAnalytics.aggregate([{ $unwind: '$daily' }, { $group: { _id: '$daily.date', views: { $sum: '$daily.views' }, contacts: { $sum: '$daily.contacts' } } }, { $sort: { _id: -1 } }, { $limit: 14 }]),
    DesignerTestimonial.countDocuments({ emailVerified: true }),
    DesignerTestimonial.countDocuments({ emailVerified: true, isPublished: true }),
  ]);
  const a = analytics[0] || {};
  const cmsDoc = await PortfolioSiteContent.findOne({ key: 'homepage' }).lean();
  const cms = cmsDoc?.value || {};
  const [ownerWorks, ownerProfiles] = await Promise.all([
    PortfolioItem.find({}).sort({ createdAt: -1, _id: -1 }).limit(80).lean(),
    DesignerProfile.find({}).select('designerId displayName location isPublic isVerified isFeatured acceptsOrders priceMin priceMax').sort({ displayName: 1 }).limit(200).lean(),
  ]);
  const ownerProfileById = new Map(ownerProfiles.map(profile => [profile.designerId, profile]));
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sinceDay = since30.toISOString().slice(0,10);
  const [siteViews30, designerMetrics30Rows, leadCount30, leadStatusRows, campaignRows, categoryRows, leadSourceRows, topDesignerRows] = await Promise.all([
    SiteAnalyticsEvent.countDocuments({ eventType:'page_view', createdAt:{ $gte:since30 } }),
    DesignerAnalytics.aggregate([
      { $unwind:'$daily' }, { $match:{ 'daily.date':{ $gte:sinceDay } } },
      { $group:{ _id:null, profileViews:{ $sum:'$daily.views' }, contacts:{ $sum:'$daily.contacts' }, portfolioViews:{ $sum:'$daily.portfolioViews' } } },
    ]),
    DesignerLead.countDocuments({ createdAt:{ $gte:since30 } }),
    DesignerLead.aggregate([{ $match:{ createdAt:{ $gte:since30 } } },{ $group:{ _id:'$status', count:{ $sum:1 } } }]),
    SiteAnalyticsEvent.aggregate([{ $match:{ eventType:'campaign_click', createdAt:{ $gte:since30 }, campaignId:{ $gt:'' } } },{ $group:{ _id:'$campaignId', clicks:{ $sum:1 } } },{ $sort:{ clicks:-1 } },{ $limit:5 }]),
    SiteAnalyticsEvent.aggregate([{ $match:{ eventType:'category_click', createdAt:{ $gte:since30 }, category:{ $gt:'' } } },{ $group:{ _id:'$category', clicks:{ $sum:1 } } },{ $sort:{ clicks:-1 } },{ $limit:6 }]),
    DesignerLead.aggregate([{ $match:{ createdAt:{ $gte:since30 } } },{ $group:{ _id:'$source', count:{ $sum:1 } } },{ $sort:{ count:-1 } }]),
    DesignerAnalytics.aggregate([
      { $unwind:'$daily' }, { $match:{ 'daily.date':{ $gte:sinceDay } } },
      { $group:{ _id:'$designerId', contactClicks:{ $sum:'$daily.contacts' }, profileViews:{ $sum:'$daily.views' } } },
      { $sort:{ contactClicks:-1, profileViews:-1 } }, { $limit:20 },
    ]),
  ]);
  const metrics30 = designerMetrics30Rows[0] || {};
  const topDesignerIds = topDesignerRows.map(row => row._id).filter(Boolean);
  const topDesignerProfiles = topDesignerIds.length ? await DesignerProfile.find({ designerId:{ $in:topDesignerIds }, isPublic:true }).select('designerId slug displayName location').lean() : [];
  const topDesignerById = new Map(topDesignerProfiles.map(profile => [profile.designerId,profile]));
  const leadStatus = Object.fromEntries(leadStatusRows.map(row => [row._id,Number(row.count||0)]));
  const funnelProfileViews = Number(metrics30.profileViews||0);
  const funnelContacts = Number(metrics30.contacts||0);
  const funnelLeads = Number(leadCount30||0);
  const contactRate = funnelProfileViews ? Math.min(100, funnelContacts / funnelProfileViews * 100) : 0;
  const leadRate = funnelContacts ? Math.min(100, funnelLeads / funnelContacts * 100) : 0;
  const campaignTitle = id => {
    const match = String(id||'').match(/^cms-slide-([1-3])$/);
    if (String(id||'').startsWith('showcase-event-')) return 'Owner event showcase';
    if (String(id||'').startsWith('showcase-')) return 'Community work showcase';
    if (id === 'featured-designer') return 'Featured designer rotation';
    if (id === 'latest-portfolio') return 'Latest portfolio feature';
    const slide = match ? (Array.isArray(cms?.slides) ? cms.slides[Number(match[1])-1] : null) : null;
    return String(slide?.title || `Homepage banner ${match?.[1] || ''}`).slice(0,80);
  };
  const topDesignerMarkup = topDesignerRows.map(row => {
    const profile = topDesignerById.get(row._id);
    if (!profile) return '';
    const href = profile.slug ? `/p/${encodeURIComponent(profile.slug)}` : `/designer/${encodeURIComponent(profile.designerId)}`;
    return `<a class="growth-ranking-row" href="${href}"><span class="growth-rank-name"><b>${escapeHtml(profile.displayName)}</b><small>${escapeHtml(profile.location||'Indonesia')}</small></span><span><b>${Number(row.contactClicks||0).toLocaleString('id-ID')}</b><small>CONTACTS</small></span><span><b>${Number(row.profileViews||0).toLocaleString('id-ID')}</b><small>VIEWS</small></span><i>↗</i></a>`;
  }).filter(Boolean).slice(0,5).join('') || '<p class="growth-empty">Belum ada aktivitas desainer yang cukup untuk membuat ranking.</p>';
  const campaignMarkup = campaignRows.map(row => `<div class="growth-bar-row"><span>${escapeHtml(campaignTitle(row._id))}</span><b>${Number(row.clicks||0).toLocaleString('id-ID')}</b><i style="--bar:${Math.max(3,Math.round(Number(row.clicks||0)/Math.max(1,...campaignRows.map(item=>Number(item.clicks||0)))*100))}%"></i></div>`).join('') || '<p class="growth-empty">Klik banner mulai dihitung setelah update ini aktif.</p>';
  const categoryMarkup = categoryRows.map(row => `<div class="growth-category-row"><span>${escapeHtml(row._id)}</span><b>${Number(row.clicks||0).toLocaleString('id-ID')} <small>clicks</small></b></div>`).join('') || '<p class="growth-empty">Belum ada data klik kategori. Data akan muncul seiring pengunjung menjelajah.</p>';
  const sourceMarkup = leadSourceRows.map(row => `<div class="growth-category-row"><span>${escapeHtml(row._id||'portfolio')}</span><b>${Number(row.count||0).toLocaleString('id-ID')} <small>leads</small></b></div>`).join('') || '<p class="growth-empty">Belum ada lead dalam 30 hari terakhir.</p>';
  const funnelBar = (label,value,percent) => `<div class="growth-funnel-step"><div><span>${label}</span><b>${Number(value||0).toLocaleString('id-ID')}</b></div><i><span style="width:${Math.max(0,Math.min(100,percent))}%"></span></i></div>`;
  const growthPanel = `<section class="growth-intelligence" id="growth-intelligence">
    <div class="growth-heading"><div><span class="eyebrow">PIR VISUALS / GROWTH INTELLIGENCE</span><h2>Understand what moves<br><em>the creative network.</em></h2><p>Ringkasan 30 hari terakhir berdasarkan kunjungan, interaksi, dan brief yang benar-benar tercatat. Data kampanye mulai terkumpul sejak versi ini aktif.</p></div><span class="growth-period">LAST 30 DAYS</span></div>
    <div class="growth-kpis"><article><small>PUBLIC PAGE VIEWS</small><strong>${Number(siteViews30||0).toLocaleString('id-ID')}</strong><span>Traffic halaman publik</span></article><article><small>DESIGNER PROFILE VIEWS</small><strong>${funnelProfileViews.toLocaleString('id-ID')}</strong><span>Eksplorasi profil</span></article><article><small>DIRECT CONTACT CLICKS</small><strong>${funnelContacts.toLocaleString('id-ID')}</strong><span>Minat menghubungi desainer</span></article><article><small>NEW PROJECT BRIEFS</small><strong>${funnelLeads.toLocaleString('id-ID')}</strong><span>Brief masuk 30 hari</span></article></div>
    <div class="growth-dashboard-grid">
      <article class="growth-panel growth-funnel"><div class="growth-panel-head"><div><span>01 / CONVERSION</span><h3>Discovery to inquiry.</h3></div><small>30 DAYS</small></div>
        ${funnelBar('Profile views',funnelProfileViews,100)}${funnelBar('Contact clicks',funnelContacts,contactRate)}${funnelBar('Project briefs',funnelLeads,leadRate)}
        <div class="growth-rates"><div><b>${contactRate.toFixed(1)}%</b><span>Profile → contact</span></div><div><b>${leadRate.toFixed(1)}%</b><span>Contact → brief</span></div></div>
        <p class="growth-footnote">Rasio adalah indikator aktivitas agregat, bukan atribusi transaksi atau pendapatan. Kunjungan dideduplikasi singkat untuk membatasi spam; alamat IP tidak disimpan.</p>
      </article>
      <article class="growth-panel"><div class="growth-panel-head"><div><span>02 / TALENT SIGNAL</span><h3>Designers to watch.</h3></div><small>30 DAYS</small></div><div class="growth-ranking">${topDesignerMarkup}</div><p class="growth-footnote">Diurutkan berdasarkan jumlah klik kontak, lalu profile views. Bukan rekomendasi kualitas otomatis.</p></article>
      <article class="growth-panel"><div class="growth-panel-head"><div><span>03 / CAMPAIGNS</span><h3>Showcase performance.</h3></div><small>CLICK EVENTS</small></div>${campaignMarkup}<p class="growth-footnote">Mengukur klik CTA pada etalase karya dan event Beranda, bukan tayangan iklan.</p></article>
      <article class="growth-panel"><div class="growth-panel-head"><div><span>04 / DISCOVERY</span><h3>Most explored fields.</h3></div><small>CATEGORY CLICKS</small></div>${categoryMarkup}<p class="growth-footnote">Klik kategori dari homepage dan halaman kategori.</p></article>
      <article class="growth-panel"><div class="growth-panel-head"><div><span>05 / LEAD QUALITY</span><h3>Project pipeline.</h3></div><small>30 DAYS</small></div><div class="growth-status-grid"><div><b>${leadStatus.new||0}</b><span>New</span></div><div><b>${leadStatus.contacted||0}</b><span>Contacted</span></div><div><b>${leadStatus.qualified||0}</b><span>Qualified</span></div><div><b>${leadStatus.won||0}</b><span>Won</span></div><div><b>${leadStatus.closed||0}</b><span>Closed</span></div></div><div class="growth-source-list">${sourceMarkup}</div></article>
    </div>
  </section>`;
  const metric = (label, value) => `<article class="card"><p class="muted">${label}</p><h2>${Number(value || 0).toLocaleString('id-ID')}</h2></article>`;
  const maxViews = Math.max(1, ...daily.map(x => Number(x.views || 0)));
  const chart = daily.reverse().map(x => `<div style="display:flex;align-items:center;gap:10px;margin:8px 0"><small style="width:92px;color:var(--muted)">${escapeHtml(x._id)}</small><div style="background:#1c8c68;height:14px;width:${Math.max(2, Math.round(Number(x.views || 0) / maxViews * 70))}%;border-radius:5px"></div><small>${Number(x.views || 0)} views · ${Number(x.contacts || 0)} kontak</small></div>`).join('') || '<p class="muted">Belum ada data harian.</p>';
  const pendingHtml = pending.map(w => `<article class="card"><strong>${escapeHtml(w.title)}</strong><p class="muted">${escapeHtml(w.itemId)} · ${escapeHtml(w.designerId)} · ${escapeHtml(w.category)}</p><p>${escapeHtml(w.description || '')}</p>${w.imagePath ? `<p><a href="/admin/media/${encodeURIComponent(w.itemId)}" target="_blank" rel="noopener">Lihat gambar</a></p>` : ''}<form method="post" action="/dashboard/moderate" style="display:flex;gap:8px;flex-wrap:wrap"><input type="hidden" name="csrf" value="${escapeHtml(csrf)}"><input type="hidden" name="itemId" value="${escapeHtml(w.itemId)}"><input type="text" name="reason" maxlength="240" placeholder="Catatan (opsional)" style="padding:9px"><button class="btn" name="decision" value="approve">Setujui</button><button class="btn" name="decision" value="reject" style="background:#9b3434">Tolak</button></form></article>`).join('') || '<p class="muted">Tidak ada karya menunggu moderasi.</p>';
  const ownerDesignerOptions = ownerProfiles.map(profile => `<option value="${escapeHtml(profile.designerId)}">${escapeHtml(profile.displayName || profile.designerId)} · ${escapeHtml(profile.designerId)}</option>`).join('');
  const ownerStatusOptions = (status) => ['pending','approved','rejected'].map(value => `<option value="${value}" ${String(status || 'pending') === value ? 'selected' : ''}>${value === 'approved' ? 'Disetujui / Publik' : value === 'rejected' ? 'Ditolak' : 'Menunggu moderasi'}</option>`).join('');
  const ownerWorkCards = ownerWorks.map(work => {
    const author = ownerProfileById.get(work.designerId);
    const image = work.imagePath ? `<a class="owner-work-preview" href="/admin/media/${encodeURIComponent(work.itemId)}" target="_blank" rel="noopener"><img src="/admin/media/${encodeURIComponent(work.itemId)}" alt="${escapeHtml(work.title || 'Pratinjau karya')}" loading="lazy"><span>Lihat media ↗</span></a>` : '<div class="owner-work-preview owner-work-preview-empty">Belum ada gambar</div>';
    return `<article class="owner-work-card"><div class="owner-work-card-heading"><span class="owner-work-status status-${escapeHtml(work.moderationStatus || 'pending')}">${escapeHtml(work.moderationStatus || 'pending')}</span><small>${escapeHtml(work.itemId)}</small></div>${image}<div class="owner-work-author"><strong>${escapeHtml(author?.displayName || work.designerId || 'Desainer tidak ditemukan')}</strong><span>${escapeHtml(work.designerId || '')}</span></div><form method="post" action="/dashboard/work" enctype="multipart/form-data" class="owner-work-edit-form"><input type="hidden" name="csrf" value="${escapeHtml(csrf)}"><input type="hidden" name="itemId" value="${escapeHtml(work.itemId)}"><input type="hidden" name="action" value="update"><label>Desainer<select name="designerId" required>${ownerProfiles.map(profile => `<option value="${escapeHtml(profile.designerId)}" ${profile.designerId === work.designerId ? 'selected' : ''}>${escapeHtml(profile.displayName || profile.designerId)}</option>`).join('')}</select></label><label>Judul karya<input name="title" maxlength="100" required value="${escapeHtml(work.title || '')}"></label><label>Kategori<input name="category" maxlength="60" required value="${escapeHtml(work.category || '')}"></label><label>Harga mulai (Rp)<input type="number" name="priceFrom" min="0" max="100000000" step="1000" value="${Math.max(0,Number(work.priceFrom || 0))}"></label><label>Deskripsi<textarea name="description" maxlength="800">${escapeHtml(work.description || '')}</textarea></label><label>Status publikasi<select name="moderationStatus">${ownerStatusOptions(work.moderationStatus)}</select></label><label class="owner-work-featured"><input type="checkbox" name="featured" ${work.featured ? 'checked' : ''}> Jadikan karya unggulan</label><label>Ganti gambar utama (opsional)<input type="file" name="mediaFile" accept="image/jpeg,image/png,image/webp,image/svg+xml"></label><div class="owner-work-actions"><button class="btn" type="submit">Simpan perubahan</button><button class="btn btn-secondary" type="submit" name="action" value="delete" formnovalidate data-pv-confirm="Hapus karya ini secara permanen?">Hapus</button></div></form></article>`;
  }).join('') || '<p class="muted">Belum ada karya yang tercatat.</p>';
  const ownerWorkManager = `<section class="owner-manager-section" id="owner-works"><div class="owner-manager-heading"><div><span class="eyebrow">OWNER CONTROL / PORTFOLIO</span><h2>Kelola seluruh karya</h2><p>Tambahkan karya atas nama desainer, perbaiki detail, ubah harga, pilih karya unggulan, setujui, tolak, atau hapus karya.</p></div><span class="owner-manager-count">${ownerWorks.length} / 80 KARYA TERBARU</span></div><details class="owner-create-work" open><summary>＋ Tambahkan karya baru</summary><form method="post" action="/dashboard/work" enctype="multipart/form-data"><input type="hidden" name="csrf" value="${escapeHtml(csrf)}"><input type="hidden" name="action" value="create"><div class="owner-work-create-grid"><label>Atas nama desainer<select name="designerId" required>${ownerDesignerOptions || '<option value="">Belum ada profil desainer</option>'}</select></label><label>Judul karya<input name="title" maxlength="100" required placeholder="Judul karya"></label><label>Kategori<input name="category" maxlength="60" required placeholder="Contoh: Banner, Branding, UI/UX"></label><label>Harga mulai (Rp)<input type="number" name="priceFrom" min="0" max="100000000" step="1000" value="0"></label><label>Status publikasi<select name="moderationStatus">${ownerStatusOptions('approved')}</select></label><label class="owner-work-featured"><input type="checkbox" name="featured"> Jadikan karya unggulan</label><label class="owner-work-create-wide">Deskripsi<textarea name="description" maxlength="800" placeholder="Ceritakan konteks dan hasil karya."></textarea></label><label class="owner-work-create-wide">Upload gambar utama dan galeri (maksimal 5 gambar)<input type="file" name="mediaFile" accept="image/jpeg,image/png,image/webp,image/svg+xml" multiple required></label></div><p class="owner-work-help">JPG, PNG, WebP, atau SVG · maksimal 15 MB per gambar. Karya yang disetujui akan masuk ke etalase publik sesuai kategori dan harga.</p><button class="btn" type="submit" ${ownerProfiles.length ? '' : 'disabled'}>Tambahkan karya ↗</button></form></details><div class="owner-work-grid">${ownerWorkCards}</div></section>`;
  const ownerDesignerManager = `<section class="owner-manager-section" id="owner-designers"><div class="owner-manager-heading"><div><span class="eyebrow">OWNER CONTROL / DIRECTORY</span><h2>Kelola profil desainer</h2><p>Atur status publik, peninjauan PIR, profil unggulan, dan penerimaan brief.</p></div><span class="owner-manager-count">${ownerProfiles.length} PROFIL</span></div><div class="owner-designer-grid">${ownerProfiles.map(profile => `<form class="owner-designer-card" method="post" action="/dashboard/designer"><input type="hidden" name="csrf" value="${escapeHtml(csrf)}"><input type="hidden" name="designerId" value="${escapeHtml(profile.designerId)}"><div><strong>${escapeHtml(profile.displayName || profile.designerId)}</strong><small>${escapeHtml(profile.designerId)} · ${escapeHtml(profile.location || 'Lokasi belum diatur')}</small></div><label><input type="checkbox" name="isPublic" ${profile.isPublic ? 'checked' : ''}> Profil publik</label><label><input type="checkbox" name="isVerified" ${profile.isVerified ? 'checked' : ''}> Ditinjau PIR</label><label><input type="checkbox" name="isFeatured" ${profile.isFeatured ? 'checked' : ''}> Desainer unggulan</label><label><input type="checkbox" name="acceptsOrders" ${profile.acceptsOrders ? 'checked' : ''}> Menerima brief</label><div class="owner-designer-prices"><label>Harga min<input type="number" name="priceMin" min="0" value="${Math.max(0,Number(profile.priceMin || 0))}"></label><label>Harga max<input type="number" name="priceMax" min="0" value="${Math.max(0,Number(profile.priceMax || 0))}"></label></div><button class="btn btn-secondary" type="submit">Simpan profil</button></form>`).join('') || '<p class="muted">Belum ada profil desainer.</p>'}</div></section>`;
  const supportTickets = await SupportTicket.find({ status: { $in: ['open','in_progress'] } }).sort({ createdAt: -1 }).limit(60).lean();
  const supportPanel = `<section class="card support-admin-panel"><div class="support-admin-heading"><div><span class="eyebrow">CUSTOMER CARE</span><h2>Customer Support Inbox (${supportTickets.length})</h2></div><span class="tag">Open & in progress</span></div>${supportTickets.map(t=>`<article class="support-admin-ticket"><div class="support-ticket-meta"><strong>${escapeHtml(t.subject)}</strong><span>${escapeHtml(t.ticketId)} · ${escapeHtml(t.status)}</span></div><p class="muted">${escapeHtml(t.name)} · <a href="mailto:${encodeURIComponent(t.email)}">${escapeHtml(t.email)}</a> · ${escapeHtml(t.topic)}</p><p>${escapeHtml(t.message)}</p><form method="post" action="/dashboard/support"><input type="hidden" name="csrf" value="${escapeHtml(csrf)}"><input type="hidden" name="ticketId" value="${escapeHtml(t.ticketId)}"><select name="status"><option value="in_progress" ${t.status==='in_progress'?'selected':''}>Sedang ditangani</option><option value="resolved">Selesai</option><option value="closed">Tutup tiket</option></select><button class="btn btn-secondary">Perbarui status</button></form></article>`).join('') || '<p class="muted">Belum ada tiket bantuan aktif.</p>'}</section>`;
  const pendingReviews = await DesignerTestimonial.find({ emailVerified: true, isPublished: false }).sort({ createdAt: 1 }).limit(50).lean();
  const reviewModeration = `<section class="card"><h2>Ulasan dengan email terverifikasi menunggu moderasi (${pendingReviews.length})</h2>${pendingReviews.map(r=>`<article class="card"><strong>${escapeHtml(r.clientName)}</strong> · ${r.rating}/5 · ${escapeHtml(r.designerId)}<p>${escapeHtml(r.message)}</p><form method="post" action="/dashboard/review"><input type="hidden" name="csrf" value="${escapeHtml(csrf)}"><input type="hidden" name="testimonialId" value="${escapeHtml(r.testimonialId)}"><button class="btn" name="decision" value="approve">Publikasikan</button><button class="btn btn-secondary" name="decision" value="reject">Tolak</button></form></article>`).join('') || '<p class="muted">Tidak ada ulasan menunggu.</p>'}</section>`;
  const cmsCopy = cms.copy && typeof cms.copy === 'object' ? cms.copy : {};
  const cmsLayout = cms.layout && typeof cms.layout === 'object' ? cms.layout : {};
  const cmsCategorySettings = cms.categorySettings && typeof cms.categorySettings === 'object' ? cms.categorySettings : {};
  const hasSavedFaq = Array.isArray(cmsCopy.faq);
  const cmsFaq = hasSavedFaq ? cmsCopy.faq : [];
  const cmsValue = (value, fallback='') => escapeHtml(String(value ?? fallback));
  const sectionDefinitions = [
    ['showcase','Etalase karya & event','Carousel independen: karya terbaru, unggulan, termahal, termurah, dan event Owner.'],
    ['categories','Kategori kreatif','Pintu masuk berdasarkan kebutuhan desain.'],
    ['talent','Desainer unggulan','Profil kreator pilihan di homepage.'],
    ['work','Selected projects','Media pilihan Beranda yang diunggah terpisah dari portofolio desainer.'],
    ['manifesto','Brand manifesto','Penjelasan nilai dan cara kerja PIR Visuals.'],
    ['join','CTA bergabung','Ajakan untuk kreator membangun portfolio.'],
    ['faq','FAQ','Pertanyaan umum dari pengunjung.'],
  ];
  const sectionControls = sectionDefinitions.map(([key,label,description],index) => {
    const setting = cmsLayout[key] && typeof cmsLayout[key] === 'object' ? cmsLayout[key] : {};
    const order = Math.max(1,Math.min(6,Number(setting.order) || index));
    const enabledControl = key === 'showcase'
      ? `<label class="studio-toggle"><input type="checkbox" checked disabled><span>Selalu aktif</span></label>`
      : `<label class="studio-toggle"><input type="checkbox" name="section${key}Enabled" ${setting.enabled !== false?'checked':''}><span>Aktif</span></label>`;
    const orderControl = key === 'showcase'
      ? `<span class="studio-order">Terpisah di bawah hero</span>`
      : `<label class="studio-order">Urutan<select name="section${key}Order">${[1,2,3,4,5,6].map(n=>`<option value="${n}" ${order===n?'selected':''}>${n}</option>`).join('')}</select></label>`;
    return `<article class="studio-section-control"><div class="studio-section-copy"><strong>${escapeHtml(label)}</strong><small>${escapeHtml(description)}</small></div>${enabledControl}${orderControl}</article>`;
  }).join('');
  const slideEditor = [0,1,2].map(i => {
    const slide = (Array.isArray(cms.slides) ? cms.slides[i] : null) || {};
    const val = (k, fallback='') => cmsValue(slide[k],fallback);
    const enabled = slide.enabled !== false && Boolean(slide.title);
    const currentMedia = String(slide.media || slide.image || '');
    const currentType = slide.mediaType === 'video' ? 'video' : 'image';
    const safeCurrentMedia = /^https:\/\//i.test(currentMedia) || /^\/(?:media\/|homepage-media\/)/.test(currentMedia) ? currentMedia : '';
    const currentPreview = safeCurrentMedia ? (currentType === 'video' ? `<video src="${escapeHtml(safeCurrentMedia)}" controls muted playsinline preload="metadata"></video>` : `<img src="${escapeHtml(safeCurrentMedia)}" alt="Media banner saat ini">`) : '<div class="home-media-empty">Belum ada media khusus Beranda.</div>';
    return `<article class="card banner-editor" data-home-media-card><div class="studio-card-kicker">PROMOTION / 0${i+1}</div><h3>Banner ${i+1}</h3><label class="studio-toggle"><input type="checkbox" name="slide${i}Enabled" ${enabled?'checked':''}><span>Aktifkan banner</span></label><label>Jenis konten</label><select name="slide${i}Kind"><option ${slide.kind==='Event'?'selected':''}>Event</option><option ${slide.kind==='Designer pilihan'?'selected':''}>Designer pilihan</option><option ${slide.kind==='Portfolio'?'selected':''}>Portfolio</option><option ${slide.kind==='Pengumuman'?'selected':''}>Pengumuman</option><option ${slide.kind==='Highlight' || !slide.kind?'selected':''}>Highlight</option></select><label>Label kecil</label><input name="slide${i}Eyebrow" maxlength="60" value="${val('eyebrow','PIR VISUALS UPDATE')}"><label>Judul banner</label><input name="slide${i}Title" maxlength="100" value="${val('title')}" placeholder="Contoh: Design Week 2026"><label>Deskripsi</label><textarea name="slide${i}Description" maxlength="220" placeholder="Informasi singkat untuk pengunjung">${val('description')}</textarea><label>Upload foto atau video khusus Beranda</label><input type="file" name="slide${i}MediaFile" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" data-home-media-input><small class="home-media-help">JPG, PNG, WebP, MP4, atau WebM · maksimal 50 MB. File ini terpisah dari upload portofolio desainer.</small><div class="home-media-preview" data-home-media-preview data-current-url="${escapeHtml(safeCurrentMedia)}" data-current-type="${currentType}">${currentPreview}</div><label class="studio-toggle home-media-remove"><input type="checkbox" name="slide${i}RemoveMedia"><span>Hapus media banner saat ini</span></label><label>URL media eksternal (opsional)</label><input name="slide${i}Image" maxlength="500" value="${val('image')}" placeholder="https://... (jika tidak upload file)"><label>Link tujuan (HTTPS atau /discover)</label><input name="slide${i}Href" maxlength="500" value="${val('href','/discover')}"><label>Teks tombol</label><input name="slide${i}Cta" maxlength="40" value="${val('cta','Lihat selengkapnya')}"></article>`;
  }).join('');
  const homeWorkEditor = [0,1,2,3].map(i => {
    const work = (Array.isArray(cms.homeWorks) ? cms.homeWorks[i] : null) || {};
    const currentMedia = String(work.media || '');
    const currentType = work.mediaType === 'video' ? 'video' : 'image';
    const safeCurrentMedia = /^\/(?:homepage-media\/home-[A-Za-z0-9_-]{20,40}\.(?:webp|mp4|webm))$/.test(currentMedia) ? currentMedia : '';
    const currentPreview = safeCurrentMedia ? (currentType === 'video' ? `<video src="${escapeHtml(safeCurrentMedia)}" controls muted playsinline preload="metadata"></video>` : `<img src="${escapeHtml(safeCurrentMedia)}" alt="Media karya Beranda saat ini">`) : '<div class="home-media-empty">Belum ada media karya khusus Beranda.</div>';
    return `<article class="card banner-editor" data-home-media-card><div class="studio-card-kicker">HOMEPAGE WORK / 0${i+1}</div><h3>Media pilihan ${i+1}</h3><label>Judul</label><input name="homeWork${i}Title" maxlength="80" value="${cmsValue(work.title)}" placeholder="Contoh: Identitas visual Kopi Senja"><label>Deskripsi singkat (opsional)</label><textarea name="homeWork${i}Description" maxlength="180" placeholder="Contoh: Eksplorasi visual untuk brand kopi lokal.">${cmsValue(work.description)}</textarea><label>Upload foto atau video khusus Beranda</label><input type="file" name="homeWork${i}MediaFile" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" data-home-media-input><small class="home-media-help">JPG, PNG, WebP, MP4, atau WebM · maksimal 50 MB. Tidak mengambil file dari portofolio desainer.</small><div class="home-media-preview" data-home-media-preview data-current-url="${escapeHtml(safeCurrentMedia)}" data-current-type="${currentType}">${currentPreview}</div><label class="studio-toggle home-media-remove"><input type="checkbox" name="homeWork${i}RemoveMedia"><span>Hapus media saat ini</span></label><label>Link tujuan (opsional)</label><input name="homeWork${i}Href" maxlength="500" value="${cmsValue(work.href,'/discover')}" placeholder="/discover atau https://..."></article>`;
  }).join('');
  const eventEditor = [0,1,2,3,4].map(i => {
    const event = (Array.isArray(cms.events) ? cms.events[i] : null) || {};
    const currentMedia = String(event.media || '');
    const currentType = event.mediaType === 'video' ? 'video' : 'image';
    const safeCurrentMedia = /^https:\/\//i.test(currentMedia) || /^\/homepage-media\/home-[A-Za-z0-9_-]{20,40}\.(?:webp|mp4|webm)$/.test(currentMedia) ? currentMedia : '';
    const currentPreview = safeCurrentMedia ? (currentType === 'video' ? `<video src="${escapeHtml(safeCurrentMedia)}" controls muted playsinline preload="metadata"></video>` : `<img src="${escapeHtml(safeCurrentMedia)}" alt="Poster event saat ini">`) : '<div class="home-media-empty">Belum ada poster event.</div>';
    const kind = String(event.kind || 'Event').toLowerCase();
    return `<article class="card banner-editor owner-event-editor" data-home-media-card><div class="studio-card-kicker">OWNER EVENT / 0${i+1}</div><h3>Event ${i+1}</h3><label>Judul event</label><input name="event${i}Title" maxlength="100" value="${cmsValue(event.title)}" placeholder="Contoh: PIR Creative Meetup"><label>Tanggal</label><input type="date" name="event${i}Date" value="${/^\d{4}-\d{2}-\d{2}$/.test(String(event.date || '')) ? escapeHtml(event.date) : ''}"><label>Jenis kegiatan</label><select name="event${i}Kind">${['Event','Workshop','Competition','Promo','Announcement'].map(value => `<option value="${value}" ${kind === value.toLowerCase() ? 'selected' : ''}>${value}</option>`).join('')}</select><label>Deskripsi</label><textarea name="event${i}Description" maxlength="220" placeholder="Informasi singkat kegiatan.">${cmsValue(event.description)}</textarea><label>Upload poster atau video event</label><input type="file" name="event${i}MediaFile" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" data-home-media-input><small class="home-media-help">JPG, PNG, WebP, MP4, atau WebM · maksimal 50 MB.</small><div class="home-media-preview" data-home-media-preview data-current-url="${escapeHtml(safeCurrentMedia)}" data-current-type="${currentType}">${currentPreview}</div><label class="studio-toggle home-media-remove"><input type="checkbox" name="event${i}RemoveMedia"><span>Hapus poster saat ini</span></label><label>Link informasi / pendaftaran</label><input name="event${i}Href" maxlength="500" value="${cmsValue(event.href,'/contact')}" placeholder="/contact atau https://..."><label class="studio-toggle"><input type="checkbox" name="event${i}Enabled" ${event.enabled !== false && event.title ? 'checked' : ''}><span>Tampilkan di Event PIR Visuals</span></label></article>`;
  }).join('');
  const categoryDefinitions = [
    ['Brand Identity','Identitas yang konsisten, dari logo hingga sistem visual yang membangun karakter brand.'],
    ['UI/UX Design','Pengalaman digital yang intuitif, terarah, dan terasa mudah digunakan.'],
    ['Graphic Design','Komunikasi visual untuk campaign, editorial, poster, dan kebutuhan komunikasi brand.'],
    ['Illustration','Bahasa visual yang khas melalui karakter, gambar, dan cerita ilustratif.'],
    ['Motion Design','Gerak, ritme, dan storytelling untuk membuat pesan lebih hidup.'],
    ['3D Design','Bentuk, ruang, material, dan visualisasi tiga dimensi.'],
    ['Packaging','Kemasan yang menarik perhatian sekaligus menyampaikan karakter produk.'],
    ['Social Media','Konten dan sistem visual yang dirancang untuk kanal sosial.'],
    ['Web Design','Website dan landing page yang menghubungkan estetika dengan tujuan bisnis.'],
    ['Photography','Foto produk, portrait, dan visual storytelling dengan perspektif yang kuat.'],
  ];
  const categoryControls = categoryDefinitions.map(([title,description],index) => {
    const setting = cmsCategorySettings[title] && typeof cmsCategorySettings[title] === 'object' ? cmsCategorySettings[title] : {};
    return `<article class="studio-category-control"><div><strong>${escapeHtml(title)}</strong><label class="studio-toggle"><input type="checkbox" name="category${index}Enabled" ${setting.enabled !== false?'checked':''}><span>Tampilkan</span></label></div><textarea name="category${index}Description" maxlength="220">${cmsValue(setting.description,description)}</textarea></article>`;
  }).join('');
  const faqEditorDefaults = [
    { question:'Apakah PIR Visuals menjadi perantara transaksi?', answer:'Tidak. PIR Visuals adalah platform portfolio dan discovery. Klien menghubungi desainer secara langsung dan mengatur kesepakatan di antara mereka.' },
    { question:'Bagaimana cara menemukan desainer yang tepat?', answer:'Gunakan direktori untuk menyaring spesialisasi, lokasi, kisaran harga, verifikasi, dan ketersediaan. Lalu periksa portfolio dan layanan mereka.' },
    { question:'Bagaimana desainer bergabung?', answer:'Buka Designer Studio untuk membuat atau mengelola akun, profil, layanan, dan portfolio.' },
  ];
  const faqEditorItems = (hasSavedFaq ? cmsFaq : faqEditorDefaults).slice(0,20);
  const faqEditor = faqEditorItems.map((item,index) => {
    const saved = item && typeof item === 'object' ? item : {};
    return `<article class="studio-faq-control" data-faq-card><div class="studio-faq-control-head"><div class="studio-card-kicker" data-faq-kicker>FAQ / ${String(index+1).padStart(2,'0')}</div><button class="studio-faq-remove" type="button" data-faq-remove aria-label="Hapus FAQ ${index+1}">Hapus</button></div><label>Pertanyaan<input data-faq-question name="faq${index}Question" maxlength="140" value="${cmsValue(saved.question)}" placeholder="Tulis pertanyaan"></label><label>Jawaban<textarea data-faq-answer name="faq${index}Answer" maxlength="400" placeholder="Tulis jawaban">${cmsValue(saved.answer)}</textarea></label></article>`;
  }).join('');
  const copyFields = [
    ['categoryLabel','Label kategori','FIND YOUR CREATIVE MATCH',70],
    ['categoryTitle','Judul kategori','What are you\nlooking to create?',120],
    ['categoryDescription','Deskripsi kategori','Mulai dari kebutuhanmu. Temukan spesialis yang tepat melalui karya, skill, dan layanan yang mereka tampilkan.',300],
    ['talentLabel','Label desainer unggulan','THE PEOPLE BEHIND THE WORK',70],
    ['talentTitle','Judul desainer unggulan','Meet the\nindependent talent.',120],
    ['workLabel','Label portfolio','A SELECTION OF IDEAS',70],
    ['workTitle','Judul portfolio','Made to\nmake an impact.',120],
    ['workDescription','Deskripsi portfolio','Eksplorasi karya nyata dari komunitas kreatif PIR Visuals. Buka setiap proyek untuk melihat detail dan mengenal kreatornya.',300],
    ['manifestoLabel','Label manifesto','A BETTER WAY TO COLLABORATE',70],
    ['manifestoTitle','Judul manifesto','Less middlemen.\nMore meaningful work.',150],
    ['manifestoDescription','Deskripsi manifesto','PIR Visuals mempertemukan klien dengan desainer melalui portfolio yang transparan. Kamu melihat karya, memahami spesialisasi dan kisaran harga, lalu berdiskusi langsung dengan kreatornya.',500],
    ['joinLabel','Label CTA kreator','YOUR WORK. YOUR SPACE.',70],
    ['joinTitle','Judul CTA kreator','Make your work\nimpossible to ignore.',150],
    ['joinDescription','Deskripsi CTA kreator','Bangun kehadiran profesional, tampilkan karya terbaik, dan biarkan klien menemukanmu.',300],
    ['joinCta','Teks tombol CTA','Bangun portfolio kamu ↗',50],
    ['faqLabel','Label FAQ','GOOD TO KNOW',70],
    ['faqTitle','Judul FAQ','Questions,\nanswered.',100],
  ];
  const copyEditor = copyFields.map(([key,label,fallback,max]) => {
    const value = cmsValue(cmsCopy[key],fallback);
    const multiline = /Description|Title/.test(key) || key === 'manifestoDescription';
    return `<label class="studio-field">${escapeHtml(label)}${multiline ? `<textarea name="copy${key}" maxlength="${max}">${value}</textarea>` : `<input name="copy${key}" maxlength="${max}" value="${value}">`}</label>`;
  }).join('');
  const cmsPanel = `<section class="studio-cms-shell" id="visual-studio">
    <div class="studio-cms-header"><div><span class="eyebrow">PIR VISUALS / OWNER CREATIVE STUDIO</span><h2>Visual Site Studio<span>.</span></h2><p>Kelola etalase karya, event, media Beranda, kategori, FAQ, dan metadata tanpa mengedit source code.</p></div><div class="studio-cms-actions"><a class="btn btn-secondary" href="/" target="_blank" rel="noopener">Buka website ↗</a><a class="btn" href="#studio-editor">Edit konten ↓</a></div></div>
    <div class="studio-cms-layout">
      <div class="studio-cms-main">
        <form method="post" action="/dashboard/content" id="studio-editor" enctype="multipart/form-data">
          <input type="hidden" name="csrf" value="${escapeHtml(csrf)}">
          <section class="studio-editor-section"><div class="studio-editor-heading"><span>01 / STRUCTURE</span><h3>Homepage section manager</h3><p>Atur bagian editorial Beranda. Etalase karya dan event berdiri sendiri di bawah hero dan tidak mengambil judul hero.</p></div><div class="studio-section-list">${sectionControls}</div></section>
          <section class="studio-editor-section"><div class="studio-editor-heading"><span>02 / HERO CONTENT</span><h3>Headline & announcement</h3><p>Atur pesan utama yang pertama kali dilihat pengunjung.</p></div><div class="studio-form-grid"><label class="studio-field studio-field-wide">Headline homepage<input name="title" maxlength="120" value="${cmsValue(cms.title,'Ide hebat layak bertemu talenta yang tepat.')}" required></label><label class="studio-field studio-field-wide">Deskripsi hero<textarea name="subtitle" maxlength="300">${cmsValue(cms.subtitle,'PIR Visuals adalah ruang untuk menemukan desainer kreatif, menjelajahi karya terbaik, dan membangun kolaborasi secara langsung.')}</textarea></label><label class="studio-field studio-field-wide">Announcement / pengumuman<input name="announcement" maxlength="180" value="${cmsValue(cms.announcement)}" placeholder="Kosongkan jika tidak ada pengumuman"></label></div></section>
          <section class="studio-editor-section"><div class="studio-editor-heading"><span>03 / SECTION COPY</span><h3>Copywriting setiap bagian</h3><p>Gunakan baris baru untuk memisahkan judul menjadi beberapa baris. HTML tidak diperbolehkan.</p></div><div class="studio-form-grid">${copyEditor}</div></section>
          <section class="studio-editor-section"><div class="studio-editor-heading"><span>04 / OWNER EVENTS</span><h3>Event PIR Visuals</h3><p>Tambahkan hingga lima event resmi. Event yang aktif akan muncul pada tab Event PIR Visuals di etalase Beranda.</p></div><div class="banner-editor-grid owner-event-grid">${eventEditor}</div></section>
          <section class="studio-editor-section"><div class="studio-editor-heading"><span>05 / HOMEPAGE MEDIA</span><h3>Media pilihan Beranda</h3><p>Upload hingga empat foto atau video yang tampil di bagian karya pilihan Beranda. Media ini tetap terpisah dari portofolio desainer.</p></div><div class="banner-editor-grid home-work-editor-grid">${homeWorkEditor}</div></section>
          <section class="studio-editor-section"><div class="studio-editor-heading"><span>06 / CATEGORY INDEX</span><h3>Creative disciplines</h3><p>Nama kategori tetap konsisten dengan filter direktori. Kamu bisa mengatur visibilitas dan deskripsinya.</p></div><div class="studio-category-grid">${categoryControls}</div></section>
          <section class="studio-editor-section"><div class="studio-editor-heading"><span>07 / FAQ</span><h3>Frequently asked questions</h3><p>Tambahkan, edit, hapus, dan atur FAQ yang tampil di homepage. Maksimal 20 pertanyaan.</p></div><div class="studio-faq-grid" data-faq-list>${faqEditor}</div><div class="studio-faq-actions"><button class="btn btn-secondary" type="button" data-faq-add>＋ Tambah FAQ</button><span>FAQ kosong tidak akan ditampilkan di website.</span></div><input type="hidden" name="faqCount" value="${faqEditorItems.length}" data-faq-count></section>
          <section class="studio-editor-section"><div class="studio-editor-heading"><span>08 / SEARCH & SHARING</span><h3>SEO & social preview</h3><p>Metadata ini digunakan pada halaman utama ketika dibagikan atau ditemukan melalui mesin pencari.</p></div><div class="studio-form-grid"><label class="studio-field studio-field-wide">SEO title<input name="seoTitle" maxlength="100" value="${cmsValue(cms.seoTitle,'PIR Visuals — Creative Talent Network')}"></label><label class="studio-field studio-field-wide">SEO description<textarea name="seoDescription" maxlength="300">${cmsValue(cms.seoDescription,cms.subtitle || 'Temukan talenta kreatif, jelajahi portfolio dan hubungi desainer secara langsung.')}</textarea></label><label class="studio-field studio-field-wide">Social preview image (HTTPS)<input name="seoImage" maxlength="500" value="${cmsValue(cms.seoImage)}" placeholder="https://..."></label></div></section>
          <div class="studio-savebar"><div><strong>Ready to publish?</strong><span>Perubahan berlaku setelah disimpan.</span></div><button class="btn">Simpan & publikasikan perubahan ↗</button></div>
        </form>
      </div>
      <aside class="studio-preview"><div class="studio-preview-head"><div><span class="eyebrow">LIVE SITE</span><strong>Website preview</strong></div><form method="get" action="/" target="pv-studio-preview"><input type="hidden" name="preview" value="1"><button type="submit" aria-label="Refresh preview">↻ Refresh</button></form></div><iframe name="pv-studio-preview" src="/?preview=1" title="Preview website PIR Visuals" loading="lazy" referrerpolicy="same-origin"></iframe><p>Preview menampilkan versi yang sudah tersimpan. Simpan perubahan lalu muat ulang preview.</p></aside>
    </div>
    <script src="/dashboard-home-media.js?v=3550" defer></script>
  </section>`;

  return pageShell('PIR Visuals — Owner Dashboard', `<section class="hero owner-dashboard-hero"><span class="eyebrow">PIR VISUALS / OWNER CONTROL CENTER</span><h1>Owner dashboard</h1><p class="muted">Pusat pengelolaan karya, persetujuan publikasi, profil desainer, event komunitas, konten website, dan performa platform. Dilindungi HTTP Basic Authentication.</p></section><nav class="owner-dashboard-nav" aria-label="Navigasi dashboard Owner"><a href="#owner-overview">Ringkasan</a><a href="#owner-moderation">Moderasi</a><a href="#owner-works">Kelola karya</a><a href="#owner-designers">Desainer</a><a href="#owner-events">Event & website</a><a href="#growth-intelligence">Analytics</a></nav><section class="grid" id="owner-overview">${metric('Desainer publik', designers)}${metric('Profil ditinjau PIR', verified)}${metric('Desainer unggulan', featured)}${metric('Karya disetujui', works)}${metric('Menunggu moderasi', pending.length)}${metric('Karya terbaru dalam daftar', ownerWorks.length)}${metric('Layanan aktif', services)}${metric('Profile views', a.views)}${metric('Portfolio views', a.portfolioViews)}${metric('Klik kontak', a.contacts)}${metric('Email ulasan terverifikasi', totalReviews)}${metric('Ulasan dipublikasikan', publishedReviews)}</section><section id="owner-moderation" class="owner-manager-section"><div class="owner-manager-heading"><div><span class="eyebrow">REVIEW QUEUE / OWNER APPROVAL</span><h2>Moderasi karya (${pending.length})</h2><p>Periksa karya yang dikirim desainer sebelum dipublikasikan.</p></div></div><div class="owner-pending-grid">${pendingHtml}</div></section>${ownerWorkManager}${ownerDesignerManager}${supportPanel}${reviewModeration}${growthPanel}<section class="card"><h2>Tren 14 hari</h2>${chart}</section><div id="owner-events">${cmsPanel}</div>`);
}

async function sendPasswordResetEmail(email, token) {
  const required = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASSWORD'];
  if (required.some(key => !process.env[key])) throw new Error('SMTP belum dikonfigurasi.');
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || 'false') === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
  });
  const base = String(process.env.PORTFOLIO_PUBLIC_BASE_URL || '').replace(/\/$/, '');
  const link = `${base}/studio/reset?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
  await transport.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER, to: email,
    subject: 'Reset password PIR Visuals',
    text: `Gunakan tautan berikut untuk mengganti password (berlaku 20 menit): ${link}`,
    html: `<p>Permintaan reset password PIR Visuals.</p><p><a href="${escapeHtml(link)}">Atur password baru</a></p><p>Tautan berlaku 20 menit. Abaikan email ini jika bukan kamu.</p>`,
  });
}
async function sendVerificationEmail(email, token) {
  const required = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASSWORD'];
  if (required.some(key => !process.env[key])) throw new Error('SMTP belum dikonfigurasi. Isi SMTP_HOST, SMTP_USER, SMTP_PASSWORD, SMTP_PORT, dan SMTP_FROM.');
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || 'false') === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
  });
  const base = String(process.env.PORTFOLIO_PUBLIC_BASE_URL || '').replace(/\/$/, '');
  const link = `${base}/studio/verify?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
  await transport.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER, to: email,
    subject: 'Verifikasi email PIR Visuals',
    text: `Verifikasi email akun PIR Visuals melalui tautan berikut (berlaku 30 menit): ${link}`,
    html: `<p>Verifikasi email akun PIR Visuals.</p><p><a href="${escapeHtml(link)}">Verifikasi email</a></p><p>Tautan berlaku 30 menit.</p>`,
  });
}
function hashToken(value) { return crypto.createHash('sha256').update(String(value)).digest('hex'); }
function sameHash(a, b) { const left = Buffer.from(String(a || ''), 'hex'); const right = Buffer.from(String(b || ''), 'hex'); return left.length === 32 && right.length === 32 && crypto.timingSafeEqual(left, right); }
async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const derived = await scrypt(String(password), salt, 64);
  return `scrypt$${salt.toString('hex')}$${derived.toString('hex')}`;
}
async function verifyPassword(password, encoded) {
  const [kind, saltHex, hashHex] = String(encoded || '').split('$');
  if (kind !== 'scrypt' || !saltHex || !hashHex) return false;
  const actual = await scrypt(String(password), Buffer.from(saltHex, 'hex'), 64);
  const expected = Buffer.from(hashHex, 'hex');
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}
async function readForm(req, maxBytes = 16 * 1024) {
  const chunks = []; let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBytes) { const error = new Error('Form terlalu besar.'); error.statusCode = 413; throw error; }
    chunks.push(chunk);
  }
  return new URLSearchParams(Buffer.concat(chunks).toString('utf8'));
}

async function readMultipart(req, maxBytes = PORTFOLIO_MAX_REQUEST_BYTES, options = {}) {
  const maxFiles = Number.isInteger(options.maxFiles) ? Math.max(0, options.maxFiles) : PORTFOLIO_MAX_FILES;
  const maxFileBytes = Number.isInteger(options.maxFileBytes) ? Math.max(1, options.maxFileBytes) : PORTFOLIO_MAX_FILE_BYTES;
  const fileSizeMessage = String(options.fileSizeMessage || 'Setiap file maksimal 15 MB.');
  const contentType = String(req.headers['content-type'] || '');
  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  if (!contentType.toLowerCase().startsWith('multipart/form-data') || !boundaryMatch) throw new Error('Format upload tidak valid.');
  const boundary = `--${boundaryMatch[1] || boundaryMatch[2]}`;
  const chunks = []; let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBytes) { const error = new Error(`Total upload untuk formulir ini maksimal ${Math.floor(maxBytes / (1024 * 1024))} MB.`); error.statusCode = 413; throw error; }
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);
  const rawParts = buffer.toString('latin1').split(boundary).slice(1, -1);
  const fields = new Map(); const files = [];
  for (const raw of rawParts) {
    const part = raw.replace(/^\r\n/, '').replace(/\r\n$/, '');
    const split = part.indexOf('\r\n\r\n');
    if (split < 0) continue;
    const headers = part.slice(0, split);
    const data = Buffer.from(part.slice(split + 4).replace(/\r\n$/, ''), 'latin1');
    const disposition = headers.match(/content-disposition:\s*form-data;([^\r\n]+)/i)?.[1] || '';
    const name = disposition.match(/name="([^"]+)"/i)?.[1];
    const filename = disposition.match(/filename="([^"]*)"/i)?.[1];
    if (!name) continue;
    if (filename !== undefined && filename !== '') {
      if (files.length >= maxFiles) { const error = new Error(`Maksimal ${maxFiles} file untuk formulir ini.`); error.statusCode = 400; throw error; }
      if (data.length > maxFileBytes) { const error = new Error(fileSizeMessage); error.statusCode = 413; throw error; }
      if (!data.length) throw new Error('File gambar kosong.');
      files.push({ fieldName: name, filename: path.basename(filename).slice(0, 180), data, contentType: headers.match(/content-type:\s*([^\r\n]+)/i)?.[1]?.trim().toLowerCase() || '' });
    } else fields.set(name, data.toString('utf8').slice(0, 10000));
  }
  return { fields, files };
}
function safeImageName() { return `web-${crypto.randomBytes(16).toString('hex')}.webp`; }
const HOMEPAGE_MEDIA_MAX_FILE_BYTES = 50 * 1024 * 1024;
const HOMEPAGE_MEDIA_MAX_REQUEST_BYTES = 160 * 1024 * 1024;
async function saveHomepageMediaFile(file, mediaRoot) {
  if (!file?.data?.length) throw new Error('Pilih file media Beranda yang tidak kosong.');
  if (file.data.length > HOMEPAGE_MEDIA_MAX_FILE_BYTES) throw new Error('Media Beranda maksimal 50 MB per file.');
  const extension = path.extname(String(file.filename || '')).toLowerCase();
  const contentType = String(file.contentType || '').split(';')[0].trim().toLowerCase();
  await fs.promises.mkdir(mediaRoot, { recursive: true });
  if (['.jpg','.jpeg','.png','.webp'].includes(extension) || ['image/jpeg','image/png','image/webp'].includes(contentType)) {
    let metadata;
    try { metadata = await sharp(file.data, { failOn: 'error', limitInputPixels: 100_000_000 }).metadata(); }
    catch { throw new Error('Gambar Beranda tidak dapat dibaca. Gunakan JPG, PNG, atau WebP yang valid.'); }
    const actual = metadata.format === 'jpg' ? 'jpeg' : metadata.format;
    if (!['jpeg','png','webp'].includes(actual)) throw new Error('Format gambar Beranda harus JPG, PNG, atau WebP.');
    if (!metadata.width || !metadata.height || Number(metadata.width) * Number(metadata.height) > 100_000_000) throw new Error('Resolusi gambar Beranda melebihi 100 megapiksel.');
    const output = await sharp(file.data, { failOn: 'error', limitInputPixels: 100_000_000 })
      .rotate().resize({ width: 2560, height: 1800, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 86, effort: 4 }).toBuffer();
    const filename = `home-${crypto.randomBytes(16).toString('hex')}.webp`;
    await fs.promises.writeFile(path.join(mediaRoot, filename), output, { flag: 'wx', mode: 0o600 });
    return { filename, mediaType: 'image', contentType: 'image/webp' };
  }
  if (['.mp4','.webm'].includes(extension) || ['video/mp4','video/webm'].includes(contentType)) {
    const isMp4 = extension === '.mp4' || contentType === 'video/mp4';
    const isWebm = extension === '.webm' || contentType === 'video/webm';
    const mp4Signature = file.data.length >= 12 && file.data.subarray(4, Math.min(file.data.length, 40)).includes(Buffer.from('ftyp'));
    const webmSignature = file.data.length >= 4 && file.data.subarray(0, 4).equals(Buffer.from([0x1a,0x45,0xdf,0xa3]));
    if ((isMp4 && !mp4Signature) || (isWebm && !webmSignature) || (!isMp4 && !isWebm)) throw new Error('Isi video tidak cocok. Gunakan MP4 atau WebM yang valid.');
    const ext = isMp4 ? '.mp4' : '.webm';
    const filename = `home-${crypto.randomBytes(16).toString('hex')}${ext}`;
    await fs.promises.writeFile(path.join(mediaRoot, filename), file.data, { flag: 'wx', mode: 0o600 });
    return { filename, mediaType: 'video', contentType: isMp4 ? 'video/mp4' : 'video/webm' };
  }
  throw new Error('Format media Beranda harus JPG, PNG, WebP, MP4, atau WebM.');
}
async function processPortfolioImage(file, outputPath, cropMode = 'original') {
  const output = await processPortfolioImageBuffer(file?.data, {
    filename: file?.filename || '', contentType: file?.contentType || '', cropMode,
  });
  await fs.promises.writeFile(outputPath, output, { flag: 'wx', mode: 0o600 });
}
function cookieValue(req, name) {
  return readCookie(req.headers.cookie, name);
}
async function getDesignerSession(req) {
  const id = cookieValue(req, 'pir_designer_session');
  if (!id || !/^[a-f0-9]{64}$/.test(id)) return null;
  const tokenHash = hashToken(id);
  const session = await DesignerDashboardSession.findOne({ tokenHash, expiresAt: { $gt: new Date() } }).lean();
  return session ? { ...session, id } : null;
}
async function issueDesignerSession(res, designerId) {
  const id = crypto.randomBytes(32).toString('hex');
  const csrf = crypto.randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000);
  await DesignerDashboardSession.create({ tokenHash: hashToken(id), designerId, csrf, expiresAt });
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('set-cookie', `pir_designer_session=${id}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${secure}`);
  return csrf;
}
function validCsrf(req, form, session) {
  return Boolean(session && isSameOriginRequest(req.headers) && safeTokenEqual(form.get('csrf'), session.csrf));
}

async function getClientProjectSession(req) {
  const id = cookieValue(req, 'pir_client_session');
  if (!id || !/^[a-f0-9]{64}$/.test(id)) return null;
  const session = await ClientProjectSession.findOne({ tokenHash: hashToken(id), expiresAt: { $gt: new Date() } }).lean();
  return session ? { ...session, id } : null;
}
async function issueClientProjectSession(res, projectId) {
  const id = crypto.randomBytes(32).toString('hex');
  const csrf = crypto.randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await ClientProjectSession.create({ tokenHash: hashToken(id), projectId, csrf, expiresAt });
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('set-cookie', `pir_client_session=${id}; HttpOnly; SameSite=Strict; Path=/; Max-Age=2592000${secure}`);
  return csrf;
}
function validClientCsrf(req, form, session) {
  return Boolean(session && isSameOriginRequest(req.headers) && safeTokenEqual(form.get('csrf'), session.csrf));
}
const CLIENT_PROJECT_STAGES = [
  ['brief_received','Brief diterima','Kebutuhan proyek sudah masuk ke desainer.'],
  ['discovery','Discovery','Desainer sedang memahami kebutuhan dan menyusun arah proyek.'],
  ['in_progress','Dikerjakan','Proses kreatif sedang berjalan.'],
  ['review','Review','Konsep atau hasil sedang menunggu masukan dan persetujuan.'],
  ['completed','Selesai','Proyek ditandai selesai oleh desainer.'],
];
const CLIENT_PROJECT_STATUS_LABELS = Object.fromEntries(CLIENT_PROJECT_STAGES.map(([key,label]) => [key,label]));
CLIENT_PROJECT_STATUS_LABELS.cancelled = 'Dibatalkan';
const CLIENT_PROJECT_STATUS_TRANSITIONS = Object.freeze({
  brief_received: ['discovery','in_progress','cancelled'],
  discovery: ['in_progress','review','completed','cancelled'],
  in_progress: ['review','completed','cancelled'],
  review: ['in_progress','completed','cancelled'],
  completed: [],
  cancelled: [],
});
function clientProjectStatusChoices(status) {
  const current = CLIENT_PROJECT_STATUS_LABELS[status] ? status : 'brief_received';
  return [current, ...(CLIENT_PROJECT_STATUS_TRANSITIONS[current] || [])];
}
function isClientProjectClosed(status) {
  return status === 'completed' || status === 'cancelled';
}
async function markProjectLeadContacted(project) {
  if (!project?.leadId || !project?.designerId) return;
  await DesignerLead.updateOne(
    { leadId:project.leadId, designerId:project.designerId, status:'new' },
    { $set:{ status:'contacted' } },
  );
}
async function syncLeadPipelineFromProject(project, status) {
  if (!project?.leadId || !project?.designerId) return;
  const identity = { leadId:project.leadId, designerId:project.designerId };
  if (status === 'completed') {
    await DesignerLead.updateOne({ ...identity, status:{ $ne:'closed' } }, { $set:{ status:'won' } });
  } else if (status === 'cancelled') {
    await DesignerLead.updateOne({ ...identity, status:{ $ne:'won' } }, { $set:{ status:'closed' } });
  } else if (['discovery','in_progress','review'].includes(status)) {
    await DesignerLead.updateOne({ ...identity, status:{ $in:['new','contacted'] } }, { $set:{ status:'qualified' } });
  }
}
async function sendClientProjectAccessEmail(email, token, project, designerName) {
  const required = ['SMTP_HOST','SMTP_USER','SMTP_PASSWORD'];
  if (required.some(key => !process.env[key])) throw new Error('SMTP belum dikonfigurasi.');
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || 'false') === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
  });
  const base = String(process.env.PORTFOLIO_PUBLIC_BASE_URL || process.env.SITE_URL || `http://localhost:${process.env.PORTFOLIO_WEB_PORT || process.env.PORT || 3080}`).replace(/\/$/, '');
  if (process.env.NODE_ENV === 'production' && !/^https:\/\//i.test(base)) throw new Error('PORTFOLIO_PUBLIC_BASE_URL wajib menggunakan HTTPS di production.');

  const link = `${base}/client/access?token=${encodeURIComponent(token)}`;
  await transport.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER, to: email,
    subject: `Akses ruang proyek: ${project.title}`,
    text: `Halo ${project.clientName}, ruang proyek kamu dengan ${designerName} sudah tersedia. Buka tautan aman ini dalam 30 menit: ${link}. Tautan hanya dapat digunakan satu kali. Setelah masuk, sesi berlaku 30 hari.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#202820"><p style="letter-spacing:.14em;font-size:11px;font-weight:bold">PIR VISUALS / CLIENT WORKSPACE</p><h1 style="font-size:28px">Ruang proyekmu siap.</h1><p>Halo ${escapeHtml(project.clientName)}, ${escapeHtml(designerName)} telah menyiapkan ruang kolaborasi untuk proyek <strong>${escapeHtml(project.title)}</strong>.</p><p><a href="${escapeHtml(link)}" style="display:inline-block;padding:13px 20px;background:#40563d;color:#fff;text-decoration:none;border-radius:6px">Buka ruang proyek</a></p><p style="font-size:12px;color:#667168">Tautan berlaku 30 menit dan hanya dapat digunakan satu kali. Setelah berhasil masuk, sesi akan aktif selama 30 hari. Jika kamu tidak meminta akses ini, abaikan email ini.</p></div>`,
  });
}
async function sendClientProjectUpdateEmail(project, designerName, message, statusLabel) {
  if (!project.email || ['SMTP_HOST','SMTP_USER','SMTP_PASSWORD'].some(key => !process.env[key])) return;
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || 'false') === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
  });
  const base = String(process.env.PORTFOLIO_PUBLIC_BASE_URL || process.env.SITE_URL || `http://localhost:${process.env.PORTFOLIO_WEB_PORT || process.env.PORT || 3080}`).replace(/\/$/, '');
  if (process.env.NODE_ENV === 'production' && !/^https:\/\//i.test(base)) throw new Error('PORTFOLIO_PUBLIC_BASE_URL wajib menggunakan HTTPS di production.');

  await transport.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER, to: project.email,
    subject: `Update proyek: ${project.title}`,
    text: `${designerName} memperbarui ruang proyek "${project.title}". Status: ${statusLabel}. Catatan: ${message}. Buka ${base}/client/projects/${encodeURIComponent(project.projectId)}`,
    html: `<p>${escapeHtml(designerName)} memperbarui ruang proyek <strong>${escapeHtml(project.title)}</strong>.</p><p>Status: <strong>${escapeHtml(statusLabel)}</strong></p><p>${escapeHtml(message)}</p><p><a href="${escapeHtml(base)}/client/projects/${encodeURIComponent(project.projectId)}">Lihat ruang proyek</a></p>`,
  });
}
function dashboardLoginPage(message = '') {
  return pageShell('PIR Visuals — Login Desainer', `<section class="hero"><h1>Designer Studio</h1><p class="muted">Masuk dengan email, password, dan kode verifikasi WhatsApp.</p></section><section class="card">${message ? `<p role="alert">${escapeHtml(message)}</p>` : ''}<form method="post" action="/studio/login"><label for="studio-login-email">Email akun</label><input id="studio-login-email" name="email" type="email" autocomplete="username" required maxlength="254" style="width:100%;padding:12px;margin:8px 0"><label for="studio-login-password">Password</label><input id="studio-login-password" name="password" type="password" autocomplete="current-password" required minlength="12" style="width:100%;padding:12px;margin:8px 0"><label for="studio-login-otp">Kode OTP WhatsApp</label><input id="studio-login-otp" name="otp" inputmode="numeric" pattern="[0-9]{6}" autocomplete="one-time-code" required minlength="6" maxlength="6" aria-describedby="studio-otp-help" placeholder="6 digit kode" style="width:100%;padding:12px;margin:8px 0"><small id="studio-otp-help" class="muted">Belum punya kode? Buka WhatsApp dari nomor yang tertaut, lalu kirim <code>.portfolio dashboard otp</code> ke bot PIR Visuals. Kode berlaku 5 menit dan hanya dapat digunakan sekali.</small><button class="btn" type="submit">Masuk</button></form><p class="muted">Belum memiliki akun? <a href="/studio/register">Daftar akun PIR Visuals</a>.</p><section class="card"><h3>Kirim ulang verifikasi email</h3><form method="post" action="/studio/resend-verification" class="pv-resend-verification-form"><label for="pv-resend-verification-email">Email akun</label><div class="pv-resend-verification-controls"><input id="pv-resend-verification-email" type="email" name="email" required maxlength="254"><button class="btn btn-secondary" type="submit">Kirim tautan verifikasi</button></div></form></section><div class="card" style="margin-top:18px;border-color:var(--line);background:var(--surface)"><h2 style="margin-top:0">Tidak bisa masuk?</h2><p class="muted">Kirim tautan reset ke email akun yang sudah diverifikasi.</p><a class="btn" href="/studio/forgot">Lupa password? Reset sekarang</a></div><p class="muted">Belum mengaktifkan akun? Gunakan token aktivasi dari WhatsApp di <a class="edition-inline-link" href="/studio/setup">halaman aktivasi</a>.</p></section>`);
}
async function findProjectActivity(projectId) {
  const recent = await ClientProjectUpdate.find({ projectId }).sort({ createdAt: -1, _id: -1 }).limit(100).lean();
  return recent.reverse();
}

function renderClientProjectWorkspace(project, designer, updates, session) {
  const activeIndex = CLIENT_PROJECT_STAGES.findIndex(([key]) => key === project.status);
  const currentIndex = activeIndex < 0 ? -1 : activeIndex;
  const isClosed = isClientProjectClosed(project.status);
  const stages = CLIENT_PROJECT_STAGES.map(([key,label,description],index) => `<div class="pv-project-stage ${index < currentIndex ? 'is-done' : ''} ${index === currentIndex ? 'is-current' : ''}" ${index === currentIndex ? 'aria-current="step"' : ''}><span class="pv-stage-dot">${index < currentIndex ? '✓' : String(index+1).padStart(2,'0')}</span><div><strong>${label}</strong><small>${description}</small></div></div>`).join('');
  const activity = updates.map(item => `<article class="pv-activity-item role-${item.authorRole}"><span class="pv-activity-marker">${item.authorRole === 'designer' ? 'D' : item.authorRole === 'client' ? 'C' : '•'}</span><div class="pv-activity-copy"><div class="pv-activity-head"><strong>${escapeHtml(item.authorName)}</strong><small>${new Date(item.createdAt).toLocaleString('id-ID')}</small></div><p>${escapeHtml(item.message)}</p>${item.status ? `<span class="pv-activity-status">${escapeHtml(CLIENT_PROJECT_STATUS_LABELS[item.status] || item.status)}</span>` : ''}</div></article>`).join('') || '<p class="muted">Belum ada aktivitas.</p>';
  const closedNotice = isClosed ? `<div class="pv-project-closed-state" role="status"><strong>${project.status === 'completed' ? 'Proyek telah selesai.' : 'Proyek telah ditutup.'}</strong><p>${project.status === 'completed' ? 'Riwayat proyek tetap tersedia untuk dilihat. Percakapan baru telah ditutup.' : 'Proyek ini dibatalkan. Riwayat tetap tersedia, tetapi pesan baru tidak dapat dikirim.'}</p></div>` : '';
  const messageComposer = isClosed
    ? '<div class="pv-project-readonly-note"><span class="eyebrow">READ-ONLY PROJECT HISTORY</span><p>Ruang ini sekarang hanya dapat dilihat. Hubungi desainer secara langsung jika ada hal yang perlu dibahas lebih lanjut.</p></div>'
    : `<form class="pv-client-message-form" method="post" action="/client/projects/${encodeURIComponent(project.projectId)}/message"><input type="hidden" name="csrf" value="${escapeHtml(session.csrf)}"><label for="client-project-message">Kirim pesan atau feedback</label><textarea id="client-project-message" name="message" rows="3" maxlength="1500" minlength="3" required placeholder="Tulis feedback, pertanyaan, atau informasi tambahan untuk desainer..."></textarea><div class="pv-form-footer"><small>Pesan hanya terlihat oleh kamu dan desainer proyek.</small><button class="btn" type="submit">Kirim pesan ↗</button></div></form>`;
  const phone = getPublicContactPhone(designer);
  const contact = phone ? `<a class="btn btn-secondary" href="https://wa.me/${escapeHtml(phone)}" target="_blank" rel="noopener noreferrer">Hubungi desainer langsung ↗</a>` : '<span class="muted">Kontak WhatsApp belum ditampilkan desainer.</span>';
  const body = `<section class="pv-client-shell">
    <header class="pv-client-heading"><div><span class="eyebrow">PIR VISUALS / CLIENT WORKSPACE</span><p class="pv-client-kicker">YOUR PROJECT, IN ONE PLACE</p><h1>${escapeHtml(project.title)}</h1><p class="muted">Ruang kolaborasi bersama ${escapeHtml(designer?.displayName || 'desainer')}.</p></div><span class="pv-project-status status-${escapeHtml(project.status)}">${escapeHtml(CLIENT_PROJECT_STATUS_LABELS[project.status] || project.status)}</span></header>
    <aside class="pv-hybrid-workspace-note"><strong>Ruang kolaborasi opsional</strong><p>Workspace ini hanya membantu klien dan desainer menyimpan brief, progres, serta feedback. PIR Visuals tidak memproses pembayaran, tidak mengambil komisi, dan bukan pihak dalam kesepakatan antara kedua pihak.</p></aside>
    ${closedNotice}
    <div class="pv-client-overview"><article class="pv-client-card pv-client-progress"><span class="eyebrow">PROJECT JOURNEY</span><h2>Progress yang transparan.</h2><div class="pv-project-stages">${stages}</div></article>
      <aside class="pv-client-card pv-client-brief"><span class="eyebrow">PROJECT BRIEF</span><h2>Brief awal</h2><p>${escapeHtml(project.brief)}</p><div class="pv-brief-meta"><span>CLIENT<strong>${escapeHtml(project.clientName)}</strong></span><span>DESIGNER<strong>${escapeHtml(designer?.displayName || 'Designer')}</strong></span><span>STARTED<strong>${new Date(project.createdAt).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'})}</strong></span></div>${contact}</aside>
    </div>
    <section class="pv-client-card pv-client-activity"><div class="pv-section-heading"><div><span class="eyebrow">SHARED PROJECT LOG</span><h2>Updates & conversation.</h2></div><span class="pv-live-indicator">● LIVE SPACE</span></div><div class="pv-activity-list">${activity}</div>
      ${messageComposer}
    </section><footer class="pv-client-foot"><span>Powered by PIR Visuals</span><form method="post" action="/client/logout"><input type="hidden" name="csrf" value="${escapeHtml(session.csrf)}"><button class="btn btn-secondary" type="submit">Keluar dari ruang proyek</button></form></footer>
  </section>`;
  return pageShell(`${project.title} — Client Workspace`, body, { description:`Ruang proyek ${project.title} bersama ${designer?.displayName || 'desainer'}.`, noIndex:true });
}

function renderDesignerProjectWorkspace(project, profile, updates, session, notice = '') {
  const isClosed = isClientProjectClosed(project.status);
  const activity = updates.map(item => `<article class="pv-activity-item role-${item.authorRole}"><span class="pv-activity-marker">${item.authorRole === 'designer' ? 'D' : item.authorRole === 'client' ? 'C' : '•'}</span><div class="pv-activity-copy"><div class="pv-activity-head"><strong>${escapeHtml(item.authorName)}</strong><small>${new Date(item.createdAt).toLocaleString('id-ID')}</small></div><p>${escapeHtml(item.message)}</p>${item.status ? `<span class="pv-activity-status">${escapeHtml(CLIENT_PROJECT_STATUS_LABELS[item.status] || item.status)}</span>` : ''}</div></article>`).join('') || '<p class="muted">Belum ada aktivitas.</p>';
  const statuses = clientProjectStatusChoices(project.status).map(key => `<option value="${escapeHtml(key)}" ${project.status===key?'selected':''}>${escapeHtml(CLIENT_PROJECT_STATUS_LABELS[key] || key)}</option>`).join('');
  const updateComposer = isClosed
    ? `<div class="pv-project-readonly-note"><span class="eyebrow">PROJECT CLOSED</span><p>${project.status === 'completed' ? 'Proyek sudah selesai. Riwayat tetap dapat dilihat dan undangan akses dapat dikirim ulang, tetapi status dan percakapan tidak dapat diubah.' : 'Proyek dibatalkan. Riwayat tetap dapat dilihat, tetapi status dan percakapan tidak dapat diubah.'}</p></div>`
    : `<form class="pv-client-message-form" method="post" action="/studio/projects/${encodeURIComponent(project.projectId)}/update"><input type="hidden" name="csrf" value="${escapeHtml(session.csrf)}"><label for="project-status">Status proyek</label><select id="project-status" name="status">${statuses}</select><label for="designer-project-message">Update untuk klien</label><textarea id="designer-project-message" name="message" rows="4" maxlength="1500" minlength="3" required placeholder="Bagikan progres, langkah berikutnya, atau minta feedback dari klien..."></textarea><div class="pv-form-footer"><small>Update dan perubahan status akan terlihat di client workspace.</small><button class="btn" type="submit">Publikasikan update ↗</button></div></form>`;
  const body = `<section class="pv-designer-project"><header class="pv-client-heading"><div><span class="eyebrow">DESIGNER STUDIO / PROJECT ROOM</span><p class="pv-client-kicker">CLIENT COLLABORATION</p><h1>${escapeHtml(project.title)}</h1><p class="muted">Klien: ${escapeHtml(project.clientName)} · ${escapeHtml(project.email || 'Email belum tersedia')} · ${escapeHtml(project.whatsapp || 'WhatsApp belum tersedia')}</p></div><span class="pv-project-status status-${escapeHtml(project.status)}">${escapeHtml(CLIENT_PROJECT_STATUS_LABELS[project.status] || project.status)}</span></header>
    ${notice ? `<p class="pv-project-notice" role="status">${escapeHtml(notice)}</p>` : ''}
    <aside class="pv-hybrid-workspace-note"><strong>Workspace opsional · kendali tetap pada klien dan desainer</strong><p>PIR Visuals menyediakan ruang pencatatan dan komunikasi. Harga, pembayaran, kontrak, dan kesepakatan diselesaikan langsung oleh kamu dan klien di luar PIR Visuals.</p></aside>
    <div class="pv-client-overview"><article class="pv-client-card"><span class="eyebrow">ORIGINAL BRIEF</span><h2>Project context.</h2><p>${escapeHtml(project.brief)}</p><small class="muted">Dibuat ${new Date(project.createdAt).toLocaleString('id-ID')}</small></article><aside class="pv-client-card"><span class="eyebrow">CLIENT ACCESS</span><h2>Secure workspace invite.</h2><p class="muted">Kirim tautan akses satu kali ke email klien. Link berlaku 30 menit, lalu sesi klien aktif selama 30 hari.</p><form method="post" action="/studio/projects/${encodeURIComponent(project.projectId)}/invite"><input type="hidden" name="csrf" value="${escapeHtml(session.csrf)}"><button class="btn btn-secondary" type="submit">Kirim / perbarui undangan ↗</button></form><p class="muted">Email: ${escapeHtml(project.email || 'Belum diisi saat brief masuk')}</p><p class="muted">${project.clientAccessRevokedAt ? 'Akses klien terakhir dicabut pada ' + new Date(project.clientAccessRevokedAt).toLocaleString('id-ID') + '.' : 'Sesi klien dikelola melalui undangan privat dan dapat dicabut kapan saja.'}</p><form method="post" action="/studio/projects/${encodeURIComponent(project.projectId)}/revoke-access"><input type="hidden" name="csrf" value="${escapeHtml(session.csrf)}"><label class="pv-revoke-confirm"><input type="checkbox" name="confirmRevocation" value="yes" required> Saya memahami semua sesi klien akan berakhir.</label><button class="btn btn-ghost" type="submit">Cabut semua akses klien</button></form><p class="muted">Mencabut akses akan mengakhiri semua sesi klien dan membatalkan link undangan yang belum digunakan. Kamu dapat mengirim undangan baru kapan saja.</p><a href="/client/projects/${encodeURIComponent(project.projectId)}" class="pv-text-link">Preview URL portal ↗</a></aside></div>
    <section class="pv-client-card pv-client-activity"><div class="pv-section-heading"><div><span class="eyebrow">SHARED PROJECT LOG</span><h2>Project updates.</h2></div><span class="pv-live-indicator">● SHARED SPACE</span></div><div class="pv-activity-list">${activity}</div>
    ${updateComposer}</section>
    <footer class="pv-client-foot"><a href="/studio">← Kembali ke Designer Studio</a><a href="/designer/${encodeURIComponent(profile.designerId)}" target="_blank" rel="noopener">Lihat portfolio ↗</a></footer></section>`;
  return pageShell(`${project.title} — Designer Project Room`, body, { displayName:profile.displayName, avatarUrl:getDesignerAvatarSrc(profile), noIndex:true });
}

const STUDIO_NAV_ICON_PATHS = {
  overview: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  health: '<path d="M20.5 8.8c0 5.2-8.5 10.6-8.5 10.6S3.5 14 3.5 8.8A4.8 4.8 0 0 1 12 6.2a4.8 4.8 0 0 1 8.5 2.6Z"/><path d="M7.5 12h3l1.4-2.5 2.1 5 1.2-2.5h1.3"/>',
  analytics: '<path d="M4 20V11"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M22 20H2"/>',
  profile: '<circle cx="12" cy="8" r="3.5"/><path d="M4.5 20c.7-3.2 3.2-4.8 7.5-4.8s6.8 1.6 7.5 4.8"/>',
  portfolio: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="m21 15-5-5L5 19"/>',
  services: '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5"/><path d="m3 16 9 5 9-5"/>',
  projects: '<path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>',
  leads: '<circle cx="9" cy="8" r="3"/><path d="M3.5 20c.5-3.1 2.3-4.7 5.5-4.7s5 1.6 5.5 4.7"/><path d="M16 5.5a3 3 0 0 1 0 5.8M17 15.5c2.2.6 3.4 2.1 3.8 4.5"/>',
  availability: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18M8 14h3M8 17h6"/>',
  notifications: '<path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
  whatsapp: '<path d="M20.5 11.5a8.4 8.4 0 0 1-12.3 7.4L3 20l1.2-4.8a8.5 8.5 0 1 1 16.3-3.7Z"/><path d="M8.5 8.5c.4 2.4 2.2 4.2 4.8 5"/>',
};
function studioNavIcon(name) {
  return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${STUDIO_NAV_ICON_PATHS[name] || STUDIO_NAV_ICON_PATHS.overview}</svg>`;
}
function serviceForm(session, service = null) {
  const packages = ['BASIC', 'PRO', 'EXCLUSIVE'];
  const value = (name, fallback = '') => escapeHtml(service?.[name] ?? fallback);
  const action = service ? '/studio/service/edit' : '/studio/service';
  return `<form method="post" action="${action}" class="studio-form-stack studio-service-form">
    <label>Nama layanan <input name="title" required maxlength="100" value="${value('title')}"></label>
    <label>Kategori <input name="category" required maxlength="60" value="${value('category')}"></label>
    <label>Deskripsi <textarea name="description" required maxlength="700">${value('description')}</textarea></label>
    <label>Harga (Rp) <input name="price" type="number" min="0" max="100000000" required value="${value('price')}"></label>
    <label>Paket <select name="packageName">${packages.map(name => `<option ${service?.packageName === name ? 'selected' : ''}>${name}</option>`).join('')}</select></label>
    <label>Revisi <input name="revisionCount" type="number" min="0" max="20" required value="${value('revisionCount', 1)}"></label>
    <label>Hari pengerjaan <input name="deliveryDays" type="number" min="1" max="365" required value="${value('deliveryDays', 3)}"></label>
    ${service ? `<input type="hidden" name="serviceId" value="${value('serviceId')}">` : ''}
    <input type="hidden" name="csrf" value="${escapeHtml(session.csrf)}">
    <button class="btn" type="submit">${service ? 'Simpan perubahan' : 'Tambah layanan'}</button>
  </form>`;
}

async function dashboardStudioPage(profile, session, notice = '') {
  const [works, services, collections, testimonials, analytics, approvedPortfolioCount, caseStudySignal, completeCaseStudySignal] = await Promise.all([
    PortfolioItem.find({ designerId: profile.designerId }).sort({ createdAt: -1 }).limit(30).lean(),
    DesignService.find({ designerId: profile.designerId }).sort({ createdAt: -1 }).limit(30).lean(),
    PortfolioCollection.find({ designerId: profile.designerId }).sort({ createdAt: -1 }).limit(20).lean(),
    DesignerTestimonial.find({ designerId: profile.designerId }).sort({ createdAt: -1 }).limit(20).lean(),
    DesignerAnalytics.findOne({ designerId: profile.designerId }).lean(),
    PortfolioItem.countDocuments({ designerId: profile.designerId, moderationStatus: 'approved' }),
    PortfolioItem.findOne({ designerId: profile.designerId, moderationStatus: 'approved', challenge: { $gt: '' }, solution: { $gt: '' } }).select('_id').lean(),
    PortfolioItem.findOne({ designerId: profile.designerId, moderationStatus: 'approved', challenge: { $gt: '' }, solution: { $gt: '' }, outcome: { $gt: '' } }).select('_id').lean(),
  ]);
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [leads, availability, notifications, dailyMetrics, projectViewRows, clientProjects] = await Promise.all([
    DesignerLead.find({ designerId: profile.designerId }).sort({ createdAt: -1 }).limit(40).lean(),
    DesignerAvailability.find({ designerId: profile.designerId, date: { $gte: jakartaDateKey() } }).sort({ date: 1 }).limit(30).lean(),
    DesignerNotification.find({ designerId: profile.designerId }).sort({ createdAt: -1 }).limit(15).lean(),
    DesignerAnalytics.aggregate([{ $match: { designerId: profile.designerId } }, { $unwind: { path: '$daily', preserveNullAndEmptyArrays: true } }, { $match: { 'daily.date': { $gte: since30.toISOString().slice(0,10) } } }, { $sort: { 'daily.date': -1 } }, { $limit: 30 }, { $project: { date: '$daily.date', views: '$daily.views', contacts: '$daily.contacts', portfolioViews: '$daily.portfolioViews' } }]),
    SiteAnalyticsEvent.aggregate([{ $match: { eventType:'project_view', designerId:profile.designerId, createdAt:{ $gte:since30 }, itemId:{ $gt:'' } } },{ $group:{ _id:'$itemId', views:{ $sum:1 } } },{ $sort:{ views:-1 } },{ $limit:5 }]),
    ClientProject.find({ designerId:profile.designerId }).sort({ lastActivityAt:-1, createdAt:-1 }).limit(30).lean(),
  ]);
  const fields = [
    { name:'displayName', label:'Nama publik', value:profile.displayName, max:80, placeholder:'Contoh: Andi Pratama atau Studio Karsa', help:'Nama yang akan tampil di halaman portfolio.' },
    { name:'slug', label:'Custom URL', value:profile.slug, max:40, placeholder:'Contoh: andi-pratama atau studio-karsa', help:'Opsional. Gunakan huruf kecil, angka, dan tanda hubung.' },
    { name:'bio', label:'Bio singkat', value:profile.bio, max:600, multiline:true, placeholder:'Contoh: Desainer grafis yang fokus pada identitas visual, logo, dan kemasan untuk brand lokal.', help:'Ceritakan siapa kamu, keahlian utama, dan jenis klien yang ingin kamu bantu.' },
    { name:'specialties', label:'Keahlian (pisahkan dengan koma)', value:(profile.specialties || []).join(', '), max:240, placeholder:'Contoh: Logo Design, Branding, Packaging, Social Media', help:'Tulis 3–5 keahlian yang paling kamu kuasai.' },
    { name:'softwareSkills', label:'Software / alat kerja', value:profile.softwareSkills, max:240, placeholder:'Contoh: Adobe Illustrator, Photoshop, Figma, Blender', help:'Sebutkan aplikasi atau alat yang biasa kamu gunakan.' },
    { name:'experience', label:'Pengalaman', value:profile.experience, max:120, placeholder:'Contoh: 3 tahun pengalaman desain grafis', help:'Boleh tulis lama pengalaman, tingkat pengalaman, atau bidang yang pernah dikerjakan.' },
    { name:'location', label:'Lokasi', value:profile.location, max:100, placeholder:'Contoh: Bandung, Indonesia', help:'Kota dan negara tempat kamu bekerja.' },
    { name:'category', label:'Kategori utama', value:profile.category, max:80, placeholder:'Contoh: Graphic Design atau UI/UX Design', help:'Pilih bidang yang paling menggambarkan pekerjaanmu.' },
    { name:'avatarUrl', label:'Tautan foto profil (opsional)', value:profile.avatarUrl, max:500, placeholder:'Contoh: https://namasitus.com/foto-profil.jpg', help:'Tidak wajib diisi jika kamu mengunggah foto dari perangkat di bawah.' },
    { name:'contactPhone', label:'Nomor WhatsApp publik', value:profile.contactPhone || profile.publicWhatsApp, max:24, type:'tel', placeholder:'Contoh: 6281234567890', help:'Gunakan kode negara, tanpa tanda + atau spasi. Kosongkan jika tidak ingin ditampilkan.' },
    { name:'instagram', label:'Instagram', value:profile.instagram, max:120, placeholder:'Contoh: @namastudio atau https://instagram.com/namastudio', help:'Tautan akun Instagram profesional (opsional).' },
    { name:'behance', label:'Behance', value:profile.behance, max:240, placeholder:'Contoh: https://www.behance.net/namastudio', help:'Tautan portfolio Behance (opsional).' },
    { name:'website', label:'Website', value:profile.website, max:240, placeholder:'Contoh: https://namastudio.com', help:'Website atau portfolio pribadi (opsional).' },
  ];
  const fieldHtml = fields.map(field => `<label class="studio-field"><span>${field.label}</span>${field.multiline
    ? `<textarea name="${field.name}" maxlength="${field.max}" rows="3" placeholder="${escapeHtml(field.placeholder)}">${escapeHtml(field.value || '')}</textarea>`
    : `<input name="${field.name}" ${field.type ? `type="${field.type}"` : 'type="text"'} maxlength="${field.max}" value="${escapeHtml(field.value || '')}" placeholder="${escapeHtml(field.placeholder)}">`
  }<small>${field.help}</small></label>`).join('');
  const avatarSource = getDesignerAvatarSrc(profile);
  const avatarUploadHtml = `<div class="studio-avatar-upload"><div class="studio-avatar-upload-preview"><img id="studio-avatar-preview" src="${escapeHtml(avatarSource)}" alt="Pratinjau foto profil" ${avatarSource ? '' : 'hidden'}><span id="studio-avatar-fallback" ${avatarSource ? 'hidden' : ''}>${escapeHtml(String(profile.displayName || 'PV').slice(0,1).toUpperCase())}</span></div><div class="studio-avatar-upload-fields"><label for="studio-avatar-file">Upload foto profil dari perangkat</label><input id="studio-avatar-file" name="avatarFile" type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"><small id="studio-avatar-status" role="status" aria-live="polite">JPG, PNG, atau WebP · maksimal 5 MB. Pratinjau tampil sebelum disimpan; pemrosesan gambar dilakukan server agar lebih kompatibel.</small><label class="studio-avatar-remove"><input type="checkbox" name="removeAvatar" value="1"> Hapus foto profil yang diunggah</label></div></div>`;
  const workspaceNavItems = [
    ['overview','Overview','overview'], ['portfolio-health','Portfolio health','health'],
    ['analytics','Analytics','analytics'], ['edit-profile','Profil & branding','profile'],
    ['portfolio-manager','Portfolio','portfolio'], ['services-manager','Layanan & harga','services'],
    ['client-projects','Project rooms','projects'], ['leads','Leads','leads'],
    ['availability','Availability','availability'], ['notifications','Notifikasi','notifications'],
    ['notification-push-settings','WhatsApp Push','whatsapp'],
  ];
  const workspaceNavMarkup = workspaceNavItems.map(([target,label,icon]) => `<a href="#${target}" data-studio-nav-link><span class="studio-nav-icon">${studioNavIcon(icon)}</span><span>${label}</span></a>`).join('');
  const profileLayout = ['editorial','minimal','gallery'].includes(profile.profileLayout) ? profile.profileLayout : 'editorial';
  const studioSetupTasks = [
    { label:'Lengkapi identitas profil', detail:'Foto, bio, spesialisasi, dan lokasi', href:'#edit-profile', done:Boolean((profile.avatarPath || profile.avatarUrl) && profile.bio && profile.location && (profile.specialties || []).length) },
    { label:'Publikasikan karya pertama', detail:'Minimal satu karya sudah disetujui', href:'#portfolio-manager', done:works.some(item => item.moderationStatus === 'approved') },
    { label:'Tampilkan layanan', detail:'Aktifkan setidaknya satu layanan', href:'#services-manager', done:services.some(item => item.isActive) },
    { label:'Buka profil untuk publik', detail:'Pastikan profil siap ditemukan klien', href:'#edit-profile', done:Boolean(profile.isPublic) },
    { label:'Atur ketersediaan', detail:'Tambahkan satu tanggal pada kalender', href:'#availability', done:availability.length > 0 },
  ];
  const portfolioHealth = calculatePortfolioHealth(profile, works, services, { approvedWorkCount: approvedPortfolioCount, hasCaseStudy: Boolean(caseStudySignal), caseStudyHasOutcome: Boolean(completeCaseStudySignal) });
  const healthTaskMarkup = portfolioHealth.tasks.map(task => `<a class="pv-health-task ${task.done ? 'is-complete' : ''}" href="${task.href}"><span class="pv-health-task-icon">${task.done ? '✓' : '＋'}</span><span><strong>${task.label}</strong><small>${task.detail}</small></span><b>${task.earned}/${task.points}</b></a>`).join('');
  const portfolioHealthPanel = `<section class="pv-portfolio-health" id="portfolio-health" aria-labelledby="pv-portfolio-health-title"><div class="pv-portfolio-health-head"><div><span class="eyebrow">PORTFOLIO READINESS / PRIVATE CHECKLIST</span><h2 id="pv-portfolio-health-title">${portfolioHealth.level}.</h2><p>Periksa kelengkapan informasi agar calon klien lebih mudah memahami fokus, proses, karya, dan cara menghubungimu.</p></div><div class="pv-health-score"><strong>${portfolioHealth.score}%</strong><small>${portfolioHealth.completed}/${portfolioHealth.totalTasks} CHECKS</small></div></div><div class="pv-health-track" role="progressbar" aria-label="Kelengkapan portfolio" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${portfolioHealth.score}"><span style="width:${portfolioHealth.score}%"></span></div><div class="pv-health-task-list">${healthTaskMarkup}</div><p class="pv-health-disclaimer">Skor ini hanya mengukur kelengkapan data profil dan portfolio berdasarkan checklist PIR. Ini bukan penilaian estetika, kemampuan profesional, kualitas hasil, popularitas, atau jaminan mendapatkan klien. Hanya terlihat oleh pemilik akun.</p></section>`;
  const studioSetupDone = studioSetupTasks.filter(task => task.done).length;
  const studioSetupPercent = Math.round(studioSetupDone / studioSetupTasks.length * 100);
  const studioSetupPanel = `<section class="pv-studio-setup" aria-labelledby="pv-studio-setup-title"><div class="pv-studio-setup-head"><div><span class="eyebrow">YOUR NEXT BEST STEPS</span><h2 id="pv-studio-setup-title">${studioSetupPercent === 100 ? 'Your studio is ready.' : 'Build a stronger creative presence.'}</h2><p>${studioSetupPercent === 100 ? 'Fondasi profil dan portfolio sudah lengkap. Kamu bisa fokus mengembangkan karya dan relasi.' : 'Selesaikan beberapa langkah inti agar calon klien lebih mudah memahami keahlian dan ketersediaanmu.'}</p></div><div class="pv-studio-setup-score"><strong>${studioSetupPercent}%</strong><small>${studioSetupDone} OF ${studioSetupTasks.length} COMPLETE</small></div></div><div class="pv-studio-setup-track" role="progressbar" aria-label="Kelengkapan studio" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${studioSetupPercent}"><span style="width:${studioSetupPercent}%"></span></div><div class="pv-studio-setup-list">${studioSetupTasks.map((task,index) => `<a class="pv-studio-setup-task ${task.done ? 'is-complete' : ''}" href="${task.href}"><span class="pv-studio-setup-check" aria-hidden="true">${task.done ? '✓' : String(index+1).padStart(2,'0')}</span><span><strong>${task.label}</strong><small>${task.detail}</small></span><b aria-hidden="true">${task.done ? '✓' : '↗'}</b></a>`).join('')}</div></section>`;
  const profileStoryEditor = `<details class="studio-story-editor" open><summary>Personal brand, cerita & SEO profil</summary>
    <p class="muted">Ceritakan sudut pandang kreatif dan jenis proyek yang ingin kamu kerjakan. Semua kolom bersifat opsional.</p>
    <label>Tagline profesional</label><input name="tagline" maxlength="140" value="${escapeHtml(profile.tagline || '')}" placeholder="Contoh: Building identities with clarity and character">
    <label>Creative point of view</label><textarea name="practiceStatement" maxlength="600" rows="3" placeholder="Apa yang kamu percaya tentang desain dan bagaimana kamu ingin dikenal?">${escapeHtml(profile.practiceStatement || '')}</textarea>
    <label>Pendekatan kerja</label><textarea name="approach" maxlength="500" rows="3" placeholder="Jelaskan cara kamu memahami brief, bereksperimen, dan menyelesaikan proyek.">${escapeHtml(profile.approach || '')}</textarea>
    <label>Proyek yang ingin dikerjakan</label><textarea name="idealProjects" maxlength="400" rows="2" placeholder="Jenis brand, industri, atau tantangan yang paling cocok dengan keahlianmu.">${escapeHtml(profile.idealProjects || '')}</textarea>
    <label>Gaya halaman portfolio</label><select name="profileLayout"><option value="editorial" ${profileLayout==='editorial'?'selected':''}>Editorial — storytelling seimbang</option><option value="minimal" ${profileLayout==='minimal'?'selected':''}>Minimal — fokus pada informasi</option><option value="gallery" ${profileLayout==='gallery'?'selected':''}>Gallery — fokus pada visual karya</option></select>
    <div class="studio-story-seo"><span class="eyebrow">SEARCH & SOCIAL PREVIEW</span><label>SEO title<input name="seoTitle" maxlength="100" value="${escapeHtml(profile.seoTitle || '')}" placeholder="Nama — spesialisasi | PIR Visuals"></label>
    <label>SEO description<textarea name="seoDescription" maxlength="300" rows="2" placeholder="Deskripsi singkat profil untuk mesin pencari.">${escapeHtml(profile.seoDescription || '')}</textarea></label>
    <label>Social preview image (HTTPS)<input name="seoImage" maxlength="500" value="${escapeHtml(profile.seoImage || '')}" placeholder="https://..."></label></div>
  </details>`;
  const workHtml = works.map(w => {
    const mediaPaths = [...new Set([w.imagePath, ...(Array.isArray(w.galleryPaths) ? w.galleryPaths.filter(mediaPath => mediaPath !== w.imagePath) : [])].filter(Boolean))].slice(0, 5);
    const mediaMarkup = mediaPaths.length
      ? `<div class="studio-work-media-grid" aria-label="Galeri ${escapeHtml(w.title || 'karya')}">${mediaPaths.map((_, index) => `<div class="studio-work-media-choice"><img loading="lazy" decoding="async" src="/studio/media/${encodeURIComponent(w.itemId)}/${index}" alt="${escapeHtml(w.title || 'Karya')} — gambar ${index + 1}"><label class="studio-work-media-choice-control"><input type="radio" name="coverIndex" value="${index}" ${index === 0 ? 'checked' : ''}> Cover</label><label class="studio-work-media-choice-control"><input type="checkbox" name="removeMedia${index}" value="1"> Hapus</label></div>`).join('')}</div>`
      : '<p class="muted">Belum ada gambar tersimpan.</p>';
    const priceLabel = Number(w.priceFrom || 0) > 0 ? money(w.priceFrom) : 'Harga belum ditampilkan';
    return `<article class="card studio-work-item">
      <div class="studio-work-item-heading"><div><strong>${escapeHtml(w.title || 'Tanpa judul')}</strong><p class="muted">${escapeHtml(w.category || 'Tanpa kategori')} · ${escapeHtml(w.moderationStatus || 'pending')}</p></div><span class="studio-work-id">${escapeHtml(w.itemId || '')}</span></div>
      ${mediaPaths.length ? `<div class="studio-work-preview"><img loading="lazy" decoding="async" src="/studio/media/${encodeURIComponent(w.itemId)}/0" alt="${escapeHtml(w.title || 'Cover karya')}"></div>` : ''}
      <div class="studio-work-summary"><span>${mediaPaths.length} gambar</span><span>${escapeHtml(priceLabel)}</span></div>
      <p>${escapeHtml(w.description || '')}</p>
      <form method="post" action="/studio/work/edit" enctype="multipart/form-data" class="studio-work-edit-form">
        <input type="hidden" name="itemId" value="${escapeHtml(w.itemId)}"><input type="hidden" name="csrf" value="${session.csrf}">
        <label>Judul</label><input name="title" maxlength="100" required value="${escapeHtml(w.title || '')}" style="width:100%;padding:9px;margin:5px 0">
        <label>Kategori</label><input name="category" maxlength="60" required value="${escapeHtml(w.category || '')}" style="width:100%;padding:9px;margin:5px 0">
        <label>Harga karya (Rp, opsional)</label><input name="priceFrom" type="number" min="0" max="100000000" step="1000" value="${Number(w.priceFrom || 0) > 0 ? Number(w.priceFrom) : ''}" placeholder="Kosongkan jika tidak ingin menampilkan harga">
        <label>Deskripsi</label><textarea name="description" maxlength="800" style="width:100%;padding:9px;margin:5px 0">${escapeHtml(w.description || '')}</textarea>
        <fieldset class="studio-work-media-manager"><legend>Kelola gambar portfolio</legend><p class="muted">Pilih salah satu gambar sebagai cover, centang gambar yang ingin dihapus, atau tambahkan gambar baru. Maksimal 5 gambar per karya.</p>${mediaMarkup}<label class="studio-work-add-media">Tambah gambar ke galeri<input type="file" name="additionalMedia" accept="image/jpeg,image/png,image/webp,image/svg+xml,.svg" multiple></label></fieldset>
        <details class="case-builder-fields"><summary>Detail case study (opsional)</summary><label>Peran / kontribusi</label><input name="projectRole" maxlength="120" value="${escapeHtml(w.projectRole || '')}"><label>Tantangan</label><textarea name="challenge" maxlength="1200">${escapeHtml(w.challenge || '')}</textarea><label>Solusi / proses</label><textarea name="solution" maxlength="1600">${escapeHtml(w.solution || '')}</textarea><label>Hasil / dampak</label><textarea name="outcome" maxlength="1200">${escapeHtml(w.outcome || '')}</textarea><label>Tools yang digunakan</label><input name="toolsUsed" maxlength="240" value="${escapeHtml(w.toolsUsed || '')}"><label>Durasi proyek</label><input name="projectDuration" maxlength="80" value="${escapeHtml(w.projectDuration || '')}"><label>Klien / brand (jika boleh dipublikasikan)</label><input name="projectClient" maxlength="100" value="${escapeHtml(w.projectClient || '')}"><label>Industri</label><input name="projectIndustry" maxlength="80" value="${escapeHtml(w.projectIndustry || '')}"><label>Tahun proyek</label><input name="projectYear" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" value="${escapeHtml(w.projectYear || '')}"><label>Ruang lingkup</label><input name="projectScope" maxlength="320" value="${escapeHtml(w.projectScope || '')}" placeholder="Contoh: Strategy, identity system, packaging"><label>Highlight hasil</label><textarea name="resultHighlight" maxlength="320">${escapeHtml(w.resultHighlight || '')}</textarea><label>SEO title</label><input name="seoTitle" maxlength="100" value="${escapeHtml(w.seoTitle || '')}"><label>SEO description</label><textarea name="seoDescription" maxlength="240">${escapeHtml(w.seoDescription || '')}</textarea></details>
        <button class="btn" type="submit">Simpan perubahan</button>
      </form>
      <form method="post" action="/studio/work/delete" class="studio-work-delete-form" data-pv-confirm="Hapus karya ini?"><input type="hidden" name="itemId" value="${escapeHtml(w.itemId)}"><input type="hidden" name="csrf" value="${session.csrf}"><button class="btn" type="submit" style="background:#9b3434">Hapus karya</button></form>
    </article>`;
  }).join('') || '<p class="muted">Belum ada karya.</p>';
  const serviceHtml = services.map(x => `<article class="card"><strong>${escapeHtml(x.title)}</strong><p>${escapeHtml(x.packageName || '')} · ${money(x.price)} · ${x.isActive ? 'Aktif' : 'Nonaktif'}</p></article>`).join('') || '<p class="muted">Belum ada layanan.</p>';
  const projectByLeadId = new Map(clientProjects.map(project => [project.leadId,project]));
  const leadCards = leads.map(l => {
    const project = projectByLeadId.get(l.leadId);
    const workspaceAction = project
      ? `<a class="btn btn-secondary" href="/studio/projects/${encodeURIComponent(project.projectId)}">Buka project room ↗</a>`
      : l.email
        ? `<form method="post" action="/studio/lead/workspace"><input type="hidden" name="csrf" value="${escapeHtml(session.csrf)}"><input type="hidden" name="leadId" value="${escapeHtml(l.leadId)}"><button class="btn btn-secondary" type="submit">Buat client workspace ↗</button></form>`
        : '<small class="muted">Tambahkan email klien sebelum membuat workspace privat.</small>';
    return `<article class="card"><div class="filter-row"><strong>${escapeHtml(l.clientName)}</strong><span class="tag">${escapeHtml(l.status)}</span></div><p class="muted">${escapeHtml(l.email || '')} · ${escapeHtml(l.whatsapp || '')}</p><p>${escapeHtml(l.brief)}</p><div class="filter-row"><form method="post" action="/studio/lead/status"><input type="hidden" name="csrf" value="${escapeHtml(session.csrf)}"><input type="hidden" name="leadId" value="${escapeHtml(l.leadId)}"><select name="status"><option value="new" ${l.status==='new'?'selected':''}>Baru</option><option value="contacted" ${l.status==='contacted'?'selected':''}>Dihubungi</option><option value="qualified" ${l.status==='qualified'?'selected':''}>Qualified</option><option value="won" ${l.status==='won'?'selected':''}>Deal</option><option value="closed" ${l.status==='closed'?'selected':''}>Ditutup</option></select><button class="btn btn-secondary">Update lead</button></form>${workspaceAction}</div></article>`;
  }).join('') || '<p class="muted">Belum ada calon klien. Bagikan portfolio publikmu.</p>';
  const availabilityCards = availability.map(a => `<article class="stat"><strong>${escapeHtml(a.date)}</strong><span>${escapeHtml(a.status)}</span><small class="muted">${escapeHtml(a.note || '')}</small></article>`).join('');
  const notificationCards = notifications.map(n => `<article class="card"><strong>${escapeHtml(n.title)}</strong><p class="muted">${escapeHtml(n.message)}</p><small>${new Date(n.createdAt).toLocaleString('id-ID')}</small></article>`).join('') || '<p class="muted">Belum ada notifikasi.</p>';
  const projectCounts = clientProjects.reduce((counts,project) => {
    const group = isClientProjectClosed(project.status) ? project.status : project.status === 'review' ? 'review' : 'active';
    counts[group] = (counts[group] || 0) + 1;
    return counts;
  }, { active:0, review:0, completed:0, cancelled:0 });
  const projectCards = clientProjects.map(project => {
    const group = isClientProjectClosed(project.status) ? project.status : project.status === 'review' ? 'review' : 'active';
    const searchText = `${project.title || ''} ${project.clientName || ''}`.toLocaleLowerCase('id-ID');
    return `<a class="pv-project-list-card" data-pv-project-card data-pv-project-search="${escapeHtml(searchText)}" data-pv-project-group="${group}" href="/studio/projects/${encodeURIComponent(project.projectId)}"><span class="pv-project-list-icon">↗</span><span class="pv-project-list-copy"><strong>${escapeHtml(project.title)}</strong><small>${escapeHtml(project.clientName)} · ${new Date(project.lastActivityAt || project.createdAt).toLocaleDateString('id-ID')}</small></span><span class="pv-project-status status-${escapeHtml(project.status)}">${escapeHtml(CLIENT_PROJECT_STATUS_LABELS[project.status] || project.status)}</span></a>`;
  }).join('') || '<div class="pv-project-empty"><strong>Belum ada ruang proyek.</strong><p>Setiap brief baru akan otomatis membuat ruang kolaborasi untuk kamu dan klien.</p></div>';
  const projectSummary = `<div class="pv-project-summary" aria-label="Ringkasan proyek terbaru"><article><span>AKTIF</span><strong>${projectCounts.active}</strong></article><article><span>REVIEW</span><strong>${projectCounts.review}</strong></article><article><span>SELESAI</span><strong>${projectCounts.completed}</strong></article><article><span>DIBATALKAN</span><strong>${projectCounts.cancelled}</strong></article></div>`;
  const projectToolbar = clientProjects.length ? `<div class="pv-project-toolbar"><label><span>Cari proyek atau klien</span><input id="pv-project-search" type="search" autocomplete="off" placeholder="Cari judul proyek atau nama klien..."></label><label><span>Filter status</span><select id="pv-project-status-filter"><option value="all">Semua status</option><option value="active">Aktif</option><option value="review">Review</option><option value="completed">Selesai</option><option value="cancelled">Dibatalkan</option></select></label><p id="pv-project-filter-count" role="status" aria-live="polite">Menampilkan ${clientProjects.length} dari ${clientProjects.length} ruang terbaru.</p></div>` : '';
  const projectFilterEmpty = '<div class="pv-project-empty pv-project-filter-empty" id="pv-project-filter-empty" hidden><strong>Tidak ada proyek yang cocok.</strong><p>Coba ubah kata kunci atau filter status.</p></div>';
  const businessPanels = `<section class="card studio-panel pv-projects-panel" id="client-projects"><div class="pv-section-heading"><div><span class="eyebrow">CLIENT COLLABORATION / WORKSPACE</span><h2>Project rooms (${clientProjects.length})</h2></div><span class="pv-live-indicator">● SHARED WORKSPACE</span></div><p class="muted">Kelola progres, bagikan update, dan undang klien ke ruang proyek privat. Daftar menampilkan maksimal 30 ruang terbaru. Kesepakatan tetap dilakukan langsung oleh kamu dan klien.</p>${projectSummary}${projectToolbar}<div class="pv-project-list" id="pv-project-list">${projectCards}</div>${clientProjects.length ? projectFilterEmpty : ''}</section><section class="card studio-panel" id="leads"><span class="eyebrow">Business pipeline</span><h2>Calon klien / Leads (${leads.length})</h2><p class="muted">Leads masuk dari formulir kontak portfolio publik. Kelola status follow-up di sini.</p><section class="grid">${leadCards}</section></section><section class="card studio-panel" id="availability"><span class="eyebrow">Availability planner</span><h2>Kalender ketersediaan</h2><form method="post" action="/studio/availability" class="filter-row"><input type="hidden" name="csrf" value="${escapeHtml(session.csrf)}"><label>Tanggal <input type="date" name="date" min="${jakartaDateKey()}" required></label><label>Status <select name="status"><option value="available">Tersedia</option><option value="busy">Terjadwal</option><option value="unavailable">Tidak tersedia</option></select></label><label>Catatan opsional <input name="note" maxlength="160"></label><button class="btn">Simpan tanggal</button></form><div class="grid">${availabilityCards || '<p class="muted">Belum ada tanggal yang diatur.</p>'}</div></section><section class="card studio-panel" id="notifications"><span class="eyebrow">Activity center</span><h2>Notifikasi</h2>${notificationCards}</section>`;
  const metricDays = dailyMetrics.filter(day => isCalendarDate(String(day.date || ''))).slice().reverse();
  const totals30 = metricDays.reduce((totals,day)=>({ views:totals.views+Number(day.views||0), contacts:totals.contacts+Number(day.contacts||0), portfolioViews:totals.portfolioViews+Number(day.portfolioViews||0) }),{views:0,contacts:0,portfolioViews:0});
  const contactRate30 = totals30.views ? Math.min(100,totals30.contacts/totals30.views*100) : 0;
  const maxDailyViews = Math.max(1,...metricDays.map(day=>Number(day.views||0)));
  const trendBars = metricDays.slice(-14).map(day=>`<div class="studio-trend-day" data-pv-analytics-day data-views="${Number(day.views||0)}" data-contacts="${Number(day.contacts||0)}" data-portfolio="${Number(day.portfolioViews||0)}" title="${escapeHtml(day.date)}: ${Number(day.views||0)} profile views, ${Number(day.contacts||0)} contact clicks, ${Number(day.portfolioViews||0)} portfolio views"><i style="--trend-height:${Math.max(4,Math.round(Number(day.views||0)/maxDailyViews*100))}%"></i><small>${escapeHtml(day.date.slice(5))}</small></div>`).join('');
  const viewedWorkIds = projectViewRows.map(row=>row._id).filter(Boolean);
  const viewedWorks = viewedWorkIds.length ? await PortfolioItem.find({ designerId:profile.designerId, itemId:{ $in:viewedWorkIds } }).select('itemId title category moderationStatus').lean() : [];
  const workById = new Map([...works,...viewedWorks].map(work=>[work.itemId,work]));
  const topProjectMarkup = projectViewRows.map((row,index)=>{
    const work=workById.get(row._id);
    return work ? `<a class="studio-top-project" href="/work/${encodeURIComponent(work.itemId)}" target="_blank" rel="noopener"><span class="studio-top-project-rank">0${index+1}</span><span><b>${escapeHtml(work.title)}</b><small>${escapeHtml(work.category||'Creative project')}</small></span><strong>${Number(row.views||0).toLocaleString('id-ID')} <small>views</small></strong></a>` : '';
  }).filter(Boolean).join('') || '<p class="muted">Detail project mulai dihitung setelah event tracking versi ini aktif.</p>';
  const pushNotificationPanel = `<section class="card studio-panel" id="notification-push-settings"><span class="eyebrow">PRIVATE WHATSAPP ALERTS</span><h2>Push notifikasi Designer Studio</h2><p class="muted">Status saat ini: <strong>${profile.whatsappPushEnabled ? 'Aktif' : 'Nonaktif'}</strong>. Push hanya dikirim ke chat pribadi yang kamu setujui. Notifikasi lama sebelum persetujuan tidak dikirim ulang.</p><p class="muted">Jam tenang: ${profile.whatsappPushQuietHoursEnabled === false ? 'Nonaktif' : `${escapeHtml(profile.whatsappPushQuietHoursStart || '22:00')}–${escapeHtml(profile.whatsappPushQuietHoursEnd || '08:00')} WIB`}.</p><p>Atur dari chat pribadi WhatsApp dengan bot PIR Visuals:</p><ul><li><code>.portfolio notifikasi push aktif</code> — setujui push.</li><li><code>.portfolio notifikasi push nonaktif</code> — cabut persetujuan.</li><li><code>.portfolio notifikasi push jam 22:00-08:00</code> — atur jam tenang.</li><li><code>.portfolio notifikasi push status</code> — lihat pengaturan.</li></ul><p class="muted">Inbox website tetap tersedia di bagian Notifikasi dan melalui perintah bot <code>.portfolio notifikasi</code>. Pengaturan ini tidak mengirim data proyek ke grup.</p></section>`;
  const analyticsPanel = `<section class="card studio-panel" id="analytics"><span class="eyebrow">PERFORMANCE / LAST 30 DAYS</span><h2>Understand your momentum.</h2><div class="stat-grid"><div class="stat"><strong>${totals30.views.toLocaleString('id-ID')}</strong><span class="muted">Profile views</span></div><div class="stat"><strong>${totals30.portfolioViews.toLocaleString('id-ID')}</strong><span class="muted">Portfolio views</span></div><div class="stat"><strong>${totals30.contacts.toLocaleString('id-ID')}</strong><span class="muted">Contact clicks</span></div><div class="stat"><strong>${contactRate30.toFixed(1)}%</strong><span class="muted">Profile → contact</span></div></div><div class="studio-performance-grid"><article class="studio-performance-card"><div class="studio-performance-head"><div><span class="eyebrow">01 / ACTIVITY</span><h3 data-pv-analytics-title>Profile traffic.</h3></div><small>LAST 14 DAYS</small></div><div class="pv-analytics-switch" role="group" aria-label="Metrik grafik"><button type="button" data-pv-analytics-metric="views" aria-pressed="true">Profile</button><button type="button" data-pv-analytics-metric="contacts" aria-pressed="false">Contacts</button><button type="button" data-pv-analytics-metric="portfolio" aria-pressed="false">Portfolio</button></div><div class="studio-trend-chart" data-pv-analytics-chart>${trendBars || '<p class="muted">Belum ada data harian.</p>'}</div><p class="muted" data-pv-analytics-note>Grafik menampilkan kunjungan profil per hari. Rasio kontak adalah indikator minat, bukan atribusi transaksi.</p></article><article class="studio-performance-card"><div class="studio-performance-head"><div><span class="eyebrow">02 / PROJECT SIGNAL</span><h3>Most viewed work.</h3></div><small>LAST 30 DAYS</small></div><div class="studio-top-project-list">${topProjectMarkup}</div><p class="muted">Jumlah pembukaan halaman case study, bukan jumlah impresi di grid portfolio.</p></article></div></section>`;

  return pageShell('PIR Visuals — Designer Studio', `<div class="studio-workspace"><aside class="studio-sidebar"><a class="studio-sidebar-brand" href="/"><span>PV</span><b>DESIGNER<br>STUDIO</b></a><div class="studio-sidebar-profile">${getDesignerAvatarSrc(profile) ? `<img src="${escapeHtml(getDesignerAvatarSrc(profile))}" alt="">` : '<span class="studio-avatar-fallback">PV</span>'}<div><strong>${escapeHtml(profile.displayName)}</strong><small>${profile.isPublic ? 'Profil publik' : 'Profil privat'}</small></div></div><span class="studio-nav-label">WORKSPACE</span><nav class="studio-nav" aria-label="Navigasi Workspace">${workspaceNavMarkup}</nav><div class="studio-sidebar-bottom"><a href="/designer/${encodeURIComponent(profile.designerId)}" target="_blank" rel="noopener">Lihat portfolio ↗</a><form method="post" action="/studio/logout"><input type="hidden" name="csrf" value="${escapeHtml(session.csrf)}"><button class="studio-logout-button" type="submit">Keluar akun</button></form></div></aside><div class="studio-main"><section class="studio-welcome" id="overview"><div><span class="eyebrow">YOUR CREATIVE BUSINESS</span><h1>Selamat datang, ${escapeHtml(profile.displayName)}.</h1><p>Kelola kehadiran kreatif, portfolio, dan peluang kolaborasi dari satu tempat.</p></div><div class="studio-welcome-actions"><a class="btn" href="/designer/${encodeURIComponent(profile.designerId)}" target="_blank" rel="noopener">Preview portfolio ↗</a><span class="studio-status ${profile.isPublic ? 'is-live' : ''}">${profile.isPublic ? '● LIVE PROFILE' : '○ PRIVATE PROFILE'}</span></div></section>${studioSetupPanel}${portfolioHealthPanel}<section class="studio-kpis"><article><span>PROFILE VIEWS</span><strong>${Number(analytics?.profileViews || 0).toLocaleString('id-ID')}</strong><small>Akumulasi kunjungan</small></article><article><span>PORTFOLIO VIEWS</span><strong>${Number(analytics?.portfolioViews || 0).toLocaleString('id-ID')}</strong><small>Preview karya</small></article><article><span>CONTACT CLICKS</span><strong>${Number(analytics?.contactClicks || 0).toLocaleString('id-ID')}</strong><small>Minat calon klien</small></article><article><span>ACTIVE LEADS</span><strong>${leads.filter(l => !['won','closed'].includes(l.status)).length}</strong><small>Perlu ditindaklanjuti</small></article></section><div class="studio-content"><div class="studio-content-heading"><div><span class="eyebrow">MANAGE YOUR PRESENCE</span><h2>Workspace overview</h2></div><span class="studio-updated">PIR VISUALS · DESIGNER TOOLS</span></div><div class="studio-panels"> ${Number(analytics?.profileViews || 0)} profile views · ${Number(analytics?.portfolioViews || 0)} portfolio views · ${Number(analytics?.contactClicks || 0)} contact clicks</p><p class="muted">${escapeHtml(profile.designerId)} · ${profile.isPublic ? 'Profil publik' : 'Profil privat'}</p><a href="/designer/${encodeURIComponent(profile.designerId)}">Lihat profil publik ↗</a> · <a href="#edit-profile">Edit profil</a> · <a href="#leads">Leads</a> · <a href="#availability">Kalender</a> · <form method="post" action="/studio/logout" class="studio-inline-logout"><input type="hidden" name="csrf" value="${escapeHtml(session.csrf)}"><button type="submit" class="btn btn-ghost">Keluar</button></form></section><section class="card"><h2>Keamanan akun</h2><p class="muted">Ganti password kapan saja. Kamu harus mengetahui password saat ini. Semua sesi login akan diminta masuk kembali setelah password diganti.</p><form method="post" action="/studio/password"><input type="hidden" name="csrf" value="${session.csrf}"><label>Password saat ini</label><input type="password" name="currentPassword" autocomplete="current-password" minlength="12" maxlength="128" required style="width:100%;padding:10px;margin:5px 0 12px"><label>Password baru (minimal 12 karakter)</label><input type="password" name="newPassword" autocomplete="new-password" minlength="12" maxlength="128" required style="width:100%;padding:10px;margin:5px 0 12px"><label>Ulangi password baru</label><input type="password" name="confirmPassword" autocomplete="new-password" minlength="12" maxlength="128" required style="width:100%;padding:10px;margin:5px 0 12px"><button class="btn" type="submit">Ganti password</button></form><p><a href="/studio/forgot">Lupa password saat ini? Kirim link reset melalui email</a></p></section>${notice ? `<section class="card">${escapeHtml(notice)}</section>` : ''}<section class="card studio-panel" id="edit-profile"><h2>Edit profil desainer</h2><form method="post" action="/studio/profile" enctype="multipart/form-data" class="studio-profile-form">${fieldHtml}${avatarUploadHtml}${profileStoryEditor}<label class="studio-field"><span>Harga minimum (Rp)</span><input type="number" min="0" max="100000000" name="priceMin" value="${Number(profile.priceMin || 0)}" placeholder="Contoh: 500000"><small>Perkiraan harga terendah untuk jasa yang kamu tawarkan.</small></label><label class="studio-field"><span>Harga maksimum (Rp)</span><input type="number" min="0" max="100000000" name="priceMax" value="${Number(profile.priceMax || 0)}" placeholder="Contoh: 2500000"><small>Perkiraan batas atas. Isi 0 jika belum ingin mencantumkan kisaran harga.</small></label><label class="studio-checkbox-field"><input type="checkbox" name="acceptsOrders" value="1" ${profile.acceptsOrders ? 'checked' : ''}><span>Terima brief melalui project workspace opsional</span></label><div class="studio-checkbox-group"><label class="studio-checkbox-field"><input type="checkbox" name="availabilityPublic" value="1" ${profile.availabilityPublic ? 'checked' : ''}><span>Tampilkan kalender ketersediaan di profil publik</span></label><small>Jika aktif, hanya tanggal dan status yang ditampilkan. Catatan kalender tetap privat.</small></div><label class="studio-checkbox-field"><input type="checkbox" name="isPublic" value="1" ${profile.isPublic ? 'checked' : ''}><span>Publikasikan profil</span></label><input type="hidden" name="csrf" value="${session.csrf}"><div class="studio-form-actions studio-profile-actions"><button class="btn" type="submit">Simpan profil</button></div></form><script src="/studio-avatar.js?v=6716" defer></script></section><section class="card studio-panel" id="portfolio-manager"><h2>Upload karya baru</h2><p class="muted">JPEG, PNG, WebP, atau SVG · maksimal 15 MB per file · maksimal 5 file. Pilih rasio crop, drag-and-drop, dan preview sebelum upload. SVG akan dipratinjau lalu otomatis dikonversi ke WebP sebelum dikirim agar lebih kompatibel. Karya baru menunggu persetujuan Owner.</p><form method="post" action="/studio/work/upload" enctype="multipart/form-data" data-pv-upload-form><label>Judul karya</label><input name="title" required maxlength="100" placeholder="Contoh: Identitas Visual Kopi Senja" style="width:100%;padding:10px;margin:5px 0"><label>Kategori</label><input name="category" required maxlength="60" placeholder="Contoh: Logo & Branding, UI/UX, Ilustrasi" style="width:100%;padding:10px;margin:5px 0"><label>Deskripsi</label><textarea name="description" maxlength="800" placeholder="Contoh: Membuat identitas visual yang lebih konsisten untuk sebuah brand kopi lokal." style="width:100%;padding:10px;margin:5px 0"></textarea><label>Harga karya (Rp, opsional)</label><input name="priceFrom" type="number" min="0" max="100000000" step="1000" placeholder="Kosongkan jika tidak ingin menampilkan harga" style="width:100%;padding:10px;margin:5px 0"><details class="case-builder-fields"><summary>Bangun case study (opsional)</summary><label>Peran / kontribusi</label><input name="projectRole" maxlength="120" placeholder="Contoh: Art direction, logo design, brand guideline"><label>Tantangan</label><textarea name="challenge" maxlength="1200" placeholder="Contoh: Brand belum memiliki identitas visual yang konsisten."></textarea><label>Solusi / proses</label><textarea name="solution" maxlength="1600" placeholder="Contoh: Riset audiens, eksplorasi konsep, lalu menyusun sistem visual."></textarea><label>Hasil / dampak</label><textarea name="outcome" maxlength="1200" placeholder="Contoh: Brand memiliki logo, warna, dan panduan visual yang siap digunakan."></textarea><label>Tools yang digunakan</label><input name="toolsUsed" maxlength="240" placeholder="Contoh: Figma, Adobe Illustrator, Photoshop"><label>Durasi proyek</label><input name="projectDuration" maxlength="80" placeholder="Contoh: 2 minggu"><label>Klien / brand (jika boleh dipublikasikan)</label><input name="projectClient" maxlength="100" placeholder="Contoh: Kopi Senja (jika diizinkan klien)"><label>Industri</label><input name="projectIndustry" maxlength="80" placeholder="Contoh: Food & Beverage, Fashion, Teknologi"><label>Tahun proyek</label><input name="projectYear" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" placeholder="Contoh: 2026"><label>Ruang lingkup</label><input name="projectScope" maxlength="320" placeholder="Contoh: Strategy, identity system, packaging"><label>Highlight hasil</label><textarea name="resultHighlight" maxlength="320" placeholder="Contoh: Sistem identitas baru diterapkan pada kemasan dan media sosial."></textarea><label>SEO title</label><input name="seoTitle" maxlength="100" placeholder="Contoh: Branding Kopi Senja — Portfolio Andi"><label>SEO description</label><textarea name="seoDescription" maxlength="240" placeholder="Contoh: Proses pembuatan identitas visual untuk brand kopi lokal."></textarea></details><label>File karya</label><div id="dropzone" class="card pv-upload-dropzone" data-pv-upload-dropzone><p><strong>Tarik gambar atau SVG ke sini</strong><br>atau pilih file dari perangkat</p><input id="work-images" data-pv-upload-input type="file" name="image" accept="image/jpeg,image/png,image/webp,image/svg+xml,.svg" multiple required style="display:block;margin:12px auto"><p class="pv-upload-status" data-pv-upload-status role="status" aria-live="polite">Maksimal 5 file · JPEG, PNG, WebP, SVG · 15 MB per file.</p><div id="image-preview" class="pv-upload-preview" data-pv-upload-preview></div></div><label>Crop preview</label><select name="cropMode" style="padding:10px;margin:8px"><option value="original">Original (tanpa crop)</option><option value="square">Square 1:1</option><option value="landscape">Landscape 16:9</option><option value="portrait">Portrait 3:4</option></select><input type="hidden" name="csrf" value="${session.csrf}"><button class="btn" type="submit">Upload karya untuk moderasi</button></form><script src="/studio-upload.js?v=6713" defer></script></section><section class="studio-work-list-section studio-panel"><div class="studio-work-list-heading"><h2>Portofolio (${works.length})</h2><p class="muted">Edit detail, kelola galeri, atur cover, dan tambahkan harga untuk setiap karya.</p></div><div class="studio-work-grid">${workHtml}</div></section><section class="card"><h2>Collections</h2><p class="muted">Kelompokkan karya berdasarkan campaign, brand, atau kategori. Koleksi publik hanya menampilkan karya yang sudah disetujui.</p>${collections.map(c => `<article><strong>${escapeHtml(c.title)}</strong> · ${c.itemIds.length} karya · ${c.isPublic ? 'Publik' : 'Privat'}<form method="post" action="/studio/collection/toggle"><input type="hidden" name="collectionId" value="${escapeHtml(c.collectionId)}"><input type="hidden" name="csrf" value="${session.csrf}"><button class="btn">${c.isPublic ? 'Jadikan privat' : 'Publikasikan'}</button></form></article>`).join('')}<form method="post" action="/studio/collection"><label>Nama koleksi</label><input name="title" maxlength="100" required placeholder="Contoh: Campaign Ramadan 2026" style="width:100%;padding:10px;margin:6px 0"><label>Deskripsi</label><input name="description" maxlength="500" placeholder="Contoh: Kumpulan karya untuk campaign brand makanan." style="width:100%;padding:10px;margin:6px 0"><label>ID karya (pisahkan koma)</label><input name="itemIds" maxlength="500" placeholder="Contoh: ART-A1B2C3D4, ART-E5F6A7B8" style="width:100%;padding:10px;margin:6px 0"><input type="hidden" name="csrf" value="${session.csrf}"><button class="btn">Buat koleksi</button></form></section><section class="card"><h2>Testimoni klien</h2>${testimonials.map(t => `<article><strong>${escapeHtml(t.clientName)}</strong> · ${t.rating}/5 <span class="tag">${t.isPublished ? 'Dipublikasikan' : (t.emailVerified ? 'Menunggu moderasi Owner' : 'Menunggu verifikasi email')}</span><p>${escapeHtml(t.message)}</p>${t.isPublished ? `<form method="post" action="/studio/testimonial/toggle"><input type="hidden" name="testimonialId" value="${escapeHtml(t.testimonialId)}"><input type="hidden" name="csrf" value="${session.csrf}"><button class="btn btn-secondary">Sembunyikan ulasan</button></form>` : ''}</article>`).join('')}<form method="post" action="/studio/testimonial" class="studio-form-stack studio-testimonial-form"><label>Nama klien</label><input name="clientName" maxlength="80" required placeholder="Contoh: Rina Putri" style="width:100%;padding:10px;margin:6px 0"><label>Nama proyek</label><input name="project" maxlength="100" placeholder="Contoh: Rebranding Kopi Senja" style="width:100%;padding:10px;margin:6px 0"><label>Testimoni</label><textarea name="message" maxlength="700" required placeholder="Contoh: Komunikasi lancar dan hasil desain sesuai kebutuhan brand kami." style="width:100%;padding:10px;margin:6px 0"></textarea><div class="studio-form-actions"><label>Rating<select name="rating"><option>5</option><option>4</option><option>3</option><option>2</option><option>1</option></select></label><button class="btn" type="submit">Tambah testimoni</button></div><input type="hidden" name="csrf" value="${session.csrf}"></form></section><section class="card"><h2>Tambah layanan</h2>${serviceForm(session)}</section><section class="card studio-panel" id="services-manager"><h2>Layanan (${services.length})</h2>${services.map(x => `<article class="card"><strong>${escapeHtml(x.title)}</strong><p>${escapeHtml(x.packageName || '')} · ${money(x.price)} · ${x.isActive ? 'Aktif' : 'Nonaktif'}</p><form method="post" action="/studio/service/toggle"><input type="hidden" name="serviceId" value="${escapeHtml(x.serviceId)}"><input type="hidden" name="csrf" value="${session.csrf}"><button class="btn" type="submit">${x.isActive ? 'Nonaktifkan' : 'Aktifkan'}</button></form><details><summary>Edit layanan</summary>${serviceForm(session, x)}</details></article>`).join('') || '<p class="muted">Belum ada layanan.</p>'}</section>${analyticsPanel}${businessPanels}${pushNotificationPanel}</div></div></div></div>`, { displayName: profile.displayName, avatarUrl: profile.avatarUrl });
}

export function startPublicPortfolioServer() {
  if (globalThis.__designerPortfolioServer) return globalThis.__designerPortfolioServer;
  const port = Math.max(1, Math.min(65535, Number(process.env.PORTFOLIO_WEB_PORT || process.env.PORT || 3080)));
  const host = process.env.PORTFOLIO_WEB_HOST || process.env.HOST || '0.0.0.0';
  const publicBase = String(process.env.PORTFOLIO_PUBLIC_BASE_URL || `http://localhost:${port}`).replace(/\/$/, '');
  const server = http.createServer({ maxHeaderSize: 16 * 1024 }, async (req, res) => {
    for (const [header, value] of Object.entries(securityHeaders({ productionHttps: process.env.NODE_ENV === 'production' && String(process.env.PORTFOLIO_PUBLIC_BASE_URL || process.env.SITE_URL || '').startsWith('https://') }))) {
      res.setHeader(header, value);
    }
    if (String(req.url || '').length > 8192) {
      res.writeHead(414, { 'cache-control': 'no-store', 'content-type': 'text/plain; charset=utf-8' });
      return res.end('URI terlalu panjang.');
    }
    try {
      const url = new URL(req.url || '/', publicBase);
      const parts = url.pathname.split('/').filter(Boolean);
      if (parts[0] === 'shell.css' && parts.length === 1 && ['GET', 'HEAD'].includes(req.method)) {
        return sendStaticBody(req, res, shellStyles, shellStylesEtag, 'text/css; charset=utf-8', 'public, max-age=3600');
      }
      if (parts[0] === 'edition' && parts.length === 2 && ['GET', 'HEAD'].includes(req.method)) {
        const type = editionAssets.get(parts[1]);
        if (type) return await serveStaticAsset(req, res, fileURLToPath(new URL('./edition-assets/' + parts[1], import.meta.url)), type);
      }



      if ((['editorial-theme.css', 'editorial-art.svg', 'company-editorial.css'].includes(parts[0]) || parts[0] === 'pir-unified-theme.css' || parts[0] === 'pir-permanent-theme.css' || ['pir-footer-landscape.svg', 'pir-footer-seal.svg', 'pir-footer-refinement.css', 'pir-faq-accordion.js', 'pir-motion-refinement.css', 'pir-motion-polish.css', 'pir-scroll-experience.js', 'pir-marquee.js', 'pir-site-consistency.css', 'pir-editorial-reveal.js', 'pir-intro-experience.css', 'pir-intro-boot.js', 'pir-intro-experience.js', 'pir-back-to-top.js', 'pir-intro-sticker.svg', 'pir-party-paper.css', 'pir-party-paper.js', 'pir-page-harmony.css', 'pir-public-polish.css', 'pir-creative-studio-layout.css', 'pir-page-transitions.css', 'pir-page-transitions.js', 'pir-home-showcase.js', 'pir-shared-ornaments.js', 'pir-agency-system.css', 'pir-showcase-editorial.css', 'pir-desktop-refinement.css', 'pir-reference-blend-v3.62.css', 'pir-whole-site-v3.64.css', 'pir-functional-qa-v3.65.css', 'pir-carousel-branches-left.svg'].includes(parts[0])) && parts.length === 1 && ['GET', 'HEAD'].includes(req.method)) {
        return await serveStaticAsset(req, res, fileURLToPath(new URL('./' + parts[0], import.meta.url)), parts[0].endsWith('.css') ? 'text/css; charset=utf-8' : parts[0].endsWith('.js') ? 'application/javascript; charset=utf-8' : 'image/svg+xml', ['company-editorial.css','pir-unified-theme.css','pir-permanent-theme.css','pir-footer-refinement.css','pir-faq-accordion.js','pir-motion-refinement.css','pir-motion-polish.css','pir-scroll-experience.js','pir-marquee.js','pir-site-consistency.css','pir-editorial-reveal.js','pir-intro-experience.css','pir-intro-boot.js','pir-intro-experience.js','pir-back-to-top.js','pir-intro-sticker.svg', 'pir-party-paper.css', 'pir-party-paper.js', 'pir-page-harmony.css', 'pir-public-polish.css', 'pir-creative-studio-layout.css', 'pir-page-transitions.css', 'pir-page-transitions.js', 'pir-home-showcase.js', 'pir-shared-ornaments.js', 'pir-agency-system.css', 'pir-showcase-editorial.css', 'pir-desktop-refinement.css', 'pir-reference-blend-v3.62.css', 'pir-whole-site-v3.64.css', 'pir-functional-qa-v3.65.css', 'pir-carousel-branches-left.svg'].includes(parts[0]) ? { revalidate: true, cacheControl: 'no-cache, must-revalidate' } : undefined);
      }
      if (parts[0] === 'visual-system.css' && parts.length === 1 && ['GET', 'HEAD'].includes(req.method)) {
        return await serveStaticAsset(req, res, fileURLToPath(new URL('./visual-system.css', import.meta.url)), 'text/css; charset=utf-8');
      }

      if (parts[0] === 'command-explorer.js' && parts.length === 1 && ['GET', 'HEAD'].includes(req.method)) {
        return await serveStaticAsset(req, res, fileURLToPath(new URL('./command-explorer.js', import.meta.url)), 'application/javascript; charset=utf-8');
      }

      if (parts[0] === 'commands' && parts.length === 1 && req.method === 'GET') {
        let catalog;
        try {
          catalog = JSON.parse(fs.readFileSync(path.join(APP_ROOT, 'docs', 'commands.json'), 'utf8'));
        } catch {
          res.writeHead(503, { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' });
          return res.end('Command catalog belum dibangun. Jalankan npm run docs:commands.');
        }
        const commands = Array.isArray(catalog.commands) ? catalog.commands : [];
        const categories = Array.isArray(catalog.categories) ? catalog.categories : [];
        const workflows = Array.isArray(catalog.workflows) ? catalog.workflows : [];
        const categoryOptions = ['<option value="">Semua kategori</option>', ...categories.map(category => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`)].join('');
        const commandCards = commands.map(item => {
          const searchText = [item.command, item.category, item.description, item.example, item.permission].join(' ').toLocaleLowerCase('id-ID');
          return `<article class="card command-explorer-card" data-command-card data-category="${escapeHtml(item.category)}" data-search="${escapeHtml(searchText)}"><div class="command-explorer-card-head"><span class="tag">${escapeHtml(item.category)}</span><code>.${escapeHtml(item.command)}</code></div><p>${escapeHtml(item.description)}</p><div class="command-explorer-example"><small>CONTOH</small><code>${escapeHtml(item.example)}</code><button type="button" class="btn btn-secondary command-explorer-copy" data-copy-label="Salin contoh" data-copy-command="${escapeHtml(item.example)}">Salin contoh</button></div><small class="muted">Akses umum: ${escapeHtml(item.permission)}</small></article>`;
        }).join('');
        const workflowCards = workflows.map(item => {
          const steps = Array.isArray(item.steps) ? item.steps : [];
          const copyText = steps.join('\n');
          const searchText = [item.title, item.audience, item.description, ...steps].join(' ').toLocaleLowerCase('id-ID');
          return `<article class="card command-explorer-workflow" data-workflow-card data-search="${escapeHtml(searchText)}"><div class="command-explorer-workflow-head"><span class="tag">${escapeHtml(item.audience || 'Workflow')}</span><h3>${escapeHtml(item.title)}</h3></div><p class="muted">${escapeHtml(item.description)}</p><div class="command-explorer-example"><small>LANGKAH PENGGUNAAN</small><code>${steps.map((step, index) => `${index + 1}. ${escapeHtml(step)}`).join('<br>')}</code><button type="button" class="btn btn-secondary command-explorer-copy" data-copy-label="Salin alur" data-copy-command="${escapeHtml(copyText)}">Salin alur</button></div></article>`;
        }).join('');
        const body = `<section class="hero command-explorer-hero"><span class="eyebrow">PIR VISUALS · COMMAND EXPLORER</span><h1>Temukan fitur yang tepat.</h1><p class="muted">Jelajahi perintah WhatsApp PIR Visuals berdasarkan kebutuhan, kategori, dan akses. Katalog ini dibuat otomatis dari registry bot yang sama, bukan daftar manual terpisah.</p><div class="stat-grid"><div class="stat"><strong>${Number(catalog.commandCount || commands.length).toLocaleString('id-ID')}</strong><span class="muted">Perintah tingkat atas</span></div><div class="stat"><strong>${categories.length}</strong><span class="muted">Kategori</span></div><div class="stat"><strong>${workflows.length}</strong><span class="muted">Workflow siap pakai</span></div></div></section><section class="card command-explorer-controls"><label for="command-search">Cari fitur<input id="command-search" type="search" maxlength="100" placeholder="Contoh: buat poster, download, anime, musik, efek suara, cuaca..." autocomplete="off"></label><label for="command-category">Kategori<select id="command-category">${categoryOptions}</select></label><p class="muted" id="command-result-count" role="status" aria-live="polite">${commands.length} perintah ditampilkan.</p></section><section class="grid command-explorer-grid" id="command-results" aria-label="Daftar perintah">${commandCards || '<div class="card empty-state">Katalog perintah belum tersedia.</div>'}</section><p class="muted" id="command-no-results" hidden>Tidak ada perintah atau workflow yang cocok. Coba kata kunci atau kategori lain.</p><section class="command-explorer-workflows"><div class="section-heading"><span class="eyebrow">GUIDED WORKFLOWS</span><h2>Mulai dari alur, bukan dari daftar command.</h2><p class="muted">Urutan langkah yang dapat disalin. Website tidak menjalankan perintah WhatsApp atau mengakses chat.</p></div><div class="grid command-explorer-workflow-grid">${workflowCards || '<div class="card empty-state">Workflow belum tersedia.</div>'}</div></section><section class="card"><h2>Butuh rekomendasi?</h2><p class="muted">Gunakan PIR Assistant di WhatsApp. Jelaskan kebutuhanmu dengan kalimat biasa, lalu bot akan merekomendasikan perintah yang relevan.</p><p><code>.asisten aku ingin membuat poster promosi</code></p></section><style>.command-explorer-controls{display:grid;grid-template-columns:minmax(0,2fr) minmax(220px,1fr);gap:14px;align-items:end}.command-explorer-controls label{display:grid;gap:7px}.command-explorer-controls input,.command-explorer-controls select{width:100%}.command-explorer-controls p{grid-column:1/-1;margin:0}.command-explorer-card{margin:0;display:flex;flex-direction:column;gap:12px;min-width:0}.command-explorer-card[hidden]{display:none}.command-explorer-card-head{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}.command-explorer-card-head code{font-size:14px;font-weight:800;color:var(--accent-strong);overflow-wrap:anywhere}.command-explorer-card p{margin:0;color:var(--muted);flex:1}.command-explorer-example{display:grid;gap:8px;padding:14px;border:1px solid var(--line);border-radius:14px;background:var(--bg-soft);min-width:0}.command-explorer-example small{font-size:9px;letter-spacing:.14em;color:var(--muted);font-weight:800}.command-explorer-example code{white-space:normal;overflow-wrap:anywhere;color:var(--text);line-height:1.8}.command-explorer-copy{justify-self:start;padding:7px 11px;font-size:12px}.command-explorer-card>small{line-height:1.5}.command-explorer-hero{padding-bottom:12px}.command-explorer-workflows{margin:34px 0}.command-explorer-workflows .section-heading{max-width:680px;margin-bottom:18px}.command-explorer-workflows .section-heading h2{margin:8px 0}.command-explorer-workflow-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.command-explorer-workflow{margin:0;display:flex;flex-direction:column;gap:12px;min-width:0}.command-explorer-workflow-head{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}.command-explorer-workflow-head h3{font-size:17px;margin:0}.command-explorer-workflow>p{margin:0;flex:1}.command-explorer-workflow .command-explorer-example{margin-top:auto}@media(max-width:640px){.command-explorer-controls,.command-explorer-workflow-grid{grid-template-columns:1fr}.command-explorer-controls p{grid-column:auto}}</style><script src="/command-explorer.js?v=6710" defer></script>`;
        return sendHtml(res, 200, pageShell('Command Explorer — PIR Visuals', body), { 'cache-control': 'public, max-age=300' });
      }

      if (parts[0] === 'creative-studio' && parts.length === 1 && req.method === 'GET') {
        const body = `<section class="hero pv-creative-hero"><div class="pv-creative-hero-inner"><div class="pv-creative-hero-copy"><span class="eyebrow">PIR VISUALS · CREATIVE STUDIO</span><h1>Tools untuk mengubah ide menjadi karya.</h1></div><div class="pv-creative-hero-summary"><p class="muted">Creative Studio menyatukan pengelolaan referensi aset, pengolahan gambar, sticker, dan kompetisi desain bertahap melalui WhatsApp. Website ini adalah panduan fitur; perintah dijalankan di bot, bukan dari halaman ini.</p><div class="pv-creative-stats"><div><strong>01</strong><span>Asset Library</span></div><div><strong>02</strong><span>Image & Sticker</span></div><div><strong>03</strong><span>Voice Lab</span></div><div><strong>04</strong><span>Media Discovery</span></div><div><strong>05</strong><span>Local Info</span></div></div></div></div></section><section class="pv-creative-grid" aria-label="Fitur Creative Studio"><div class="pv-creative-grid-inner"><article class="pv-creative-card pv-creative-feature"><span class="eyebrow">REFERENCE MANAGEMENT</span><h2>Creative Asset Library</h2><p>Simpan tautan referensi secara privat, catat lisensi dan atribusi, lalu bagikan hanya ke grup yang tepat. PIR menyimpan metadata dan tautan, bukan mengunggah ulang file.</p><div class="pv-creative-command"><small>SIMPAN REFERENSI</small><code>.assetstudio simpan Moodboard | branding | https://tautan | referensi saja | Sumber: Studio X</code></div><div class="pv-creative-command"><small>KELOLA KOLEKSI</small><code>.assetstudio saya<br>.assetstudio cari branding<br>.assetstudio bagikan KODE konfirmasi</code></div><p class="pv-creative-note">Berbagi tautan tidak otomatis memberikan hak penggunaan ulang. Periksa lisensi sumber.</p></article><article class="pv-creative-card"><span class="eyebrow">IMAGE & STICKER</span><h2>Sticker Studio</h2><p>Buat sticker proporsional, crop lingkaran atau persegi, dan olah gambar dengan batas ukuran serta resolusi yang aman.</p><ul><li><code>.sticker</code> — stiker transparan</li><li><code>.sticker bulat</code> — crop lingkaran</li><li><code>.sticker 1:1</code> — crop persegi</li><li><code>.resize 1080 1350</code> — ubah ukuran</li><li><code>.crop 4:5</code> — crop rasio</li><li><code>.imgconvert webp 82</code> — konversi</li><li><code>.compress</code> dan <code>.palette</code></li></ul></article><article class="pv-creative-card pv-creative-voice"><span class="eyebrow">AUDIO PROCESSING</span><h2>Voice Lab</h2><p>Olah voice note dan audio langsung dari WhatsApp. Balas audio dengan command efek; hasil diproses lokal melalui FFmpeg dan dikirim kembali sebagai MP3.</p><ul><li><code>.voice help</code> — katalog efek</li><li><code>.bass</code>, <code>.treble</code>, <code>.clean</code> — audio treatment</li><li><code>.8d</code>, <code>.robot</code>, <code>.chipmunk</code> — creative effects</li><li><code>.karaoke</code> — pengurangan komponen tengah stereo</li><li><code>.tempo 1.25</code> — ubah tempo</li></ul><p class="pv-creative-note">Memerlukan FFmpeg. Input maksimal 12 MB dan 10 menit. Mode karaoke sederhana bukan pemisahan vokal AI.</p></article><article class="pv-creative-card"><span class="eyebrow">COMMUNITY COMPETITION</span><h2>Design Seasons</h2><p>Kompetisi desain beberapa ronde. Admin menyiapkan brief setiap ronde; peserta mengirim karya, melihat galeri, dan saling memberi masukan di grup asal.</p><div class="pv-creative-command"><small>ALUR PESERTA</small><code>.designseason list<br>.designseason lihat KODE<br>.designseason submit KODE Judul | https://tautan | refleksi<br>.designseason feedback KODE-KARYA 5 Masukan</code></div><p class="pv-creative-note">Satu season aktif per grup, 2–8 ronde, satu kiriman per anggota per ronde, dan peer review ditutup bersama ronde.</p></article><article class="pv-creative-card"><span class="eyebrow">LOCAL INFORMATION</span><h2>Cuaca & Gempa</h2><p>Utilitas informasi publik untuk memeriksa cuaca kota dan gempa terbaru tanpa memasang API key tambahan.</p><ul><li><code>.cuaca Bandung</code> — kondisi cuaca, suhu terasa, kelembapan, angin, dan rentang suhu</li><li><code>.cuaca Jakarta</code> — kota lain berdasarkan nama</li><li><code>.gempa</code> — info gempa terbaru dari BMKG</li></ul><p class="pv-creative-note">Cuaca menggunakan Open-Meteo; gempa menggunakan BMKG. Informasi darurat tetap ikuti kanal resmi BMKG dan BPBD.</p></article><article class="pv-creative-card"><span class="eyebrow">MEDIA & DISCOVERY</span><h2>Multifunction Hub</h2><p>Creative workflow tetap terhubung dengan fitur media dan hiburan PIR.</p><ul><li><code>.music top</code> — chart Apple Indonesia</li><li><code>.music cari</code> — metadata lagu</li><li><code>.music preview</code> — kirim preview resmi Apple dari tautan lagu</li><li><code>.dl apple</code> — pintasan preview Apple</li><li><code>.anime populer</code> — discovery anime dengan provider cadangan</li><li><code>.mediaformat cek</code> — inspeksi format</li><li><code>.dl status</code> — status downloader</li></ul><p class="pv-creative-note">Music dan anime discovery menampilkan informasi/tautan resmi. Unduh media hanya dari sumber yang kamu miliki atau diizinkan.</p></article></div></section><section class="pv-creative-bottom"><div class="pv-creative-bottom-inner"><div><span class="eyebrow">BUILT FOR COMMUNITY</span><h2>Mulai dari workflow yang jelas.</h2><p class="muted">Gunakan Command Explorer untuk menemukan perintah berdasarkan kebutuhan, kategori, dan hak akses.</p></div><a class="btn" href="/commands">Buka Command Explorer ↗</a></div></section><style>.pv-creative-hero{position:relative;overflow:hidden;padding:clamp(28px,5vw,68px);border:1px solid var(--line);border-radius:28px;background:linear-gradient(125deg,var(--surface) 0%,var(--bg-soft) 68%,color-mix(in srgb,var(--accent) 11%,var(--surface)) 100%)}.pv-creative-hero h1{max-width:760px;font-size:clamp(38px,6vw,76px);line-height:1.02;letter-spacing:-.055em;margin:16px 0}.pv-creative-hero-summary>p{max-width:690px;line-height:1.8}.pv-creative-stats{display:flex;gap:clamp(18px,4vw,52px);flex-wrap:wrap;margin-top:34px}.pv-creative-stats div{display:grid;gap:4px}.pv-creative-stats strong{font-size:26px;color:var(--accent-strong)}.pv-creative-stats span{font-size:12px;color:var(--muted)}.pv-creative-grid-inner{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.pv-creative-card{min-width:0;padding:clamp(20px,3vw,30px);border:1px solid var(--line);border-radius:22px;background:var(--surface);box-shadow:var(--shadow)}.pv-creative-card h2{font-size:clamp(22px,3vw,32px);letter-spacing:-.035em;margin:10px 0}.pv-creative-card p,.pv-creative-card li{color:var(--muted);line-height:1.75}.pv-creative-card ul{padding-left:19px}.pv-creative-feature{background:linear-gradient(145deg,var(--surface),color-mix(in srgb,var(--accent) 8%,var(--surface)))}.pv-creative-voice{background:linear-gradient(145deg,var(--surface),color-mix(in srgb,var(--gold) 7%,var(--surface)))}.pv-creative-command{display:grid;gap:8px;margin-top:14px;padding:14px;border:1px solid var(--line);border-radius:14px;background:var(--bg-soft);min-width:0}.pv-creative-command small{font-size:9px;letter-spacing:.14em;font-weight:800;color:var(--muted)}.pv-creative-command code{white-space:normal;overflow-wrap:anywhere;line-height:1.8;color:var(--text)}.pv-creative-note{font-size:12px!important;border-left:2px solid var(--gold);padding-left:12px}.pv-creative-bottom-inner{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:clamp(22px,4vw,38px);border:1px solid var(--line);border-radius:22px;background:var(--bg-soft)}.pv-creative-bottom h2{margin:8px 0;font-size:clamp(23px,3vw,34px)}.pv-creative-bottom p{max-width:600px}@media(max-width:760px){.pv-creative-hero-inner{grid-template-columns:1fr}.pv-creative-grid-inner{grid-template-columns:1fr}.pv-creative-bottom-inner{align-items:flex-start;flex-direction:column}.pv-creative-hero{border-radius:20px}}</style>`;
        return sendHtml(res, 200, pageShell('Creative Studio — PIR Visuals', body), { 'cache-control': 'public, max-age=300' });
      }

      if (parts[0] === 'vendor' && parts.length === 2 && req.method === 'GET' && ['gsap.min.js','ScrollTrigger.min.js'].includes(parts[1])) {
        const vendorPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'node_modules', 'gsap', 'dist', parts[1]);
        try {
          const asset = fs.readFileSync(vendorPath);
          res.writeHead(200, { 'content-type': 'application/javascript; charset=utf-8', 'cache-control': 'public, max-age=31536000, immutable', 'x-content-type-options': 'nosniff' });
          return res.end(asset);
        } catch {
          res.writeHead(503, { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' });
          return res.end('GSAP belum terpasang. Jalankan npm run website:install lalu mulai ulang website.');
        }
      }
      if (parts[0] === 'robots.txt' && parts.length === 1 && ['GET', 'HEAD'].includes(req.method)) {
        const base = getSiteBase() || publicBase;
        const body = `User-agent: *\nAllow: /\nDisallow: /studio/\nDisallow: /client\nDisallow: /dashboard\nDisallow: /api/\nSitemap: ${base}/sitemap.xml\n`;
        res.writeHead(200,{'content-type':'text/plain; charset=utf-8','cache-control':'public, max-age=3600'});return res.end(body);
      }
      if (parts[0] === 'sitemap.xml' && parts.length === 1 && ['GET', 'HEAD'].includes(req.method)) {
        const base = getSiteBase() || publicBase;
        const [profiles, works] = await Promise.all([
          DesignerProfile.find({isPublic:true}).select('designerId slug updatedAt').sort({updatedAt:-1}).limit(5000).lean(),
          findPublishedWorks({ moderationStatus: 'approved' }, { updatedAt: -1, _id: -1 }, 10000, { itemId: 1, updatedAt: 1 })
        ]);
        const urls = [{loc:`${base}/`,priority:'1.0'},{loc:`${base}/discover`,priority:'0.9'},{loc:`${base}/for-business`,priority:'0.8'},{loc:`${base}/about`,priority:'0.6'},{loc:`${base}/how-it-works`,priority:'0.6'},{loc:`${base}/categories`,priority:'0.7'},{loc:`${base}/commands`,priority:'0.7'},{loc:`${base}/creative-studio`,priority:'0.7'},{loc:`${base}/contact`,priority:'0.4'},
          ...profiles.map(p=>({loc:`${base}${p.slug?`/p/${encodeURIComponent(p.slug)}`:`/designer/${encodeURIComponent(p.designerId)}`}`,lastmod:p.updatedAt,priority:'0.8'})),
          ...works.map(w=>({loc:`${base}/work/${encodeURIComponent(w.itemId)}`,lastmod:w.updatedAt,priority:'0.7'}))];
        const xml=`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(u=>`<url><loc>${escapeHtml(u.loc)}</loc>${u.lastmod?`<lastmod>${new Date(u.lastmod).toISOString().slice(0,10)}</lastmod>`:''}<priority>${u.priority}</priority></url>`).join('')}</urlset>`;
        res.writeHead(200,{'content-type':'application/xml; charset=utf-8','cache-control':'public, max-age=1800'});return res.end(xml);
      }
      if (parts[0] === 'shortlist' && parts.length === 1 && req.method === 'GET') {
        const body = `<section class="shortlist-hero"><span class="eyebrow">CLIENT WORKSPACE · PRIVATE TO THIS DEVICE</span><h1>Compare your<br><em>creative shortlist.</em></h1><p>Pilih maksimal empat desainer, bandingkan spesialisasi, kisaran harga, lokasi, dan ketersediaan. Keputusan dan komunikasi tetap langsung dengan desainer.</p><div class="shortlist-actions"><a class="btn btn-secondary" href="/discover">Temukan desainer</a><button class="btn" type="button" data-shortlist-share>Bagikan shortlist ↗</button></div></section><section class="shortlist-results"><div class="shortlist-toolbar"><div><span class="eyebrow">YOUR SELECTION</span><h2><span data-shortlist-total>0</span> designers selected</h2></div><button class="btn btn-secondary" type="button" data-shortlist-clear>Hapus semua</button></div><div id="shortlist-results" aria-live="polite"><div class="card empty-state"><h2>Shortlist kamu masih kosong</h2><p class="muted">Tambahkan desainer dari halaman Discover untuk mulai membandingkan.</p><a class="btn" href="/discover">Jelajahi desainer ↗</a></div></div></section>`;
        return sendHtml(res, 200, pageShell('Shortlist — Compare Designers', body), { 'cache-control': 'no-store' });
      }
      if (parts[0] === 'collections' && parts.length === 1 && req.method === 'GET') {
        const body = `<div class="pv-collection-builder"><section class="card moodboard-create pv-collection-create"><div class="pv-collection-create-head"><span class="eyebrow">BUILD YOUR VISUAL DIRECTION</span><h2>Buat collection inspirasi.</h2><p class="muted">Kurasi desainer dan karya ke dalam satu board yang mudah dibaca, dibagikan, dan diperbarui.</p></div><form method="post" action="/collections/create" data-pv-collection-form><label>Nama collection</label><input name="title" data-pv-collection-title maxlength="100" required placeholder="Contoh: Branding minimalis" style="width:100%;padding:11px;margin:6px 0 12px"><label>Deskripsi / creative direction</label><textarea name="description" data-pv-collection-description maxlength="500" placeholder="Ceritakan mood, tujuan, atau arah visual board ini..." style="width:100%;padding:11px;margin:6px 0 12px"></textarea><label>ID desainer (pisahkan dengan koma)</label><input name="designerIds" data-pv-collection-designers maxlength="1000" placeholder="DSN-1234, DSN-5678" style="width:100%;padding:11px;margin:6px 0 4px"><small class="pv-field-help">Salin ID dari profil desainer yang ingin kamu masukkan.</small><label>ID karya (pisahkan dengan koma)</label><input name="itemIds" data-pv-collection-works maxlength="1500" placeholder="ART-ABCD1234, ART-EFGH5678" style="width:100%;padding:11px;margin:6px 0 4px"><small class="pv-field-help">Gunakan ID pada halaman detail karya. Karya harus sudah dipublikasikan.</small><label class="pv-collection-public-toggle"><input type="checkbox" name="isPublic" checked> Jadikan collection publik dan bisa dibagikan</label><button class="btn" style="margin-top:14px">Buat collection ↗</button></form></section><aside class="pv-collection-builder-aside"><div class="pv-collection-live-preview" data-pv-collection-preview aria-live="off"><span class="eyebrow">LIVE BOARD PREVIEW</span><div class="pv-preview-art"><i></i><i></i><i></i></div><h3 data-pv-preview-title>Untitled collection</h3><p data-pv-preview-description>Creative direction kamu akan muncul di sini.</p><div><span><b data-pv-preview-designers>0</b> DESIGNER IDS</span><span><b data-pv-preview-works>0</b> WORK IDS</span></div></div><div class="pv-collection-steps"><span class="eyebrow">A SIMPLE FLOW</span><ol><li><b>01</b><span><strong>Find the references</strong><small>Jelajahi karya dan profil yang relevan.</small></span></li><li><b>02</b><span><strong>Curate your board</strong><small>Masukkan ID desainer dan karya pilihan.</small></span></li><li><b>03</b><span><strong>Share the direction</strong><small>Bagikan satu link untuk mempresentasikan pilihan.</small></span></li></ol></div></aside></div>`;
        return sendHtml(res, 200, renderMoodboardPage('Collection & Moodboard', body), { 'cache-control': 'no-store' });
      }
      if (parts[0] === 'collections' && parts[1] === 'create' && req.method === 'POST') {
        const form = await readForm(req, 8 * 1024);
        const title = String(form.get('title') || '').trim().slice(0,100);
        const description = String(form.get('description') || '').trim().slice(0,500);
        const designerIds = [...new Set(String(form.get('designerIds') || '').split(',').map(x=>x.trim().toUpperCase()).filter(x=>/^[A-Z0-9_-]{3,40}$/.test(x)))].slice(0,20);
        const itemIds = [...new Set(String(form.get('itemIds') || '').split(',').map(x=>x.trim().toUpperCase()).filter(x=>/^ART-[A-F0-9]{4,16}$/.test(x)))].slice(0,30);
        if (!title || (!designerIds.length && !itemIds.length) || !allowCount(req, 'moodboard-create', 60000)) return sendHtml(res, 400, renderMoodboardPage('Collection gagal', '<section class="card"><h1>Isi nama dan minimal satu ID desainer atau karya. Coba lagi beberapa saat.</h1><a href="/collections">Kembali</a></section>'));
        const [ownedDesigners, approvedWorks] = await Promise.all([
          designerIds.length ? DesignerProfile.find({ designerId: { $in: designerIds }, isPublic: true }).distinct('designerId') : [],
          itemIds.length ? PortfolioItem.find({ itemId: { $in: itemIds }, moderationStatus: 'approved' }).distinct('itemId') : [],
        ]);
        if (ownedDesigners.length !== designerIds.length || approvedWorks.length !== itemIds.length) return sendHtml(res, 400, renderMoodboardPage('Collection gagal', '<section class="card"><h1>Ada ID yang tidak ditemukan atau belum dipublikasikan. Periksa kembali ID desainer dan karya.</h1><a href="/collections">Kembali</a></section>'));
        const token = crypto.randomBytes(32).toString('hex');
        const slug = crypto.randomBytes(7).toString('hex');
        const board = await ClientMoodboard.create({ boardId: `MB-${crypto.randomBytes(6).toString('hex').toUpperCase()}`, slug, title, description, designerIds, itemIds, isPublic: form.get('isPublic') === 'on', editTokenHash: hashToken(token) });
        const shareUrl = `${publicBase}/collections/${board.slug}`;
        const editUrl = `${shareUrl}?key=${encodeURIComponent(token)}`;
        return sendHtml(res, 201, renderMoodboardPage('Collection berhasil dibuat', `<section class="card"><h2>${escapeHtml(title)}</h2><p>Collection berhasil disimpan.</p>${board.isPublic ? `<label>Link publik</label><input readonly value="${escapeHtml(shareUrl)}" style="width:100%;padding:10px" data-pv-select-on-click>` : '<p class="tag">Collection privat</p>'}<label>Link pengelolaan rahasia — simpan sekarang</label><input readonly value="${escapeHtml(editUrl)}" style="width:100%;padding:10px" data-pv-select-on-click><p class="muted">Link pengelolaan hanya ditampilkan sekali. Jangan bagikan kepada orang lain.</p><a class="btn" href="${escapeHtml(editUrl)}">Buka collection</a></section>`), { 'cache-control': 'no-store', 'referrer-policy': 'no-referrer', 'x-robots-tag': 'noindex, nofollow' });
      }

      if (parts[0] === 'collections' && parts[1] && ['update','delete'].includes(parts[2]) && req.method === 'POST') {
        const form = await readForm(req, 8 * 1024);
        const board = await ClientMoodboard.findOne({ slug: String(parts[1]).toLowerCase() });
        const key = String(form.get('key') || '');
        if (!board || !sameHash(hashToken(key), board.editTokenHash) || !isSameOriginRequest(req.headers) || !allowCount(req, `moodboard-edit:${board.slug}`, 10000)) {
          res.writeHead(403, { 'cache-control': 'no-store' }); return res.end('Link pengelolaan tidak valid.');
        }
        if (parts[2] === 'delete') {
          await ClientMoodboard.deleteOne({ _id: board._id });
          return sendHtml(res, 200, renderMoodboardPage('Collection dihapus', '<section class="card"><h1>Collection berhasil dihapus.</h1><a href="/collections">Buat collection baru</a></section>'), { 'cache-control': 'no-store' });
        }
        const title = String(form.get('title') || '').trim().slice(0,100);
        const description = String(form.get('description') || '').trim().slice(0,500);
        const designerIds = [...new Set(String(form.get('designerIds') || '').split(',').map(x=>x.trim().toUpperCase()).filter(x=>/^[A-Z0-9_-]{3,40}$/.test(x)))].slice(0,20);
        const itemIds = [...new Set(String(form.get('itemIds') || '').split(',').map(x=>x.trim().toUpperCase()).filter(x=>/^ART-[A-F0-9]{4,16}$/.test(x)))].slice(0,30);
        if (!title || (!designerIds.length && !itemIds.length)) return sendHtml(res,400,renderMoodboardPage('Perubahan gagal','<section class="card"><h1>Nama dan minimal satu ID wajib diisi.</h1></section>'),{'cache-control':'no-store'});
        const [validDesigners, validWorks] = await Promise.all([
          designerIds.length ? DesignerProfile.find({ designerId: { $in: designerIds }, isPublic: true }).distinct('designerId') : [],
          itemIds.length ? PortfolioItem.find({ itemId: { $in: itemIds }, moderationStatus: 'approved' }).distinct('itemId') : [],
        ]);
        if (validDesigners.length !== designerIds.length || validWorks.length !== itemIds.length) return sendHtml(res,400,renderMoodboardPage('Perubahan gagal','<section class="card"><h1>Periksa ID desainer dan karya. Hanya profil publik dan karya yang disetujui yang dapat dimasukkan.</h1></section>'),{'cache-control':'no-store'});
        board.title=title; board.description=description; board.designerIds=designerIds; board.itemIds=itemIds; board.isPublic=form.get('isPublic')==='on';
        await board.save();
        return sendHtml(res,200,await renderMoodboard(board.slug,key),{'cache-control':'no-store','referrer-policy':'no-referrer','x-robots-tag':'noindex, nofollow'});
      }
      if (parts[0] === 'collections' && parts[1] && req.method === 'GET') {
        const board = await ClientMoodboard.findOne({ slug: String(parts[1]).toLowerCase() }).lean();
        const key = String(url.searchParams.get('key') || '');
        const html = await renderMoodboard(parts[1], key);
        if (!html) { res.writeHead(404); return res.end(renderMoodboardPage('Collection tidak ditemukan', '<section class="card"><h1>Collection tidak tersedia atau privat.</h1><a href="/collections">Buat collection</a></section>')); }
        const hasEditKey = Boolean(key);
        return sendHtml(res, 200, html, {
          'cache-control': hasEditKey ? 'no-store' : (board?.isPublic ? 'public, max-age=60' : 'no-store'),
          'referrer-policy': hasEditKey ? 'no-referrer' : 'strict-origin-when-cross-origin',
          'x-robots-tag': hasEditKey || !board?.isPublic ? 'noindex, nofollow' : 'index, follow',
        });
      }
      if (parts[0] === 'health') {
        if (!['GET', 'HEAD'].includes(req.method || '')) {
          res.writeHead(405, { allow: 'GET, HEAD', 'cache-control': 'no-store' });
          return res.end();
        }
        let ready = mongoose.connection.readyState === 1;
        if (ready) {
          try { await mongoose.connection.db.command({ ping: 1 }, { timeoutMS: 1000 }); }
          catch { ready = false; }
        }
        res.writeHead(ready ? 200 : 503, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
        return res.end(req.method === 'HEAD' ? undefined : JSON.stringify({ ok: ready, service: 'designer-portfolio', version: '6.7.13', database: ready ? 'connected' : 'disconnected' }));
      }
      if (parts[0] === 'analytics-ui.js' && req.method === 'GET') {
        res.writeHead(200, { 'content-type': 'application/javascript; charset=utf-8', 'cache-control': 'public, max-age=3600', 'x-content-type-options': 'nosniff' });
        return res.end(`(()=> {
          const send=(eventType,extra={})=>{
            try {
              const payload=new URLSearchParams({eventType,path:location.pathname,...extra});
              fetch('/api/track',{method:'POST',credentials:'same-origin',keepalive:true,headers:{'content-type':'application/x-www-form-urlencoded;charset=UTF-8'},body:payload}).catch(()=>{});
            } catch {}
          };
          const path=location.pathname;
          const segments=path.split('/').filter(Boolean);
          const publicPage=path==='/' || (segments.length===1 && ['discover','categories','about','contact','how-it-works','collections','favorites','shortlist'].includes(segments[0])) || (segments.length===2 && ['p','designer','work'].includes(segments[0]) && /^[A-Za-z0-9_-]+$/.test(segments[1]));
          if(publicPage) send('page_view');
          if(segments[0]==='work' && segments.length===2){
            const project=document.querySelector('[data-track-project]');
            if(project) send('project_view',{
              designerId:String(project.dataset.trackDesigner||'').slice(0,48),
              itemId:String(project.dataset.trackProject||'').slice(0,48)
            });
          }
          if(path==='/discover'){
            const params=new URLSearchParams(location.search);
            if(['q','keyword','category','skill','location','verified','available','minPrice','maxPrice'].some(k=>params.has(k))){
              const category=params.get('category')||'';
              send('search',category?{category:category.slice(0,60)}:{});
            }
          }
          document.addEventListener('click',event=>{
            const campaign=event.target.closest('[data-track-campaign]');
            if(campaign) send('campaign_click',{campaignId:String(campaign.dataset.trackCampaign||'').slice(0,32)});
            const anchor=event.target.closest('a[href]');
            if(!anchor) return;
            try {
              const target=new URL(anchor.href,location.origin);
              const category=target.searchParams.get('category');
              if(category && target.origin===location.origin) send('category_click',{category:category.slice(0,60)});
              const href=anchor.getAttribute('href')||'';
              if(/^mailto:|^tel:/i.test(href)||/wa[.]me|api[.]whatsapp[.]com/i.test(target.hostname)||target.pathname==='/contact'){
                send('contact_click');
              }
            } catch {}
          },{passive:true});
        })();`);
      }
      if (parts[0] === 'pwa-register.js' || parts[0] === 'studio-upload.js' || parts[0] === 'studio-avatar.js' || parts[0] === 'public-ui.js') {
        res.writeHead(200, { 'content-type': 'application/javascript; charset=utf-8', 'cache-control': 'public, max-age=3600', 'x-content-type-options': 'nosniff' });
        if (parts[0] === 'public-ui.js') return res.end(`/* v6.4.0 — guided designer matching and private portfolio readiness */(()=>{
const copyText=async value=>{
 const text=String(value??'');
 if(!text)throw new Error('empty-copy');
 try{if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);return true;}}catch{}
 const previousFocus=document.activeElement;
 const field=document.createElement('textarea');
 field.value=text;field.setAttribute('readonly','');
 field.style.position='fixed';field.style.left='-9999px';field.style.top='0';field.style.opacity='0';
 document.body.append(field);
 let copied=false;
 try{field.focus({preventScroll:true});field.select();field.setSelectionRange(0,field.value.length);copied=document.execCommand('copy');}
 finally{field.remove();if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});}
 if(!copied)throw new Error('copy-unavailable');
 return true;
};
const setActionStatus=(button,message,isError=false)=>{
 if(!button)return;
 let status=button.parentElement?.querySelector('[data-pv-action-status],[data-share-board-status],[data-support-copy-status]');
 if(!status){status=document.createElement('span');status.className='pv-action-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');button.insertAdjacentElement('afterend',status);}
 status.classList.add('pv-action-status');
 status.classList.toggle('is-error',Boolean(isError));
 status.textContent=message;
};
document.addEventListener('click',async event=>{
 const button=event.target.closest('[data-pv-copy-text],[data-copy-support-ticket]');
 if(!button)return;
 event.preventDefault();
 const value=button.dataset.pvCopyText??button.dataset.copySupportTicket??'';
 try{await copyText(value);setActionStatus(button,button.hasAttribute('data-copy-support-ticket')?'Nomor tiket berhasil disalin.':'Kode berhasil disalin.');}
 catch{setActionStatus(button,button.hasAttribute('data-copy-support-ticket')?'Salin manual nomor tiket yang tampil di atas.':'Salin manual kode yang tampil di atas.',true);}
});
const mountPasswordMatch=form=>{
 const confirmField=form.elements.namedItem('confirmPassword');
 const primaryField=form.elements.namedItem('newPassword')||form.elements.namedItem('password');
 if(!confirmField||!primaryField||typeof confirmField.setCustomValidity!=='function')return;
 const sync=()=>{
  const mismatch=Boolean(confirmField.value)&&confirmField.value!==primaryField.value;
  confirmField.setCustomValidity(mismatch?'Konfirmasi password belum sama.':'');
 };
 primaryField.addEventListener('input',sync);
 confirmField.addEventListener('input',sync);
 sync();
};
const mountSubmitFeedback=form=>{
 const method=(form.getAttribute('method')||'get').toLowerCase();
 if(method!=='post'||(form.target&&form.target.toLowerCase()!=='_self'))return;
 mountPasswordMatch(form);
 form.addEventListener('submit',event=>{
  if(event.defaultPrevented)return;
  if(form.dataset.pvSubmitLocked==='true'){event.preventDefault();return;}
  form.dataset.pvSubmitLocked='true';
  form.classList.add('pv-form-submitting');
  form.setAttribute('aria-busy','true');
  const controls=[...form.querySelectorAll('button[type="submit"],button:not([type]),input[type="submit"]')];
  controls.forEach(control=>{control.setAttribute('aria-disabled','true');control.classList.add('pv-submit-locked');});
  const status=document.createElement('span');
  status.className='pv-form-submit-status';
  status.setAttribute('role','status');
  status.setAttribute('aria-live','polite');
  status.textContent='Sedang mengirim formulir…';
  (controls[0]?.parentElement||form).append(status);
 });
};
document.querySelectorAll('form').forEach(mountSubmitFeedback);
document.addEventListener('submit',event=>{
 const form=event.target?.closest?.('form[data-pv-confirm]');
 if(!form)return;
 const message=String(form.dataset.pvConfirm||'Lanjutkan tindakan ini?').slice(0,240);
 if(!window.confirm(message))event.preventDefault();
},true);
document.addEventListener('click',event=>{
 const field=event.target?.closest?.('[data-pv-select-on-click]');
 if(field&&typeof field.select==='function'){field.focus({preventScroll:true});field.select();}
});
document.addEventListener('error',event=>{
 const image=event.target;
 if(image?.tagName==='IMG'&&image.hasAttribute('data-pv-hide-on-error'))image.hidden=true;
},true);
const key='pir_visuals_favorites_v1';document.documentElement.dataset.theme='light';const read=()=>{try{return JSON.parse(localStorage.getItem(key)||'[]').filter(x=>typeof x==='string').slice(0,100)}catch{return []}};const save=items=>{try{localStorage.setItem(key,JSON.stringify([...new Set(items)].slice(0,100)))}catch{}};const update=()=>{const ids=read();document.querySelectorAll('[data-favorite-count]').forEach(x=>x.textContent=ids.length);document.querySelectorAll('[data-favorite]').forEach(b=>{const active=ids.includes(b.dataset.favorite);b.setAttribute('aria-pressed',String(active));b.textContent=active?'♥ Tersimpan':'♡ Favorit'});};document.addEventListener('click',e=>{const b=e.target.closest('[data-favorite]');if(!b)return;const id=b.dataset.favorite;const ids=read();save(ids.includes(id)?ids.filter(x=>x!==id):[...ids,id]);update();});const nav=document.getElementById('main-nav');const toggle=document.querySelector('.nav-toggle'),navMore=nav?.querySelector('.nav-more'),navMoreSummary=navMore?.querySelector('summary');const compactNavQuery=window.matchMedia('(max-width: 1180px)');const normalizePath=value=>{const clean=String(value||'/').replace(/\\/+$/,'');return clean||'/';};const currentPath=normalizePath(location.pathname);const activeNavPath=/^\\/(p|designer|work)\\//.test(currentPath)?'/discover':currentPath;const brandLink=document.querySelector('.site-nav .brand[href="/"]');if(brandLink){if(activeNavPath==='/')brandLink.setAttribute('aria-current','page');else brandLink.removeAttribute('aria-current');}nav?.querySelectorAll('a[href]').forEach(link=>{let target='/';try{const url=new URL(link.getAttribute('href')||'/',location.origin);if(url.origin!==location.origin)return;target=normalizePath(url.pathname);}catch{return;}const current=target==='/'?activeNavPath==='/':activeNavPath===target||activeNavPath.startsWith(target+'/');if(current)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');});navMore?.classList.toggle('has-current',Boolean(navMore.querySelector('a[aria-current="page"]')));const syncNavMore=()=>{navMoreSummary?.setAttribute('aria-expanded',String(Boolean(navMore?.open)));navMore?.classList.toggle('has-current',Boolean(navMore.querySelector('a[aria-current="page"]')));};const setNavOpen=requestedOpen=>{if(!toggle||!nav)return;const open=Boolean(requestedOpen)&&compactNavQuery.matches;nav.classList.toggle('open',open);toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Tutup menu navigasi':'Buka menu navigasi');if(compactNavQuery.matches&&!open){nav.setAttribute('inert','');nav.setAttribute('aria-hidden','true');}else{nav.removeAttribute('inert');nav.removeAttribute('aria-hidden');}const icon=toggle.querySelector('.nav-toggle-icon'),label=toggle.querySelector('.nav-toggle-label');if(icon)icon.textContent=open?'×':'☰';if(label)label.textContent=open?'Tutup':'Menu';if(!open&&navMore?.open)navMore.open=false;syncNavMore();};const closeNav=restoreFocus=>{if(!nav)return;if(nav.classList.contains('open'))setNavOpen(false);else if(compactNavQuery.matches)setNavOpen(false);if(restoreFocus)toggle?.focus();};const syncNavViewport=()=>{if(compactNavQuery.matches){if(!nav?.classList.contains('open'))setNavOpen(false);}else{if(nav?.classList.contains('open'))setNavOpen(false);nav?.removeAttribute('inert');nav?.removeAttribute('aria-hidden');toggle?.setAttribute('aria-expanded','false');}};navMore?.addEventListener('toggle',syncNavMore);navMoreSummary?.addEventListener('click',event=>{event.preventDefault();navMore.open=!navMore.open;syncNavMore();});syncNavMore();toggle?.addEventListener('click',()=>setNavOpen(!nav.classList.contains('open')));nav?.addEventListener('click',event=>{const target=event.target instanceof Element?event.target:event.target?.parentElement;if(target?.closest('a[href]'))closeNav(false);});document.addEventListener('click',event=>{const target=event.target instanceof Element?event.target:event.target?.parentElement;if(nav?.classList.contains('open')&&!target?.closest('#main-nav,.nav-toggle'))closeNav(false);if(navMore?.open&&!target?.closest('.nav-more')){navMore.open=false;syncNavMore();}});document.addEventListener('keydown',event=>{if(event.key!=='Escape')return;if(document.querySelector('dialog[open]'))return;if(navMore?.open){event.preventDefault();event.stopPropagation();navMore.open=false;syncNavMore();navMoreSummary?.focus();return;}if(nav?.classList.contains('open')){event.preventDefault();event.stopPropagation();closeNav(true);}},true);if(typeof compactNavQuery.addEventListener==='function')compactNavQuery.addEventListener('change',syncNavViewport);else compactNavQuery.addListener(syncNavViewport);window.addEventListener('resize',syncNavViewport,{passive:true});window.addEventListener('pageshow',()=>{if(compactNavQuery.matches)closeNav(false);else syncNavViewport();},{passive:true});syncNavViewport();const getLightbox=()=>{let dialog=document.getElementById('pir-image-lightbox');if(dialog)return dialog;dialog=document.createElement('dialog');dialog.id='pir-image-lightbox';dialog.className='pir-lightbox';dialog.setAttribute('aria-label','Portfolio image viewer');dialog.innerHTML='<div class="pir-lightbox-toolbar"><small data-lightbox-counter role="status" aria-live="polite" aria-atomic="true">01 / 01</small><button type="button" class="lightbox-close" aria-label="Tutup preview">×</button></div><div class="pir-lightbox-stage"><button type="button" class="lightbox-nav" data-lightbox-prev aria-label="Gambar sebelumnya">←</button><img alt="" aria-describedby="pir-lightbox-caption"><button type="button" class="lightbox-nav" data-lightbox-next aria-label="Gambar berikutnya">→</button></div><div class="pir-lightbox-footer"><p class="lightbox-caption" id="pir-lightbox-caption"></p><span class="lightbox-hint">← → NAVIGATE · ESC CLOSE</span></div>';document.body.append(dialog);const image=dialog.querySelector('img'),caption=dialog.querySelector('.lightbox-caption'),counter=dialog.querySelector('[data-lightbox-counter]'),previous=dialog.querySelector('[data-lightbox-prev]'),next=dialog.querySelector('[data-lightbox-next]');let items=[],active=0,opener=null,touchX=0;const paint=()=>{const item=items[active],source=item?.getAttribute('href')||'';image.classList.remove('is-changing');void image.offsetWidth;image.src=source;image.classList.add('is-changing');image.addEventListener('animationend',()=>image.classList.remove('is-changing'),{once:true});const sourceImage=item?.querySelector('img');image.alt=sourceImage?.alt||item?.getAttribute('aria-label')||'Portfolio preview';caption.textContent=image.alt;counter.textContent=String(active+1).padStart(2,'0')+' / '+String(items.length).padStart(2,'0');previous.disabled=items.length<2;next.disabled=items.length<2;};const move=delta=>{if(items.length<2)return;active=(active+delta+items.length)%items.length;paint();};dialog.querySelector('.lightbox-close').addEventListener('click',()=>dialog.close());previous.addEventListener('click',()=>move(-1));next.addEventListener('click',()=>move(1));dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});dialog.querySelector('.pir-lightbox-stage').addEventListener('touchstart',event=>{touchX=event.changedTouches[0]?.clientX||0;},{passive:true});dialog.querySelector('.pir-lightbox-stage').addEventListener('touchend',event=>{const delta=(event.changedTouches[0]?.clientX||0)-touchX;if(Math.abs(delta)>48)move(delta<0?1:-1);},{passive:true});dialog.addEventListener('close',()=>{document.body.classList.remove('lightbox-open');image.removeAttribute('src');if(opener?.isConnected)opener.focus();opener=null;});dialog.addEventListener('pv-open-image',event=>{items=event.detail.items;active=event.detail.index;opener=event.detail.opener;paint();if(!dialog.open)dialog.showModal();document.body.classList.add('lightbox-open');dialog.querySelector('.lightbox-close').focus();});dialog._move=move;return dialog;};document.addEventListener('click',event=>{const link=event.target.closest('a[href^="/media/"]');if(!link)return;const image=link.querySelector('img');if(!image)return;event.preventDefault();const group=link.dataset.pvLightboxGroup||'';const items=group?[...document.querySelectorAll('a[data-pv-lightbox-group]')].filter(item=>item.dataset.pvLightboxGroup===group&&item.querySelector('img')):[link];const index=Math.max(0,items.indexOf(link));getLightbox().dispatchEvent(new CustomEvent('pv-open-image',{detail:{items,index,opener:link}}));});document.addEventListener('keydown',event=>{const dialog=document.getElementById('pir-image-lightbox');if(!dialog?.open)return;if(event.key==='ArrowRight'){event.preventDefault();dialog._move?.(1);}else if(event.key==='ArrowLeft'){event.preventDefault();dialog._move?.(-1);}});const quickDialog=document.getElementById('pv-designer-quick-view');if(quickDialog){const fields={name:quickDialog.querySelector('[data-pv-quick-name]'),location:quickDialog.querySelector('[data-pv-quick-location]'),bio:quickDialog.querySelector('[data-pv-quick-bio]'),category:quickDialog.querySelector('[data-pv-quick-category]'),price:quickDialog.querySelector('[data-pv-quick-price]'),skills:quickDialog.querySelector('[data-pv-quick-skills]'),avatar:quickDialog.querySelector('[data-pv-quick-avatar]'),profile:quickDialog.querySelector('[data-pv-quick-profile]')};document.addEventListener('click',event=>{const trigger=event.target.closest('[data-pv-designer-preview]');if(!trigger)return;fields.name.textContent=trigger.dataset.previewName||'Designer';fields.location.textContent=trigger.dataset.previewLocation||'';fields.bio.textContent=trigger.dataset.previewBio||'Desainer ini belum menambahkan bio.';fields.category.textContent=trigger.dataset.previewCategory||'Independent creative';fields.price.textContent=trigger.dataset.previewPrice||'Hubungi desainer';fields.profile.href=trigger.dataset.previewProfile||'/discover';fields.skills.replaceChildren();String(trigger.dataset.previewSpecialties||'').split('·').map(value=>value.trim()).filter(Boolean).forEach(skill=>{const chip=document.createElement('span');chip.className='pv-quick-view-skill';chip.textContent=skill;fields.skills.append(chip);});fields.avatar.replaceChildren();const avatar=trigger.dataset.previewAvatar||'';const safeAvatar=/^https:\\/\\//i.test(avatar)||/^\\/profile-avatar\\/DSN-[A-F0-9]{4,16}(?:\\?v=[A-Za-z0-9_.-]+)?$/i.test(avatar);if(safeAvatar){const img=document.createElement('img');img.src=avatar;img.alt='';img.addEventListener('error',()=>{img.remove();fields.avatar.textContent=(fields.name.textContent||'P').slice(0,1).toUpperCase();},{once:true});fields.avatar.append(img);}else fields.avatar.textContent=(fields.name.textContent||'P').slice(0,1).toUpperCase();if(!quickDialog.open)quickDialog.showModal();quickDialog.querySelector('[data-pv-quick-close]')?.focus();});quickDialog.querySelectorAll('[data-pv-quick-close]').forEach(button=>button.addEventListener('click',()=>quickDialog.close()));quickDialog.addEventListener('click',event=>{if(event.target===quickDialog)quickDialog.close();});}
const systemMotionReduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;const motionPreference=(()=>{try{return localStorage.getItem('pir_visuals_motion_v1')||'on'}catch{return 'on'}})();const motionReduced=systemMotionReduced||motionPreference==='off';document.documentElement.dataset.pvMotion=motionReduced?'off':'on';const gsapMotion=(!motionReduced&&window.gsap&&window.ScrollTrigger)?window.gsap:null;if(gsapMotion){gsapMotion.registerPlugin(window.ScrollTrigger);document.documentElement.classList.add('pv-gsap-ready');}const workExplorer=document.querySelector('[data-pv-work-explorer]');if(workExplorer){const cards=[...workExplorer.querySelectorAll('[data-pv-work-card]')],chips=[...workExplorer.querySelectorAll('[data-pv-work-filter]')],search=workExplorer.querySelector('[data-pv-work-search]'),status=workExplorer.querySelector('[data-pv-work-filter-status]');let active='all';const normalize=value=>String(value||'').trim().toLocaleLowerCase('id');const apply=()=>{const query=normalize(search?.value);let shown=0;cards.forEach((card,index)=>{const category=normalize(card.dataset.pvWorkCategory),text=normalize(card.textContent),matchesCategory=active==='all'||category===normalize(active),matchesQuery=!query||text.includes(query),visible=matchesCategory&&matchesQuery,wasHidden=card.hidden;card.hidden=!visible;if(visible){shown++;if(wasHidden&&!motionReduced){card.style.setProperty('--pv-filter-delay',Math.min(index,7)*38+'ms');card.classList.remove('pv-filter-enter');void card.offsetWidth;card.classList.add('pv-filter-enter');card.addEventListener('animationend',()=>card.classList.remove('pv-filter-enter'),{once:true});}}else card.classList.remove('pv-filter-enter');});chips.forEach(chip=>chip.setAttribute('aria-pressed',String(chip.dataset.pvWorkFilter===active)));if(status)status.textContent='Menampilkan '+shown+' dari '+cards.length+' karya.';};chips.forEach(chip=>chip.addEventListener('click',()=>{active=chip.dataset.pvWorkFilter||'all';apply();}));search?.addEventListener('input',apply);apply();}
const analyticsChart=document.querySelector('[data-pv-analytics-chart]');if(analyticsChart){const days=[...analyticsChart.querySelectorAll('[data-pv-analytics-day]')],buttons=[...document.querySelectorAll('[data-pv-analytics-metric]')],title=document.querySelector('[data-pv-analytics-title]'),note=document.querySelector('[data-pv-analytics-note]');const copy={views:['Profile traffic.','Grafik menampilkan kunjungan profil per hari.'],contacts:['Contact activity.','Grafik menampilkan klik kontak per hari; ini indikator minat, bukan atribusi transaksi.'],portfolio:['Portfolio interest.','Grafik menampilkan pembukaan halaman case study per hari, bukan impresi grid.']};const select=metric=>{const max=Math.max(1,...days.map(day=>Number(day.dataset[metric]||0)));days.forEach(day=>{const value=Number(day.dataset[metric]||0),bar=day.querySelector('i');if(bar)bar.style.setProperty('--trend-height',Math.max(4,Math.round(value/max*100))+'%');day.title=day.querySelector('small')?.textContent+': '+value+' '+metric;});buttons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.pvAnalyticsMetric===metric)));if(title)title.textContent=copy[metric][0];if(note)note.textContent=copy[metric][1];};buttons.forEach(button=>button.addEventListener('click',()=>select(button.dataset.pvAnalyticsMetric||'views')));select('views');}
document.querySelectorAll('[data-share-profile]').forEach(b=>b.addEventListener('click',async()=>{const payload={title:document.title,text:'Lihat portfolio desainer di PIR Visuals',url:location.href};if(navigator.share){try{await navigator.share(payload);return;}catch(err){if(err?.name==='AbortError')return;}}try{await copyText(payload.url);setActionStatus(b,'✓ Link tersalin. Profil siap dibagikan.');}catch{setActionStatus(b,'Tidak dapat menyalin link. Salin alamat halaman dari address bar.',true);}}));const mount=document.getElementById('favorite-results');if(mount){const ids=read();if(!ids.length){mount.innerHTML='<div class="card empty-state"><h2>Belum ada favorit</h2><p class="muted">Simpan desainer dengan tombol Favorit pada kartu desainer.</p><a class="btn" href="/">Jelajahi desainer</a></div>';}else{fetch('/api/designers?ids='+encodeURIComponent(ids.join(','))).then(r=>r.ok?r.json():Promise.reject()).then(data=>{mount.innerHTML=data.designers.map(d=>d.card).join('')||'<div class="card empty-state"><p>Desainer favorit tidak lagi tersedia secara publik.</p><a class="btn" href="/">Jelajahi desainer</a></div>';update();}).catch(()=>{mount.textContent='Favorit tidak dapat dimuat. Muat ulang halaman.';});}}
const shortlistKey='pir_visuals_shortlist_v1';const shortlistRead=()=>{try{return JSON.parse(localStorage.getItem(shortlistKey)||'[]').filter(x=>typeof x==='string').slice(0,4)}catch{return []}};const shortlistSave=ids=>{try{localStorage.setItem(shortlistKey,JSON.stringify([...new Set(ids)].slice(0,4)))}catch{}};const shortlistUpdate=()=>{const ids=shortlistRead();document.querySelectorAll('[data-shortlist-count]').forEach(x=>x.textContent=ids.length);document.querySelectorAll('[data-shortlist]').forEach(b=>{const on=ids.includes(b.dataset.shortlist);b.setAttribute('aria-pressed',String(on));b.textContent=on?'✓ Dibandingkan':'＋ Bandingkan'});const total=document.querySelector('[data-shortlist-total]');if(total)total.textContent=ids.length;};document.addEventListener('click',e=>{const b=e.target.closest('[data-shortlist]');if(!b)return;const id=b.dataset.shortlist,ids=shortlistRead();if(ids.includes(id))shortlistSave(ids.filter(x=>x!==id));else if(ids.length>=4){b.textContent='Maks. 4 desainer';return;}else shortlistSave([...ids,id]);shortlistUpdate();});const shortlistMount=document.getElementById('shortlist-results');if(shortlistMount){const sharedIds=new URLSearchParams(location.search).get('ids');if(sharedIds){const incoming=sharedIds.split(',').filter(x=>/^[A-Z0-9_-]{2,48}$/i.test(x)).slice(0,4);if(incoming.length)shortlistSave(incoming);}const renderShortlist=async()=>{const ids=shortlistRead();shortlistUpdate();if(!ids.length){shortlistMount.innerHTML='<div class="card empty-state"><h2>Shortlist kamu masih kosong</h2><p class="muted">Tambahkan desainer dari Discover untuk mulai membandingkan.</p><a class="btn" href="/discover">Jelajahi desainer ↗</a></div>';return;}try{const r=await fetch('/api/designers?ids='+encodeURIComponent(ids.join(',')));if(!r.ok)throw new Error();const data=await r.json();const rows=[['Lokasi',d=>d.location||'Belum diatur'],['Mulai dari',d=>d.priceMin?new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(d.priceMin):'Hubungi desainer'],['Spesialisasi',d=>(d.specialties||[]).join(', ')||'Belum diatur'],['Verifikasi',d=>d.isVerified?'Verified':'Belum terverifikasi'],['Featured',d=>d.isFeatured?'Featured':'—'],['Kontak',d=>d.hasDirectContact?'WhatsApp tersedia':'Kontak belum dicantumkan']];const table=document.createElement('div');table.className='shortlist-table-wrap';const tableEl=document.createElement('table');tableEl.className='shortlist-table';const head=document.createElement('tr');const blank=document.createElement('th');blank.textContent='COMPARISON';head.append(blank);data.designers.forEach(d=>{const th=document.createElement('th');const title=document.createElement('strong');title.textContent=d.displayName;const link=document.createElement('a');link.href=d.profileUrl;link.textContent='Lihat portfolio ↗';const remove=document.createElement('button');remove.type='button';remove.dataset.shortlistRemove=d.designerId;remove.textContent='Hapus';th.append(title,document.createElement('br'),link,document.createElement('br'),remove);head.append(th)});tableEl.append(head);rows.forEach(([label,get])=>{const tr=document.createElement('tr'),th=document.createElement('th');th.textContent=label;tr.append(th);data.designers.forEach(d=>{const td=document.createElement('td');td.textContent=get(d);tr.append(td)});tableEl.append(tr)});table.append(tableEl);shortlistMount.replaceChildren(table);}catch{shortlistMount.textContent='Shortlist tidak dapat dimuat. Silakan muat ulang halaman.';}};renderShortlist();document.querySelector('[data-shortlist-clear]')?.addEventListener('click',()=>{shortlistSave([]);renderShortlist()});shortlistMount.addEventListener('click',e=>{const b=e.target.closest('[data-shortlist-remove]');if(!b)return;shortlistSave(shortlistRead().filter(x=>x!==b.dataset.shortlistRemove));renderShortlist()});document.querySelector('[data-shortlist-share]')?.addEventListener('click',async()=>{const button=document.querySelector('[data-shortlist-share]'),ids=shortlistRead(),url=new URL('/shortlist',location.origin);if(ids.length)url.searchParams.set('ids',ids.join(','));if(navigator.share){try{await navigator.share({title:'PIR Visuals shortlist',url:url.href});return;}catch(err){if(err?.name==='AbortError')return;}}try{await copyText(url.href);setActionStatus(button,'Link shortlist berhasil disalin.');}catch{setActionStatus(button,'Tidak dapat menyalin link shortlist.',true);}});}const slides=[...document.querySelectorAll('[data-carousel-slide]')],dots=[...document.querySelectorAll('[data-carousel-dot]')],counter=document.querySelector('[data-carousel-current]');
if(slides.length){let active=0,timer=null;const show=(n)=>{active=(n+slides.length)%slides.length;slides.forEach((s,i)=>{s.classList.toggle('is-active',i===active);const video=s.querySelector('video');if(video){if(i===active)video.play().catch(()=>{});else video.pause();}});dots.forEach((d,i)=>d.setAttribute('aria-current',String(i===active)));if(counter)counter.textContent=String(active+1).padStart(2,'0');};const stop=()=>{if(timer)clearInterval(timer);timer=null;};const start=()=>{stop();let userMotion='on';try{userMotion=localStorage.getItem('pir_visuals_motion_v1')||'on'}catch{}if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches&&userMotion!=='off')timer=setInterval(()=>show(active+1),6500);};dots.forEach((d,i)=>d.addEventListener('click',()=>{show(i);start();}));document.querySelector('[data-carousel-prev]')?.addEventListener('click',()=>{show(active-1);start();});document.querySelector('[data-carousel-next]')?.addEventListener('click',()=>{show(active+1);start();});const carousel=document.querySelector('.home-carousel');carousel?.addEventListener('mouseenter',stop);carousel?.addEventListener('mouseleave',start);carousel?.addEventListener('focusin',stop);carousel?.addEventListener('focusout',start);document.addEventListener('visibilitychange',()=>document.hidden?stop():start());let swipeStart=0;carousel?.addEventListener('touchstart',event=>{swipeStart=event.changedTouches[0]?.clientX||0;},{passive:true});carousel?.addEventListener('touchend',event=>{const delta=(event.changedTouches[0]?.clientX||0)-swipeStart;if(Math.abs(delta)>45){show(delta<0?active+1:active-1);start();}},{passive:true});carousel?.addEventListener('keydown',event=>{if(event.key==='ArrowRight'){show(active+1);start();}if(event.key==='ArrowLeft'){show(active-1);start();}});show(0);start();}

const revealSelector='.hero,.card,.feature-item,.trust-item,.stat,.designer-card,.work,.showcase-work,.showcase-section-heading,.category-tile,.profile-hero,.section-head,.studio-panel,.studio-content-heading,.growth-panel,.footer-cta,.studio-welcome,.studio-kpis article,.practice-story-card,.studio-performance-card,.pv-client-card,.pv-client-confirmation,.pv-project-list-card,.category-intro-copy,.category-intro-note,.category-index-heading,.category-recent-card,.showcase-jumpnav,.showcase-facts,.case-gallery-item,.case-related-card,.shortlist-hero,.shortlist-toolbar,.support-success,.pv-faq details,.studio-sidebar,.moodboard-create,.case-heading,.case-meta-strip,.case-cover,.case-result-highlight,.case-narrative,.case-creator-card,.case-related-heading,.case-footer';
const revealObserver=(!gsapMotion&&'IntersectionObserver' in window && !motionReduced)?new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');revealObserver.unobserve(entry.target);}});},{threshold:.10,rootMargin:'0px 0px -35px 0px'}):null;
const mountReveal=(root)=>{if(!root||!root.querySelectorAll)return;const targets=[];if(root.matches&&root.matches(revealSelector))targets.push(root);targets.push(...root.querySelectorAll(revealSelector));targets.forEach(el=>{if(el.hasAttribute('data-pv-reveal'))return;let ancestor=el.parentElement,alreadyGrouped=false;while(ancestor&&ancestor!==document.documentElement){if(ancestor.hasAttribute('data-pv-reveal')||(ancestor.hasAttribute('data-pv-story')&&ancestor.matches('.pv-category-grid,.pv-talent-grid,.pv-project-grid'))){alreadyGrouped=true;break;}ancestor=ancestor.parentElement;}if(alreadyGrouped)return;const siblings=el.parentElement?[...el.parentElement.children].filter(item=>item.matches&&item.matches(revealSelector)):[];const stagger=Math.max(0,siblings.indexOf(el));el.setAttribute('data-pv-reveal','');el.dataset.pvMotionKind=el.matches('.showcase-work,.pv-project-list-card,.category-recent-card,.case-gallery-item,.case-related-card,.case-cover')?'media':el.matches('.category-tile,.designer-card,.work')?'card':el.matches('.studio-panel,.pv-client-card,.studio-sidebar,.moodboard-create,.case-result-highlight,.case-creator-card,.case-footer')?'panel':el.matches('.category-intro-copy,.category-intro-note,.category-index-heading,.showcase-section-heading,.showcase-jumpnav,.showcase-facts,.shortlist-hero,.shortlist-toolbar,.case-heading,.case-related-heading')?'heading':'content';el.style.setProperty('--pv-reveal-delay',Math.min(stagger,5)*55+'ms');if(gsapMotion){el.setAttribute('data-pv-gsap-reveal','');gsapMotion.fromTo(el,{autoAlpha:0,y:22,scale:.995},{autoAlpha:1,y:0,scale:1,duration:.74,delay:Math.min(stagger,5)*.055,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 88%',once:true,fastScrollEnd:true}});}else if(revealObserver)revealObserver.observe(el);else el.classList.add('is-visible');});};
document.documentElement.classList.add('pv-motion-ready');
mountReveal(document);
const mountImages=root=>{if(!root||!root.querySelectorAll)return;const images=[];if(root.matches&&root.matches('img[loading="lazy"]'))images.push(root);images.push(...root.querySelectorAll('img[loading="lazy"]'));images.forEach(img=>{if(img.dataset.pvImageReady)return;img.dataset.pvImageReady='1';img.decoding='async';if(img.complete){img.classList.add('pv-image-ready');return;}img.classList.add('pv-image-pending');const ready=()=>{img.classList.remove('pv-image-pending');img.classList.add('pv-image-ready');};img.addEventListener('load',ready,{once:true});img.addEventListener('error',ready,{once:true});});};
mountImages(document);
let updateHeroParallax=()=>{};const homeMotionRoot=document.querySelector('.pv-home');
if(homeMotionRoot){
  homeMotionRoot.classList.add('pv-home-motion');
  const storySelector='.pv-hero-main,.pv-index,.pv-home-showcase,.pv-section-top,.pv-category-grid,.pv-talent-grid,.pv-project-grid,.pv-manifesto-aside,.pv-manifesto-copy,.pv-join>div,.pv-join>a,.pv-faq>div,.pv-work-foot';
  const storyNodes=[...homeMotionRoot.querySelectorAll(storySelector)].filter(node=>!gsapMotion||!node.matches('.pv-hero-main,.pv-index'));
  storyNodes.forEach((node,index)=>{
    node.setAttribute('data-pv-story','');
    node.style.setProperty('--pv-story-delay',Math.min(index%4,3)*90+'ms');
    if(node.matches('.pv-category-grid,.pv-talent-grid,.pv-project-grid')){
      [...node.children].forEach((child,childIndex)=>{
        child.style.setProperty('--pv-stagger-index',childIndex);
        if(child.hasAttribute('data-pv-reveal')){
          revealObserver?.unobserve(child);
          if(gsapMotion&&child.hasAttribute('data-pv-gsap-reveal')){
            gsapMotion.killTweensOf(child);
            window.ScrollTrigger.getAll().forEach(trigger=>{if(trigger.trigger===child)trigger.kill();});
            child.removeAttribute('data-pv-gsap-reveal');
          }
          child.removeAttribute('data-pv-reveal');
          child.classList.remove('is-visible');
          child.style.removeProperty('--pv-reveal-delay');
          child.removeAttribute('data-pv-motion-kind');
        }
      });
    }
  });
  if(gsapMotion){
    const gridStorySelector='.pv-category-grid,.pv-talent-grid,.pv-project-grid';
    storyNodes.forEach((node,index)=>{
      node.setAttribute('data-pv-gsap-story','');
      const delay=Math.min(index%4,3)*.055;
      if(node.matches(gridStorySelector)){
        const children=[...node.children].filter(child=>!child.hidden);
        children.forEach(child=>child.setAttribute('data-pv-gsap-story-item',''));
        const timeline=gsapMotion.timeline({scrollTrigger:{trigger:node,start:'top 86%',once:true,fastScrollEnd:true}});
        timeline.fromTo(node,{autoAlpha:0,y:26},{autoAlpha:1,y:0,duration:.58,ease:'power3.out'});
        if(children.length)timeline.fromTo(children,{autoAlpha:0,y:30,scale:.985},{autoAlpha:1,y:0,scale:1,duration:.72,ease:'power3.out',stagger:.085},'-=0.12');
      }else{
        gsapMotion.fromTo(node,{autoAlpha:0,y:34},{autoAlpha:1,y:0,duration:.82,delay,ease:'power3.out',scrollTrigger:{trigger:node,start:'top 86%',once:true,fastScrollEnd:true}});
      }
    });
  }else if(!motionReduced&&'IntersectionObserver' in window){
    const storyObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(entry.isIntersecting){entry.target.classList.add('is-visible');storyObserver.unobserve(entry.target);}
    }),{threshold:.13,rootMargin:'0px 0px -45px 0px'});
    storyNodes.forEach(node=>storyObserver.observe(node));
  }else storyNodes.forEach(node=>node.classList.add('is-visible'));
  const countNodes=[...homeMotionRoot.querySelectorAll('[data-pv-count]')];
  const animateCount=node=>{
    const target=Math.max(0,Number(node.getAttribute('data-pv-count'))||0);
    if(motionReduced){node.textContent=new Intl.NumberFormat('id-ID').format(target);return;}
    const duration=1450,start=performance.now();
    const tick=now=>{
      const progress=Math.min(1,(now-start)/duration),eased=1-Math.pow(1-progress,4);
      node.textContent=new Intl.NumberFormat('id-ID').format(Math.round(target*eased));
      if(progress<1)requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if(gsapMotion){
    const formatter=new Intl.NumberFormat('id-ID');
    countNodes.forEach(node=>{
      const target=Math.max(0,Number(node.getAttribute('data-pv-count'))||0),counter={value:0};
      gsapMotion.fromTo(counter,{value:0},{value:target,duration:1.4,ease:'power4.out',onUpdate:()=>{node.textContent=formatter.format(Math.round(counter.value));},scrollTrigger:{trigger:node,start:'top 88%',once:true}});
    });
  }else if(!motionReduced&&'IntersectionObserver' in window){
    const countObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(entry.isIntersecting){animateCount(entry.target);countObserver.unobserve(entry.target);}
    }),{threshold:.65});
    countNodes.forEach(node=>countObserver.observe(node));
  }else countNodes.forEach(animateCount);
  const hero=homeMotionRoot.querySelector('.pv-hero');
  if(hero){
    updateHeroParallax=()=>{
      const rect=hero.getBoundingClientRect(),distance=Math.max(0,Math.min(1,-rect.top/Math.max(1,rect.height)));
      hero.style.setProperty('--pv-hero-parallax',(distance*30).toFixed(1)+'px');
    };
    if(!motionReduced){
      updateHeroParallax();
      let heroPointerFrame=0,heroPointerClientX=0,heroPointerClientY=0;
      hero.addEventListener('pointermove',event=>{
        if(document.documentElement.dataset.pvMotion==='off')return;
        heroPointerClientX=event.clientX;heroPointerClientY=event.clientY;
        if(heroPointerFrame)return;
        heroPointerFrame=requestAnimationFrame(()=>{
          const rect=hero.getBoundingClientRect();
          hero.style.setProperty('--pv-pointer-x',((heroPointerClientX-rect.left)/Math.max(1,rect.width)*100).toFixed(1)+'%');
          hero.style.setProperty('--pv-pointer-y',((heroPointerClientY-rect.top)/Math.max(1,rect.height)*100).toFixed(1)+'%');
          heroPointerFrame=0;
        });
      },{passive:true});
    }
  }
  if(hero&&gsapMotion){
    const heroMain=hero.querySelector('.pv-hero-main'),indexCard=hero.querySelector('.pv-index');
    const overline=hero.querySelector('.pv-overline'),words=[...hero.querySelectorAll('.pv-hero-word')];
    const lede=hero.querySelector('.pv-hero-lede'),actions=[...hero.querySelectorAll('.pv-hero-actions > *')],footItems=[...hero.querySelectorAll('.pv-hero-foot > *')];
    const intro=gsapMotion.timeline({defaults:{ease:'power3.out'}});
    if(overline)intro.fromTo(overline,{autoAlpha:0,y:14},{autoAlpha:1,y:0,duration:.55});
    if(words.length)intro.fromTo(words,{autoAlpha:0,y:14,rotation:2},{autoAlpha:1,y:0,rotation:0,duration:.94,stagger:.055,ease:'power4.out'},'-=0.08');
    if(lede)intro.fromTo(lede,{autoAlpha:0,y:18},{autoAlpha:1,y:0,duration:.66},'-=0.30');
    if(actions.length)intro.fromTo(actions,{autoAlpha:0,y:14},{autoAlpha:1,y:0,duration:.52,stagger:.09},'-=0.30');
    if(footItems.length)intro.fromTo(footItems,{autoAlpha:0,y:9},{autoAlpha:1,y:0,duration:.42,stagger:.06},'-=0.18');
    if(indexCard)intro.fromTo(indexCard,{autoAlpha:0,y:14},{autoAlpha:1,y:0,duration:.82,ease:'power3.out'},'-=0.68');
  }
  // The marquee has a single driver in pir-marquee.js, rather than GSAP + CSS.

}
let gsapRefreshFrame=0;
const refreshGsapTriggers=()=>{if(!gsapMotion||gsapRefreshFrame)return;gsapRefreshFrame=requestAnimationFrame(()=>{gsapRefreshFrame=0;window.ScrollTrigger.refresh();});};
if(gsapMotion)window.addEventListener('load',refreshGsapTriggers,{once:true});
if('MutationObserver' in window){const revealMutation=new MutationObserver(records=>records.forEach(record=>record.addedNodes.forEach(node=>{if(node.nodeType===1){mountReveal(node);mountImages(node);const storyParent=node.parentElement?.closest('.pv-category-grid[data-pv-story],.pv-talent-grid[data-pv-story],.pv-project-grid[data-pv-story]');if(storyParent)[...storyParent.children].forEach((child,childIndex)=>child.style.setProperty('--pv-stagger-index',childIndex));refreshGsapTriggers();}})));revealMutation.observe(document.body,{childList:true,subtree:true});}
const progress=document.createElement('div');progress.className='pv-scroll-progress';progress.setAttribute('aria-hidden','true');document.body.append(progress);
const toastRegion=document.createElement('div');toastRegion.className='pv-toast-region';toastRegion.setAttribute('aria-live','polite');toastRegion.setAttribute('aria-atomic','true');document.body.append(toastRegion);let toastTimer=0;const showToast=(message)=>{toastRegion.textContent=message;toastRegion.classList.add('is-visible');window.clearTimeout(toastTimer);toastTimer=window.setTimeout(()=>toastRegion.classList.remove('is-visible'),2200);};try{if(sessionStorage.getItem('pv_motion_restore_notice')==='1'){sessionStorage.removeItem('pv_motion_restore_notice');showToast('Animasi immersive berhasil dipulihkan.');}}catch{}
document.addEventListener('click',e=>{const fav=e.target.closest('[data-favorite]');if(fav){window.setTimeout(()=>showToast(fav.getAttribute('aria-pressed')==='true'?'Desainer disimpan ke favorit.':'Desainer dihapus dari favorit.'),0);return;}const short=e.target.closest('[data-shortlist]');if(short){window.setTimeout(()=>showToast(short.getAttribute('aria-pressed')==='true'?'Desainer ditambahkan ke shortlist.':'Desainer dihapus dari shortlist.'),0);}});

const discoveryForm=document.querySelector('[data-discovery-filters]');if(discoveryForm){const filterToggle=discoveryForm.querySelector('[data-filter-toggle]'),filterPanel=discoveryForm.querySelector('[data-filter-panel]'),filterCount=discoveryForm.querySelector('[data-filter-count]');const updateFilterCount=()=>{const values=['skill','category','location','min','max'].map(name=>String(discoveryForm.elements.namedItem(name)?.value||'').trim()).filter(Boolean);const sortValue=String(discoveryForm.elements.namedItem('sort')?.value||'featured');if(sortValue!=='featured')values.push(sortValue);['verified','featured','available'].forEach(name=>{if(discoveryForm.elements.namedItem(name)?.checked)values.push(name)});const count=values.length;if(filterCount){filterCount.textContent=String(count);filterCount.hidden=count===0;}if(filterToggle){const label=filterToggle.querySelector('span:first-child');if(label)label.textContent='Filter & urutkan';}};if(filterToggle&&filterPanel){filterToggle.addEventListener('click',()=>{const open=filterToggle.getAttribute('aria-expanded')!=='true';filterToggle.setAttribute('aria-expanded',String(open));filterPanel.classList.toggle('is-expanded',open);});discoveryForm.addEventListener('input',updateFilterCount);discoveryForm.addEventListener('change',updateFilterCount);updateFilterCount();discoveryForm.addEventListener('submit',()=>{discoveryForm.setAttribute('data-pv-submitting','');discoveryForm.setAttribute('aria-busy','true');});}}
document.querySelectorAll('.hero,.pv-hero,.pv-client-confirmation,.studio-welcome').forEach(el=>{if(motionReduced)return;el.addEventListener('pointermove',event=>{const rect=el.getBoundingClientRect();el.style.setProperty('--pv-pointer-x',(event.clientX-rect.left)+'px');el.style.setProperty('--pv-pointer-y',(event.clientY-rect.top)+'px');},{passive:true});});
const commandDialog=document.getElementById('pv-command-dialog'),commandInput=document.getElementById('pv-command-input'),commandItems=[...(document.querySelectorAll('[data-command-item]'))],commandStatus=document.getElementById('pv-command-status'),motionButton=document.querySelector('[data-motion-toggle]'),motionKey='pir_visuals_motion_v1';
let commandReturnFocus=null;
const updateCommandResults=()=>{const count=commandItems.filter(button=>!button.hidden&&!button.disabled).length;if(commandStatus)commandStatus.textContent=count?\`\${count} tujuan tersedia\`:'Tidak ada tujuan yang cocok. Coba kata kunci lain.';};
const openCommand=()=>{if(!commandDialog||commandDialog.open)return;commandReturnFocus=nav?.classList.contains('open')?toggle:document.activeElement;closeNav(false);updateCommandResults();commandDialog.showModal();window.setTimeout(()=>commandInput?.focus(),30);};
document.querySelectorAll('[data-command-open]').forEach(button=>{button.setAttribute('aria-keyshortcuts','Control+K Meta+K /');button.addEventListener('click',openCommand);});
document.querySelectorAll('[data-command-close]').forEach(button=>button.addEventListener('click',()=>commandDialog?.close()));
commandItems.forEach(button=>button.addEventListener('click',()=>{const href=button.getAttribute('data-command-href');if(href)location.href=href;}));
commandInput?.addEventListener('input',()=>{const query=commandInput.value.trim().toLocaleLowerCase('id');commandItems.forEach(button=>{button.hidden=Boolean(query)&&!button.textContent.toLocaleLowerCase('id').includes(query);});updateCommandResults();});
commandDialog?.addEventListener('keydown',event=>{if(!['ArrowDown','ArrowUp','Home','End'].includes(event.key))return;if((event.key==='Home'||event.key==='End')&&event.target===commandInput)return;const visible=commandItems.filter(button=>!button.hidden&&!button.disabled);if(!visible.length)return;const current=visible.indexOf(document.activeElement),last=visible.length-1;let next=current;if(event.key==='ArrowDown')next=current<0?0:Math.min(current+1,last);else if(event.key==='ArrowUp')next=current<0?last:Math.max(current-1,0);else if(event.key==='Home')next=0;else if(event.key==='End')next=last;if(next>=0){event.preventDefault();visible[next].focus();}});
commandDialog?.addEventListener('click',event=>{if(event.target===commandDialog)commandDialog.close();});
commandDialog?.addEventListener('close',()=>{if(commandInput)commandInput.value='';commandItems.forEach(button=>button.hidden=false);updateCommandResults();if(commandReturnFocus?.isConnected){commandReturnFocus.focus();commandReturnFocus=null;}});
document.addEventListener('keydown',event=>{const target=event.target,typing=target instanceof HTMLElement&&(target.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)),activeDialog=document.querySelector('dialog[open]');if(activeDialog&&activeDialog!==commandDialog)return;if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){event.preventDefault();openCommand();}else if(event.key==='/'&&!typing&&!event.ctrlKey&&!event.metaKey&&!event.altKey){event.preventDefault();openCommand();}});
const syncMotionButton=()=>{if(!motionButton)return;const off=document.documentElement.dataset.pvMotion==='off',icon=motionButton.querySelector('[data-motion-icon]'),label=motionButton.querySelector('[data-motion-label]');if(icon)icon.textContent=systemMotionReduced?'◌':off?'Ⅱ':'✦';if(label)label.textContent=systemMotionReduced?'Reduced':off?'Off':'On';else motionButton.textContent=systemMotionReduced?'◌ Reduced':off?'Ⅱ Off':'✦ On';motionButton.dataset.motionState=systemMotionReduced?'reduced':off?'off':'on';motionButton.setAttribute('aria-pressed',String(!off));motionButton.setAttribute('aria-label',systemMotionReduced?'Animasi dibatasi oleh pengaturan aksesibilitas perangkat':off?'Aktifkan kembali animasi website':'Nonaktifkan animasi website');motionButton.title=systemMotionReduced?'Animasi mengikuti pengaturan aksesibilitas perangkat':off?'Aktifkan kembali animasi website; halaman dimuat ulang agar semua efek scroll dan pointer aktif':'Kurangi animasi website';motionButton.disabled=systemMotionReduced;};
syncMotionButton();motionButton?.addEventListener('click',()=>{if(systemMotionReduced)return;const off=document.documentElement.dataset.pvMotion!=='off';document.documentElement.dataset.pvMotion=off?'off':'on';try{localStorage.setItem(motionKey,off?'off':'on')}catch{}if(off){if(gsapMotion){gsapMotion.globalTimeline.pause();window.ScrollTrigger.getAll().forEach(trigger=>trigger.disable(false));}document.querySelectorAll('[data-pv-reveal],[data-pv-story]').forEach(el=>el.classList.add('is-visible'));document.querySelectorAll('.pv-spotlight-card').forEach(el=>el.classList.remove('pv-spotlight-card'));document.querySelectorAll('.pv-depth-active').forEach(el=>{el.classList.remove('pv-depth-active');el.style.setProperty('--pv-tilt-x','0deg');el.style.setProperty('--pv-tilt-y','0deg')});document.querySelectorAll('.pv-magnetic').forEach(el=>{el.style.setProperty('--pv-magnetic-x','0px');el.style.setProperty('--pv-magnetic-y','0px')});document.querySelector('[data-pv-showcase]')?.dispatchEvent(new Event('mouseenter'));syncMotionButton();showToast('Animasi dikurangi.');}else{document.querySelector('[data-pv-showcase]')?.dispatchEvent(new Event('mouseleave'));try{sessionStorage.setItem('pv_motion_restore_notice','1')}catch{}window.location.reload();}});
/* v5.76.0 route-aware aria-current state is initialized with the navigation controller. */
const backTop=document.querySelector('[data-back-top]'),navHeader=document.querySelector('.site-nav');let scrollFrame=0;const paintScrollState=()=>{const y=window.scrollY||0,max=document.documentElement.scrollHeight-window.innerHeight,progressValue=max>0?Math.max(0,Math.min(1,y/max)):0;progress.style.transform='scaleX('+progressValue.toFixed(4)+')';navHeader?.classList.toggle('is-scrolled',y>18);if(!systemMotionReduced&&document.documentElement.dataset.pvMotion!=='off')updateHeroParallax();scrollFrame=0;};const requestScrollState=()=>{if(!scrollFrame)scrollFrame=window.requestAnimationFrame(paintScrollState);};window.addEventListener('scroll',requestScrollState,{passive:true});window.addEventListener('resize',requestScrollState,{passive:true});paintScrollState();
const finePointer=window.matchMedia('(hover:hover) and (pointer:fine)').matches;if(finePointer&&!motionReduced){let spotlightFrame=0,spotlightCard=null,spotlightClientX=0,spotlightClientY=0;const resetSpotlight=(card=spotlightCard)=>{if(!card)return;card.classList.remove('pv-spotlight-card');card.style.removeProperty('--pv-card-x');card.style.removeProperty('--pv-card-y');};document.addEventListener('pointermove',event=>{if(document.documentElement.dataset.pvMotion==='off'){resetSpotlight();spotlightCard=null;return;}const card=event.target.closest('.designer-card,.work,.feature-item,.trust-item,.pv-client-card,.studio-panel,.growth-panel');if(card!==spotlightCard){resetSpotlight();spotlightCard=card||null;}if(!card)return;spotlightClientX=event.clientX;spotlightClientY=event.clientY;if(spotlightFrame)return;spotlightFrame=requestAnimationFrame(()=>{if(spotlightCard?.isConnected){const rect=spotlightCard.getBoundingClientRect();spotlightCard.classList.add('pv-spotlight-card');spotlightCard.style.setProperty('--pv-card-x',((spotlightClientX-rect.left)/Math.max(1,rect.width)*100).toFixed(1)+'%');spotlightCard.style.setProperty('--pv-card-y',((spotlightClientY-rect.top)/Math.max(1,rect.height)*100).toFixed(1)+'%');}spotlightFrame=0;});},{passive:true});document.addEventListener('pointerout',event=>{if(spotlightCard&&!spotlightCard.contains(event.relatedTarget)){resetSpotlight();spotlightCard=null;}},{passive:true});}
/* v5.80.4 — robust mouse-following motion for every interactive button.
   Pointer listeners are registered independently of the primary-pointer media query.
   Delegated events cover dynamically rendered controls and still work if motion is toggled on after load. */
const magneticSelector='button:not(:disabled):not([aria-disabled="true"]),input[type=button]:not(:disabled),input[type=submit]:not(:disabled),input[type=reset]:not(:disabled),.btn,.button,.pv-button,.nav-cta,.footer-cta-actions a,.site-nav .nav-primary>a,.site-nav .nav-more>summary,.nav-toggle,.pv-footer-button,[role=button]:not([aria-disabled="true"]),[data-back-top]';
{
 let magneticFrame=0,magneticTarget=null,magneticClientX=0,magneticClientY=0;
 const resetMagnetic=(element=magneticTarget)=>{if(!element)return;element.style.setProperty('--pv-magnetic-x','0px');element.style.setProperty('--pv-magnetic-y','0px');element.classList.remove('pv-button-pointer-hover');};
 const findMagneticTarget=event=>{const node=event.target instanceof Element?event.target:event.target?.parentElement;return node?.closest(magneticSelector)||null;};
 const isMousePointer=event=>!event.pointerType||event.pointerType==='mouse'||event.pointerType==='pen';
 document.addEventListener('pointermove',event=>{
  if(!isMousePointer(event))return;
  if(document.documentElement.dataset.pvMotion==='off'||systemMotionReduced){resetMagnetic();magneticTarget=null;return;}
  const next=findMagneticTarget(event);
  if(next!==magneticTarget){resetMagnetic();magneticTarget=next;}
  if(!magneticTarget||magneticTarget.matches(':disabled,[aria-disabled="true"]'))return;
  magneticClientX=event.clientX;magneticClientY=event.clientY;
  if(magneticFrame)return;
  magneticFrame=requestAnimationFrame(()=>{
   if(magneticTarget?.isConnected){
    const rect=magneticTarget.getBoundingClientRect();
    const x=(magneticClientX-(rect.left+rect.width/2))*.18;
    const y=(magneticClientY-(rect.top+rect.height/2))*.18;
    magneticTarget.classList.add('pv-magnetic','pv-button-pointer-hover');
    magneticTarget.style.setProperty('--pv-magnetic-x',Math.max(-10,Math.min(10,x)).toFixed(2)+'px');
    magneticTarget.style.setProperty('--pv-magnetic-y',Math.max(-8,Math.min(8,y)).toFixed(2)+'px');
   }
   magneticFrame=0;
  });
 },{passive:true,capture:true});
 document.addEventListener('pointerout',event=>{
  if(magneticTarget&&!magneticTarget.contains(event.relatedTarget)){resetMagnetic();magneticTarget=null;}
 },{passive:true,capture:true});
 document.addEventListener('pointercancel',event=>{if(!isMousePointer(event))return;resetMagnetic();magneticTarget=null;},{passive:true,capture:true});
 document.addEventListener('pointerover',event=>{
  if(!isMousePointer(event))return;
  const target=findMagneticTarget(event);
  if(!target||target.contains(event.relatedTarget)||document.documentElement.dataset.pvMotion==='off'||systemMotionReduced)return;
  target.classList.add('pv-button-pointer-hover');
  if(gsapMotion)gsapMotion.to(target,{y:-2,scale:1.02,duration:.2,ease:'power2.out',overwrite:'auto'});
 },{passive:true,capture:true});
 document.addEventListener('pointerout',event=>{
  if(!isMousePointer(event))return;
  const target=findMagneticTarget(event);
  if(!target||target.contains(event.relatedTarget))return;
  target.classList.remove('pv-button-pointer-hover');
  if(gsapMotion)gsapMotion.to(target,{y:0,scale:1,duration:.28,ease:'power3.out',overwrite:'auto'});
 },{passive:true,capture:true});
 window.addEventListener('blur',()=>{resetMagnetic();magneticTarget=null;});
}
if(gsapMotion){
 const motionCards=document.querySelectorAll('.designer-card,.work,.feature-item,.trust-item,.pv-client-card,.studio-panel,.growth-panel,.support-channel,.home-category');
 motionCards.forEach(card=>{
   card.addEventListener('pointerenter',()=>gsapMotion.to(card,{y:-5,duration:.26,ease:'power2.out',overwrite:'auto'}));
   card.addEventListener('pointerleave',()=>gsapMotion.to(card,{y:0,duration:.38,ease:'power3.out',overwrite:'auto'}));
 });
}
const depthSelector='.showcase-work-image,.home-project-image,.category-tile-art,.category-recent-image,.case-related-image,.case-gallery-item,.case-cover,.designer-portrait';if(finePointer&&!motionReduced){let depthFrame=0,depthTarget=null,depthClientX=0,depthClientY=0;const resetDepth=()=>{if(!depthTarget)return;depthTarget.classList.remove('pv-depth-active');depthTarget.style.setProperty('--pv-tilt-x','0deg');depthTarget.style.setProperty('--pv-tilt-y','0deg');depthTarget=null;};document.addEventListener('pointermove',event=>{if(document.documentElement.dataset.pvMotion==='off'){resetDepth();return;}const next=event.target.closest(depthSelector);if(next!==depthTarget){resetDepth();depthTarget=next;if(depthTarget)depthTarget.classList.add('pv-depth-active');}if(!depthTarget)return;depthClientX=event.clientX;depthClientY=event.clientY;if(depthFrame)return;depthFrame=requestAnimationFrame(()=>{if(depthTarget?.isConnected){const rect=depthTarget.getBoundingClientRect(),nx=(depthClientX-rect.left)/Math.max(1,rect.width)-.5,ny=(depthClientY-rect.top)/Math.max(1,rect.height)-.5;depthTarget.style.setProperty('--pv-tilt-x',(-ny*3.2).toFixed(2)+'deg');depthTarget.style.setProperty('--pv-tilt-y',(nx*4.1).toFixed(2)+'deg');depthTarget.style.setProperty('--pv-depth-x',((nx+.5)*100).toFixed(1)+'%');depthTarget.style.setProperty('--pv-depth-y',((ny+.5)*100).toFixed(1)+'%');}depthFrame=0;});},{passive:true});document.addEventListener('pointerout',event=>{if(depthTarget&&!depthTarget.contains(event.relatedTarget))resetDepth();},{passive:true});}

/* v5.70.0 — progressive enhancement for collection curation, chapter navigation and studio setup */
/* v5.71.0 — immersive gallery, quick designer preview, work filters and analytics controls */
document.querySelectorAll('[data-pv-collection-form]').forEach(form=>{
  const title=form.querySelector('[data-pv-collection-title]'),description=form.querySelector('[data-pv-collection-description]'),designers=form.querySelector('[data-pv-collection-designers]'),works=form.querySelector('[data-pv-collection-works]');
  const preview=form.closest('.pv-collection-builder')?.querySelector('[data-pv-collection-preview]');
  if(!preview)return;
  const countIds=value=>new Set(String(value||'').split(',').map(part=>part.trim().toUpperCase()).filter(Boolean)).size;
  const updatePreview=()=>{
    const previewTitle=preview.querySelector('[data-pv-preview-title]'),previewDescription=preview.querySelector('[data-pv-preview-description]');
    if(previewTitle)previewTitle.textContent=title?.value.trim()||'Untitled collection';
    if(previewDescription)previewDescription.textContent=description?.value.trim()||'Creative direction kamu akan muncul di sini.';
    const designerCount=preview.querySelector('[data-pv-preview-designers]'),workCount=preview.querySelector('[data-pv-preview-works]');
    if(designerCount)designerCount.textContent=String(countIds(designers?.value));
    if(workCount)workCount.textContent=String(countIds(works?.value));
  };
  form.addEventListener('input',updatePreview);form.addEventListener('change',updatePreview);updatePreview();
});
document.querySelectorAll('[data-pv-order-editor]').forEach(editor=>{
  const list=editor.querySelector('[data-pv-order-list]'),input=editor.closest('form')?.querySelector('[data-pv-order-input]');
  if(!list||!input)return;
  let dragging=null;
  const items=()=>[...list.querySelectorAll('[data-pv-sort-item]')];
  const sync=(announce=false)=>{
    const rows=items();input.value=rows.map(item=>item.dataset.itemId).join(', ');
    rows.forEach((item,index)=>{const number=item.querySelector('[data-pv-order-index]');if(number)number.textContent=String(index+1).padStart(2,'0');const up=item.querySelector('[data-pv-order-move="up"]'),down=item.querySelector('[data-pv-order-move="down"]');if(up)up.disabled=index===0;if(down)down.disabled=index===rows.length-1;});
    input.dispatchEvent(new Event('change',{bubbles:true}));
    const status=editor.querySelector('[data-pv-order-status]');if(announce&&status)status.textContent='Urutan diperbarui. '+rows.length+' karya tersisa.';
  };
  list.addEventListener('click',event=>{
    const removeButton=event.target.closest('[data-pv-order-remove]');
    const button=event.target.closest('[data-pv-order-move]');if(!button&&!removeButton)return;
    const item=(button||removeButton).closest('[data-pv-sort-item]');if(!item)return;
    if(removeButton){const focusTarget=item.nextElementSibling||item.previousElementSibling;item.remove();sync(true);const focusButton=focusTarget?.querySelector('button:not(:disabled)')||input;focusButton?.focus();return;}
    if(button.dataset.pvOrderMove==='up'&&item.previousElementSibling)list.insertBefore(item,item.previousElementSibling);
    if(button.dataset.pvOrderMove==='down'&&item.nextElementSibling)list.insertBefore(item,item.nextElementSibling.nextElementSibling);
    sync(true);
  });
  list.addEventListener('dragstart',event=>{
    const item=event.target.closest('[data-pv-sort-item]');if(!item)return;dragging=item;item.classList.add('is-dragging');
    if(event.dataTransfer){event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('text/plain',item.dataset.itemId||'');}
  });
  list.addEventListener('dragover',event=>{
    if(!dragging)return;event.preventDefault();const target=event.target.closest('[data-pv-sort-item]');if(!target||target===dragging)return;
    const rect=target.getBoundingClientRect(),after=event.clientY>rect.top+rect.height/2;list.insertBefore(dragging,after?target.nextSibling:target);
  });
  list.addEventListener('drop',event=>{if(!dragging)return;event.preventDefault();});
  list.addEventListener('dragend',()=>{if(dragging)dragging.classList.remove('is-dragging');dragging=null;sync(true);});
  sync();
});
document.querySelectorAll('[data-share-board]').forEach(button=>button.addEventListener('click',async()=>{
  const shareUrl=new URL(button.dataset.shareUrl||location.pathname,location.origin).href;
  try{await copyText(shareUrl);setActionStatus(button,'Link collection berhasil disalin.');}
  catch{setActionStatus(button,'Salin link dari address bar browser.',true);}
}));
const mountSectionNav=(links,markerRatio,activeClass)=>{
  const pairs=links.map(link=>({link,target:document.getElementById(decodeURIComponent(link.hash.slice(1)))})).filter(pair=>pair.target);
  if(!pairs.length)return;
  let frame=0;
  const paint=()=>{
    frame=0;const marker=Math.max(72,window.innerHeight*markerRatio);let current=pairs[0];
    for(const pair of pairs){if(pair.target.getBoundingClientRect().top<=marker)current=pair;else break;}
    pairs.forEach(pair=>{const active=pair===current;pair.link.classList.toggle(activeClass,active);if(active)pair.link.setAttribute('aria-current','location');else pair.link.removeAttribute('aria-current');});
  };
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(paint);};
  window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule,{passive:true});paint();
};
const sectionLinks=[...document.querySelectorAll('[data-pv-section-link]')];
mountSectionNav(sectionLinks,.28,'is-active');
const caseStudy=document.querySelector('.case-study'),caseChapterNav=document.querySelector('.pv-case-chapters'),caseCover=document.querySelector('.case-cover');if(caseStudy&&caseChapterNav){let chapterFrame=0;const paintChapterProgress=()=>{chapterFrame=0;const total=Math.max(1,caseStudy.offsetHeight-window.innerHeight),passed=Math.max(0,Math.min(total,window.scrollY-caseStudy.offsetTop));caseChapterNav.style.setProperty('--pv-chapter-progress',(passed/total*100).toFixed(2)+'%');};const scheduleChapterProgress=()=>{if(!chapterFrame)chapterFrame=requestAnimationFrame(paintChapterProgress);};window.addEventListener('scroll',scheduleChapterProgress,{passive:true});window.addEventListener('resize',scheduleChapterProgress,{passive:true});paintChapterProgress();}if(caseCover&&!motionReduced){let coverFrame=0;const paintCaseCover=()=>{coverFrame=0;const rect=caseCover.getBoundingClientRect();if(rect.bottom<0||rect.top>window.innerHeight)return;const progress=(window.innerHeight-rect.top)/(window.innerHeight+rect.height),offset=(progress-.5)*22;caseCover.style.setProperty('--pv-case-parallax',offset.toFixed(1)+'px');};const scheduleCaseCover=()=>{if(!coverFrame)coverFrame=requestAnimationFrame(paintCaseCover);};window.addEventListener('scroll',scheduleCaseCover,{passive:true});window.addEventListener('resize',scheduleCaseCover,{passive:true});paintCaseCover();}
const studioLinks=[...document.querySelectorAll('.studio-nav a[href^="#"]')];
mountSectionNav(studioLinks,.25,'active');
const studioNav=document.querySelector('.studio-nav');
studioNav?.addEventListener('click',event=>{
 const link=event.target.closest('a[data-studio-nav-link]');
 if(!link)return;
 const target=document.getElementById(decodeURIComponent(link.hash.slice(1)));
 if(!target){event.preventDefault();return;}
 event.preventDefault();
 history.replaceState(null,'',link.hash);
 const stickyHeader=document.querySelector('.site-nav');
 const headerOffset=stickyHeader?Math.max(0,stickyHeader.getBoundingClientRect().height):0;
 const targetTop=target.getBoundingClientRect().top+window.scrollY-headerOffset-20;
 window.scrollTo({top:Math.max(0,targetTop),behavior:motionReduced?'auto':'smooth'});
 studioNav.querySelectorAll('a[data-studio-nav-link]').forEach(item=>{
  item.classList.toggle('active',item===link);
  if(item===link)item.setAttribute('aria-current','location');
  else item.removeAttribute('aria-current');
 });
});
const projectFilterPanel=document.querySelector('.pv-projects-panel');
if(projectFilterPanel){
 const projectSearch=projectFilterPanel.querySelector('#pv-project-search');
 const projectStatus=projectFilterPanel.querySelector('#pv-project-status-filter');
 const projectCards=[...projectFilterPanel.querySelectorAll('[data-pv-project-card]')];
 const projectCount=projectFilterPanel.querySelector('#pv-project-filter-count');
 const projectEmpty=projectFilterPanel.querySelector('#pv-project-filter-empty');
 const syncProjectFilters=()=>{
  const query=(projectSearch?.value||'').trim().toLocaleLowerCase('id-ID');
  const status=projectStatus?.value||'all';
  let visible=0;
  projectCards.forEach(card=>{
   const matchesText=!query||(card.dataset.pvProjectSearch||'').includes(query);
   const matchesStatus=status==='all'||card.dataset.pvProjectGroup===status;
   const show=matchesText&&matchesStatus;
   card.hidden=!show;
   if(show)visible++;
  });
  if(projectCount)projectCount.textContent=\`Menampilkan \${visible} dari \${projectCards.length} ruang proyek.\`;
  if(projectEmpty)projectEmpty.hidden=visible!==0;
 };
 projectSearch?.addEventListener('input',syncProjectFilters);
 projectStatus?.addEventListener('change',syncProjectFilters);
 syncProjectFilters();
}
update();shortlistUpdate();})();`);
        if (parts[0] === 'studio-avatar.js') return res.end(`(()=>{
const form=document.querySelector('form[action="/studio/profile"]');
const input=document.getElementById('studio-avatar-file');
const preview=document.getElementById('studio-avatar-preview');
const fallback=document.getElementById('studio-avatar-fallback');
const status=document.getElementById('studio-avatar-status');
if(!form||!input||!preview)return;
let previewRequest=0;
let busy=false;
const say=message=>{if(status)status.textContent=message;};
const toDataUrl=blob=>new Promise((resolve,reject)=>{
 const reader=new FileReader();
 reader.onload=()=>resolve(String(reader.result||''));
 reader.onerror=()=>reject(new Error('Browser tidak dapat membaca file foto.'));
 reader.readAsDataURL(blob);
});
const showPreview=dataUrl=>{
 preview.src=dataUrl;
 preview.hidden=false;
 if(fallback)fallback.hidden=true;
};
const serverPreview=async(file,requestId)=>{
 const csrf=form.querySelector('input[name="csrf"]')?.value||'';
 const body=new FormData();
 body.append('csrf',csrf);
 body.append('avatarFile',file,file.name||'avatar.png');
 const response=await fetch('/studio/avatar-preview',{method:'POST',body,credentials:'same-origin',cache:'no-store'});
 if(!response.ok)throw new Error((await response.text()).slice(0,220)||'Server belum dapat membuat pratinjau foto.');
 const dataUrl=await toDataUrl(await response.blob());
 if(requestId!==previewRequest)return;
 showPreview(dataUrl);
};
const previewOnServer=async(file,requestId)=>{
 if(requestId!==previewRequest)return;
 say('Browser tidak dapat membaca pratinjau lokal. Membuat pratinjau melalui server…');
 try{
  await serverPreview(file,requestId);
  if(requestId===previewRequest)say('Pratinjau siap. Tekan Simpan profil untuk menyimpan foto dan data profil.');
 }catch(error){
  if(requestId!==previewRequest)return;
  preview.hidden=true;
  if(fallback){fallback.hidden=false;fallback.textContent='IMG';}
  say(error.message||'Pratinjau tidak tersedia. Periksa file foto dan coba lagi.');
 }
};
input.addEventListener('change',async()=>{
 const file=input.files?.[0]||null;
 const requestId=++previewRequest;
 if(!file){preview.hidden=true;if(fallback)fallback.hidden=false;say('JPG, PNG, atau WebP · maksimal 5 MB.');return;}
 if(file.size>5*1024*1024){input.value='';preview.hidden=true;if(fallback)fallback.hidden=false;say('Foto profil maksimal 5 MB. Pilih file yang lebih kecil.');return;}
 say('Memuat pratinjau foto…');
 try{
  const dataUrl=await toDataUrl(file);
  if(requestId!==previewRequest)return;
  const probe=new Image();
  probe.onload=()=>{if(requestId!==previewRequest)return;showPreview(dataUrl);say('Pratinjau siap. Tekan Simpan profil untuk menyimpan foto dan data profil.');};
  probe.onerror=()=>previewOnServer(file,requestId);
  probe.src=dataUrl;
 }catch{await previewOnServer(file,requestId);}
});
form.addEventListener('submit',async event=>{
 if(busy){event.preventDefault();return;}
 if(!window.fetch||!window.FormData){return;}
 event.preventDefault();
 busy=true;
 const submit=form.querySelector('button[type="submit"]');
 const original=submit?.textContent||'Simpan profil';
 if(submit){submit.disabled=true;submit.textContent='Menyimpan profil…';}
 say('Mengirim perubahan profil ke server…');
 const controller=typeof AbortController==='function'?new AbortController():null;
 const timeout=controller?setTimeout(()=>controller.abort(),90000):null;
 try{
  const response=await fetch(form.action,{method:'POST',body:new FormData(form),credentials:'same-origin',cache:'no-store',redirect:'follow',...(controller?{signal:controller.signal}:{}),headers:{'X-Requested-With':'XMLHttpRequest'}});
  const text=await response.text();
  if(!response.ok){
   let message='Profil belum berhasil disimpan. Periksa data dan coba lagi.';
   try{const doc=new DOMParser().parseFromString(text,'text/html');message=doc.querySelector('h1')?.textContent?.trim()||doc.querySelector('main')?.textContent?.trim().slice(0,220)||message;}catch{}
   throw new Error(message);
  }
  const next=new URL(response.url||'/studio?profileSaved=1',location.href);
  if(next.pathname==='/studio'&&next.searchParams.get('profileSaved')==='1')next.hash='edit-profile';
  window.location.assign(next.toString());
 }catch(error){
  busy=false;
  if(submit){submit.disabled=false;submit.textContent=original;}
  say(error.name==='AbortError'?'Server terlalu lama merespons. Perubahan belum dapat dipastikan; periksa koneksi lalu coba lagi.':(error.message||'Gagal menyimpan profil. Coba lagi.'));
 }finally{if(timeout)clearTimeout(timeout);}
});
window.addEventListener('pageshow',()=>{busy=false;const submit=form.querySelector('button[type="submit"]');if(submit){submit.disabled=false;if(submit.textContent==='Menyimpan profil…')submit.textContent='Simpan profil';}});
})();`);
        if (parts[0] === 'dashboard-home-media.js') return res.end(`(()=>{
const form=document.getElementById('studio-editor');
if(!form)return;
const urls=new Map();
const drawCurrent=card=>{
 const preview=card.querySelector('[data-home-media-preview]');
 if(!preview)return;
 const url=preview.dataset.currentUrl||'';
 const type=preview.dataset.currentType||'image';
 preview.replaceChildren();
 if(!url){const empty=document.createElement('div');empty.className='home-media-empty';empty.textContent='Belum ada media khusus Beranda.';preview.append(empty);return;}
 if(type==='video'){const video=document.createElement('video');video.src=url;video.controls=true;video.muted=true;video.playsInline=true;video.preload='metadata';preview.append(video);}
 else{const image=document.createElement('img');image.src=url;image.alt='Media banner saat ini';preview.append(image);}
};
form.querySelectorAll('[data-home-media-card]').forEach(card=>{
 const input=card.querySelector('[data-home-media-input]');
 const remove=card.querySelector('input[name$="RemoveMedia"]');
 const preview=card.querySelector('[data-home-media-preview]');
 if(!input||!preview)return;
 input.addEventListener('change',()=>{
  const file=input.files?.[0]||null;
  if(!file){drawCurrent(card);return;}
  if(file.size>50*1024*1024){input.value='';drawCurrent(card);const note=card.querySelector('.home-media-help');if(note)note.textContent='File terlalu besar. Batas maksimal 50 MB per file.';return;}
  const previous=urls.get(preview);if(previous)URL.revokeObjectURL(previous);
  const url=URL.createObjectURL(file);urls.set(preview,url);preview.replaceChildren();
  if(file.type.startsWith('video/')){const video=document.createElement('video');video.src=url;video.controls=true;video.muted=true;video.playsInline=true;video.preload='metadata';preview.append(video);}
  else if(file.type.startsWith('image/')){const image=document.createElement('img');image.src=url;image.alt='Pratinjau media Beranda';preview.append(image);}
  else{const empty=document.createElement('div');empty.className='home-media-empty';empty.textContent='Format file belum dikenali browser; server akan memvalidasi file.';preview.append(empty);}
  if(remove)remove.checked=false;
 });
 remove?.addEventListener('change',()=>{if(remove.checked){input.value='';const previous=urls.get(preview);if(previous){URL.revokeObjectURL(previous);urls.delete(preview);}preview.replaceChildren();const empty=document.createElement('div');empty.className='home-media-empty';empty.textContent='Media akan dihapus setelah perubahan disimpan.';preview.append(empty);}else drawCurrent(card);});
});
const faqList=form.querySelector('[data-faq-list]');
const faqAdd=form.querySelector('[data-faq-add]');
const faqCount=form.querySelector('[data-faq-count]');
const faqMax=20;
const faqCards=()=>faqList?[...faqList.querySelectorAll('[data-faq-card]')]:[];
const syncFaq=()=>{
 const cards=faqCards();
 cards.forEach((card,index)=>{
  const question=card.querySelector('[data-faq-question]');
  const answer=card.querySelector('[data-faq-answer]');
  const kicker=card.querySelector('[data-faq-kicker]');
  const remove=card.querySelector('[data-faq-remove]');
  if(question)question.name='faq'+index+'Question';
  if(answer)answer.name='faq'+index+'Answer';
  if(kicker)kicker.textContent='FAQ / '+String(index+1).padStart(2,'0');
  if(remove)remove.setAttribute('aria-label','Hapus FAQ '+(index+1));
 });
 if(faqCount)faqCount.value=String(cards.length);
 if(faqAdd){faqAdd.disabled=cards.length>=faqMax;faqAdd.textContent=cards.length>=faqMax?'Batas 20 FAQ tercapai':'＋ Tambah FAQ';}
};
const makeFaqCard=()=>{
 const card=document.createElement('article');card.className='studio-faq-control';card.dataset.faqCard='';
 const head=document.createElement('div');head.className='studio-faq-control-head';
 const kicker=document.createElement('div');kicker.className='studio-card-kicker';kicker.dataset.faqKicker='';
 const remove=document.createElement('button');remove.className='studio-faq-remove';remove.type='button';remove.dataset.faqRemove='';remove.textContent='Hapus';
 head.append(kicker,remove);
 const questionLabel=document.createElement('label');questionLabel.textContent='Pertanyaan';
 const question=document.createElement('input');question.type='text';question.maxLength=140;question.placeholder='Tulis pertanyaan';question.dataset.faqQuestion='';
 questionLabel.append(question);
 const answerLabel=document.createElement('label');answerLabel.textContent='Jawaban';
 const answer=document.createElement('textarea');answer.maxLength=400;answer.placeholder='Tulis jawaban';answer.dataset.faqAnswer='';
 answerLabel.append(answer);
 card.append(head,questionLabel,answerLabel);return card;
};
faqAdd?.addEventListener('click',()=>{if(!faqList||faqCards().length>=faqMax)return;const card=makeFaqCard();faqList.append(card);syncFaq();card.querySelector('[data-faq-question]')?.focus();});
faqList?.addEventListener('click',event=>{const remove=event.target.closest('[data-faq-remove]');if(!remove)return;remove.closest('[data-faq-card]')?.remove();syncFaq();});
syncFaq();
form.addEventListener('submit',()=>{syncFaq();const button=form.querySelector('.studio-savebar button');if(button){button.disabled=true;button.textContent='Mengunggah media & menyimpan…';}});
window.addEventListener('pagehide',()=>urls.forEach(url=>URL.revokeObjectURL(url)));
})();`);
        if (parts[0] === 'pwa-register.js') return res.end(`if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));}`);
        return res.end(`(()=>{
const input=document.getElementById('work-images');
const zone=document.getElementById('dropzone');
const preview=document.getElementById('image-preview');
const status=document.querySelector('[data-pv-upload-status]');
const form=document.querySelector('[data-pv-upload-form]');
if(!input||!zone||!preview)return;
let objectUrls=[];
let readyToSubmit=false;
let converting=false;
const maxSize=15*1024*1024;
const maxFiles=5;
const extOf=file=>(String(file.name||'').split('.').pop()||'').toLowerCase();
const isSvg=file=>extOf(file)==='svg'||String(file.type||'').toLowerCase()==='image/svg+xml';
const isAllowed=file=>['image/jpeg','image/jpg','image/png','image/webp','image/svg+xml','application/svg+xml'].includes(String(file.type||'').toLowerCase())||['jpg','jpeg','png','webp','svg'].includes(extOf(file));
const say=(message,error=false)=>{
 if(!status)return;
 status.textContent=message;
 status.classList.toggle('is-error',error);
};
const safeSvgBlob=async file=>{
 const raw=await file.text();
 if(raw.length>maxSize)throw new Error('SVG melebihi batas 15 MB.');
 if(/<!DOCTYPE|<!ENTITY|<\\?xml-stylesheet/i.test(raw))throw new Error('SVG memakai DTD atau stylesheet eksternal.');
 const parsed=new DOMParser().parseFromString(raw,'image/svg+xml');
 if(parsed.querySelector('parsererror')||!parsed.documentElement||parsed.documentElement.localName.toLowerCase()!=='svg')throw new Error('Struktur SVG tidak valid.');
 const root=parsed.documentElement;
 root.querySelectorAll('script,foreignObject,iframe,object,embed,audio,video,link').forEach(node=>node.remove());
 [...root.querySelectorAll('*'),root].forEach(element=>{
  [...element.attributes].forEach(attribute=>{
   const name=attribute.name.toLowerCase(),value=String(attribute.value||'').trim();
   if(name.startsWith('on')||/\\b(?:javascript|vbscript|file):/i.test(value)){element.removeAttribute(attribute.name);return;}
   if(['href','xlink:href','src'].includes(name)&&value&&!value.startsWith('#')&&!/^data:image\\/(?:png|jpe?g|webp);base64,/i.test(value)){element.removeAttribute(attribute.name);return;}
   if(name==='style'&&(/@import|expression\\s*\\(/i.test(value)||[...value.matchAll(/url\\(([^)]*)\\)/gi)].some(match=>!String(match[1]||'').trim().replace(/^['"]|['"]$/g,'').startsWith('#')))){element.removeAttribute(attribute.name);}
  });
 });
 root.querySelectorAll('style').forEach(style=>{
  let css=style.textContent||'';
  css=css.replace(/@import[^;]*;?/gi,'').replace(/@font-face\\s*\\{[^}]*\\}/gi,'');
  if(/url\\((?!\\s*['"]?#)[^)]+\\)/i.test(css)||/expression\\s*\\(/i.test(css))style.remove();
  else style.textContent=css;
 });
 if(!root.getAttribute('xmlns'))root.setAttribute('xmlns','http://www.w3.org/2000/svg');
 return new Blob([new XMLSerializer().serializeToString(root)],{type:'image/svg+xml'});
};
const blobFor=file=>isSvg(file)?new Blob([file],{type:'image/svg+xml'}):new Blob([file],{type:(()=>{const ext=extOf(file);return ext==='png'?'image/png':ext==='webp'?'image/webp':'image/jpeg';})()});
const loadImage=blob=>new Promise((resolve,reject)=>{
 const url=URL.createObjectURL(blob);
 const image=new Image();
 image.onload=()=>resolve({image,url});
 image.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Browser gagal membaca gambar.'));};
 image.src=url;
});
const previewImage=async file=>{
 const candidates=[blobFor(file)];
 if(isSvg(file)){
  try{candidates.push(await safeSvgBlob(file));}catch{}
 }
 let lastError;
 for(const blob of candidates){
  try{return await loadImage(blob);}
  catch(error){lastError=error;}
 }
 throw lastError||new Error('Pratinjau tidak tersedia.');
};
const setFiles=files=>{
 const accepted=[],rejected=[];
 [...files].forEach(file=>{
  if(!isAllowed(file)){rejected.push(file.name+' (format)');return;}
  if(file.size>maxSize){rejected.push(file.name+' (lebih dari 15 MB)');return;}
  if(accepted.length>=maxFiles){rejected.push(file.name+' (maksimal 5 file)');return;}
  accepted.push(file);
 });
 try{
  const transfer=new DataTransfer();
  accepted.forEach(file=>transfer.items.add(file));
  input.files=transfer.files;
 }catch{
  say('Browser tidak mendukung pengelolaan file otomatis. Pilih file melalui tombol Choose Files.',true);
  return;
 }
 render(rejected);
};
const render=async rejected=>{
 objectUrls.forEach(url=>URL.revokeObjectURL(url));
 objectUrls=[];
 preview.replaceChildren();
 const files=[...input.files];
 for(let index=0;index<files.length;index++){
  const file=files[index];
  const card=document.createElement('article');
  card.className='pv-upload-preview-card';
  const caption=document.createElement('small');
  caption.textContent=file.name+' · '+(file.size/1024/1024).toFixed(2)+' MB';
  const remove=document.createElement('button');
  remove.type='button';remove.className='pv-upload-remove';remove.textContent='×';
  remove.setAttribute('aria-label','Hapus '+file.name);
  remove.addEventListener('click',()=>setFiles([...input.files].filter((_,i)=>i!==index)));
  try{
   const {url}=await previewImage(file);
   objectUrls.push(url);
   const img=document.createElement('img');
   img.alt='Preview '+file.name;img.src=url;
   card.append(img,caption,remove);
  }catch{
   const fallback=document.createElement('div');
   fallback.className='pv-upload-preview-fallback';
   fallback.textContent=isSvg(file)?'Preview SVG belum didukung browser ini. File tetap bisa dikirim untuk diproses server.':'Preview tidak tersedia. File tetap akan diperiksa saat upload.';
   card.append(fallback,caption,remove);
   say('Preview salah satu file tidak tersedia. Kamu tetap bisa mencoba upload; file akan diperiksa server.',true);
  }
  preview.append(card);
 }
 if(rejected?.length)say('File dilewati: '+rejected.join(', '),true);
 else if(files.length)say(files.length+' dari '+maxFiles+' file dipilih · '+(files.reduce((sum,file)=>sum+file.size,0)/1024/1024).toFixed(2)+' MB total.');
 else say('Pilih JPG, PNG, WebP, atau SVG. Maksimal 15 MB per file.');
};
const rasterizeSvg=async file=>{
 const candidates=[blobFor(file)];
 try{candidates.push(await safeSvgBlob(file));}catch{}
 let image=null,url='';
 for(const blob of candidates){
  try{const loaded=await loadImage(blob);image=loaded.image;url=loaded.url;break;}catch{}
 }
 if(!image)throw new Error('Browser tidak dapat mengubah SVG ini menjadi gambar. SVG asli akan dikirim ke server untuk diproses.');
 try{
  const width=Math.max(1,Number(image.naturalWidth)||1800);
  const height=Math.max(1,Number(image.naturalHeight)||1800);
  const scale=Math.min(1,1800/width,1800/height,Math.sqrt(20000000/(width*height)));
  const canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.round(width*scale));
  canvas.height=Math.max(1,Math.round(height*scale));
  const context=canvas.getContext('2d',{alpha:true});
  if(!context)throw new Error('Browser tidak dapat menyiapkan konversi SVG.');
  context.drawImage(image,0,0,canvas.width,canvas.height);
  let output=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',0.86));
  let extension='webp';
  if(!output||output.type!=='image/webp'){output=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));extension='png';}
  if(!output)throw new Error('Browser tidak dapat mengekspor hasil konversi SVG.');
  const base=file.name.replace(/\\.svg$/i,'').replace(/\\.[^.]+$/,'')||'portfolio';
  return new File([output],base+'.'+extension,{type:output.type,lastModified:file.lastModified});
 }finally{if(url)URL.revokeObjectURL(url);}
};
input.addEventListener('change',()=>setFiles(input.files));
zone.addEventListener('dragover',event=>{event.preventDefault();zone.classList.add('is-dragover');});
zone.addEventListener('dragleave',event=>{if(!zone.contains(event.relatedTarget))zone.classList.remove('is-dragover');});
zone.addEventListener('drop',event=>{event.preventDefault();zone.classList.remove('is-dragover');setFiles(event.dataTransfer.files);});
form?.addEventListener('submit',async event=>{
 if(readyToSubmit)return;
 const files=[...input.files];
 if(!files.length||files.length>maxFiles||files.some(file=>!isAllowed(file)||file.size>maxSize)){
  event.preventDefault();
  say('Periksa file: pilih 1–5 file JPG, PNG, WebP, atau SVG, maksimal 15 MB per file.',true);
  input.focus();return;
 }
 if(!files.some(isSvg))return;
 event.preventDefault();
 if(converting)return;
 converting=true;
 const submit=form.querySelector('button[type="submit"]');
 if(submit){submit.disabled=true;submit.dataset.originalText=submit.textContent;submit.textContent='Menyiapkan file…';}
 say('Menyiapkan file SVG untuk upload…');
 try{
  const converted=[];let keptOriginalSvg=false;
  for(const file of files){
   if(!isSvg(file)){converted.push(file);continue;}
   try{converted.push(await rasterizeSvg(file));}
   catch{converted.push(file);keptOriginalSvg=true;}
  }
  const transfer=new DataTransfer();
  converted.forEach(file=>transfer.items.add(file));
  input.files=transfer.files;
  readyToSubmit=true;
  say(keptOriginalSvg?'Sebagian SVG dikirim dalam format asli agar diproses server. Upload sedang dikirim ke antrean moderasi.':'SVG berhasil dikonversi. Upload sedang dikirim ke antrean moderasi.');
  if(submit)submit.textContent='Mengirim…';
  form.requestSubmit();
 }catch(error){
  say(error.message||'File gagal disiapkan untuk upload.',true);
  converting=false;
  if(submit){submit.disabled=false;submit.textContent=submit.dataset.originalText||'Upload karya untuk moderasi';}
 }
});
window.addEventListener('pagehide',()=>objectUrls.forEach(url=>URL.revokeObjectURL(url)));
})();`);
      }
      if (parts[0] === 'manifest.webmanifest') {
        res.writeHead(200, { 'content-type': 'application/manifest+json; charset=utf-8', 'cache-control': 'public, max-age=3600' });
        return res.end(JSON.stringify({ name: 'PIR Visuals', short_name: 'PIR Visuals', description: 'Direktori dan portfolio desainer kreatif', start_url: '/', scope: '/', display: 'standalone', background_color: '#F0F3EB', theme_color: '#20372A', icons: [{ src: '/icon.svg?v=6710', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }] }));
      }
      if (parts[0] === 'icon.svg') {
        res.writeHead(200, { 'content-type': 'image/svg+xml', 'cache-control': 'public, max-age=86400' });
        return res.end(fs.readFileSync(new URL('./brand-icon.svg', import.meta.url)));
      }
      if (parts[0] === 'sw.js') {
        res.writeHead(200, { 'content-type': 'application/javascript; charset=utf-8', 'cache-control': 'no-cache', 'service-worker-allowed': '/' });
        return res.end(`const CACHE='pir-visuals-public-v48';self.addEventListener('install',e=>{self.skipWaiting()});self.addEventListener('activate',e=>{e.waitUntil((async()=>{const names=await caches.keys();await Promise.all(names.filter(name=>name.startsWith('pir-visuals-public-')&&name!==CACHE).map(name=>caches.delete(name)));await self.clients.claim()})())});self.addEventListener('fetch',e=>{const r=e.request,u=new URL(r.url);if(r.method!=='GET'||u.origin!==location.origin||/^\\/(studio|dashboard|admin|media|profile-avatar|work|designer|p|contact|client)(\\/|$)/.test(u.pathname))return;e.respondWith(fetch(r).then(res=>{if(res.ok&&/public/.test(res.headers.get('cache-control')||'')){const copy=res.clone();caches.open(CACHE).then(c=>c.put(r,copy))}return res}).catch(()=>caches.match(r).then(hit=>hit||new Response('Koneksi offline. Silakan coba lagi.',{status:503,headers:{'content-type':'text/plain; charset=utf-8'}}))))});`);
      }
      if (parts[0] === 'qr' && parts[1]) {
        const profile = await DesignerProfile.findOne({ designerId: parts[1].toUpperCase(), isPublic: true }).lean();
        if (!profile) { res.writeHead(404); return res.end('Not found'); }
        const target = `${publicBase}${profile.slug ? `/p/${encodeURIComponent(profile.slug)}` : `/designer/${encodeURIComponent(profile.designerId)}`}`;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=12&data=${encodeURIComponent(target)}`;
        return sendHtml(res, 200, pageShell(`QR ${profile.displayName}`, `<section class="card" style="text-align:center"><h1>QR Portfolio</h1><p>${escapeHtml(profile.displayName)}</p><img width="320" height="320" alt="QR portfolio" src="${qrUrl}"><p><a href="${escapeHtml(target)}">${escapeHtml(target)}</a></p><p class="muted">QR dibuat oleh layanan QR pihak ketiga.</p></section>`), { 'cache-control': 'no-store' });
      }
      if (parts[0] === 'contact' && parts.length === 1 && req.method === 'GET') {
        const supportEmail = String(process.env.SUPPORT_EMAIL || process.env.SMTP_FROM || '').trim();
        const supportPhone = String(process.env.SUPPORT_WHATSAPP || '').replace(/[^\d]/g, '');
        const supportHours = String(process.env.SUPPORT_HOURS || 'Senin–Jumat, 09.00–17.00 WIB');
        const emailCard = supportEmail ? `<a class="support-channel" href="mailto:${encodeURIComponent(supportEmail)}"><span>EMAIL SUPPORT</span><strong>${escapeHtml(supportEmail)}</strong><small>Kirim pertanyaan melalui email</small></a>` : '';
        const waCard = supportPhone ? `<a class="support-channel" href="https://wa.me/${supportPhone}" target="_blank" rel="noopener"><span>WHATSAPP CUSTOMER SERVICE</span><strong>Chat tim PIR Visuals ↗</strong><small>Respons mengikuti jam layanan</small></a>` : '';
        const ticketCard = `<div class="support-channel support-channel-ticket"><span>SUPPORT TICKET</span><strong>Formulir Customer Support</strong><small>Permintaan bantuan dicatat di sistem PIR Visuals.</small><a href="#support-request">Kirim permintaan ↗</a></div>`;
        const body = `<section class="support-hero"><div class="support-hero-main"><span class="eyebrow">PIR VISUALS · CUSTOMER CARE</span><h1>Let’s make<br><em>things clearer.</em></h1><p>Ada pertanyaan tentang akun, portfolio, kerja sama, atau penggunaan platform? Pilih kanal yang tersedia atau kirim tiket bantuan langsung kepada tim PIR Visuals.</p><div class="support-hours"><span class="support-dot"></span> JAM LAYANAN · ${escapeHtml(supportHours)}</div></div><aside class="support-hero-aside"><span class="support-aside-index">SUPPORT / 01</span><strong>Help for every part of your creative journey.</strong><ul><li><span>01</span><b>Akun & akses</b></li><li><span>02</span><b>Portfolio & upload</b></li><li><span>03</span><b>Kolaborasi & platform</b></li></ul></aside></section><section class="support-layout"><div class="support-info"><span class="eyebrow">GET IN TOUCH</span><h2>Choose your channel.</h2><p>Tim PIR Visuals membantu kendala penggunaan platform dan pertanyaan umum. Untuk pemesanan desain, hubungi desainer secara langsung dari halaman portfolionya.</p><div class="support-channels">${emailCard}${waCard}${ticketCard}</div><div class="support-note"><strong>Butuh bantuan terkait pesanan desain?</strong><p>PIR Visuals bukan perantara transaksi. Hubungi desainer terkait melalui tombol kontak pada portfolio mereka untuk membahas brief, harga, dan timeline secara langsung.</p><a href="/discover">Cari desainer ↗</a></div><nav class="support-quick-links" aria-label="Bantuan cepat"><a href="/how-it-works">Cara kerja ↗</a><a href="/studio">Designer Studio ↗</a><a href="/client">Ruang klien ↗</a></nav></div><section class="support-form-card" id="support-request"><span class="eyebrow">SEND A REQUEST</span><h2>Kirim pesan ke tim kami.</h2><p class="muted">Isi formulir berikut. Pesan akan masuk ke antrean Customer Support PIR Visuals.</p><form method="post" action="/contact" class="support-form"><label>Nama lengkap<input name="name" maxlength="80" required autocomplete="name" placeholder="Nama kamu"></label><label>Email aktif<input name="email" type="email" maxlength="254" required autocomplete="email" placeholder="nama@email.com"></label><label>Topik bantuan<select name="topic"><option value="account">Akun & login</option><option value="portfolio">Portfolio & upload</option><option value="technical">Kendala teknis</option><option value="designer">Akun desainer</option><option value="partnership">Kerja sama</option><option value="general">Pertanyaan umum</option></select></label><label>Subjek<input name="subject" maxlength="120" required placeholder="Ringkasan kebutuhan bantuan"></label><label>Pesan<textarea name="message" minlength="15" maxlength="3000" rows="6" required placeholder="Ceritakan kendala atau pertanyaanmu secara detail..."></textarea></label><label class="support-honeypot" aria-hidden="true">Jangan isi kolom ini<input name="website" tabindex="-1" autocomplete="off"></label><button class="btn" type="submit">Kirim permintaan bantuan ↗</button><small class="muted">Jangan sertakan password, kode OTP, atau informasi pembayaran sensitif.</small></form></section></section>`;
        return sendHtml(res,200,pageShell('Contact & Customer Support — PIR Visuals',body),{'cache-control':'no-store'});
      }
      if (parts[0] === 'contact' && parts.length === 1 && req.method === 'POST') {
        if (!allowCount(req,'support-ticket',60*1000)) { res.writeHead(429); return res.end('Terlalu banyak permintaan. Coba lagi sebentar.'); }
        const form=await readForm(req,16*1024);
        const clean=(key,max)=>String(form.get(key)||'').replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0,max);
        if (clean('website',200)) { res.writeHead(303,{location:'/contact?sent=1'}); return res.end(); }
        const name=clean('name',80),email=clean('email',254),topic=clean('topic',40),subject=clean('subject',120),message=clean('message',3000);
        if(name.length<2||! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||subject.length<3||message.length<15){res.writeHead(400);return res.end(pageShell('Pesan belum lengkap','<section class="card"><h1>Periksa kembali formulir.</h1><p>Nama, email valid, subjek dan pesan minimal 15 karakter diperlukan.</p><a href="/contact">Kembali ke Customer Support</a></section>'));}
        const ticketId=`SUP-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
        await SupportTicket.create({ticketId,name,email,topic,subject,message});
        const supportEmail=String(process.env.SUPPORT_EMAIL||'').trim();
        if(supportEmail&&process.env.SMTP_HOST&&process.env.SMTP_USER&&process.env.SMTP_PASSWORD){
          try{const transport=nodemailer.createTransport({host:process.env.SMTP_HOST,port:Number(process.env.SMTP_PORT||587),secure:String(process.env.SMTP_SECURE||'false')==='true',auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASSWORD}});await transport.sendMail({from:process.env.SMTP_FROM||process.env.SMTP_USER,to:supportEmail,replyTo:email,subject:`[PIR Support ${ticketId}] ${subject}`,text:`Ticket: ${ticketId}\nNama: ${name}\nEmail: ${email}\nTopik: ${topic}\n\n${message}`});}catch(err){console.error('[support-email]',err.message);}
        }
        return sendHtml(res,201,pageShell('Permintaan Bantuan Terkirim',`<section class="support-success"><span class="eyebrow">REQUEST RECEIVED</span><h1>Terima kasih, ${escapeHtml(name)}.</h1><p>Permintaan bantuanmu sudah tercatat di Customer Support PIR Visuals.</p><div class="support-ticket-id" data-support-ticket-id>${ticketId}</div><div class="support-ticket-actions"><button type="button" class="btn btn-secondary" data-copy-support-ticket="${ticketId}">Salin nomor tiket</button><span class="support-copy-status" data-support-copy-status role="status" aria-live="polite"></span></div><p class="muted">Simpan nomor tiket ini untuk referensi saat menghubungi tim kami.</p><a class="btn" href="/">Kembali ke beranda</a></section>`),{'cache-control':'no-store'});
      }
      if (parts[0] === 'out' && parts[1] && req.method === 'GET') {
        const designerId = String(parts[1]).toUpperCase();
        const profile = await DesignerProfile.findOne({ designerId, isPublic: true }).select('designerId displayName publicWhatsApp contactPhone').lean();
        const phone = getPublicContactPhone(profile);
        if (!profile || !phone) {
          res.writeHead(404, { 'cache-control': 'no-store' });
          return res.end('Kontak desainer tidak tersedia.');
        }
        if (allowCount(req, `direct-contact:${designerId}`, 60 * 1000)) {
          await DesignerAnalytics.updateOne(
            { designerId },
            { $inc: { contactClicks: 1 }, $set: { lastViewedAt: new Date() }, $setOnInsert: { designerId } },
            { upsert: true },
          );
          await incrementDailyMetric(designerId, 'contacts');
        }
        const text = encodeURIComponent(`Halo ${profile.displayName || 'Designer'}, saya menemukan portfolio kamu di PIR Visuals. Saya ingin berdiskusi langsung mengenai kebutuhan desain.`);
        res.writeHead(302, {
          location: `https://wa.me/${phone}?text=${text}`,
          'cache-control': 'no-store',
          'referrer-policy': 'no-referrer',
        });
        return res.end();
      }
      if (parts[0] === 'contact' && parts[1] && req.method === 'GET') {
        const profile = await DesignerProfile.findOne({ designerId: parts[1].toUpperCase(), isPublic: true, acceptsOrders: true }).select('displayName designerId').lean();
        if (profile && allowCount(req, `contact:${profile.designerId}`, 60 * 1000)) { await DesignerAnalytics.updateOne({ designerId: profile.designerId }, { $inc: { contactClicks: 1 }, $set: { lastViewedAt: new Date() }, $setOnInsert: { designerId: profile.designerId } }, { upsert: true }); await incrementDailyMetric(profile.designerId, 'contacts'); }
        if (!profile) { res.writeHead(404); return res.end(pageShell('Desainer tidak tersedia','<h1>Desainer tidak ditemukan atau sedang tidak menerima proyek.</h1>')); }
        const body = `<section class="hero"><span class="eyebrow">Start a collaboration</span><h1>Hubungi ${escapeHtml(profile.displayName)}</h1><p class="muted">Ini jalur opsional untuk menyimpan brief dan membuka ruang kolaborasi privat. Jika ingin cara paling sederhana, kamu tetap bisa menghubungi desainer langsung melalui WhatsApp dari halaman portofolionya.</p></section><section class="card"><div class="pv-hybrid-workspace-note"><strong>Tanpa transaksi melalui PIR Visuals</strong><p>Workspace hanya membantu pencatatan brief, progres, dan feedback. Tidak ada checkout, pembayaran, komisi, escrow, atau mediasi transaksi oleh PIR Visuals.</p></div><form method="post" action="/contact/${encodeURIComponent(profile.designerId)}"><label>Nama kamu<input name="clientName" maxlength="80" required style="display:block;width:100%;margin:6px 0 14px"></label><label>Email aktif untuk akses ruang proyek<input name="email" type="email" autocomplete="email" maxlength="254" required style="display:block;width:100%;margin:6px 0 8px"></label><small class="muted">Kami mengirim link akses privat satu kali ke email ini. Email tidak ditampilkan di portfolio publik.</small><label>WhatsApp (opsional)<input name="whatsapp" type="tel" inputmode="tel" autocomplete="tel" maxlength="24" pattern="\\+?[1-9][0-9\\s()\\-]{7,18}" title="Gunakan kode negara, contoh +6281234567890" placeholder="+6281234567890" style="display:block;width:100%;margin:6px 0 4px"></label><small class="muted">Gunakan kode negara jika ingin menyertakan nomor WhatsApp, misalnya +6281234567890.</small><label>Brief proyek<textarea name="brief" minlength="15" maxlength="2000" required style="display:block;width:100%;margin:6px 0 14px" rows="6" placeholder="Ceritakan kebutuhan, referensi, anggaran dan tenggat waktu..."></textarea></label><label class="support-honeypot" aria-hidden="true">Jangan isi kolom ini<input name="website" tabindex="-1" autocomplete="off"></label><button class="btn" type="submit">Kirim brief ke desainer</button></form><p class="muted">Workspace hanya membantu pencatatan brief dan komunikasi. Negosiasi, kontrak, dan pembayaran dilakukan langsung oleh klien dan desainer di luar PIR Visuals.</p></section>`;
        return sendHtml(res,200,pageShell('Hubungi Desainer — PIR Visuals',body),{'cache-control':'no-store'});
      }
      if (parts[0] === 'contact' && parts[1] && req.method === 'POST') {
        const designerId = parts[1].toUpperCase();
        const leadIpBudget = securityRateLimiter.consume(req, { scope: 'designer-lead-ip', limit: 8, windowMs: 60 * 60 * 1000 });
        const leadDesignerBudget = securityRateLimiter.consume(req, { scope: 'designer-lead-designer', identity: designerId, limit: 12, windowMs: 60 * 60 * 1000 });
        if (!leadIpBudget.allowed || !leadDesignerBudget.allowed) {
          const retryAfter = blockedRetryAfter(leadIpBudget, leadDesignerBudget);
          res.writeHead(429, { 'cache-control': 'no-store', 'retry-after': String(retryAfter) });
          return res.end('Terlalu banyak pengiriman brief. Coba lagi setelah beberapa saat.');
        }
        if (!isSameOriginRequest(req.headers)) {
          res.writeHead(403, { 'cache-control': 'no-store' });
          return res.end('Permintaan tidak valid. Muat ulang halaman lalu coba kembali.');
        }
        const form = await readForm(req, 12 * 1024);
        const clean = (key,max) => String(form.get(key)||'').replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0,max);
        // Honeypot submissions receive a neutral confirmation but never create a lead.
        if (clean('website',200)) {
          return sendHtml(res, 200, pageShell('Brief terkirim', '<section class="pv-client-confirmation"><h1>Terima kasih.</h1><p>Permintaan kamu sudah diterima.</p><a class="btn" href="/discover">Kembali ke direktori ↗</a></section>'), { 'cache-control':'no-store' });
        }
        const profile = await DesignerProfile.findOne({ designerId, isPublic: true, acceptsOrders: true }).lean();
        if (!profile) { res.writeHead(404); return res.end('Designer unavailable'); }
        const clientName = clean('clientName',80);
        const email = clean('email',254).toLowerCase();
        const rawWhatsapp = clean('whatsapp',32);
        const brief = clean('brief',2000);
        const phone = normalizeOptionalWhatsApp(rawWhatsapp);
        if (clientName.length < 2 || brief.length < 15 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !phone.valid) {
          res.writeHead(400, { 'cache-control': 'no-store' });
          return res.end('Brief belum lengkap, email tidak valid, atau format WhatsApp perlu diperiksa.');
        }
        const leadEmailBudget = securityRateLimiter.consume(req, { scope: 'designer-lead-email', identity: email, limit: 3, windowMs: 60 * 60 * 1000 });
        if (!leadEmailBudget.allowed) {
          res.writeHead(429, { 'cache-control': 'no-store', 'retry-after': String(leadEmailBudget.retryAfterSeconds) });
          return res.end('Terlalu banyak pengiriman brief dari email ini. Coba lagi setelah beberapa saat.');
        }
        const whatsapp = phone.value;
        const leadId = `LD-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
        const projectId = `PRJ-${crypto.randomBytes(7).toString('hex').toUpperCase()}`;
        const projectTitle = (brief.split(/[.!?\n]/)[0] || 'Proyek kreatif').trim().slice(0,110) || 'Proyek kreatif';
        let project;
        try {
          await DesignerLead.create({ leadId, designerId, clientName, email, whatsapp, brief });
          project = await ClientProject.create({
            projectId, leadId, designerId, clientName, email, whatsapp, title:projectTitle, brief,
            status:'brief_received', lastActivityAt:new Date(),
          });
          await ClientProjectUpdate.create({
            updateId:`UP-${crypto.randomBytes(8).toString('hex').toUpperCase()}`, projectId, authorRole:'system',
            authorName:'PIR Visuals', message:'Brief diterima. Ruang proyek privat telah dibuat untuk kolaborasi klien dan desainer.',
            status:'brief_received',
          });
        } catch (error) {
          // Compensate partial writes so a failed project-room setup does not leave an orphan lead.
          await Promise.allSettled([
            ClientProjectUpdate.deleteMany({ projectId }),
            ClientProject.deleteOne({ projectId }),
            DesignerLead.deleteOne({ leadId }),
          ]);
          throw error;
        }
        let portalInviteSent = false;
        if (email) {
          const accessToken = crypto.randomBytes(32).toString('hex');
          try {
            await ClientProject.updateOne({ projectId }, { $set:{ accessTokenHash:hashToken(accessToken), accessTokenExpiresAt:new Date(Date.now()+30*60*1000), accessTokenUsedAt:null } });
            await sendClientProjectAccessEmail(email, accessToken, project, profile.displayName);
            portalInviteSent = true;
          } catch (error) {
            try { await ClientProject.updateOne({ projectId }, { $set:{ accessTokenHash:'', accessTokenExpiresAt:null } }); } catch {}
            console.error('[CLIENT PROJECT INVITE]', error.message);
          }
        }
        if (portalInviteSent) {
          try { if (portalInviteSent) await markProjectLeadContacted({ leadId, designerId }); }
          catch (error) { console.error('[LEAD STATUS]', error.message); }
        }
        try { await SiteAnalyticsEvent.create({ eventId:`EV-${crypto.randomBytes(10).toString('hex').toUpperCase()}`, eventType:'lead_submit', path:'/lead', designerId }); } catch {}
        try { await DesignerNotification.create({ notificationId:`NTF-${crypto.randomBytes(8).toString('hex')}`, designerId, type:'lead', title:'Calon klien baru · ruang proyek dibuat', message:`${clientName} mengirim brief. Project room ${projectId} sudah dibuat.` }); } catch (error) { console.error('[LEAD NOTIFICATION]', error.message); }
        const portalMessage = portalInviteSent
          ? `<div class="pv-invite-success"><strong>Ruang proyek privat sudah siap.</strong><p>Link akses satu kali telah dikirim ke <b>${escapeHtml(email)}</b>. Link berlaku 30 menit. Setelah masuk, kamu dapat melihat progres dan mengirim feedback langsung ke desainer.</p></div>`
          : `<div class="pv-invite-pending"><strong>Brief berhasil diteruskan.</strong><p>${email ? 'Undangan ruang proyek belum dapat dikirim otomatis. Desainer dapat mengirim ulang undangan dari Designer Studio.' : 'Tambahkan email aktif pada komunikasi dengan desainer agar undangan ruang proyek dapat dikirim.'}</p></div>`;
        return sendHtml(res,200,pageShell('Brief terkirim',`<section class="pv-client-confirmation"><span class="eyebrow">A NEW CREATIVE COLLABORATION</span><h1>Terima kasih, ${escapeHtml(clientName)}.</h1><p>Brief sudah diteruskan langsung ke ${escapeHtml(profile.displayName)}. Ruang proyek dibuat agar progres dan feedback bisa terdokumentasi dengan rapi.</p>${portalMessage}<p>Negosiasi, pemesanan, dan transaksi tetap dilakukan langsung antara klien dan desainer.</p><a class="btn" href="/designer/${encodeURIComponent(designerId)}">Kembali ke portfolio ↗</a></section>`),{'cache-control':'no-store','referrer-policy':'no-referrer'});
      }
      if (parts[0] === 'homepage-media' && parts[1] && ['GET', 'HEAD'].includes(req.method)) {
        const filename = String(parts[1]);
        if (!/^home-[A-Za-z0-9_-]{20,40}\.(?:webp|mp4|webm)$/.test(filename)) { res.writeHead(404); return res.end('Not found'); }
        const botRoot = path.resolve(process.env.BOT_DATA_ROOT || APP_ROOT);
        const uploadRoot = path.resolve(botRoot, process.env.PORTFOLIO_UPLOAD_DIR || 'uploads/portfolio');
        const mediaRoot = path.resolve(uploadRoot, 'homepage');
        const file = path.resolve(mediaRoot, filename);
        if (!file.startsWith(`${mediaRoot}${path.sep}`) || !fs.existsSync(file)) { res.writeHead(404); return res.end('Not found'); }
        const ext = path.extname(file).toLowerCase();
        const type = ({ '.webp':'image/webp', '.mp4':'video/mp4', '.webm':'video/webm' })[ext];
        const stat = await fs.promises.stat(file);
        const baseHeaders = { 'content-type': type, 'accept-ranges': 'bytes', 'cache-control': 'public, max-age=86400, stale-while-revalidate=604800', 'x-content-type-options': 'nosniff' };
        if (req.method === 'HEAD') { res.writeHead(200, { ...baseHeaders, 'content-length': String(stat.size) }); return res.end(); }
        const range = String(req.headers.range || '');
        if (range) {
          const match = range.match(/^bytes=(\d*)-(\d*)$/);
          if (!match) { res.writeHead(416, { 'content-range': `bytes */${stat.size}` }); return res.end(); }
          let start = match[1] ? Number(match[1]) : Math.max(0, stat.size - Number(match[2] || 0));
          let end = match[2] ? Number(match[2]) : stat.size - 1;
          if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || end < start || start >= stat.size) { res.writeHead(416, { 'content-range': `bytes */${stat.size}` }); return res.end(); }
          end = Math.min(end, stat.size - 1);
          res.writeHead(206, { ...baseHeaders, 'content-length': String(end - start + 1), 'content-range': `bytes ${start}-${end}/${stat.size}` });
          return fs.createReadStream(file, { start, end }).pipe(res);
        }
        res.writeHead(200, { ...baseHeaders, 'content-length': String(stat.size) });
        return fs.createReadStream(file).pipe(res);
      }
      if (parts[0] === 'profile-avatar' && parts[1] && ['GET', 'HEAD'].includes(req.method)) {
        const designerId = String(parts[1]).toUpperCase();
        if (!/^DSN-[A-F0-9]{4,16}$/.test(designerId)) { res.writeHead(404); return res.end('Not found'); }
        const profile = await DesignerProfile.findOne({ designerId }).select('avatarPath isPublic').lean();
        if (!profile?.avatarPath) { res.writeHead(404); return res.end('Not found'); }
        if (!profile.isPublic) {
          const session = await getDesignerSession(req);
          if (session?.designerId !== designerId) { res.writeHead(404); return res.end('Not found'); }
        }
        const botRoot = path.resolve(process.env.BOT_DATA_ROOT || APP_ROOT);
        const uploadRoot = path.resolve(botRoot, process.env.PORTFOLIO_UPLOAD_DIR || 'uploads/portfolio');
        const file = path.resolve(botRoot, profile.avatarPath);
        const avatarMime = ({ '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' })[path.extname(file).toLowerCase()];
        if (!file.startsWith(`${uploadRoot}${path.sep}`) || !avatarMime || !fs.existsSync(file)) {
          res.writeHead(404); return res.end('Not found');
        }
        res.writeHead(200, {
          'content-type': avatarMime,
          'cache-control': profile.isPublic ? 'public, max-age=0, must-revalidate' : 'private, no-store',
          'x-content-type-options': 'nosniff',
        });
        if (req.method === 'HEAD') return res.end();
        return fs.createReadStream(file).pipe(res);
      }
      if (parts[0] === 'studio' && parts[1] === 'media' && parts[2] && ['GET', 'HEAD'].includes(req.method)) {
        const session = await getDesignerSession(req);
        if (!session) { res.writeHead(404, { 'cache-control': 'no-store' }); return res.end('Not found'); }
        const item = await PortfolioItem.findOne({ itemId: parts[2].toUpperCase(), designerId: session.designerId }).lean();
        if (!item) { res.writeHead(404, { 'cache-control': 'no-store' }); return res.end('Not found'); }
        const mediaPaths = [...new Set([item.imagePath, ...(Array.isArray(item.galleryPaths) ? item.galleryPaths.filter(mediaPath => mediaPath !== item.imagePath) : [])].filter(Boolean))].slice(0, 5);
        const mediaIndex = Number(parts[3] || 0);
        if (!Number.isInteger(mediaIndex) || mediaIndex < 0 || mediaIndex >= mediaPaths.length) { res.writeHead(404, { 'cache-control': 'no-store' }); return res.end('Not found'); }
        const botRoot = path.resolve(process.env.BOT_DATA_ROOT || APP_ROOT);
        const uploadRoot = path.resolve(botRoot, process.env.PORTFOLIO_UPLOAD_DIR || 'uploads/portfolio');
        const file = path.resolve(botRoot, mediaPaths[mediaIndex]);
        const type = ({ '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png' })[path.extname(file).toLowerCase()];
        if (!file.startsWith(`${uploadRoot}${path.sep}`) || !type || !fs.existsSync(file)) { res.writeHead(404, { 'cache-control': 'no-store' }); return res.end('Not found'); }
        res.writeHead(200, { 'content-type': type, 'cache-control': 'private, no-store', 'x-content-type-options': 'nosniff', 'referrer-policy': 'same-origin' });
        if (req.method === 'HEAD') return res.end();
        return fs.createReadStream(file).pipe(res);
      }
      if (parts[0] === 'media' && parts[1] && parts.length <= 3 && ['GET', 'HEAD'].includes(req.method)) {
        const item = await PortfolioItem.findOne({ itemId: parts[1].toUpperCase(), moderationStatus: 'approved' }).lean();
        const ownerProfile = item && await DesignerProfile.findOne({ designerId: item.designerId, isPublic: true })
          .select('displayName watermarkEnabled').lean();
        if (!ownerProfile) { res.writeHead(404, { 'cache-control': 'no-store' }); return res.end('Not found'); }
        const botRoot = path.resolve(process.env.BOT_DATA_ROOT || APP_ROOT);
        const uploadRoot = path.resolve(botRoot, process.env.PORTFOLIO_UPLOAD_DIR || 'uploads/portfolio');
        const galleryIndex = Number(parts[2] || 0);
        if (!Number.isInteger(galleryIndex) || galleryIndex < 0 || galleryIndex > 4) {
          res.writeHead(404, { 'cache-control': 'no-store' });
          return res.end('Not found');
        }
        const publicMediaPaths = [...new Set([item.imagePath, ...(Array.isArray(item.galleryPaths) ? item.galleryPaths.filter(mediaPath => mediaPath !== item.imagePath) : [])].filter(Boolean))].slice(0, 5);
        const mediaPath = publicMediaPaths[galleryIndex];
        const file = path.resolve(botRoot, mediaPath || '');
        if (!file.startsWith(`${uploadRoot}${path.sep}`)) { res.writeHead(404); return res.end('Not found'); }
        const ext = path.extname(file).toLowerCase();
        const type = ({ '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' })[ext];
        if (!type || !fs.existsSync(file)) { res.writeHead(404); return res.end('Not found'); }
        if (req.method === 'GET' && allowCount(req, `media:${item.itemId}`)) { await DesignerAnalytics.updateOne({ designerId: item.designerId }, { $inc: { portfolioViews: 1 }, $setOnInsert: { designerId: item.designerId } }, { upsert: true }); await incrementDailyMetric(item.designerId, 'portfolioViews'); }
        const wantsWebp = /image\/webp/i.test(String(req.headers.accept || ''));
        if (ownerProfile?.watermarkEnabled) {
          try {
            const { data: resized, info: metadata } = await sharp(file, { limitInputPixels: 20_000_000 })
              .rotate().resize({ width: 1800, height: 1800, fit: 'inside', withoutEnlargement: true }).toBuffer({ resolveWithObject: true });
            const width = Math.max(1, Number(metadata.width || 1200));
            const height = Math.max(1, Number(metadata.height || 1200));
            const fontSize = Math.max(16, Math.min(42, Math.round(width / 38)));
            const label = `© ${escapeHtml(ownerProfile.displayName || item.designerId)}`;
            const svg = Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><g opacity=".72"><rect x="${Math.max(12, width - Math.min(width - 24, label.length * fontSize * .58 + 34))}" y="${Math.max(12, height - fontSize * 2.2)}" width="${Math.min(width - 24, label.length * fontSize * .58 + 22)}" height="${fontSize * 1.7}" rx="${fontSize * .35}" fill="#101010" fill-opacity=".62"/><text x="${width - 18}" y="${height - fontSize * .9}" fill="#fff" font-family="Arial,sans-serif" font-size="${fontSize}" font-weight="600" text-anchor="end">${label}</text></g></svg>`);
            const pipeline = sharp(resized).composite([{ input: svg, gravity: 'southeast' }]);
            let watermarked;
            let outputType = type;
            if (wantsWebp) {
              watermarked = await pipeline.webp({ quality: 82, effort: 4 }).toBuffer();
              outputType = 'image/webp';
            } else if (type === 'image/png') {
              watermarked = await pipeline.png({ compressionLevel: 8 }).toBuffer();
            } else {
              watermarked = await pipeline.jpeg({ quality: 86, mozjpeg: true }).toBuffer();
              outputType = 'image/jpeg';
            }
            res.writeHead(200, { 'content-type': outputType, 'cache-control': 'public, max-age=0, must-revalidate', 'vary': 'Accept', 'x-content-type-options': 'nosniff' });
            return res.end(watermarked);
          } catch (error) {
            console.warn('[MEDIA WATERMARK]', error.message);
            res.writeHead(503, { 'cache-control': 'no-store' });
            return res.end('Media temporarily unavailable');
          }
        }
        if (wantsWebp && ext !== '.webp') {
          try {
            const optimized = await sharp(file, { limitInputPixels: 20_000_000 }).rotate().resize({ width: 1800, height: 1800, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82, effort: 4 }).toBuffer();
            res.writeHead(200, { 'content-type': 'image/webp', 'cache-control': 'public, max-age=0, must-revalidate', 'vary': 'Accept', 'x-content-type-options': 'nosniff' });
            return res.end(optimized);
          } catch (error) { console.warn('[MEDIA OPTIMIZATION]', error.message); }
        }
        res.writeHead(200, { 'content-type': type, 'cache-control': 'public, max-age=0, must-revalidate', 'vary': 'Accept', 'x-content-type-options': 'nosniff' });
        if (req.method === 'HEAD') return res.end();
        return fs.createReadStream(file).on('error', () => res.destroy()).pipe(res);
      }
      if (parts[0] === 'studio' && parts[1] === 'forgot' && req.method === 'GET') {
        return sendHtml(res, 200, pageShell('Reset Password Desainer — PIR Visuals', `<section class="hero"><h1>Reset password desainer</h1><p class="muted">Masukkan email yang sudah diverifikasi pada akun Designer Studio.</p></section><section class="card"><form method="post" action="/studio/forgot"><label for="reset-email">Email akun</label><input id="reset-email" name="email" type="email" autocomplete="email" required maxlength="254" placeholder="nama@email.com" style="width:100%;padding:12px;margin:8px 0 16px"><button class="btn" type="submit">Kirim link reset password</button></form><p class="muted">Jika email cocok dengan akun terverifikasi, tautan reset akan dikirim. Tautan berlaku 20 menit. Periksa folder spam jika belum menerima email.</p><p><a href="/studio">← Kembali ke login Designer Studio</a></p></section>`), { 'cache-control': 'no-store' });
      }
      if (parts[0] === 'studio' && parts[1] === 'forgot' && req.method === 'POST') {
        const form = await readForm(req);
        const email = String(form.get('email') || '').trim().toLowerCase();
        const ipBudget = securityRateLimiter.consume(req, { scope: 'studio-forgot-ip', limit: 5, windowMs: 15 * 60 * 1000 });
        const emailBudget = securityRateLimiter.consume(req, { scope: 'studio-forgot-email', identity: email, limit: 2, windowMs: 30 * 60 * 1000 });
        if (!ipBudget.allowed) return sendHtml(res, 429, pageShell('Terlalu banyak permintaan', '<h1>Terlalu banyak permintaan reset password.</h1><p>Coba lagi setelah beberapa menit.</p>'), { 'cache-control': 'no-store', 'retry-after': String(ipBudget.retryAfterSeconds) });
        const canSendReset = emailBudget.allowed;
        const account = canSendReset ? await DesignerDashboardAuth.findOne({ email, emailVerified: true }).lean() : null;
        if (account) {
          const token = crypto.randomBytes(32).toString('hex');
          await DesignerDashboardAuth.updateOne({ designerId: account.designerId }, { $set: { passwordResetTokenHash: hashToken(token), passwordResetExpiresAt: new Date(Date.now() + 20 * 60 * 1000) } });
          try { await sendPasswordResetEmail(email, token); }
          catch (error) { console.error('[PASSWORD RESET EMAIL]', error.message); }
        }
        return sendHtml(res, 200, pageShell('Periksa email', '<section class="card"><h1>Jika email terdaftar, tautan reset akan dikirim.</h1><p>Periksa inbox dan folder spam. Demi keamanan, halaman ini tidak mengungkap apakah email terdaftar.</p></section>'), { 'cache-control': 'no-store' });
      }
      if (parts[0] === 'studio' && parts[1] === 'reset' && req.method === 'GET') {
        const email = String(url.searchParams.get('email') || '').trim().toLowerCase();
        const token = String(url.searchParams.get('token') || '');
        const account = await DesignerDashboardAuth.findOne({ email, passwordResetExpiresAt: { $gt: new Date() } }).lean();
        if (!account || !account.passwordResetTokenHash || !sameHash(hashToken(token), account.passwordResetTokenHash)) {
          return sendHtml(res, 400, pageShell('Tautan reset tidak valid', '<h1>Tautan reset tidak valid atau kedaluwarsa.</h1>'), { 'cache-control': 'no-store', 'referrer-policy': 'no-referrer' });
        }
        return sendHtml(res, 200, pageShell('Atur password baru', `<section class="card"><h1>Password baru</h1><form method="post" action="/studio/reset"><input type="hidden" name="email" value="${escapeHtml(email)}"><input type="hidden" name="token" value="${escapeHtml(token)}"><label>Password baru (minimal 12 karakter)</label><input type="password" name="password" minlength="12" maxlength="128" required style="width:100%;padding:12px;margin:8px 0"><button class="btn">Simpan password</button></form></section>`), { 'cache-control': 'no-store', 'referrer-policy': 'no-referrer' });
      }
      if (parts[0] === 'studio' && parts[1] === 'reset' && req.method === 'POST') {
        const form = await readForm(req);
        const email = String(form.get('email') || '').trim().toLowerCase();
        const token = String(form.get('token') || '');
        const password = String(form.get('password') || '');
        const ipBudget = securityRateLimiter.consume(req, { scope: 'studio-reset-ip', limit: 10, windowMs: 15 * 60 * 1000 });
        const emailBudget = securityRateLimiter.consume(req, { scope: 'studio-reset-email', identity: email, limit: 6, windowMs: 15 * 60 * 1000 });
        if (!ipBudget.allowed || !emailBudget.allowed) {
          const retryAfter = blockedRetryAfter(ipBudget, emailBudget);
          return sendHtml(res, 429, pageShell('Terlalu banyak percobaan', '<h1>Terlalu banyak percobaan reset password.</h1><p>Coba lagi setelah beberapa menit.</p>'), { 'cache-control': 'no-store', 'retry-after': String(retryAfter) });
        }
        if (password.length < 12 || password.length > 128) return sendHtml(res, 400, pageShell('Password tidak valid', '<h1>Password harus 12–128 karakter.</h1>'));
        const account = await DesignerDashboardAuth.findOne({ email, passwordResetExpiresAt: { $gt: new Date() } }).lean();
        if (!/^[a-f0-9]{64}$/.test(token) || !account || !account.passwordResetTokenHash || !sameHash(hashToken(token), account.passwordResetTokenHash)) return sendHtml(res, 400, pageShell('Tautan reset tidak valid', '<h1>Tautan reset tidak valid atau kedaluwarsa.</h1>'), { 'cache-control': 'no-store', 'referrer-policy': 'no-referrer' });
        const resetResult = await DesignerDashboardAuth.updateOne(
          { designerId: account.designerId, passwordResetTokenHash: account.passwordResetTokenHash, passwordResetExpiresAt: { $gt: new Date() } },
          { $set: {
            passwordHash: await hashPassword(password),
            passwordResetTokenHash: '',
            passwordResetExpiresAt: null,
            otpHash: '',
            otpExpiresAt: null,
            otpAttempts: 0,
          } },
        );
        if (!resetResult.matchedCount) return sendHtml(res,400,pageShell('Tautan reset tidak valid','<h1>Tautan reset tidak valid atau sudah digunakan.</h1>'),{'cache-control':'no-store','referrer-policy':'no-referrer'});
        await DesignerDashboardSession.deleteMany({ designerId: account.designerId });
        return sendHtml(res, 200, pageShell('Password diperbarui', '<h1>Password berhasil diperbarui.</h1><p>Silakan login kembali dengan password baru dan OTP WhatsApp.</p><a class="btn" href="/studio">Login</a>'), { 'cache-control': 'no-store', 'referrer-policy': 'no-referrer' });
      }
      if (parts[0] === 'studio' && parts[1] === 'register' && req.method === 'GET') {
        const body = pageShell('Daftar Akun — PIR Visuals', `<section class="hero"><span class="eyebrow">Create your designer account</span><h1>Bangun identitas kreatifmu.</h1><p class="muted">Daftar dari website, lalu tautkan nomor WhatsApp untuk menyinkronkan akun dengan bot PIR Visuals.</p></section><section class="card"><form method="post" action="/studio/register"><label>Nama publik<input name="displayName" required maxlength="80" autocomplete="name" style="display:block;width:100%;margin:6px 0 14px"></label><label>Nomor WhatsApp aktif (format internasional)<input name="phoneE164" required placeholder="+6281234567890" pattern="\\+[1-9][0-9]{7,14}" autocomplete="tel" style="display:block;width:100%;margin:6px 0 14px"></label><label>Email akun<input name="email" type="email" required maxlength="254" autocomplete="email" style="display:block;width:100%;margin:6px 0 14px"></label><label>Bio singkat<textarea name="bio" maxlength="600" rows="3" style="display:block;width:100%;margin:6px 0 14px" placeholder="Ceritakan fokus dan pengalaman desainmu"></textarea></label><label>Spesialisasi (pisahkan dengan koma)<input name="specialties" maxlength="300" placeholder="Branding, UI/UX, Ilustrasi" style="display:block;width:100%;margin:6px 0 14px"></label><label>Password (minimal 12 karakter)<input name="password" type="password" minlength="12" maxlength="128" required autocomplete="new-password" style="display:block;width:100%;margin:6px 0 14px"></label><label>Ulangi password<input name="confirmPassword" type="password" minlength="12" maxlength="128" required autocomplete="new-password" style="display:block;width:100%;margin:6px 0 14px"></label><button class="btn" type="submit">Buat akun dan dapatkan kode tautan</button></form><p class="muted">Setelah mendaftar, kirim kode sekali pakai ke bot melalui chat pribadi dengan perintah <strong>.portfolio link KODE</strong>. Bot akan memverifikasi nomor WhatsApp dan membuat profil bersama. Gambar portfolio tetap diunggah manual di website.</p></section>`);
        return sendHtml(res, 200, body, { 'cache-control': 'no-store' });
      }
      if (parts[0] === 'studio' && parts[1] === 'register' && req.method === 'POST') {
        const form = await readForm(req, 20 * 1024);
        const displayName = String(form.get('displayName') || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0,80);
        const phoneE164 = String(form.get('phoneE164') || '').trim().replace(/[()\s-]/g,'');
        const email = String(form.get('email') || '').trim().toLowerCase();
        const bio = String(form.get('bio') || '').replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,600);
        const specialties = [...new Set(String(form.get('specialties') || '').split(',').map(v=>v.trim().slice(0,50)).filter(Boolean))].slice(0,10);
        const password = String(form.get('password') || ''), confirmPassword = String(form.get('confirmPassword') || '');
        const signupKey = `${email}:${phoneE164}`;
        const signupIpBudget = securityRateLimiter.consume(req, { scope: 'studio-register-ip', limit: 5, windowMs: 60 * 60 * 1000 });
        const signupIdentityBudget = securityRateLimiter.consume(req, { scope: 'studio-register-identity', identity: signupKey, limit: 3, windowMs: 60 * 60 * 1000 });
        if (!signupIpBudget.allowed || !signupIdentityBudget.allowed) {
          const retryAfter = blockedRetryAfter(signupIpBudget, signupIdentityBudget);
          return sendHtml(res,429,pageShell('Terlalu banyak percobaan','<h1>Tunggu beberapa menit sebelum mencoba kembali.</h1>'),{'cache-control':'no-store','retry-after':String(retryAfter)});
        }
        if (!allowCount(req, `website-signup:${signupKey}`, 10 * 60 * 1000)) return sendHtml(res,429,pageShell('Terlalu banyak percobaan','<h1>Tunggu beberapa menit sebelum mencoba kembali.</h1>'),{'cache-control':'no-store'});
        if (displayName.length < 2 || !/^\+[1-9]\d{7,14}$/.test(phoneE164) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 12 || password.length > 128 || password !== confirmPassword) {
          return sendHtml(res,400,pageShell('Data pendaftaran tidak valid','<h1>Periksa nama, nomor WhatsApp internasional, email, dan password (minimal 12 karakter).</h1><a href="/studio/register">Kembali ke pendaftaran</a>'),{'cache-control':'no-store'});
        }
        if (await DesignerDashboardAuth.findOne({ email }).lean()) return sendHtml(res,409,pageShell('Email sudah digunakan','<h1>Email sudah terhubung dengan akun. Silakan login atau pulihkan akun.</h1><a href="/studio">Login</a>'));
        const activeRequest = await DesignerSignupRequest.findOne({ $or: [{ email }, { phoneE164 }], consumedAt: null, expiresAt: { $gt: new Date() } }).lean();
        if (activeRequest) return sendHtml(res,409,pageShell('Pendaftaran masih menunggu','<h1>Sudah ada pendaftaran yang menunggu verifikasi WhatsApp untuk email atau nomor ini.</h1><p>Gunakan kode yang sudah diberikan, atau tunggu 30 menit hingga kedaluwarsa.</p>'));
        const token = crypto.randomBytes(24).toString('hex');
        await DesignerSignupRequest.create({
          signupId: `SGN-${crypto.randomBytes(7).toString('hex').toUpperCase()}`,
          tokenHash: hashToken(token), phoneE164, email, passwordHash: await hashPassword(password),
          displayName, bio, specialties, expiresAt: new Date(Date.now() + 30 * 60 * 1000), consumedAt: null,
        });
        const body = pageShell('Tautkan Akun WhatsApp — PIR Visuals', `<section class="hero"><span class="eyebrow">One-time WhatsApp verification</span><h1>Satu langkah lagi.</h1><p class="muted">Pendaftaran tersimpan sementara selama 30 menit. Kirim kode berikut dari nomor WhatsApp yang sama dengan nomor pendaftaran.</p></section><section class="card"><p class="muted">Kode tautan sekali pakai</p><p style="font-size:clamp(18px,4vw,30px);font-weight:900;letter-spacing:.08em;overflow-wrap:anywhere;color:var(--accent-strong)">${escapeHtml(token)}</p><button class="btn btn-secondary" type="button" data-pv-copy-text="${escapeHtml(token)}">Salin kode</button><p><strong>Kirim ke bot lewat chat pribadi:</strong></p><pre style="white-space:pre-wrap;background:var(--bg-soft);padding:14px;border-radius:12px;color:var(--text)">.portfolio link ${escapeHtml(token)}</pre><p class="muted">Setelah bot menerima dan memverifikasi nomor WhatsApp, akun website dan profil bot akan terhubung. Kode tidak dapat digunakan kembali.</p></section>`);
        return sendHtml(res,200,body,{'cache-control':'no-store'});
      }
      if (parts[0] === 'studio' && parts[1] === 'resend-verification' && req.method === 'POST') {
        const form = await readForm(req);
        const email = String(form.get('email') || '').trim().toLowerCase();
        const resendIpBudget = securityRateLimiter.consume(req, { scope: 'studio-resend-ip', limit: 5, windowMs: 15 * 60 * 1000 });
        const resendEmailBudget = securityRateLimiter.consume(req, { scope: 'studio-resend-email', identity: email, limit: 3, windowMs: 15 * 60 * 1000 });
        if (!resendIpBudget.allowed) return sendHtml(res,429,dashboardLoginPage('Terlalu banyak permintaan. Coba lagi beberapa menit.'),{'cache-control':'no-store','retry-after':String(resendIpBudget.retryAfterSeconds)});
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !resendEmailBudget.allowed || !allowCount(req, `resend-verification:${email}`, 10 * 60 * 1000)) {
          return sendHtml(res,200,dashboardLoginPage('Jika akun tersedia, tautan verifikasi akan dikirim. Tunggu beberapa menit sebelum meminta ulang.'),{'cache-control':'no-store'});
        }
        const account = await DesignerDashboardAuth.findOne({ email, emailVerified: false });
        if (account) {
          const token = crypto.randomBytes(32).toString('hex');
          account.emailVerifyTokenHash = hashToken(token);
          account.emailVerifyExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
          await account.save();
          try { await sendVerificationEmail(email, token); }
          catch (error) { console.error('[DASHBOARD VERIFY EMAIL]',error.message); }
        }
        return sendHtml(res,200,dashboardLoginPage('Jika akun tersedia, tautan verifikasi akan dikirim. Periksa inbox dan folder spam.'),{'cache-control':'no-store'});
      }
      if (parts[0] === 'studio' && parts[1] === 'setup' && req.method === 'GET') {
        const body = pageShell('Aktivasi Designer Studio', `<section class="hero"><h1>Aktivasi akun desainer</h1><p class="muted">Minta token aktivasi melalui WhatsApp bot dengan perintah .portfolio dashboard setup.</p></section><section class="card"><form method="post" action="/studio/setup"><label>ID Desainer</label><input name="designerId" required maxlength="32" style="width:100%;padding:12px;margin:8px 0"><label>Email akun</label><input type="email" name="email" required maxlength="254" style="width:100%;padding:12px;margin:8px 0"><label>Token aktivasi dari WhatsApp</label><input name="token" required minlength="20" maxlength="100" style="width:100%;padding:12px;margin:8px 0"><label>Buat password (minimal 12 karakter)</label><input type="password" name="password" required minlength="12" maxlength="128" style="width:100%;padding:12px;margin:8px 0"><button class="btn" type="submit">Aktifkan akun</button></form></section>`);
        return sendHtml(res, 200, body, { 'cache-control': 'no-store' });
      }
      if (parts[0] === 'studio' && parts[1] === 'setup' && req.method === 'POST') {
        const form = await readForm(req);
        const designerId = String(form.get('designerId') || '').trim().toUpperCase();
        const token = String(form.get('token') || '').trim();
        const password = String(form.get('password') || '');
        const email = String(form.get('email') || '').trim().toLowerCase();
        const setupIpBudget = securityRateLimiter.consume(req, { scope: 'studio-setup-ip', limit: 8, windowMs: 15 * 60 * 1000 });
        const setupIdentityBudget = securityRateLimiter.consume(req, { scope: 'studio-setup-designer', identity: designerId, limit: 5, windowMs: 15 * 60 * 1000 });
        if (!setupIpBudget.allowed || !setupIdentityBudget.allowed) {
          const retryAfter = blockedRetryAfter(setupIpBudget, setupIdentityBudget);
          return sendHtml(res,429,pageShell('Terlalu banyak percobaan','<h1>Terlalu banyak percobaan aktivasi.</h1><p>Coba lagi setelah beberapa menit.</p>'),{'cache-control':'no-store','retry-after':String(retryAfter)});
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^DSN-[A-Z0-9-]{3,28}$/.test(designerId) || token.length < 20 || token.length > 100 || password.length < 12 || password.length > 128) {
          return sendHtml(res, 400, pageShell('Aktivasi gagal', '<h1>Data aktivasi tidak valid</h1>'));
        }
        const account = await DesignerDashboardAuth.findOne({ designerId }).lean();
        const profile = await DesignerProfile.findOne({ designerId }).lean();
        const emailTaken = await DesignerDashboardAuth.findOne({ email, designerId: { $ne: designerId } }).lean();
        if (emailTaken) return sendHtml(res, 409, pageShell('Email sudah digunakan', '<h1>Email sudah terhubung ke akun lain.</h1>'));
        if (!account || !profile || !account.setupTokenHash || account.setupTokenExpiresAt < new Date() || !sameHash(hashToken(token), account.setupTokenHash)) {
          return sendHtml(res, 400, pageShell('Aktivasi gagal', '<h1>Token tidak valid atau kedaluwarsa</h1><p>Minta token baru melalui WhatsApp.</p>'));
        }
        const emailToken = crypto.randomBytes(32).toString('hex');
        let setupResult;
        try {
          setupResult = await DesignerDashboardAuth.updateOne(
            { designerId, setupTokenHash: account.setupTokenHash, setupTokenExpiresAt: { $gt: new Date() } },
            { $set: {
              email,
              emailVerified: false,
              emailVerifyTokenHash: hashToken(emailToken),
              emailVerifyExpiresAt: new Date(Date.now() + 30 * 60 * 1000),
              passwordHash: await hashPassword(password),
              setupTokenHash: '',
              setupTokenExpiresAt: null,
              otpHash: '',
              otpExpiresAt: null,
              otpAttempts: 0,
              updatedAt: new Date(),
            } },
          );
        } catch (error) {
          if (error?.code === 11000) {
            return sendHtml(res, 409, pageShell('Email sudah digunakan', '<h1>Email sudah terhubung ke akun lain.</h1><p>Gunakan email lain untuk aktivasi.</p>'), { 'cache-control': 'no-store' });
          }
          throw error;
        }
        if (!setupResult?.matchedCount) {
          return sendHtml(res, 400, pageShell('Aktivasi gagal', '<h1>Token aktivasi sudah digunakan atau kedaluwarsa.</h1><p>Minta token baru melalui WhatsApp.</p>'), { 'cache-control': 'no-store' });
        }
        try { await sendVerificationEmail(email, emailToken); }
        catch (error) { return sendHtml(res, 503, pageShell('Email belum terkirim', `<h1>Akun disiapkan, tetapi email verifikasi gagal dikirim.</h1><p>${escapeHtml(error.message)}</p><p>Setelah SMTP dikonfigurasi, minta aktivasi ulang melalui Owner.</p>`)); }
        return sendHtml(res, 200, pageShell('Periksa email', '<h1>Periksa email kamu</h1><p>Kami mengirim tautan verifikasi yang berlaku 30 menit. Setelah email diverifikasi, minta OTP melalui WhatsApp.</p>'));
      }
      if (parts[0] === 'studio' && parts[1] === 'verify' && req.method === 'GET') {
        const verifyBudget = securityRateLimiter.consume(req, { scope: 'studio-verify-ip', limit: 60, windowMs: 15 * 60 * 1000 });
        if (!verifyBudget.allowed) return sendHtml(res,429,pageShell('Terlalu banyak permintaan','<h1>Terlalu banyak permintaan verifikasi.</h1>'),{'cache-control':'no-store','retry-after':String(verifyBudget.retryAfterSeconds)});
        const email = String(url.searchParams.get('email') || '').trim().toLowerCase();
        const token = String(url.searchParams.get('token') || '');
        const account = await DesignerDashboardAuth.findOne({ email, emailVerifyExpiresAt: { $gt: new Date() } }).lean();
        if (!/^[a-f0-9]{64}$/.test(token) || !account || !account.emailVerifyTokenHash || !sameHash(hashToken(token), account.emailVerifyTokenHash)) {
          return sendHtml(res, 400, pageShell('Verifikasi gagal', '<h1>Tautan verifikasi tidak valid atau kedaluwarsa.</h1>'), { 'cache-control': 'no-store', 'referrer-policy': 'no-referrer' });
        }
        // Email security scanners often prefetch GET links. Show a confirmation
        // form here and consume the one-time token only after an explicit POST.
        const confirmBody = `<section class="card"><h1>Konfirmasi alamat email</h1><p>Tekan tombol di bawah untuk menyelesaikan verifikasi akun PIR Visuals.</p><form method="post" action="/studio/verify"><input type="hidden" name="email" value="${escapeHtml(email)}"><input type="hidden" name="token" value="${escapeHtml(token)}"><button class="btn" type="submit">Verifikasi email</button></form></section>`;
        return sendHtml(res, 200, pageShell('Konfirmasi Email — PIR Visuals', confirmBody), { 'cache-control': 'no-store', 'referrer-policy': 'no-referrer' });
      }
      if (parts[0] === 'studio' && parts[1] === 'verify' && req.method === 'POST') {
        const verifyBudget = securityRateLimiter.consume(req, { scope: 'studio-verify-confirm-ip', limit: 10, windowMs: 15 * 60 * 1000 });
        if (!verifyBudget.allowed) return sendHtml(res,429,pageShell('Terlalu banyak percobaan','<h1>Terlalu banyak percobaan verifikasi.</h1>'),{'cache-control':'no-store','retry-after':String(verifyBudget.retryAfterSeconds)});
        const form = await readForm(req);
        const email = String(form.get('email') || '').trim().toLowerCase();
        const token = String(form.get('token') || '');
        const account = await DesignerDashboardAuth.findOne({ email, emailVerifyExpiresAt: { $gt: new Date() } }).lean();
        if (!/^[a-f0-9]{64}$/.test(token) || !account || !account.emailVerifyTokenHash || !sameHash(hashToken(token), account.emailVerifyTokenHash)) {
          return sendHtml(res, 400, pageShell('Verifikasi gagal', '<h1>Tautan verifikasi tidak valid atau kedaluwarsa.</h1>'), { 'cache-control': 'no-store', 'referrer-policy': 'no-referrer' });
        }
        const verifyResult = await DesignerDashboardAuth.updateOne(
          { designerId: account.designerId, emailVerifyTokenHash: account.emailVerifyTokenHash, emailVerifyExpiresAt: { $gt: new Date() } },
          { $set: { emailVerified: true, emailVerifyTokenHash: '', emailVerifyExpiresAt: null } },
        );
        if (!verifyResult.matchedCount) return sendHtml(res,400,pageShell('Verifikasi gagal','<h1>Tautan verifikasi tidak valid atau sudah digunakan.</h1>'),{'cache-control':'no-store','referrer-policy':'no-referrer'});
        return sendHtml(res, 200, pageShell('Email terverifikasi', '<h1>Email berhasil diverifikasi.</h1><p>Selanjutnya minta OTP WhatsApp dengan `.portfolio dashboard otp`, lalu login ke Designer Studio.</p><a class="btn" href="/studio">Buka Designer Studio</a>'), { 'cache-control': 'no-store', 'referrer-policy': 'no-referrer' });
      }
      if (parts[0] === 'studio' && parts[1] === 'login' && req.method === 'POST') {
        const form = await readForm(req);
        const email = String(form.get('email') || '').trim().toLowerCase();
        const password = String(form.get('password') || '');
        const otp = String(form.get('otp') || '');
        const loginIpBudget = securityRateLimiter.consume(req, { scope: 'studio-login-ip', limit: 60, windowMs: 15 * 60 * 1000 });
        const loginEmailBudget = securityRateLimiter.consume(req, { scope: 'studio-login-email', identity: email, limit: 15, windowMs: 15 * 60 * 1000 });
        if (!loginIpBudget.allowed || !loginEmailBudget.allowed) {
          const retryAfter = blockedRetryAfter(loginIpBudget, loginEmailBudget);
          return sendHtml(res,429,dashboardLoginPage('Terlalu banyak percobaan login. Coba lagi setelah beberapa menit.'),{'cache-control':'no-store','retry-after':String(retryAfter)});
        }
        const ip = getClientAddress(req, { trustCloudflare: process.env.TRUST_CLOUDFLARE_IP_HEADER === 'true' });
        const attemptKey = crypto.createHash('sha256').update(`${ip}:${email}`).digest('hex');
        if (dashboardLoginAttempts.size > 10000) {
          for (const [key, value] of dashboardLoginAttempts) if (value.until < Date.now()) dashboardLoginAttempts.delete(key);
          while (dashboardLoginAttempts.size > 10000) dashboardLoginAttempts.delete(dashboardLoginAttempts.keys().next().value);
        }
        const attempts = dashboardLoginAttempts.get(attemptKey) || { count: 0, until: 0 };
        if (attempts.until > Date.now() && attempts.count >= 10) return sendHtml(res, 429, dashboardLoginPage('Terlalu banyak percobaan. Coba lagi 15 menit.'), { 'cache-control': 'no-store' });
        if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length > 128 || !/^\d{6}$/.test(otp)) {
          if (attempts.until < Date.now()) { attempts.count = 0; attempts.until = Date.now() + 15 * 60 * 1000; }
          attempts.count += 1;
          dashboardLoginAttempts.set(attemptKey, attempts);
          return sendHtml(res, 401, dashboardLoginPage('Login gagal. Pastikan email terverifikasi dan periksa password serta OTP.'), { 'cache-control': 'no-store' });
        }
        const account = await DesignerDashboardAuth.findOne({ email }).lean();
        const designerId = account?.designerId || '';
        const profile = await DesignerProfile.findOne({ designerId, ownerJid: { $exists: true, $ne: '' } }).lean();
        const passwordOk = account && account.emailVerified === true && await verifyPassword(password, account.passwordHash);
        const otpOk = account && Number(account.otpAttempts || 0) < 5 && account.otpHash && account.otpExpiresAt > new Date() && sameHash(hashToken(otp), account.otpHash);
        if (!profile || !passwordOk || !otpOk || !/^\d{6}$/.test(otp)) {
          if (attempts.until < Date.now()) { attempts.count = 0; attempts.until = Date.now() + 15 * 60 * 1000; }
          attempts.count += 1; dashboardLoginAttempts.set(attemptKey, attempts);
          if (account && passwordOk && !otpOk && account.otpHash && account.otpExpiresAt > new Date()) {
            await DesignerDashboardAuth.updateOne(
              {
                designerId,
                otpHash: account.otpHash,
                otpExpiresAt: { $gt: new Date() },
                $or: [{ otpAttempts: { $lt: 5 } }, { otpAttempts: { $exists: false } }],
              },
              { $inc: { otpAttempts: 1 } },
            );
          }
          return sendHtml(res, 401, dashboardLoginPage('Login gagal. Pastikan email terverifikasi dan periksa password serta OTP.'), { 'cache-control': 'no-store' });
        }
        // Consume the WhatsApp OTP atomically. Two simultaneous login requests
        // cannot both exchange the same one-time code for valid sessions.
        const otpConsumeResult = await DesignerDashboardAuth.updateOne(
          {
            designerId,
            emailVerified: true,
            passwordHash: account.passwordHash,
            otpHash: account.otpHash,
            otpExpiresAt: { $gt: new Date() },
            $or: [{ otpAttempts: { $lt: 5 } }, { otpAttempts: { $exists: false } }],
          },
          { $set: { otpHash: '', otpExpiresAt: null, otpAttempts: 0 } },
        );
        if (!otpConsumeResult.matchedCount) {
          return sendHtml(res, 401, dashboardLoginPage('OTP sudah digunakan atau kedaluwarsa. Minta kode baru melalui WhatsApp.'), { 'cache-control': 'no-store' });
        }
        dashboardLoginAttempts.delete(attemptKey);
        const csrf = await issueDesignerSession(res, designerId);
        return sendHtml(res, 200, await dashboardStudioPage(profile, { csrf }), { 'cache-control': 'no-store' });
      }
      if (parts[0] === 'studio' && parts[1] === 'password' && req.method === 'POST') {
        const session = await getDesignerSession(req);
        if (!session) { res.writeHead(302, { location: '/studio' }); return res.end(); }
        const form = await readForm(req);
        if (!validCsrf(req, form, session)) { res.writeHead(403); return res.end('Permintaan tidak valid. Muat ulang halaman.'); }
        const passwordIpBudget = securityRateLimiter.consume(req, { scope: 'studio-password-ip', limit: 20, windowMs: 15 * 60 * 1000 });
        const passwordDesignerBudget = securityRateLimiter.consume(req, { scope: 'studio-password-designer', identity: session.designerId, limit: 8, windowMs: 15 * 60 * 1000 });
        if (!passwordIpBudget.allowed || !passwordDesignerBudget.allowed) {
          const retryAfter = blockedRetryAfter(passwordIpBudget, passwordDesignerBudget);
          return sendHtml(res, 429, pageShell('Terlalu banyak percobaan', '<h1>Terlalu banyak percobaan mengganti password.</h1><p>Coba lagi setelah beberapa menit.</p>'), { 'cache-control': 'no-store', 'retry-after': String(retryAfter) });
        }
        const currentPassword = String(form.get('currentPassword') || '');
        const newPassword = String(form.get('newPassword') || '');
        const confirmPassword = String(form.get('confirmPassword') || '');
        const profile = await DesignerProfile.findOne({ designerId: session.designerId }).lean();
        if (!profile) { res.writeHead(404); return res.end('Profile not found'); }
        let error = '';
        if (newPassword.length < 12 || newPassword.length > 128) error = 'Password baru harus 12–128 karakter.';
        else if (newPassword !== confirmPassword) error = 'Konfirmasi password baru tidak cocok.';
        const account = await DesignerDashboardAuth.findOne({ designerId: session.designerId });
        if (!error && (!account || !(await verifyPassword(currentPassword, account.passwordHash)))) error = 'Password saat ini salah.';
        if (!error && await verifyPassword(newPassword, account.passwordHash)) error = 'Password baru harus berbeda dari password saat ini.';
        if (error) return sendHtml(res, 400, await dashboardStudioPage(profile, session, error), { 'cache-control': 'no-store' });
        const passwordChangeResult = await DesignerDashboardAuth.updateOne(
          { designerId: session.designerId, passwordHash: account.passwordHash },
          { $set: {
            passwordHash: await hashPassword(newPassword),
            passwordResetTokenHash: '',
            passwordResetExpiresAt: null,
            otpHash: '',
            otpExpiresAt: null,
            otpAttempts: 0,
          } },
        );
        if (!passwordChangeResult.matchedCount) {
          return sendHtml(res, 409, pageShell('Password berubah', '<h1>Password akun baru saja diperbarui.</h1><p>Silakan login kembali menggunakan password terbaru.</p><a class="btn" href="/studio">Buka Designer Studio</a>'), { 'cache-control': 'no-store' });
        }
        await DesignerDashboardSession.deleteMany({ designerId: session.designerId });
        res.writeHead(302, { location: '/studio?password=changed', 'set-cookie': 'pir_designer_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0' });
        return res.end();
      }
      if (parts[0] === 'studio' && parts[1] === 'availability' && req.method === 'POST') {
        const session = await getDesignerSession(req);
        if (!session) { res.writeHead(302, { location: '/studio' }); return res.end(); }
        const form = await readForm(req);
        if (!validCsrf(req, form, session)) { res.writeHead(403); return res.end('Permintaan tidak valid.'); }
        const date = String(form.get('date') || ''), status = String(form.get('status') || 'available'), note = String(form.get('note') || '').slice(0,160);
        if (!isCalendarDate(date) || !['available','busy','unavailable'].includes(status) || date < jakartaDateKey()) { res.writeHead(400); return res.end('Tanggal atau status tidak valid.'); }
        await DesignerAvailability.findOneAndUpdate({ designerId: session.designerId, date }, { $set: { status, note } }, { upsert: true, new: true });
        await DesignerNotification.create({ notificationId: `NTF-${crypto.randomBytes(8).toString('hex')}`, designerId: session.designerId, type: 'calendar', title: 'Kalender diperbarui', message: `${date} · ${status}` }).catch(error => console.warn('[STUDIO CALENDAR NOTICE]', error.name));
        const profile = await DesignerProfile.findOne({ designerId: session.designerId }).lean();
        return sendHtml(res,200,await dashboardStudioPage(profile,session,'Kalender berhasil diperbarui.'),{'cache-control':'no-store'});
      }
      if (parts[0] === 'studio' && parts[1] === 'lead' && parts[2] === 'status' && req.method === 'POST') {
        const session = await getDesignerSession(req);
        if (!session) { res.writeHead(302, { location: '/studio' }); return res.end(); }
        const form = await readForm(req);
        if (!validCsrf(req, form, session)) { res.writeHead(403); return res.end('Permintaan tidak valid.'); }
        const leadId = String(form.get('leadId') || ''), status = String(form.get('status') || '');
        if (!['new','contacted','qualified','won','closed'].includes(status)) { res.writeHead(400); return res.end('Status tidak valid.'); }
        await DesignerLead.updateOne({ leadId, designerId: session.designerId }, { $set: { status } });
        await DesignerNotification.create({ notificationId: `NTF-${crypto.randomBytes(8).toString('hex')}`, designerId: session.designerId, type: 'lead', title: 'Status calon klien diperbarui', message: `Lead ${leadId}: ${status}` });
        const profile = await DesignerProfile.findOne({ designerId: session.designerId }).lean();
        return sendHtml(res,200,await dashboardStudioPage(profile,session,'Status calon klien diperbarui.'),{'cache-control':'no-store'});
      }
      if (parts[0] === 'studio' && parts[1] === 'avatar-preview' && req.method === 'POST') {
        const session = await getDesignerSession(req);
        if (!session) { res.writeHead(401, { 'cache-control': 'no-store' }); return res.end('Sesi Designer Studio berakhir. Login kembali.'); }
        const { fields, files } = await readMultipart(req, 6 * 1024 * 1024, { maxFiles: 1, maxFileBytes: PROFILE_AVATAR_MAX_FILE_BYTES, fileSizeMessage: 'Foto profil maksimal 5 MB.' });
        const form = { get: key => fields.get(key) || '' };
        if (!validCsrf(req, form, session)) { res.writeHead(403, { 'cache-control': 'no-store' }); return res.end('Token keamanan tidak valid. Muat ulang halaman.'); }
        const file = files[0];
        if (files.length !== 1 || file.fieldName !== 'avatarFile') { res.writeHead(400, { 'cache-control': 'no-store' }); return res.end('Pilih satu foto profil JPG, PNG, atau WebP.'); }
        if (!allowCount(req, `avatar-preview:${session.designerId}`, 500)) { res.writeHead(429, { 'cache-control': 'no-store' }); return res.end('Tunggu sebentar sebelum membuat pratinjau lagi.'); }
        const validated = await processProfileAvatarBuffer(file.data, { filename: file.filename, contentType: file.contentType });
        const preview = await sharp(validated.buffer, { failOn: 'error', limitInputPixels: 100_000_000 })
          .rotate().resize(512, 512, { fit: 'cover', position: 'attention' }).webp({ quality: 88, effort: 4 }).toBuffer();
        res.writeHead(200, { 'content-type': 'image/webp', 'content-length': String(preview.length), 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' });
        return res.end(preview);
      }
      if (parts[0] === 'studio' && parts[1] === 'profile' && req.method === 'POST') {
        const session = await getDesignerSession(req);
        if (!session) { res.writeHead(302, { location: '/studio' }); return res.end(); }
        const { fields, files } = await readMultipart(req, 16 * 1024 * 1024);
        const form = { get: key => fields.get(key) || '' };
        if (!validCsrf(req, form, session)) { res.writeHead(403); return res.end('Permintaan tidak valid. Muat ulang halaman.'); }
        const profile = await DesignerProfile.findOne({ designerId: session.designerId }).lean();
        if (!profile) { res.writeHead(404); return res.end('Profile not found'); }
        const clean = (key, max) => String(form.get(key) || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max);
        const rawPhone = clean('contactPhone', 24);
        const phone = rawPhone.replace(/\D/g, '');
        if (rawPhone && !/^\d{8,15}$/.test(phone)) {
          return sendHtml(res, 400, pageShell('Nomor WhatsApp tidak valid', '<h1>Gunakan 8–15 digit dengan kode negara, misalnya 6281234567890.</h1><a href="/studio">Kembali ke Designer Studio</a>'), { 'cache-control': 'no-store' });
        }
        const slug = clean('slug', 40).toLowerCase();
        if (slug && !/^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$/.test(slug)) return sendHtml(res, 400, pageShell('Custom URL tidak valid', '<h1>Gunakan 3–40 karakter huruf kecil, angka, dan tanda hubung.</h1>'));
        if (slug) {
          const taken = await DesignerProfile.findOne({ slug, designerId: { $ne: session.designerId } }).select('designerId').lean();
          if (taken) return sendHtml(res, 409, pageShell('Custom URL digunakan', '<h1>URL tersebut sudah digunakan desainer lain.</h1>'));
        }
        const specialties = clean('specialties', 240).split(',').map(x => x.trim()).filter(Boolean).slice(0, 15);
        const priceMin = Math.max(0, Math.min(100000000, Number(form.get('priceMin') || 0)));
        const priceMax = Math.max(0, Math.min(100000000, Number(form.get('priceMax') || 0)));
        const avatarUrl = /^https:\/\//i.test(clean('avatarUrl', 500)) ? clean('avatarUrl', 500) : '';
        const avatarFiles = files.filter(file => file.fieldName === 'avatarFile');
        if (files.some(file => file.fieldName !== 'avatarFile') || avatarFiles.length > 1) {
          return sendHtml(res, 400, pageShell('Foto profil tidak valid', '<h1>Pilih satu file foto profil saja.</h1><a href="/studio">Kembali ke Designer Studio</a>'), { 'cache-control': 'no-store' });
        }
        let avatarPath = String(profile.avatarPath || '');
        let newAvatarFilePath = '';
        const avatarFile = avatarFiles[0];
        if (avatarFile) {
          if (avatarFile.data.length > PROFILE_AVATAR_MAX_FILE_BYTES) {
            return sendHtml(res, 400, pageShell('Foto profil terlalu besar', '<h1>Ukuran foto profil maksimal 5 MB.</h1><a href="/studio">Kembali ke Designer Studio</a>'), { 'cache-control': 'no-store' });
          }
          try {
            const output = await processProfileAvatarBuffer(avatarFile.data, {
              filename: avatarFile.filename, contentType: avatarFile.contentType,
            });
            const botRoot = path.resolve(process.env.BOT_DATA_ROOT || APP_ROOT);
            const uploadRoot = path.resolve(botRoot, process.env.PORTFOLIO_UPLOAD_DIR || 'uploads/portfolio');
            const avatarRoot = path.join(uploadRoot, 'avatars');
            await fs.promises.mkdir(avatarRoot, { recursive: true });
            const avatarExtension = ({ jpeg: '.jpg', png: '.png', webp: '.webp' })[output.format];
            if (!avatarExtension) throw new Error('Format foto profil tidak didukung.');
            newAvatarFilePath = path.join(avatarRoot, `avatar-${crypto.randomBytes(16).toString('hex')}${avatarExtension}`);
            await fs.promises.writeFile(newAvatarFilePath, output.buffer, { flag: 'wx', mode: 0o600 });
            avatarPath = path.relative(botRoot, newAvatarFilePath).replace(/\\/g, '/');
          } catch (error) {
            return sendHtml(res, 400, pageShell('Foto profil gagal diunggah', `<h1>${escapeHtml(error.message)}</h1><a href="/studio">Kembali ke Designer Studio</a>`), { 'cache-control': 'no-store' });
          }
        } else if (form.get('removeAvatar') === '1' || (avatarUrl && avatarUrl !== String(profile.avatarUrl || ''))) {
          avatarPath = '';
        }
        try {
          await DesignerProfile.updateOne({ designerId: session.designerId }, { $set: {
            displayName: clean('displayName', 80), slug, bio: clean('bio', 600), specialties,
            softwareSkills: clean('softwareSkills', 240), experience: clean('experience', 120),
            location: clean('location', 100), category: clean('category', 80), avatarUrl, avatarPath,
            contactPhone: /^\d{8,15}$/.test(phone) ? phone : '', publicWhatsApp: /^\d{8,15}$/.test(phone) ? phone : '',
            instagram: clean('instagram', 120), behance: clean('behance', 240), website: clean('website', 240),
            tagline: clean('tagline', 140), practiceStatement: clean('practiceStatement', 600),
            approach: clean('approach', 500), idealProjects: clean('idealProjects', 400),
            profileLayout: ['editorial','minimal','gallery'].includes(clean('profileLayout', 20)) ? clean('profileLayout', 20) : 'editorial',
            seoTitle: clean('seoTitle', 100), seoDescription: clean('seoDescription', 300),
            seoImage: /^https:\/\//i.test(clean('seoImage', 500)) ? clean('seoImage', 500) : '',
            priceMin, priceMax: Math.max(priceMin, priceMax),
            acceptsOrders: form.get('acceptsOrders') === '1', availabilityPublic: form.get('availabilityPublic') === '1', isPublic: form.get('isPublic') === '1',
          } });
        } catch (error) {
          if (newAvatarFilePath) await fs.promises.unlink(newAvatarFilePath).catch(() => {});
          throw error;
        }
        if (profile.avatarPath && profile.avatarPath !== avatarPath) {
          const botRoot = path.resolve(process.env.BOT_DATA_ROOT || APP_ROOT);
          const uploadRoot = path.resolve(botRoot, process.env.PORTFOLIO_UPLOAD_DIR || 'uploads/portfolio');
          const oldAvatar = path.resolve(botRoot, profile.avatarPath);
          if (oldAvatar.startsWith(`${uploadRoot}${path.sep}`) && ['.webp', '.png', '.jpg', '.jpeg'].includes(path.extname(oldAvatar).toLowerCase())) {
            await fs.promises.unlink(oldAvatar).catch(() => {});
          }
        }
        res.writeHead(303, { location: '/studio?profileSaved=1#edit-profile', 'cache-control': 'no-store', 'referrer-policy': 'no-referrer' });
        return res.end();
      }
      if (parts[0] === 'studio' && parts[1] === 'work' && req.method === 'POST') {
        const session = await getDesignerSession(req);
        if (!session) { res.writeHead(302, { location: '/studio' }); return res.end(); }
        const profile = await DesignerProfile.findOne({ designerId: session.designerId }).lean();
        if (!profile) { res.writeHead(404); return res.end('Profile not found'); }
        const action = parts[2] || '';
        if (action === 'upload') {
          const { fields, files } = await readMultipart(req);
          const form = { get: key => fields.get(key) || '' };
          if (!validCsrf(req, form, session)) { res.writeHead(403); return res.end('Permintaan tidak valid.'); }
          const title = String(form.get('title')).replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0, 100);
          const category = String(form.get('category')).replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0, 60);
          const description = String(form.get('description')).replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0, 800);
          const rawPrice = String(form.get('priceFrom') || '').trim();
          const priceFrom = rawPrice === '' ? 0 : Number(rawPrice);
          if (!Number.isFinite(priceFrom) || priceFrom < 0 || priceFrom > 100000000) return sendHtml(res, 400, pageShell('Harga tidak valid', '<h1>Harga karya harus antara Rp0 dan Rp100.000.000.</h1>'));
          if (files.length > 5 || files.some(file => file.fieldName !== 'image')) return sendHtml(res, 400, pageShell('Upload gagal', '<h1>Upload maksimal lima gambar melalui kolom file karya.</h1>'));
          const cleanProject = (key,max) => String(form.get(key)||'').replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0,max);
          const projectYearInput = cleanProject('projectYear',4);
          const projectYear = /^\d{4}$/.test(projectYearInput) && Number(projectYearInput)>=1900 && Number(projectYearInput)<=new Date().getFullYear()+2 ? projectYearInput : '';
          if (!title || !category || !files.length) return sendHtml(res, 400, pageShell('Upload gagal', '<h1>Judul, kategori, dan minimal satu gambar wajib diisi.</h1>'));
          const botRoot = path.resolve(process.env.BOT_DATA_ROOT || APP_ROOT);
          const uploadRoot = path.resolve(botRoot, process.env.PORTFOLIO_UPLOAD_DIR || 'uploads/portfolio');
          await fs.promises.mkdir(uploadRoot, { recursive: true });
          const outputPaths = [];
          try {
            const cropMode = ['original','square','landscape','portrait'].includes(fields.get('cropMode')) ? fields.get('cropMode') : 'original';
            for (const file of files) {
              const filename = safeImageName();
              const outputPath = path.join(uploadRoot, filename);
              await processPortfolioImage(file, outputPath, cropMode);
              outputPaths.push(outputPath);
            }
          } catch (error) {
            await Promise.all(outputPaths.map(f => fs.promises.unlink(f).catch(() => {})));
            return sendHtml(res, 400, pageShell('Upload gagal', `<h1>${escapeHtml(error.message)}</h1>`));
          }
          const relativePaths = outputPaths.map(f => path.relative(botRoot, f).replace(/\\/g, '/'));
          try {
            await PortfolioItem.create({
              itemId: `ART-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
              designerId: session.designerId, ownerJid: profile.ownerJid,
              title, category, description, projectRole:cleanProject('projectRole',120), challenge:cleanProject('challenge',1200), solution:cleanProject('solution',1600), outcome:cleanProject('outcome',1200), toolsUsed:cleanProject('toolsUsed',240), projectDuration:cleanProject('projectDuration',80),
              projectClient:cleanProject('projectClient',100), projectIndustry:cleanProject('projectIndustry',80), projectYear,
              projectScope:cleanProject('projectScope',320), resultHighlight:cleanProject('resultHighlight',320),
              seoTitle:cleanProject('seoTitle',100), seoDescription:cleanProject('seoDescription',240), styles: [], priceFrom: Math.round(priceFrom),
              featured: false, imagePath: relativePaths[0], galleryPaths: relativePaths, moderationStatus: 'pending', createdAt:new Date(), updatedAt:new Date(),
            });
          } catch (error) { await Promise.all(outputPaths.map(f => fs.promises.unlink(f).catch(() => {}))); throw error; }
          const updated = await DesignerProfile.findOne({ designerId: session.designerId }).lean();
          return sendHtml(res, 200, await dashboardStudioPage(updated, session, 'Karya berhasil diunggah dan masuk antrean moderasi Owner.'), { 'cache-control': 'no-store' });
        }
        let form;
        let editFiles = [];
        if (action === 'edit') {
          const parsed = await readMultipart(req, PORTFOLIO_MAX_REQUEST_BYTES, { maxFiles: 5, maxFileBytes: PORTFOLIO_MAX_FILE_BYTES, fileSizeMessage: 'Setiap gambar karya maksimal 15 MB.' });
          form = { get: key => parsed.fields.get(key) || '' };
          editFiles = parsed.files;
          if (editFiles.some(file => file.fieldName !== 'additionalMedia')) { res.writeHead(400); return res.end('Kolom gambar tambahan tidak valid.'); }
        } else {
          form = await readForm(req);
        }
        if (!validCsrf(req, form, session)) { res.writeHead(403); return res.end('Permintaan tidak valid.'); }
        const itemId = String(form.get('itemId') || '').trim().toUpperCase();
        const item = await PortfolioItem.findOne({ itemId, designerId: session.designerId, ownerJid: profile.ownerJid }).lean();
        if (!item) { res.writeHead(404); return res.end('Karya tidak ditemukan.'); }
        if (action === 'edit') {
          const title = String(form.get('title') || '').trim().slice(0, 100);
          const category = String(form.get('category') || '').trim().slice(0, 60);
          const description = String(form.get('description') || '').replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0, 800);
          const rawPrice = String(form.get('priceFrom') || '').trim();
          const priceFrom = rawPrice === '' ? 0 : Number(rawPrice);
          const cleanProject = (key,max) => String(form.get(key)||'').replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0,max);
          const projectYearInput = cleanProject('projectYear',4);
          const projectYear = /^\d{4}$/.test(projectYearInput) && Number(projectYearInput)>=1900 && Number(projectYearInput)<=new Date().getFullYear()+2 ? projectYearInput : '';
          if (!title || !category) return sendHtml(res, 400, pageShell('Data tidak valid', '<h1>Judul dan kategori wajib diisi.</h1>'));
          if (!Number.isFinite(priceFrom) || priceFrom < 0 || priceFrom > 100000000) return sendHtml(res, 400, pageShell('Harga tidak valid', '<h1>Harga karya harus antara Rp0 dan Rp100.000.000.</h1>'));
          const currentMedia = [...new Set([item.imagePath, ...(Array.isArray(item.galleryPaths) ? item.galleryPaths.filter(mediaPath => mediaPath !== item.imagePath) : [])].filter(Boolean))].slice(0, 5);
          const removedIndexes = currentMedia.map((_, index) => form.get(`removeMedia${index}`) === '1' ? index : -1).filter(index => index >= 0);
          const keptMedia = currentMedia.filter((_, index) => !removedIndexes.includes(index));
          if (keptMedia.length + editFiles.length > 5) return sendHtml(res, 400, pageShell('Galeri terlalu banyak', '<h1>Maksimal lima gambar untuk setiap karya. Hapus gambar lama atau kurangi gambar tambahan.</h1>'));
          if (!keptMedia.length && !editFiles.length) return sendHtml(res, 400, pageShell('Cover wajib tersedia', '<h1>Setiap karya harus memiliki minimal satu gambar. Pilih gambar cover atau tambahkan gambar baru.</h1>'));
          const selectedCoverIndex = Number(form.get('coverIndex'));
          const selectedCover = Number.isInteger(selectedCoverIndex) && selectedCoverIndex >= 0 && currentMedia[selectedCoverIndex] && keptMedia.includes(currentMedia[selectedCoverIndex])
            ? currentMedia[selectedCoverIndex]
            : keptMedia[0];
          const botRoot = path.resolve(process.env.BOT_DATA_ROOT || APP_ROOT);
          const uploadRoot = path.resolve(botRoot, process.env.PORTFOLIO_UPLOAD_DIR || 'uploads/portfolio');
          await fs.promises.mkdir(uploadRoot, { recursive: true });
          const outputPaths = [];
          let newRelativePaths = [];
          try {
            for (const file of editFiles) {
              const outputPath = path.join(uploadRoot, safeImageName());
              await processPortfolioImage(file, outputPath, 'original');
              outputPaths.push(outputPath);
            }
            newRelativePaths = outputPaths.map(file => path.relative(botRoot, file).replace(/\\/g, '/'));
            const nextMedia = [selectedCover, ...keptMedia.filter(mediaPath => mediaPath !== selectedCover), ...newRelativePaths].filter(Boolean).slice(0, 5);
            const removedPaths = currentMedia.filter(mediaPath => !nextMedia.includes(mediaPath));
            const updateResult = await PortfolioItem.updateOne({ itemId, designerId: session.designerId, ownerJid: profile.ownerJid }, { $set: {
              title, category, description, priceFrom: Math.round(priceFrom), imagePath: nextMedia[0], galleryPaths: nextMedia,
              projectRole:cleanProject('projectRole',120), challenge:cleanProject('challenge',1200), solution:cleanProject('solution',1600), outcome:cleanProject('outcome',1200), toolsUsed:cleanProject('toolsUsed',240), projectDuration:cleanProject('projectDuration',80),
              projectClient:cleanProject('projectClient',100), projectIndustry:cleanProject('projectIndustry',80), projectYear,
              projectScope:cleanProject('projectScope',320), resultHighlight:cleanProject('resultHighlight',320),
              seoTitle:cleanProject('seoTitle',100), seoDescription:cleanProject('seoDescription',240),
              moderationStatus: 'pending', reviewedBy: '', reviewedAt: null, moderationReason: 'Menunggu moderasi ulang setelah diedit', updatedAt: new Date()
            } });
            if (updateResult.matchedCount !== 1) throw new Error('Karya tidak ditemukan saat menyimpan perubahan.');
            for (const relative of removedPaths) {
              const stillUsed = await PortfolioItem.exists({ itemId: { $ne: itemId }, $or: [{ imagePath: relative }, { galleryPaths: relative }] });
              const target = path.resolve(botRoot, relative);
              if (!stillUsed && target.startsWith(`${uploadRoot}${path.sep}`)) await fs.promises.unlink(target).catch(() => {});
            }
          } catch (error) {
            await Promise.all(outputPaths.map(file => fs.promises.unlink(file).catch(() => {})));
            return sendHtml(res, 400, pageShell('Perubahan karya gagal', `<h1>${escapeHtml(error.message || 'Gambar tidak dapat diproses.')}</h1>`));
          }
        } else if (action === 'delete') {
          await PortfolioItem.deleteOne({ itemId, designerId: session.designerId, ownerJid: profile.ownerJid });
          const botRoot = path.resolve(process.env.BOT_DATA_ROOT || APP_ROOT);
          const uploadRoot = path.resolve(botRoot, process.env.PORTFOLIO_UPLOAD_DIR || 'uploads/portfolio');
          const filePath = path.resolve(botRoot, item.imagePath || '');
          if (filePath.startsWith(`${uploadRoot}${path.sep}`)) await fs.promises.unlink(filePath).catch(() => {});
          for (const galleryPath of (item.galleryPaths || [])) { const galleryFile = path.resolve(botRoot, galleryPath); if (galleryFile.startsWith(`${uploadRoot}${path.sep}`)) await fs.promises.unlink(galleryFile).catch(() => {}); }
        } else { res.writeHead(404); return res.end('Not found'); }
        const updated = await DesignerProfile.findOne({ designerId: session.designerId }).lean();
        return sendHtml(res, 200, await dashboardStudioPage(updated, session, action === 'delete' ? 'Karya berhasil dihapus.' : 'Perubahan disimpan; karya menunggu moderasi ulang.'), { 'cache-control': 'no-store' });
      }
      if (parts[0] === 'studio' && ['collection', 'testimonial'].includes(parts[1]) && req.method === 'POST') {
        const session = await getDesignerSession(req);
        if (!session) { res.writeHead(302, { location: '/studio' }); return res.end(); }
        const form = await readForm(req);
        if (!validCsrf(req, form, session)) { res.writeHead(403); return res.end('Permintaan tidak valid.'); }
        if (parts[1] === 'collection' && parts[2] === 'toggle') {
          const collectionId = String(form.get('collectionId') || '');
          const collection = await PortfolioCollection.findOne({ collectionId, designerId: session.designerId });
          if (!collection) { res.writeHead(404); return res.end('Koleksi tidak ditemukan.'); }
          collection.isPublic = !collection.isPublic; await collection.save();
        } else if (parts[1] === 'testimonial' && parts[2] === 'toggle') {
          const testimonialId = String(form.get('testimonialId') || '');
          const testimonial = await DesignerTestimonial.findOne({ testimonialId, designerId: session.designerId });
          if (!testimonial) { res.writeHead(404); return res.end('Testimoni tidak ditemukan.'); }
          if (!testimonial.isPublished) return sendHtml(res, 403, pageShell('Menunggu persetujuan Owner', '<h1>Ulasan hanya dapat dipublikasikan setelah email diverifikasi dan Owner menyetujuinya.</h1>')); testimonial.isPublished = false; await testimonial.save();
        } else if (parts[1] === 'collection') {
          const title = String(form.get('title') || '').trim().slice(0, 100);
          const description = String(form.get('description') || '').trim().slice(0, 500);
          const itemIds = [...new Set(String(form.get('itemIds') || '').split(',').map(x => x.trim().toUpperCase()).filter(x => /^ART-[A-F0-9]{4,16}$/.test(x)))].slice(0, 30);
          const owned = itemIds.length ? await PortfolioItem.find({ itemId: { $in: itemIds }, designerId: session.designerId, moderationStatus: 'approved' }).distinct('itemId') : [];
          if (!title || !itemIds.length || owned.length !== itemIds.length) return sendHtml(res, 400, pageShell('Koleksi gagal', '<h1>Nama koleksi wajib diisi dan semua karya harus milikmu serta sudah disetujui.</h1>'));
          await PortfolioCollection.create({ collectionId: `COL-${crypto.randomBytes(5).toString('hex').toUpperCase()}`, designerId: session.designerId, title, description, itemIds, isPublic: false });
        } else {
          const clientName = String(form.get('clientName') || '').trim().slice(0, 80);
          const project = String(form.get('project') || '').trim().slice(0, 100);
          const message = String(form.get('message') || '').trim().slice(0, 700);
          const rating = Math.max(1, Math.min(5, Number(form.get('rating') || 5)));
          if (!clientName || message.length < 8) return sendHtml(res, 400, pageShell('Testimoni gagal', '<h1>Nama klien dan testimoni minimal 8 karakter wajib diisi.</h1>'));
          await DesignerTestimonial.create({ testimonialId: `TST-${crypto.randomBytes(5).toString('hex').toUpperCase()}`, designerId: session.designerId, clientName, project, message, rating, isPublished: false, emailVerified: false });
        }
        const updated = await DesignerProfile.findOne({ designerId: session.designerId }).lean();
        return sendHtml(res, 200, await dashboardStudioPage(updated, session, 'Perubahan berhasil disimpan.'), { 'cache-control': 'no-store' });
      }
      if (parts[0] === 'studio' && parts[1] === 'service' && req.method === 'POST') {
        const session = await getDesignerSession(req);
        if (!session) { res.writeHead(302, { location: '/studio' }); return res.end(); }
        const form = await readForm(req);
        if (!validCsrf(req, form, session)) { res.writeHead(403); return res.end('Permintaan tidak valid.'); }
        const profile = await DesignerProfile.findOne({ designerId: session.designerId }).lean();
        if (!profile) { res.writeHead(404); return res.end('Profile not found'); }
        const action = parts[2] || 'create';
        if (!['create', 'edit', 'toggle'].includes(action)) { res.writeHead(404); return res.end('Layanan tidak ditemukan.'); }
        const serviceFilter = { serviceId: String(form.get('serviceId') || ''), designerId: session.designerId };
        if (action === 'toggle') {
          const toggled = await DesignService.updateOne(serviceFilter, [{ $set: { isActive: { $not: ['$isActive'] } } }]);
          if (!toggled.matchedCount) { res.writeHead(404); return res.end('Layanan tidak ditemukan.'); }
        } else {
          const title = String(form.get('title') || '').trim().slice(0, 100);
          const category = String(form.get('category') || '').trim().slice(0, 60);
          const description = String(form.get('description') || '').trim().slice(0, 700);
          const price = Number(form.get('price'));
          const deliveryDays = Number(form.get('deliveryDays') ?? 3);
          const revisionCount = Number(form.get('revisionCount') ?? 1);
          if (!title || !category || !description || !form.get('price')?.trim() ||
              !Number.isInteger(price) || price < 0 || price > 100000000 ||
              !Number.isInteger(deliveryDays) || deliveryDays < 1 || deliveryDays > 365 ||
              !Number.isInteger(revisionCount) || revisionCount < 0 || revisionCount > 20) {
            return sendHtml(res, 400, await dashboardStudioPage(profile, session, 'Periksa nama, kategori, deskripsi, harga, revisi, dan hari pengerjaan.'), { 'cache-control': 'no-store' });
          }
          const packageName = ['BASIC','PRO','EXCLUSIVE'].includes(form.get('packageName')) ? form.get('packageName') : 'BASIC';
          const fields = { title, category, description, packageName, price, deliveryDays, revisionCount };
          if (action === 'edit') {
            const updated = await DesignService.updateOne(serviceFilter, { $set: fields });
            if (!updated.matchedCount) { res.writeHead(404); return res.end('Layanan tidak ditemukan.'); }
          } else {
            await DesignService.create({
              serviceId: `SVC-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
              designerId: session.designerId, ownerJid: profile.ownerJid, ...fields, isActive: true,
            });
          }
        }
        const updated = await DesignerProfile.findOne({ designerId: session.designerId }).lean();
        return sendHtml(res, 200, await dashboardStudioPage(updated, session, 'Layanan berhasil diperbarui.'), { 'cache-control': 'no-store' });
      }
      if (parts[0] === 'client' && parts.length === 1 && req.method === 'GET') {
        const session = await getClientProjectSession(req);
        if (session) { res.writeHead(303,{location:`/client/projects/${encodeURIComponent(session.projectId)}`});return res.end(); }
        const body = `<section class="pv-client-confirmation pv-client-landing"><div class="pv-client-landing-inner"><span class="eyebrow">PIR VISUALS / CLIENT WORKSPACE</span><h1>One shared space.<br><em>Clear creative progress.</em></h1><p>Ruang privat untuk melihat perkembangan proyek, membaca update desainer, dan mengirim feedback tanpa kehilangan konteks.</p><div class="pv-invite-pending"><strong>Akses melalui undangan email.</strong><p>Setelah mengirim brief ke desainer, buka link undangan satu kali yang dikirim ke email kamu. Link berlaku 30 menit dan hanya dapat digunakan sekali.</p></div><a class="btn" href="/discover">Temukan desainer ↗</a></div></section>`;
        return sendHtml(res,200,pageShell('Client Workspace — PIR Visuals',body,{noIndex:true}),{'cache-control':'no-store'});
      }
      if (parts[0] === 'client' && parts[1] === 'access' && parts.length === 2 && ['GET', 'POST'].includes(req.method)) {
        const accessBudget = securityRateLimiter.consume(req, { scope: 'client-project-access', limit: 20, windowMs: 15 * 60 * 1000 });
        if (!accessBudget.allowed) { res.writeHead(429, { 'retry-after': String(accessBudget.retryAfterSeconds), 'cache-control': 'no-store' }); return res.end('Terlalu banyak percobaan akses. Coba lagi nanti.'); }
        const openingLink = req.method === 'GET';
        if (!openingLink && !isSameOriginRequest(req.headers)) {
          res.writeHead(403, { 'cache-control': 'no-store' });
          return res.end('Permintaan tidak valid.');
        }
        const token = String((openingLink ? url.searchParams : await readForm(req, 2048)).get('token') || '');
        if (!/^[a-f0-9]{64}$/.test(token)) return sendHtml(res, 400, pageShell('Link akses tidak valid', '<section class="card"><h1>Link akses tidak valid.</h1><p>Minta desainer mengirim undangan baru.</p></section>'), { 'cache-control':'no-store','referrer-policy':'no-referrer' });
        const now = new Date();
        const project = await ClientProject.findOne({ accessTokenHash:hashToken(token), accessTokenExpiresAt:{ $gt:now } }).lean();
        if (!project) return sendHtml(res, 410, pageShell('Link kedaluwarsa', '<section class="card"><h1>Link akses sudah digunakan atau kedaluwarsa.</h1><p>Minta desainer mengirim undangan ruang proyek yang baru.</p></section>'), { 'cache-control':'no-store','referrer-policy':'no-referrer' });
        if (openingLink) {
          const confirm = `<section class="card pv-client-confirmation"><h1>Buka ruang proyek</h1><p>Konfirmasi untuk menggunakan link undangan satu kali.</p><form method="post" action="/client/access"><input type="hidden" name="token" value="${escapeHtml(token)}"><button type="submit" class="btn">Buka ruang proyek</button></form></section>`;
          return sendHtml(res, 200, pageShell('Buka ruang proyek', confirm));
        }
        const consumed = await ClientProject.updateOne({ projectId:project.projectId, accessTokenHash:hashToken(token), accessTokenExpiresAt:{ $gt:now } }, { $set:{ accessTokenHash:'', accessTokenExpiresAt:null, accessTokenUsedAt:now } });
        if (consumed.modifiedCount !== 1) return sendHtml(res, 410, pageShell('Link sudah digunakan', '<section class="card"><h1>Link akses hanya dapat digunakan satu kali.</h1><p>Minta desainer mengirim undangan baru.</p></section>'), { 'cache-control':'no-store','referrer-policy':'no-referrer' });
        try {
          await issueClientProjectSession(res, project.projectId);
        } catch (error) {
          await ClientProject.updateOne(
            { projectId: project.projectId, accessTokenHash: '', accessTokenUsedAt: now },
            { $set: { accessTokenHash: hashToken(token), accessTokenExpiresAt: project.accessTokenExpiresAt, accessTokenUsedAt: null } },
          ).catch(() => {});
          throw error;
        }
        res.writeHead(303, { location:`/client/projects/${encodeURIComponent(project.projectId)}`, 'cache-control':'no-store', 'referrer-policy':'no-referrer' });
        return res.end();
      }
      if (parts[0] === 'client' && parts[1] === 'projects' && parts[2] && req.method === 'GET') {
        const session = await getClientProjectSession(req);
        if (!session || session.projectId !== parts[2]) return sendHtml(res, 401, pageShell('Akses client workspace', '<section class="card"><h1>Masuk ke ruang proyek.</h1><p>Buka link undangan aman yang dikirim melalui email. Jika link sudah kedaluwarsa, minta desainer mengirim undangan baru.</p></section>'), { 'cache-control':'no-store' });
        const [project, updates] = await Promise.all([
          ClientProject.findOne({ projectId:parts[2] }).lean(),
          findProjectActivity(parts[2]),
        ]);
        if (!project) { res.writeHead(404); return res.end('Project not found'); }
        const designer = await DesignerProfile.findOne({ designerId:project.designerId }).select('displayName contactPhone').lean();
        return sendHtml(res,200,renderClientProjectWorkspace(project,designer,updates,session),{'cache-control':'no-store','referrer-policy':'no-referrer'});
      }
      if (parts[0] === 'client' && parts[1] === 'projects' && parts[2] && parts[3] === 'message' && req.method === 'POST') {
        const session = await getClientProjectSession(req);
        if (!session || session.projectId !== parts[2]) { res.writeHead(401); return res.end('Unauthorized'); }
        const form = await readForm(req, 5 * 1024);
        if (!validClientCsrf(req,form,session)) { res.writeHead(403); return res.end('Permintaan tidak valid. Muat ulang halaman.'); }
        const message = String(form.get('message') || '').replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0,1500);
        if (message.length < 3 || !allowCount(req,`client-message:${session.projectId}`,30*1000)) { res.writeHead(400); return res.end('Pesan terlalu pendek atau terlalu sering dikirim.'); }
        const project = await ClientProject.findOne({ projectId:session.projectId }).lean();
        if (!project || ['completed','cancelled'].includes(project.status)) { res.writeHead(409); return res.end('Ruang proyek sudah ditutup.'); }
        await ClientProjectUpdate.create({ updateId:`UP-${crypto.randomBytes(8).toString('hex').toUpperCase()}`, projectId:project.projectId, authorRole:'client', authorName:project.clientName, message });
        await ClientProject.updateOne({ projectId:project.projectId }, { $set:{ lastActivityAt:new Date() } });
        await DesignerNotification.create({ notificationId:`NTF-${crypto.randomBytes(8).toString('hex')}`, designerId:project.designerId, type:'project_message', title:'Pesan baru dari klien', message:`${project.clientName} mengirim pesan pada ${project.title}.` });
        res.writeHead(303,{location:`/client/projects/${encodeURIComponent(project.projectId)}`,'cache-control':'no-store','referrer-policy':'no-referrer'});return res.end();
      }
      if (parts[0] === 'client' && parts[1] === 'logout' && parts.length === 2) {
        if (req.method !== 'POST') {
          res.writeHead(405, { allow: 'POST', 'cache-control': 'no-store' });
          return res.end();
        }
        const session = await getClientProjectSession(req);
        if (!validClientCsrf(req, await readForm(req, 2048), session)) {
          res.writeHead(403, { 'cache-control': 'no-store' });
          return res.end('Permintaan tidak valid.');
        }
        await ClientProjectSession.deleteOne({ tokenHash: hashToken(session.id) });
        const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
        res.writeHead(303, {
          location: '/client',
          'set-cookie': `pir_client_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secure}`,
          'cache-control': 'no-store',
          'referrer-policy': 'no-referrer',
        });
        return res.end();
      }
      if (parts[0] === 'studio' && parts[1] === 'lead' && parts[2] === 'workspace' && req.method === 'POST') {
        const session = await getDesignerSession(req);
        if (!session) { res.writeHead(302,{location:'/studio'});return res.end(); }
        const form = await readForm(req,4*1024);
        if (!validCsrf(req,form,session)) { res.writeHead(403);return res.end('Permintaan tidak valid.'); }
        const leadId = String(form.get('leadId') || '').trim().toUpperCase();
        const lead = await DesignerLead.findOne({leadId,designerId:session.designerId}).lean();
        if (!lead) { res.writeHead(404);return res.end('Lead not found'); }
        let project = await ClientProject.findOne({leadId,designerId:session.designerId}).lean();
        if (!project) {
          if (!lead.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) {
            const profile = await DesignerProfile.findOne({designerId:session.designerId}).lean();
            return sendHtml(res,400,await dashboardStudioPage(profile,session,'Lead lama belum memiliki email yang valid. Minta email klien sebelum membuat workspace privat.'),{'cache-control':'no-store'});
          }
          const projectId = `PRJ-${crypto.randomBytes(7).toString('hex').toUpperCase()}`;
          const title = (String(lead.brief).split(/[.!?\n]/)[0] || 'Proyek kreatif').trim().slice(0,110) || 'Proyek kreatif';
          project = await ClientProject.create({projectId,leadId,designerId:session.designerId,clientName:lead.clientName,email:lead.email,whatsapp:lead.whatsapp,title,brief:lead.brief,status:'brief_received',lastActivityAt:new Date()});
          await ClientProjectUpdate.create({updateId:`UP-${crypto.randomBytes(8).toString('hex').toUpperCase()}`,projectId,authorRole:'system',authorName:'PIR Visuals',message:'Ruang proyek privat dibuat dari lead yang sudah ada.',status:'brief_received'});
        }
        const token = crypto.randomBytes(32).toString('hex');
        await ClientProject.updateOne({projectId:project.projectId,designerId:session.designerId},{$set:{accessTokenHash:hashToken(token),accessTokenExpiresAt:new Date(Date.now()+30*60*1000),accessTokenUsedAt:null}});
        const profile = await DesignerProfile.findOne({designerId:session.designerId}).lean();
        try {
          await sendClientProjectAccessEmail(lead.email,token,project,profile.displayName);
          await markProjectLeadContacted({ leadId, designerId:session.designerId });
          res.writeHead(303,{location:`/studio/projects/${encodeURIComponent(project.projectId)}?notice=${encodeURIComponent('Client workspace dibuat dan undangan berhasil dikirim.')}`,'cache-control':'no-store','referrer-policy':'no-referrer'});return res.end();
        } catch(error) {
          await ClientProject.updateOne({projectId:project.projectId},{$set:{accessTokenHash:'',accessTokenExpiresAt:null}});
          console.error('[CLIENT PROJECT INVITE]',error.message);
          res.writeHead(303,{location:`/studio/projects/${encodeURIComponent(project.projectId)}?notice=${encodeURIComponent('Workspace dibuat, tetapi email belum terkirim. Periksa SMTP lalu kirim ulang undangan.')}`,'cache-control':'no-store','referrer-policy':'no-referrer'});return res.end();
        }
      }
      if (parts[0] === 'studio' && parts[1] === 'projects' && parts[2] && req.method === 'GET') {
        const session = await getDesignerSession(req);
        if (!session) { res.writeHead(302,{location:'/studio'});return res.end(); }
        const [profile,project,updates] = await Promise.all([
          DesignerProfile.findOne({designerId:session.designerId}).lean(),
          ClientProject.findOne({projectId:parts[2],designerId:session.designerId}).lean(),
          findProjectActivity(parts[2]),
        ]);
        if (!profile || !project) { res.writeHead(404);return res.end('Project not found'); }
        return sendHtml(res,200,renderDesignerProjectWorkspace(project,profile,updates,session,url.searchParams.get('notice')||''),{'cache-control':'no-store','referrer-policy':'no-referrer'});
      }
      if (parts[0] === 'studio' && parts[1] === 'projects' && parts[2] && parts[3] && req.method === 'POST') {
        const session = await getDesignerSession(req);
        if (!session) { res.writeHead(302,{location:'/studio'});return res.end(); }
        const form = await readForm(req,6*1024);
        if (!validCsrf(req,form,session)) { res.writeHead(403);return res.end('Permintaan tidak valid. Muat ulang halaman.'); }
        const project = await ClientProject.findOne({projectId:parts[2],designerId:session.designerId}).lean();
        const profile = await DesignerProfile.findOne({designerId:session.designerId}).lean();
        if (!project || !profile) { res.writeHead(404);return res.end('Project not found'); }
        if (parts[3] === 'invite') {
          const inviteBudget = securityRateLimiter.consume(req, { scope: 'client-project-invite', identity: session.designerId, limit: 10, windowMs: 15 * 60 * 1000 });
          if (!inviteBudget.allowed) return sendHtml(res, 429, renderDesignerProjectWorkspace(project, profile, await findProjectActivity(project.projectId), session, 'Batas pengiriman undangan tercapai. Coba lagi setelah beberapa menit.'), { 'cache-control':'no-store', 'referrer-policy':'no-referrer', 'retry-after':String(inviteBudget.retryAfterSeconds) });
          if (!project.email) return sendHtml(res,400,renderDesignerProjectWorkspace(project,profile,await findProjectActivity(project.projectId),session,'Email klien belum tersedia. Minta email klien terlebih dahulu.'),{'cache-control':'no-store','referrer-policy':'no-referrer'});
          const token = crypto.randomBytes(32).toString('hex');
          await ClientProject.updateOne({projectId:project.projectId,designerId:session.designerId},{ $set:{accessTokenHash:hashToken(token),accessTokenExpiresAt:new Date(Date.now()+30*60*1000),accessTokenUsedAt:null,clientAccessRevokedAt:null,clientAccessRevokedBy:''} });
          try {
            await sendClientProjectAccessEmail(project.email,token,project,profile.displayName);
            await markProjectLeadContacted(project);
            return sendHtml(res,200,renderDesignerProjectWorkspace(project,profile,await findProjectActivity(project.projectId),session,'Undangan akses baru berhasil dikirim ke email klien.'),{'cache-control':'no-store','referrer-policy':'no-referrer'});
          } catch(error) {
            await ClientProject.updateOne({projectId:project.projectId},{ $set:{accessTokenHash:'',accessTokenExpiresAt:null} });
            console.error('[CLIENT PROJECT INVITE]',error.message);
            return sendHtml(res,503,renderDesignerProjectWorkspace(project,profile,await findProjectActivity(project.projectId),session,'Email belum terkirim. Periksa konfigurasi SMTP website.'),{'cache-control':'no-store','referrer-policy':'no-referrer'});
          }
        }
        if (parts[3] === 'revoke-access') {
          if (String(form.get('confirmRevocation') || '') !== 'yes') {
            return sendHtml(res, 400, renderDesignerProjectWorkspace(project, profile, await findProjectActivity(project.projectId), session, 'Konfirmasi diperlukan sebelum semua akses klien dicabut.'), { 'cache-control':'no-store', 'referrer-policy':'no-referrer' });
          }
          const revoked = await ClientProjectSession.deleteMany({ projectId: project.projectId });
          await ClientProject.updateOne(
            { projectId: project.projectId, designerId: session.designerId },
            { $set: { accessTokenHash: '', accessTokenExpiresAt: null, clientAccessRevokedAt: new Date(), clientAccessRevokedBy: session.designerId } },
          );
          const refreshed = await ClientProject.findOne({ projectId: project.projectId, designerId: session.designerId }).lean();
          return sendHtml(
            res, 200,
            renderDesignerProjectWorkspace(refreshed || project, profile, await findProjectActivity(project.projectId), session, `Akses klien dicabut. ${revoked.deletedCount || 0} sesi aktif telah dinonaktifkan. Kamu dapat mengirim undangan baru kapan saja.`),
            { 'cache-control':'no-store', 'referrer-policy':'no-referrer' },
          );
        }
        if (parts[3] === 'update') {
          const message = String(form.get('message') || '').replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0,1500);
          const status = String(form.get('status') || project.status);
          const currentUpdates = () => findProjectActivity(project.projectId);
          if (isClientProjectClosed(project.status)) {
            return sendHtml(res,409,renderDesignerProjectWorkspace(project,profile,await currentUpdates(),session,'Proyek sudah ditutup. Riwayat tetap tersedia, tetapi status tidak dapat diubah kembali.'),{'cache-control':'no-store','referrer-policy':'no-referrer'});
          }
          const allowedStatuses = clientProjectStatusChoices(project.status);
          if (message.length < 3 || !allowedStatuses.includes(status)) {
            return sendHtml(res,400,renderDesignerProjectWorkspace(project,profile,await currentUpdates(),session,'Update tidak valid. Pilih tahap berikutnya yang tersedia dan tulis pesan minimal 3 karakter.'),{'cache-control':'no-store','referrer-policy':'no-referrer'});
          }
          const versionFilter = project.__v == null ? { __v:{ $exists:false } } : { __v:Number(project.__v) };
          const changed = await ClientProject.updateOne(
            { projectId:project.projectId, designerId:session.designerId, status:project.status, ...versionFilter },
            { $set:{ status, lastActivityAt:new Date() }, $inc:{ __v:1 } },
          );
          if (changed.modifiedCount !== 1) {
            const latestProject = await ClientProject.findOne({projectId:project.projectId,designerId:session.designerId}).lean() || project;
            return sendHtml(res,409,renderDesignerProjectWorkspace(latestProject,profile,await currentUpdates(),session,'Status proyek baru saja berubah di sesi lain. Periksa tahap terbaru sebelum mengirim update.'),{'cache-control':'no-store','referrer-policy':'no-referrer'});
          }
          await ClientProjectUpdate.create({updateId:`UP-${crypto.randomBytes(8).toString('hex').toUpperCase()}`,projectId:project.projectId,authorRole:'designer',authorName:profile.displayName,message,status});
          await syncLeadPipelineFromProject(project,status);
          await DesignerNotification.create({notificationId:`NTF-${crypto.randomBytes(8).toString('hex')}`,designerId:session.designerId,type:'project_update',title:'Update proyek dipublikasikan',message:`${project.title} · ${CLIENT_PROJECT_STATUS_LABELS[status] || status}`});
          try { await sendClientProjectUpdateEmail(project,profile.displayName,message,CLIENT_PROJECT_STATUS_LABELS[status] || status); } catch(error) { console.error('[CLIENT PROJECT UPDATE EMAIL]',error.message); }
          res.writeHead(303,{location:`/studio/projects/${encodeURIComponent(project.projectId)}`,'cache-control':'no-store','referrer-policy':'no-referrer'});return res.end();
        }
        res.writeHead(404);return res.end('Not found');
      }
      if (parts[0] === 'studio' && parts[1] === 'logout' && req.method === 'POST') {
        const session = await getDesignerSession(req);
        const form = await readForm(req, 4 * 1024);
        if (!session || !validCsrf(req, form, session)) {
          res.writeHead(403, { 'cache-control': 'no-store' });
          return res.end('Permintaan keluar tidak valid. Muat ulang Designer Studio lalu coba kembali.');
        }
        const id = cookieValue(req, 'pir_designer_session');
        if (id) await DesignerDashboardSession.deleteOne({ tokenHash: hashToken(id) });
        res.writeHead(303, { location: '/studio', 'cache-control': 'no-store', 'set-cookie': 'pir_designer_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0' });
        return res.end();
      }
      if (parts[0] === 'studio' && parts[1] === 'logout' && req.method === 'GET') {
        res.writeHead(405, { allow: 'POST', 'cache-control': 'no-store' });
        return res.end('Keluar akun harus dilakukan melalui formulir POST.');
      }
      if (parts[0] === 'studio' && req.method === 'GET') {
        const session = await getDesignerSession(req);
        if (!session) return sendHtml(res, 200, dashboardLoginPage(url.searchParams.get('password') === 'changed' ? 'Password berhasil diganti. Silakan login kembali.' : ''), { 'cache-control': 'no-store' });
        const profile = await DesignerProfile.findOne({ designerId: session.designerId }).lean();
        if (!profile) { await DesignerDashboardSession.deleteOne({ tokenHash: hashToken(cookieValue(req, 'pir_designer_session')) }); return sendHtml(res, 401, dashboardLoginPage('Profil tidak ditemukan.')); }
        const notice = url.searchParams.get('profileSaved') === '1' ? 'Profil berhasil disimpan.' : '';
        return sendHtml(res, 200, await dashboardStudioPage(profile, session, notice), { 'cache-control': 'no-store' });
      }
      if (parts[0] === 'admin' && parts[1] === 'media' && parts[2]) {
        if (!basicAuth(req, res)) return;
        const item = await PortfolioItem.findOne({ itemId: parts[2].toUpperCase() }).lean();
        if (!item?.imagePath) { res.writeHead(404); return res.end('Not found'); }
        const botRoot = path.resolve(process.env.BOT_DATA_ROOT || APP_ROOT);
        const uploadRoot = path.resolve(botRoot, process.env.PORTFOLIO_UPLOAD_DIR || 'uploads/portfolio');
        const file = path.resolve(botRoot, item.imagePath);
        if (!file.startsWith(`${uploadRoot}${path.sep}`)) { res.writeHead(404); return res.end('Not found'); }
        const ext = path.extname(file).toLowerCase();
        const type = ({ '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' })[ext];
        if (!type || !fs.existsSync(file)) { res.writeHead(404); return res.end('Not found'); }
        res.writeHead(200, { 'content-type': type, 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' });
        return fs.createReadStream(file).pipe(res);
      }
      if (parts[0] === 'dashboard' && parts[1] === 'work' && req.method === 'POST') {
        if (!basicAuth(req, res)) return;
        const { fields, files } = await readMultipart(req, PORTFOLIO_MAX_REQUEST_BYTES, { maxFiles: 5, maxFileBytes: PORTFOLIO_MAX_FILE_BYTES, fileSizeMessage: 'Setiap gambar karya maksimal 15 MB.' });
        const form = { get: key => fields.get(key) || '' };
        if (!isSameOriginRequest(req.headers)) { res.writeHead(403); return res.end('Origin tidak valid.'); }
        const csrfCookie = cookieValue(req, 'pir_owner_csrf');
        if (!csrfCookie || !sameHash(hashToken(String(form.get('csrf') || '')), hashToken(csrfCookie))) { res.writeHead(403); return res.end('Token keamanan Owner tidak valid.'); }
        const action = String(form.get('action') || '');
        if (!['create','update','delete'].includes(action) || files.some(file => file.fieldName !== 'mediaFile')) { res.writeHead(400); return res.end('Aksi pengelolaan karya tidak valid.'); }
        const clean = (key,max) => String(form.get(key) || '').replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0,max);
        const itemId = clean('itemId',32).toUpperCase();
        const designerId = clean('designerId',32).toUpperCase();
        const title = clean('title',100);
        const category = clean('category',60);
        const description = String(form.get('description') || '').replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g,'').trim().slice(0,800);
        const rawPrice = String(form.get('priceFrom') || '0').trim();
        const priceFrom = rawPrice === '' ? 0 : Number(rawPrice);
        const moderationStatus = ['pending','approved','rejected'].includes(String(form.get('moderationStatus') || '')) ? String(form.get('moderationStatus')) : 'pending';
        if (!Number.isFinite(priceFrom) || priceFrom < 0 || priceFrom > 100000000) { res.writeHead(400); return res.end('Harga karya tidak valid.'); }
        if (action !== 'delete' && (!/^DSN-[A-F0-9]{4,16}$/.test(designerId) || !title || !category)) { res.writeHead(400); return res.end('Desainer, judul, dan kategori wajib diisi.'); }
        if (action === 'create' && (!files.length || files.length > 5)) { res.writeHead(400); return res.end('Upload minimal satu gambar dan maksimal lima gambar untuk karya baru.'); }
        if (action === 'update' && (!/^ART-[A-F0-9]{4,16}$/.test(itemId) || files.length > 1)) { res.writeHead(400); return res.end('ID karya atau jumlah gambar pengganti tidak valid.'); }
        if (action === 'delete' && !/^ART-[A-F0-9]{4,16}$/.test(itemId)) { res.writeHead(400); return res.end('ID karya tidak valid.'); }
        const botRoot = path.resolve(process.env.BOT_DATA_ROOT || APP_ROOT);
        const uploadRoot = path.resolve(botRoot, process.env.PORTFOLIO_UPLOAD_DIR || 'uploads/portfolio');
        await fs.promises.mkdir(uploadRoot, { recursive: true });
        const saveFiles = async selectedFiles => {
          const outputPaths = [];
          try {
            for (const file of selectedFiles) {
              const outputPath = path.join(uploadRoot, safeImageName());
              await processPortfolioImage(file, outputPath, 'original');
              outputPaths.push(outputPath);
            }
            return { outputPaths, relativePaths: outputPaths.map(file => path.relative(botRoot, file).replace(/\\/g,'/')) };
          } catch (error) {
            await Promise.all(outputPaths.map(file => fs.promises.unlink(file).catch(() => {})));
            throw error;
          }
        };
        const deleteStoredMedia = async item => {
          const paths = [...new Set([item?.imagePath, ...(Array.isArray(item?.galleryPaths) ? item.galleryPaths : [])].filter(Boolean))];
          await Promise.all(paths.map(relative => {
            const target = path.resolve(botRoot, relative);
            if (!target.startsWith(`${uploadRoot}${path.sep}`)) return Promise.resolve();
            return fs.promises.unlink(target).catch(() => {});
          }));
        };
        if (action === 'delete') {
          const existing = await PortfolioItem.findOne({ itemId }).lean();
          if (!existing) { res.writeHead(404); return res.end('Karya tidak ditemukan.'); }
          await PortfolioItem.deleteOne({ itemId });
          await deleteStoredMedia(existing);
        } else {
          const profile = await DesignerProfile.findOne({ designerId }).lean();
          if (!profile) { res.writeHead(404); return res.end('Profil desainer tidak ditemukan.'); }
          const existing = action === 'update' ? await PortfolioItem.findOne({ itemId }).lean() : null;
          if (action === 'update' && !existing) { res.writeHead(404); return res.end('Karya tidak ditemukan.'); }
          let saved = { outputPaths: [], relativePaths: [] };
          try {
            if (files.length) saved = await saveFiles(files);
            const reviewFields = moderationStatus === 'approved'
              ? { reviewedBy:'website-owner', reviewedAt:new Date(), moderationReason:'' }
              : moderationStatus === 'rejected'
                ? { reviewedBy:'website-owner', reviewedAt:new Date(), moderationReason:clean('moderationReason',240) || 'Ditolak melalui dashboard Owner' }
                : { reviewedBy:'', reviewedAt:null, moderationReason:'Menunggu moderasi Owner' };
            if (action === 'create') {
              const itemIdNew = `ART-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
              await PortfolioItem.create({
                itemId:itemIdNew, designerId, ownerJid:profile.ownerJid || '', title, category, description,
                priceFrom:Math.round(priceFrom), featured:form.get('featured') === 'on', imagePath:saved.relativePaths[0], galleryPaths:saved.relativePaths,
                moderationStatus, createdAt:new Date(), updatedAt:new Date(), createdByOwner:true, ...reviewFields,
              });
            } else {
              const update = {
                designerId, ownerJid:profile.ownerJid || existing.ownerJid || '', title, category, description,
                priceFrom:Math.round(priceFrom), featured:form.get('featured') === 'on', moderationStatus,
                updatedAt:new Date(), ...reviewFields,
              };
              if (saved.relativePaths.length) {
                update.imagePath = saved.relativePaths[0];
                update.galleryPaths = saved.relativePaths;
              }
              await PortfolioItem.updateOne({ itemId }, { $set:update });
              if (saved.relativePaths.length) await deleteStoredMedia(existing);
            }
          } catch (error) {
            await Promise.all(saved.outputPaths.map(file => fs.promises.unlink(file).catch(() => {})));
            res.writeHead(400, { 'content-type':'text/plain; charset=utf-8', 'cache-control':'no-store' });
            return res.end(error.message || 'Perubahan karya tidak dapat disimpan.');
          }
        }
        res.writeHead(303, { location:'/dashboard#owner-works', 'cache-control':'no-store', 'referrer-policy':'no-referrer' }); return res.end();
      }
      if (parts[0] === 'dashboard' && parts[1] === 'designer' && req.method === 'POST') {
        if (!basicAuth(req,res)) return;
        if (!isSameOriginRequest(req.headers)) { res.writeHead(403); return res.end('Origin tidak valid.'); }
        const form = await readForm(req, 12 * 1024);
        const csrfCookie = cookieValue(req,'pir_owner_csrf');
        if (!csrfCookie || !sameHash(hashToken(String(form.get('csrf') || '')),hashToken(csrfCookie))) { res.writeHead(403); return res.end('Token keamanan Owner tidak valid.'); }
        const designerId = String(form.get('designerId') || '').trim().toUpperCase();
        if (!/^DSN-[A-F0-9]{4,16}$/.test(designerId)) { res.writeHead(400); return res.end('ID desainer tidak valid.'); }
        const priceMin = Math.max(0,Number(form.get('priceMin') || 0));
        const priceMax = Math.max(0,Number(form.get('priceMax') || 0));
        if (!Number.isFinite(priceMin) || !Number.isFinite(priceMax) || priceMin > 100000000 || priceMax > 100000000 || (priceMax > 0 && priceMin > priceMax)) { res.writeHead(400); return res.end('Rentang harga profil tidak valid.'); }
        const result = await DesignerProfile.updateOne({ designerId }, { $set:{
          isPublic:form.get('isPublic') === 'on', isVerified:form.get('isVerified') === 'on',
          isFeatured:form.get('isFeatured') === 'on', acceptsOrders:form.get('acceptsOrders') === 'on',
          priceMin:Math.round(priceMin), priceMax:Math.round(priceMax),
        } });
        if (!result.matchedCount) { res.writeHead(404); return res.end('Profil desainer tidak ditemukan.'); }
        res.writeHead(303,{location:'/dashboard#owner-designers','cache-control':'no-store','referrer-policy':'no-referrer'});return res.end();
      }
      if (parts[0] === 'dashboard' && parts[1] === 'support' && req.method === 'POST') {
        if (!basicAuth(req,res)) return;
        if(!isSameOriginRequest(req.headers)){res.writeHead(403);return res.end('Origin tidak valid.');}
        const form=await readForm(req),csrfCookie=cookieValue(req,'pir_owner_csrf');
        if(!csrfCookie||!sameHash(hashToken(String(form.get('csrf')||'')),hashToken(csrfCookie))){res.writeHead(403);return res.end('CSRF token tidak valid.');}
        const ticketId=String(form.get('ticketId')||'').trim(),status=String(form.get('status')||'');
        if(!/^SUP-[A-F0-9]{12}$/.test(ticketId)||!['in_progress','resolved','closed'].includes(status)){res.writeHead(400);return res.end('Status tiket tidak valid.');}
        const ticket = await SupportTicket.updateOne({ticketId},{$set:{status}});
        if (!ticket.matchedCount) { res.writeHead(404, { 'cache-control': 'no-store' }); return res.end('Tiket tidak ditemukan.'); }
        res.writeHead(303,{location:'/dashboard','cache-control':'no-store','referrer-policy':'no-referrer'});return res.end();
      }
      if (parts[0] === 'dashboard' && parts[1] === 'moderate' && req.method === 'POST') {
        if (!basicAuth(req, res)) return;
        if (!isSameOriginRequest(req.headers)) { res.writeHead(403); return res.end('Origin tidak valid.'); }
        const form = await readForm(req);
        const itemId = String(form.get('itemId') || '').trim().toUpperCase();
        const decision = String(form.get('decision') || '');
        const csrfCookie = cookieValue(req, 'pir_owner_csrf');
        if (!csrfCookie || !sameHash(hashToken(String(form.get('csrf') || '')), hashToken(csrfCookie))) { res.writeHead(403); return res.end('Token keamanan Owner tidak valid. Muat ulang dashboard.'); }
        const reason = String(form.get('reason') || '').trim().slice(0, 240);
        if (!/^ART-[A-F0-9]{4,16}$/.test(itemId) || !['approve', 'reject'].includes(decision)) { res.writeHead(400); return res.end('Data moderasi tidak valid.'); }
        const update = decision === 'approve'
          ? { moderationStatus: 'approved', reviewedBy: 'website-owner', reviewedAt: new Date(), moderationReason: '' }
          : { moderationStatus: 'rejected', reviewedBy: 'website-owner', reviewedAt: new Date(), moderationReason: reason || 'Ditolak melalui dashboard Owner' };
        const moderation = await PortfolioItem.updateOne({ itemId, moderationStatus: 'pending' }, { $set: update });
        if (!moderation.matchedCount) {
          return sendHtml(res, 409, pageShell('Antrean moderasi berubah', '<section class="card"><h1>Karya sudah keluar dari antrean.</h1><p>Muat ulang dasbor untuk melihat status terbaru.</p><a class="btn" href="/dashboard">Kembali ke dasbor</a></section>'));
        }
        res.writeHead(303, { location: '/dashboard', 'cache-control': 'no-store' }); return res.end();
      }
      if (parts[0] === 'dashboard' && parts[1] === 'review' && req.method === 'POST') {
        if (!basicAuth(req,res)) return;
        const form=await readForm(req);
        if(!isSameOriginRequest(req.headers)){res.writeHead(403);return res.end('Origin tidak valid.');}
        const csrfCookie=cookieValue(req,'pir_owner_csrf');
        if(!csrfCookie||!sameHash(hashToken(String(form.get('csrf')||'')),hashToken(csrfCookie))){res.writeHead(403);return res.end('Token keamanan Owner tidak valid.');}
        const id=String(form.get('testimonialId')||''), decision=String(form.get('decision')||'');
        if(!['approve','reject'].includes(decision)){res.writeHead(400);return res.end('Keputusan tidak valid.');}
        const review = await DesignerTestimonial.updateOne({testimonialId:id,emailVerified:true},{$set:{isPublished:decision==='approve',moderatedAt:new Date(),moderatedBy:'website-owner'}});
        if (!review.matchedCount) { res.writeHead(404, { 'cache-control': 'no-store' }); return res.end('Ulasan terverifikasi tidak ditemukan.'); }
        res.writeHead(303,{location:'/dashboard','cache-control':'no-store','referrer-policy':'no-referrer'});return res.end();
      }
      if (parts[0] === 'dashboard' && parts[1] === 'content' && req.method === 'POST') {
        if (!basicAuth(req,res)) return;
        const { fields, files } = await readMultipart(req, HOMEPAGE_MEDIA_MAX_REQUEST_BYTES, { maxFiles: 12, maxFileBytes: HOMEPAGE_MEDIA_MAX_FILE_BYTES, fileSizeMessage: 'Media Beranda maksimal 50 MB per file.' });
        const form = { get: key => fields.get(key) || '' };
        if (!isSameOriginRequest(req.headers)) { res.writeHead(403); return res.end('Origin tidak valid.'); }
        const csrfCookie = cookieValue(req,'pir_owner_csrf');
        if (!csrfCookie || !sameHash(hashToken(String(form.get('csrf')||'')),hashToken(csrfCookie))) { res.writeHead(403); return res.end('Token keamanan Owner tidak valid.'); }
        const clean=(k,n)=>String(form.get(k)||'').replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0,n);
        const cleanMultiline=(k,n)=>String(form.get(k)||'').replace(/\r\n?/g,'\n').replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g,'').trim().slice(0,n);
        const cleanLink=(key,max,fallback='')=>{
          const value=clean(key,max);
          if(value.startsWith('/') && !value.startsWith('//')) return value;
          try { const parsed=new URL(value); return parsed.protocol==='https:' ? parsed.href : fallback; } catch { return fallback; }
        };
        const existingContent=await PortfolioSiteContent.findOne({key:'homepage'}).lean();
        const existingValue=existingContent?.value && typeof existingContent.value==='object' ? existingContent.value : {};
        const existingSlides=Array.isArray(existingValue.slides) ? existingValue.slides : [];
        const existingHomeWorks=Array.isArray(existingValue.homeWorks) ? existingValue.homeWorks : [];
        const existingEvents=Array.isArray(existingValue.events) ? existingValue.events : [];
        const botRoot = path.resolve(process.env.BOT_DATA_ROOT || APP_ROOT);
        const uploadRoot = path.resolve(botRoot, process.env.PORTFOLIO_UPLOAD_DIR || 'uploads/portfolio');
        const mediaRoot = path.join(uploadRoot, 'homepage');
        const newMediaPaths=[];
        const oldMediaPaths=[];
        const allowedMediaFields=new Set(['slide0MediaFile','slide1MediaFile','slide2MediaFile','homeWork0MediaFile','homeWork1MediaFile','homeWork2MediaFile','homeWork3MediaFile','event0MediaFile','event1MediaFile','event2MediaFile','event3MediaFile','event4MediaFile']);
        if(files.some(file=>!allowedMediaFields.has(file.fieldName)) || files.some(file=>files.filter(other=>other.fieldName===file.fieldName).length>1)) {
          res.writeHead(400, {'cache-control':'no-store'}); return res.end('Setiap slot Beranda hanya boleh memiliki satu file media.');
        }
        let slides;
        try {
          slides = [];
          for (let i=0;i<3;i++) {
            const previous=existingSlides[i] && typeof existingSlides[i]==='object' ? existingSlides[i] : {};
            const uploaded=files.find(file=>file.fieldName===`slide${i}MediaFile`);
            let media=String(previous.media || '');
            let mediaType=previous.mediaType==='video'?'video':'image';
            let image=cleanLink(`slide${i}Image`,500,'');
            if (form.get(`slide${i}RemoveMedia`)==='on') {
              if (media.startsWith('/homepage-media/')) oldMediaPaths.push(media);
              media=''; mediaType='image'; image='';
            }
            if (uploaded) {
              const saved=await saveHomepageMediaFile(uploaded,mediaRoot);
              media=`/homepage-media/${saved.filename}`;
              mediaType=saved.mediaType;
              image='';
              newMediaPaths.push(path.join(mediaRoot,saved.filename));
              if (String(previous.media || '').startsWith('/homepage-media/')) oldMediaPaths.push(String(previous.media));
            } else if (image && image !== String(previous.image || '')) {
              if (String(previous.media || '').startsWith('/homepage-media/')) oldMediaPaths.push(String(previous.media));
              media=''; mediaType='image';
            } else if (!image && previous.image && !media) {
              image='';
            } else if (!image && previous.image && media) {
              image='';
            } else if (image === String(previous.image || '') && media) {
              // Keep an independently uploaded asset when the URL field is left untouched.
            }
            const slide={
              enabled: form.get(`slide${i}Enabled`) === 'on',
              eyebrow: clean(`slide${i}Eyebrow`,60),
              kind: clean(`slide${i}Kind`,30),
              title: clean(`slide${i}Title`,100),
              description: clean(`slide${i}Description`,220),
              image, media, mediaType,
              href: cleanLink(`slide${i}Href`,500,'/discover'),
              cta: clean(`slide${i}Cta`,40),
            };
            slides.push(slide);
            if(!slide.title && media.startsWith('/homepage-media/')) oldMediaPaths.push(media);
          }
        } catch(error) {
          await Promise.all(newMediaPaths.map(file=>fs.promises.unlink(file).catch(()=>{})));
          res.writeHead(400, {'content-type':'text/plain; charset=utf-8','cache-control':'no-store'});
          return res.end(error.message || 'Media Beranda gagal diproses.');
        }
        let homeWorks;
        try {
          homeWorks=[];
          for(let i=0;i<4;i++){
            const previous=existingHomeWorks[i] && typeof existingHomeWorks[i]==='object' ? existingHomeWorks[i] : {};
            const uploaded=files.find(file=>file.fieldName===`homeWork${i}MediaFile`);
            let media=String(previous.media || '');
            let mediaType=previous.mediaType==='video'?'video':'image';
            if(form.get(`homeWork${i}RemoveMedia`)==='on'){
              if(media.startsWith('/homepage-media/')) oldMediaPaths.push(media);
              media=''; mediaType='image';
            }
            if(uploaded){
              const saved=await saveHomepageMediaFile(uploaded,mediaRoot);
              media=`/homepage-media/${saved.filename}`;
              mediaType=saved.mediaType;
              newMediaPaths.push(path.join(mediaRoot,saved.filename));
              if(String(previous.media || '').startsWith('/homepage-media/')) oldMediaPaths.push(String(previous.media));
            }
            const title=clean(`homeWork${i}Title`,80);
            const description=clean(`homeWork${i}Description`,180);
            const href=cleanLink(`homeWork${i}Href`,500,'/discover');
            if(!media){
              if(previous.media && String(previous.media).startsWith('/homepage-media/')) oldMediaPaths.push(String(previous.media));
              homeWorks.push({title:'',description:'',media:'',mediaType:'image',href:'/discover'});
            }else{
              homeWorks.push({title:title || `Media pilihan ${i+1}`,description,media,mediaType,href});
            }
          }
        } catch(error) {
          await Promise.all(newMediaPaths.map(file=>fs.promises.unlink(file).catch(()=>{})));
          res.writeHead(400, {'content-type':'text/plain; charset=utf-8','cache-control':'no-store'});
          return res.end(error.message || 'Media karya pilihan Beranda gagal diproses.');
        }
        let events;
        try {
          events=[];
          for(let i=0;i<5;i++){
            const previous=existingEvents[i] && typeof existingEvents[i]==='object' ? existingEvents[i] : {};
            const uploaded=files.find(file=>file.fieldName===`event${i}MediaFile`);
            let media=String(previous.media || '');
            let mediaType=previous.mediaType==='video'?'video':'image';
            if(form.get(`event${i}RemoveMedia`)==='on'){
              if(media.startsWith('/homepage-media/')) oldMediaPaths.push(media);
              media=''; mediaType='image';
            }
            if(uploaded){
              const saved=await saveHomepageMediaFile(uploaded,mediaRoot);
              media=`/homepage-media/${saved.filename}`;
              mediaType=saved.mediaType;
              newMediaPaths.push(path.join(mediaRoot,saved.filename));
              if(String(previous.media || '').startsWith('/homepage-media/')) oldMediaPaths.push(String(previous.media));
            }
            const title=clean(`event${i}Title`,100);
            const dateInput=clean(`event${i}Date`,10);
            const date=/^\d{4}-\d{2}-\d{2}$/.test(dateInput) ? dateInput : '';
            const description=clean(`event${i}Description`,220);
            const kind=['Event','Workshop','Competition','Promo','Announcement'].includes(clean(`event${i}Kind`,20)) ? clean(`event${i}Kind`,20) : 'Event';
            const href=cleanLink(`event${i}Href`,500,'/contact');
            if(!title){
              if(media.startsWith('/homepage-media/')) oldMediaPaths.push(media);
              events.push({eventId:previous.eventId || '',title:'',date:'',kind:'Event',description:'',media:'',mediaType:'image',href:'/contact',enabled:false});
              continue;
            }
            events.push({eventId:previous.eventId || `EVT-${crypto.randomBytes(5).toString('hex').toUpperCase()}`,title,date,kind,description,media,mediaType,href,enabled:form.get(`event${i}Enabled`)==='on'});
          }
        } catch(error) {
          await Promise.all(newMediaPaths.map(file=>fs.promises.unlink(file).catch(()=>{})));
          res.writeHead(400, {'content-type':'text/plain; charset=utf-8','cache-control':'no-store'});
          return res.end(error.message || 'Event PIR Visuals gagal diproses.');
        }
        const sectionKeys=['categories','talent','work','manifesto','join','faq'];
        const layout=Object.fromEntries(sectionKeys.map((key,index)=>{
          const rawOrder=Number.parseInt(form.get(`section${key}Order`)||String(index+1),10);
          return [key,{enabled:form.get(`section${key}Enabled`)==='on',order:Number.isInteger(rawOrder)?Math.max(1,Math.min(6,rawOrder)):index+1}];
        }));
        layout.showcase={enabled:true,order:0};
        const copyFields=[
          ['categoryLabel',70],['categoryTitle',120],['categoryDescription',300],
          ['talentLabel',70],['talentTitle',120],['workLabel',70],['workTitle',120],['workDescription',300],
          ['manifestoLabel',70],['manifestoTitle',150],['manifestoDescription',500],
          ['joinLabel',70],['joinTitle',150],['joinDescription',300],['joinCta',50],['faqLabel',70],['faqTitle',100],
        ];
        const copy=Object.fromEntries(copyFields.map(([key,max])=>[key,cleanMultiline(`copy${key}`,max)]));
        const faqCountValue=Number.parseInt(String(form.get('faqCount') || '3'),10);
        const faqCount=Number.isInteger(faqCountValue)?Math.max(0,Math.min(20,faqCountValue)):3;
        copy.faq=Array.from({length:faqCount},(_,index)=>({
          question:cleanMultiline(`faq${index}Question`,140),
          answer:cleanMultiline(`faq${index}Answer`,400),
        })).filter(item=>item.question && item.answer);
        const categoryDefinitions=[
          ['Brand Identity','category0'],['UI/UX Design','category1'],['Graphic Design','category2'],['Illustration','category3'],
          ['Motion Design','category4'],['3D Design','category5'],['Packaging','category6'],['Social Media','category7'],
          ['Web Design','category8'],['Photography','category9'],
        ];
        const categorySettings=Object.fromEntries(categoryDefinitions.map(([title,prefix])=>[title,{
          enabled:form.get(`${prefix}Enabled`)==='on',
          description:clean(`${prefix}Description`,220),
        }]));
        const seoImageValue=cleanLink('seoImage',500,'');
        const value={
          ...existingValue,
          title:clean('title',120) || 'Ide hebat layak bertemu talenta yang tepat.',
          subtitle:clean('subtitle',300),
          announcement:clean('announcement',180),
          slides:existingSlides,homeWorks,events,layout,copy,categorySettings,
          seoTitle:clean('seoTitle',100),
          seoDescription:clean('seoDescription',300),
          seoImage:/^https:\/\//i.test(seoImageValue)?seoImageValue:'',
        };
        try {
          await PortfolioSiteContent.findOneAndUpdate({key:'homepage'},{$set:{value,updatedBy:'owner'}},{upsert:true,new:true});
        } catch(error) {
          await Promise.all(newMediaPaths.map(file=>fs.promises.unlink(file).catch(()=>{})));
          throw error;
        }
        const retainedMedia=new Set([...existingSlides,...homeWorks,...events].map(item=>item.media).filter(media=>typeof media==='string' && media.startsWith('/homepage-media/')));
        const safeOldMedia=[...new Set(oldMediaPaths)].filter(media=>media.startsWith('/homepage-media/'));
        await Promise.all(safeOldMedia.filter(media=>!retainedMedia.has(media)).map(media=>{
          const filename=media.slice('/homepage-media/'.length);
          if(!/^home-[A-Za-z0-9_-]{20,40}\.(?:webp|mp4|webm)$/.test(filename)) return Promise.resolve();
          const target=path.resolve(mediaRoot,filename);
          if(!target.startsWith(`${mediaRoot}${path.sep}`)) return Promise.resolve();
          return fs.promises.unlink(target).catch(()=>{});
        }));
        res.writeHead(303,{location:'/dashboard','cache-control':'no-store','referrer-policy':'no-referrer'});return res.end();
      }
      if (parts[0] === 'dashboard') {
        if (!basicAuth(req, res)) return;
        const csrf = crypto.randomBytes(24).toString('hex');
        const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
        return sendHtml(res, 200, await renderDashboard(csrf), { 'cache-control': 'no-store', 'set-cookie': `pir_owner_csrf=${csrf}; HttpOnly; SameSite=Strict; Path=/dashboard; Max-Age=1800${secure}` });
      }
      if (parts[0] === 'api' && parts[1] === 'track' && req.method === 'POST') {
        if (!isSameOriginRequest(req.headers)) { res.writeHead(403); return res.end(); }
        const form = await readForm(req, 4096);
        const eventType = String(form.get('eventType') || '');
        if (!['page_view','project_view','campaign_click','category_click','search','contact_click'].includes(eventType)) { res.writeHead(400); return res.end(); }
        const rawPath = String(form.get('path') || '/').split('?')[0].replace(/[\u0000-\u001f\u007f]/g,'').slice(0,160);
        const safePath = rawPath.startsWith('/') && !rawPath.startsWith('//') ? rawPath : '/';
        const pathParts = safePath.split('/').filter(Boolean);
        const trackedPath = safePath === '/' ||
          (pathParts.length === 1 && ['discover','categories','about','contact','how-it-works','collections','favorites','shortlist'].includes(pathParts[0])) ||
          (pathParts.length === 2 && ['p','designer','work'].includes(pathParts[0]) && /^[A-Za-z0-9_-]+$/.test(pathParts[1]));
        if (!trackedPath) { res.writeHead(204, {'cache-control':'no-store'}); return res.end(); }
        const campaignId = String(form.get('campaignId') || '').trim();
        const safeCampaign = /^(?:cms-slide-[1-3]|featured-designer|latest-portfolio)$/.test(campaignId) ? campaignId : '';
        const category = String(form.get('category') || '').trim().slice(0,60);
        const allowedCategories = ['Brand Identity','UI/UX Design','Graphic Design','Illustration','Motion Design','3D Design','Packaging','Social Media','Web Design','Photography'];
        const safeCategory = allowedCategories.find(item => item.toLowerCase() === category.toLowerCase()) || '';
        const designerId = String(form.get('designerId') || '').trim().toUpperCase();
        const itemId = String(form.get('itemId') || '').trim().toUpperCase();
        const safeDesignerId = /^[A-Z0-9_-]{2,48}$/.test(designerId) ? designerId : '';
        const safeItemId = /^[A-Z0-9_-]{2,48}$/.test(itemId) ? itemId : '';
        if ((eventType === 'campaign_click' && (!safeCampaign || safePath !== '/')) ||
            (eventType === 'category_click' && !safeCategory) ||
            (eventType === 'search' && safePath !== '/discover') ||
            (eventType === 'project_view' && (!safeDesignerId || !safeItemId || !/^\/work\/[A-Z0-9_-]{2,48}$/i.test(safePath) || safePath.split('/').pop().toUpperCase() !== safeItemId))) {
          res.writeHead(204, {'cache-control':'no-store'}); return res.end();
        }
        const rateKey = `${eventType}:${safePath}:${safeCampaign || safeCategory || safeItemId}`;
        if (!allowCount(req, `site-event:${rateKey}`, eventType === 'page_view' ? 60 * 1000 : 2500)) { res.writeHead(204, {'cache-control':'no-store'}); return res.end(); }
        await SiteAnalyticsEvent.create({
          eventId: `EV-${crypto.randomBytes(10).toString('hex').toUpperCase()}`,
          eventType, path: safePath, campaignId: safeCampaign, category: safeCategory,
          designerId: eventType === 'project_view' ? safeDesignerId : '',
          itemId: eventType === 'project_view' ? safeItemId : '',
        });
        res.writeHead(204, {'cache-control':'no-store','x-content-type-options':'nosniff'}); return res.end();
      }
      if (parts[0] === 'api' && parts[1] === 'designers' && req.method === 'GET') {
        const ids = [...new Set(String(url.searchParams.get('ids') || '').split(',').map(x => x.trim()).filter(x => /^[A-Z0-9_-]{2,48}$/i.test(x)).slice(0, 50))];
        if (!ids.length) { res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }); return res.end(JSON.stringify({ designers: [] })); }
        const designers = await DesignerProfile.find({ designerId: { $in: ids }, isPublic: true }).select('designerId slug displayName location bio specialties priceMin isFeatured isVerified acceptsOrders contactPhone publicWhatsApp').limit(50).lean();
        res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' });
        return res.end(JSON.stringify({ designers: designers.map(d => ({ designerId: d.designerId, displayName: d.displayName || 'Designer', slug: d.slug || '', location: d.location || '', bio: String(d.bio || '').slice(0,220), specialties: (d.specialties || []).slice(0,8), priceMin: Number(d.priceMin || 0), isVerified: !!d.isVerified, isFeatured: !!d.isFeatured, acceptsOrders: !!d.acceptsOrders, hasDirectContact: Boolean(getPublicContactPhone(d)), profileUrl: d.slug ? `/p/${encodeURIComponent(d.slug)}` : `/designer/${encodeURIComponent(d.designerId)}`, card: designerCard(d) })) }));
      }
      if (parts[0] === 'categories' && req.method === 'GET') {
        const categories = [
          { title:'Brand Identity', description:'Identitas yang konsisten, dari logo hingga sistem visual yang membangun karakter brand.', glyph:'Aa', terms:['brand','branding','identity','logo'] },
          { title:'UI/UX Design', description:'Pengalaman digital yang intuitif, terarah, dan terasa mudah digunakan.', glyph:'⌘', terms:['ui/ux','ui ux','user interface','user experience','product design'] },
          { title:'Graphic Design', description:'Komunikasi visual untuk campaign, editorial, poster, dan kebutuhan komunikasi brand.', glyph:'✳', terms:['graphic','poster','editorial','layout'] },
          { title:'Illustration', description:'Bahasa visual yang khas melalui karakter, gambar, dan cerita ilustratif.', glyph:'◉', terms:['illustration','illustrator','ilustrasi'] },
          { title:'Motion Design', description:'Gerak, ritme, dan storytelling untuk membuat pesan lebih hidup.', glyph:'↗', terms:['motion','animation','animasi'] },
          { title:'3D Design', description:'Bentuk, ruang, material, dan visualisasi tiga dimensi.', glyph:'3D', terms:['3d','three-dimensional','render','cgi'] },
          { title:'Packaging', description:'Kemasan yang menarik perhatian sekaligus menyampaikan karakter produk.', glyph:'▧', terms:['packaging','kemasan','label'] },
          { title:'Social Media', description:'Konten dan sistem visual yang dirancang untuk kanal sosial.', glyph:'#', terms:['social media','social','content','feed'] },
          { title:'Web Design', description:'Website dan landing page yang menghubungkan estetika dengan tujuan bisnis.', glyph:'⌘', terms:['web','website','landing page'] },
          { title:'Photography', description:'Foto produk, portrait, dan visual storytelling dengan perspektif yang kuat.', glyph:'◌', terms:['photo','photography','fotografi'] },
        ];
        const categoryCmsDoc = await PortfolioSiteContent.findOne({ key:'homepage' }).lean();
        const categorySettings = categoryCmsDoc?.value?.categorySettings && typeof categoryCmsDoc.value.categorySettings === 'object' ? categoryCmsDoc.value.categorySettings : {};
        const visibleCategories = categories.map(category => {
          const setting = categorySettings[category.title] && typeof categorySettings[category.title] === 'object' ? categorySettings[category.title] : {};
          return { ...category, description:String(setting.description || category.description).slice(0,220), enabled:setting.enabled !== false };
        }).filter(category => category.enabled);
        const countFor = async (Model, field, terms, extraFilter) => {
          const escaped = terms.map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
          const expression = new RegExp(escaped.join('|'), 'i');
          return Model.countDocuments({ ...extraFilter, $or:[{ [field]:expression }, { [field === 'category' ? 'specialties' : 'styles']:expression }] });
        };
        const [categoryStats, latestCandidates] = await Promise.all([
          Promise.all(visibleCategories.map(async category => {
            const [designers, projects] = await Promise.all([
              countFor(DesignerProfile, 'category', category.terms, { isPublic:true }),
              countFor(PortfolioItem, 'category', category.terms, { moderationStatus:'approved' }),
            ]);
            return { designers, projects };
          })),
          PortfolioItem.find({ moderationStatus:'approved' }).sort({ featured:-1, createdAt:-1 }).limit(12).lean(),
        ]);
        const latestProfiles = latestCandidates.length ? await DesignerProfile.find({
          designerId:{ $in:latestCandidates.map(work => work.designerId) }, isPublic:true,
        }).select('designerId displayName slug').lean() : [];
        const profileById = new Map(latestProfiles.map(profile => [profile.designerId, profile]));
        const latestWorks = latestCandidates.filter(work => profileById.has(work.designerId)).slice(0,3);
        const cards = visibleCategories.map((category, index) => {
          const stats = categoryStats[index];
          const number = String(index + 1).padStart(2, '0');
          return `<a class="category-tile category-tone-${index+1}" href="/discover?category=${encodeURIComponent(category.title)}">
            <div class="category-tile-top"><span>${number} / EXPLORE</span><span>${stats.designers.toLocaleString('id-ID')} TALENTS</span></div>
            <div class="category-tile-art" aria-hidden="true"><span>${escapeHtml(category.glyph)}</span><i></i></div>
            <div class="category-tile-copy"><h2>${escapeHtml(category.title)}</h2><p>${escapeHtml(category.description)}</p>
              <div class="category-tile-foot"><span>${stats.projects.toLocaleString('id-ID')} PUBLISHED PROJECTS</span><b>Explore <span class="pv-link-arrow" aria-hidden="true">↗</span></b></div></div>
          </a>`;
        }).join('');
        const latestMarkup = latestWorks.map((work, index) => {
          const designer = profileById.get(work.designerId);
          const designerHref = designer ? (designer.slug ? `/p/${encodeURIComponent(designer.slug)}` : `/designer/${encodeURIComponent(designer.designerId)}`) : '/discover';
          return `<a class="category-recent-card" href="/work/${encodeURIComponent(work.itemId)}">
            <div class="category-recent-image"><img loading="lazy" decoding="async" src="/media/${encodeURIComponent(work.itemId)}" alt="${escapeHtml(work.title || 'Selected creative work')}"><span>0${index+1}</span></div>
            <div class="category-recent-caption"><div><small>${escapeHtml(work.category || 'SELECTED WORK')}</small><strong>${escapeHtml(work.title || 'Untitled project')}</strong><span>By ${escapeHtml(designer?.displayName || 'PIR Visuals creator')}</span></div><b>↗</b></div>
          </a>`;
        }).join('');
        const categoryBody = `<div class="category-editorial">
          <header class="category-intro"><div class="category-intro-copy"><span class="eyebrow">THE CREATIVE INDEX / PIR VISUALS</span>
            <h1>Find your<br><em>creative language.</em></h1>
            <p>Setiap kebutuhan visual punya pendekatan yang berbeda. Mulai dari spesialisasi, lalu temukan kreator melalui karya dan cara mereka berpikir.</p>
          </div><aside class="category-intro-note"><span>${visibleCategories.length} CREATIVE DISCIPLINES</span><strong>One idea.<br>Many ways to make it real.</strong><p>Jelajahi bidang kreatif, bandingkan portfolio, dan temukan partner yang tepat untuk proyekmu.</p><a href="/discover">Explore all designers ↗</a></aside></header>
          <section class="category-index"><div class="category-index-heading"><div><span class="eyebrow">01 / FIND YOUR FIELD</span><h2>Choose a discipline<span>.</span></h2></div><p>Temukan jalur kreatif yang sesuai dengan kebutuhanmu, lalu jelajahi talenta dan karya yang relevan.</p></div><div class="category-tile-grid">${cards}</div></section>
          ${latestMarkup ? `<section class="category-recent"><div class="category-index-heading"><div><span class="eyebrow">02 / FROM THE COMMUNITY</span><h2>Recently made<span>.</span></h2></div><a href="/discover">Browse the full directory ↗</a></div><div class="category-recent-grid">${latestMarkup}</div></section>` : ''}
        </div>`;
        return sendHtml(res, 200, pageShell('Kategori Desain — PIR Visuals', categoryBody), { 'cache-control': 'public, max-age=180' });
      }
      if (parts[0] === 'discover' && req.method === 'GET') {
        return sendHtml(res, 200, await renderDirectory(url), { 'cache-control': 'no-store' });
      }
      if (parts[0] === 'for-business' && parts.length === 1 && req.method === 'GET') {
        return sendHtml(res, 200, renderInfoPage('for-business'), { 'cache-control': 'public, max-age=300' });
      }
      if (['about', 'how-it-works', 'privacy', 'terms', 'contact'].includes(parts[0]) && parts.length === 1 && req.method === 'GET') {
        return sendHtml(res, 200, renderInfoPage(parts[0]), { 'cache-control': 'public, max-age=300' });
      }
      if (parts.length === 0 && req.method === 'GET') {
        const previewMode = url.searchParams.get('preview') === '1';
        const previewFrameHeaders = previewMode ? {
          'x-frame-options': 'SAMEORIGIN',
          'content-security-policy': "default-src 'self'; script-src 'self'; connect-src 'self'; img-src 'self' data: https: blob:; media-src 'self' data: blob: https:; style-src 'self' 'unsafe-inline'; font-src 'self' data:; form-action 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'self';",
        } : {};
        return sendHtml(res, 200, await renderHome(), { 'cache-control': previewMode ? 'no-store' : 'public, max-age=60', ...previewFrameHeaders });
      }
      if (parts[0] === 'favorites' && req.method === 'GET') {
        const body = `<section class="hero"><span class="eyebrow">Your shortlist</span><h1>Desainer favoritmu.</h1><p class="muted">Daftar favorit tersimpan di browser perangkat ini. Tidak perlu membuat akun klien.</p></section><section id="favorite-results" class="grid"><p class="muted">Memuat favorit...</p></section>`;
        return sendHtml(res, 200, pageShell('PIR Visuals — Favorit', body), { 'cache-control': 'no-store' });
      }
      if (!['designer', 'p', 'review', 'work'].includes(parts[0]) || !parts[1]) {
        return sendHtml(res, 200, await renderDirectory(url), { 'cache-control': 'no-store' });
      }
      if (parts[0] === 'review' && parts[1] && req.method === 'POST') {
        const designerId=String(parts[1]).toUpperCase(), form=await readForm(req,12*1024);
        const profile=await DesignerProfile.findOne({designerId,isPublic:true}).select('designerId').lean();
        const clean=(k,n)=>String(form.get(k)||'').replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0,n);
        const clientName=clean('clientName',80), email=clean('email',254).toLowerCase(), project=clean('project',100), message=clean('message',700), rating=Math.max(1,Math.min(5,Number(form.get('rating')||5)));
        if(!profile||clientName.length<2||message.length<20||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!allowCount(req,`review:${designerId}:${email}`,600000)){res.writeHead(400);return res.end('Ulasan tidak valid atau terlalu sering dikirim.');}
        const token=crypto.randomBytes(32).toString('hex'), testimonialId=`REV-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
        try {
          await DesignerTestimonial.create({testimonialId,designerId,clientName,project,message,rating,isPublished:false,emailVerified:false,reviewerEmailHash:hashToken(email),verificationTokenHash:hashToken(token),verificationExpiresAt:new Date(Date.now()+1800000)});
        } catch (error) {
          if (error?.code === 11000) return sendHtml(res, 409, pageShell('Ulasan sudah dikirim', '<section class="card"><h1>Email ini sudah pernah mengirim ulasan untuk desainer tersebut.</h1><p class="muted">Setiap alamat email hanya dapat mengirim satu ulasan per desainer.</p></section>'));
          throw error;
        }
        const base=String(process.env.PORTFOLIO_PUBLIC_BASE_URL||'').replace(/\/$/,'');
        const link=`${base}/review/verify?id=${encodeURIComponent(testimonialId)}&token=${encodeURIComponent(token)}`;
        try {
          const transport=nodemailer.createTransport({host:process.env.SMTP_HOST,port:Number(process.env.SMTP_PORT||587),secure:String(process.env.SMTP_SECURE||'false')==='true',auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASSWORD}});
          await transport.sendMail({from:process.env.SMTP_FROM||process.env.SMTP_USER,to:email,subject:'Verifikasi ulasan PIR Visuals',text:`Verifikasi ulasan kamu: ${link}`,html:`<p>Konfirmasi ulasan untuk desainer PIR Visuals.</p><p><a href="${escapeHtml(link)}">Verifikasi ulasan</a></p><p>Link berlaku 30 menit.</p>`});
        } catch(error) { await DesignerTestimonial.deleteOne({testimonialId, emailVerified:false}); console.error('[REVIEW VERIFY EMAIL]',error.message); return sendHtml(res,503,pageShell('Email verifikasi belum tersedia','<h1>Email verifikasi belum dapat dikirim. Silakan coba lagi nanti.</h1>')); }
        return sendHtml(res,200,pageShell('Verifikasi ulasan','<section class="card"><h1>Periksa email kamu</h1><p>Ulasan menunggu verifikasi email dan persetujuan moderator.</p></section>'),{'cache-control':'no-store'});
      }
      if (parts[0] === 'review' && parts[1] === 'verify' && req.method === 'GET') {
        const id=String(url.searchParams.get('id')||''),token=String(url.searchParams.get('token')||'');
        const review=await DesignerTestimonial.findOne({testimonialId:id,verificationExpiresAt:{$gt:new Date()},emailVerified:false}).lean();
        if(!review||!review.verificationTokenHash||!sameHash(hashToken(token),review.verificationTokenHash)){res.writeHead(400);return res.end(pageShell('Verifikasi gagal','<h1>Link verifikasi tidak valid atau kedaluwarsa.</h1>'));}
        await DesignerTestimonial.updateOne({testimonialId:id,verificationTokenHash:review.verificationTokenHash},{$set:{emailVerified:true,verificationTokenHash:'',verificationExpiresAt:null}});
        return sendHtml(res,200,pageShell('Ulasan diverifikasi','<section class="card"><h1>Email berhasil diverifikasi.</h1><p>Ulasan menunggu persetujuan moderator.</p></section>'),{'cache-control':'no-store'});
      }
      if (parts[0] === 'work' && parts[1] && req.method === 'GET') {
        const work = await PortfolioItem.findOne({ itemId: String(parts[1]).toUpperCase(), moderationStatus: 'approved' }).lean();
        if (!work) return sendHtml(res,404,pageShell('Karya tidak ditemukan','<section class="wrap"><h1>Karya tidak tersedia</h1><a href="/discover">Kembali ke direktori</a></section>'));
        const designer = await DesignerProfile.findOne({ designerId: work.designerId, isPublic: true }).select('designerId slug displayName location avatarUrl avatarPath').lean();
        if (!designer) return sendHtml(res,404,pageShell('Kreator tidak ditemukan','<h1>Profil kreator tidak tersedia</h1>'));
        const relatedCandidates = work.category ? await PortfolioItem.find({
          moderationStatus:'approved', category:work.category, itemId:{ $ne:work.itemId },
        }).sort({ featured:-1, createdAt:-1 }).limit(10).lean() : [];
        const relatedProfiles = relatedCandidates.length ? await DesignerProfile.find({
          designerId:{ $in:relatedCandidates.map(item => item.designerId) }, isPublic:true,
        }).select('designerId displayName slug').lean() : [];
        const relatedProfileById = new Map(relatedProfiles.map(item => [item.designerId,item]));
        const relatedWorks = relatedCandidates.filter(item => relatedProfileById.has(item.designerId)).slice(0,3);
        const relatedMarkup = relatedWorks.map((item,index) => {
          const author = relatedProfileById.get(item.designerId);
          const authorName = author?.displayName || 'PIR Visuals creator';
          return `<a class="case-related-card" href="/work/${encodeURIComponent(item.itemId)}">
            <div class="case-related-image"><img loading="lazy" decoding="async" src="/media/${encodeURIComponent(item.itemId)}" alt="${escapeHtml(item.title || 'Related creative project')}"><span>0${index+1}</span></div>
            <div class="case-related-caption"><div><small>${escapeHtml(item.category || 'SELECTED WORK')}</small><strong>${escapeHtml(item.title || 'Untitled project')}</strong><span>By ${escapeHtml(authorName)}</span></div><b>↗</b></div>
          </a>`;
        }).join('');
        const publishedDate = work.createdAt && Number.isFinite(new Date(work.createdAt).getTime())
          ? new Date(work.createdAt).toLocaleDateString('id-ID',{ month:'long', year:'numeric' }) : '';
        const projectType = ({ personal:'Personal exploration', client:'Client project', practice:'Creative practice' })[work.sourceType] || 'Selected project';
        if (allowCount(req, `portfolio:${work.itemId}`)) {
          await DesignerAnalytics.updateOne({designerId:work.designerId},{$inc:{portfolioViews:1},$setOnInsert:{designerId:work.designerId}},{upsert:true});
          await incrementDailyMetric(work.designerId,'portfolioViews');
        }
        const gallery = [...new Set((Array.isArray(work.galleryPaths) ? work.galleryPaths : []).filter(file => file && file !== work.imagePath))].slice(0,4);
        const galleryMarkup = gallery.map((_,i)=>`<a class="case-gallery-item" data-pv-lightbox-group="case-${escapeHtml(work.itemId)}" href="/media/${encodeURIComponent(work.itemId)}/${i+1}" aria-label="Perbesar gambar ${i+2}: ${escapeHtml(work.title)}"><img loading="lazy" decoding="async" src="/media/${encodeURIComponent(work.itemId)}/${i+1}" alt="${escapeHtml(work.title)} — preview ${i+2}"></a>`).join('');
        const projectMeta = [
          ['DISCIPLINE',work.category],['PROJECT TYPE',projectType],['STARTING PRICE',Number(work.priceFrom || 0) > 0 ? money(work.priceFrom) : ''],
          ['CLIENT / BRAND',work.projectClient],['INDUSTRY',work.projectIndustry],['YEAR',work.projectYear],['SCOPE',work.projectScope],['PUBLISHED',publishedDate],
        ].filter(([,value])=>String(value||'').trim()).slice(0,8);
        const projectMetaMarkup = projectMeta.map(([label,value])=>`<div><small>${label}</small><strong>${escapeHtml(value)}</strong></div>`).join('');
        const caseHasNarrative = [work.challenge,work.solution,work.outcome].some(Boolean);
        const caseChapterItems = [
          ['case-overview','Overview',true],
          ['case-meta','Project info',Boolean(projectMetaMarkup)],
          ['case-cover','Cover',true],
          ['case-gallery','Gallery',Boolean(galleryMarkup)],
          ['case-highlight','Highlight',Boolean(work.resultHighlight)],
          ['case-process','Process',caseHasNarrative],
          ['case-creator','Creator',true],
          ['case-related','More work',Boolean(relatedMarkup)],
        ].filter(([, ,visible]) => visible);
        const caseChapterMarkup = caseChapterItems.length >= 4 ? `<nav class="pv-case-chapters" aria-label="Navigasi studi kasus"><span class="pv-case-chapters-label">ON THIS PAGE</span><div>${caseChapterItems.map(([id,label],index)=>`<a href="#${id}" data-pv-section-link>${String(index+1).padStart(2,'0')} <span>${label}</span></a>`).join('')}</div></nav>` : '';
        const caseBody = `<div class="case-study" data-track-project="${escapeHtml(work.itemId)}" data-track-designer="${escapeHtml(work.designerId)}">
          <div class="showcase-breadcrumb"><a href="/">PIR VISUALS</a><span>/</span><a href="/discover">WORK</a><span>/</span><span>${escapeHtml(work.itemId)}</span></div>
          <header class="case-heading" id="case-overview">
            <div class="case-heading-top"><span class="eyebrow">CASE FILE / ${escapeHtml(work.itemId)}</span><span class="case-heading-index">PIR VISUALS · SELECTED WORK</span></div>
            <span class="case-category-label">${escapeHtml(work.category || 'SELECTED PROJECT')} ${work.styles?.length ? ` / ${escapeHtml(work.styles.slice(0,3).join(' / '))}` : ''}</span>
            <h1>${escapeHtml(work.title)}</h1>
            <p>${escapeHtml(work.description || 'A selected creative project from the PIR Visuals community.')}</p>
            <div class="case-byline"><span>CREATED BY</span><a href="${designer.slug ? `/p/${encodeURIComponent(designer.slug)}` : `/designer/${encodeURIComponent(designer.designerId)}`}">${escapeHtml(designer.displayName)} ↗</a><span>${escapeHtml(designer.location || '')}</span></div>
          </header>
          ${caseChapterMarkup}
          ${projectMetaMarkup ? `<section class="case-meta-strip" id="case-meta" aria-label="Project details">${projectMetaMarkup}</section>` : ''}
          <figure class="case-cover" id="case-cover"><img src="/media/${encodeURIComponent(work.itemId)}" alt="${escapeHtml(work.title)}" fetchpriority="high"><figcaption><span>01 / PROJECT COVER</span><span>${escapeHtml(work.category || 'SELECTED WORK')}</span></figcaption></figure>
          ${galleryMarkup ? `<section class="case-gallery-section" id="case-gallery"><div class="case-subheading"><span class="eyebrow">VISUAL DETAILS / 02</span><h2>Inside the project.</h2></div><div class="case-gallery">${galleryMarkup}</div></section>` : ''}
          ${work.resultHighlight ? `<aside class="case-result-highlight" id="case-highlight"><span class="eyebrow">PROJECT HIGHLIGHT</span><p>${escapeHtml(work.resultHighlight)}</p></aside>` : ''}
          ${[work.challenge,work.solution,work.outcome].some(Boolean)?`<section class="case-narrative" id="case-process"><div class="case-narrative-heading"><span class="eyebrow">THE THINKING BEHIND THE WORK</span><h2>From brief<br><em>to outcome.</em></h2></div><div class="case-narrative-content"><div class="case-facts">${work.projectRole?`<div><small>ROLE</small><strong>${escapeHtml(work.projectRole)}</strong></div>`:''}${work.projectDuration?`<div><small>DURATION</small><strong>${escapeHtml(work.projectDuration)}</strong></div>`:''}${work.toolsUsed?`<div><small>TOOLS</small><strong>${escapeHtml(work.toolsUsed)}</strong></div>`:''}${work.projectScope?`<div><small>SCOPE</small><strong>${escapeHtml(work.projectScope)}</strong></div>`:''}</div>${work.challenge?`<article><span class="eyebrow">01 · THE CHALLENGE</span><h3>The brief.</h3><p>${escapeHtml(work.challenge)}</p></article>`:''}${work.solution?`<article><span class="eyebrow">02 · THE APPROACH</span><h3>The process.</h3><p>${escapeHtml(work.solution)}</p></article>`:''}${work.outcome?`<article><span class="eyebrow">03 · THE IMPACT</span><h3>The outcome.</h3><p>${escapeHtml(work.outcome)}</p></article>`:''}</div></section>`:''}
          <section class="case-creator-card" id="case-creator"><div class="case-creator-avatar">${getDesignerAvatarSrc(designer) ? `<img src="${escapeHtml(getDesignerAvatarSrc(designer))}" alt="${escapeHtml(designer.displayName)}" loading="lazy">` : `<span>${escapeHtml(designer.displayName.slice(0,1).toUpperCase())}</span>`}</div><div class="case-creator-copy"><span>THE CREATIVE BEHIND THIS PROJECT</span><h2>${escapeHtml(designer.displayName)}</h2><p>${escapeHtml(designer.location || 'Independent creative · Indonesia')}</p></div><a href="${designer.slug ? `/p/${encodeURIComponent(designer.slug)}` : `/designer/${encodeURIComponent(designer.designerId)}`}">Explore profile ↗</a></section>
          ${relatedMarkup ? `<section class="case-related" id="case-related"><div class="case-related-heading"><div><span class="eyebrow">KEEP EXPLORING / 03</span><h2>More in this discipline<span>.</span></h2></div><a href="/discover?category=${encodeURIComponent(work.category || '')}">Explore category ↗</a></div><div class="case-related-grid">${relatedMarkup}</div></section>` : ''}
          <section class="case-footer"><div><span class="eyebrow">HAVE A PROJECT IN MIND?</span><h2>Find the right creative partner.</h2><p>Jelajahi karya lainnya dan mulai percakapan langsung dengan desainer yang sesuai dengan kebutuhanmu.</p></div><a class="btn" href="/discover">Explore designers ↗</a></section>
        </div>`;
        const caseSeoTitle = String(work.seoTitle || `${work.title} — ${designer.displayName} | PIR Visuals`).slice(0,100);
        const caseSeoDescription = String(work.seoDescription || work.description || `${work.title} by ${designer.displayName} on PIR Visuals.`).slice(0,300);
        return sendHtml(res,200,pageShell(caseSeoTitle,caseBody,{description:caseSeoDescription,ogImage:`/media/${work.itemId}`}),{'cache-control':'public, max-age=60'});
      }
      // Canonical public profile route: /designer/:designerId. The explicit
      // parts[0] !== 'designer' check keeps legacy /DSN-ID aliases separate.
      const isDesignerIdRoute = parts[0] === 'designer' && Boolean(parts[1]);
      const isLegacyDesignerRoute = parts[0] !== 'designer' && parts[0] !== 'p' && /^DSN-[A-F0-9]{4,16}$/i.test(parts[0] || '');
      const isSlugRoute = parts[0] === 'p' && Boolean(parts[1]);
      if (!isDesignerIdRoute && !isLegacyDesignerRoute && !isSlugRoute) {
        return sendHtml(res, 404, pageShell('Halaman tidak ditemukan', '<section class="wrap"><h1>Halaman tidak ditemukan</h1><p class="muted">Periksa kembali tautan yang kamu buka.</p><a href="/discover">Jelajahi desainer</a></section>'));
      }
      const profileLookup = isSlugRoute
        ? { slug: String(parts[1]).toLowerCase(), isPublic: true }
        : { designerId: String(isLegacyDesignerRoute ? parts[0] : parts[1]).toUpperCase(), isPublic: true };
      const profile = await DesignerProfile.findOne(profileLookup).lean();
      if (!profile) { res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' }); return res.end(pageShell('Profil tidak ditemukan', '<h1>Profil tidak tersedia</h1><p class="muted">Profil mungkin disembunyikan atau tidak ditemukan.</p>')); }
      const lang = url.searchParams.get('lang') === 'en' ? 'en' : (profile.language === 'en' ? 'en' : 'id');
      const t = translations[lang];
      if (allowCount(req, `profile:${profile.designerId}`)) {
        await DesignerAnalytics.updateOne({ designerId: profile.designerId }, { $inc: { profileViews: 1 }, $set: { lastViewedAt: new Date() }, $setOnInsert: { designerId: profile.designerId } }, { upsert: true });
        await incrementDailyMetric(profile.designerId, 'views');
      }
      const [works, services, analytics, collections, testimonials, reviewStats, publicAvailability] = await Promise.all([
        PortfolioItem.find({ designerId: profile.designerId, moderationStatus: 'approved' }).sort({ featured: -1, createdAt: -1 }).limit(24).lean(),
        DesignService.find({ designerId: profile.designerId, isActive: true }).sort({ price: 1 }).limit(20).lean(),
        DesignerAnalytics.findOne({ designerId: profile.designerId }).lean(),
        PortfolioCollection.find({ designerId: profile.designerId, isPublic: true }).sort({ createdAt: -1 }).limit(12).lean(),
        DesignerTestimonial.find({ designerId: profile.designerId, isPublished: true, emailVerified: true }).sort({ createdAt: -1 }).limit(20).lean(),
        DesignerTestimonial.aggregate([{ $match: { designerId: profile.designerId, isPublished: true, emailVerified: true } }, { $group: { _id: null, count: { $sum: 1 }, average: { $avg: '$rating' } } }]),
        profile.availabilityPublic ? DesignerAvailability.find({ designerId: profile.designerId, date: { $gte: jakartaDateKey() } }).sort({ date: 1 }).limit(14).lean() : Promise.resolve([]),
      ]);
      const chips = (profile.specialties || []).map(s => `<a class="tag capability-tag-link" href="/discover?skill=${encodeURIComponent(s)}">${escapeHtml(s)} ↗</a>`).join('');
      const workCards = works.map((w,i) => `<a class="showcase-work ${w.featured ? 'is-featured' : ''}" href="/work/${encodeURIComponent(w.itemId)}"><div class="showcase-work-image"><img loading="${i < 2 ? 'eager' : 'lazy'}" fetchpriority="${i === 0 ? 'high' : 'auto'}" decoding="async" src="/media/${encodeURIComponent(w.itemId)}" alt="${escapeHtml(w.title)}"><span class="showcase-work-index">${String(i+1).padStart(2,'0')}</span>${w.featured ? '<span class="showcase-work-featured">FEATURED</span>' : ''}</div><div class="showcase-work-meta"><div><span class="eyebrow">${escapeHtml(w.category || 'SELECTED WORK')}</span><h3>${escapeHtml(w.title)}</h3><p>${escapeHtml((w.styles || []).slice(0,3).join(' · '))}</p></div><span class="showcase-work-price">${w.priceFrom ? money(w.priceFrom) : 'View project'} ↗</span></div></a>`).join('');
      const serviceCards = services.map(s => `<article class="card"><strong>${escapeHtml(s.title)}</strong><p class="muted">${escapeHtml(s.packageName)} · ${escapeHtml(s.category)}</p><p>${escapeHtml(s.description)}</p><p class="price">${money(s.price)}</p><p class="muted">${s.deliveryDays} days · ${s.revisionCount} revisions</p></article>`).join('');
      const badges = `${profile.isVerified ? `<span class="tag" title="Profil ditinjau tim PIR; bukan verifikasi identitas hukum, transaksi, atau hasil kerja">✓ ${t.verified}</span>` : ''}${profile.isFeatured ? `<span class="tag">★ ${t.featured}</span>` : ''}`;
      const publicContactPhone = getPublicContactPhone(profile);
      const contact = publicContactPhone
        ? `<a class="btn" href="/out/${encodeURIComponent(profile.designerId)}" target="_blank" rel="noopener noreferrer">${t.contact} via WhatsApp ↗</a>`
        : `<span class="muted">Kontak WhatsApp belum dicantumkan desainer.</span>`;
      const collectionItemIds = [...new Set(collections.flatMap(collection => collection.itemIds || []))];
      const collectionWorks = collectionItemIds.length ? await PortfolioItem.find({
        designerId: profile.designerId, itemId: { $in: collectionItemIds }, moderationStatus: 'approved',
      }).select('itemId title').lean() : [];
      const collectionWorkById = new Map(collectionWorks.map(work => [work.itemId, work]));
      const collectionCards = collections.map(collection => {
        const items = [...new Set(collection.itemIds || [])].map(id => collectionWorkById.get(id)).filter(Boolean);
        if (!items.length) return '';
        const links = items.map(work => `<li><a href="/work/${encodeURIComponent(work.itemId)}">${escapeHtml(work.title || work.itemId)}</a></li>`).join('');
        return `<article class="card"><h3>${escapeHtml(collection.title)}</h3><p>${escapeHtml(collection.description || '')}</p><p class="muted">${items.length} karya</p><ul>${links}</ul></article>`;
      }).join('');
      const reviewCount = Number(reviewStats[0]?.count || 0);
      const averageRating = Number(reviewStats[0]?.average || 0);
      const reputationBadge = reviewCount >= 5 && averageRating >= 4.5 ? '<span class="tag reputation-top" title="Rata-rata dari ulasan dengan email terverifikasi dan moderasi PIR; bukan rating transaksi">★ Rating tinggi</span>' : '';
      const ratingSummary = reviewCount
        ? `<div class="reputation-summary"><div class="reputation-score">${averageRating.toFixed(1)}<span>/5</span></div><div><div class="reputation-stars" aria-label="Rata-rata ${averageRating.toFixed(1)} dari 5">${'★'.repeat(Math.round(averageRating))}${'☆'.repeat(5-Math.round(averageRating))}</div><strong>${reviewCount} ulasan dengan email terverifikasi</strong><p class="muted">Email pengulas telah diverifikasi dan ulasan disetujui moderator PIR. PIR tidak memverifikasi hubungan klien, proyek, atau transaksi.</p></div></div>`
        : '<p class="muted">Belum ada ulasan yang emailnya terverifikasi dan disetujui moderator.</p>';
      const testimonialCards = testimonials.map(t => `<article class="card review-card"><div class="review-card-head"><strong>${escapeHtml(t.clientName)}</strong><span class="reputation-stars">${'★'.repeat(Number(t.rating||0))}${'☆'.repeat(5-Number(t.rating||0))}</span></div><p>${escapeHtml(t.message)}</p><p class="muted">${escapeHtml(t.project || '')} · <span class="review-verified" title="Email pengulas diverifikasi; hubungan klien atau transaksi tidak diverifikasi PIR">✓ Email terverifikasi</span></p></article>`).join('');
      const socialLinks = [
        profile.instagram ? ['Instagram', profile.instagram.startsWith('http') ? profile.instagram : `https://instagram.com/${profile.instagram.replace(/^@/,'')}`] : null,
        profile.behance ? ['Behance', profile.behance.startsWith('http') ? profile.behance : `https://behance.net/${profile.behance}`] : null,
        profile.dribbble ? ['Dribbble', profile.dribbble.startsWith('http') ? profile.dribbble : `https://dribbble.com/${profile.dribbble}`] : null,
        profile.website && /^https:\/\//i.test(profile.website) ? ['Website', profile.website] : null,
      ].filter(Boolean);
      const profileLayoutClass = ['editorial','minimal','gallery'].includes(profile.profileLayout) ? profile.profileLayout : 'editorial';
      const practiceBlocks = [
        profile.practiceStatement ? ['POINT OF VIEW', 'What I believe', profile.practiceStatement] : null,
        profile.approach ? ['PROCESS', 'How I work', profile.approach] : null,
        profile.idealProjects ? ['BEST FIT', 'Projects I love', profile.idealProjects] : null,
      ].filter(Boolean);
      const practiceMarkup = practiceBlocks.length ? `<section class="showcase-section practice-story" id="creative-practice"><div class="showcase-section-heading"><div><span class="eyebrow">THE PRACTICE / 02</span><h2>A little more<br><em>about the work.</em></h2></div><p>${escapeHtml(profile.tagline || 'A creative practice shaped by curiosity, craft, and collaboration.')}</p></div><div class="practice-story-grid">${practiceBlocks.map(([eyebrow,title,copy],index)=>`<article class="practice-story-card"><span>0${index+1} / ${eyebrow}</span><h3>${escapeHtml(title)}</h3><p>${escapeHtml(copy)}</p></article>`).join('')}</div></section>` : '';
      const publicAvailabilityMarkup = profile.availabilityPublic ? `<section class="pv-public-availability" id="designer-availability"><span class="eyebrow">PUBLIC AVAILABILITY</span><h2>Jadwal ketersediaan</h2><p class="muted">Informasi ini dibagikan secara sukarela oleh desainer dan dapat berubah. Konfirmasikan jadwal secara langsung.</p><div class="pv-public-availability-grid">${publicAvailability.map(slot => { const label = slot.status === 'available' ? 'Tersedia' : slot.status === 'busy' ? 'Terjadwal' : 'Tidak tersedia'; return `<div class="pv-public-availability-item"><strong>${escapeHtml(formatDateKey(slot.date))}</strong><span class="pv-availability-status">${label}</span></div>`; }).join('') || '<p class="muted">Belum ada tanggal publik yang ditambahkan.</p>'}</div></section>` : '';
      const body = `<div class="designer-showcase layout-${profileLayoutClass}" data-track-designer="${escapeHtml(profile.designerId)}">
        <div class="showcase-breadcrumb"><a href="/">PIR VISUALS</a><span>/</span><a href="/discover">DESIGNERS</a><span>/</span><span>${escapeHtml(profile.displayName).toUpperCase()}</span></div>
        <section class="designer-cover">
          <div class="designer-cover-copy"><div class="showcase-cover-index"><span>CREATIVE PROFILE / 01</span><span>INDEPENDENT TALENT</span></div><div class="showcase-badges">${badges}${reputationBadge}<span class="showcase-availability ${publicContactPhone ? 'is-open' : ''}">${publicContactPhone ? '● DIRECT CONTACT AVAILABLE' : '○ CONTACT NOT LISTED'}</span></div>
            <span class="eyebrow">${escapeHtml(profile.category || 'INDEPENDENT CREATIVE').toUpperCase()} · ${escapeHtml(profile.location || 'INDONESIA').toUpperCase()}</span>
            <h1>${escapeHtml(profile.displayName)}</h1>${profile.tagline ? `<p class="designer-tagline">${escapeHtml(profile.tagline)}</p>` : ''}<p class="designer-intro">${escapeHtml(profile.bio || 'Independent designer creating thoughtful visual experiences.')}</p>
            <div class="showcase-actions">${contact}<button class="share-profile-btn" type="button" data-share-profile>↗ Bagikan profil</button><button class="favorite-btn" type="button" data-favorite="${escapeHtml(profile.designerId)}" aria-pressed="false">♡ Save designer</button></div>
            <div class="showcase-socials">${socialLinks.map(([name,href])=>`<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${name} ↗</a>`).join('')}</div>
          </div>
          <div class="designer-portrait">${getDesignerAvatarSrc(profile) ? `<img src="${escapeHtml(getDesignerAvatarSrc(profile))}" alt="${escapeHtml(profile.displayName)}" loading="eager" decoding="async">` : `<div class="portrait-placeholder">${escapeHtml(profile.displayName.slice(0,1).toUpperCase())}</div>`}<span class="portrait-caption"><b>PIR VISUALS</b><i>DESIGNER PROFILE / ${escapeHtml(profile.designerId)}</i></span></div>
        </section>
        <nav class="showcase-jumpnav" aria-label="Navigasi portfolio"><a href="#about-designer">Tentang</a>${practiceMarkup ? '<a href="#creative-practice">Practice</a>' : ''}<a href="#selected-work">Portfolio</a><a href="#designer-services">Layanan & harga</a>${publicAvailabilityMarkup ? '<a href="#designer-availability">Ketersediaan</a>' : ''}<a href="#client-reviews">Ulasan</a><a href="#contact-designer">Kontak</a></nav><section class="showcase-facts"><div><span>PROJECTS</span><strong>${works.length}</strong></div><div><span>EXPERIENCE</span><strong>${escapeHtml(profile.experience || 'Independent')}</strong></div><div><span>BASED IN</span><strong>${escapeHtml(profile.location || 'Indonesia')}</strong></div><div><span>STARTING AT</span><strong>${money(profile.priceMin)}</strong></div><div><span>LANGUAGE</span><strong>${profile.language === 'en' ? 'English' : 'Indonesia'}</strong></div><div><span>DESIGNER ID</span><strong><code>${escapeHtml(profile.designerId)}</code></strong></div></section>
        <section class="showcase-section" id="about-designer"><div class="showcase-section-heading"><div><span class="eyebrow">01 / CREATIVE CAPABILITIES</span><h2>What I do.</h2></div><p>Keahlian, pendekatan, dan perangkat yang membentuk proses kreatif.</p></div><div class="capability-layout"><div class="capability-tags">${chips || '<span class="tag">Creative design</span>'}</div><div class="capability-description"><p>${escapeHtml(profile.softwareSkills || 'Tools and creative workflow tailored to each project.')}</p><p class="muted">${escapeHtml(profile.experience || '')}</p></div></div></section>
        ${practiceMarkup}
        <section class="showcase-section" id="selected-work"><div class="showcase-section-heading"><div><span class="eyebrow">02 / SELECTED PROJECTS</span><h2>Selected work<span class="showcase-period">.</span></h2></div><p>A selection of published work, visual explorations, and client projects.</p></div><div class="showcase-work-grid">${workCards || '<p class="muted">Portfolio sedang disiapkan.</p>'}</div></section>
        <section class="showcase-section" id="designer-services"><div class="showcase-section-heading"><div><span class="eyebrow">03 / SERVICES & INVESTMENT</span><h2>Ways to work together.</h2></div><p>Ruang lingkup dan estimasi harga. Detail proyek disepakati langsung dengan desainer.</p></div><div class="showcase-services">${serviceCards || '<p class="muted">Belum ada layanan aktif.</p>'}</div></section>
        ${publicAvailabilityMarkup}
        ${collectionCards ? `<section class="showcase-section"><div class="showcase-section-heading"><div><span class="eyebrow">04 / CURATED SERIES</span><h2>Collections.</h2></div></div><div class="grid">${collectionCards}</div></section>` : ''}
        <section class="showcase-section reputation-panel" id="client-reviews"><div class="showcase-section-heading"><div><span class="eyebrow">05 / COMMUNITY NOTES</span><h2>Kind words.</h2></div><p>Ulasan klien yang telah diverifikasi melalui email dan disetujui Owner.</p></div>${ratingSummary}${testimonialCards ? `<section class="grid review-grid">${testimonialCards}</section>` : ''}</section>
        <section class="showcase-contact" id="contact-designer"><span class="eyebrow">HAVE A PROJECT IN MIND?</span><h2>Let's make something meaningful.</h2><p>Hubungi desainer secara langsung melalui kanal kontak yang mereka cantumkan. Kesepakatan dan pembayaran dilakukan langsung antara klien dan desainer.</p>${contact}${profile.acceptsOrders ? `<div class="pv-hybrid-workspace-note"><strong>Butuh ruang untuk mencatat brief dan progres?</strong><p>Project workspace bersifat opsional dan memerlukan email aktif. Fitur ini tidak memproses pembayaran atau menjadi perantara transaksi.</p><a class="btn btn-secondary" href="/contact/${encodeURIComponent(profile.designerId)}">Gunakan project workspace opsional ↗</a></div>` : ''}</section>
        <section class="card showcase-review-card" aria-labelledby="showcase-review-title"><div class="showcase-review-heading"><span class="eyebrow">COMMUNITY / PROJECT FEEDBACK</span><h2 id="showcase-review-title">Bagikan pengalaman proyek</h2><p class="muted">Email harus diverifikasi dan ulasan disetujui Owner sebelum dipublikasikan.</p></div><form method="post" action="/review/${encodeURIComponent(profile.designerId)}" class="showcase-review-form"><label>Nama<input name="clientName" maxlength="80" required autocomplete="name"></label><label>Email<input name="email" type="email" maxlength="254" required autocomplete="email"></label><label>Proyek<input name="project" maxlength="100" placeholder="Nama proyek (opsional)"></label><label>Rating<select name="rating"><option value="5">5 — Sangat baik</option><option value="4">4 — Baik</option><option value="3">3 — Cukup</option><option value="2">2 — Kurang</option><option value="1">1 — Buruk</option></select></label><label class="showcase-review-message">Ulasan<textarea name="message" minlength="20" maxlength="700" rows="5" required placeholder="Ceritakan pengalaman bekerja sama dengan desainer ini..."></textarea></label><div class="showcase-review-submit"><button class="btn btn-secondary" type="submit">Kirim ulasan untuk verifikasi</button><small>Minimal 20 karakter. Email digunakan untuk proses verifikasi.</small></div></form></section>
        <div class="showcase-language"><a href="?lang=id">Indonesia</a> · <a href="?lang=en">English</a></div>
      </div>`;
      const profileSeoTitle = String(profile.seoTitle || `${profile.displayName} — Portfolio`).slice(0,100);
      const profileSeoDescription = String(profile.seoDescription || `${profile.displayName} — ${String(profile.bio || 'Designer portfolio').slice(0,220)}`).slice(0,300);
      const profileSeoImage = /^https:\/\//i.test(String(profile.seoImage || '')) ? profile.seoImage : getDesignerAvatarSrc(profile);
      return sendHtml(res, 200, pageShell(profileSeoTitle, body, { displayName: profile.displayName, avatarUrl: getDesignerAvatarSrc(profile), description: profileSeoDescription, ogImage: profileSeoImage }), { 'cache-control': 'public, max-age=60' });
    } catch (error) {
      if (res.headersSent || res.writableEnded) { res.destroy(); return; }
      const status = Number(error?.statusCode) === 413 ? 413 : 500;
      if (status === 500) console.error('[PORTFOLIO WEB]', error.message);
      res.writeHead(status, { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' });
      return res.end(status === 413 ? 'Payload too large' : 'Internal server error');
    }
  });
  server.requestTimeout = 120000;
  server.headersTimeout = 15000;
  server.keepAliveTimeout = 5000;
  server.maxHeadersCount = 100;
  server.maxRequestsPerSocket = 1000;
  server.listen(port, host, () => console.log(`[PORTFOLIO WEB] Listening on ${host}:${port} · public base ${publicBase}`));
  server.on('error', error => console.error('[PORTFOLIO WEB ERROR]', error.message));
  globalThis.__designerPortfolioServer = server;
  return server;
}


async function main() {
  const mongoUri = String(process.env.MONGO_URI || '').trim();
  if (!/^mongodb(?:\+srv)?:\/\//.test(mongoUri)) throw new Error('MONGO_URI harus menggunakan mongodb:// atau mongodb+srv://.');
  if (process.env.NODE_ENV === 'production' && !getSiteBase().startsWith('https://')) {
    throw new Error('SITE_URL atau PORTFOLIO_PUBLIC_BASE_URL wajib menggunakan HTTPS di production.');
  }
  const port = Number(process.env.PORTFOLIO_WEB_PORT || process.env.PORT || 3080);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORTFOLIO_WEB_PORT harus antara 1 dan 65535.');
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
  console.log(`[PORTFOLIO WEB] MongoDB connected: ${mongoose.connection.name}`);
  const server = startPublicPortfolioServer();
  let shuttingDown = false;
  const shutdown = async signal => {
    if (shuttingDown) return;
    shuttingDown = true;
    const deadline = setTimeout(() => {
      server.closeAllConnections();
      process.exit(1);
    }, 25000);
    deadline.unref();
    console.log(`[PORTFOLIO WEB] ${signal} received; shutting down.`);
    await new Promise(resolve => server.close(resolve));
    await mongoose.disconnect();
    clearTimeout(deadline);
    process.exit(0);
  };
  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch(error => {
    console.error('[PORTFOLIO WEB FATAL]', error.message);
    process.exitCode = 1;
  });
}
