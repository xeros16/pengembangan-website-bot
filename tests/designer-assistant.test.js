import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { handleDesignerAssistantCommands, DESIGNER_ASSISTANT_COMMANDS } from '../features/commands/designer-assistant.js';
import { grantSubscription } from '../features/subscription-store.js';

async function withSubscriptionFile(run) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'pir-designer-assistant-'));
  const file = path.join(dir, 'subscriptions.json');
  const previous = process.env.BOT_SUBSCRIPTIONS_FILE;
  process.env.BOT_SUBSCRIPTIONS_FILE = file;
  try { await run(file); } finally {
    if (previous === undefined) delete process.env.BOT_SUBSCRIPTIONS_FILE;
    else process.env.BOT_SUBSCRIPTIONS_FILE = previous;
    await fs.rm(dir, { recursive: true, force: true });
  }
}

function context(command, args = [], overrides = {}) {
  const replies = [];
  return {
    ctx: {
      command, args, PREFIX: '.', userJid: '628111111111@s.whatsapp.net', sender: '628111111111@s.whatsapp.net',
      senderIdentityAliases: [], phoneJid: '628111111111@s.whatsapp.net', remoteJid: 'chat@g.us', isGroup: true,
      sock: {}, isBotOwner: () => false, isGroupAdmin: async () => false,
      reply: async text => { replies.push(String(text)); }, ...overrides,
    }, replies,
  };
}

test('premium commands deny non-subscribers and provide useful access guidance', async () => withSubscriptionFile(async () => {
  const { ctx, replies } = context('brandkit', ['Demo']);
  await handleDesignerAssistantCommands(ctx);
  assert.match(replies[0], /khusus pelanggan bot/i);
  assert.match(replies[0], /\.akses/);
}));

test('active subscribers can use brandkit and pricing tools', async () => withSubscriptionFile(async file => {
  await grantSubscription('628111111111', 30, 'owner', { file });
  const brand = context('brandkit', ['Kopi', 'Senja']);
  await handleDesignerAssistantCommands(brand.ctx);
  assert.match(brand.replies[0], /BRAND KIT — KOPI SENJA/);
  const price = context('pricing', ['5', '50000', '25000']);
  await handleDesignerAssistantCommands(price.ctx);
  assert.match(price.replies[0], /Rp275\.000/);
}));

test('owner bypasses premium subscription and non-owner cannot manage subscriptions', async () => withSubscriptionFile(async () => {
  const owner = context('pricing', ['2', '100000'], { isBotOwner: () => true });
  await handleDesignerAssistantCommands(owner.ctx);
  assert.match(owner.replies[0], /Estimasi dasar: Rp200\.000/i);
  const nonOwner = context('sub', ['grant', '628222222222', '30']);
  await handleDesignerAssistantCommands(nonOwner.ctx);
  assert.match(nonOwner.replies[0], /hanya untuk Owner bot/i);
}));

test('palette and checklist work for regular members', async () => {
  const palette = context('colorpalette', ['futuristik']);
  await handleDesignerAssistantCommands(palette.ctx);
  assert.match(palette.replies[0], /#00D9FF/);
  const checklist = context('checklist', ['logo']);
  await handleDesignerAssistantCommands(checklist.ctx);
  assert.match(checklist.replies[0], /DESIGN QA: LOGO/);
});


test('contrast checker computes WCAG ratio and thresholds for black on white', async () => {
  const { ctx, replies } = context('contrast', ['#000000', '#FFFFFF']);
  await handleDesignerAssistantCommands(ctx);
  assert.match(replies[0], /Rasio: \*21\.00:1\*/);
  assert.match(replies[0], /WCAG AA teks normal.*Lulus/);
  assert.match(replies[0], /WCAG AAA teks normal.*Lulus/);
});

test('contrast checker rejects malformed colors', async () => {
  const invalid = context('contrast', ['red', '#FFFFFF']);
  await handleDesignerAssistantCommands(invalid.ctx);
  assert.match(invalid.replies[0], /Format:/);
  const palette = context('colorpalette', ['futuristik']);
  await handleDesignerAssistantCommands(palette.ctx);
  assert.match(palette.replies[0], /#00D9FF/);
});

test('access status gives a useful next step to non-subscribers', async () => {
  const access = context('akses');
  await handleDesignerAssistantCommands(access.ctx);
  assert.match(access.replies[0], /\.menu premium/);
  assert.match(access.replies[0], /Belum aktif/);
});

test('designflow creates an integrated brief-to-QA workflow for web design', async () => {
  const { ctx, replies } = context('designflow', ['web', '|', 'toko kopi modern', '|', 'pelanggan 18+', '|', 'mobile-first']);
  await handleDesignerAssistantCommands(ctx);
  assert.match(replies[0], /DESIGN WORKFLOW.*WEB/);
  assert.match(replies[0], /Brief ringkas/);
  assert.match(replies[0], /Prompt siap pakai/);
  assert.match(replies[0], /QA sebelum final/);
  assert.match(replies[0], /\.designsystem/);
});

test('designflow explains required fields and supported design types', async () => {
  const { ctx, replies } = context('designflow', ['web']);
  await handleDesignerAssistantCommands(ctx);
  assert.match(replies[0], /Format:/);
  assert.match(replies[0], /marketplace/);
});

test('designflow integrates palette, typography, specifications, QA, and handoff shortcuts', async () => {
  const { ctx, replies } = context('designflow', ['web', '|', 'dashboard kopi futuristik', '|', 'barista dan pemilik usaha', '|', 'mobile-first']);
  await handleDesignerAssistantCommands(ctx);
  const output = replies[0];
  assert.match(output, /Palet awal \(futuristik\)/);
  assert.match(output, /#00D9FF/);
  assert.match(output, /Tipografi:/);
  assert.match(output, /Target ukuran:/);
  assert.match(output, /designqa web/);
  assert.match(output, /handoff dashboard kopi futuristik/);
  assert.match(output, /typescale 16 1\.25 5/);
});

test('designflow selects an organic palette for packaging and safely limits user fields', async () => {
  const longTheme = 'kemasan kopi organik '.repeat(20);
  const { ctx, replies } = context('designflow', ['kemasan', '|', longTheme, '|', 'pembeli kopi', '|', 'pouch 250 gram']);
  await handleDesignerAssistantCommands(ctx);
  assert.match(replies[0], /Palet awal \(alam\)/);
  assert.match(replies[0], /#244D3A/);
  assert.ok(replies[0].length < 4000);
});

test('color converter converts HEX to RGB and HSL', async () => {
  const { ctx, replies } = context('colorconvert', ['#FF0000']);
  await handleDesignerAssistantCommands(ctx);
  assert.match(replies[0], /HEX: \*#FF0000\*/);
  assert.match(replies[0], /RGB: rgb\(255, 0, 0\)/);
  assert.match(replies[0], /HSL: hsl\(0, 100%, 50%\)/);
});

test('color converter accepts RGB and HSL input and rejects invalid values', async () => {
  const rgb = context('colorconvert', ['rgb(0, 128, 255)']);
  await handleDesignerAssistantCommands(rgb.ctx);
  assert.match(rgb.replies[0], /HEX: \*#0080FF\*/);
  const hsl = context('colorconvert', ['hsl(120, 100%, 50%)']);
  await handleDesignerAssistantCommands(hsl.ctx);
  assert.match(hsl.replies[0], /HEX: \*#00FF00\*/);
  const invalid = context('colorconvert', ['rgb(999, 0, 0)']);
  await handleDesignerAssistantCommands(invalid.ctx);
  assert.match(invalid.replies[0], /Format:/);
});

test('designqa provides production checklist for print and packaging', async () => {
  const print = context('designqa', ['cetak']);
  await handleDesignerAssistantCommands(print.ctx);
  assert.match(print.replies[0], /DESIGN QA: CETAK/);
  assert.match(print.replies[0], /Bleed dan safe area/);
  const packaging = context('checklist', ['kemasan']);
  await handleDesignerAssistantCommands(packaging.ctx);
  assert.match(packaging.replies[0], /DESIGN QA: KEMASAN/);
  assert.match(packaging.replies[0], /dieline/i);
});

test('handoff creates a developer-ready UI specification template', async () => {
  const handoff = context('handoff', ['Dashboard Kopi', '|', 'web UI', '|', 'desktop + mobile', '|', 'SVG, PNG', '|', '#20382C', '|', 'Inter']);
  await handleDesignerAssistantCommands(handoff.ctx);
  assert.match(handoff.replies[0], /DESIGN HANDOFF — DASHBOARD KOPI/);
  assert.match(handoff.replies[0], /Breakpoint dan perilaku responsive/);
  assert.match(handoff.replies[0], /State komponen/);
  assert.match(handoff.replies[0], /Lisensi aset\/font/);
});

test('handoff validates that project name is provided', async () => {
  const handoff = context('handoff', []);
  await handleDesignerAssistantCommands(handoff.ctx);
  assert.match(handoff.replies[0], /Format: \.handoff/);
});

test('designqa and handoff are registered as designer commands', () => {
  assert.equal(DESIGNER_ASSISTANT_COMMANDS.has('designqa'), true);
  assert.equal(DESIGNER_ASSISTANT_COMMANDS.has('handoff'), true);
});

test('designproject saves and lists a private project preset', async () => {
  const user = { preferences: {}, save: async function () {} };
  const User = { findOne: async query => query.jid === '628111111111@s.whatsapp.net' ? user : null };
  const saved = context('designproject', ['save', 'Kopi Senja', '|', 'web', '|', 'toko kopi', '|', 'pelanggan', '|', 'mobile-first', '|', 'alam', '|', 'Manrope'], { User });
  await handleDesignerAssistantCommands(saved.ctx);
  assert.match(saved.replies[0], /disimpan/);
  assert.equal(user.preferences.designProjects.length, 1);
  assert.equal(user.preferences.designProjects[0].name, 'Kopi Senja');
  const listed = context('designproject', ['list'], { User });
  await handleDesignerAssistantCommands(listed.ctx);
  assert.match(listed.replies[0], /Kopi Senja/);
});

test('designproject updates project lifecycle status and preserves it on preset edits', async () => {
  const user = { preferences: { designProjects: [{ name: 'Kopi Senja', kind: 'web', theme: 'kopi', audience: 'pelanggan', platform: 'mobile', status: 'planning', createdAt: '2026-01-01T00:00:00.000Z' }] }, save: async function () {} };
  const User = { findOne: async () => user };
  const status = context('designproject', ['status', 'Kopi Senja', '|', 'review'], { User });
  await handleDesignerAssistantCommands(status.ctx);
  assert.match(status.replies[0], /review/);
  assert.equal(user.preferences.designProjects[0].status, 'review');
  const update = context('designproject', ['save', 'Kopi Senja', '|', 'web', '|', 'kopi baru', '|', 'pelanggan', '|', 'mobile'], { User });
  await handleDesignerAssistantCommands(update.ctx);
  assert.equal(user.preferences.designProjects[0].status, 'review');
  assert.equal(user.preferences.designProjects[0].createdAt, '2026-01-01T00:00:00.000Z');
  assert.ok(user.preferences.designProjects[0].updatedAt);
});

test('designproject enforces the per-account project limit', async () => {
  const user = { preferences: { designProjects: Array.from({ length: 10 }, (_, i) => ({ name: `Project ${i}`, kind: 'web', theme: 'tema' })) }, save: async function () {} };
  const User = { findOne: async () => user };
  const ctx = context('designproject', ['save', 'Project Baru', '|', 'web', '|', 'tema', '|', 'audiens', '|', 'mobile'], { User });
  await handleDesignerAssistantCommands(ctx.ctx);
  assert.match(ctx.replies[0], /Batas 10 proyek/);
  assert.equal(user.preferences.designProjects.length, 10);
});

test('designproject supports editing, search, and status filtering', async () => {
  const user = { preferences: { designProjects: [{ name: 'Kopi Senja', kind: 'web', theme: 'kopi organik', audience: 'pelanggan', platform: 'mobile', status: 'progress' }] }, save: async function () {} };
  const User = { findOne: async () => user };
  const edit = context('designproject', ['edit', 'Kopi Senja', '|', '', '|', 'kopi premium', '|', '', '|', '', '|', 'hijau', '|', 'Manrope'], { User });
  await handleDesignerAssistantCommands(edit.ctx);
  assert.equal(user.preferences.designProjects[0].theme, 'kopi premium');
  assert.equal(user.preferences.designProjects[0].status, 'progress');
  assert.ok(user.preferences.designProjects[0].history.length);
  const search = context('designproject', ['search', 'premium'], { User });
  await handleDesignerAssistantCommands(search.ctx);
  assert.match(search.replies[0], /Kopi Senja/);
  const filtered = context('designproject', ['list', 'status', 'progress'], { User });
  await handleDesignerAssistantCommands(filtered.ctx);
  assert.match(filtered.replies[0], /Kopi Senja/);
});

test('designproject duplicates projects and enforces unique names and limit', async () => {
  const user = { preferences: { designProjects: [{ name: 'Kopi Senja', kind: 'web', theme: 'kopi', audience: 'pelanggan', platform: 'mobile', status: 'review' }] }, save: async function () {} };
  const User = { findOne: async () => user };
  const duplicate = context('designproject', ['duplicate', 'Kopi Senja', '|', 'Kopi Senja 2'], { User });
  await handleDesignerAssistantCommands(duplicate.ctx);
  assert.equal(user.preferences.designProjects.length, 2);
  assert.equal(user.preferences.designProjects[0].name, 'Kopi Senja 2');
  assert.equal(user.preferences.designProjects[0].status, 'planning');
  const repeated = context('designproject', ['duplicate', 'Kopi Senja', '|', 'Kopi Senja 2'], { User });
  await handleDesignerAssistantCommands(repeated.ctx);
  assert.match(repeated.replies[0], /sudah digunakan/);
});

test('designproject template and flow generate a usable workflow from a saved preset', async () => {
  const user = { preferences: {}, save: async function () {} };
  const User = { findOne: async () => user };
  const template = context('designproject', ['template', 'web', '|', 'Website Kopi'], { User });
  await handleDesignerAssistantCommands(template.ctx);
  assert.equal(user.preferences.designProjects[0].kind, 'web');
  const flow = context('designproject', ['flow', 'Website Kopi'], { User });
  await handleDesignerAssistantCommands(flow.ctx);
  assert.match(flow.replies[0], /DESIGN WORKFLOW.*WEB/);
  assert.match(flow.replies[0], /Brief ringkas/);
  assert.match(flow.replies[0], /QA sebelum final/);
});

test('designproject status changes are recorded in project history', async () => {
  const user = { preferences: { designProjects: [{ name: 'Kopi Senja', kind: 'web', status: 'planning' }] }, save: async function () {} };
  const User = { findOne: async () => user };
  const status = context('designproject', ['status', 'Kopi Senja', '|', 'review'], { User });
  await handleDesignerAssistantCommands(status.ctx);
  const history = context('designproject', ['history', 'Kopi Senja'], { User });
  await handleDesignerAssistantCommands(history.ctx);
  assert.match(history.replies[0], /planning → review/);
});

test('designproject loads and saves only the active WhatsApp JID workspace', async () => {
  const users = new Map([
    ['628111111111@s.whatsapp.net', { preferences: { designProjects: [{ name: 'Private A', kind: 'web' }] }, save: async function () {} }],
    ['628222222222@s.whatsapp.net', { preferences: { designProjects: [{ name: 'Private B', kind: 'poster' }] }, save: async function () {} }],
  ]);
  const User = { findOne: async query => users.get(query.jid) || null };
  const first = context('designproject', ['list'], { User, userJid: '628111111111@s.whatsapp.net' });
  const second = context('designproject', ['list'], { User, userJid: '628222222222@s.whatsapp.net' });
  await handleDesignerAssistantCommands(first.ctx);
  await handleDesignerAssistantCommands(second.ctx);
  assert.match(first.replies[0], /Private A/);
  assert.doesNotMatch(first.replies[0], /Private B/);
  assert.match(second.replies[0], /Private B/);
  assert.doesNotMatch(second.replies[0], /Private A/);
});

test('designproject exports a complete copy-friendly brief without changing saved data', async () => {
  const project = { name: 'Kopi Senja', kind: 'web', theme: 'kopi premium', audience: 'pelanggan dewasa', platform: 'mobile-first', palette: 'alam', font: 'Manrope', status: 'progress', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-02T00:00:00.000Z' };
  const user = { preferences: { designProjects: [project] }, save: async function () {} };
  const User = { findOne: async () => user };
  const before = structuredClone(user.preferences.designProjects);
  const exported = context('designproject', ['export', 'Kopi Senja'], { User });
  await handleDesignerAssistantCommands(exported.ctx);
  assert.match(exported.replies[0], /EXPORT BRIEF — KOPI SENJA/);
  assert.match(exported.replies[0], /Tema\/produk: kopi premium/);
  assert.match(exported.replies[0], /Platform\/output: mobile-first/);
  assert.match(exported.replies[0], /tidak membuat atau mengirim file desain/);
  assert.deepEqual(user.preferences.designProjects, before);
});

test('color studio generates complementary, analogous, triadic, and monochromatic palettes from HEX', async () => {
  for (const harmony of ['complementary', 'analogous', 'triadic', 'monochromatic']) {
    const result = context('colorpalette', ['#2D6CDF', harmony]);
    await handleDesignerAssistantCommands(result.ctx);
    assert.match(result.replies[0], new RegExp(`COLOR STUDIO — ${harmony.toUpperCase()}`));
    assert.match(result.replies[0], /Warna utama: #2D6CDF/);
    assert.match(result.replies[0], /1\. #/);
    assert.match(result.replies[0], /contrast/);
  }
});

test('color studio rejects invalid HEX and unknown harmony names', async () => {
  const invalidColor = context('colorpalette', ['#GGGGGG', 'triadic']);
  await handleDesignerAssistantCommands(invalidColor.ctx);
  assert.match(invalidColor.replies[0], /Palet tidak dikenali/);
  const invalidHarmony = context('colorpalette', ['#2D6CDF', 'random']);
  await handleDesignerAssistantCommands(invalidHarmony.ctx);
  assert.match(invalidHarmony.replies[0], /complementary\|analogous\|triadic\|monochromatic/);
});

test('color palette collection returns curated palette names, HEX codes, and a WhatsApp PNG swatch', async () => {
  let sent;
  const result = context('colorpalette', ['ocean'], {
    sock: { sendMessage: async (...args) => { sent = args; } },
    remoteJid: 'chat@g.us',
    msg: { key: { id: 'test-message' } },
  });
  await handleDesignerAssistantCommands(result.ctx);
  if (sent) {
    assert.equal(sent[0], 'chat@g.us');
    assert.ok(Buffer.isBuffer(sent[1].image));
    assert.equal(sent[1].mimetype, 'image/png');
    assert.match(sent[1].caption, /COLOR PALETTE — OCEAN/);
    assert.match(sent[1].caption, /#062C43/);
  } else {
    assert.match(result.replies[0], /#062C43/);
    assert.match(result.replies[0], /Contoh visual berupa gambar swatch/);
  }
});

test('color palette search lists matching curated collections', async () => {
  const result = context('colorpalette', ['search', 'lav']);
  await handleDesignerAssistantCommands(result.ctx);
  assert.match(result.replies[0], /lavender/);
});

test('palette kit generates semantic color roles, CSS tokens, and WCAG contrast guidance', async () => {
  const result = context('palettekit', ['ocean']);
  await handleDesignerAssistantCommands(result.ctx);
  assert.match(result.replies[0], /PALETTE KIT — OCEAN/);
  assert.match(result.replies[0], /--color-primary: #062C43/);
  assert.match(result.replies[0], /--color-surface: #F7F9F9/);
  assert.match(result.replies[0], /Pemeriksaan kontras WCAG/);
  assert.match(result.replies[0], /AA teks normal/);
});

test('palette kit gives usage instructions for unknown palette names', async () => {
  const result = context('palettekit', ['not-a-palette']);
  await handleDesignerAssistantCommands(result.ctx);
  assert.match(result.replies[0], /PALETTE KIT/);
  assert.match(result.replies[0], /Palet tersedia/);
});


test('palette visualizer is registered and explains available mockup templates', async () => {
  assert.equal(DESIGNER_ASSISTANT_COMMANDS.has('paletteview'), true);
  const { ctx, replies } = context('paletteview', []);
  await handleDesignerAssistantCommands(ctx);
  assert.match(replies[0], /COLOR PALETTE VISUALIZER/);
  assert.match(replies[0], /landing, product, poster, dashboard/);
});

test('palette visualizer validates palette and template before rendering', async () => {
  const missingPalette = context('paletteview', ['unknown', 'poster']);
  await handleDesignerAssistantCommands(missingPalette.ctx);
  assert.match(missingPalette.replies[0], /Palet .* tidak ditemukan/);
  const invalidTemplate = context('paletteview', ['ocean', 'businesscard']);
  await handleDesignerAssistantCommands(invalidTemplate.ctx);
  assert.match(invalidTemplate.replies[0], /Template tidak dikenal/);
});
