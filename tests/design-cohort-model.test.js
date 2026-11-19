import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const models = fs.readFileSync(new URL('../models/index.js', import.meta.url), 'utf8');
const app = fs.readFileSync(new URL('../index.js', import.meta.url), 'utf8');
const setup = fs.readFileSync(new URL('../scripts/ensure-directory-indexes.js', import.meta.url), 'utf8');
const verifier = fs.readFileSync(new URL('../scripts/verify-shared-db.js', import.meta.url), 'utf8');

test('Learning Cohort model enforces scoped lifecycle and bounded subdocuments', () => {
  assert.match(models, /const LearningCohortSchema = new mongoose\.Schema/);
  assert.match(models, /weeks: \{ type: Number, required: true, min: 1, max: 12 \}/);
  assert.match(models, /dueDay: \{ type: Number, required: true, min: 1, max: 84 \}/);
  assert.match(models, /startsAt: \{ type: Date, default: null \}/);
  assert.match(models, /endsAt: \{ type: Date, default: null, index: true \}/);
  assert.match(models, /status: \{ type: String, enum: \['open', 'active', 'completed', 'cancelled'\]/);
  assert.match(models, /LearningCohortSchema\.index\(\{ groupJid: 1, code: 1 \}, \{ unique: true \}\)/);
  assert.match(models, /LearningCohortCheckinSchema\.index\(\{ groupJid: 1, cohortCode: 1, milestoneCode: 1, userJid: 1 \}, \{ unique: true \}\)/);
  assert.match(models, /LearningCohortCheckinSchema\.index\(\{ groupJid: 1, cohortCode: 1, status: 1, updatedAt: -1 \}\)/);
});

test('Learning Cohort models are injected into the live WhatsApp command context', () => {
  assert.match(models, /mongoose\.model\('LearningCohort', LearningCohortSchema\)/);
  assert.match(models, /mongoose\.model\('LearningCohortCheckin', LearningCohortCheckinSchema\)/);
  assert.match(app, /LearningCohort, LearningCohortCheckin/);
  assert.match(app, /\n  LearningCohort,/);
  assert.match(app, /\n  LearningCohortCheckin,/);
});

test('Learning Cohort unique and review indexes have additive setup and verifier coverage', () => {
  assert.match(setup, /learningCohorts\.createIndex\(\{ code: 1 \}, \{ name: 'code_1', unique: true \}\)/);
  assert.match(setup, /groupJid_1_status_1_createdAt_-1/);
  assert.match(setup, /groupJid_1_cohortCode_1_milestoneCode_1_userJid_1/);
  assert.match(verifier, /learningcohorts: \['code_1', 'groupJid_1_code_1', 'groupJid_1_status_1_createdAt_-1'\]/);
  assert.match(verifier, /learningcohortcheckins: \['code_1', 'groupJid_1_cohortCode_1_milestoneCode_1_userJid_1', 'groupJid_1_cohortCode_1_status_1_updatedAt_-1'\]/);
});
