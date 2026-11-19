import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(ROOT, '.env') });
const execFileAsync = promisify(execFile);
const MONGO_URI = String(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/pir_visuals_local');
const BACKUP_DIR = path.resolve(ROOT, process.env.BACKUP_DIR || 'backups');
const BOT_DATA_ROOT = path.resolve(ROOT, process.env.BOT_DATA_ROOT || '.');
const MEDIA_SOURCE = path.resolve(BOT_DATA_ROOT, process.env.PORTFOLIO_UPLOAD_DIR || 'portfolio_uploads');
const KEEP_RESTORE_DB = process.argv.includes('--keep-restore-db');

async function runTool(command, args) {
  try {
    const result = await execFileAsync(command, args, {
      cwd: ROOT,
      timeout: 15 * 60 * 1000,
      windowsHide: true,
      maxBuffer: 16 * 1024 * 1024,
    });
    return result;
  } catch (error) {
    const detail = String(error.stderr || error.message || 'Unknown tool error')
      .replace(/[\u0000-\u001f\u007f]/g, ' ')
      .slice(0, 1000);
    throw new Error(`${command} gagal: ${detail}`);
  }
}

async function copyDirectorySafe(source, destination) {
  await fs.promises.mkdir(destination, { recursive: true, mode: 0o700 });
  for (const entry of await fs.promises.readdir(source, { withFileTypes: true })) {
    const from = path.join(source, entry.name);
    const to = path.join(destination, entry.name);
    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) await copyDirectorySafe(from, to);
    else if (entry.isFile()) await fs.promises.copyFile(from, to, fs.constants.COPYFILE_EXCL);
  }
}

async function directoryManifest(directory) {
  const files = [];
  async function walk(current) {
    for (const entry of await fs.promises.readdir(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) await walk(full);
      else if (entry.isFile()) {
        const digest = crypto.createHash('sha256');
        const buffer = await fs.promises.readFile(full);
        digest.update(buffer);
        files.push({
          path: path.relative(directory, full).split(path.sep).join('/'),
          size: buffer.length,
          sha256: digest.digest('hex'),
        });
      }
    }
  }
  await walk(directory);
  return files.sort((a, b) => a.path.localeCompare(b.path));
}

async function collectionCounts(connection) {
  const collections = await connection.db.listCollections({}, { nameOnly: true }).toArray();
  const output = {};
  for (const entry of collections.filter(item => !item.name.startsWith('system.'))) {
    output[entry.name] = await connection.db.collection(entry.name).countDocuments({});
  }
  return Object.fromEntries(Object.entries(output).sort(([a], [b]) => a.localeCompare(b)));
}

function sameJson(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

async function main() {
  let sourceConnection;
  let restoreConnection;
  let restoreDbName = '';
  let restoreVerified = false;
  const startedAt = new Date();
  const stamp = startedAt.toISOString().replace(/[:.]/g, '-');
  const outputDir = path.join(BACKUP_DIR, `verified-${stamp}-${crypto.randomBytes(3).toString('hex')}`);
  const archivePath = path.join(outputDir, 'database.archive.gz');

  try {
    await fs.promises.mkdir(outputDir, { recursive: true, mode: 0o700 });
    await fs.promises.chmod(BACKUP_DIR, 0o700).catch(() => {});
    await fs.promises.chmod(outputDir, 0o700).catch(() => {});

    sourceConnection = await mongoose.createConnection(MONGO_URI, {
      serverSelectionTimeoutMS: 10_000,
      appName: 'PIR-Visuals-Backup-Verification',
    }).asPromise();
    const sourceDbName = sourceConnection.name;
    if (!sourceDbName || sourceDbName.startsWith('admin') || sourceDbName.startsWith('local') || sourceDbName.startsWith('config')) {
      throw new Error('MONGO_URI harus menunjuk database aplikasi PIR Visuals, bukan database sistem.');
    }

    const beforeCounts = await collectionCounts(sourceConnection);
    console.log(`[BACKUP] Database terhubung. Koleksi aplikasi: ${Object.keys(beforeCounts).length}.`);

    await runTool('mongodump', [`--uri=${MONGO_URI}`, `--archive=${archivePath}`, '--gzip']);
    const archiveStat = await fs.promises.stat(archivePath);
    if (!archiveStat.size) throw new Error('Arsip mongodump kosong.');
    await fs.promises.chmod(archivePath, 0o600).catch(() => {});

    let mediaFiles = [];
    let mediaIncluded = false;
    try {
      const mediaStat = await fs.promises.stat(MEDIA_SOURCE);
      if (mediaStat.isDirectory()) {
        const mediaBackup = path.join(outputDir, 'portfolio-media');
        await copyDirectorySafe(MEDIA_SOURCE, mediaBackup);
        mediaFiles = await directoryManifest(mediaBackup);
        mediaIncluded = true;
      }
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }

    const mediaRestoreCheck = path.join(outputDir, '.media-restore-check');
    if (mediaIncluded) {
      await copyDirectorySafe(path.join(outputDir, 'portfolio-media'), mediaRestoreCheck);
      const restoredMediaFiles = await directoryManifest(mediaRestoreCheck);
      if (!sameJson(mediaFiles, restoredMediaFiles)) throw new Error('Verifikasi salinan media gagal: hash file tidak cocok.');
      await fs.promises.rm(mediaRestoreCheck, { recursive: true, force: true });
    }

    restoreDbName = `pir_restore_check_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    if (restoreDbName === sourceDbName) throw new Error('Database tujuan restore harus berbeda dari database sumber.');

    await runTool('mongorestore', [
      `--uri=${MONGO_URI}`,
      `--archive=${archivePath}`,
      '--gzip',
      `--nsFrom=${sourceDbName}.*`,
      `--nsTo=${restoreDbName}.*`,
    ]);

    restoreConnection = await mongoose.createConnection(MONGO_URI, {
      dbName: restoreDbName,
      serverSelectionTimeoutMS: 10_000,
      appName: 'PIR-Visuals-Restore-Verification',
    }).asPromise();
    const afterCounts = await collectionCounts(restoreConnection);
    if (!sameJson(beforeCounts, afterCounts)) {
      throw new Error(`Jumlah dokumen hasil restore berbeda. Sumber=${JSON.stringify(beforeCounts)}; Restore=${JSON.stringify(afterCounts)}`);
    }
    restoreVerified = true;

    const manifest = {
      formatVersion: 1,
      createdAt: startedAt.toISOString(),
      sourceDatabase: sourceDbName,
      restoreDatabase: restoreDbName,
      restoreVerified,
      restoreDatabaseRetained: KEEP_RESTORE_DB,
      databaseArchive: 'database.archive.gz',
      databaseArchiveBytes: archiveStat.size,
      collectionDocumentCounts: beforeCounts,
      mediaIncluded,
      mediaFileCount: mediaFiles.length,
      mediaFiles,
      note: 'Backup includes application database and portfolio media only. WhatsApp auth/session and .env secrets are intentionally excluded.',
    };
    const manifestPath = path.join(outputDir, 'backup-verification.json');
    await fs.promises.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, { flag: 'wx', mode: 0o600 });

    if (!KEEP_RESTORE_DB && restoreConnection) {
      await restoreConnection.dropDatabase();
      await restoreConnection.close();
      restoreConnection = null;
    }

    console.log('\n[BACKUP & RESTORE] VERIFIKASI BERHASIL');
    console.log(`Lokasi backup: ${outputDir}`);
    console.log(`Database sumber: ${sourceDbName}`);
    console.log(`Database restore terverifikasi: ${restoreDbName}`);
    console.log(`Koleksi diverifikasi: ${Object.keys(beforeCounts).length}`);
    console.log(`File media diverifikasi: ${mediaFiles.length}`);
    console.log(`Database restore ${KEEP_RESTORE_DB ? 'dipertahankan untuk inspeksi' : 'dibersihkan setelah verifikasi'}.`);
    console.log('Simpan backup di media terenkripsi dan jangan unggah ke chat.');
  } catch (error) {
    console.error('\n[BACKUP & RESTORE] VERIFIKASI GAGAL:', error.message);
    if (restoreDbName) console.error(`[BACKUP & RESTORE] Database restore untuk inspeksi jika terbentuk: ${restoreDbName}`);
    console.error(`[BACKUP & RESTORE] Artefak yang sudah dibuat (jika ada): ${outputDir}`);
    process.exitCode = 1;
  } finally {
    if (restoreConnection) await restoreConnection.close().catch(() => {});
    if (sourceConnection) await sourceConnection.close().catch(() => {});
    await mongoose.disconnect().catch(() => {});
  }
}

main();
