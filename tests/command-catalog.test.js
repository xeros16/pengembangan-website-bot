import test from 'node:test';
import assert from 'node:assert/strict';
import { COMMAND_CATALOG, COMMAND_CATEGORIES, COMMAND_WORKFLOWS, renderCommandCatalogMarkdown } from '../features/command-catalog.js';
import { IMAGE_INFO_COMMANDS } from '../features/commands/image-info.js';
import { IMAGE_PROCESSING_COMMANDS } from '../features/commands/image-processing.js';
import { DESIGN_BRIEF_COMMANDS } from '../features/commands/design-brief.js';
import { DESIGN_TOOLS_COMMANDS } from '../features/commands/design-tools.js';
import { ASSETS_DISCOVERY_COMMANDS } from '../features/commands/assets-discovery.js';
import { ASSETS_MANAGEMENT_COMMANDS } from '../features/commands/assets-management.js';
import { SUPPORT_REPORTS_COMMANDS } from '../features/commands/support-reports.js';
import { SUPPORT_ADMIN_COMMANDS } from '../features/commands/support-admin.js';
import { MODERATION_SETTINGS_COMMANDS } from '../features/commands/moderation-settings.js';
import { MODERATION_ACTIONS_COMMANDS } from '../features/commands/moderation-actions.js';
import { GENERAL_HELP_COMMANDS } from '../features/commands/general-help.js';
import { GENERAL_OWNER_COMMANDS } from '../features/commands/general-owner.js';
import { GROUP_IDENTIFIER_COMMANDS } from '../features/commands/group-identifiers.js';
import { DESIGNER_ASSISTANT_COMMANDS } from '../features/commands/designer-assistant.js';
import { DESIGN_LEARNING_COMMANDS } from '../features/commands/design-learning.js';
import { DESIGN_COMMUNITY_COMMANDS } from '../features/commands/design-community.js';
import { DESIGN_COHORT_COMMANDS } from '../features/commands/design-cohort.js';
import { DESIGN_SEASON_COMMANDS } from '../features/commands/design-seasons.js';
import { ASSET_STUDIO_COMMANDS } from '../features/commands/asset-studio.js';
import { MEDIA_DOWNLOAD_COMMANDS } from '../features/commands/media-download.js';
import { DESIGN_CRITIQUE_COMMANDS } from '../features/commands/design-critique.js';
import { GAME_COMMAND_METADATA } from '../games/command-metadata.js';
import { ANIME_DISCOVERY_COMMANDS } from '../features/commands/anime-discovery.js';
import { VOICE_EFFECT_COMMANDS } from '../features/commands/voice-effects.js';
import { LOCAL_INFO_COMMANDS } from '../features/commands/local-info.js';

const commandSets = [DESIGNER_ASSISTANT_COMMANDS, DESIGN_LEARNING_COMMANDS, DESIGN_COMMUNITY_COMMANDS, DESIGN_COHORT_COMMANDS, DESIGN_SEASON_COMMANDS, ASSET_STUDIO_COMMANDS, MEDIA_DOWNLOAD_COMMANDS, DESIGN_CRITIQUE_COMMANDS, IMAGE_INFO_COMMANDS, IMAGE_PROCESSING_COMMANDS, DESIGN_BRIEF_COMMANDS, DESIGN_TOOLS_COMMANDS,
  ASSETS_DISCOVERY_COMMANDS, ASSETS_MANAGEMENT_COMMANDS, SUPPORT_REPORTS_COMMANDS, SUPPORT_ADMIN_COMMANDS,
  MODERATION_SETTINGS_COMMANDS, MODERATION_ACTIONS_COMMANDS, GENERAL_HELP_COMMANDS, GENERAL_OWNER_COMMANDS,
  GROUP_IDENTIFIER_COMMANDS, ANIME_DISCOVERY_COMMANDS, VOICE_EFFECT_COMMANDS, LOCAL_INFO_COMMANDS];

test('catalog mencakup semua perintah dalam registry modular', () => {
  const catalogCommands = new Set(COMMAND_CATALOG.map(item => item.command));
  const missing = commandSets.flatMap(set => [...set].filter(command => !catalogCommands.has(command)));
  assert.deepEqual(missing, []);
});

test('catalog mencakup perintah marketplace dan semua game yang terdaftar', () => {
  const catalogCommands = new Set(COMMAND_CATALOG.map(item => item.command));
  for (const command of ['cancel', 'portfolio', 'design', 'designer', 'studio', 'lapordesain', 'marketreport', 'marketadmin']) {
    assert.ok(catalogCommands.has(command), `Missing marketplace command: ${command}`);
  }
  for (const game of GAME_COMMAND_METADATA) assert.ok(catalogCommands.has(game.command), `Missing game: ${game.command}`);
});

test('katalog memiliki deskripsi dan kategori yang valid serta dapat menghasilkan dokumentasi', () => {
  assert.ok(COMMAND_CATEGORIES.length >= 5);
  assert.ok(COMMAND_CATALOG.every(item => item.command && item.category && item.description && item.permission && item.example));
  const markdown = renderCommandCatalogMarkdown();
  assert.match(markdown, /Katalog Perintah Bot WhatsApp/);
  assert.match(markdown, /marketadmin/);
  assert.match(markdown, /brandkit/);
  assert.match(markdown, /pricing/);
  assert.match(markdown, /Contoh/);
  assert.match(markdown, /commands/);
  assert.match(markdown, /Anime & Hiburan/);
  assert.match(markdown, /\.anime cari Frieren/);
  assert.match(markdown, /Musik & Audio/);
  assert.match(markdown, /\.music cari Nadin Amizah/);
  assert.match(markdown, /\.asisten/);
  assert.match(markdown, /Design Battle/);
  assert.match(markdown, /Learning Cohort/);
  assert.match(markdown, /Media Format Explorer/);
  assert.match(markdown, /\.modpreset preview/);
  assert.match(markdown, /Design Seasons/);
  assert.match(markdown, /Creative Asset Studio/);
  assert.match(markdown, /\.music top/);
  assert.match(markdown, /PIR VOICE LAB|Voice Lab/i);
  assert.match(markdown, /\.voice help/);
  assert.match(markdown, /\.cuaca Bandung/);
  assert.match(markdown, /\.gempa/);
});

test('catalog shows specific access labels for premium and owner-only tools', () => {
  const byName = Object.fromEntries(COMMAND_CATALOG.map(item => [item.command, item]));
  assert.match(byName.brandkit.permission, /Pelanggan aktif/);
  assert.match(byName.sub.permission, /Owner bot/);
  assert.equal(byName.contrast.permission, 'Anggota');
  assert.equal(byName.marketadmin.permission, 'Khusus Owner bot');
  assert.equal(byName.music.category, 'Musik & Audio');
  assert.equal(byName.voice.category, 'Musik & Audio');
  assert.match(byName.voice.permission, /FFmpeg/);
  assert.equal(byName.cuaca.category, 'Utilitas & Info');
  assert.equal(byName.gempa.category, 'Utilitas & Info');
  assert.equal(byName.asisten.category, 'Asisten PIR');
  assert.equal(byName.modstatus.permission, 'Anggota grup; hanya baca');
  assert.match(byName.modpreset.permission, /Admin grup/);
  assert.match(byName.designseason.permission, /satu season aktif/);
  assert.match(byName.assetstudio.permission, /privat secara default/);
});


test('catalog marketplace menyertakan pintasan studio dan direktori portofolio', () => {
  const byName = Object.fromEntries(COMMAND_CATALOG.map(item => [item.command, item]));
  assert.equal(byName.studio.category, 'Designer Portfolio Directory');
  assert.match(byName.studio.example, /\.studio/);
  assert.match(byName.designer.example, /\.designer DSN-ID/);
  assert.match(byName.portfolio.description, /kontak/);
  for (const disabled of ['requestdesign', 'client', 'klien', 'service', 'layanan']) assert.equal(byName[disabled], undefined);
});

test('Community Hub command is registered with scoped opt-in access', () => {
  const entry = COMMAND_CATALOG.find(item => item.command === 'designcommunity');
  assert.ok(entry);
  assert.equal(entry.category, 'Komunitas Desain');
  assert.match(entry.description, /mentor/i);
  assert.match(entry.permission, /opt-in/i);
});


test('quick access is discoverable in the command catalog', () => {
  const entry = COMMAND_CATALOG.find(item => item.command === 'cepat');
  assert.ok(entry);
  assert.match(entry.description, /favorit/i);
  assert.match(entry.example, /\.cepat/);
  assert.equal(GENERAL_HELP_COMMANDS.has('cepat'), true);
});


test('Learning Cohort and Media Format Explorer are discoverable with scoped permissions', () => {
  const byName = Object.fromEntries(COMMAND_CATALOG.map(item => [item.command, item]));
  assert.equal(byName.cohort.category, 'Belajar Desain');
  assert.match(byName.cohort.permission, /grup asal/);
  assert.match(byName.cohort.example, /\.cohort buat/);
  assert.equal(byName.mediaformat.category, 'Downloader & Media');
  assert.match(byName.mediaformat.description, /tanpa mengunduh/);
  assert.match(byName.mediaformat.example, /\.mediaformat cek/);
});


test('guided command workflows are curated, non-executing, and use registered WhatsApp commands', () => {
  assert.ok(COMMAND_WORKFLOWS.length >= 4);
  for (const workflow of COMMAND_WORKFLOWS) {
    assert.ok(workflow.id && workflow.title && workflow.description && Array.isArray(workflow.steps));
    assert.ok(workflow.steps.length >= 2);
    for (const step of workflow.steps) {
      const command = String(step).trim().match(/^\.([a-z0-9:]+)/i)?.[1];
      assert.ok(command, `workflow step is not a WhatsApp command: ${step}`);
      assert.ok(COMMAND_CATALOG.some(item => item.command === command), `workflow references unregistered command: ${command}`);
    }
  }
});
