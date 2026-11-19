import test from 'node:test';
import assert from 'node:assert/strict';
import { buildGroupGreeting, shouldSendGroupGreeting } from '../features/group-greetings.js';

test('welcome is enabled by default and goodbye is opt-in', () => {
  assert.equal(shouldSendGroupGreeting('add', {}), true);
  assert.equal(shouldSendGroupGreeting('remove', {}), false);
  assert.equal(shouldSendGroupGreeting('remove', { goodbyeEnabled: true }), true);
  assert.equal(shouldSendGroupGreeting('add', { welcomeEnabled: false }), false);
});

test('custom greeting templates replace supported variables', () => {
  const text = buildGroupGreeting({ action: 'add', participant: '628123@s.whatsapp.net', groupName: 'Komunitas', rules: 'Saling menghormati', template: 'Halo {name}, selamat datang di {group}. {rules}' });
  assert.equal(text, 'Halo @628123, selamat datang di Komunitas. Saling menghormati');
});

test('default goodbye message names the departing member and group', () => {
  const text = buildGroupGreeting({ action: 'remove', participant: '628123@s.whatsapp.net', groupName: 'Komunitas' });
  assert.match(text, /@628123/);
  assert.match(text, /Komunitas/);
});


test('default welcome directs new members to guided onboarding and need-based search', () => {
  const text = buildGroupGreeting({ action: 'add', participant: '628123@s.whatsapp.net', groupName: 'Komunitas', rules: 'Saling menghormati' });
  assert.match(text, /\.mulai/);
  assert.match(text, /\.cari <kebutuhan>/);
  assert.match(text, /\.rules/);
});
