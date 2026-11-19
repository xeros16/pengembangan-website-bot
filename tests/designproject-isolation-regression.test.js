import test from 'node:test';
import assert from 'node:assert/strict';
import { handleDesignerAssistantCommands } from '../features/commands/designer-assistant.js';

const A = '628111111111@s.whatsapp.net';
const B = '628222222222@s.whatsapp.net';

function makeUsers() {
  const saves = { [A]: 0, [B]: 0 };
  const make = (jid, projects) => ({ jid, preferences: { theme: 'keep-me', designProjects: projects }, save: async function () { saves[jid] += 1; } });
  const users = new Map([
    [A, make(A, [{ name: 'Rahasia A', kind: 'web', theme: 'tema-rahasia-a', audience: 'aud-a', platform: 'plat-a', palette: 'pal-a', font: 'font-a', status: 'planning', createdAt: '2026-01-01', updatedAt: '2026-01-01', history: [{ event: 'created', at: '2026-01-01' }] }])],
    [B, make(B, [{ name: 'Milik B', kind: 'poster', theme: 'tema-b', audience: 'aud-b', platform: 'plat-b', status: 'planning', history: [] }])],
  ]);
  return { users, saves, User: { findOne: async query => users.get(query.jid) || null } };
}

async function as(jid, User, args) {
  const replies = [];
  await handleDesignerAssistantCommands({
    command: 'designproject', args, PREFIX: '.', userJid: jid, sender: jid, phoneJid: jid, senderIdentityAliases: [],
    User, isBotOwner: () => false, reply: async text => { replies.push(String(text)); },
  });
  return replies.join('\n');
}
const snapshot = user => JSON.stringify(user.preferences);

test('user B cannot read, search, export, view, or flow user A projects', async () => {
  const { User } = makeUsers();
  for (const args of [['show', 'Rahasia A'], ['export', 'Rahasia A'], ['history', 'Rahasia A'], ['flow', 'Rahasia A']]) {
    const text = await as(B, User, args);
    assert.match(text, /tidak ditemukan/i, `aksi ${args[0]} harus gagal`);
    assert.doesNotMatch(text, /tema-rahasia-a|aud-a|plat-a|pal-a|font-a/);
  }
  const search = await as(B, User, ['search', 'tema-rahasia-a']);
  assert.match(search, /Tidak ada proyek yang cocok/);
  const list = await as(B, User, ['list']);
  assert.match(list, /Milik B/);
  assert.doesNotMatch(list, /Rahasia A/);
});

test('user B cannot modify, delete, duplicate, or change status of user A projects, and A data is untouched', async () => {
  const { users, saves, User } = makeUsers();
  const before = snapshot(users.get(A));
  for (const args of [
    ['edit', 'Rahasia A', '|', 'poster'],
    ['status', 'Rahasia A', '|', 'done'],
    ['delete', 'Rahasia A'],
    ['duplicate', 'Rahasia A', '|', 'Salinan'],
  ]) {
    const text = await as(B, User, args);
    assert.match(text, /tidak ditemukan|Format/i, `aksi ${args[0]} harus ditolak`);
  }
  assert.equal(snapshot(users.get(A)), before);
  assert.equal(saves[A], 0);
  assert.equal(users.get(B).preferences.designProjects.length, 1);
});

test('save, template, and edit by B write only into B document and preserve unrelated preferences', async () => {
  const { users, saves, User } = makeUsers();
  const beforeA = snapshot(users.get(A));
  await as(B, User, ['save', 'Rahasia A', '|', 'logo', '|', 't', '|', 'a', '|', 'p']);
  await as(B, User, ['template', 'web', '|', 'Situs B']);
  await as(B, User, ['edit', 'Situs B', '|', 'app']);
  assert.equal(snapshot(users.get(A)), beforeA);
  assert.equal(saves[A], 0);
  assert.ok(saves[B] >= 3);
  assert.equal(users.get(B).preferences.theme, 'keep-me');
  assert.equal(users.get(A).preferences.designProjects[0].theme, 'tema-rahasia-a');
});

test('duplicate keeps the copy inside the same account and does not alias the source history', async () => {
  const { users, User } = makeUsers();
  await as(A, User, ['duplicate', 'Rahasia A', '|', 'Salinan A']);
  const projects = users.get(A).preferences.designProjects;
  assert.equal(projects.length, 2);
  const copy = projects.find(project => project.name === 'Salinan A');
  const source = projects.find(project => project.name === 'Rahasia A');
  assert.equal(copy.status, 'planning');
  assert.notEqual(copy.history, source.history);
  assert.equal(copy.history[0].event, 'duplicated');
  assert.equal(users.get(B).preferences.designProjects.length, 1);
});

test('a user without a stored profile never receives another account workspace', async () => {
  const { users } = makeUsers();
  const User = function User(doc) { Object.assign(this, doc); this.save = async () => {}; };
  User.findOne = async query => users.get(query.jid) || null;
  const text = await as('628333333333@s.whatsapp.net', User, ['list']);
  assert.doesNotMatch(text, /Rahasia A|Milik B/);
});

test('missing identity or database model never falls back to a shared workspace', async () => {
  const { User } = makeUsers();
  const noIdentity = [];
  await handleDesignerAssistantCommands({ command: 'designproject', args: ['list'], PREFIX: '.', userJid: undefined, User, reply: async text => { noIdentity.push(String(text)); } });
  assert.match(noIdentity[0], /Identitas WhatsApp tidak tersedia/);
  const noModel = [];
  await handleDesignerAssistantCommands({ command: 'designproject', args: ['list'], PREFIX: '.', userJid: A, User: null, reply: async text => { noModel.push(String(text)); } });
  assert.match(noModel[0], /model database User tidak ditemukan/);
});

test('REGRESSION: flow works for projects whose free-text kind contains a supported type', async () => {
  const { User } = makeUsers();
  await as(A, User, ['save', 'Poster Event', '|', 'Poster Event', '|', 'festival musik', '|', 'remaja', '|', 'feed']);
  const text = await as(A, User, ['flow', 'Poster Event']);
  assert.match(text, /DESIGN WORKFLOW STUDIO — POSTER/);
  await as(A, User, ['save', 'Media Sosial', '|', 'konten media sosial', '|', 'kampanye', '|', 'pengikut', '|', 'instagram']);
  assert.match(await as(A, User, ['flow', 'Media Sosial']), /DESIGN WORKFLOW STUDIO — SOSIAL/);
});

test('REGRESSION: flow explains unsupported kinds instead of showing generic usage', async () => {
  const { User } = makeUsers();
  await as(A, User, ['save', 'Merchandise', '|', 'kaos', '|', 'komunitas', '|', 'anggota', '|', 'cetak']);
  const text = await as(A, User, ['flow', 'Merchandise']);
  assert.match(text, /belum dikenali oleh designflow/);
  assert.match(text, /Jenis yang didukung: poster, logo, sosial, web, app, bot, marketplace, kemasan/);
  assert.match(text, /designproject edit Merchandise \| <jenis>/);
});

test('REGRESSION: list filters without a value or with an unknown status explain usage instead of "no match"', async () => {
  const { User } = makeUsers();
  assert.match(await as(A, User, ['list', 'status']), /Filter: \.designproject list status/);
  assert.match(await as(A, User, ['list', 'jenis']), /Filter: \.designproject list status/);
  assert.match(await as(A, User, ['list', 'status', 'selesai']), /Status tidak dikenal: \*selesai\*/);
  assert.match(await as(A, User, ['list', 'status', 'PLANNING']), /Rahasia A/);
  assert.match(await as(A, User, ['list', 'jenis', 'WEB']), /Rahasia A/);
});

test('history stays capped at 20 entries after many status changes', async () => {
  const { users, User } = makeUsers();
  for (let i = 0; i < 30; i++) await as(A, User, ['status', 'Rahasia A', '|', i % 2 ? 'review' : 'progress']);
  assert.equal(users.get(A).preferences.designProjects[0].history.length, 20);
});

test('per-account project limit of 10 is enforced for save, template, and duplicate', async () => {
  const { users, User } = makeUsers();
  for (let i = 0; i < 9; i++) await as(A, User, ['save', `P${i}`, '|', 'web', '|', 't', '|', 'a', '|', 'p']);
  assert.equal(users.get(A).preferences.designProjects.length, 10);
  assert.match(await as(A, User, ['save', 'Lebih', '|', 'web', '|', 't', '|', 'a', '|', 'p']), /Batas 10 proyek/);
  assert.match(await as(A, User, ['template', 'web', '|', 'Lebih2']), /Batas 10 proyek/);
  assert.match(await as(A, User, ['duplicate', 'P1', '|', 'Lebih3']), /Batas 10 proyek/);
  assert.equal(users.get(A).preferences.designProjects.length, 10);
});
