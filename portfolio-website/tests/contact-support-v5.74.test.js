import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
const marker = "if (parts[0] === 'public-ui.js') return res.end(`";
const start = source.indexOf(marker) + marker.length;
const end = source.indexOf('`);', start);
const publicUi = source.slice(start, end);
const contactStart = source.indexOf("if (parts[0] === 'contact' && parts.length === 1 && req.method === 'GET')");
const contactEnd = source.indexOf("if (parts[0] === 'contact' && parts.length === 1 && req.method === 'POST')", contactStart);
const contactRoute = source.slice(contactStart, contactEnd);

test('Contact page always offers a support ticket even without configured email or WhatsApp', () => {
  assert.ok(contactRoute.includes('const ticketCard ='));
  assert.ok(contactRoute.includes('support-channel-ticket'));
  assert.ok(contactRoute.includes('href=\"#support-request\"'));
  assert.ok(contactRoute.includes('id=\"support-request\"'));
  assert.match(contactRoute, /const emailCard = supportEmail \?/);
  assert.match(contactRoute, /const waCard = supportPhone \?/);
});

test('Customer Support provides quick routes and does not invent contact details', () => {
  for (const route of ['/how-it-works', '/studio', '/client', '/discover']) assert.ok(contactRoute.includes(route));
  assert.ok(contactRoute.includes('process.env.SUPPORT_EMAIL'));
  assert.ok(contactRoute.includes('process.env.SUPPORT_WHATSAPP'));
  assert.ok(!contactRoute.includes('support@pirvisuals.com'));
  assert.ok(!contactRoute.includes('628123456789'));
});

test('ticket submission retains rate limiting, validation, persistence and optional email delivery', () => {
  const postStart = contactEnd;
  const postEnd = source.indexOf("if (parts[0] === 'contact' && parts[1] && req.method === 'GET')", postStart);
  const postRoute = source.slice(postStart, postEnd);
  assert.ok(postRoute.includes("allowCount(req,'support-ticket'"));
  assert.ok(postRoute.includes('SupportTicket.create({ticketId,name,email,topic,subject,message})'));
  assert.ok(postRoute.includes('SMTP_HOST'));
  assert.ok(postRoute.includes('data-copy-support-ticket'));
});

test('ticket confirmation has an accessible copy action and clipboard fallback', () => {
  assert.ok(source.includes('data-copy-support-ticket'));
  assert.ok(source.includes('data-support-copy-status role=\"status\" aria-live=\"polite\"'));
  assert.ok(publicUi.includes("navigator.clipboard?.writeText") && publicUi.includes("navigator.clipboard.writeText(text)"));
  assert.ok(publicUi.includes("document.execCommand('copy')"));
});
