# Update PIR Visuals Bot to v6.1.0

## 1. Before updating

1. Back up the current project and MongoDB database using your normal secure backup process.
2. Do not copy `.env`, Baileys auth folders, database dumps, local allowlists, or runtime JSON files into a public/shareable release archive.
3. Keep your current `.env`, `auth_info_baileys/`, `config/allowed-chats.json`, `config/command-aliases.json`, `content/texts.json`, local bot settings, and other runtime data outside the source replacement.

## 2. Install source

From the project directory:

```bash
npm ci
```

If the website dependencies are deployed separately, do not reinstall or replace the website package for this bot-only release.

## 3. Ensure MongoDB indexes

Set `MONGO_URI` in your local `.env`, then run:

```bash
npm run db:ensure-directory-indexes
npm run verify:database
```

The index setup is additive. It creates:
- `designbriefsessions.chatJid_1_userJid_1` (unique compound index)
- `designbriefsessions.expiresAt_1` (TTL index)

The setup script also ensures the existing website/shared indexes. It does not drop existing indexes. Review the output before production.

## 4. Run automated checks

```bash
npm run check
npm test
npm run audit:release
```

Run the focused tests while diagnosing this release:

```bash
node --test tests/design-brief-wizard.test.js tests/antitoxic-moderation.test.js tests/group-moderation-access.test.js tests/onboarding.test.js
```

## 5. Staging acceptance

- Start the bot using a staging WhatsApp account and test group.
- Start `.wizard`, answer one question, restart the bot, then use `.wizard lanjut`.
- Verify `.wizard kembali`, `.wizard ulang`, `.wizard status`, and `.wizard batal`.
- Configure `.antitoxic` as a group Admin, verify it is OFF by default, then test whole-word matching with a harmless test token.
- Verify group Admins and the verified bot Owner are exempt, and the bot only deletes messages when the bot itself is a group Admin.
- Verify the third warning in 30 days prompts review but never auto-kicks/bans.
- Verify non-allowlisted chats remain blocked.

## 6. Preserve local menu text

`content/texts.json` is an installation-specific editable file and must not be overwritten by the release. The updated `content/texts.example.json` contains the `.antitoxic` menu entry. If your existing menu file should show it, merge that one line into the `menuGroup` text or use the Owner text editor after updating.

## 7. Rollback

If staging fails, stop the bot, restore the previous source package, and keep the MongoDB collection/indexes in place. The new `designbriefsessions` collection and indexes are additive; old source versions can ignore them. Do not delete or overwrite existing user/group collections during rollback.

## 8. Privacy and release packaging

Brief drafts can contain client project details and expire after 24 hours. Users can delete them with `.wizard batal`. For confidential briefs, use private chat rather than a group. Never include passwords, OTPs, or other secrets.

Release archives must exclude `.env`, `creds.json`, `auth_info/`, `auth_info_baileys/`, `.git/`, `node_modules/`, backups, uploads, local allowlists, and runtime JSON data. Run `npm run audit:release` before sharing.
