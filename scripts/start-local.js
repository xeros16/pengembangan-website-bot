import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envFile = path.join(projectRoot, '.env');

if (!fs.existsSync(envFile)) {
  console.error('[LOCAL] File .env belum ada.');
  console.error('[LOCAL] Salin .env.example menjadi .env, isi OWNER_JIDS dan password dashboard, lalu jalankan ulang.');
  process.exit(1);
}

const services = [
  { name: 'BOT', script: 'index.js' },
  { name: 'WEBSITE', script: path.join('portfolio-website', 'server.js') },
];

const children = [];
let stopping = false;

function stopAll(signal = 'SIGTERM') {
  if (stopping) return;
  stopping = true;
  console.log(`\n[LOCAL] Menghentikan layanan (${signal})...`);
  for (const child of children) {
    if (!child.killed) child.kill(signal);
  }
}

for (const service of services) {
  const child = spawn(process.execPath, [service.script], {
    cwd: projectRoot,
    env: process.env,
    stdio: 'inherit',
    windowsHide: false,
  });
  children.push(child);
  child.on('error', error => {
    console.error(`[${service.name}] Gagal dijalankan: ${error.message}`);
    stopAll();
    process.exitCode = 1;
  });
  child.on('exit', (code, signal) => {
    console.log(`[${service.name}] Berhenti (code=${code}, signal=${signal || 'none'}).`);
    if (!stopping && code !== 0 && code !== null) {
      console.error(`[LOCAL] ${service.name} berhenti dengan error; layanan lain ikut dihentikan.`);
      process.exitCode = code;
      stopAll();
    }
    if (children.length === services.length && children.every(item => item.exitCode !== null)) {
      process.exitCode ??= 0;
    }
  });
}

console.log('[LOCAL] Bot dan website dijalankan pada komputer ini.');
console.log('[LOCAL] Website: http://127.0.0.1:3010');
console.log('[LOCAL] Bot health: http://127.0.0.1:3091/ready');
console.log('[LOCAL] Tekan Ctrl+C untuk menghentikan keduanya.');

process.on('SIGINT', () => stopAll('SIGINT'));
process.on('SIGTERM', () => stopAll('SIGTERM'));
