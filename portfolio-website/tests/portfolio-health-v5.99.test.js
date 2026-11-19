import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { calculatePortfolioHealth } from '../portfolio-health.js';

const fullProfile = {
  displayName: 'Studio North', avatarUrl: 'https://example.test/avatar.jpg',
  bio: 'Independent design studio', location: 'Bandung', category: 'Branding',
  specialties: ['Brand identity', 'Packaging'], contactPhone: '6281234567890',
  tagline: 'Identity with intention', approach: 'Research, explore, refine',
};
const fullWorks = [1, 2, 3].map(index => ({
  itemId: `ART-${index}`, moderationStatus: 'approved', challenge: 'Challenge',
  solution: 'Solution', outcome: 'Outcome',
}));

test('complete profile reaches 100 readiness points without treating the score as a quality rating', () => {
  const result = calculatePortfolioHealth(fullProfile, fullWorks, [{ isActive: true }]);
  assert.equal(result.score, 100);
  assert.equal(result.level, 'Siap ditemukan');
  assert.equal(result.completed, 7);
  assert.equal(result.nextSteps.length, 0);
});

test('new designer receives actionable incomplete checklist and zero score', () => {
  const result = calculatePortfolioHealth({}, [], []);
  assert.equal(result.score, 0);
  assert.equal(result.level, 'Perlu dilengkapi');
  assert.equal(result.tasks.length, 7);
  assert.equal(result.nextSteps.length, 3);
  assert.ok(result.tasks.every(task => task.earned === 0));
});

test('pending portfolio works and inactive services do not count as published readiness', () => {
  const result = calculatePortfolioHealth(fullProfile, [
    { moderationStatus: 'pending', challenge: 'x', solution: 'y', outcome: 'z' },
  ], [{ isActive: false }]);
  assert.equal(result.approvedWorkCount, 0);
  assert.equal(result.activeServiceCount, 0);
  assert.equal(result.tasks.find(task => task.key === 'portfolio').earned, 0);
  assert.equal(result.tasks.find(task => task.key === 'service').earned, 0);
});

test('case study earns points only from an approved work with a documented challenge and solution', () => {
  const noCase = calculatePortfolioHealth(fullProfile, [{ moderationStatus: 'approved' }], []);
  const partialCase = calculatePortfolioHealth(fullProfile, [{ moderationStatus: 'approved', challenge: 'Challenge', solution: 'Solution' }], []);
  const completeCase = calculatePortfolioHealth(fullProfile, [{ moderationStatus: 'approved', challenge: 'Challenge', solution: 'Solution', outcome: 'Outcome' }], []);
  assert.equal(noCase.tasks.find(task => task.key === 'case-study').earned, 0);
  assert.equal(partialCase.tasks.find(task => task.key === 'case-study').earned, 10);
  assert.equal(completeCase.tasks.find(task => task.key === 'case-study').earned, 15);
});

test('readiness helper is private Studio UI and explicitly disclaims professional quality scoring', () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const source = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
  assert.match(source, /id="portfolio-health"/);
  assert.match(source, /Hanya terlihat oleh pemilik akun/);
  assert.match(source, /bukan penilaian estetika, kemampuan profesional, kualitas hasil/);
  assert.match(source, /calculatePortfolioHealth\(profile, works, services, \{/);
});
