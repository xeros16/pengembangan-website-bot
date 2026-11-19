# PIR Visuals Bot v5.93.0 — Install & Update

## Before deployment

1. Stop the bot cleanly.
2. Back up the MongoDB database and current project folder.
3. Preserve `.env`, WhatsApp auth/session folders, local uploads, backups, allowlists, and local configuration.
4. Download BOTH `PIR-Visuals-v5.93.0-Community-Hub-Part-1.zip` and `PIR-Visuals-v5.93.0-Community-Hub-Part-2.zip`; extract them into the SAME destination folder, then use that complete source directory for staging/deployment.
5. Run `npm ci` from the project root.
6. Run `npm run check`, `npm test`, `npm run website:check`, `npm run website:test`, and `npm run audit:release`.
7. Complete the Community Hub smoke tests before production rollout.

No new environment variables are required. Website runtime and website package version are unchanged.

## Database changes

v5.93.0 adds two collections; it does not rewrite the User learning progress or LearningSubmission collection.

### CommunityProfile

Indexes:

```javascript
db.communityprofiles.createIndex({ groupJid: 1, userJid: 1 }, { unique: true });
db.communityprofiles.createIndex({
  groupJid: 1, visible: 1, mentorOptIn: 1, mentorTopics: 1, updatedAt: -1
});
```

### CommunityCollaboration

Indexes:

```javascript
db.communitycollaborations.createIndex({ code: 1 }, { unique: true });
db.communitycollaborations.createIndex({ groupJid: 1, status: 1, createdAt: -1 });
db.communitycollaborations.createIndex({ groupJid: 1, ownerJid: 1, status: 1 });
```

If Mongoose automatic index creation is disabled, create these indexes after verifying the new collections contain no conflicting data. Do not drop or rewrite existing collections.

## Community Hub commands

```text
.designcommunity help
.designcommunity mentor branding,uiux
.designcommunity belajar poster,tipografi
.designcommunity cari branding
.designcommunity cari belajar poster
.designcommunity badges
.designcommunity off
.designcommunity hapus
.designcommunity collab buat Judul | brief proyek yang jelas minimal 15 karakter | poster,ilustrasi | 3
.designcommunity collab list
.designcommunity collab join KODE
.designcommunity collab leave KODE
.designcommunity collab tutup KODE
```

All profile/search/milestone/collaboration operations require a group chat and MongoDB; the read-only help command remains available in private chat and while MongoDB is offline. Mentor and learner discovery is opt-in and limited to the current group. Project capacity is 2–5 people including the owner; each owner can have at most three open projects per group.

## Staging smoke tests

1. Register a mentor in group A; verify search in A and isolation from group B.
2. Register as a learner; inspect own profile; update intro; opt out; confirm no longer discoverable.
3. Delete the profile and verify deletion is scoped to the current group.
4. Verify achievement counts from seeded learning/challenge/collaboration data.
5. Create a capacity-two project; verify the owner occupies one slot.
6. Join from one account; reject duplicate and self-join.
7. Attempt a cross-group join and verify it is rejected.
8. Fill the final slot; reject further joins.
9. Verify owner can close; ordinary members cannot; group Admin can.
10. Verify no output exposes JID/phone values.
11. Verify operations fail closed while MongoDB is disconnected.

## Rollback

Stop the bot and restore the previous source plus pre-update database backup if staging fails. The two new collections are additive; do not drop historical portfolio, learning, challenge, or marketplace collections. Keep the existing public Designer Portfolio Directory data intact.
