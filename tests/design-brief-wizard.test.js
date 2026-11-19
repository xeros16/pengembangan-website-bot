import test from 'node:test';
import assert from 'node:assert/strict';
import {
  startDesignBriefWizard,
  cancelDesignBriefWizard,
  getDesignBriefWizardStatus,
  resumeDesignBriefWizard,
  goBackDesignBriefWizard,
  clearDesignBriefWizardSession,
  consumeDesignBriefWizardMessage,
  resetDesignBriefWizardSessionsForTests,
} from '../features/commands/design-brief-wizard.js';

function makeCtx({ user = '628111111111@s.whatsapp.net', chat = '120363000@g.us', messageText = '', isCommand = false, prefix = '.', dbReady = false, store = null } = {}) {
  const replies = [];
  return {
    remoteJid: chat,
    userJid: user,
    sender: user,
    messageText,
    isCommand,
    PREFIX: prefix,
    getDbReady: () => dbReady,
    DesignBriefSession: store ? {
      findOne(query) { return { lean: async () => structuredClone(store.get(`${query.chatJid}::${query.userJid}`) || null) }; },
      async findOneAndUpdate(query, update) {
        const key = `${query.chatJid}::${query.userJid}`;
        const record = { chatJid: query.chatJid, userJid: query.userJid, ...(store.get(key) || {}), ...structuredClone(update.$set), updatedAt: new Date() };
        store.set(key, record);
        return structuredClone(record);
      },
      async deleteOne(query) {
        const deleted = store.delete(`${query.chatJid}::${query.userJid}`);
        return { deletedCount: deleted ? 1 : 0 };
      },
    } : null,
    replies,
    reply: async text => { replies.push(String(text)); return text; },
  };
}

test('wizard starts with clear instructions and first question', async () => {
  resetDesignBriefWizardSessionsForTests();
  const ctx = makeCtx();
  await startDesignBriefWizard(ctx);
  assert.match(ctx.replies[0], /tidak membuat gambar otomatis/i);
  assert.match(ctx.replies[0], /Langkah 1\/7/);
});

test('wizard accepts a numbered design type and guides through all steps', async () => {
  resetDesignBriefWizardSessionsForTests();
  const ctx = makeCtx();
  await startDesignBriefWizard(ctx);
  const answers = ['1', 'Promosi acara sekolah', 'Siswa SMK', 'Instagram feed 1080 x 1080', 'Modern dan energik', 'Biru dan putih', 'Judul: Expo Karya; CTA: Datang gratis'];
  for (const answer of answers) {
    ctx.messageText = answer;
    ctx.isCommand = false;
    assert.equal(await consumeDesignBriefWizardMessage(ctx), true);
  }
  const final = ctx.replies.at(-1);
  assert.match(final, /BRIEF DESAIN — POSTER/);
  assert.match(final, /Promosi acara sekolah/);
  assert.match(final, /Instagram feed 1080 x 1080/);
  assert.match(final, /CTA: Datang gratis/);
  assert.match(final, /\.creative/);
  assert.equal(await consumeDesignBriefWizardMessage(ctx), false, 'session ends after brief is produced');
});

test('wizard sessions are isolated per user and chat', async () => {
  resetDesignBriefWizardSessionsForTests();
  const first = makeCtx();
  const second = makeCtx({ user: '628122222222@s.whatsapp.net' });
  await startDesignBriefWizard(first);
  second.messageText = 'Poster';
  assert.equal(await consumeDesignBriefWizardMessage(second), false);
  assert.match((await getDesignBriefWizardStatus(second), second.replies.at(-1)), /Belum ada wizard/);
  first.messageText = 'Logo';
  await consumeDesignBriefWizardMessage(first);
  assert.match(first.replies.at(-1), /Tujuan desain/);
});

test('wizard can be cancelled and status is informative', async () => {
  resetDesignBriefWizardSessionsForTests();
  const ctx = makeCtx();
  await getDesignBriefWizardStatus(ctx);
  assert.match(ctx.replies.at(-1), /Belum ada wizard/);
  await startDesignBriefWizard(ctx);
  await getDesignBriefWizardStatus(ctx);
  assert.match(ctx.replies.at(-1), /langkah 1 dari 7/i);
  await cancelDesignBriefWizard(ctx);
  assert.match(ctx.replies.at(-1), /dibatalkan/i);
  ctx.messageText = 'Poster';
  assert.equal(await consumeDesignBriefWizardMessage(ctx), false);
});

test('commands are not swallowed as wizard answers', async () => {
  resetDesignBriefWizardSessionsForTests();
  const ctx = makeCtx();
  await startDesignBriefWizard(ctx);
  ctx.messageText = '.menu';
  ctx.isCommand = true;
  assert.equal(await consumeDesignBriefWizardMessage(ctx), false);
});


test('wizard persists progress per chat and account and can resume after process cache is cleared', async () => {
  resetDesignBriefWizardSessionsForTests();
  const store = new Map();
  const first = makeCtx({ dbReady: true, store });
  await startDesignBriefWizard(first);
  assert.match(first.replies[0], /disimpan sementara di database selama 24 jam/i);
  first.messageText = '1';
  await consumeDesignBriefWizardMessage(first);
  assert.equal(store.get(`${first.remoteJid}::${first.userJid}`).step, 1);

  resetDesignBriefWizardSessionsForTests();
  const afterRestart = makeCtx({ dbReady: true, store });
  await resumeDesignBriefWizard(afterRestart);
  assert.match(afterRestart.replies.at(-1), /MELANJUTKAN DRAFT BRIEF/);
  assert.match(afterRestart.replies.at(-1), /Langkah 2\/7/);
});

test('wizard can move back, overwrite an answer, and retain the later workflow', async () => {
  resetDesignBriefWizardSessionsForTests();
  const ctx = makeCtx();
  await startDesignBriefWizard(ctx);
  ctx.messageText = 'Poster';
  await consumeDesignBriefWizardMessage(ctx);
  await goBackDesignBriefWizard(ctx);
  assert.match(ctx.replies.at(-1), /Langkah 1\/7/);
  ctx.messageText = 'Logo';
  await consumeDesignBriefWizardMessage(ctx);
  assert.match(ctx.replies.at(-1), /Langkah 2\/7/);
});

test('wizard completion and cancellation remove persisted drafts', async () => {
  resetDesignBriefWizardSessionsForTests();
  const store = new Map();
  const ctx = makeCtx({ dbReady: true, store });
  await startDesignBriefWizard(ctx);
  assert.equal(store.size, 1);
  await clearDesignBriefWizardSession(ctx);
  assert.equal(store.size, 0);

  await startDesignBriefWizard(ctx);
  ctx.messageText = '1';
  await consumeDesignBriefWizardMessage(ctx);
  await cancelDesignBriefWizard(ctx);
  assert.equal(store.size, 0);
});
