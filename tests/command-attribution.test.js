import test from 'node:test';
import assert from 'node:assert/strict';
import { buildUserAttribution, createAttributedSocket } from '../features/command-attribution.js';

test('group attribution mentions the caller using phone JID when available', () => {
  const info = buildUserAttribution({
    isGroup: true,
    senderJid: '12345@lid',
    phoneJid: '628123456789@s.whatsapp.net',
  });
  assert.equal(info.text, '👤 Pengguna: @628123456789');
  assert.deepEqual(info.mentions, ['628123456789@s.whatsapp.net']);
});

test('private chat attribution shows phone number without tagging the user', () => {
  const info = buildUserAttribution({
    isGroup: false,
    senderJid: '628123456789@s.whatsapp.net',
    phoneJid: '628123456789@s.whatsapp.net',
  });
  assert.equal(info.text, '👤 Nomor pengguna: +628123456789');
  assert.deepEqual(info.mentions, []);
});

test('LID without phone mapping is not shown as a phone number', () => {
  const info = buildUserAttribution({
    isGroup: true,
    senderJid: '12345@lid',
    phoneJid: '',
  });
  assert.equal(info.text, '👤 Pengguna: anggota grup');
  assert.deepEqual(info.mentions, ['12345@lid']);
});

test('attributed socket decorates text responses sent to the active chat', async () => {
  const sent = [];
  const fakeSock = {
    sendMessage: async (jid, content, options) => {
      sent.push({ jid, content, options });
      return { key: { id: 'ok' } };
    },
    user: { id: 'bot@s.whatsapp.net' },
  };
  const proxy = createAttributedSocket(fakeSock, {
    remoteJid: 'group@g.us',
    isGroup: true,
    senderJid: '628111222333@s.whatsapp.net',
    phoneJid: '628111222333@s.whatsapp.net',
    quotedMessage: { key: { id: 'incoming' } },
  });
  await proxy.sendMessage('group@g.us', { text: 'Berhasil.' }, {});
  assert.match(sent[0].content.text, /Berhasil\.\n\n👤 Pengguna: @628111222333/);
  assert.deepEqual(sent[0].content.mentions, ['628111222333@s.whatsapp.net']);
});

test('attributed socket leaves other chats untouched and adds attribution after audio-only media', async () => {
  const sent = [];
  const fakeSock = {
    sendMessage: async (jid, content, options) => {
      sent.push({ jid, content, options });
      return { key: { id: String(sent.length) } };
    },
  };
  const quoted = { key: { id: 'incoming' } };
  const proxy = createAttributedSocket(fakeSock, {
    remoteJid: 'group@g.us',
    isGroup: true,
    senderJid: '628111222333@s.whatsapp.net',
    phoneJid: '628111222333@s.whatsapp.net',
    quotedMessage: quoted,
  });
  await proxy.sendMessage('other@g.us', { text: 'Bukan balasan command.' }, {});
  assert.equal(sent[0].content.text, 'Bukan balasan command.');
  await proxy.sendMessage('group@g.us', { audio: Buffer.from('audio'), mimetype: 'audio/mpeg' }, {});
  assert.equal(sent.length, 3);
  assert.equal(sent[1].content.audio.length, 5);
  assert.match(sent[2].content.text, /👤 Pengguna: @628111222333/);
  assert.deepEqual(sent[2].options, { quoted });
});
