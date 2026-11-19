import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMoodboard, buildDesignCritiqueGuide } from '../features/commands/designer-workflow.js';
import { handleDesignerAssistantCommands, DESIGNER_ASSISTANT_COMMANDS } from '../features/commands/designer-assistant.js';
import { handleDesignCritiqueCommands, DESIGN_CRITIQUE_COMMANDS } from '../features/commands/design-critique.js';

function context(command, args = [], overrides = {}) {
  const replies = [];
  return {
    ctx: {
      command, args, PREFIX: '.', userJid: '628111111111@s.whatsapp.net',
      sender: '628111111111@s.whatsapp.net', senderIdentityAliases: [],
      phoneJid: '628111111111@s.whatsapp.net', remoteJid: 'chat@g.us',
      isGroup: true, sock: {}, msg: {}, sharp: null,
      isBotOwner: () => false, isGroupAdmin: async () => false,
      reply: async text => { replies.push(String(text)); }, ...overrides,
    },
    replies,
  };
}

test('new workflow commands are registered without replacing existing wizard and peer review', () => {
  assert.ok(DESIGNER_ASSISTANT_COMMANDS.has('briefbuilder'));
  assert.ok(DESIGNER_ASSISTANT_COMMANDS.has('moodboard'));
  assert.ok(DESIGN_CRITIQUE_COMMANDS.has('designcritique'));
  assert.ok(DESIGN_CRITIQUE_COMMANDS.has('critique'));
  assert.ok(DESIGN_CRITIQUE_COMMANDS.has('rate'));
});

test('moodboard builds direction, palette, typography and search keywords', () => {
  const result = buildMoodboard(['kedai', 'kopi', 'modern', '|', 'sage', 'dan', 'krem', '|', 'minimal', 'natural']);
  assert.match(result, /MOODBOARD DIRECTION/);
  assert.match(result, /sage dan krem/);
  assert.match(result, /Tipografi/);
  assert.match(result, /Keyword pencarian/);
  assert.match(result, /brief moodboard/i);
});

test('moodboard handles empty topic and defaults safely', () => {
  assert.match(buildMoodboard([]), /Format:/);
  assert.match(buildMoodboard(['poster', 'festival', 'musik']), /Palet warna awal/);
});

test('design critique rubric is explicit and does not claim image analysis', () => {
  const result = buildDesignCritiqueGuide('poster acara');
  assert.match(result, /Hierarki visual/);
  assert.match(result, /Kesiapan produksi/);
  assert.match(result, /tidak berarti bot telah melihat/);
});

test('moodboard handler returns a reply', async () => {
  const { ctx, replies } = context('moodboard', ['brand', 'kopi']);
  await handleDesignerAssistantCommands(ctx);
  assert.match(replies[0], /MOODBOARD DIRECTION/);
});

test('briefbuilder reuses existing brief wizard instead of duplicating the workflow', async () => {
  const { ctx, replies } = context('briefbuilder');
  await handleDesignerAssistantCommands(ctx);
  assert.match(replies[0], /WIZARD BRIEF DESAIN/);
  assert.match(replies[0], /Langkah 1\/7/);
});


test('designcritique without an image gives a review rubric', async () => {
  const { ctx, replies } = context('designcritique', ['poster', 'event']);
  await handleDesignCritiqueCommands(ctx);
  assert.match(replies[0], /DESIGN CRITIQUE — RUBRIK REVIEW/);
});

test('designcritique with image but no API key states that no automatic analysis happened', async () => {
  const previous = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  try {
    const { ctx, replies } = context('designcritique', [], {
      getImageTarget: () => ({ imageMessage: {} }),
    });
    await handleDesignCritiqueCommands(ctx);
    assert.match(replies[0], /belum dikonfigurasi/);
    assert.match(replies[0], /belum menganalisis gambar/i);
  } finally {
    if (previous !== undefined) process.env.OPENAI_API_KEY = previous;
  }
});
