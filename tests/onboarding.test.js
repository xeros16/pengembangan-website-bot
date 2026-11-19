import test from 'node:test';
import assert from 'node:assert/strict';
import {
  startOnboarding,
  consumeOnboardingMessage,
  renderOnboardingGuide,
  renderOnboardingQuickStart,
  resetOnboardingSessionsForTests,
} from '../features/onboarding.js';
import { startDesignBriefWizard, consumeDesignBriefWizardMessage } from '../features/commands/design-brief-wizard.js';

function makeCtx(overrides = {}) {
  const messages = [];
  const ctx = {
    PREFIX: '.',
    command: 'mulai',
    args: [],
    isCommand: true,
    remoteJid: 'group@g.us',
    userJid: 'user@s.whatsapp.net',
    messageText: '',
    reply: async text => { messages.push(text); },
    ...overrides,
  };
  return { ctx, messages };
}

test.beforeEach(() => resetOnboardingSessionsForTests());

test('mulai starts a guided two-step onboarding without requiring command knowledge', async () => {
  const { ctx, messages } = makeCtx();
  await startOnboarding(ctx, []);
  assert.match(messages[0], /SELAMAT DATANG DI PIR VISUALS/i);
  assert.match(messages[0], /tidak perlu menghafal perintah/i);
  assert.match(messages[0], /1\/2/);
  assert.match(messages[0], /Membuat desain/);
  assert.match(messages[0], /Mencari desainer/);
});

test('onboarding records goal and level, then returns actionable beginner recommendations', async () => {
  const { ctx, messages } = makeCtx();
  await startOnboarding(ctx, []);
  const goalMessage = { ...ctx, isCommand: false, messageText: '1' };
  assert.equal(await consumeOnboardingMessage(goalMessage), true);
  assert.match(messages.at(-1), /2\/2/);
  const levelMessage = { ...ctx, isCommand: false, messageText: '1' };
  assert.equal(await consumeOnboardingMessage(levelMessage), true);
  assert.match(messages.at(-1), /PANDUAN PIR VISUALS UNTUKMU/);
  assert.match(messages.at(-1), /Membuat desain/);
  assert.match(messages.at(-1), /\.wizard/);
  assert.match(messages.at(-1), /\.creative poster acara sekolah/);
  assert.match(messages.at(-1), /\.designqa poster/);
  assert.match(messages.at(-1), /belum tersimpan ke database/i);
});

test('onboarding persists preferences in User.preferences without replacing other preferences', async () => {
  let updateCall;
  const User = {
    updateOne: async (...args) => { updateCall = args; return { acknowledged: true }; },
  };
  const { ctx, messages } = makeCtx({ User, getDbReady: () => true });
  await startOnboarding(ctx, []);
  await consumeOnboardingMessage({ ...ctx, isCommand: false, messageText: 'belajar' });
  await consumeOnboardingMessage({ ...ctx, isCommand: false, messageText: '2' });
  assert.ok(updateCall);
  assert.deepEqual(updateCall[0], { jid: 'user@s.whatsapp.net' });
  assert.equal(updateCall[1].$set['preferences.onboarding'].goal, 'learn');
  assert.equal(updateCall[1].$set['preferences.onboarding'].level, 'intermediate');
  assert.equal(updateCall[2].upsert, true);
  assert.match(messages.at(-1), /Preferensimu tersimpan/);
});

test('saved onboarding profile is reused on the next mulai command', async () => {
  const profile = { version: 1, goal: 'image', level: 'intermediate', updatedAt: Date.now() };
  const User = {
    findOne: () => ({
      select() { return this; },
      lean() { return Promise.resolve({ preferences: { onboarding: profile } }); },
    }),
  };
  const { ctx, messages } = makeCtx({ User, getDbReady: () => true });
  await startOnboarding(ctx, []);
  assert.match(messages[0], /PANDUAN PIR VISUALS UNTUKMU/);
  assert.match(messages[0], /Mengolah gambar/);
  assert.match(messages[0], /\.crop 4:5/);
});

test('onboarding accepts free-text aliases and respects a custom prefix', async () => {
  const { ctx, messages } = makeCtx({ PREFIX: '!', remoteJid: 'private@s.whatsapp.net' });
  await startOnboarding(ctx, []);
  await consumeOnboardingMessage({ ...ctx, isCommand: false, messageText: 'mencari jasa desainer' });
  await consumeOnboardingMessage({ ...ctx, isCommand: false, messageText: 'berpengalaman' });
  assert.match(messages.at(-1), /Mencari desainer/);
  assert.match(messages.at(-1), /!designer DSN-ID/);
  assert.match(messages.at(-1), /Hubungi desainer langsung/);
  assert.match(messages.at(-1), /!design unggulan/);
  assert.doesNotMatch(messages.at(-1), /requestdesign/);
});

test('invalid onboarding answers keep the current step and explain accepted choices', async () => {
  const { ctx, messages } = makeCtx();
  await startOnboarding(ctx, []);
  await consumeOnboardingMessage({ ...ctx, isCommand: false, messageText: 'xyz' });
  assert.match(messages.at(-1), /belum mengenali pilihan/i);
  assert.match(messages.at(-1), /1\/2/);
});

test('cancel stops onboarding and does not consume the next unrelated message', async () => {
  const { ctx, messages } = makeCtx();
  await startOnboarding(ctx, []);
  assert.equal(await consumeOnboardingMessage({ ...ctx, isCommand: false, messageText: 'batal' }), true);
  assert.match(messages.at(-1), /dibatalkan/i);
  assert.equal(await consumeOnboardingMessage({ ...ctx, isCommand: false, messageText: 'halo' }), false);
});

test('a new command exits onboarding so the requested command can continue', async () => {
  const { ctx } = makeCtx();
  await startOnboarding(ctx, []);
  const nextCommand = { ...ctx, command: 'menu', args: [], isCommand: true };
  assert.equal(await consumeOnboardingMessage(nextCommand), false);
});

test('quick start is available without collecting a profile', async () => {
  const { ctx, messages } = makeCtx();
  await startOnboarding(ctx, ['cepat']);
  assert.match(messages[0], /langkah demi langkah/i);
  assert.match(messages[0], /\.checklist poster/);
  assert.match(messages[0], /\.cari poster/);
});

test('rendered onboarding recommendations are safe for missing profile data', () => {
  const output = renderOnboardingGuide({}, '!');
  assert.match(output, /!wizard/);
  assert.match(output, /!menu/);
});


test('onboarding sessions are isolated per member inside the same group', async () => {
  const { ctx: first, messages: firstMessages } = makeCtx({ userJid: 'first@s.whatsapp.net' });
  const { ctx: second, messages: secondMessages } = makeCtx({ userJid: 'second@s.whatsapp.net' });
  await startOnboarding(first, []);
  await startOnboarding(second, []);
  await consumeOnboardingMessage({ ...first, isCommand: false, messageText: '1' });
  await consumeOnboardingMessage({ ...second, isCommand: false, messageText: '3' });
  await consumeOnboardingMessage({ ...first, isCommand: false, messageText: '1' });
  await consumeOnboardingMessage({ ...second, isCommand: false, messageText: '2' });
  assert.match(firstMessages.at(-1), /Membuat desain/);
  assert.match(secondMessages.at(-1), /Mengolah gambar/);
  assert.match(firstMessages.at(-1), /\.wizard/);
  assert.match(secondMessages.at(-1), /\.crop 4:5/);
});


test('starting onboarding clears an unfinished design brief wizard to avoid competing chat sessions', async () => {
  const { ctx, messages } = makeCtx();
  await startDesignBriefWizard(ctx);
  assert.match(messages.at(-1), /WIZARD BRIEF DESAIN/);
  await startOnboarding(ctx, []);
  await consumeOnboardingMessage({ ...ctx, isCommand: false, messageText: '1' });
  await consumeOnboardingMessage({ ...ctx, isCommand: false, messageText: '1' });
  assert.equal(await consumeDesignBriefWizardMessage({ ...ctx, isCommand: false, messageText: 'lanjut brief lama' }), false);
  assert.match(messages.at(-1), /PANDUAN PIR VISUALS UNTUKMU/);
});

test('community onboarding recommends opt-in mentor discovery and collaboration board', () => {
  const output = renderOnboardingGuide({ goal: 'community', level: 'beginner' }, '!');
  assert.match(output, /!designcommunity cari branding/);
  assert.match(output, /!designcommunity collab list/);
  assert.match(output, /!designchallenge harian/);
});


test('designer onboarding exposes private website notification access for advanced portfolio owners', () => {
  const output = renderOnboardingGuide({ goal: 'offer', level: 'advanced' }, '.');
  assert.match(output, /\.portfolio notifikasi/);
  assert.match(output, /secara pribadi/i);
});


test('designer onboarding exposes opt-in private push notification settings', () => {
  const output = renderOnboardingGuide({ goal: 'offer', level: 'advanced' }, '.');
  assert.match(output, /\.portfolio notifikasi push status/);
  assert.match(output, /jam tenang/i);
});


test('onboarding and quick-start guides expose the personal quick-access command', async () => {
  const quick = renderOnboardingGuide({ goal: 'design', level: 'beginner' }, '!');
  const starter = renderOnboardingQuickStart('!');
  assert.match(quick, /!cepat/);
  assert.match(starter, /!cepat/);
});
