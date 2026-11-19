import test from 'node:test';
import assert from 'node:assert/strict';
import { EDITABLE_TEXT_KEYS, readBotTexts, handleContentEditorCommand, renderBotText } from '../features/content-editor.js';

test('teks yang dapat diedit memiliki nilai awal dan semua kunci terdaftar', async () => {
  const texts = await readBotTexts();
  assert.deepEqual(Object.keys(EDITABLE_TEXT_KEYS).sort(), Object.keys(texts).sort());
  assert.ok(texts.menuIntro.includes('{prefix}'));
  assert.ok(texts.tutorialGame.length > 20);
});

test('editor konten menolak pengguna yang bukan Owner', async () => {
  let response = '';
  const handled = await handleContentEditorCommand({
    command: 'textlist', userJid: 'member@s.whatsapp.net', senderIdentityAliases: [],
    isBotOwner: () => false, reply: async (text) => { response = text; },
  });
  assert.equal(handled, true);
  assert.match(response, /hanya dapat digunakan oleh Owner/);
});

test('perintah yang bukan editor konten tidak dikonsumsi', async () => {
  const handled = await handleContentEditorCommand({ command: 'menu', reply: async () => {} });
  assert.equal(handled, false);
});


test('editable main menu and category messages live in one JSON content file', async () => {
  const texts = await readBotTexts();
  for (const key of ['mainMenu', 'menuTools', 'menuPremium', 'commandListIntro', 'unknownCommand']) {
    assert.equal(typeof texts[key], 'string', `${key} should be editable`);
  }
  assert.match(renderBotText(texts.mainMenu, { prefix: '!' }), /!commands/);
  assert.doesNotMatch(renderBotText(texts.mainMenu, { prefix: '!' }), /\{prefix\}/);
});

test('instalasi tanpa texts.json membuat file aktif dari template tanpa menimpa file yang ada', async () => {
  const fs = await import('node:fs/promises');
  const os = await import('node:os');
  const path = await import('node:path');
  const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'pir-content-'));
  try {
    await fs.mkdir(path.join(cwd, 'content'));
    await fs.copyFile(path.join(process.cwd(), 'content', 'texts.example.json'), path.join(cwd, 'content', 'texts.example.json'));
    const generated = await readBotTexts({ cwd });
    assert.equal(typeof generated.mainMenu, 'string');
    assert.equal(await fs.access(path.join(cwd, 'content', 'texts.json')).then(() => true), true);
    await fs.writeFile(path.join(cwd, 'content', 'texts.json'), JSON.stringify({ preserved: true }));
    await assert.rejects(readBotTexts({ cwd }), /Kunci konten tidak valid/);
    assert.deepEqual(JSON.parse(await fs.readFile(path.join(cwd, 'content', 'texts.json'), 'utf8')), { preserved: true });
  } finally {
    await fs.rm(cwd, { recursive: true, force: true });
  }
});

test('renderBotText normalizes escaped line breaks and excessive whitespace', async () => {
  const { renderBotText } = await import('../features/content-editor.js');
  const output = renderBotText('Judul\\n\\n\\nIsi   \n\n\nAkhir', {});
  assert.equal(output, 'Judul\n\nIsi\n\nAkhir');
});

test('normalisasi balasan membersihkan ANSI, tab, non-breaking space, dan CRLF', async () => {
  const { cleanWhatsAppText } = await import('../features/content-editor.js');
  assert.equal(cleanWhatsAppText('\u001b[31mERROR\u001b[0m\r\n\tDetail\u00a0teks\n\n\nSelesai'), 'ERROR\n  Detail teks\n\nSelesai');
});
