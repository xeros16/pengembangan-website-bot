import path from 'node:path';

// Satu tempat untuk mengatur gambar perintah Pixel Realm.
const IMAGE_MAP = Object.freeze({
  menu: { env: 'GAME_MENU_IMAGE', fallback: 'assets/images/menu/pixel_realm_menu.png' },
  help: { env: 'GAME_HELP_IMAGE', fallback: 'assets/images/help/pixel_realm_help.png' },
  bantuan: { env: 'GAME_BANTUAN_IMAGE', fallback: 'assets/images/help/pixel_realm_bantuan.png' },
});

export function getGameImagePath(key) {
  const entry = IMAGE_MAP[key];
  if (!entry) throw new Error(`Unknown Pixel Realm image key: ${key}`);
  return path.resolve(process.env[entry.env] || entry.fallback);
}

export function getGameImageMap() {
  return Object.fromEntries(Object.entries(IMAGE_MAP).map(([key, value]) => [key, { ...value, resolvedPath: getGameImagePath(key) }]));
}
