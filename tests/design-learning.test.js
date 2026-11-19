import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDesignInspiration, buildDesignLearning, buildDesignChallenge, buildPortfolioGuide,
  getJakartaDateKey, resolveDesignChallenge, DESIGN_LEARNING_COMMANDS, handleDesignLearningCommands
} from '../features/commands/design-learning.js';

test('inspiration and learning commands are registered', () => {
  assert.deepEqual([...DESIGN_LEARNING_COMMANDS].sort(), ['designchallenge', 'designinspire', 'designlearn', 'portfolioguide']);
});

test('designinspire provides category-specific direction, exercise, and search links', () => {
  const output = buildDesignInspiration(['poster', 'cyberpunk', 'merah', 'hitam']);
  assert.match(output, /POSTER/);
  assert.match(output, /cyberpunk merah hitam/);
  assert.match(output, /Tantangan kecil/);
  assert.match(output, /pinterest.com/);
  assert.match(output, /bing.com\/images/);
});

test('designinspire explains usage and rejects unknown categories safely', () => {
  assert.match(buildDesignInspiration([]), /Format:/);
  assert.match(buildDesignInspiration(['xyz']), /belum tersedia/);
});

test('designlearn returns structured material for each level and topic', () => {
  assert.match(buildDesignLearning(['pemula', 'warna']), /JALUR PEMULA/);
  assert.match(buildDesignLearning(['menengah', 'tipografi']), /type scale/i);
  assert.match(buildDesignLearning(['lanjutan', 'layout']), /breakpoint/i);
});

test('designlearn handles invalid levels and default topic', () => {
  assert.match(buildDesignLearning(['ahli']), /Tingkat belum dikenali/);
  assert.match(buildDesignLearning(['pemula']), /Prinsip desain/);
});

test('handler routes to reply without requiring external services', async () => {
  let message = '';
  await handleDesignLearningCommands({ command: 'designlearn', args: ['pemula'], reply: async value => { message = value; } });
  assert.match(message, /DESIGN LEARNING/);
});


test('designchallenge rotates deterministically by WIB day and supports weekly mode', () => {
  const day = new Date('2026-11-09T12:00:00.000Z');
  const first = buildDesignChallenge(['harian'], day);
  const second = buildDesignChallenge(['harian'], day);
  assert.equal(first, second);
  assert.match(first, /DESIGN CHALLENGE — HARIAN/);
  assert.match(buildDesignChallenge(['mingguan'], day), /MINGGUAN/);
});

test('designchallenge supports category filters and rejects unknown categories', () => {
  assert.match(buildDesignChallenge(['harian', 'poster'], new Date('2026-11-09T00:00:00Z')), /Kategori: poster/);
  assert.match(buildDesignChallenge(['harian', 'tidakada']), /belum tersedia/);
  assert.match(buildDesignChallenge([]), /DESIGN CHALLENGE — HARIAN/);
});

test('portfolioguide provides checklist, case study, and bio templates', () => {
  assert.match(buildPortfolioGuide(['checklist']), /PORTFOLIO CHECKLIST/);
  const caseStudy = buildPortfolioGuide(['case-study', 'Kopi', '|', 'Branding', '|', 'Brand', 'belum', 'dikenal', '|', 'Riset', 'dan', 'sketsa', '|', 'Identitas', 'siap', 'dipakai']);
  assert.match(caseStudy, /CASE STUDY — KOPI/);
  assert.match(caseStudy, /Riset dan sketsa/);
  assert.match(caseStudy, /tanpa mengarang angka/);
  assert.match(buildPortfolioGuide(['bio', 'Brand', '|', '2', 'tahun', '|', 'Figma']), /PORTFOLIO BIO BUILDER/);
});

test('portfolioguide preserves blank case-study fields and handles unknown actions', () => {
  const output = buildPortfolioGuide(['case-study', 'Project', '|', '|', 'Masalah', '|', '|', 'Hasil']);
  assert.match(output, /Jenis proyek:\* \[lengkapi bagian ini\]/);
  assert.match(output, /Konteks & masalah:\* Masalah/);
  assert.match(buildPortfolioGuide(['random']), /belum dikenali/);
});

test('handler routes inspiration challenge and portfolio commands', async () => {
  const messages = [];
  const reply = async value => messages.push(value);
  await handleDesignLearningCommands({ command: 'designchallenge', args: ['harian'], reply });
  await handleDesignLearningCommands({ command: 'portfolioguide', args: ['checklist'], reply });
  assert.equal(messages.length, 2);
  assert.match(messages[0], /DESIGN CHALLENGE/);
  assert.match(messages[1], /PORTFOLIO CHECKLIST/);
});


function createFakeUserModel() {
  const rows = new Map();
  return {
    rows,
    async findOne({ jid }) {
      return rows.get(jid) || null;
    },
    async findOneAndUpdate({ jid }, update) {
      const user = rows.get(jid) || { jid, preferences: {} };
      user.preferences ||= {};
      if (update?.$set?.['preferences.learningProgress']) {
        user.preferences.learningProgress = structuredClone(update.$set['preferences.learningProgress']);
      }
      rows.set(jid, user);
      return user;
    },
  };
}

function matchesLearningFilter(row, filter) {
  for (const [key, expected] of Object.entries(filter || {})) {
    if (key === 'feedback.reviewerJid') {
      const reviewers = (row.feedback || []).map(item => item.reviewerJid);
      if (expected && typeof expected === 'object' && '$ne' in expected) {
        if (reviewers.includes(expected.$ne)) return false;
      } else if (!reviewers.includes(expected)) return false;
      continue;
    }
    const actual = row[key];
    if (expected && typeof expected === 'object' && '$ne' in expected) {
      if (actual === expected.$ne) return false;
    } else if (actual !== expected) return false;
  }
  return true;
}

function createFakeLearningSubmissionModel() {
  const rows = [];
  let nextId = 1;
  class Query {
    constructor(items) { this.items = [...items]; }
    sort(spec = {}) {
      const [key, direction] = Object.entries(spec)[0] || ['updatedAt', -1];
      this.items.sort((a, b) => (new Date(b[key]).getTime() - new Date(a[key]).getTime()) * (direction < 0 ? 1 : -1));
      return this;
    }
    limit(count) { this.items = this.items.slice(0, count); return this; }
    then(resolve, reject) { return Promise.resolve(this.items).then(resolve, reject); }
  }
  return {
    rows,
    find(filter) { return new Query(rows.filter(row => matchesLearningFilter(row, filter))); },
    async findOne(filter) { return rows.find(row => matchesLearningFilter(row, filter)) || null; },
    async countDocuments(filter) { return rows.filter(row => matchesLearningFilter(row, filter)).length; },
    async aggregate(pipeline) {
      const filter = pipeline?.[0]?.$match || {};
      const matching = rows.filter(row => matchesLearningFilter(row, filter));
      const total = matching.reduce((sum, row) => sum + (Array.isArray(row.feedback) ? row.feedback.length : 0), 0);
      return matching.length ? [{ _id: null, total }] : [];
    },
    async findOneAndUpdate(filter, update) {
      let row = rows.find(item => matchesLearningFilter(item, filter));
      if (!row && update?.$setOnInsert) {
        row = { ...structuredClone(filter), _id: String(nextId++), feedback: [], ...structuredClone(update.$setOnInsert) };
        rows.push(row);
      }
      if (!row) return null;
      Object.assign(row, structuredClone(update?.$set || {}));
      if (update?.$push?.feedback) row.feedback.push(structuredClone(update.$push.feedback));
      return row;
    },
  };
}

test('Jakarta challenge date changes at WIB midnight, not UTC midnight', () => {
  assert.equal(getJakartaDateKey(new Date('2026-11-12T16:59:59.000Z')), '2026-11-12');
  assert.equal(getJakartaDateKey(new Date('2026-11-12T17:00:00.000Z')), '2026-11-13');
});

test('challenge resolver returns stable metadata for group submissions', () => {
  const now = new Date('2026-11-12T18:00:00.000Z');
  const first = resolveDesignChallenge(['harian', 'poster'], now);
  const second = resolveDesignChallenge(['harian', 'poster'], now);
  assert.equal(first.challengeKey, second.challengeKey);
  assert.equal(first.category, 'poster');
  assert.equal(first.periodLabel, 'Harian · 2026-11-13 WIB');
  assert.equal(resolveDesignChallenge(['harian', 'unknown'], now).error !== undefined, true);
});

test('learning path stores current module, completion and progress per user', async () => {
  const User = createFakeUserModel();
  const replies = [];
  const ctx = {
    command: 'designlearn', args: ['mulai', 'pemula', 'warna'], User,
    userJid: 'learner-1', getDbReady: () => true, PREFIX: '.', reply: async value => replies.push(value),
  };
  await handleDesignLearningCommands(ctx);
  assert.match(replies.at(-1), /Materi aktif tersimpan/i);
  assert.equal(User.rows.get('learner-1').preferences.learningProgress.currentTopic, 'warna');

  ctx.args = ['selesai', 'Sudah mencoba tiga kombinasi palet'];
  await handleDesignLearningCommands(ctx);
  assert.match(replies.at(-1), /MATERI DITANDAI SELESAI/);
  assert.deepEqual(User.rows.get('learner-1').preferences.learningProgress.completedLessons, ['pemula:warna']);

  ctx.args = ['progress'];
  await handleDesignLearningCommands(ctx);
  assert.match(replies.at(-1), /1\/12/);
  assert.match(replies.at(-1), /8%/);
});

test('learning path advances to the next incomplete module and protects reset', async () => {
  const User = createFakeUserModel();
  const replies = [];
  const ctx = {
    command: 'designlearn', args: ['mulai', 'pemula', 'dasar'], User,
    userJid: 'learner-2', getDbReady: () => true, PREFIX: '.', reply: async value => replies.push(value),
  };
  await handleDesignLearningCommands(ctx);
  ctx.args = ['selesai'];
  await handleDesignLearningCommands(ctx);
  ctx.args = ['lanjut'];
  await handleDesignLearningCommands(ctx);
  assert.equal(User.rows.get('learner-2').preferences.learningProgress.currentTopic, 'warna');
  assert.match(replies.at(-1), /DESIGN LEARNING/);
  ctx.args = ['reset'];
  await handleDesignLearningCommands(ctx);
  assert.match(replies.at(-1), /Ketik: \.designlearn reset konfirmasi/);
  assert.equal(User.rows.get('learner-2').preferences.learningProgress.completedLessons.length, 1);
});

test('community challenge submission, gallery and peer feedback stay scoped to one group', async () => {
  const LearningSubmission = createFakeLearningSubmissionModel();
  const replies = [];
  const ctx = {
    command: 'designchallenge',
    args: ['submit', 'harian', 'poster', 'Poster Komunitas', '|', 'https://example.com/karya', '|', 'Saya fokus pada hierarki judul dan kontras.'],
    LearningSubmission,
    userJid: 'designer-1',
    remoteJid: 'group-a@g.us',
    isGroup: true,
    msg: { key: { id: 'msg-1' }, pushName: 'Desainer A' },
    getDbReady: () => true,
    getImageTarget: () => null,
    PREFIX: '.',
    reply: async value => replies.push(value),
  };
  await handleDesignLearningCommands(ctx);
  assert.match(replies.at(-1), /KARYA TERCATAT/);
  assert.equal(LearningSubmission.rows.length, 1);
  const code = LearningSubmission.rows[0].code;
  assert.equal(LearningSubmission.rows[0].workUrl, 'https://example.com/karya');

  ctx.args = ['galeri'];
  await handleDesignLearningCommands(ctx);
  assert.match(replies.at(-1), /GALERI COMMUNITY CHALLENGE/);
  assert.match(replies.at(-1), /Poster Komunitas/);

  ctx.userJid = 'designer-2';
  ctx.msg = { pushName: 'Desainer B' };
  ctx.args = ['feedback', code, '5', 'Hierarki judul sudah kuat, pertahankan kontrasnya.'];
  await handleDesignLearningCommands(ctx);
  assert.match(replies.at(-1), /PEER REVIEW TERSIMPAN/);
  assert.equal(LearningSubmission.rows[0].feedback.length, 1);

  await handleDesignLearningCommands(ctx);
  assert.match(replies.at(-1), /sudah memberi feedback/i);

  ctx.userJid = 'designer-1';
  ctx.args = ['progress'];
  await handleDesignLearningCommands(ctx);
  assert.match(replies.at(-1), /Karya dikirim: \*1\*/);
  assert.match(replies.at(-1), /Masukan diterima: \*1\*/);

  ctx.remoteJid = 'group-b@g.us';
  ctx.args = ['galeri'];
  await handleDesignLearningCommands(ctx);
  assert.match(replies.at(-1), /Belum ada karya/);
});

test('community challenge requires group context, HTTPS links or attached artwork', async () => {
  const LearningSubmission = createFakeLearningSubmissionModel();
  const replies = [];
  const ctx = {
    command: 'designchallenge', args: ['submit', 'harian', 'poster', 'Karya', '|', 'http://example.com/karya'],
    LearningSubmission, userJid: 'designer-1', remoteJid: 'private@s.whatsapp.net',
    isGroup: false, msg: { key: { id: 'msg-2' } }, getDbReady: () => true,
    getImageTarget: () => null, PREFIX: '.', reply: async value => replies.push(value),
  };
  await handleDesignLearningCommands(ctx);
  assert.match(replies.at(-1), /hanya tersedia di grup/i);
  ctx.isGroup = true;
  await handleDesignLearningCommands(ctx);
  assert.match(replies.at(-1), /harus HTTPS/);
  ctx.args = ['submit', 'harian', 'poster', 'Karya', '|', 'https://127.0.0.1/image.png'];
  await handleDesignLearningCommands(ctx);
  assert.match(replies.at(-1), /HTTPS yang valid/);
  assert.equal(LearningSubmission.rows.length, 0);
});


test('learning lessons remain readable without MongoDB, but completion is not falsely saved', async () => {
  const replies = [];
  const ctx = {
    command: 'designlearn', args: ['mulai', 'pemula', 'dasar'],
    User: createFakeUserModel(), userJid: 'offline-learner',
    getDbReady: () => false, PREFIX: '.', reply: async value => replies.push(value),
  };
  await handleDesignLearningCommands(ctx);
  assert.match(replies.at(-1), /DESIGN LEARNING/);
  assert.match(replies.at(-1), /tanpa penyimpanan progress/i);
  ctx.args = ['selesai'];
  await handleDesignLearningCommands(ctx);
  assert.match(replies.at(-1), /MongoDB belum terhubung/i);
});

test('challenge author cannot review own submission and links are not fetched by the bot', async () => {
  const LearningSubmission = createFakeLearningSubmissionModel();
  const replies = [];
  const ctx = {
    command: 'designchallenge',
    args: ['submit', 'harian', 'branding', 'Identitas Brand', '|', 'https://example.com/brand', '|', 'Eksplorasi monokrom terlebih dahulu.'],
    LearningSubmission, userJid: 'owner-designer', remoteJid: 'group-c@g.us',
    isGroup: true, msg: { key: { id: 'msg-3' }, pushName: 'Pemilik Karya' },
    getDbReady: () => true, getImageTarget: () => null, PREFIX: '.',
    reply: async value => replies.push(value),
  };
  await handleDesignLearningCommands(ctx);
  const code = LearningSubmission.rows[0].code;
  ctx.args = ['feedback', code, '5', 'Karyamu memiliki hierarki yang jelas dan konsisten.'];
  await handleDesignLearningCommands(ctx);
  assert.match(replies.at(-1), /tidak dapat memberi feedback pada karya sendiri/i);
  assert.equal(LearningSubmission.rows[0].feedback.length, 0);
});


test('challenge gallery moderation is group-admin-only and can restore a hidden entry', async () => {
  const LearningSubmission = createFakeLearningSubmissionModel();
  const replies = [];
  const ctx = {
    command: 'designchallenge',
    args: ['submit', 'harian', 'social', 'Carousel Edukasi', '|', 'https://example.com/carousel', '|', 'Satu pesan utama per slide.'],
    LearningSubmission, userJid: 'creator-1', remoteJid: 'group-mod@g.us',
    isGroup: true, msg: { key: { id: 'msg-4' }, pushName: 'Creator' },
    getDbReady: () => true, getImageTarget: () => null, PREFIX: '.',
    isGroupAdmin: async () => false, isBotOwner: () => false,
    reply: async value => replies.push(value),
  };
  await handleDesignLearningCommands(ctx);
  const code = LearningSubmission.rows[0].code;

  ctx.userJid = 'member-2';
  ctx.args = ['hide', code, 'konten tidak sesuai aturan grup'];
  await handleDesignLearningCommands(ctx);
  assert.match(replies.at(-1), /Hanya Admin grup atau Owner/i);
  assert.equal(LearningSubmission.rows[0].status, 'active');

  ctx.isGroupAdmin = async () => true;
  await handleDesignLearningCommands(ctx);
  assert.match(replies.at(-1), /disembunyikan dari galeri/);
  assert.equal(LearningSubmission.rows[0].status, 'hidden');
  assert.equal(LearningSubmission.rows[0].moderationNote, 'konten tidak sesuai aturan grup');

  ctx.args = ['restore', code];
  await handleDesignLearningCommands(ctx);
  assert.match(replies.at(-1), /dipulihkan/);
  assert.equal(LearningSubmission.rows[0].status, 'active');
});


test('default challenge submission does not mistake a title beginning with a category for a filter', async () => {
  const LearningSubmission = createFakeLearningSubmissionModel();
  const replies = [];
  const ctx = {
    command: 'designchallenge',
    args: ['submit', 'Poster Komunitas', '|', 'https://example.com/poster', '|', 'Fokus pada satu pesan utama.'],
    LearningSubmission, userJid: 'creator-title', remoteJid: 'group-title@g.us',
    isGroup: true, msg: { key: { id: 'msg-title' }, pushName: 'Creator' },
    getDbReady: () => true, getImageTarget: () => null, PREFIX: '.',
    reply: async value => replies.push(value),
  };
  await handleDesignLearningCommands(ctx);
  assert.equal(LearningSubmission.rows[0].title, 'Poster Komunitas');
  assert.match(replies.at(-1), /KARYA TERCATAT/);
});


function makeFakeDesignBattleModel() {
  const rows = [];
  const matchesBattle = (row, filter = {}) => Object.entries(filter).every(([key, expected]) => {
    const actual = row[key];
    if (expected && typeof expected === 'object' && '$gt' in expected) return new Date(actual).getTime() > new Date(expected.$gt).getTime();
    if (expected && typeof expected === 'object' && '$lte' in expected) return new Date(actual).getTime() <= new Date(expected.$lte).getTime();
    if (expected && typeof expected === 'object' && '$ne' in expected) return actual !== expected.$ne;
    return actual === expected;
  });
  class Query {
    constructor(items) { this.items = [...items]; }
    sort(spec = {}) {
      const [field, direction] = Object.entries(spec)[0] || ['endsAt', 1];
      this.items.sort((a, b) => (new Date(a[field]).getTime() - new Date(b[field]).getTime()) * (direction < 0 ? -1 : 1));
      return this;
    }
    limit(count) { this.items = this.items.slice(0, count); return this; }
    then(resolve, reject) { return Promise.resolve(this.items).then(resolve, reject); }
  }
  return {
    rows,
    find(filter) { return new Query(rows.filter(row => matchesBattle(row, filter))); },
    async findOne(filter) { return rows.find(row => matchesBattle(row, filter)) || null; },
    async updateMany(filter, update) {
      let modifiedCount = 0;
      for (const row of rows) {
        if (matchesBattle(row, filter)) {
          Object.assign(row, structuredClone(update.$set || {}));
          modifiedCount += 1;
        }
      }
      return { modifiedCount };
    },
    async create(data) {
      const row = { _id: String(rows.length + 1), ...structuredClone(data) };
      rows.push(row);
      return row;
    },
    async findOneAndUpdate(filter, update) {
      const row = rows.find(item => matchesBattle(item, filter));
      if (!row) return null;
      Object.assign(row, structuredClone(update.$set || {}));
      return row;
    },
  };
}

test('Design Battle requires group Admin/Owner and validates duration and category', async () => {
  const DesignBattle = makeFakeDesignBattleModel();
  const replies = [];
  const ctx = {
    command: 'designchallenge',
    args: ['battle', 'buat', 'Poster', '|', 'Brief battle desain komunitas yang jelas.', '|', 'poster', '|', '24'],
    isGroup: true, remoteJid: 'battle-group@g.us', userJid: 'admin-1',
    getDbReady: () => true, LearningSubmission: createFakeLearningSubmissionModel(), DesignBattle,
    isGroupAdmin: async () => false, isBotOwner: () => false,
    reply: async text => replies.push(text),
  };
  await handleDesignLearningCommands(ctx);
  assert.equal(DesignBattle.rows.length, 0);
  assert.match(replies.at(-1), /Hanya Admin grup atau Owner/);
  ctx.isGroupAdmin = async () => true;
  ctx.args = ['battle', 'buat', 'Poster', '|', 'Brief battle desain komunitas yang jelas.', '|', 'poster', '|', '240'];
  await handleDesignLearningCommands(ctx);
  assert.equal(DesignBattle.rows.length, 0);
  assert.match(replies.at(-1), /durasi 1–168 jam/);
});

test('Design Battle creation, group-scoped entry, gallery, feedback and close lifecycle', async () => {
  const DesignBattle = makeFakeDesignBattleModel();
  const LearningSubmission = createFakeLearningSubmissionModel();
  const replies = [];
  const ctx = {
    command: 'designchallenge',
    args: ['battle', 'buat', 'Poster Komunitas', '|', 'Buat poster untuk mengajak anggota berbagi ilmu desain.', '|', 'poster', '|', '24'],
    isGroup: true, remoteJid: 'battle-group@g.us', userJid: 'battle-admin',
    msg: { pushName: 'Admin Battle', key: { id: 'msg-1' } },
    getDbReady: () => true, LearningSubmission, DesignBattle,
    isGroupAdmin: async () => true, isBotOwner: () => false,
    getImageTarget: () => false,
    reply: async text => replies.push(text),
  };
  await handleDesignLearningCommands(ctx);
  const battle = DesignBattle.rows[0];
  assert.ok(battle);
  assert.equal(battle.status, 'open');
  assert.match(replies.at(-1), /DESIGN BATTLE DIBUKA/);
  assert.match(replies.at(-1), new RegExp(battle.code));
  ctx.args = ['battle', 'buat', 'Battle Kedua', '|', 'Brief kedua untuk desain komunitas.', '|', 'branding', '|', '24'];
  await handleDesignLearningCommands(ctx);
  assert.equal(DesignBattle.rows.length, 1, 'only one active battle is allowed per group');
  assert.match(replies.at(-1), /Masih ada Design Battle aktif/);

  ctx.userJid = 'participant-1';
  ctx.msg = { pushName: '6281234567890', key: { id: 'submission-message' } };
  ctx.args = ['battle', 'submit', battle.code, 'Poster Ajakan', '|', 'https://example.com/poster', '|', 'Menggunakan hierarki yang jelas'];
  await handleDesignLearningCommands(ctx);
  assert.equal(LearningSubmission.rows.length, 1);
  assert.equal(LearningSubmission.rows[0].challengeMode, 'battle');
  assert.equal(LearningSubmission.rows[0].challengeKey, `battle:${battle.code}`);
  const entryCode = LearningSubmission.rows[0].code;
  assert.match(replies.at(-1), /KARYA MASUK DESIGN BATTLE/);

  LearningSubmission.rows[0].status = 'hidden';
  ctx.args = ['battle', 'submit', battle.code, 'Coba Lewati Moderasi', '|', 'https://example.com/bypass'];
  await handleDesignLearningCommands(ctx);
  assert.equal(LearningSubmission.rows[0].status, 'hidden');
  assert.match(replies.at(-1), /disembunyikan Admin/);
  LearningSubmission.rows[0].status = 'active'; // Simulate an Admin restore before the next valid revision.

  ctx.args = ['battle', 'galeri', battle.code];
  await handleDesignLearningCommands(ctx);
  assert.match(replies.at(-1), /Poster Ajakan/);
  assert.match(replies.at(-1), /— Anggota/);

  ctx.args = ['battle', 'submit', battle.code, 'Poster Ajakan Revisi', '|', 'https://example.com/poster-revisi', '|', 'Memperbaiki hierarki'];
  await handleDesignLearningCommands(ctx);
  assert.equal(LearningSubmission.rows.length, 1, 'a resubmission updates the participant entry');
  assert.equal(LearningSubmission.rows[0].code, entryCode);
  assert.equal(LearningSubmission.rows[0].title, 'Poster Ajakan Revisi');
  assert.equal(LearningSubmission.rows[0].feedback.length, 0, 'old reviews reset when the submitted work changes');

  ctx.userJid = 'participant-2';
  ctx.msg = { pushName: 'Desainer Dua' };
  ctx.args = ['feedback', entryCode, '5', 'Hierarki pesan sudah jelas dan mudah dibaca.'];
  await handleDesignLearningCommands(ctx);
  assert.equal(LearningSubmission.rows[0].feedback.length, 1);
  ctx.args = ['battle', 'hasil', battle.code];
  await handleDesignLearningCommands(ctx);
  assert.match(replies.at(-1), /baru tersedia setelah/);
  ctx.userJid = 'battle-admin';
  ctx.isGroupAdmin = async () => true;
  ctx.args = ['battle', 'tutup', battle.code];
  await handleDesignLearningCommands(ctx);
  assert.equal(battle.status, 'closed');
  assert.match(replies.at(-1), /DESIGN BATTLE DITUTUP/);
  ctx.userJid = 'participant-3';
  ctx.args = ['feedback', entryCode, '4', 'Masukan setelah battle ditutup.'];
  await handleDesignLearningCommands(ctx);
  assert.equal(LearningSubmission.rows[0].feedback.length, 1, 'final score remains immutable after closure');
  assert.match(replies.at(-1), /periode peer review Design Battle sudah ditutup/i);
  ctx.userJid = 'battle-admin';
  ctx.args = ['battle', 'hasil', battle.code];
  await handleDesignLearningCommands(ctx);
  assert.match(replies.at(-1), /Poster Ajakan Revisi/);
  assert.match(replies.at(-1), /Rata-rata 5\.0\/5/);

  ctx.userJid = 'participant-3';
  ctx.args = ['battle', 'submit', battle.code, 'Karya terlambat', '|', 'https://example.com/late'];
  await handleDesignLearningCommands(ctx);
  assert.equal(LearningSubmission.rows.length, 1);
  assert.match(replies.at(-1), /sudah ditutup|melewati batas waktu/i);
});


test('expired open Design Battle is closed before the next group battle is created', async () => {
  const DesignBattle = makeFakeDesignBattleModel();
  await DesignBattle.create({
    code: 'EXPIRED1', groupJid: 'battle-expired@g.us', createdBy: 'old-admin',
    title: 'Battle Lama', brief: 'Brief battle lama yang sudah berakhir.', category: 'poster',
    startsAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
    endsAt: new Date(Date.now() - 1000), status: 'open',
  });
  const replies = [];
  const ctx = {
    command: 'designchallenge',
    args: ['battle', 'buat', 'Battle Baru', '|', 'Brief battle baru untuk komunitas desain.', '|', 'branding', '|', '24'],
    isGroup: true, remoteJid: 'battle-expired@g.us', userJid: 'admin-new',
    msg: { pushName: 'Admin Baru' },
    getDbReady: () => true, LearningSubmission: createFakeLearningSubmissionModel(), DesignBattle,
    isGroupAdmin: async () => true, isBotOwner: () => false,
    reply: async text => replies.push(text),
  };
  await handleDesignLearningCommands(ctx);
  assert.equal(DesignBattle.rows.length, 2);
  assert.equal(DesignBattle.rows[0].status, 'closed');
  assert.equal(DesignBattle.rows[0].closedBy, 'system');
  assert.equal(DesignBattle.rows[1].status, 'open');
  assert.match(replies.at(-1), /DESIGN BATTLE DIBUKA/);
});
