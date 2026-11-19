import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const mongoUri = String(process.env.MONGO_URI || '').trim();
if (!mongoUri) {
  console.error('[SHARED INDEXES] MONGO_URI belum diatur pada .env.');
  process.exitCode = 1;
} else {
  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
    const collection = mongoose.connection.db.collection('designerprofiles');
    const indexes = [
      {
        key: { designerId: 1 },
        name: 'designerId_1',
        unique: true,
      },
      {
        key: { ownerJid: 1 },
        name: 'ownerJid_1',
        unique: true,
      },
      {
        key: { isPublic: 1, createdAt: -1, displayName: 1 },
        name: 'isPublic_1_createdAt_-1_displayName_1',
      },
      {
        key: { isPublic: 1, priceMin: 1, displayName: 1 },
        name: 'isPublic_1_priceMin_1_displayName_1',
      },
    ];
    for (const index of indexes) {
      await collection.createIndex(index.key, { name: index.name, ...(index.unique ? { unique: true } : {}) });
      console.log(`[SHARED INDEXES] OK designerprofiles.${index.name}`);
    }
    await mongoose.connection.db.collection('portfolioitems').createIndex(
      { itemId: 1, moderationStatus: 1 },
      { name: 'itemId_1_moderationStatus_1', unique: true, sparse: true },
    );
    console.log('[SHARED INDEXES] OK portfolioitems.itemId_1_moderationStatus_1');
    const notificationCollection = mongoose.connection.db.collection('designernotifications');
    const notificationIndexes = [
      { key: { notificationId: 1 }, name: 'notificationId_1', unique: true },
      { key: { designerId: 1, readAt: 1, createdAt: -1 }, name: 'designerId_1_readAt_1_createdAt_-1' },
      { key: { whatsappDeliveryStatus: 1, whatsappNextAttemptAt: 1, createdAt: 1 }, name: 'whatsappDeliveryStatus_1_whatsappNextAttemptAt_1_createdAt_1' },
    ];
    for (const index of notificationIndexes) {
      await notificationCollection.createIndex(index.key, { name: index.name, ...(index.unique ? { unique: true } : {}) });
      console.log(`[SHARED INDEXES] OK designernotifications.${index.name}`);
    }
    const briefSessions = mongoose.connection.db.collection('designbriefsessions');
    await briefSessions.createIndex(
      { chatJid: 1, userJid: 1 },
      { name: 'chatJid_1_userJid_1', unique: true },
    );
    await briefSessions.createIndex(
      { expiresAt: 1 },
      { name: 'expiresAt_1', expireAfterSeconds: 0 },
    );
    console.log('[BOT INDEXES] OK designbriefsessions.chatJid_1_userJid_1');
    console.log('[BOT INDEXES] OK designbriefsessions.expiresAt_1 (TTL)');

    const designBattles = mongoose.connection.db.collection('designbattles');
    await designBattles.createIndex({ code: 1 }, { name: 'code_1', unique: true });
    await designBattles.createIndex({ groupJid: 1 }, { name: 'groupJid_1_open_unique', unique: true, partialFilterExpression: { status: 'open' } });
    await designBattles.createIndex({ groupJid: 1, status: 1, endsAt: 1 }, { name: 'groupJid_1_status_1_endsAt_1' });
    console.log('[BOT INDEXES] OK designbattles.code_1 (unique)');
    console.log('[BOT INDEXES] OK designbattles.groupJid_1_open_unique (one open battle per group)');
    console.log('[BOT INDEXES] OK designbattles.groupJid_1_status_1_endsAt_1');

    const designSeasons = mongoose.connection.db.collection('designseasons');
    await designSeasons.createIndex({ code: 1 }, { name: 'code_1', unique: true });
    await designSeasons.createIndex({ groupJid: 1 }, { name: 'groupJid_1_active_unique', unique: true, partialFilterExpression: { status: 'active' } });
    await designSeasons.createIndex({ groupJid: 1, status: 1, createdAt: -1 }, { name: 'groupJid_1_status_1_createdAt_-1' });
    console.log('[BOT INDEXES] OK designseasons unique code, one active season per group, and group/status listing');

    const designSeasonSubmissions = mongoose.connection.db.collection('designseasonsubmissions');
    await designSeasonSubmissions.createIndex({ code: 1 }, { name: 'code_1', unique: true });
    await designSeasonSubmissions.createIndex({ groupJid: 1, seasonCode: 1, roundCode: 1, userJid: 1 }, { name: 'groupJid_1_seasonCode_1_roundCode_1_userJid_1', unique: true });
    await designSeasonSubmissions.createIndex({ groupJid: 1, seasonCode: 1, roundCode: 1, status: 1, updatedAt: -1 }, { name: 'groupJid_1_seasonCode_1_roundCode_1_status_1_updatedAt_-1' });
    console.log('[BOT INDEXES] OK designseasonsubmissions unique entry and group/round gallery indexes');

    const creativeAssets = mongoose.connection.db.collection('creativeassets');
    await creativeAssets.createIndex({ groupJid: 1, code: 1 }, { name: 'groupJid_1_code_1', unique: true });
    await creativeAssets.createIndex({ groupJid: 1, visibility: 1, status: 1, category: 1, updatedAt: -1 }, { name: 'groupJid_1_visibility_1_status_1_category_1_updatedAt_-1' });
    await creativeAssets.createIndex({ groupJid: 1, ownerJid: 1, status: 1, updatedAt: -1 }, { name: 'groupJid_1_ownerJid_1_status_1_updatedAt_-1' });
    console.log('[BOT INDEXES] OK creativeassets group-scoped ownership, visibility, and category indexes');

    const learningCohorts = mongoose.connection.db.collection('learningcohorts');
    await learningCohorts.createIndex({ code: 1 }, { name: 'code_1', unique: true });
    await learningCohorts.createIndex({ groupJid: 1, code: 1 }, { name: 'groupJid_1_code_1', unique: true });
    await learningCohorts.createIndex({ groupJid: 1, status: 1, createdAt: -1 }, { name: 'groupJid_1_status_1_createdAt_-1' });
    console.log('[BOT INDEXES] OK learningcohorts.code_1 (unique)');
    console.log('[BOT INDEXES] OK learningcohorts.groupJid_1_code_1 (unique)');
    console.log('[BOT INDEXES] OK learningcohorts.groupJid_1_status_1_createdAt_-1');

    const learningCohortCheckins = mongoose.connection.db.collection('learningcohortcheckins');
    await learningCohortCheckins.createIndex({ code: 1 }, { name: 'code_1', unique: true });
    await learningCohortCheckins.createIndex(
      { groupJid: 1, cohortCode: 1, milestoneCode: 1, userJid: 1 },
      { name: 'groupJid_1_cohortCode_1_milestoneCode_1_userJid_1', unique: true },
    );
    await learningCohortCheckins.createIndex(
      { groupJid: 1, cohortCode: 1, status: 1, updatedAt: -1 },
      { name: 'groupJid_1_cohortCode_1_status_1_updatedAt_-1' },
    );
    console.log('[BOT INDEXES] OK learningcohortcheckins unique membership and review indexes');
    console.log('[SHARED INDEXES] Selesai. Index lama tidak dihapus atau diubah.');
  } catch (error) {
    console.error(`[SHARED INDEXES] Gagal: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}
