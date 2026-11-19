import test from 'node:test';
import assert from 'node:assert/strict';
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
import { ANIME_DISCOVERY_COMMANDS } from '../features/commands/anime-discovery.js';
import { MUSIC_DISCOVERY_COMMANDS } from '../features/commands/music-discovery.js';
import { VOICE_EFFECT_COMMANDS } from '../features/commands/voice-effects.js';
import { LOCAL_INFO_COMMANDS } from '../features/commands/local-info.js';
import { PIR_ASSISTANT_COMMANDS } from '../features/commands/pir-assistant.js';
import { DESIGN_LEARNING_COMMANDS } from '../features/commands/design-learning.js';
import { DESIGN_COMMUNITY_COMMANDS } from '../features/commands/design-community.js';
import { DESIGN_COHORT_COMMANDS } from '../features/commands/design-cohort.js';
import { DESIGN_SEASON_COMMANDS } from '../features/commands/design-seasons.js';
import { ASSET_STUDIO_COMMANDS } from '../features/commands/asset-studio.js';
import { MEDIA_DOWNLOAD_COMMANDS } from '../features/commands/media-download.js';
import fs from 'node:fs';
import { COMMAND_CATALOG } from '../features/command-catalog.js';
import { ECONOMY_COMMANDS } from '../games/economy/index.js';
import { GAME_COMMAND_METADATA } from '../games/command-metadata.js';
import { PINTEREST_SEARCH_COMMANDS, BING_IMAGE_SEARCH_COMMANDS } from '../features/commands/pinterest-search.js';
const groups = [ANIME_DISCOVERY_COMMANDS, MUSIC_DISCOVERY_COMMANDS, VOICE_EFFECT_COMMANDS, LOCAL_INFO_COMMANDS, PIR_ASSISTANT_COMMANDS, DESIGN_LEARNING_COMMANDS, DESIGN_COMMUNITY_COMMANDS, DESIGN_COHORT_COMMANDS, DESIGN_SEASON_COMMANDS, ASSET_STUDIO_COMMANDS, MEDIA_DOWNLOAD_COMMANDS, DESIGNER_ASSISTANT_COMMANDS, IMAGE_INFO_COMMANDS, IMAGE_PROCESSING_COMMANDS, DESIGN_BRIEF_COMMANDS, DESIGN_TOOLS_COMMANDS, ASSETS_DISCOVERY_COMMANDS, ASSETS_MANAGEMENT_COMMANDS, SUPPORT_REPORTS_COMMANDS, SUPPORT_ADMIN_COMMANDS, MODERATION_SETTINGS_COMMANDS, MODERATION_ACTIONS_COMMANDS, GENERAL_HELP_COMMANDS, GENERAL_OWNER_COMMANDS, GROUP_IDENTIFIER_COMMANDS, ECONOMY_COMMANDS, PINTEREST_SEARCH_COMMANDS, BING_IMAGE_SEARCH_COMMANDS];
test('command registries have no collisions', () => {
  const seen = new Set();
  const intentionalSharedRoutes = new Set(['reports']); // Owner and group-admin views are intentionally dispatched by role.
  for (const group of groups) for (const command of group) {
    if (seen.has(command)) assert.equal(intentionalSharedRoutes.has(command), true, `duplicate command route: ${command}`);
    seen.add(command);
  }
});

test('complete feature catalog covers every routed command and game metadata entry', () => {
  const catalog = new Set(COMMAND_CATALOG.map(item => item.command));
  for (const group of groups) {
    for (const command of group) assert.equal(catalog.has(command), true, `catalog is missing routed command: ${command}`);
  }
  for (const game of GAME_COMMAND_METADATA) {
    assert.equal(catalog.has(game.command), true, `catalog is missing game command: ${game.command}`);
  }
});

test('expected core commands are routed', () => {
  for (const command of ['sticker', 'resize', 'fontpair', 'assets', 'ticket', 'antilink', 'owner', 'help', 'jid', 'idgrup', 'idanggota', 'daftaridanggota', 'akses', 'sub', 'colorpalette', 'contrast', 'checklist', 'revision', 'brandkit', 'pricing', 'wizard', 'briefwizard', 'mulai', 'bantuan', 'tools', 'akun', 'panduan', 'alur', 'kebutuhan', 'cepat', 'fitur', 'features', 'jelajah', 'anime', 'music', 'voice', 'bass', 'karaoke', 'tempo', '8d', 'cuaca', 'weather', 'gempa', 'asisten', 'designchallenge', 'designcommunity', 'cohort', 'mediaformat', 'modstatus', 'modpreset', 'designseason', 'assetstudio']) {
    assert.equal(groups.some(group => group.has(command)), true, `missing route: ${command}`);
  }
});

test('music and PIR assistant commands are dispatched through dedicated feature handlers', () => {
  const handler = fs.readFileSync(new URL('../features/command-handler.js', import.meta.url), 'utf8');
  assert.match(handler, /handleMusicDiscoveryCommand/);
  assert.match(handler, /MUSIC_DISCOVERY_COMMANDS\.has\(command\)/);
  assert.match(handler, /handlePirAssistantCommand/);
  assert.match(handler, /PIR_ASSISTANT_COMMANDS\.has\(command\)/);
});

test('anime command is dispatched through its dedicated feature handler', () => {
  const handler = fs.readFileSync(new URL('../features/command-handler.js', import.meta.url), 'utf8');
  assert.match(handler, /handleAnimeDiscoveryCommand/);
  assert.match(handler, /ANIME_DISCOVERY_COMMANDS\.has\(command\)/);
});


test('Design Battle, community summary, and group safety controls are registered', () => {
  assert.equal(DESIGN_LEARNING_COMMANDS.has('designchallenge'), true);
  assert.equal(DESIGN_COMMUNITY_COMMANDS.has('designcommunity'), true);
  assert.equal(DESIGN_COHORT_COMMANDS.has('cohort'), true);
  assert.equal(MEDIA_DOWNLOAD_COMMANDS.has('mediaformat'), true);
  assert.equal(MODERATION_SETTINGS_COMMANDS.has('modstatus'), true);
  assert.equal(MODERATION_SETTINGS_COMMANDS.has('modpreset'), true);
});


test('Learning Cohort is dispatched through its dedicated WhatsApp handler', () => {
  const handler = fs.readFileSync(new URL('../features/command-handler.js', import.meta.url), 'utf8');
  assert.match(handler, /handleDesignCohortCommands/);
  assert.match(handler, /DESIGN_COHORT_COMMANDS\.has\(command\)/);
  assert.match(handler, /handleDesignSeasonCommands/);
  assert.match(handler, /DESIGN_SEASON_COMMANDS\.has\(command\)/);
  assert.match(handler, /handleAssetStudioCommand/);
  assert.match(handler, /ASSET_STUDIO_COMMANDS\.has\(command\)/);
});


test('Voice Lab commands are registered for the dedicated handler', () => {
  for (const command of ['voice', 'bass', 'chipmunk', 'karaoke', 'tempo', '8d', 'normalize']) {
    assert.ok(VOICE_EFFECT_COMMANDS.has(command), `${command} should be registered`);
  }
});


test('local weather and earthquake commands are registered for the dedicated handler', () => {
  assert.ok(LOCAL_INFO_COMMANDS.has('cuaca'));
  assert.ok(LOCAL_INFO_COMMANDS.has('weather'));
  assert.ok(LOCAL_INFO_COMMANDS.has('gempa'));
});
