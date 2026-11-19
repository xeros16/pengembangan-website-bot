import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseEnvFile } from './integration-doctor.js';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function resolveMongoUri(runtimeEnv = process.env, root = projectRoot) {
  const rootEnv = parseEnvFile(path.join(root, '.env'));
  return String(runtimeEnv.MONGO_URI || rootEnv.MONGO_URI || '').trim();
}

export function safeDatabaseLabel(uri) {
  try {
    const parsed = new URL(uri);
    const database = decodeURIComponent(parsed.pathname.replace(/^\/+/, '').split('/')[0] || 'test');
    return `${parsed.hostname}${parsed.port ? `:${parsed.port}` : ''}/${database}`;
  } catch {
    return 'URI tidak valid';
  }
}

export async function verifySharedDatabase({
  mongoUri = resolveMongoUri(),
  loadMongoose = () => import('mongoose'),
  log = console,
} = {}) {
  if (!mongoUri) {
    log.error('[DB VERIFY] MONGO_URI belum diatur pada .env utama.');
    return 1;
  }

  let mongoose;
  try {
    const imported = await loadMongoose();
    mongoose = imported.default || imported;
  } catch {
    log.error('[DB VERIFY] Dependency mongoose belum terpasang. Jalankan npm ci terlebih dahulu.');
    return 1;
  }

  const requiredIndexes = {
    designerprofiles: ['designerId_1', 'ownerJid_1', 'isPublic_1_createdAt_-1_displayName_1', 'isPublic_1_priceMin_1_displayName_1'],
    portfolioitems: ['itemId_1_moderationStatus_1'],
    designernotifications: ['notificationId_1', 'designerId_1_readAt_1_createdAt_-1', 'whatsappDeliveryStatus_1_whatsappNextAttemptAt_1_createdAt_1'],
    designbriefsessions: ['chatJid_1_userJid_1', 'expiresAt_1'],
    designbattles: ['code_1', 'groupJid_1_open_unique', 'groupJid_1_status_1_endsAt_1'],
    designseasons: ['code_1', 'groupJid_1_active_unique', 'groupJid_1_status_1_createdAt_-1'],
    designseasonsubmissions: ['code_1', 'groupJid_1_seasonCode_1_roundCode_1_userJid_1', 'groupJid_1_seasonCode_1_roundCode_1_status_1_updatedAt_-1'],
    creativeassets: ['groupJid_1_code_1', 'groupJid_1_visibility_1_status_1_category_1_updatedAt_-1', 'groupJid_1_ownerJid_1_status_1_updatedAt_-1'],
    learningcohorts: ['code_1', 'groupJid_1_code_1', 'groupJid_1_status_1_createdAt_-1'],
    learningcohortcheckins: ['code_1', 'groupJid_1_cohortCode_1_milestoneCode_1_userJid_1', 'groupJid_1_cohortCode_1_status_1_updatedAt_-1'],
  };

  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
    const db = mongoose.connection.db;
    log.log(`[DB VERIFY] Connected: ${safeDatabaseLabel(mongoUri)}`);

    const collectionRows = await db.listCollections({}, { nameOnly: true }).toArray();
    const existing = new Set(collectionRows.map(row => row.name));
    const names = [
      'designerprofiles', 'portfolioitems', 'designeranalytics',
      'designernotifications', 'designerdashboardauth', 'designersignuprequests',
      'designservices', 'portfoliocollections', 'designertestimonials',
      'designerleads', 'designeravailability', 'clientprojects',
      'communityprofiles', 'communitycollaborations', 'learningsubmissions',
      'tickets', 'reports', 'designbriefsessions', 'designbattles', 'designseasons', 'designseasonsubmissions', 'creativeassets', 'learningcohorts', 'learningcohortcheckins',
    ];

    let missingIndexes = 0;
    for (const name of names) {
      if (!existing.has(name)) {
        log.log(`[INFO] ${name}: collection belum dibuat (normal bila fitur belum pernah dipakai).`);
        continue;
      }
      const collection = db.collection(name);
      const count = await collection.estimatedDocumentCount();
      log.log(`[OK] ${name}: ${count.toLocaleString('id-ID')} dokumen`);
      const required = requiredIndexes[name] || [];
      if (required.length) {
        const indexes = await collection.listIndexes().toArray();
        for (const indexName of required) {
          if (!indexes.some(index => index.name === indexName)) {
            missingIndexes += 1;
            log.log(`[WARN] ${name}: index ${indexName} belum ditemukan. Periksa autoIndex/migrasi index sebelum production.`);
          }
        }
      }
    }

    if (missingIndexes) {
      log.error(`[DB VERIFY] ${missingIndexes} index wajib belum tersedia.`);
      return 1;
    }

    log.log('[DB VERIFY] Pemeriksaan collection dan index selesai.');
    return 0;
  } catch (error) {
    log.error(`[DB VERIFY] Gagal: ${error?.name === 'MongoServerSelectionError' ? 'MongoDB tidak dapat dijangkau.' : 'Pemeriksaan database gagal.'}`);
    return 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) {
  process.exitCode = await verifySharedDatabase();
}
