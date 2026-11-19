# Install & Update Guide — PIR Visuals v5.97.0

## Before updating

1. Stop the bot and website processes.
2. Back up the local MongoDB database and the portfolio media upload directory.
3. Keep `.env`, WhatsApp authentication/session files, local allowlists, and local configuration. Do not replace them with sample files.
4. Extract the v5.97.0 source over a clean project copy or merge the release files into the existing project. Do not delete your current data directories.

## Dependencies

From the project root:

```bash
npm ci
npm run website:install
```

The bot package is v5.97.0; the website package is v3.44.0.

## Configuration

No new required environment variable is introduced. The new `availabilityPublic` profile field defaults to `false`; each designer must explicitly opt in before dates appear on the public profile.

The optional project workspace still requires SMTP for client invitation email. Direct WhatsApp contact remains available independently of the workspace.

## Additive directory indexes

After dependencies are installed and MongoDB is running, create the two non-destructive directory sort indexes:

```bash
npm run db:ensure-directory-indexes
npm run verify:database
```

The script only creates missing indexes. It does not drop collections or remove existing indexes.

## Run checks

```bash
npm run check
npm run website:check
npm run audit:release
npm test
npm run website:test
```

## Start locally

```bash
npm run local:start
```

Website: `http://127.0.0.1:3010` (or the port configured in `.env`).

## Verify the release

1. Open `/discover`; check pagination, filter-preserving links, relevance, newest, and budget range overlap.
2. Test min budget and max budget independently and together; try min greater than max and confirm the warning.
3. Check the badge says “Profil ditinjau PIR” and the review disclosure distinguishes email verification from client/transaction verification.
4. In Designer Studio, leave public availability disabled and confirm no dates appear on the public profile.
5. Enable public availability, add a future date, and confirm only date/status appear publicly — never the internal note.
6. Open a public designer profile. Direct WhatsApp contact should remain the primary action; if the designer accepts inquiries, the optional workspace link should also appear.
7. Submit a test brief with a test email and confirm the private invitation flow. Confirm no payment, checkout, commission, or escrow features appear.
8. Verify bot `.design` and `.designer DSN-ID` still show only public profile/work and direct contact, with no brief or project-room command.

## Rollback

If a regression appears, stop both services and restore the pre-update source, MongoDB backup, and media backup as one coordinated rollback. Do not delete the new `availabilityPublic` field; it is additive and safe for the prior release to ignore.
