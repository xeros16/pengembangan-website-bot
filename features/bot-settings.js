// Pengaturan runtime sederhana yang dikelola Owner dan disimpan sebagai JSON.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const BOT_SETTINGS_PATH = path.join(ROOT, 'config', 'bot-settings.json');
const DEFAULTS = Object.freeze({ maintenanceMode: false, maintenanceNotice: 'Bot sedang dalam pemeliharaan. Silakan coba lagi nanti.' });

function normalizeSettings(value = {}) {
  return {
    maintenanceMode: value.maintenanceMode === true,
    maintenanceNotice: typeof value.maintenanceNotice === 'string' && value.maintenanceNotice.trim()
      ? value.maintenanceNotice.trim().slice(0, 500)
      : DEFAULTS.maintenanceNotice,
  };
}

export function readBotSettings() {
  try {
    return normalizeSettings(JSON.parse(fs.readFileSync(BOT_SETTINGS_PATH, 'utf8')));
  } catch (error) {
    if (error.code !== 'ENOENT') console.error('[BOT SETTINGS] Gagal membaca konfigurasi:', error.message);
    return { ...DEFAULTS };
  }
}

export function updateBotSettings(patch = {}) {
  const current = readBotSettings();
  const next = normalizeSettings({ ...current, ...patch });
  fs.mkdirSync(path.dirname(BOT_SETTINGS_PATH), { recursive: true });
  const temporaryPath = `${BOT_SETTINGS_PATH}.${process.pid}.tmp`;
  fs.writeFileSync(temporaryPath, `${JSON.stringify(next, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
  fs.renameSync(temporaryPath, BOT_SETTINGS_PATH);
  return next;
}

export function renderBotSettings(settings = readBotSettings()) {
  return `⚙️ *PENGATURAN BOT*\n\n` +
    `Mode pemeliharaan: *${settings.maintenanceMode ? 'AKTIF' : 'NONAKTIF'}*\n` +
    `Pesan pemeliharaan: ${settings.maintenanceNotice}\n\n` +
    `Perintah Owner:\n` +
    `• .botconfig maintenance on\n` +
    `• .botconfig maintenance off\n` +
    `• .botconfig notice <pesan>\n` +
    `• .botconfig notice reset\n\n` +
    `Saat aktif, perintah anggota dibatasi. Moderasi grup yang berjalan di luar command router tetap mengikuti pengaturan grup.`;
}
