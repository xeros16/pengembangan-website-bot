import test from 'node:test';
import assert from 'node:assert/strict';
import {
  COMMUNITY_SKILLS,
  DESIGN_COMMUNITY_COMMANDS,
  handleDesignCommunityCommands,
  parseCommunitySkills,
  summarizeGrowthActivity,
} from '../features/commands/design-community.js';

function getPath(value, path) {
  const parts = path.split('.');
  let current = [value];
  for (const part of parts) {
    current = current.flatMap(item => {
      if (Array.isArray(item)) return item.map(entry => entry?.[part]).filter(entry => entry !== undefined);
      return item && item[part] !== undefined ? [item[part]] : [];
    });
  }
  return current.length === 1 ? current[0] : current;
}

function compareExpression(row, expression) {
  const [left, right] = expression.$lt;
  const sizeSpec = left.$size.$ifNull;
  const arrayValue = getPath(row, sizeSpec[0].slice(1));
  const size = Array.isArray(arrayValue) ? arrayValue.length : Array.isArray(sizeSpec[1]) ? 0 : 0;
  const subtract = right.$subtract;
  const rightValue = Number(getPath(row, subtract[0].slice(1)) || 0) - Number(subtract[1] || 0);
  return size < rightValue;
}

function matches(row, filter = {}) {
  for (const [key, expected] of Object.entries(filter)) {
    if (key === '$or') {
      if (!expected.some(item => matches(row, item))) return false;
      continue;
    }
    if (key === '$expr') {
      if (!compareExpression(row, expected)) return false;
      continue;
    }
    const actual = getPath(row, key);
    if (expected && typeof expected === 'object' && '$ne' in expected) {
      const values = Array.isArray(actual) ? actual : [actual];
      if (values.includes(expected.$ne)) return false;
    } else if (Array.isArray(actual)) {
      if (!actual.includes(expected)) return false;
    } else if (actual !== expected) return false;
  }
  return true;
}

function makeModel(initial = []) {
  const rows = structuredClone(initial);
  class Query {
    constructor(items) { this.items = [...items]; }
    sort(spec = {}) {
      const [field, direction] = Object.entries(spec)[0] || ['updatedAt', -1];
      this.items.sort((a, b) => {
        const av = new Date(getPath(a, field) || 0).getTime();
        const bv = new Date(getPath(b, field) || 0).getTime();
        return (av - bv) * (direction < 0 ? -1 : 1);
      });
      return this;
    }
    limit(count) { this.items = this.items.slice(0, count); return this; }
    then(resolve, reject) { return Promise.resolve(this.items).then(resolve, reject); }
  }
  return {
    rows,
    find(filter) { return new Query(rows.filter(row => matches(row, filter))); },
    async findOne(filter) { return rows.find(row => matches(row, filter)) || null; },
    async countDocuments(filter) { return rows.filter(row => matches(row, filter)).length; },
    async create(data) {
      const row = { _id: String(rows.length + 1), createdAt: new Date(), updatedAt: new Date(), ...structuredClone(data) };
      rows.push(row);
      return row;
    },
    async deleteOne(filter) {
      const index = rows.findIndex(row => matches(row, filter));
      if (index < 0) return { deletedCount: 0 };
      rows.splice(index, 1);
      return { deletedCount: 1 };
    },
    async findOneAndUpdate(filter, update, options = {}) {
      let row = rows.find(item => matches(item, filter));
      if (!row && options.upsert) {
        row = {};
        for (const [key, value] of Object.entries(filter)) if (!key.startsWith('$') && !key.includes('.')) row[key] = value;
        rows.push(row);
      }
      if (!row) return null;
      Object.assign(row, structuredClone(update.$set || {}));
      if (update.$push) {
        for (const [key, value] of Object.entries(update.$push)) {
          row[key] ||= [];
          row[key].push(structuredClone(value));
        }
      }
      if (update.$pull) {
        for (const [key, criteria] of Object.entries(update.$pull)) {
          row[key] = (row[key] || []).filter(item => !matches(item, criteria));
        }
      }
      row.updatedAt = new Date();
      return row;
    },
  };
}

function makeContext(overrides = {}) {
  const replies = [];
  const ctx = {
    args: [],
    PREFIX: '.',
    isGroup: true,
    remoteJid: 'group-a@g.us',
    userJid: 'member-1@s.whatsapp.net',
    msg: { pushName: 'Desainer Satu' },
    getDbReady: () => true,
    isGroupAdmin: async () => false,
    reply: async text => { replies.push(String(text)); return true; },
    CommunityProfile: makeModel(),
    CommunityCollaboration: makeModel(),
    LearningSubmission: makeModel(),
    User: { async findOne() { return null; } },
    ...overrides,
  };
  return { ctx, replies };
}

test('community command registry and skill normalization are explicit', () => {
  assert.equal(DESIGN_COMMUNITY_COMMANDS.has('designcommunity'), true);
  assert.deepEqual(parseCommunitySkills('logo, uiux, fotografi, logo'), ['branding', 'ui/ux', 'fotografi']);
  assert.deepEqual(parseCommunitySkills('not-a-skill, typo'), []);
  assert.ok(COMMUNITY_SKILLS.includes('branding'));
});

test('mentor matching is opt-in, group-scoped, and can be disabled or deleted', async () => {
  const CommunityProfile = makeModel();
  const { ctx, replies } = makeContext({ CommunityProfile });
  ctx.args = ['mentor', 'branding,uiux'];
  await handleDesignCommunityCommands(ctx);
  assert.match(replies.at(-1), /PROFIL MENTOR DIAKTIFKAN/);
  assert.equal(CommunityProfile.rows[0].visible, true);
  assert.deepEqual(CommunityProfile.rows[0].mentorTopics, ['branding', 'ui/ux']);

  ctx.args = ['intro', 'Saya senang membantu anggota belajar identitas visual.'];
  await handleDesignCommunityCommands(ctx);
  assert.equal(CommunityProfile.rows[0].intro, 'Saya senang membantu anggota belajar identitas visual.');

  CommunityProfile.rows.push({
    groupJid: 'group-b@g.us', userJid: 'other@s.whatsapp.net', displayName: 'Mentor Lain',
    visible: true, mentorOptIn: true, mentorTopics: ['branding'], intro: 'Mentor di grup lain',
  });
  ctx.userJid = 'learner@s.whatsapp.net';
  ctx.msg = { pushName: 'Pembelajar' };
  ctx.args = ['cari', 'branding'];
  await handleDesignCommunityCommands(ctx);
  assert.match(replies.at(-1), /Desainer Satu/);
  assert.doesNotMatch(replies.at(-1), /Mentor Lain/);
  assert.doesNotMatch(replies.at(-1), /member-1@s\.whatsapp\.net/);

  ctx.userJid = 'member-1@s.whatsapp.net';
  ctx.args = ['off'];
  await handleDesignCommunityCommands(ctx);
  assert.equal(CommunityProfile.rows[0].visible, false);
  ctx.userJid = 'learner@s.whatsapp.net';
  ctx.args = ['cari', 'branding'];
  await handleDesignCommunityCommands(ctx);
  assert.match(replies.at(-1), /Belum ada mentor/);

  ctx.userJid = 'member-1@s.whatsapp.net';
  ctx.args = ['hapus'];
  await handleDesignCommunityCommands(ctx);
  assert.equal(CommunityProfile.rows.some(row => row.groupJid === 'group-a@g.us' && row.userJid === 'member-1@s.whatsapp.net'), false);
});

test('learner profile is opt-in and can request multiple supported topics', async () => {
  const CommunityProfile = makeModel();
  const { ctx, replies } = makeContext({ CommunityProfile });
  ctx.args = ['belajar', 'poster,tipografi'];
  await handleDesignCommunityCommands(ctx);
  assert.match(replies.at(-1), /KEBUTUHAN BELAJAR TERCATAT/);
  assert.equal(CommunityProfile.rows[0].visible, true);
  assert.equal(CommunityProfile.rows[0].learnerOptIn, true);
  assert.deepEqual(CommunityProfile.rows[0].seekingTopics, ['poster', 'tipografi']);
  ctx.args = ['profil'];
  await handleDesignCommunityCommands(ctx);
  assert.match(replies.at(-1), /Mencari mentor: poster, tipografi/);
});

test('achievement milestones are derived from learning and community activity', async () => {
  const { ctx, replies } = makeContext({
    User: { async findOne() { return { preferences: { learningProgress: { completedLessons: ['a', 'b', 'c', 'd'] } } }; } },
    LearningSubmission: makeModel([
      ...Array.from({ length: 5 }, (_, i) => ({ groupJid: 'group-a@g.us', userJid: 'member-1@s.whatsapp.net', status: 'active', feedback: [] })),
      ...Array.from({ length: 3 }, (_, i) => ({ groupJid: 'group-a@g.us', userJid: `author-${i}`, status: 'active', feedback: [{ reviewerJid: 'member-1@s.whatsapp.net' }] })),
    ]),
    CommunityProfile: makeModel([{ groupJid: 'group-a@g.us', userJid: 'member-1@s.whatsapp.net', visible: true, mentorOptIn: true }]),
    CommunityCollaboration: makeModel([
      { groupJid: 'group-a@g.us', ownerJid: 'member-1@s.whatsapp.net', collaborators: [] },
      { groupJid: 'group-a@g.us', ownerJid: 'another@s.whatsapp.net', collaborators: [{ userJid: 'member-1@s.whatsapp.net' }] },
    ]),
  });
  ctx.args = ['badges'];
  await handleDesignCommunityCommands(ctx);
  assert.match(replies.at(-1), /Penjelajah Materi/);
  assert.match(replies.at(-1), /Kreator Aktif/);
  assert.match(replies.at(-1), /Apresiasi Komunitas/);
  assert.match(replies.at(-1), /Rekan Kolaborasi/);
  assert.match(replies.at(-1), /Mentor Terbuka/);
  assert.match(replies.at(-1), /bukan sertifikasi/);
});

test('collaboration board creates projects, enforces capacity, supports leave and owner close', async () => {
  const CommunityCollaboration = makeModel();
  const { ctx, replies } = makeContext({ CommunityCollaboration });
  ctx.args = ['collab', 'buat', 'Kampanye Visual Komunitas', '|', 'Membuat rangkaian poster edukasi untuk komunitas desain.', '|', 'poster,ilustrasi', '|', '3'];
  await handleDesignCommunityCommands(ctx);
  assert.match(replies.at(-1), /PROYEK KOLABORASI DIBUKA/);
  const code = CommunityCollaboration.rows[0].code;
  assert.equal(CommunityCollaboration.rows[0].slots, 3);

  ctx.args = ['collab', 'list'];
  await handleDesignCommunityCommands(ctx);
  assert.match(replies.at(-1), /Kampanye Visual Komunitas/);

  ctx.userJid = 'member-2@s.whatsapp.net';
  ctx.msg = { pushName: 'Desainer Dua' };
  ctx.args = ['collab', 'join', code];
  await handleDesignCommunityCommands(ctx);
  assert.match(replies.at(-1), /bergabung dengan proyek/);
  assert.equal(CommunityCollaboration.rows[0].collaborators.length, 1);

  await handleDesignCommunityCommands(ctx);
  assert.match(replies.at(-1), /sudah bergabung/);

  ctx.userJid = 'member-3@s.whatsapp.net';
  ctx.msg = { pushName: 'Desainer Tiga' };
  await handleDesignCommunityCommands(ctx);
  assert.equal(CommunityCollaboration.rows[0].collaborators.length, 2);

  ctx.userJid = 'member-4@s.whatsapp.net';
  ctx.msg = { pushName: 'Desainer Empat' };
  await handleDesignCommunityCommands(ctx);
  assert.match(replies.at(-1), /kapasitas proyek sudah penuh/i);

  ctx.userJid = 'member-2@s.whatsapp.net';
  ctx.args = ['collab', 'leave', code];
  await handleDesignCommunityCommands(ctx);
  assert.match(replies.at(-1), /sudah keluar dari proyek/);
  assert.equal(CommunityCollaboration.rows[0].collaborators.length, 1);

  ctx.userJid = 'member-3@s.whatsapp.net';
  ctx.args = ['collab', 'tutup', code];
  await handleDesignCommunityCommands(ctx);
  assert.match(replies.at(-1), /Hanya pemilik proyek atau Admin grup/);
  assert.equal(CommunityCollaboration.rows[0].status, 'open');

  ctx.userJid = 'member-1@s.whatsapp.net';
  ctx.args = ['collab', 'tutup', code];
  await handleDesignCommunityCommands(ctx);
  assert.match(replies.at(-1), /ditutup/);
  assert.equal(CommunityCollaboration.rows[0].status, 'closed');
});

test('collaboration board rejects cross-group access, self-join, and invalid projects', async () => {
  const CommunityCollaboration = makeModel();
  const { ctx, replies } = makeContext({ CommunityCollaboration });
  ctx.args = ['collab', 'buat', 'Proyek Desain Grup', '|', 'Proyek kecil untuk latihan layout dan poster bersama.', '|', 'layout,poster', '|', '2'];
  await handleDesignCommunityCommands(ctx);
  const code = CommunityCollaboration.rows[0].code;

  ctx.args = ['collab', 'join', code];
  await handleDesignCommunityCommands(ctx);
  assert.match(replies.at(-1), /Pemilik proyek sudah terdaftar/);

  ctx.remoteJid = 'group-b@g.us';
  ctx.userJid = 'member-2@s.whatsapp.net';
  await handleDesignCommunityCommands(ctx);
  assert.match(replies.at(-1), /tidak ditemukan/);

  ctx.args = ['collab', 'buat', 'x', '|', 'singkat', '|', 'unknown', '|', '9'];
  await handleDesignCommunityCommands(ctx);
  assert.match(replies.at(-1), /Format:/);
});

test('community hub refuses private chats and never claims persistence while database is offline', async () => {
  const { ctx, replies } = makeContext();
  ctx.args = ['mentor', 'branding'];
  ctx.isGroup = false;
  ctx.remoteJid = 'private@s.whatsapp.net';
  await handleDesignCommunityCommands(ctx);
  assert.match(replies.at(-1), /hanya tersedia di dalam grup/i);

  ctx.isGroup = true;
  ctx.remoteJid = 'group-a@g.us';
  ctx.getDbReady = () => false;
  await handleDesignCommunityCommands(ctx);
  assert.match(replies.at(-1), /membutuhkan MongoDB/);
});

test('mentor introduction and collaboration brief reject contact details', async () => {
  const CommunityProfile = makeModel([{ groupJid: 'group-a@g.us', userJid: 'member-1@s.whatsapp.net', visible: true, mentorOptIn: true, mentorTopics: ['branding'] }]);
  const CommunityCollaboration = makeModel();
  const { ctx, replies } = makeContext({ CommunityProfile, CommunityCollaboration });
  ctx.args = ['intro', 'Hubungi saya di 081234567890 untuk diskusi desain.'];
  await handleDesignCommunityCommands(ctx);
  assert.match(replies.at(-1), /Jangan masukkan nomor telepon/);
  assert.equal(CommunityProfile.rows[0].intro, undefined);
  ctx.args = ['intro', 'Email saya designer@example.com untuk konsultasi.'];
  await handleDesignCommunityCommands(ctx);
  assert.match(replies.at(-1), /Jangan masukkan nomor telepon/);

  ctx.args = ['collab', 'buat', 'Proyek Desain Grup', '|', 'Hubungi 081234567890 untuk detail proyek desain ini.', '|', 'poster,layout', '|', '3'];
  await handleDesignCommunityCommands(ctx);
  assert.match(replies.at(-1), /Format:/);
  assert.equal(CommunityCollaboration.rows.length, 0);
  ctx.args = ['collab', 'buat', 'Proyek Desain Grup', '|', 'Brief kolaborasi desain dengan tujuan dan pembagian kerja.', '|', 'poster,layout', '|', '3orang'];
  await handleDesignCommunityCommands(ctx);
  assert.match(replies.at(-1), /Format:/);
  assert.equal(CommunityCollaboration.rows.length, 0);
});

test('group Admin can close a collaboration project without becoming its owner', async () => {
  const CommunityCollaboration = makeModel([{
    code: 'ADMIN123', groupJid: 'group-a@g.us', ownerJid: 'owner@s.whatsapp.net', ownerName: 'Owner',
    title: 'Proyek Kolaborasi Admin', brief: 'Proyek desain bersama dengan brief yang cukup jelas.',
    skillsNeeded: ['poster'], slots: 3, collaborators: [], status: 'open',
  }]);
  const { ctx, replies } = makeContext({ CommunityCollaboration, isGroupAdmin: async () => true });
  ctx.userJid = 'admin@s.whatsapp.net';
  ctx.args = ['collab', 'tutup', 'ADMIN123'];
  await handleDesignCommunityCommands(ctx);
  assert.match(replies.at(-1), /ditutup/);
  assert.equal(CommunityCollaboration.rows[0].status, 'closed');
});

test('mentor can discover learners who explicitly opted in within the same group', async () => {
  const CommunityProfile = makeModel([
    { groupJid: 'group-a@g.us', userJid: 'learner-a@s.whatsapp.net', displayName: 'Pembelajar A', visible: true, learnerOptIn: true, seekingTopics: ['poster'] },
    { groupJid: 'group-b@g.us', userJid: 'learner-b@s.whatsapp.net', displayName: 'Pembelajar B', visible: true, learnerOptIn: true, seekingTopics: ['poster'] },
  ]);
  const { ctx, replies } = makeContext({ CommunityProfile });
  ctx.userJid = 'mentor@s.whatsapp.net';
  ctx.args = ['cari', 'belajar', 'poster'];
  await handleDesignCommunityCommands(ctx);
  assert.match(replies.at(-1), /ANGGOTA YANG MENCARI DUKUNGAN/);
  assert.match(replies.at(-1), /Pembelajar A/);
  assert.doesNotMatch(replies.at(-1), /Pembelajar B/);
});

test('Community Hub help remains available in private chat and without MongoDB', async () => {
  const { ctx, replies } = makeContext();
  ctx.isGroup = false;
  ctx.remoteJid = 'private@s.whatsapp.net';
  ctx.getDbReady = () => false;
  ctx.args = ['help'];
  await handleDesignCommunityCommands(ctx);
  assert.match(replies.at(-1), /COMMUNITY HUB/);
  assert.match(replies.at(-1), /collab list/);
});


test('contribution summary is private to the current member and scoped to the current group', async () => {
  const LearningSubmission = makeModel([
    {
      groupJid: 'group-a@g.us', userJid: 'member-1@s.whatsapp.net', status: 'active',
      title: 'Poster Pertama', feedback: [{ reviewerJid: 'reviewer-1', score: 5, comment: 'Bagus' }],
    },
    {
      groupJid: 'group-a@g.us', userJid: 'member-2@s.whatsapp.net', status: 'active',
      title: 'Poster Kedua', feedback: [{ reviewerJid: 'member-1@s.whatsapp.net', score: 4, comment: 'Rapi' }],
    },
    {
      groupJid: 'group-b@g.us', userJid: 'member-1@s.whatsapp.net', status: 'active',
      title: 'Private Other Group', feedback: [],
    },
  ]);
  const CommunityCollaboration = makeModel([
    { groupJid: 'group-a@g.us', ownerJid: 'member-1@s.whatsapp.net', status: 'open' },
    { groupJid: 'group-a@g.us', collaborators: [{ userJid: 'member-1@s.whatsapp.net' }], status: 'open' },
    { groupJid: 'group-b@g.us', ownerJid: 'member-1@s.whatsapp.net', status: 'open' },
  ]);
  const CommunityProfile = makeModel([
    { groupJid: 'group-a@g.us', userJid: 'member-1@s.whatsapp.net', visible: true, mentorOptIn: true, mentorTopics: ['branding'] },
  ]);
  const User = {
    async findOne() {
      return { preferences: { learningProgress: { completedLessons: ['pemula:warna', 'pemula:dasar'] } } };
    },
  };
  const { ctx, replies } = makeContext({ LearningSubmission, CommunityCollaboration, CommunityProfile, User });
  ctx.args = ['ringkasan'];
  await handleDesignCommunityCommands(ctx);
  const output = replies.at(-1);
  assert.match(output, /RINGKASAN KONTRIBUSI DESAINER/);
  assert.match(output, /Materi belajar selesai: 2\/12/);
  assert.match(output, /Karya tantangan aktif: 1/);
  assert.match(output, /Peer review diberikan: 1/);
  assert.match(output, /Masukan diterima: 1/);
  assert.match(output, /Proyek kolaborasi dibuat: 1/);
  assert.match(output, /Proyek kolaborasi diikuti: 1/);
  assert.match(output, /branding/);
  assert.doesNotMatch(output, /member-1@s\.whatsapp\.net/);
  assert.doesNotMatch(output, /Private Other Group/);
});


test('Designer Growth Insights compares only recorded activity across two 30-day windows', () => {
  const now = new Date('2026-11-13T00:00:00.000Z');
  const recent = new Date('2026-11-03T00:00:00.000Z');
  const previous = new Date('2026-10-04T00:00:00.000Z');
  const rows = summarizeGrowthActivity({
    now,
    userJid: 'member-1',
    completionHistory: [
      { key: 'pemula:warna', completedAt: recent.toISOString() },
      { key: 'pemula:dasar', completedAt: previous.toISOString() },
    ],
    ownEntries: [
      { createdAt: recent, feedback: [{ reviewerJid: 'reviewer', createdAt: recent }] },
      { createdAt: previous, feedback: [{ reviewerJid: 'reviewer', createdAt: previous }] },
    ],
    groupEntries: [
      { feedback: [{ reviewerJid: 'member-1', createdAt: recent }, { reviewerJid: 'other', createdAt: recent }] },
      { feedback: [{ reviewerJid: 'member-1', createdAt: previous }] },
    ],
  });
  assert.deepEqual(rows.current, { lessons: 1, submissions: 1, reviewsGiven: 1, reviewsReceived: 1 });
  assert.deepEqual(rows.previous, { lessons: 1, submissions: 1, reviewsGiven: 1, reviewsReceived: 1 });
});

test('Designer Growth Insights returns only private recorded activity for the current account/group', async () => {
  const now = Date.now();
  const recent = new Date(now - 5 * 24 * 60 * 60 * 1000);
  const ownEntries = makeModel([{
    groupJid: 'group-a@g.us', userJid: 'member-1@s.whatsapp.net', status: 'active', createdAt: recent,
    feedback: [{ reviewerJid: 'reviewer@s.whatsapp.net', createdAt: recent }],
  }]);
  const groupEntries = makeModel([{
    groupJid: 'group-a@g.us', userJid: 'member-1@s.whatsapp.net', status: 'active', updatedAt: recent,
    feedback: [{ reviewerJid: 'member-1@s.whatsapp.net', createdAt: recent }],
  }]);
  const User = { async findOne() { return { preferences: { learningProgress: { completedLessons: ['warna'], completionHistory: [{ key: 'pemula:warna', completedAt: recent }] } } }; } };
  const { ctx, replies } = makeContext({ LearningSubmission: {
    find(filter) { return filter.userJid ? ownEntries.find(filter) : groupEntries.find(filter); },
  }, User });
  ctx.args = ['growth'];
  await handleDesignCommunityCommands(ctx);
  assert.match(replies.at(-1), /DESIGNER GROWTH INSIGHTS — PRIVAT/);
  assert.match(replies.at(-1), /Materi selesai: 1/);
  assert.match(replies.at(-1), /Karya dikirim: 1/);
  assert.match(replies.at(-1), /Peer review diberikan: 1/);
  assert.doesNotMatch(replies.at(-1), /member-1@s\.whatsapp\.net|reviewer@s\.whatsapp\.net/);
  assert.match(replies.at(-1), /bukan penilaian kualitas karya/);
});
