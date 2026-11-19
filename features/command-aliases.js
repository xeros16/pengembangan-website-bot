// Pintasan bawaan dan tambahan yang dapat dikelola Owner melalui WhatsApp.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const SHORT_COMMAND_ALIASES = Object.freeze({
  cmd: 'commands', c: 'commands', h: 'help', m: 'menu', ak: 'akun',
  wz: 'wizard', cp: 'colorpalette', ct: 'contrast', ck: 'checklist',
  rv: 'revision', br: 'brief', fp: 'fontpair', ly: 'layout',
  cr: 'creative', as: 'assets', st: 'sticker', inf: 'info',
});

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONFIG_FILE = path.join(ROOT, 'config', 'command-aliases.json');
const EXAMPLE_CONFIG_FILE = path.join(ROOT, 'config', 'command-aliases.example.json');
const RESERVED_NAMES = new Set([...Object.keys(SHORT_COMMAND_ALIASES), ...Object.values(SHORT_COMMAND_ALIASES)]);
const ALIAS_RE = /^[a-z][a-z0-9_-]{0,11}$/;
let customAliases = {};
export let COMMAND_ALIASES = Object.freeze({ ...SHORT_COMMAND_ALIASES });

export function buildCommandAliasMap(custom = {}) {
  const result = { ...SHORT_COMMAND_ALIASES };
  if (!custom || typeof custom !== 'object' || Array.isArray(custom)) return Object.freeze(result);
  for (const [rawAlias, rawTarget] of Object.entries(custom)) {
    const alias = String(rawAlias).trim().toLowerCase().replace(/^\./, '');
    const target = typeof rawTarget === 'string' ? rawTarget.trim().toLowerCase().replace(/^\./, '') : '';
    if (!ALIAS_RE.test(alias) || !/^[a-z][a-z0-9_-]*$/.test(target)) continue;
    if (RESERVED_NAMES.has(alias) || Object.hasOwn(result, alias)) continue;
    result[alias] = target;
  }
  return Object.freeze(result);
}

function readConfig() {
  try {
    const source = readFileSync(CONFIG_FILE, 'utf8');
    const parsed = JSON.parse(source);
    return parsed?.aliases && typeof parsed.aliases === 'object' && !Array.isArray(parsed.aliases) ? parsed.aliases : {};
  } catch {
    try {
      const parsed = JSON.parse(readFileSync(EXAMPLE_CONFIG_FILE, 'utf8'));
      return parsed?.aliases && typeof parsed.aliases === 'object' && !Array.isArray(parsed.aliases) ? parsed.aliases : {};
    } catch { return {}; }
  }
}

export function reloadCommandAliases() {
  customAliases = readConfig();
  COMMAND_ALIASES = buildCommandAliasMap(customAliases);
  return COMMAND_ALIASES;
}

export function normalizeShortCommand(command) {
  const key = String(command || '').toLowerCase().replace(/^\./, '');
  return COMMAND_ALIASES[key] || key;
}

export function listCustomAliases() {
  reloadCommandAliases();
  return Object.entries(customAliases).filter(([alias, target]) => COMMAND_ALIASES[alias] === target);
}

export function addCustomAlias(aliasInput, targetInput, knownCommands = []) {
  const alias = String(aliasInput || '').trim().toLowerCase().replace(/^\./, '');
  const target = String(targetInput || '').trim().toLowerCase().replace(/^\./, '');
  if (!ALIAS_RE.test(alias)) return { ok: false, message: 'Nama pintasan harus 1–12 karakter, diawali huruf, dan hanya berisi huruf, angka, _ atau -.' };
  if (RESERVED_NAMES.has(alias) || knownCommands.includes(alias)) return { ok: false, message: 'Nama itu sudah dipakai perintah atau pintasan bawaan.' };
  if (!knownCommands.includes(target)) return { ok: false, message: `Perintah tujuan *${target || '-'}* tidak ditemukan. Cek dengan .commands.` };
  reloadCommandAliases();
  if (Object.hasOwn(customAliases, alias)) return { ok: false, message: 'Pintasan tersebut sudah ada. Hapus dahulu jika ingin menggantinya.' };
  const next = { ...customAliases, [alias]: target };
  try {
    mkdirSync(path.dirname(CONFIG_FILE), { recursive: true });
    writeFileSync(CONFIG_FILE, `${JSON.stringify({ aliases: next }, null, 2)}\n`, 'utf8');
    reloadCommandAliases();
    return { ok: true, alias, target };
  } catch (error) {
    return { ok: false, message: `Gagal menyimpan konfigurasi: ${error.message}` };
  }
}

export function removeCustomAlias(aliasInput) {
  const alias = String(aliasInput || '').trim().toLowerCase().replace(/^\./, '');
  reloadCommandAliases();
  if (!Object.hasOwn(customAliases, alias)) return { ok: false, message: 'Pintasan khusus tersebut tidak ditemukan.' };
  const next = { ...customAliases };
  delete next[alias];
  try {
    writeFileSync(CONFIG_FILE, `${JSON.stringify({ aliases: next }, null, 2)}\n`, 'utf8');
    reloadCommandAliases();
    return { ok: true, alias };
  } catch (error) {
    return { ok: false, message: `Gagal menyimpan konfigurasi: ${error.message}` };
  }
}

// Muat konfigurasi lokal saat modul pertama kali dipanggil.
reloadCommandAliases();
