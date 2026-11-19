import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { BOT_SETTINGS_PATH, readBotSettings, updateBotSettings, renderBotSettings } from '../features/bot-settings.js';

test('bot settings default safely when file is absent', () => {
  const backup = fs.existsSync(BOT_SETTINGS_PATH) ? fs.readFileSync(BOT_SETTINGS_PATH) : null;
  try {
    if (backup) fs.unlinkSync(BOT_SETTINGS_PATH);
    assert.deepEqual(readBotSettings(), {
      maintenanceMode: false,
      maintenanceNotice: 'Bot sedang dalam pemeliharaan. Silakan coba lagi nanti.',
    });
  } finally {
    if (backup) fs.writeFileSync(BOT_SETTINGS_PATH, backup);
  }
});

test('settings update persists bounded notice and maintenance flag', () => {
  const backup = fs.existsSync(BOT_SETTINGS_PATH) ? fs.readFileSync(BOT_SETTINGS_PATH) : null;
  try {
    const saved = updateBotSettings({ maintenanceMode: true, maintenanceNotice: 'Sedang perbaikan.' });
    assert.equal(saved.maintenanceMode, true);
    assert.equal(readBotSettings().maintenanceNotice, 'Sedang perbaikan.');
    assert.match(renderBotSettings(saved), /maintenance on/);
    assert.equal(updateBotSettings({ maintenanceNotice: 'x'.repeat(700) }).maintenanceNotice.length, 500);
  } finally {
    if (backup) fs.writeFileSync(BOT_SETTINGS_PATH, backup);
    else if (fs.existsSync(BOT_SETTINGS_PATH)) fs.unlinkSync(BOT_SETTINGS_PATH);
  }
});
