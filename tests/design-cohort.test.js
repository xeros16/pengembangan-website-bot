import test from 'node:test';
import assert from 'node:assert/strict';
import { DESIGN_COHORT_COMMANDS, handleDesignCohortCommands } from '../features/commands/design-cohort.js';

function getPath(value, path) {
  const parts = path.split('.');
  let current = [value];
  for (const part of parts) current = current.flatMap(item => Array.isArray(item)
    ? item.map(entry => entry?.[part]).filter(entry => entry !== undefined)
    : item && item[part] !== undefined ? [item[part]] : []);
  return current.length === 1 ? current[0] : current;
}

function matches(row, filter = {}) {
  for (const [key, expected] of Object.entries(filter)) {
    if (key === '$expr') {
      const left = expected.$lt[0].$size.$ifNull[0].slice(1);
      const size = Array.isArray(getPath(row, left)) ? getPath(row, left).length : 0;
      if (!(size < expected.$lt[1])) return false;
      continue;
    }
    const actual = getPath(row, key);
    if (expected && typeof expected === 'object' && '$ne' in expected) {
      const values = Array.isArray(actual) ? actual : [actual];
      if (values.includes(expected.$ne)) return false;
    } else if (expected && typeof expected === 'object' && '$in' in expected) {
      if (!expected.$in.includes(actual)) return false;
    } else if (expected && typeof expected === 'object' && '$lte' in expected) {
      if (new Date(actual).getTime() > new Date(expected.$lte).getTime()) return false;
    } else if (expected && typeof expected === 'object' && '$gt' in expected) {
      if (new Date(actual).getTime() <= new Date(expected.$gt).getTime()) return false;
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
      const [field, direction] = Object.entries(spec)[0] || ['createdAt', -1];
      this.items.sort((a, b) => (new Date(getPath(a, field) || 0).getTime() - new Date(getPath(b, field) || 0).getTime()) * (direction < 0 ? -1 : 1));
      return this;
    }
    limit(value) { this.items = this.items.slice(0, value); return this; }
    then(resolve, reject) { return Promise.resolve(this.items).then(resolve, reject); }
  }
  return {
    rows,
    find(filter) { return new Query(rows.filter(row => matches(row, filter))); },
    async findOne(filter) { return rows.find(row => matches(row, filter)) || null; },
    async countDocuments(filter) { return rows.filter(row => matches(row, filter)).length; },
    async create(data) {
      const row = { _id: `row-${rows.length + 1}`, createdAt: new Date(), updatedAt: new Date(), ...structuredClone(data) };
      rows.push(row);
      return row;
    },
    async deleteMany(filter) {
      const before = rows.length;
      for (let index = rows.length - 1; index >= 0; index -= 1) if (matches(rows[index], filter)) rows.splice(index, 1);
      return { deletedCount: before - rows.length };
    },
    async deleteOne(filter) {
      const index = rows.findIndex(row => matches(row, filter));
      if (index < 0) return { deletedCount: 0 };
      rows.splice(index, 1);
      return { deletedCount: 1 };
    },
    async updateMany(filter, update) {
      let modifiedCount = 0;
      for (const row of rows) if (matches(row, filter)) {
        Object.assign(row, structuredClone(update.$set || {}));
        modifiedCount += 1;
      }
      return { modifiedCount };
    },
    async findOneAndUpdate(filter, update, options = {}) {
      let row = rows.find(item => matches(item, filter));
      if (!row && options.upsert) {
        row = { _id: `row-${rows.length + 1}`, createdAt: new Date(), updatedAt: new Date() };
        for (const [key, value] of Object.entries(filter)) if (!key.startsWith('$') && !key.includes('.')) row[key] = value;
        rows.push(row);
      }
      if (!row) return null;
      Object.assign(row, structuredClone(update.$set || {}));
      for (const [key, value] of Object.entries(update.$push || {})) {
        row[key] ||= [];
        row[key].push(structuredClone(value));
      }
      for (const [key, value] of Object.entries(update.$pull || {})) {
        row[key] ||= [];
        row[key] = row[key].filter(item => !Object.entries(value).every(([field, expected]) => item[field] === expected));
      }
      row.updatedAt = new Date();
      return row;
    },
  };
}

function context({ command = 'cohort', args = [], userJid = 'admin-1', remoteJid = 'design@g.us', isGroup = true, admin = false, msg = {} } = {}, models = {}) {
  const replies = [];
  const ctx = {
    command, args, userJid, sender: userJid, remoteJid, isGroup,
    PREFIX: '.', msg: { pushName: 'Desainer Satu', ...msg },
    getDbReady: () => true,
    isBotOwner: () => false,
    isGroupAdmin: async () => admin,
    reply: async value => replies.push(String(value)),
    LearningCohort: models.LearningCohort || makeModel(),
    LearningCohortCheckin: models.LearningCohortCheckin || makeModel(),
    sock: {},
  };
  return { ctx, replies };
}

test('cohort command is registered and group-scoped', async () => {
  assert.deepEqual([...DESIGN_COHORT_COMMANDS], ['cohort']);
  const direct = context({ isGroup: false });
  await handleDesignCohortCommands(direct.ctx);
  assert.match(direct.replies[0], /hanya tersedia di grup/i);
  const noDb = context();
  noDb.ctx.getDbReady = () => false;
  await handleDesignCohortCommands(noDb.ctx);
  assert.match(noDb.replies[0], /membutuhkan MongoDB/i);
});

test('only group Admin or Owner can create a Learning Cohort', async () => {
  const denied = context({ args: ['buat', 'Dasar', 'Branding', '|', 'Belajar', 'identitas', 'visual', 'secara', 'bertahap.', '|', '4'] });
  await handleDesignCohortCommands(denied.ctx);
  assert.match(denied.replies[0], /Hanya Admin grup/);
  assert.equal(denied.ctx.LearningCohort.rows.length, 0);
});

test('cohort lifecycle supports create, milestone, opt-in join, check-in, facilitator review and private progress', async () => {
  const LearningCohort = makeModel();
  const LearningCohortCheckin = makeModel();
  const models = { LearningCohort, LearningCohortCheckin };
  const creator = context({ admin: true, args: ['buat', 'Dasar', 'Branding', '|', 'Belajar', 'identitas', 'visual', 'secara', 'bertahap.', '|', '4'] }, models);
  await handleDesignCohortCommands(creator.ctx);
  assert.match(creator.replies[0], /LEARNING COHORT DIBUAT/);
  const code = creator.replies[0].match(/Kode: \*([A-Z0-9]+)\*/)[1];
  assert.equal(LearningCohort.rows[0].facilitators[0].userJid, 'admin-1');

  const milestone = context({ admin: true, args: ['milestone', 'tambah', code, '|', 'Brief', 'Visual', '|', 'Buat', 'tiga', 'arah', 'visual.', '|', '7'] }, models);
  await handleDesignCohortCommands(milestone.ctx);
  assert.match(milestone.replies[0], /MILESTONE DITAMBAHKAN/);
  assert.equal(LearningCohort.rows[0].milestones[0].code, 'M01');

  const join = context({ userJid: 'member-1', msg: { pushName: 'Anggota Kreatif' }, args: ['join', code] }, models);
  await handleDesignCohortCommands(join.ctx);
  assert.match(join.replies[0], /berhasil bergabung/);
  assert.equal(LearningCohort.rows[0].members.length, 1);

  const start = context({ admin: true, args: ['mulai', code] }, models);
  await handleDesignCohortCommands(start.ctx);
  assert.match(start.replies[0], /COHORT DIMULAI/);

  const checkin = context({ userJid: 'member-1', msg: { pushName: 'Anggota Kreatif' }, args: ['checkin', code, 'M01', '|', 'Saya', 'membuat', 'tiga', 'alternatif', 'komposisi.', '|', 'https://example.com/work'] }, models);
  await handleDesignCohortCommands(checkin.ctx);
  assert.match(checkin.replies[0], /CHECK-IN TERSIMPAN/);
  const checkinCode = LearningCohortCheckin.rows[0].code;
  assert.equal(LearningCohortCheckin.rows[0].status, 'submitted');

  const review = context({ admin: true, args: ['review', checkinCode, 'approve', '|', 'Hierarki', 'dan', 'kontras', 'sudah', 'jelas.'] }, models);
  await handleDesignCohortCommands(review.ctx);
  assert.match(review.replies[0], /CHECK-IN DITINJAU/);
  assert.equal(LearningCohortCheckin.rows[0].status, 'approved');

  const progress = context({ userJid: 'member-1', args: ['progress', code] }, models);
  await handleDesignCohortCommands(progress.ctx);
  assert.match(progress.replies[0], /PROGRESS COHORT PRIBADI/);
  assert.match(progress.replies[0], /1\/1/);
  assert.doesNotMatch(progress.replies[0], /admin-1|member-1/);
});

test('cohort and check-in lookups cannot cross group boundaries', async () => {
  const LearningCohort = makeModel([{ _id: 'one', code: 'ABC123', groupJid: 'other@g.us', title: 'Other cohort', status: 'active', endsAt: new Date(Date.now() + 86400000), members: [], facilitators: [], milestones: [] }]);
  const models = { LearningCohort, LearningCohortCheckin: makeModel() };
  const detail = context({ args: ['detail', 'ABC123'] }, models);
  await handleDesignCohortCommands(detail.ctx);
  assert.match(detail.replies[0], /tidak ditemukan/);
});

test('facilitator check-in review is denied to unrelated group members', async () => {
  const LearningCohort = makeModel([{ _id: 'cohort-1', code: 'ABC123', groupJid: 'design@g.us', title: 'Design cohort', createdBy: 'creator', facilitators: [{ userJid: 'creator' }], members: [{ userJid: 'member' }], milestones: [], status: 'active', endsAt: new Date(Date.now() + 86400000) }]);
  const LearningCohortCheckin = makeModel([{ _id: 'check-1', code: 'CHECK123', groupJid: 'design@g.us', cohortCode: 'ABC123', milestoneCode: 'M01', userJid: 'member', status: 'submitted' }]);
  const denied = context({ userJid: 'stranger', args: ['review', 'CHECK123', 'approve', '|', 'Catatan', 'review', 'cukup.'] }, { LearningCohort, LearningCohortCheckin });
  await handleDesignCohortCommands(denied.ctx);
  assert.match(denied.replies[0], /Hanya fasilitator cohort/);
  assert.equal(LearningCohortCheckin.rows[0].status, 'submitted');
});


test('participants can delete their own check-ins and creators can delete a cohort with confirmation', async () => {
  const LearningCohort = makeModel([{ _id: 'cohort-1', code: 'ABC12345', groupJid: 'design@g.us', title: 'Design cohort', createdBy: 'creator', facilitators: [{ userJid: 'creator' }], members: [{ userJid: 'member' }], milestones: [], status: 'active', endsAt: new Date(Date.now() + 86400000) }]);
  const LearningCohortCheckin = makeModel([
    { _id: 'check-1', code: 'CHECK1111', groupJid: 'design@g.us', cohortCode: 'ABC12345', milestoneCode: 'M01', userJid: 'member' },
    { _id: 'check-2', code: 'CHECK2222', groupJid: 'design@g.us', cohortCode: 'ABC12345', milestoneCode: 'M01', userJid: 'other' },
  ]);
  const models = { LearningCohort, LearningCohortCheckin };
  const selfDelete = context({ userJid: 'member', args: ['hapusdata', 'ABC12345', 'konfirmasi'] }, models);
  await handleDesignCohortCommands(selfDelete.ctx);
  assert.match(selfDelete.replies[0], /Data cohort pribadimu dihapus/);
  assert.equal(LearningCohortCheckin.rows.length, 1);
  assert.equal(LearningCohortCheckin.rows[0].userJid, 'other');
  assert.equal(LearningCohort.rows[0].members.length, 0);

  const adminDelete = context({ userJid: 'creator', args: ['hapus', 'ABC12345', 'konfirmasi'] }, models);
  await handleDesignCohortCommands(adminDelete.ctx);
  assert.match(adminDelete.replies[0], /Cohort .* dihapus/);
  assert.equal(LearningCohort.rows.length, 0);
  assert.equal(LearningCohortCheckin.rows.length, 0);
});


test('cohort duration and milestone deadlines start only when the facilitator starts the program', async () => {
  const LearningCohort = makeModel();
  const LearningCohortCheckin = makeModel();
  const models = { LearningCohort, LearningCohortCheckin };
  const creator = context({ admin: true, args: ['buat', 'Dasar', 'Branding', '|', 'Belajar', 'identitas', 'visual', 'secara', 'bertahap.', '|', '4'] }, models);
  await handleDesignCohortCommands(creator.ctx);
  const code = creator.replies[0].match(/Kode: \*([A-Z0-9]+)\*/)[1];
  const cohort = LearningCohort.rows[0];
  assert.equal(cohort.startsAt, null);
  assert.equal(cohort.endsAt, null);

  const milestone = context({ admin: true, args: ['milestone', 'tambah', code, '|', 'Brief', 'Visual', '|', 'Buat', 'tiga', 'arah', 'visual.', '|', '7'] }, models);
  await handleDesignCohortCommands(milestone.ctx);
  assert.equal(cohort.milestones[0].dueAt, null);
  assert.equal(cohort.milestones[0].dueDay, 7);

  // Registration can remain open beyond the planned program duration without auto-expiring.
  cohort.createdAt = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000);
  cohort.endsAt = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
  const list = context({ args: ['list'] }, models);
  await handleDesignCohortCommands(list.ctx);
  assert.match(list.replies[0], /Pendaftaran dibuka/);
  assert.equal(cohort.status, 'open');

  const join = context({ userJid: 'member-late', args: ['join', code] }, models);
  await handleDesignCohortCommands(join.ctx);
  assert.match(join.replies[0], /berhasil bergabung/);

  const start = context({ admin: true, args: ['mulai', code] }, models);
  await handleDesignCohortCommands(start.ctx);
  assert.equal(cohort.status, 'active');
  assert.ok(cohort.startedAt instanceof Date);
  assert.ok(cohort.endsAt.getTime() > cohort.startedAt.getTime());
  assert.equal(cohort.endsAt.getTime() - cohort.startedAt.getTime(), 28 * 24 * 60 * 60 * 1000);
  assert.equal(cohort.milestones[0].dueAt.getTime() - cohort.startedAt.getTime(), 7 * 24 * 60 * 60 * 1000);
});

test('former cohort members retain private progress access and can delete their own data after leaving', async () => {
  const LearningCohort = makeModel([{ _id: 'cohort-1', code: 'FORMER01', groupJid: 'design@g.us', title: 'Design cohort', createdBy: 'creator', weeks: 4, facilitators: [{ userJid: 'creator' }], members: [{ userJid: 'former-member' }], milestones: [{ code: 'M01', title: 'Brief', order: 1, dueDay: 7, status: 'open' }], status: 'active', startedAt: new Date(), endsAt: new Date(Date.now() + 86400000) }]);
  const LearningCohortCheckin = makeModel([
    { _id: 'check-1', code: 'CHECKFORM1', groupJid: 'design@g.us', cohortCode: 'FORMER01', milestoneCode: 'M01', userJid: 'former-member', note: 'Saya membuat tiga alternatif visual.', status: 'approved' },
    { _id: 'check-2', code: 'CHECKFORM2', groupJid: 'design@g.us', cohortCode: 'FORMER01', milestoneCode: 'M01', userJid: 'another-member', note: 'Karya anggota lain.', status: 'submitted' },
  ]);
  const models = { LearningCohort, LearningCohortCheckin };

  const leave = context({ userJid: 'former-member', args: ['leave', 'FORMER01'] }, models);
  await handleDesignCohortCommands(leave.ctx);
  assert.equal(LearningCohort.rows[0].members.length, 0);
  assert.equal(LearningCohortCheckin.rows.length, 2, "leaving preserves the user's own history until they choose to delete it");

  const progress = context({ userJid: 'former-member', args: ['progress', 'FORMER01'] }, models);
  await handleDesignCohortCommands(progress.ctx);
  assert.match(progress.replies[0], /PROGRESS COHORT PRIBADI/);
  assert.match(progress.replies[0], /1\/1/);
  assert.doesNotMatch(progress.replies[0], /another-member|creator/);

  const aggregate = context({ userJid: 'creator', args: ['ringkasan', 'FORMER01'] }, models);
  await handleDesignCohortCommands(aggregate.ctx);
  assert.match(aggregate.replies[0], /Disetujui 0\/0 · Menunggu 0 · Revisi 0/,
    'former-member records are not counted against the active member denominator');

  const queue = context({ userJid: 'creator', args: ['kiriman', 'FORMER01'] }, models);
  await handleDesignCohortCommands(queue.ctx);
  assert.match(queue.replies[0], /Belum ada check-in dari peserta aktif/);

  const review = context({ userJid: 'creator', args: ['review', 'CHECKFORM1', 'approve', '|', 'Catatan', 'review', 'cukup.'] }, models);
  await handleDesignCohortCommands(review.ctx);
  assert.match(review.replies[0], /mantan peserta tidak lagi masuk antrean review aktif/);
  assert.equal(LearningCohortCheckin.rows[0].status, 'approved');

  const deletion = context({ userJid: 'former-member', args: ['hapusdata', 'FORMER01', 'konfirmasi'] }, models);
  await handleDesignCohortCommands(deletion.ctx);
  assert.match(deletion.replies[0], /Data cohort pribadimu dihapus/);
  assert.equal(LearningCohortCheckin.rows.length, 1);
  assert.equal(LearningCohortCheckin.rows[0].userJid, 'another-member');
});


test('starting a legacy open cohort preserves its existing milestone day offsets', async () => {
  const oldStart = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000);
  const oldDue = new Date(oldStart.getTime() + 7 * 24 * 60 * 60 * 1000);
  const LearningCohort = makeModel([{ _id: 'legacy-cohort', code: 'LEGACY01', groupJid: 'design@g.us', title: 'Legacy cohort', createdBy: 'creator', weeks: 4, startsAt: oldStart, endsAt: oldDue, status: 'open', facilitators: [{ userJid: 'creator' }], members: [], milestones: [{ code: 'M01', title: 'Brief', description: 'Milestone lama', dueAt: oldDue, order: 1, status: 'open' }] }]);
  const start = context({ userJid: 'creator', args: ['mulai', 'LEGACY01'] }, { LearningCohort, LearningCohortCheckin: makeModel() });
  await handleDesignCohortCommands(start.ctx);
  const cohort = LearningCohort.rows[0];
  assert.equal(cohort.milestones[0].dueDay, 7);
  assert.equal(cohort.milestones[0].dueAt.getTime() - cohort.startedAt.getTime(), 7 * 24 * 60 * 60 * 1000);
});
