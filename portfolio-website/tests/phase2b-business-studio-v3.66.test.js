import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { normalizeOptionalWhatsApp, isSameOriginRequest } from '../lead-utils.js';

const source = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
const loginStart = source.indexOf("function dashboardLoginPage(");
const studioPageStart = source.indexOf("async function dashboardStudioPage(");
const leadGetStart = source.indexOf("if (parts[0] === 'contact' && parts[1] && req.method === 'GET')");
const leadPostStart = source.indexOf("if (parts[0] === 'contact' && parts[1] && req.method === 'POST')");
const leadPostEnd = source.indexOf("if (parts[0] === 'homepage-media'", leadPostStart);
const logoutStart = source.indexOf("if (parts[0] === 'studio' && parts[1] === 'logout' && req.method === 'POST')");
const logoutGetStart = source.indexOf("if (parts[0] === 'studio' && parts[1] === 'logout' && req.method === 'GET')", logoutStart);

test('optional WhatsApp accepts international numbers and normalizes common separators', () => {
  assert.deepEqual(normalizeOptionalWhatsApp(' +62 812-3456-7890 '), { valid: true, value: '+6281234567890' });
  assert.deepEqual(normalizeOptionalWhatsApp('6281234567890'), { valid: true, value: '6281234567890' });
  assert.deepEqual(normalizeOptionalWhatsApp(''), { valid: true, value: '' });
});

test('optional WhatsApp rejects local-only, too-short, and non-phone input', () => {
  assert.equal(normalizeOptionalWhatsApp('081234567890').valid, false);
  assert.equal(normalizeOptionalWhatsApp('12345').valid, false);
  assert.equal(normalizeOptionalWhatsApp('not a number').valid, false);
});

test('same-origin validation accepts the current host and clients without Origin', () => {
  assert.equal(isSameOriginRequest({ origin: 'http://localhost:3080', host: 'localhost:3080' }), true);
  assert.equal(isSameOriginRequest({ host: 'localhost:3080' }), true);
  assert.equal(isSameOriginRequest({}), true);
});

test('same-origin validation rejects cross-origin, malformed and Fetch-Metadata cross-site requests', () => {
  assert.equal(isSameOriginRequest({ origin: 'https://attacker.example', host: 'localhost:3080' }), false);
  assert.equal(isSameOriginRequest({ origin: 'null', host: 'localhost:3080' }), false);
  assert.equal(isSameOriginRequest({ 'sec-fetch-site': 'cross-site', host: 'localhost:3080' }), false);
});

test('private same-origin browser forms work when no-referrer serializes Origin as null', () => {
  const headers = { origin: 'null', host: 'localhost:3080' };
  assert.equal(isSameOriginRequest({ ...headers, 'sec-fetch-site': 'same-origin' }), true);
  assert.equal(isSameOriginRequest({ ...headers, 'sec-fetch-site': 'same-site' }), false);
  assert.equal(isSameOriginRequest({ ...headers, 'sec-fetch-site': 'cross-site' }), false);
});

test('business landing page sends its three service journeys to matching Discover categories', () => {
  assert.ok(source.includes("['01 / IDENTITY', 'Identitas merek'"));
  assert.ok(source.includes("'/discover?category=Brand%20Identity'"));
  assert.ok(source.includes("'/discover?category=UI%2FUX%20Design'"));
  assert.ok(source.includes("'/discover?category=Social%20Media'"));
  assert.ok(source.includes("parts[0] === 'for-business'"));
});

test('business landing page explains direct collaboration and does not imply platform payment handling', () => {
  const start = source.indexOf("'for-business': ['Solusi kreatif untuk bisnis'");
  const end = source.indexOf("contact: ['Hubungi PIR Visuals'", start);
  const content = source.slice(start, end);
  assert.match(content, /pembayaran dibahas langsung antara klien dan desainer/);
  assert.match(content, /tidak berperan sebagai perantara pembayaran/);
});

test('designer brief form has required contact details, accessible field semantics and a honeypot', () => {
  const route = source.slice(leadGetStart, leadPostStart);
  assert.match(route, /name="clientName"[^>]*required/);
  assert.match(route, /name="email" type="email"[^>]*required/);
  assert.match(route, /name="brief" minlength="15" maxlength="2000" required/);
  assert.match(route, /name="whatsapp" type="tel"/);
  assert.match(route, /name="website" tabindex="-1" autocomplete="off"/);
  assert.match(route, /kode negara/);
});

test('public designer-brief route applies bounded IP, designer and email rate limits', () => {
  const route = source.slice(leadPostStart, leadPostEnd);
  assert.match(route, /scope: 'designer-lead-ip', limit: 8/);
  assert.match(route, /scope: 'designer-lead-designer', identity: designerId, limit: 12/);
  assert.match(route, /scope: 'designer-lead-email', identity: email, limit: 3/);
  assert.match(route, /retry-after/);
});

test('public designer-brief route blocks cross-origin requests and silently discards honeypot submissions', () => {
  const route = source.slice(leadPostStart, leadPostEnd);
  assert.match(route, /isSameOriginRequest\(req\.headers\)/);
  assert.match(route, /clean\('website',200\)/);
  assert.match(route, /Honeypot submissions receive a neutral confirmation/);
  assert.match(route, /normalizeOptionalWhatsApp\(rawWhatsapp\)/);
});

test('lead, project and first timeline entry are compensated if workspace creation fails', () => {
  const route = source.slice(leadPostStart, leadPostEnd);
  assert.match(route, /await DesignerLead\.create/);
  assert.match(route, /await ClientProject\.create/);
  assert.match(route, /await ClientProjectUpdate\.create/);
  assert.match(route, /Promise\.allSettled\(\[/);
  assert.match(route, /DesignerLead\.deleteOne\(\{ leadId \}\)/);
  assert.match(route, /ClientProject\.deleteOne\(\{ projectId \}\)/);
});

test('notification failure does not turn a successfully persisted lead into a failed response', () => {
  const route = source.slice(leadPostStart, leadPostEnd);
  assert.match(route, /try \{ await DesignerNotification\.create/);
  assert.match(route, /catch \(error\) \{ console\.error\('\[LEAD NOTIFICATION\]'/);
});

test('email invite and lead status updates are non-blocking after the brief has been saved', () => {
  const route = source.slice(leadPostStart, leadPostEnd);
  assert.match(route, /try \{\s*await ClientProject\.updateOne\(\{ projectId \}/);
  assert.match(route, /await sendClientProjectAccessEmail/);
  assert.match(route, /catch \(error\) \{\s*try \{ await ClientProject\.updateOne/);
  assert.match(route, /catch \(error\) \{ console\.error\('\[LEAD STATUS\]'/);
});

test('Designer Studio login explains where to request the WhatsApp OTP and its expiry', () => {
  const loginPage = source.slice(loginStart, studioPageStart);
  assert.match(loginPage, /studio-login-otp/);
  assert.match(loginPage, /\.portfolio dashboard otp/);
  assert.match(loginPage, /berlaku 5 menit/);
  assert.match(loginPage, /hanya dapat digunakan sekali/);
  assert.match(loginPage, /autocomplete="one-time-code"/);
});

test('Designer Studio registration retains email, international phone and password confirmation fields', () => {
  const start = source.indexOf("parts[0] === 'studio' && parts[1] === 'register' && req.method === 'GET'");
  const end = source.indexOf("parts[0] === 'studio' && parts[1] === 'register' && req.method === 'POST'", start);
  const route = source.slice(start, end);
  for (const field of ['displayName', 'phoneE164', 'email', 'password', 'confirmPassword']) {
    assert.ok(route.includes(`name="${field}"`), `missing ${field}`);
  }
});

test('Designer Studio login keeps rate limiting, verified email and atomic single-use OTP checks', () => {
  const start = source.indexOf("parts[0] === 'studio' && parts[1] === 'login' && req.method === 'POST'");
  const end = source.indexOf("parts[0] === 'studio' && parts[1] === 'password' && req.method === 'POST'", start);
  const route = source.slice(start, end);
  assert.match(route, /scope: 'studio-login-ip'/);
  assert.match(route, /scope: 'studio-login-email'/);
  assert.match(route, /emailVerified === true/);
  assert.match(route, /const otpConsumeResult = await DesignerDashboardAuth\.updateOne/);
  assert.match(route, /otpExpiresAt: \{ \$gt: new Date\(\) \}/);
});

test('Designer Studio workspace mutation forms carry CSRF tokens', () => {
  const start = source.indexOf("async function dashboardStudioPage(");
  const end = source.indexOf("export function startPublicPortfolioServer", start);
  const page = source.slice(start, end);
  for (const action of [
    '/studio/profile', '/studio/work/upload', '/studio/work/edit', '/studio/work/delete',
    '/studio/password', '/studio/availability', '/studio/lead/status', '/studio/lead/workspace',
    '/studio/collection', '/studio/testimonial', '/studio/service',
  ]) {
    const index = page.indexOf(`action="${action}`);
    assert.ok(index >= 0, `missing form ${action}`);
    const formStart = page.lastIndexOf('<form', index);
    const formEnd = page.indexOf('</form>', index);
    assert.ok(formStart >= 0 && formEnd > index, `malformed form ${action}`);
    assert.match(page.slice(formStart, formEnd), /name="csrf"/, `missing CSRF for ${action}`);
  }
});

test('Designer Studio logout is a CSRF-protected POST form in both workspace locations', () => {
  const start = source.indexOf("async function dashboardStudioPage(");
  const end = source.indexOf("export function startPublicPortfolioServer", start);
  const page = source.slice(start, end);
  assert.equal((page.match(/method="post" action="\/studio\/logout"/g) || []).length, 2);
  assert.equal((page.match(/name="csrf" value="\$\{escapeHtml\(session\.csrf\)\}"/g) || []).length >= 2, true);
});

test('Designer Studio logout route requires POST and a valid session CSRF token', () => {
  assert.ok(logoutStart >= 0 && logoutGetStart > logoutStart);
  const route = source.slice(logoutStart, logoutGetStart);
  assert.match(route, /const session = await getDesignerSession\(req\)/);
  assert.match(route, /validCsrf\(req, form, session\)/);
  assert.match(route, /DesignerDashboardSession\.deleteOne/);
  assert.match(route, /set-cookie/);
  assert.match(source, /if \(parts\[0\] === 'studio' && parts\[1\] === 'logout' && req\.method === 'GET'\) \{\s*res\.writeHead\(405/);
});

test('client and designer project workspaces retain CSRF-protected update actions', () => {
  assert.match(source, /action="\/client\/projects\/\$\{encodeURIComponent\(project\.projectId\)\}\/message"><input type="hidden" name="csrf"/);
  assert.match(source, /action="\/studio\/projects\/\$\{encodeURIComponent\(project\.projectId\)\}\/update"><input type="hidden" name="csrf"/);
});

test('website package syntax checks include the new pure lead utility module', () => {
  const packageJson = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(packageJson.version, '3.66.0');
  assert.ok(packageJson.scripts.check.includes('lead-utils.js'));
});

test('the release notes document real integrations still requiring live environment verification', () => {
  const notes = fs.readFileSync(new URL('../RELEASE-NOTES-v3.66.0.md', import.meta.url), 'utf8');
  assert.match(notes, /MongoDB/);
  assert.match(notes, /SMTP/);
  assert.match(notes, /WhatsApp/);
  assert.match(notes, /No live credentials or production data were used/i);
});
