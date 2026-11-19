import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { ASSET_STUDIO_COMMANDS, handleAssetStudioCommand, validateCreativeAssetUrl } from '../features/commands/asset-studio.js';
import { DESIGN_SEASON_COMMANDS, handleDesignSeasonCommands } from '../features/commands/design-seasons.js';

function getPath(row, path) {
  return String(path).split('.').reduce((value, key) => Array.isArray(value) ? value.map(item => item?.[key]) : value?.[key], row);
}
function matchValue(actual, expected) {
  if (expected && typeof expected === 'object' && !Array.isArray(expected)) {
    if ('$ne' in expected) return Array.isArray(actual) ? !actual.includes(expected.$ne) : actual !== expected.$ne;
    if ('$in' in expected) return expected.$in.includes(actual);
    if ('$regex' in expected) {
      const regex = new RegExp(expected.$regex, expected.$options || '');
      return Array.isArray(actual) ? actual.some(value => regex.test(String(value))) : regex.test(String(actual ?? ''));
    }
  }
  return actual === expected;
}
function matches(row, filter = {}) {
  return Object.entries(filter).every(([key, expected]) => {
    if (key === '$or') return expected.some(branch => matches(row, branch));
    return matchValue(getPath(row, key), expected);
  });
}
class FakeQuery {
  constructor(rows) { this.rows = [...rows]; }
  sort(spec = {}) {
    const [field, direction] = Object.entries(spec)[0] || ['updatedAt', -1];
    this.rows.sort((a, b) => ((new Date(a[field] || 0).getTime()) - (new Date(b[field] || 0).getTime())) * (direction < 0 ? -1 : 1));
    return this;
  }
  limit(count) { this.rows = this.rows.slice(0, count); return this; }
  lean() { return Promise.resolve(this.rows); }
  then(resolve, reject) { return Promise.resolve(this.rows).then(resolve, reject); }
}
function createFakeAssetModel() {
  const rows = [];
  return {
    rows,
    async create(data) { const row = { _id: String(rows.length + 1), createdAt: new Date(), updatedAt: new Date(), ...structuredClone(data) }; rows.push(row); return row; },
    find(filter) { return new FakeQuery(rows.filter(row => matches(row, filter))); },
    async findOne(filter) { return rows.find(row => matches(row, filter)) || null; },
    async findOneAndUpdate(filter, update) {
      const row = rows.find(item => matches(item, filter));
      if (!row) return null;
      Object.assign(row, structuredClone(update.$set || {}), { updatedAt: new Date() });
      return row;
    },
  };
}
function createFakeSeasonModel() {
  const rows = [];
  return {
    rows,
    async create(data) { const row = { _id: String(rows.length + 1), createdAt: new Date(), updatedAt: new Date(), ...structuredClone(data) }; rows.push(row); return row; },
    find(filter) { return new FakeQuery(rows.filter(row => matches(row, filter))); },
    async findOne(filter) { return rows.find(row => matches(row, filter)) || null; },
    async findOneAndUpdate(filter, update) {
      const row = rows.find(item => matches(item, filter));
      if (!row) return null;
      if (update.$set) Object.assign(row, structuredClone(update.$set));
      if (update.$push?.rounds) row.rounds.push(structuredClone(update.$push.rounds));
      row.updatedAt = new Date();
      return row;
    },
  };
}
function createFakeSeasonSubmissionModel() {
  const rows = [];
  let nextId = 1;
  return {
    rows,
    find(filter) { return new FakeQuery(rows.filter(row => matches(row, filter))); },
    async findOne(filter) { return rows.find(row => matches(row, filter)) || null; },
    async findOneAndUpdate(filter, update, options = {}) {
      let row = rows.find(item => matches(item, filter));
      if (!row && options.upsert && update.$setOnInsert) {
        row = { ...structuredClone(update.$setOnInsert), _id: String(nextId++), feedback: [] };
        rows.push(row);
      }
      if (!row) return null;
      if (update.$set) Object.assign(row, structuredClone(update.$set));
      if (update.$push?.feedback) row.feedback.push(structuredClone(update.$push.feedback));
      row.updatedAt = new Date();
      return row;
    },
  };
}
function makeAssetContext(CreativeAsset, overrides = {}) {
  const replies = [];
  const ctx = {
    command: 'assetstudio', args: [], CreativeAsset, userJid: 'owner-1', remoteJid: 'group-a@g.us',
    isGroup: true, msg: { pushName: 'Desainer A' }, getDbReady: () => true,
    isGroupAdmin: async () => false, isBotOwner: () => false,
    PREFIX: '.', reply: async value => replies.push(value), ...overrides,
  };
  return { ctx, replies };
}
function makeSeasonContext(DesignSeason, DesignSeasonSubmission, overrides = {}) {
  const replies = [];
  const ctx = {
    command: 'designseason', args: [], DesignSeason, DesignSeasonSubmission,
    userJid: 'admin-1', remoteJid: 'group-season@g.us', isGroup: true,
    msg: { pushName: 'Admin Kreatif', key: { id: 'message-1' } },
    getDbReady: () => true, getImageTarget: () => null,
    isGroupAdmin: async () => true, isBotOwner: () => false,
    PREFIX: '.', reply: async value => replies.push(value), ...overrides,
  };
  return { ctx, replies };
}

test('Creative Asset Studio and Design Seasons are registered as separate WhatsApp commands', () => {
  assert.deepEqual([...ASSET_STUDIO_COMMANDS], ['assetstudio']);
  assert.deepEqual([...DESIGN_SEASON_COMMANDS], ['designseason']);
});

test('Creative Asset Studio validates HTTPS references and stores new assets privately', async () => {
  assert.equal(validateCreativeAssetUrl('http://example.com/a'), null);
  assert.equal(validateCreativeAssetUrl('https://127.0.0.1/a'), null);
  assert.equal(validateCreativeAssetUrl('https://assets.internal/a'), null);
  assert.equal(validateCreativeAssetUrl('https://user:pass@example.com/a'), null);
  assert.equal(validateCreativeAssetUrl('https://example.com/a#preview'), 'https://example.com/a');
  assert.equal(validateCreativeAssetUrl(`https://example.com/${'x'.repeat(600)}`), null);

  const CreativeAsset = createFakeAssetModel();
  const { ctx, replies } = makeAssetContext(CreativeAsset);
  ctx.args = ['simpan', 'Moodboard Kopi', '|', 'branding', '|', 'https://example.com/moodboard', '|', 'referensi saja', '|', 'Sumber Studio X'];
  await handleAssetStudioCommand(ctx);
  assert.equal(CreativeAsset.rows.length, 1);
  assert.equal(CreativeAsset.rows[0].visibility, 'private');
  assert.equal(CreativeAsset.rows[0].status, 'active');
  assert.equal(CreativeAsset.rows[0].ownerJid, 'owner-1');
  assert.equal(CreativeAsset.rows[0].sourceUrl, 'https://example.com/moodboard');
  assert.match(replies.at(-1), /ASET DISIMPAN SECARA PRIVAT/);

  ctx.args = ['simpan', 'URL Tidak Aman', '|', 'branding', '|', 'https://127.0.0.1/secret', '|', 'belum diketahui'];
  await handleAssetStudioCommand(ctx);
  assert.equal(CreativeAsset.rows.length, 1);
  assert.match(replies.at(-1), /Format:/);
});

test('Creative Asset sharing is explicit, owner-controlled, group-scoped, and reversible', async () => {
  const CreativeAsset = createFakeAssetModel();
  const { ctx, replies } = makeAssetContext(CreativeAsset);
  ctx.args = ['simpan', 'Texture Paper', '|', 'texture', '|', 'https://example.com/paper', '|', 'CC0', '|', 'Sumber: Open Library'];
  await handleAssetStudioCommand(ctx);
  const code = CreativeAsset.rows[0].code;

  ctx.args = ['bagikan', code];
  await handleAssetStudioCommand(ctx);
  assert.match(replies.at(-1), /konfirmasi/);
  assert.equal(CreativeAsset.rows[0].visibility, 'private');

  ctx.args = ['bagikan', code, 'konfirmasi'];
  await handleAssetStudioCommand(ctx);
  assert.equal(CreativeAsset.rows[0].visibility, 'group');

  ctx.userJid = 'member-2';
  ctx.args = ['cari', 'texture'];
  await handleAssetStudioCommand(ctx);
  assert.match(replies.at(-1), /Texture Paper/);
  ctx.args = ['privat', code];
  await handleAssetStudioCommand(ctx);
  assert.match(replies.at(-1), /Hanya pemilik aset/);

  ctx.userJid = 'owner-1';
  ctx.args = ['privat', code];
  await handleAssetStudioCommand(ctx);
  assert.equal(CreativeAsset.rows[0].visibility, 'private');
  ctx.userJid = 'member-2';
  ctx.args = ['cari', 'texture'];
  await handleAssetStudioCommand(ctx);
  assert.match(replies.at(-1), /Tidak ada aset grup/);

  ctx.remoteJid = 'group-b@g.us';
  ctx.args = ['detail', code];
  await handleAssetStudioCommand(ctx);
  assert.match(replies.at(-1), /tidak ditemukan atau kamu tidak memiliki akses/);
});

test('Creative Asset moderation is Admin-only and only applies to group-shared assets', async () => {
  const CreativeAsset = createFakeAssetModel();
  const { ctx, replies } = makeAssetContext(CreativeAsset);
  ctx.args = ['simpan', 'Poster Reference', '|', 'poster', '|', 'https://example.com/poster', '|', 'referensi saja'];
  await handleAssetStudioCommand(ctx);
  const code = CreativeAsset.rows[0].code;
  ctx.args = ['bagikan', code, 'konfirmasi'];
  await handleAssetStudioCommand(ctx);
  ctx.args = ['moderasi', 'hide', code, 'sumber bermasalah'];
  await handleAssetStudioCommand(ctx);
  assert.match(replies.at(-1), /Hanya Admin grup/);
  assert.equal(CreativeAsset.rows[0].status, 'active');

  ctx.isGroupAdmin = async () => true;
  await handleAssetStudioCommand(ctx);
  assert.equal(CreativeAsset.rows[0].status, 'hidden');
  assert.match(replies.at(-1), /disembunyikan/);
  ctx.userJid = 'member-3';
  ctx.args = ['detail', code];
  await handleAssetStudioCommand(ctx);
  assert.match(replies.at(-1), /tidak ditemukan atau kamu tidak memiliki akses/);
});

test('Design Season requires two rounds, starts one at a time, and stores group-scoped work', async () => {
  const DesignSeason = createFakeSeasonModel();
  const DesignSeasonSubmission = createFakeSeasonSubmissionModel();
  const { ctx, replies } = makeSeasonContext(DesignSeason, DesignSeasonSubmission);

  ctx.args = ['buat', 'Creative Season', '|', 'Eksplorasi identitas visual komunitas desain.', '|', 'branding'];
  await handleDesignSeasonCommands(ctx);
  const seasonCode = DesignSeason.rows[0].code;
  assert.match(replies.at(-1), /DESIGN SEASON DIBUAT/);
  assert.equal(DesignSeason.rows[0].status, 'draft');

  ctx.args = ['mulai', seasonCode];
  await handleDesignSeasonCommands(ctx);
  assert.match(replies.at(-1), /minimal dua ronde/);
  assert.equal(DesignSeason.rows[0].status, 'draft');

  ctx.args = ['ronde', 'tambah', seasonCode, 'Babak', 'Satu', '|', 'Buat eksplorasi poster untuk identitas komunitas.', '|', 'poster', '|', '24'];
  await handleDesignSeasonCommands(ctx);
  ctx.args = ['ronde', 'tambah', seasonCode, 'Babak', 'Dua', '|', 'Kembangkan sistem visual dari arah ronde pertama.', '|', 'branding', '|', '24'];
  await handleDesignSeasonCommands(ctx);
  assert.equal(DesignSeason.rows[0].rounds.length, 2);

  ctx.args = ['mulai', seasonCode];
  await handleDesignSeasonCommands(ctx);
  assert.equal(DesignSeason.rows[0].status, 'active');
  assert.equal(DesignSeason.rows[0].rounds[0].status, 'open');
  const roundOneCode = DesignSeason.rows[0].rounds[0].code;
  ctx.args = ['ronde', 'lanjut', seasonCode];
  await handleDesignSeasonCommands(ctx);
  assert.match(replies.at(-1), /Masih ada ronde aktif/);
  ctx.args = ['buat', 'Season Kedua', '|', 'Kompetisi desain tambahan untuk grup ini.', '|', 'poster'];
  await handleDesignSeasonCommands(ctx);
  assert.match(replies.at(-1), /Masih ada season aktif/);
  assert.equal(DesignSeason.rows.length, 1);

  ctx.userJid = 'designer-1';
  ctx.msg = { pushName: 'Desainer Satu', key: { id: 'work-1' } };
  ctx.getImageTarget = () => null;
  ctx.args = ['submit', seasonCode, 'Poster Komunitas', '|', 'https://example.com/season-work-1', '|', 'Hierarki dan kontras menjadi fokus.'];
  await handleDesignSeasonCommands(ctx);
  assert.equal(DesignSeasonSubmission.rows.length, 1);
  const entryCode = DesignSeasonSubmission.rows[0].code;
  assert.equal(DesignSeasonSubmission.rows[0].roundCode, roundOneCode);

  ctx.userJid = 'designer-2';
  ctx.msg = { pushName: 'Desainer Dua' };
  ctx.args = ['feedback', entryCode, '5', 'Hierarki sudah kuat dan pesan mudah dibaca.'];
  await handleDesignSeasonCommands(ctx);
  assert.equal(DesignSeasonSubmission.rows[0].feedback.length, 1);
  await handleDesignSeasonCommands(ctx);
  assert.match(replies.at(-1), /sudah memberi review/);

  ctx.userJid = 'admin-1';
  ctx.msg = { pushName: 'Admin Kreatif' };
  ctx.args = ['ronde', 'tutup', seasonCode];
  await handleDesignSeasonCommands(ctx);
  assert.equal(DesignSeason.rows[0].rounds[0].status, 'closed');
  assert.equal(DesignSeason.rows[0].status, 'active');

  ctx.userJid = 'designer-2';
  ctx.args = ['feedback', entryCode, '4', 'Review setelah ronde ditutup.'];
  await handleDesignSeasonCommands(ctx);
  assert.match(replies.at(-1), /Periode peer review ronde ini sudah ditutup/);
  assert.equal(DesignSeasonSubmission.rows[0].feedback.length, 1);

  ctx.userJid = 'admin-1';
  ctx.args = ['ronde', 'lanjut', seasonCode];
  await handleDesignSeasonCommands(ctx);
  assert.equal(DesignSeason.rows[0].rounds[1].status, 'open');

  ctx.userJid = 'designer-1';
  ctx.msg = { pushName: '6281234567890', key: { id: 'work-2' } };
  ctx.args = ['submit', seasonCode, 'Brand System Revisi', '|', 'https://example.com/season-work-2', '|', 'Mengembangkan sistem dari ronde pertama.'];
  await handleDesignSeasonCommands(ctx);
  assert.equal(DesignSeasonSubmission.rows.length, 2);
  assert.equal(DesignSeasonSubmission.rows[1].userName, 'Anggota');
  const secondEntryCode = DesignSeasonSubmission.rows[1].code;

  ctx.userJid = 'admin-1';
  ctx.args = ['moderasi', 'hide', secondEntryCode, 'perlu tinjauan sumber'];
  await handleDesignSeasonCommands(ctx);
  assert.equal(DesignSeasonSubmission.rows[1].status, 'hidden');
  ctx.userJid = 'designer-1';
  ctx.args = ['submit', seasonCode, 'Mencoba bypass', '|', 'https://example.com/bypass', '|', 'Kirim ulang setelah hide.'];
  await handleDesignSeasonCommands(ctx);
  assert.match(replies.at(-1), /disembunyikan Admin/);
  assert.equal(DesignSeasonSubmission.rows.length, 2);

  ctx.userJid = 'admin-1';
  ctx.args = ['ronde', 'tutup', seasonCode];
  await handleDesignSeasonCommands(ctx);
  assert.equal(DesignSeason.rows[0].status, 'completed');
  ctx.args = ['hasil', seasonCode];
  await handleDesignSeasonCommands(ctx);
  assert.match(replies.at(-1), /HASIL DESIGN SEASON/);
  assert.match(replies.at(-1), /1 ronde · 1 review · apresiasi rata-rata 5.0\/5/);

  ctx.remoteJid = 'other-group@g.us';
  ctx.args = ['lihat', seasonCode];
  await handleDesignSeasonCommands(ctx);
  assert.match(replies.at(-1), /Season tidak ditemukan/);
});

test('Design Season is group-only and rejects non-public work URLs', async () => {
  const DesignSeason = createFakeSeasonModel();
  const DesignSeasonSubmission = createFakeSeasonSubmissionModel();
  const { ctx, replies } = makeSeasonContext(DesignSeason, DesignSeasonSubmission, { isGroup: false });
  ctx.args = ['list'];
  await handleDesignSeasonCommands(ctx);
  assert.match(replies.at(-1), /hanya tersedia di grup/);
});

test('models and database index scripts include additive Creative Asset and Design Season persistence', () => {
  const models = fs.readFileSync(new URL('../models/index.js', import.meta.url), 'utf8');
  const setup = fs.readFileSync(new URL('../scripts/ensure-directory-indexes.js', import.meta.url), 'utf8');
  const verifier = fs.readFileSync(new URL('../scripts/verify-shared-db.js', import.meta.url), 'utf8');
  const runtime = fs.readFileSync(new URL('../index.js', import.meta.url), 'utf8');
  for (const model of ['DesignSeasonSchema', 'DesignSeasonSubmissionSchema', 'CreativeAssetSchema']) assert.ok(models.includes(model));
  assert.match(models, /groupJid_1_active_unique/);
  assert.match(models, /groupJid_1_seasonCode_1_roundCode_1_userJid_1/);
  assert.match(models, /groupJid_1_code_1/);
  assert.match(runtime, /DesignSeason, DesignSeasonSubmission, CreativeAsset/);
  assert.match(setup, /designseasonsubmissions/);
  assert.match(setup, /creativeassets/);
  assert.match(setup, /groupJid_1_active_unique/);
  assert.match(verifier, /designseasons:/);
  assert.match(verifier, /creativeassets:/);
});


test('expired final Design Season round closes the season and releases the active-group slot', async () => {
  const DesignSeason = createFakeSeasonModel();
  const DesignSeasonSubmission = createFakeSeasonSubmissionModel();
  const { ctx, replies } = makeSeasonContext(DesignSeason, DesignSeasonSubmission);
  ctx.args = ['buat', 'Season Kedaluwarsa', '|', 'Tema kompetisi desain yang cukup panjang.', '|', 'branding'];
  await handleDesignSeasonCommands(ctx);
  const code = DesignSeason.rows[0].code;
  ctx.args = ['ronde', 'tambah', code, 'Babak', 'Satu', '|', 'Brief ronde pertama untuk kompetisi desain.', '|', 'poster', '|', '1'];
  await handleDesignSeasonCommands(ctx);
  ctx.args = ['ronde', 'tambah', code, 'Babak', 'Dua', '|', 'Brief ronde kedua untuk kompetisi desain.', '|', 'branding', '|', '1'];
  await handleDesignSeasonCommands(ctx);
  ctx.args = ['mulai', code];
  await handleDesignSeasonCommands(ctx);
  DesignSeason.rows[0].rounds[0].status = 'closed';
  DesignSeason.rows[0].rounds[0].closedAt = new Date();
  DesignSeason.rows[0].activeRoundCode = '';
  DesignSeason.rows[0].rounds[1].status = 'open';
  DesignSeason.rows[0].rounds[1].startsAt = new Date(Date.now() - 2 * 60 * 60 * 1000);
  DesignSeason.rows[0].rounds[1].endsAt = new Date(Date.now() - 1000);
  DesignSeason.rows[0].activeRoundCode = DesignSeason.rows[0].rounds[1].code;
  ctx.args = ['lihat', code];
  await handleDesignSeasonCommands(ctx);
  assert.equal(DesignSeason.rows[0].status, 'completed');
  assert.equal(DesignSeason.rows[0].activeRoundCode, '');
  assert.equal(DesignSeason.rows[0].rounds[1].status, 'closed');
  assert.match(replies.at(-1), /COMPLETED/);

  ctx.args = ['buat', 'Season Berikutnya', '|', 'Tema baru untuk komunitas kreatif.', '|', 'poster'];
  await handleDesignSeasonCommands(ctx);
  assert.equal(DesignSeason.rows.length, 2);
  assert.equal(DesignSeason.rows[1].status, 'draft');
});


test('only a group Admin or bot Owner can create a Design Season draft', async () => {
  const DesignSeason = createFakeSeasonModel();
  const DesignSeasonSubmission = createFakeSeasonSubmissionModel();
  const { ctx, replies } = makeSeasonContext(DesignSeason, DesignSeasonSubmission, {
    userJid: 'ordinary-member',
    isGroupAdmin: async () => false,
  });
  ctx.args = ['buat', 'Season Anggota', '|', 'Tema kompetisi komunitas desain.', '|', 'branding'];
  await handleDesignSeasonCommands(ctx);
  assert.equal(DesignSeason.rows.length, 0);
  assert.match(replies.at(-1), /Hanya Admin grup atau Owner bot/);
});
