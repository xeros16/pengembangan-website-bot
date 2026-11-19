import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DESIGN_WORKFLOW_STAGES,
  createDesignWorkflowState,
  normalizeDesignWorkflow,
  getDesignWorkflowProgress,
  completeDesignWorkflowStage,
  reopenDesignWorkflowStage,
  formatDesignWorkflowStep,
  formatDesignWorkflowProgress,
} from '../features/design-studio/workflow-engine.js';
import { handleDesignerAssistantCommands } from '../features/commands/designer-assistant.js';

function context(command, args = [], overrides = {}) {
  const replies = [];
  return {
    ctx: {
      command, args, PREFIX: '.', userJid: '628111111111@s.whatsapp.net',
      sender: '628111111111@s.whatsapp.net', senderIdentityAliases: [],
      phoneJid: '628111111111@s.whatsapp.net', remoteJid: 'chat@g.us',
      isGroup: true, sock: {}, isBotOwner: () => false,
      isGroupAdmin: async () => false,
      reply: async text => { replies.push(String(text)); },
      ...overrides,
    },
    replies,
  };
}

function project(overrides = {}) {
  return {
    name: 'Kopi Senja', kind: 'web', theme: 'website kopi modern',
    audience: 'pelanggan dewasa', platform: 'mobile-first',
    palette: 'alam', font: 'modern', status: 'planning',
    workflow: createDesignWorkflowState('2026-11-12T00:00:00.000Z'),
    ...overrides,
  };
}

test('workflow defines six ordered production stages', () => {
  assert.deepEqual(DESIGN_WORKFLOW_STAGES.map(stage => stage.id), ['brief', 'concept', 'layout', 'visual', 'qa', 'handoff']);
  assert.equal(getDesignWorkflowProgress(project()).percent, 0);
});

test('legacy projects without workflow normalize safely to the brief stage', () => {
  const progress = getDesignWorkflowProgress({ name: 'Legacy', kind: 'poster' });
  assert.equal(progress.currentStage, 'brief');
  assert.equal(progress.completed, 0);
  assert.equal(progress.percent, 0);
});

test('workflow completion advances sequentially and prevents skipping stages', () => {
  const initial = project();
  const skipped = completeDesignWorkflowStage(initial, 'concept');
  assert.equal(skipped.ok, false);
  assert.equal(skipped.reason, 'not_current_stage');

  const brief = completeDesignWorkflowStage(initial);
  assert.equal(brief.ok, true);
  assert.equal(brief.nextStage, 'concept');
  assert.deepEqual(brief.project.workflow.completedStages, ['brief']);

  const concept = completeDesignWorkflowStage(brief.project);
  assert.equal(concept.nextStage, 'layout');
  assert.equal(concept.progress.percent, 33);
});

test('workflow reaches complete after six explicit confirmations', () => {
  let current = project();
  for (let index = 0; index < DESIGN_WORKFLOW_STAGES.length; index += 1) {
    const result = completeDesignWorkflowStage(current);
    assert.equal(result.ok, true);
    current = result.project;
  }
  const progress = getDesignWorkflowProgress(current);
  assert.equal(progress.currentStage, 'complete');
  assert.equal(progress.percent, 100);
  assert.equal(completeDesignWorkflowStage(current).reason, 'already_complete');
});

test('reopening an earlier stage resets all later completed stages', () => {
  let current = project();
  for (let index = 0; index < 4; index += 1) current = completeDesignWorkflowStage(current).project;
  const reopened = reopenDesignWorkflowStage(current, 'concept');
  assert.equal(reopened.ok, true);
  assert.equal(reopened.progress.currentStage, 'concept');
  assert.deepEqual(reopened.progress.completedStages, ['brief']);
  assert.equal(reopened.progress.percent, 17);
  assert.equal(reopenDesignWorkflowStage(current, 'unknown').reason, 'unknown_stage');
});

test('step and progress guidance use valid project-specific commands', () => {
  const guide = formatDesignWorkflowStep(project(), '.');
  assert.match(guide, /LANGKAH 1\/6 — BRIEF/);
  assert.match(guide, /\.wizard/);
  assert.match(guide, /\.designproject done Kopi Senja/);

  let socialProject = project({ kind: 'sosial' });
  socialProject = completeDesignWorkflowStage(socialProject).project;
  socialProject = completeDesignWorkflowStage(socialProject).project;
  const social = formatDesignWorkflowStep(socialProject, '.');
  assert.match(social, /LANGKAH 3\/6 — LAYOUT/);
  assert.match(social, /\.layoutstudio feed/);
  assert.match(social, /\.socialkit instagram_feed/);

  let visualProject = project({ kind: 'app', font: 'Manrope', palette: 'sage dan krem' });
  for (let index = 0; index < 3; index += 1) visualProject = completeDesignWorkflowStage(visualProject).project;
  const visual = formatDesignWorkflowStep(visualProject, '.');
  assert.match(visual, /LANGKAH 4\/6 — VISUAL SYSTEM/);
  assert.match(visual, /\.colorpalette minimalis/);
  assert.match(visual, /\.fontstudio modern web/);

  const progress = formatDesignWorkflowProgress(project(), '.');
  assert.match(progress, /0%/);
  assert.match(progress, /Brief — \*sedang dikerjakan\*/);
});

test('designproject start creates a project and exposes its first guided stage', async () => {
  const user = { preferences: {}, save: async function () {} };
  const User = { findOne: async () => user };
  const result = context('designproject', ['start', 'Kopi Senja', '|', 'web', '|', 'website kopi', '|', 'pelanggan', '|', 'mobile-first'], { User });
  await handleDesignerAssistantCommands(result.ctx);
  assert.match(result.replies[0], /Workflow produksi dimulai/);
  assert.equal(user.preferences.designProjects.length, 1);
  assert.equal(user.preferences.designProjects[0].workflow.currentStage, 'brief');

  const step = context('designproject', ['step', 'Kopi Senja'], { User });
  await handleDesignerAssistantCommands(step.ctx);
  assert.match(step.replies[0], /LANGKAH 1\/6/);
});

test('designproject board, progress, completion, and reopen persist workflow transitions', async () => {
  const user = { preferences: { designProjects: [project()] }, save: async function () {} };
  const User = { findOne: async () => user };

  const board = context('designproject', ['board'], { User });
  await handleDesignerAssistantCommands(board.ctx);
  assert.match(board.replies[0], /PROJECT BOARD/);
  assert.match(board.replies[0], /0%/);

  const done = context('designproject', ['done', 'Kopi Senja'], { User });
  await handleDesignerAssistantCommands(done.ctx);
  assert.match(done.replies[0], /Tahap \*Brief\*.*ditandai selesai/);
  assert.equal(user.preferences.designProjects[0].workflow.currentStage, 'concept');

  const progress = context('designproject', ['progress', 'Kopi Senja'], { User });
  await handleDesignerAssistantCommands(progress.ctx);
  assert.match(progress.replies[0], /17%/);
  assert.match(progress.replies[0], /Konsep/);

  const reopen = context('designproject', ['reopen', 'Kopi Senja', '|', 'brief'], { User });
  await handleDesignerAssistantCommands(reopen.ctx);
  assert.match(reopen.replies[0], /dibuka ulang/);
  assert.equal(user.preferences.designProjects[0].workflow.currentStage, 'brief');
});

test('designproject start does not overwrite an existing project', async () => {
  const existing = project();
  const user = { preferences: { designProjects: [existing] }, save: async function () {} };
  const User = { findOne: async () => user };
  const result = context('designproject', ['start', 'Kopi Senja', '|', 'web', '|', 'tema baru', '|', 'audiens', '|', 'mobile'], { User });
  await handleDesignerAssistantCommands(result.ctx);
  assert.match(result.replies[0], /sudah ada/);
  assert.equal(user.preferences.designProjects[0].theme, 'website kopi modern');
});

test('duplicate project starts with a fresh workflow instead of copying completed stages', async () => {
  const completed = project({ workflow: { currentStage: 'qa', completedStages: ['brief', 'concept', 'layout', 'visual'], updatedAt: '2026-11-12T00:00:00.000Z' } });
  const user = { preferences: { designProjects: [completed] }, save: async function () {} };
  const User = { findOne: async () => user };
  const result = context('designproject', ['duplicate', 'Kopi Senja', '|', 'Kopi Senja Baru'], { User });
  await handleDesignerAssistantCommands(result.ctx);
  assert.equal(user.preferences.designProjects[0].name, 'Kopi Senja Baru');
  assert.deepEqual(user.preferences.designProjects[0].workflow.completedStages, []);
  assert.equal(user.preferences.designProjects[0].workflow.currentStage, 'brief');
});

test('concurrent project starts for one account do not lose either update in-process', async () => {
  const user = {
    preferences: {},
    save: async function () {
      await new Promise(resolve => setTimeout(resolve, 5));
    },
  };
  const User = { findOne: async () => user };
  const first = context('designproject', ['start', 'Project A', '|', 'web', '|', 'tema A', '|', 'audiens A', '|', 'mobile'], { User });
  const second = context('designproject', ['start', 'Project B', '|', 'poster', '|', 'tema B', '|', 'audiens B', '|', 'A4'], { User });
  await Promise.all([
    handleDesignerAssistantCommands(first.ctx),
    handleDesignerAssistantCommands(second.ctx),
  ]);
  const names = user.preferences.designProjects.map(item => item.name).sort();
  assert.deepEqual(names, ['Project A', 'Project B']);
});

