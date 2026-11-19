import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const forbiddenNames = new Set(['.env', 'creds.json', 'data.json']);
const forbiddenDirs = new Set(['.git', 'node_modules', 'auth_info', 'auth_info_baileys', 'backups', 'temp', 'uploads']);
const problems = [];
const allowedEnvExample = '.env.example';

function walk(relative = '.') {
  const absolute = path.join(root, relative);
  if (!fs.existsSync(absolute)) return;
  for (const entry of fs.readdirSync(absolute, { withFileTypes: true })) {
    const rel = path.posix.join(relative.replaceAll(path.sep, '/'), entry.name).replace(/^\.\//, '');
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules') continue; // Instalasi lokal; pengemas rilis tetap mengecualikannya.
      if (forbiddenDirs.has(entry.name)) problems.push(`Direktori tidak boleh masuk rilis: ${rel}/`);
      else walk(rel);
    } else {
      if (forbiddenNames.has(entry.name) && rel !== allowedEnvExample) problems.push(`File berpotensi sensitif/lokal: ${rel}`);
      if ([
        'data/bot-subscriptions.json',
        'data/pinsearch-history.json',
        'config/allowed-chats.json',
        'config/allowed-chats.json.bak',
        'config/command-aliases.json',
        'config/bot-settings.json',
        'content/texts.json',
      ].includes(rel)) problems.push(`Data runtime/identitas lokal tidak boleh masuk rilis: ${rel}`);
      if (/^(temp|uploads\/portfolio)\//.test(rel) && !entry.name.endsWith('.gitkeep')) problems.push(`File lokal/unggahan tidak boleh masuk rilis: ${rel}`);
      if (/\.(mp4|mov|mkv|webm|zip|rar)$/i.test(entry.name) && !rel.startsWith('assets/')) problems.push(`File sementara/arsip tak terduga: ${rel}`);
    }
  }
}

walk();
if (problems.length) {
  console.error('Audit rilis gagal:');
  for (const problem of problems) console.error(`- ${problem}`);
  process.exitCode = 1;
} else {
  console.log('Audit rilis lulus: tidak ditemukan .env, sesi autentikasi, backup, data langganan, atau file sementara yang dilarang. Folder node_modules lokal diabaikan dan tetap harus dikecualikan dari ZIP.');
}
