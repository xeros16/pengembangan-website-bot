import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function parseEnvFile(file) {
  if (!fs.existsSync(file)) return {};
  const values = {};
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    values[match[1]] = value;
  }
  return values;
}

export function databaseName(uri = '') {
  try { return decodeURIComponent(new URL(uri).pathname.replace(/^\/+/, '').split('/')[0] || ''); }
  catch { return ''; }
}

export function databaseTarget(uri = '') {
  try {
    const parsed = new URL(uri);
    const database = decodeURIComponent(parsed.pathname.replace(/^\/+/, '').split('/')[0] || 'test');
    const host = parsed.hostname.toLowerCase();
    const port = parsed.port ? `:${parsed.port}` : '';
    return host ? `${host}${port}/${database}` : '';
  } catch {
    return '';
  }
}

/**
 * Mirrors runtime dotenv precedence:
 * - bot loads the project-root .env
 * - website loads the project-root .env first, then its own .env without override
 * - process environment values take precedence over both files
 */
export function effectiveEnvironments(projectRoot, runtimeEnv = process.env) {
  const rootEnv = parseEnvFile(path.join(projectRoot, '.env'));
  const websiteFileEnv = parseEnvFile(path.join(projectRoot, 'portfolio-website', '.env'));
  const botEnv = { ...rootEnv, ...runtimeEnv };
  const websiteEnv = { ...websiteFileEnv, ...rootEnv, ...runtimeEnv };
  return { rootEnv, websiteFileEnv, botEnv, websiteEnv };
}

export function resolveUploadPath(projectRoot, botEnv = {}, webEnv = {}) {
  const botPath = path.resolve(projectRoot, botEnv.PORTFOLIO_UPLOAD_DIR || 'uploads/portfolio');
  const websiteRoot = path.resolve(projectRoot, 'portfolio-website');
  const botDataRoot = path.resolve(websiteRoot, webEnv.BOT_DATA_ROOT || '..');
  const websitePath = path.resolve(botDataRoot, webEnv.PORTFOLIO_UPLOAD_DIR || botEnv.PORTFOLIO_UPLOAD_DIR || 'uploads/portfolio');
  return { botPath, websitePath, same: path.normalize(botPath).toLowerCase() === path.normalize(websitePath).toLowerCase() };
}

function readPackageDependencies(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')).dependencies || {}; }
  catch { return {}; }
}

function dependencyInstalled(projectRoot, packageName) {
  return [
    path.join(projectRoot, 'node_modules', packageName),
    path.join(projectRoot, 'portfolio-website', 'node_modules', packageName),
  ].some(candidate => fs.existsSync(candidate));
}

export function diagnose(projectRoot, runtimeEnv = process.env) {
  const { rootEnv, websiteFileEnv, botEnv, websiteEnv } = effectiveEnvironments(projectRoot, runtimeEnv);
  const checks = [];
  const add = (level, name, detail) => checks.push({ level, name, detail });

  if (!botEnv.MONGO_URI || !websiteEnv.MONGO_URI) {
    add('error', 'MongoDB URI', 'MONGO_URI wajib diisi pada .env utama agar bot dan website memakai konfigurasi yang sama.');
  } else {
    const botTarget = databaseTarget(botEnv.MONGO_URI);
    const websiteTarget = databaseTarget(websiteEnv.MONGO_URI);
    add(botTarget && botTarget === websiteTarget ? 'ok' : 'error', 'Database bersama',
      botTarget && websiteTarget ? `Bot=${botTarget}; Website=${websiteTarget}.` : 'Salah satu MONGO_URI tidak valid.');
  }

  const uploads = resolveUploadPath(projectRoot, botEnv, websiteEnv);
  add(uploads.same ? 'ok' : 'error', 'Folder media bersama',
    uploads.same ? `Kedua proses memakai ${uploads.botPath}.` : `Bot=${uploads.botPath}; Website=${uploads.websitePath}. Samakan PORTFOLIO_UPLOAD_DIR dan BOT_DATA_ROOT.`);

  if (websiteFileEnv.MONGO_URI && rootEnv.MONGO_URI && databaseTarget(websiteFileEnv.MONGO_URI) !== databaseTarget(rootEnv.MONGO_URI)) {
    add('warning', 'Website .env precedence', 'portfolio-website/.env berisi MONGO_URI berbeda, tetapi runtime memuat .env utama lebih dahulu tanpa override. Gunakan satu MONGO_URI di .env utama.');
  } else {
    add('ok', 'Environment bersama', 'Website memuat .env utama seperti bot; variabel environment proses tetap menjadi prioritas.');
  }

  const publicBase = String(websiteEnv.PORTFOLIO_PUBLIC_BASE_URL || '').trim();
  if (!publicBase) add('warning', 'URL publik', 'PORTFOLIO_PUBLIC_BASE_URL belum diatur; tautan verifikasi dan profil publik perlu domain yang benar.');
  else {
    try {
      const parsed = new URL(publicBase);
      add(parsed.protocol === 'https:' ? 'ok' : 'warning', 'URL publik',
        parsed.protocol === 'https:' ? `Domain publik HTTPS terkonfigurasi (${parsed.host}).` : 'Gunakan HTTPS untuk domain publik.');
    } catch { add('warning', 'URL publik', 'PORTFOLIO_PUBLIC_BASE_URL bukan URL yang valid.'); }
  }

  if (!websiteEnv.DASHBOARD_USER || !websiteEnv.DASHBOARD_PASSWORD || websiteEnv.DASHBOARD_PASSWORD.length < 16 || websiteEnv.DASHBOARD_PASSWORD.startsWith('replace-')) {
    add('warning', 'Owner dashboard credentials', 'Set DASHBOARD_USER dan password unik minimal 16 karakter. Nilai rahasia tidak ditampilkan.');
  } else add('ok', 'Owner dashboard credentials', 'Kredensial terisi; nilainya tidak ditampilkan.');

  if (!websiteEnv.SMTP_HOST || !websiteEnv.SMTP_USER || !websiteEnv.SMTP_PASSWORD || websiteEnv.SMTP_HOST.includes('example.com') || websiteEnv.SMTP_PASSWORD.startsWith('replace-')) {
    add('warning', 'SMTP', 'Email verification dan password recovery memerlukan SMTP aktif.');
  } else add('ok', 'SMTP', 'Konfigurasi SMTP terisi; kredensial tidak ditampilkan.');

  const botPackage = readPackageDependencies(path.join(projectRoot, 'package.json'));
  const websitePackage = readPackageDependencies(path.join(projectRoot, 'portfolio-website', 'package.json'));
  const requiredBot = ['@whiskeysockets/baileys', 'mongoose', 'dotenv', 'sharp'];
  const requiredWebsite = ['mongoose', 'dotenv', 'sharp', 'nodemailer'];
  const missingBot = requiredBot.filter(name => botPackage[name] && !dependencyInstalled(projectRoot, name));
  const missingWebsite = requiredWebsite.filter(name => websitePackage[name] && !dependencyInstalled(projectRoot, name));
  add(missingBot.length || missingWebsite.length ? 'warning' : 'ok', 'Dependency runtime',
    missingBot.length || missingWebsite.length
      ? `Belum ditemukan: ${[...new Set([...missingBot, ...missingWebsite])].join(', ')}. Jalankan npm ci di root dan npm run website:install jika dependency website belum tersedia.`
      : 'Dependency runtime utama bot dan website ditemukan.');

  if (botEnv.AUTH_DIR) add('ok', 'Baileys auth directory', `Folder sesi dikonfigurasi: ${path.resolve(projectRoot, botEnv.AUTH_DIR)} (jangan dibagikan).`);
  else add('warning', 'Baileys auth directory', 'AUTH_DIR belum diatur; periksa lokasi sesi WhatsApp sebelum deployment.');

  const gitignorePath = path.join(projectRoot, '.gitignore');
  const gitignore = fs.existsSync(gitignorePath) ? fs.readFileSync(gitignorePath, 'utf8') : '';
  const protectedPatterns = ['.env', 'auth_info_baileys/', 'backups/', 'temp/'];
  const unprotected = protectedPatterns.filter(pattern => !gitignore.includes(pattern));
  add(unprotected.length ? 'warning' : 'ok', 'Perlindungan file lokal',
    unprotected.length ? `Periksa .gitignore; pola berikut belum terlihat: ${unprotected.join(', ')}.` : 'Pola utama untuk file rahasia dan sementara tercantum di .gitignore.');

  return checks;
}

export function formatReport(checks) {
  const icon = { ok: 'OK', info: 'INFO', warning: 'PERLU CEK', error: 'GAGAL' };
  const errors = checks.filter(item => item.level === 'error').length;
  const warnings = checks.filter(item => item.level === 'warning').length;
  return [
    'PIR VISUALS WEBSITE ↔ WHATSAPP INTEGRATION DOCTOR',
    'MONGO_URI, password, token, dan kredensial tidak dicetak.',
    '',
    ...checks.map(item => `[${icon[item.level] || item.level}] ${item.name}: ${item.detail}`),
    '',
    `Summary: ${checks.length - errors - warnings} OK · ${warnings} warning · ${errors} error`,
  ].join('\n');
}

const invoked = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invoked) {
  const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const checks = diagnose(projectRoot);
  console.log(formatReport(checks));
  if (checks.some(item => item.level === 'error')) process.exitCode = 1;
}
