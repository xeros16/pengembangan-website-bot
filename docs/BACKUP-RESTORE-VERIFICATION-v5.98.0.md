# Backup & Restore Verification — PIR Visuals v5.98.0

Run from the project root on the local machine after MongoDB and dependencies are available. For this local consistency drill, stop the bot and website first so no writes/uploads occur while the dump and media copy are made.

```bash
npm run backup:verify
```

The command:
1. Connects to the database named by `MONGO_URI`.
2. Creates a compressed `mongodump` archive in a new private backup folder.
3. Copies the portfolio media directory (if it exists) and verifies SHA-256 hashes.
4. Restores the archive into a newly generated database named `pir_restore_check_*`.
5. Compares collection document counts between source and restored databases.
6. Removes only the uniquely generated restore-check database after successful verification.

To keep the isolated restore database for manual inspection:

```bash
npm run backup:verify -- --keep-restore-db
```

Requirements:
- `mongodump` and `mongorestore` from MongoDB Database Tools must be on PATH.
- `MONGO_URI` must point to the PIR Visuals application database.
- The MongoDB user must have read/restore/drop privileges on the generated `pir_restore_check_*` database.
- Ensure enough free disk space for the compressed database archive, media copy, and temporary restored database.

Safety:
- The restore target is always a unique database name, never the source database.
- The script does not use `--drop`.
- The script never restores over the active database.
- `.env` and WhatsApp auth/session credentials are not copied.
- Database and media backups contain private user/project data. Keep the backup folder access-restricted and encrypted at rest.
- This drill verifies a database restore and media copy integrity. It does not verify a full machine disaster-recovery procedure, point-in-time replica-set backup, or WhatsApp session restoration. For online production backup, design a separate replica-set/oplog procedure.
