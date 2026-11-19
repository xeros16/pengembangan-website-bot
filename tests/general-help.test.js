import test from 'node:test';
import assert from 'node:assert/strict';
import { handleGeneralHelpCommands, GENERAL_HELP_COMMANDS } from '../features/commands/general-help.js';
import { COMMAND_CATALOG } from '../features/command-catalog.js';

function makeCtx(command, args = [], PREFIX = '.') {
  const messages = [];
  return { ctx: { command, args, PREFIX, reply: async text => { messages.push(text); } }, messages };
}

test('navigation aliases are registered', () => {
  for (const command of ['help', 'menu', 'tutorial', 'mulai', 'bantuan', 'tools', 'akun', 'panduan', 'alur', 'kebutuhan', 'commands', 'perintah', 'daftarperintah', 'cari', 'cepat', 'fitur', 'features', 'jelajah']) {
    assert.equal(GENERAL_HELP_COMMANDS.has(command), true, `${command} should be routed`);
  }
});

test('main menu gives beginner instructions and category shortcuts', async () => {
  const { ctx, messages } = makeCtx('menu');
  await handleGeneralHelpCommands(ctx);
  assert.match(messages[0], /\.mulai/);
  assert.match(messages[0], /\.menu warna/);
  assert.match(messages[0], /\.help <perintah>/);
  assert.match(messages[0], /\.cepat/);
});

test('beginner guide explains a practical sequence', async () => {
  const { ctx, messages } = makeCtx('mulai');
  await handleGeneralHelpCommands(ctx);
  assert.match(messages[0], /langkah demi langkah/i);
  assert.match(messages[0], /\.checklist poster/);
});

test('help for a known command explains purpose, format, and example', async () => {
  const { ctx, messages } = makeCtx('help', ['contrast']);
  await handleGeneralHelpCommands(ctx);
  assert.match(messages[0], /Untuk apa/);
  assert.match(messages[0], /Format/);
  assert.match(messages[0], /Contoh/);
  assert.match(messages[0], /\.contrast #222222 #FFFFFF/);
});

test('unknown help topic offers a way back to the menu', async () => {
  const { ctx, messages } = makeCtx('help', ['something-unknown']);
  await handleGeneralHelpCommands(ctx);
  assert.match(messages[0], /belum menemukan panduan/i);
  assert.match(messages[0], /\.menu/);
});

test('custom prefix is respected in main navigation', async () => {
  const { ctx, messages } = makeCtx('menu', [], '!');
  await handleGeneralHelpCommands(ctx);
  assert.match(messages[0], /!mulai/);
  assert.match(messages[0], /!menu warna/);
});


test('needs menu explains practical design workflows', async () => {
  const { ctx, messages } = makeCtx('menu', ['kebutuhan']);
  await handleGeneralHelpCommands(ctx);
  assert.match(messages[0], /PILIH BERDASARKAN KEBUTUHAN/);
  assert.match(messages[0], /\.alur poster/);
  assert.match(messages[0], /\.alur revisi/);
});

test('poster workflow provides ordered steps and reasons', async () => {
  const { ctx, messages } = makeCtx('alur', ['poster']);
  await handleGeneralHelpCommands(ctx);
  assert.match(messages[0], /ALUR: MEMBUAT POSTER/);
  assert.match(messages[0], /\.wizard/);
  assert.match(messages[0], /\.creative poster acara sekolah/);
  // Alur poster memakai .designqa; .checklist adalah alias yang setara.
  assert.match(messages[0], /\.(designqa|checklist) poster/);
  assert.match(messages[0], /Menentukan tujuan/);
});

test('workflow aliases and custom prefixes work', async () => {
  const { ctx, messages } = makeCtx('alur', ['instagram'], '!');
  await handleGeneralHelpCommands(ctx);
  assert.match(messages[0], /ALUR: MEMBUAT KONTEN MEDIA SOSIAL/);
  assert.match(messages[0], /!wizard/);
  assert.doesNotMatch(messages[0], /\.wizard/);
});

test('unknown workflow offers supported options', async () => {
  const { ctx, messages } = makeCtx('alur', ['something-unknown']);
  await handleGeneralHelpCommands(ctx);
  assert.match(messages[0], /PUSAT BANTUAN BERDASARKAN KEBUTUHAN/);
  assert.match(messages[0], /\.alur logo/);
});


test('commands lists functions and examples with pagination', async () => {
  const { ctx, messages } = makeCtx('commands');
  await handleGeneralHelpCommands(ctx);
  assert.match(messages[0], /KATALOG PERINTAH PIR VISUALS/);
  assert.match(messages[0], /Contoh:/);
  assert.match(messages[0], /Halaman 1\//);
  assert.match(messages[0], /commands all 2/);
  // Jumlah total dihitung dari katalog agar tes tidak rusak setiap kali command bertambah.
  assert.match(messages[0], new RegExp(`10 dari ${COMMAND_CATALOG.length} perintah`));
});

test('commands category filter lists a category rather than the command named tools', async () => {
  const { ctx, messages } = makeCtx('commands', ['tools']);
  await handleGeneralHelpCommands(ctx);
  assert.match(messages[0], /Kategori: Tools Desain/);
  assert.match(messages[0], /\.assets texture kertas/);
});

test('commands supports detail lookup and custom prefix', async () => {
  const { ctx, messages } = makeCtx('commands', ['contrast'], '!');
  await handleGeneralHelpCommands(ctx);
  assert.match(messages[0], /!contrast/);
  assert.match(messages[0], /!help contrast/);
});

test('unknown command category tells user how to return to command catalog', async () => {
  const { ctx, messages } = makeCtx('commands', ['not-a-category']);
  await handleGeneralHelpCommands(ctx);
  assert.match(messages[0], /commands/);
});

test('tutorial menu lists only implemented tutorial routes and command catalog', async () => {
  const { ctx, messages } = makeCtx('tutorial');
  await handleGeneralHelpCommands(ctx);
  assert.match(messages[0], /\.tutorial belajar/);
  assert.match(messages[0], /\.tutorial tantangan/);
  assert.match(messages[0], /\.tutorial komunitas/);
  assert.match(messages[0], /\.tutorial portfolio/);
  assert.match(messages[0], /\.tutorial bukti/);
  assert.match(messages[0], /\.tutorial perintah/);
});

test('portfolio tutorial sends matching text and image asset', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const messages = [];
  const images = [];
  const ctx = {
    command: 'tutorial', args: ['portfolio'], PREFIX: '!',
    reply: async text => { messages.push(text); },
    fs, path, remoteJid: 'test@s.whatsapp.net', msg: {},
    sock: { sendMessage: async (...args) => { images.push(args); } },
  };
  await handleGeneralHelpCommands(ctx);
  assert.match(messages[0], /!portfolio daftar/);
  assert.match(messages[0], /!portfolio add/);
  assert.equal(images.length, 1);
  assert.ok(images[0][1].image.length > 1000);
  assert.match(images[0][1].caption, /portofolio/i);
});

test('proof tutorial explains direct contact and independent agreements', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const messages = [];
  const images = [];
  const ctx = {
    command: 'tutorial', args: ['bukti'], PREFIX: '.',
    reply: async text => { messages.push(text); }, fs, path,
    remoteJid: 'test@s.whatsapp.net', msg: {},
    sock: { sendMessage: async (...args) => { images.push(args); } },
  };
  await handleGeneralHelpCommands(ctx);
  assert.match(messages[0], /Hubungi desainer melalui kontak yang dicantumkan/);
  assert.match(messages[0], /PIR Visuals tidak terlibat dalam komunikasi pribadi/);
  assert.match(messages[0], /pembayaran/);
  assert.equal(images.length, 1);
});

test('command catalog supports keyword search for newer features', async () => {
  const { ctx, messages } = makeCtx('commands', ['cari', 'allowlist']);
  await handleGeneralHelpCommands(ctx);
  assert.match(messages[0], /HASIL PENCARIAN: allowlist/);
  assert.match(messages[0], /allowlist/);
  assert.match(messages[0], /help allowlist/);
});

test('command catalog search asks for a keyword when empty', async () => {
  const { ctx, messages } = makeCtx('commands', ['cari']);
  await handleGeneralHelpCommands(ctx);
  assert.match(messages[0], /commands cari <kata kunci>/);
});

test('menu game, marketplace, tools, dan owner memuat pintasan fitur terbaru', async () => {
  for (const [category, expected] of [
    ['game', /multi buat kuis/],
    ['market', /designer DSN-ID/],
    ['tools', /pinsearch/],
    ['owner', /allowlist search/],
  ]) {
    const { ctx, messages } = makeCtx('menu', [category]);
    await handleGeneralHelpCommands(ctx);
    assert.match(messages[0], expected, `menu ${category} should expose recent commands`);
  }
});


test('mulai starts the interactive onboarding when a sender identity is available', async () => {
  const { ctx, messages } = makeCtx('mulai');
  Object.assign(ctx, { userJid: 'member@s.whatsapp.net', remoteJid: 'group@g.us', isCommand: true });
  await handleGeneralHelpCommands(ctx);
  assert.match(messages[0], /SELAMAT DATANG DI PIR VISUALS/i);
  assert.match(messages[0], /1\/2/);
  assert.match(messages[0], /Membuat desain/);
});

test('cari discovers tools from a natural-language need and custom prefix', async () => {
  const { ctx, messages } = makeCtx('cari', ['bikin', 'poster', 'acara'], '!');
  await handleGeneralHelpCommands(ctx);
  assert.match(messages[0], /HASIL PENCARIAN/);
  assert.match(messages[0], /!wizard|!creative/);
  assert.match(messages[0], /Detail: !help/);
  assert.match(messages[0], /tidak dijalankan otomatis/i);
});

test('alur includes marketplace, creator, community, and game workflows', async () => {
  for (const [need, expected] of [
    ['jasa', /\.designer DSN-ID/],
    ['tawarkan', /\.portfolio daftar/],
    ['komunitas', /\.rules/],
    ['game', /\.games/],
  ]) {
    const { ctx, messages } = makeCtx('alur', [need]);
    await handleGeneralHelpCommands(ctx);
    assert.match(messages[0], expected);
  }
});

test('commands search uses natural language rather than only exact substring matches', async () => {
  const { ctx, messages } = makeCtx('commands', ['cari', 'ubah', 'ukuran', 'foto']);
  await handleGeneralHelpCommands(ctx);
  assert.match(messages[0], /HASIL PENCARIAN/);
  assert.match(messages[0], /\.resize/);
});


test('learning and community tutorials render the new v5.92 guides', async () => {
  const learning = makeCtx('tutorial', ['belajar'], '!');
  await handleGeneralHelpCommands(learning.ctx);
  assert.match(learning.messages[0], /LEARNING PATH PIR VISUALS/);
  assert.match(learning.messages[0], /!designlearn progress/);

  const challenge = makeCtx('tutorial', ['tantangan'], '!');
  await handleGeneralHelpCommands(challenge.ctx);
  assert.match(challenge.messages[0], /COMMUNITY DESIGN CHALLENGE/);
  assert.match(challenge.messages[0], /!designchallenge feedback/);
});

test('community tutorial and workflow explain mentor opt-in and collaboration boundaries', async () => {
  const tutorial = makeCtx('tutorial', ['komunitas'], '!');
  await handleGeneralHelpCommands(tutorial.ctx);
  assert.match(tutorial.messages[0], /COMMUNITY HUB/);
  assert.match(tutorial.messages[0], /!designcommunity mentor/);
  assert.match(tutorial.messages[0], /!designcommunity collab/);

  const workflow = makeCtx('alur', ['komunitas'], '!');
  await handleGeneralHelpCommands(workflow.ctx);
  assert.match(workflow.messages[0], /BELAJAR DAN BERKOLABORASI/);
  assert.match(workflow.messages[0], /!designcommunity badges/);
});


test('quick access command exposes personal favorites and privacy-first history settings', async () => {
  const { ctx, messages } = makeCtx('cepat', []);
  Object.assign(ctx, { userJid: 'member@s.whatsapp.net' });
  await handleGeneralHelpCommands(ctx);
  assert.match(messages[0], /AKSES CEPAT/);
  assert.match(messages[0], /cepat tambah/);
  assert.match(messages[0], /riwayat aktif/);
  assert.match(messages[0], /tidak menyimpan isi pesan/i);
});


test('v6.5 Learning Cohort and Media Format Explorer are discoverable in help and menus', async () => {
  const cohortHelp = makeCtx('help', ['cohort']);
  await handleGeneralHelpCommands(cohortHelp.ctx);
  assert.match(cohortHelp.messages[0], /Learning Cohort/);
  assert.match(cohortHelp.messages[0], /check-in/);

  const mediaHelp = makeCtx('help', ['mediaformat']);
  await handleGeneralHelpCommands(mediaHelp.ctx);
  assert.match(mediaHelp.messages[0], /metadata format publik tanpa mengunduh/);

  const learningMenu = makeCtx('menu', ['belajar']);
  await handleGeneralHelpCommands(learningMenu.ctx);
  assert.match(learningMenu.messages[0], /LEARNING COHORT/);

  const mediaMenu = makeCtx('menu', ['media']);
  await handleGeneralHelpCommands(mediaMenu.ctx);
  assert.match(mediaMenu.messages[0], /DOWNLOADER & MEDIA/);
  assert.match(mediaMenu.messages[0], /mediaformat cek/);
  assert.doesNotMatch(mediaMenu.messages[0], /anime populer/);

  const mediaWorkflow = makeCtx('alur', ['media']);
  await handleGeneralHelpCommands(mediaWorkflow.ctx);
  assert.match(mediaWorkflow.messages[0], /skip-download/);
});


test('main menu and .fitur reveal the complete catalog, search, workflows, and pagination', async () => {
  const main = makeCtx('menu');
  await handleGeneralHelpCommands(main.ctx);
  assert.match(main.messages[0], /JELAJAHI SELURUH FITUR/);
  assert.match(main.messages[0], /\.fitur cari/);

  const directory = makeCtx('fitur');
  await handleGeneralHelpCommands(directory.ctx);
  assert.match(directory.messages[0], /DAFTAR LENGKAP FITUR/);
  assert.match(directory.messages[0], /CREATIVE ASSET STUDIO/i);
  assert.match(directory.messages[0], /ANIME & HIBURAN/i);
  assert.match(directory.messages[0], /MUSIK & AUDIO/i);
  assert.match(directory.messages[0], /command terdaftar/i);

  const search = makeCtx('fitur', ['cari', 'download musik apple']);
  await handleGeneralHelpCommands(search.ctx);
  assert.match(search.messages[0], /music|dl/i);

  const category = makeCtx('fitur', ['kategori', 'Creative', 'Asset', 'Studio']);
  await handleGeneralHelpCommands(category.ctx);
  assert.match(category.messages[0], /Kategori: Creative Asset Studio/);
  assert.match(category.messages[0], /assetstudio/);

  const all = makeCtx('fitur', ['semua', '2']);
  await handleGeneralHelpCommands(all.ctx);
  assert.match(all.messages[0], /Halaman 2\//);

  const workflows = makeCtx('fitur', ['alur']);
  await handleGeneralHelpCommands(workflows.ctx);
  assert.match(workflows.messages[0], /WORKFLOW PIR VISUALS/);
  assert.match(workflows.messages[0], /design-season/);
});


test('anime and music help explain provider fallback and Apple preview-only downloads', async () => {
  const anime = makeCtx('help', ['anime']);
  await handleGeneralHelpCommands(anime.ctx);
  assert.match(anime.messages[0], /AniList sebagai provider cadangan/i);

  const music = makeCtx('help', ['music']);
  await handleGeneralHelpCommands(music.ctx);
  assert.match(music.messages[0], /music preview/);
  assert.match(music.messages[0], /tidak mengunduh lagu penuh/i);
});


test('main menu and help without a topic are text-only', async () => {
  const sent = [];
  const menuMessages = [];
  const menuCtx = {
    command: 'menu', args: [], PREFIX: '.', remoteJid: 'group@g.us',
    sock: { sendMessage: async (...args) => { sent.push(args); } },
    reply: async text => { menuMessages.push(text); },
  };
  await handleGeneralHelpCommands(menuCtx);
  assert.equal(sent.length, 0, 'main menu must not send an image or media');
  assert.match(menuMessages[0], /JELAJAHI SELURUH FITUR/);
  assert.match(menuMessages[0], /\.menu designer/);

  const helpMessages = [];
  await handleGeneralHelpCommands({
    command: 'help', args: [], PREFIX: '.',
    sock: { sendMessage: async (...args) => { sent.push(args); } },
    reply: async text => { helpMessages.push(text); },
  });
  assert.equal(sent.length, 0, 'help without a topic must remain text-only');
  assert.match(helpMessages[0], /JELAJAHI SELURUH FITUR/);
});

test('.fitur prints every registered command grouped by category in the copied-text style', async () => {
  const sent = [];
  const messages = [];
  const ctx = {
    command: 'fitur', args: [], PREFIX: '.', remoteJid: 'chat@g.us',
    sock: { sendMessage: async (...args) => { sent.push(args); } },
    reply: async text => { messages.push(text); },
  };
  await handleGeneralHelpCommands(ctx);
  assert.equal(sent.length, 0, 'feature catalog must not send a menu image');
  assert.equal(messages.length, 1, 'complete catalog should fit in one WhatsApp text message');
  const text = messages[0];
  assert.match(text, /DAFTAR LENGKAP FITUR PIR VISUALS/);
  assert.match(text, new RegExp(`${COMMAND_CATALOG.length} command terdaftar`));
  assert.match(text, /╭─「 \*ANIME & HIBURAN\* 」/);
  assert.match(text, /╭─「 \*TOOLS DESAIN\* 」/);
  assert.match(text, /╭─「 \*OWNER\* 」/);
  for (const item of COMMAND_CATALOG) {
    assert.ok(text.includes(`• *.${item.command}*`), `missing command from .fitur: ${item.command}`);
  }
  assert.ok(Buffer.byteLength(text, 'utf8') < 65536, `catalog is too long for one WhatsApp message: ${Buffer.byteLength(text, 'utf8')} bytes`);
});

test('.fitur full catalog respects custom prefixes', async () => {
  const { ctx, messages } = makeCtx('fitur', [], '!');
  await handleGeneralHelpCommands(ctx);
  assert.match(messages[0], /• \*!contrast\*/);
  assert.match(messages[0], /!help <perintah>/);
  assert.doesNotMatch(messages[0], /• \*\.contrast\*/);
});

test('v6.7.2 Voice Lab and Local Information are discoverable through help, menu and workflows', async () => {
  const voiceHelp = makeCtx('help', ['voice']);
  await handleGeneralHelpCommands(voiceHelp.ctx);
  assert.match(voiceHelp.messages[0], /Voice Lab/);
  assert.match(voiceHelp.messages[0], /FFmpeg/);

  const weatherHelp = makeCtx('help', ['cuaca']);
  await handleGeneralHelpCommands(weatherHelp.ctx);
  assert.match(weatherHelp.messages[0], /Open-Meteo/);

  const quakeHelp = makeCtx('help', ['gempa']);
  await handleGeneralHelpCommands(quakeHelp.ctx);
  assert.match(quakeHelp.messages[0], /BMKG/);

  const musicMenu = makeCtx('menu', ['musik']);
  await handleGeneralHelpCommands(musicMenu.ctx);
  assert.match(musicMenu.messages[0], /voice help/);
  assert.match(musicMenu.messages[0], /karaoke/);

  const infoMenu = makeCtx('menu', ['info']);
  await handleGeneralHelpCommands(infoMenu.ctx);
  assert.match(infoMenu.messages[0], /UTILITAS & INFO LOKAL/);
  assert.match(infoMenu.messages[0], /\.cuaca/);
  assert.match(infoMenu.messages[0], /\.gempa/);

  const voiceFlow = makeCtx('alur', ['suara']);
  await handleGeneralHelpCommands(voiceFlow.ctx);
  assert.match(voiceFlow.messages[0], /Mengolah voice note/i);
  assert.match(voiceFlow.messages[0], /\.tempo 1.25/);

  const infoFlow = makeCtx('alur', ['info']);
  await handleGeneralHelpCommands(infoFlow.ctx);
  assert.match(infoFlow.messages[0], /Memeriksa cuaca dan gempa/i);

  const infoCategory = makeCtx('fitur', ['kategori', 'Utilitas', '&', 'Info']);
  await handleGeneralHelpCommands(infoCategory.ctx);
  assert.match(infoCategory.messages[0], /Kategori: Utilitas & Info/);
  assert.match(infoCategory.messages[0], /cuaca/);
});
