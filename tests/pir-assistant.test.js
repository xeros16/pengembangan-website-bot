import test from 'node:test';
import assert from 'node:assert/strict';
import { handlePirAssistantCommand, renderPirAssistantReply } from '../features/commands/pir-assistant.js';
import { handleGeneralHelpCommands } from '../features/commands/general-help.js';

test('PIR Assistant explains itself and offers practical examples', () => {
  const text = renderPirAssistantReply('', '!');
  assert.match(text, /PIR ASSISTANT/);
  assert.match(text, /!asisten aku ingin membuat poster/);
  assert.match(text, /bukan AI generatif/);
});

test('PIR Assistant routes everyday design requests to existing commands', () => {
  const text = renderPirAssistantReply('aku ingin membuat poster promosi', '.');
  assert.match(text, /Rekomendasi utama:/);
  assert.match(text, /\.wizard|\.creative/);
  assert.match(text, /Tidak ada tindakan yang dijalankan otomatis/);
});

test('PIR Assistant discovers music and anime capabilities', () => {
  const music = renderPirAssistantReply('aku ingin mencari lagu dan album', '.');
  assert.match(music, /\.music/);
  const anime = renderPirAssistantReply('cari anime populer', '.');
  assert.match(anime, /\.anime/);
});

test('PIR Assistant handler replies only for its registered command', async () => {
  const replies = [];
  const handled = await handlePirAssistantCommand({
    command: 'asisten', args: ['cari', 'musik'], PREFIX: '.', reply: async text => replies.push(text),
  });
  assert.equal(replies.length, 1);
  assert.match(replies[0], /\.music/);
  assert.equal(await handlePirAssistantCommand({ command: 'help', reply: async () => {} }), false);
});


test('music menu, music workflow, and help honor a custom command prefix', async () => {
  const replies = [];
  const reply = async text => { replies.push(text); };
  await handleGeneralHelpCommands({ command: 'menu', args: ['musik'], PREFIX: '!', reply });
  assert.match(replies.at(-1), /!music cari/);
  assert.match(replies.at(-1), /!song/);
  await handleGeneralHelpCommands({ command: 'alur', args: ['musik'], PREFIX: '!', reply });
  assert.match(replies.at(-1), /!music album/);
  await handleGeneralHelpCommands({ command: 'help', args: ['music'], PREFIX: '!', reply });
  assert.match(replies.at(-1), /!music cari/);
});
