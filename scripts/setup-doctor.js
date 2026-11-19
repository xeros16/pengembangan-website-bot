import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

function parseEnvFile(file) {
  const values = {};
  if (!fs.existsSync(file)) return values;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const index = trimmed.indexOf('=');
    if (index < 1) continue;
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    values[key] = value;
  }
  return values;
}

function hasCommand(command, platform = process.platform) {
  const lookup = platform === 'win32' ? 'where' : 'which';
  const result = spawnSync(lookup, [command], { stdio: 'ignore', windowsHide: true });
  return result.status === 0;
}

export function evaluateSetup({ rootDir = process.cwd(), env = process.env, nodeVersion = process.versions.node, commandAvailable = hasCommand } = {}) {
  const envPath = path.join(rootDir, '.env');
  const fileEnv = parseEnvFile(envPath);
  const effective = { ...fileEnv, ...env };
  const checks = [];
  const add = (level, title, detail) => checks.push({ level, title, detail });
  const major = Number(String(nodeVersion).split('.')[0]);

  add(major >= 20 ? 'ok' : 'warn', 'Versi Node.js', major >= 20 ? `Node.js ${nodeVersion} terdeteksi.` : `Node.js ${nodeVersion} terdeteksi. Disarankan Node.js 20 LTS atau lebih baru.`);
  add(fs.existsSync(envPath) ? 'ok' : 'warn', 'Konfigurasi .env', fs.existsSync(envPath) ? 'File .env ditemukan; nilai rahasia tidak ditampilkan.' : 'File .env belum ada. Salin .env.example menjadi .env dan isi konfigurasi yang diperlukan.');
  add(String(effective.OWNER_JIDS || '').trim() ? 'ok' : 'warn', 'Owner bot', String(effective.OWNER_JIDS || '').trim() ? 'OWNER_JIDS terisi; isi nilainya tidak ditampilkan.' : 'OWNER_JIDS belum diatur. Perintah Owner dan pengelolaan langganan akan ditolak.');
  add(String(effective.MONGO_URI || '').trim() ? 'ok' : 'warn', 'MongoDB', String(effective.MONGO_URI || '').trim() ? 'MONGO_URI terkonfigurasi; alamat dan kredensial tidak ditampilkan.' : 'MONGO_URI tidak diatur; bot akan mencoba alamat lokal default. Pastikan MongoDB berjalan.');

  const packagePath = path.join(rootDir, 'package.json');
  let dependencies = {};
  try { dependencies = JSON.parse(fs.readFileSync(packagePath, 'utf8')).dependencies || {}; } catch {}
  const required = ['@whiskeysockets/baileys', 'mongoose', 'dotenv', 'sharp'];
  const missing = required.filter(name => dependencies[name] && !fs.existsSync(path.join(rootDir, 'node_modules', name)));
  add(missing.length ? 'warn' : 'ok', 'Dependensi Node.js', missing.length ? `Dependensi belum ditemukan: ${missing.join(', ')}. Jalankan npm install.` : 'Dependensi utama terpasang atau tidak ada daftar dependensi yang perlu diperiksa.');

  const authDir = path.resolve(rootDir, effective.AUTH_DIR || 'auth_info_baileys');
  add(fs.existsSync(authDir) ? 'ok' : 'info', 'Sesi WhatsApp', fs.existsSync(authDir) ? 'Folder autentikasi yang dikonfigurasi ditemukan. Jangan bagikan folder ini.' : 'Folder sesi belum ada; biasanya akan dibuat saat bot pertama kali menautkan WhatsApp.');

  const gitignorePath = path.join(rootDir, '.gitignore');
  const gitignore = fs.existsSync(gitignorePath) ? fs.readFileSync(gitignorePath, 'utf8') : '';
  const protectedPatterns = ['.env', 'auth_info_baileys/', 'backups/', 'temp/'];
  const unprotected = protectedPatterns.filter(pattern => !gitignore.includes(pattern));
  add(unprotected.length ? 'warn' : 'ok', 'Perlindungan file lokal', unprotected.length ? `Periksa .gitignore; pola berikut belum terlihat: ${unprotected.join(', ')}.` : 'Pola utama untuk file rahasia dan sementara tercantum di .gitignore.');

  const ytDlp = commandAvailable('yt-dlp');
  const ffmpeg = commandAvailable('ffmpeg');
  add(ytDlp && ffmpeg ? 'ok' : 'info', 'Unduh media (opsional)', ytDlp && ffmpeg ? 'yt-dlp dan FFmpeg ditemukan.' : `Kebutuhan fitur media dan Voice Lab: ${!ytDlp ? 'yt-dlp belum ditemukan' : ''}${!ytDlp && !ffmpeg ? '; ' : ''}${!ffmpeg ? 'FFmpeg belum ditemukan' : ''}. Fitur lain tetap dapat digunakan.`);

  return { checks, hasWarnings: checks.some(item => item.level === 'warn'), hasErrors: checks.some(item => item.level === 'error') };
}

export function formatReport(report) {
  const icon = { ok: 'OK', info: 'INFO', warn: 'PERLU CEK', error: 'GAGAL' };
  return [
    'PIR VISUALS BOT — PEMERIKSAAN SETUP',
    'Nilai .env, token, dan kredensial tidak dicetak.',
    '',
    ...report.checks.map(item => `[${icon[item.level] || item.level}] ${item.title}: ${item.detail}`),
    '',
    report.hasErrors ? 'Ada masalah yang perlu diperbaiki sebelum bot dijalankan.' : report.hasWarnings ? 'Pemeriksaan selesai dengan beberapa hal yang perlu diperhatikan.' : 'Pemeriksaan selesai.'
  ].join('\n');
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === currentFile) {
  const report = evaluateSetup();
  console.log(formatReport(report));
  if (report.hasErrors) process.exitCode = 1;
}
