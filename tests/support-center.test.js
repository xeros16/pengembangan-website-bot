import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { handleSupportReportsCommands } from '../features/commands/support-reports.js';
import { handleSupportCenterCommands } from '../features/commands/support-center.js';
import { handleGeneralOwnerCommands } from '../features/commands/general-owner.js';

function matches(row, filter = {}) {
  return Object.entries(filter).every(([key, expected]) => {
    const actual = row[key];
    if (expected && typeof expected === 'object' && '$gte' in expected) {
      return new Date(actual || 0).getTime() >= new Date(expected.$gte).getTime();
    }
    return actual === expected;
  });
}

function makeQuery(rows) {
  let items = [...rows];
  const query = {
    sort(spec = {}) {
      const [key, direction] = Object.entries(spec)[0] || ['createdAt', -1];
      items.sort((a, b) => (new Date(a[key] || 0) - new Date(b[key] || 0)) * (direction < 0 ? -1 : 1));
      return query;
    },
    limit(count) { items = items.slice(0, count); return query; },
    lean() { return query; },
    then(resolve, reject) { return Promise.resolve(items).then(resolve, reject); },
  };
  return query;
}

function makeModels() {
  const tickets = [];
  const reports = [];
  let sequence = 1;
  const makeModel = rows => ({
    rows,
    async create(value) {
      const row = { _id: `id-${sequence++}`, status: 'open', messages: [], ...structuredClone(value), createdAt: new Date(), updatedAt: new Date() };
      rows.push(row);
      return row;
    },
    countDocuments(filter) { return Promise.resolve(rows.filter(row => matches(row, filter)).length); },
    find(filter) { return makeQuery(rows.filter(row => matches(row, filter))); },
    async findOne(filter) { return rows.find(row => matches(row, filter)) || null; },
    async findOneAndUpdate(filter, update) {
      const row = rows.find(item => matches(item, filter));
      if (!row) return null;
      if (update.$set) Object.assign(row, structuredClone(update.$set));
      if (update.$push?.messages) {
        const push = update.$push.messages;
        row.messages.push(...(push.$each || [push]));
        if (Number.isInteger(push.$slice) && push.$slice < 0) row.messages = row.messages.slice(push.$slice);
      }
      row.updatedAt = new Date();
      return row;
    },
  });
  return { Ticket: makeModel(tickets), Report: makeModel(reports), tickets, reports };
}

function makeContext(overrides = {}) {
  const models = makeModels();
  const messages = [];
  const delivered = [];
  const ctx = {
    command: 'ticket',
    args: [],
    PREFIX: '.',
    remoteJid: 'group-a@g.us',
    isGroup: true,
    userJid: 'user-a@s.whatsapp.net',
    sender: 'user-a@s.whatsapp.net',
    msg: { pushName: 'Desainer A', message: {} },
    sock: {},
    Ticket: models.Ticket,
    Report: models.Report,
    getDbReady: () => true,
    isGroupAdmin: async () => false,
    isBotOwner: () => false,
    normalizeJid: value => value,
    sendText: async (_sock, jid, text) => delivered.push({ jid, text }),
    reply: async text => messages.push(text),
    ...overrides,
  };
  return { ctx, models, messages, delivered };
}

test('support center explains the main user journeys and FAQ', async () => {
  const messages = [];
  const ctx = { args: [], PREFIX: '!', reply: async text => messages.push(text) };
  await handleSupportCenterCommands(ctx);
  assert.match(messages.at(-1), /PUSAT BANTUAN/);
  assert.match(messages.at(-1), /!ticket buka/);
  assert.match(messages.at(-1), /!ticket detail/);

  ctx.args = ['faq', 'tidak merespons'];
  await handleSupportCenterCommands(ctx);
  assert.match(messages.at(-1), /Bot tidak merespons/);
  assert.match(messages.at(-1), /!ticket buka/);
});

test('ticket replies are isolated to the originating group for group admins', async () => {
  const { ctx, models, messages, delivered } = makeContext();
  const ticket = await models.Ticket.create({
    groupJid: 'group-a@g.us',
    userJid: 'user-a@s.whatsapp.net',
    userName: 'Desainer A',
    subject: 'Bot tidak merespons',
    messages: [],
  });

  ctx.remoteJid = 'group-b@g.us';
  ctx.userJid = 'admin-b@s.whatsapp.net';
  ctx.sender = ctx.userJid;
  ctx.isGroupAdmin = async () => true;
  ctx.args = ['balas', ticket._id, 'Sudah kami periksa.'];
  await handleSupportReportsCommands(ctx);

  assert.match(messages.at(-1), /tidak ditemukan, berasal dari grup lain/);
  assert.equal(ticket.messages.length, 0);
  assert.equal(delivered.length, 0);
});

test('originating group admin can reply and delivery result is reported', async () => {
  const { ctx, models, messages, delivered } = makeContext();
  const ticket = await models.Ticket.create({
    groupJid: 'group-a@g.us',
    userJid: 'user-a@s.whatsapp.net',
    userName: 'Desainer A',
    subject: 'Bot tidak merespons',
    messages: [],
  });

  ctx.userJid = 'admin-a@s.whatsapp.net';
  ctx.sender = ctx.userJid;
  ctx.isGroupAdmin = async () => true;
  ctx.args = ['balas', ticket._id, 'Sudah kami periksa dan sekarang normal.'];
  await handleSupportReportsCommands(ctx);

  assert.match(messages.at(-1), /berhasil dikirim/);
  assert.equal(ticket.messages.length, 1);
  assert.equal(delivered[0].jid, 'user-a@s.whatsapp.net');
});

test('bot owner can reply to a ticket from any chat', async () => {
  const { ctx, models, messages, delivered } = makeContext();
  const ticket = await models.Ticket.create({
    groupJid: 'group-a@g.us',
    userJid: 'user-a@s.whatsapp.net',
    userName: 'Desainer A',
    subject: 'Butuh bantuan',
    messages: [],
  });

  ctx.remoteJid = 'owner@s.whatsapp.net';
  ctx.isGroup = false;
  ctx.userJid = 'owner@s.whatsapp.net';
  ctx.sender = ctx.userJid;
  ctx.isBotOwner = () => true;
  ctx.args = ['balas', ticket._id, 'Kami sudah menerima laporanmu.'];
  await handleSupportReportsCommands(ctx);

  assert.match(messages.at(-1), /berhasil dikirim/);
  assert.equal(ticket.messages.length, 1);
  assert.equal(delivered.length, 1);
});

test('ticket owner can close their ticket, unrelated group admin cannot', async () => {
  const { ctx, models, messages } = makeContext();
  const ticket = await models.Ticket.create({
    groupJid: 'group-a@g.us',
    userJid: 'user-a@s.whatsapp.net',
    subject: 'Butuh bantuan',
    messages: [],
  });

  ctx.remoteJid = 'group-b@g.us';
  ctx.userJid = 'admin-b@s.whatsapp.net';
  ctx.sender = ctx.userJid;
  ctx.isGroupAdmin = async () => true;
  ctx.args = ['tutup', ticket._id];
  await handleSupportReportsCommands(ctx);
  assert.match(messages.at(-1), /tidak ditemukan atau kamu tidak memiliki izin/);
  assert.equal(ticket.status, 'open');

  ctx.userJid = 'user-a@s.whatsapp.net';
  ctx.sender = ctx.userJid;
  ctx.args = ['tutup', ticket._id];
  await handleSupportReportsCommands(ctx);
  assert.match(messages.at(-1), /ditutup/);
  assert.equal(ticket.status, 'closed');
});

test('ticket creation validates summary and limits open tickets', async () => {
  const { ctx, models, messages } = makeContext();
  ctx.args = ['buka', 'singkat'];
  await handleSupportReportsCommands(ctx);
  assert.match(messages.at(-1), /minimal 8 karakter/);
  assert.equal(models.tickets.length, 0);

  for (let i = 0; i < 3; i += 1) {
    await models.Ticket.create({
      groupJid: 'group-a@g.us',
      userJid: ctx.userJid,
      subject: `Tiket ${i}`,
      messages: [],
    });
  }
  ctx.args = ['buka', 'Bot tidak merespons setelah command'];
  await handleSupportReportsCommands(ctx);
  assert.match(messages.at(-1), /3 tiket terbuka/);
  assert.equal(models.tickets.length, 3);
});

test('reports are group-scoped, avoid exposing JIDs, and can be resolved by group admin', async () => {
  const { ctx, models, messages } = makeContext();
  const report = await models.Report.create({
    groupJid: 'group-a@g.us',
    reporterJid: 'reporter@s.whatsapp.net',
    reporterName: 'Pelapor A',
    targetJid: 'target@s.whatsapp.net',
    reason: 'Spam berulang di grup.',
  });

  ctx.command = 'reports';
  ctx.isGroupAdmin = async () => true;
  ctx.args = [];
  await handleSupportReportsCommands(ctx);
  assert.match(messages.at(-1), /Pelapor A/);
  assert.doesNotMatch(messages.at(-1), /reporter@s\.whatsapp\.net|target@s\.whatsapp\.net/);

  ctx.remoteJid = 'group-b@g.us';
  ctx.args = ['tutup', report._id, 'Sudah ditindaklanjuti'];
  await handleSupportReportsCommands(ctx);
  assert.match(messages.at(-1), /tidak ditemukan di grup ini/);
  assert.equal(report.status, 'open');

  ctx.remoteJid = 'group-a@g.us';
  ctx.args = ['tutup', report._id, 'Sudah ditindaklanjuti'];
  await handleSupportReportsCommands(ctx);
  assert.match(messages.at(-1), /ditandai selesai/);
  assert.equal(report.status, 'closed');
});

test('report command requires a meaningful reason and rejects self-report', async () => {
  const { ctx, models, messages } = makeContext();
  ctx.command = 'report';
  ctx.args = ['spam'];
  await handleSupportReportsCommands(ctx);
  assert.match(messages.at(-1), /minimal 8 karakter/);
  assert.equal(models.reports.length, 0);

  ctx.msg.message = { extendedTextMessage: { contextInfo: { mentionedJid: [ctx.userJid] } } };
  ctx.args = ['Perilaku mengganggu'];
  await handleSupportReportsCommands(ctx);
  assert.match(messages.at(-1), /tidak dapat melaporkan akunmu sendiri/);
  assert.equal(models.reports.length, 0);
});


test('ticket owner can read the latest conversation without exposing sender JIDs', async () => {
  const { ctx, models, messages } = makeContext();
  const ticket = await models.Ticket.create({
    groupJid: 'group-a@g.us',
    userJid: ctx.userJid,
    subject: 'Bot tidak merespons',
    messages: [
      { senderJid: ctx.userJid, text: 'Bot tidak membalas command saya.' },
      { senderJid: 'admin-a@s.whatsapp.net', text: 'Kami sedang memeriksa koneksi bot.' },
    ],
  });
  ctx.args = ['detail', ticket._id];
  await handleSupportReportsCommands(ctx);
  assert.match(messages.at(-1), /DETAIL TIKET/);
  assert.match(messages.at(-1), /\*Kamu:\* Bot tidak membalas command saya/);
  assert.match(messages.at(-1), /\*Tim bantuan:\* Kami sedang memeriksa/);
  assert.doesNotMatch(messages.at(-1), /admin-a@s\.whatsapp\.net|user-a@s\.whatsapp\.net/);
});

test('ticket owner can read their own ticket from a different chat', async () => {
  const { ctx, models, messages } = makeContext();
  const ticket = await models.Ticket.create({
    groupJid: 'group-a@g.us',
    userJid: ctx.userJid,
    subject: 'Tiket dari grup lain',
    messages: [{ senderJid: ctx.userJid, text: 'Saya membuka tiket di grup A.' }],
  });
  ctx.remoteJid = 'group-b@g.us';
  ctx.isGroupAdmin = async () => true;
  ctx.args = ['detail', ticket._id];
  await handleSupportReportsCommands(ctx);
  assert.match(messages.at(-1), /Saya membuka tiket di grup A/);
  assert.match(messages.at(-1), /\*Kamu:\*/);
});

test('group Admin can read only tickets from their own group', async () => {
  const { ctx, models, messages } = makeContext();
  const ticket = await models.Ticket.create({
    groupJid: 'group-a@g.us',
    userJid: 'member-a@s.whatsapp.net',
    subject: 'Masalah grup A',
    messages: [{ senderJid: 'member-a@s.whatsapp.net', text: 'Butuh bantuan.' }],
  });
  ctx.userJid = 'admin-b@s.whatsapp.net';
  ctx.sender = ctx.userJid;
  ctx.remoteJid = 'group-b@g.us';
  ctx.isGroupAdmin = async () => true;
  ctx.args = ['detail', ticket._id];
  await handleSupportReportsCommands(ctx);
  assert.match(messages.at(-1), /tidak memiliki izin/);
  assert.doesNotMatch(messages.at(-1), /Butuh bantuan/);

  ctx.remoteJid = 'group-a@g.us';
  await handleSupportReportsCommands(ctx);
  assert.match(messages.at(-1), /Butuh bantuan/);
});

test('ticket creation is throttled after five new tickets in 24 hours', async () => {
  const { ctx, models, messages } = makeContext();
  for (let i = 0; i < 5; i += 1) {
    await models.Ticket.create({
      groupJid: ctx.remoteJid,
      userJid: ctx.userJid,
      subject: `Tiket lama ${i}`,
      status: 'closed',
      messages: [],
    });
  }
  ctx.args = ['buka', 'Bot tidak merespons setelah command dikirim'];
  await handleSupportReportsCommands(ctx);
  assert.match(messages.at(-1), /5 tiket per 24 jam/);
  assert.equal(models.tickets.length, 5);
});

test('report creation is throttled after three reports in ten minutes per group', async () => {
  const { ctx, models, messages } = makeContext();
  ctx.command = 'report';
  ctx.args = ['Spam berulang pada percakapan grup.'];
  for (let i = 0; i < 3; i += 1) {
    await handleSupportReportsCommands(ctx);
  }
  assert.equal(models.reports.length, 3);
  await handleSupportReportsCommands(ctx);
  assert.match(messages.at(-1), /3 laporan dalam 10 menit/);
  assert.equal(models.reports.length, 3);

  ctx.remoteJid = 'group-b@g.us';
  await handleSupportReportsCommands(ctx);
  assert.equal(models.reports.length, 4, 'the same member has an independent report allowance in another group');
});

test('ticket detail and anti-spam guidance are discoverable to users', async () => {
  const messages = [];
  await handleSupportCenterCommands({ args: ['ticket'], PREFIX: '.', reply: async text => messages.push(text) });
  assert.match(messages.at(-1), /ticket detail <ID>/);
  assert.match(messages.at(-1), /5 tiket baru per 24 jam/);
  assert.match(messages.at(-1), /3 laporan per 10 menit/);
  const catalog = fs.readFileSync(new URL('../features/command-catalog.js', import.meta.url), 'utf8');
  const docs = fs.readFileSync(new URL('../docs/commands.md', import.meta.url), 'utf8');
  assert.match(catalog, /ticket detail ID/);
  assert.match(docs, /ticket detail ID/);
});

test('owner health report includes live WhatsApp connection state and readiness', async () => {
  const messages = [];
  const ctx = {
    command: 'health',
    args: [],
    PREFIX: '.',
    isBotOwner: () => true,
    getDbReady: () => true,
    getReconnecting: () => false,
    getWhatsAppConnectionState: () => 'open',
    senderQueues: new Map([['sender-1', Promise.resolve()]]),
    mongoose: { connection: { readyState: 1 } },
    reply: async text => messages.push(text),
  };
  await handleGeneralOwnerCommands(ctx);
  assert.match(messages.at(-1), /Kesiapan layanan: SIAP/);
  assert.match(messages.at(-1), /WhatsApp: terhubung/);
  assert.match(messages.at(-1), /Database: siap/);
});


test('bot Owner can resolve reports globally', async () => {
  const messages = [];
  let updateFilter;
  const Report = {
    async findOneAndUpdate(filter, update) {
      updateFilter = filter;
      return { _id: 'report-1', ...update.$set };
    },
  };
  const ctx = {
    command: 'reports',
    args: ['tutup', 'report-1', 'Sudah ditindaklanjuti'],
    PREFIX: '.',
    isBotOwner: () => true,
    userJid: 'owner@s.whatsapp.net',
    getDbReady: () => true,
    mongoose: { connection: { readyState: 1 } },
    Report,
    reply: async text => messages.push(text),
  };
  await handleGeneralOwnerCommands(ctx);
  assert.deepEqual(updateFilter, { _id: 'report-1', status: 'open' });
  assert.match(messages.at(-1), /ditandai selesai/);
});


test('Support Center is registered in command routing and remains available during maintenance', () => {
  const router = fs.readFileSync(new URL('../features/command-handler.js', import.meta.url), 'utf8');
  const catalog = fs.readFileSync(new URL('../features/command-catalog.js', import.meta.url), 'utf8');
  assert.match(router, /SUPPORT_CENTER_COMMANDS\.has\(command\)/);
  assert.match(router, /'support', 'ticket', 'report', 'reports'/);
  assert.match(catalog, /SUPPORT_CENTER_COMMANDS/);
});


test('group Admin ticket list is scoped to its group and hides internal account identifiers', async () => {
  const { ctx, models, messages } = makeContext();
  await models.Ticket.create({
    groupJid: 'group-a@g.us',
    userJid: 'member-a@s.whatsapp.net',
    userName: 'Anggota A',
    subject: 'Masalah pada grup A',
    messages: [],
  });
  await models.Ticket.create({
    groupJid: 'group-b@g.us',
    userJid: 'member-b@s.whatsapp.net',
    userName: 'Anggota B',
    subject: 'Masalah pada grup B',
    messages: [],
  });
  ctx.remoteJid = 'group-b@g.us';
  ctx.userJid = 'admin-b@s.whatsapp.net';
  ctx.sender = ctx.userJid;
  ctx.isGroupAdmin = async () => true;
  ctx.args = ['list'];
  await handleSupportReportsCommands(ctx);

  assert.match(messages.at(-1), /Masalah pada grup B/);
  assert.doesNotMatch(messages.at(-1), /Masalah pada grup A/);
  assert.doesNotMatch(messages.at(-1), /member-b@s\.whatsapp\.net/);
});
