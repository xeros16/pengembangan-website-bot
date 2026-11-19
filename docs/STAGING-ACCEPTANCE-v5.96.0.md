# Staging Acceptance Checklist — PIR Visuals v5.96.0

Use fresh test accounts and a non-production WhatsApp group. Do not run restore or destructive tests against production.

## A. New member onboarding
- [ ] New member sends `.mulai`.
- [ ] Bot explains the goal choices without requiring command knowledge.
- [ ] Member chooses a goal and experience level.
- [ ] Bot returns recommendations that match the selected path.
- [ ] `.cari` finds the relevant workflow/command.
- [ ] `.help <command>` gives purpose, format and example.
- [ ] Member can open `.support` and FAQ.
- [ ] Member can create a ticket and read it with `.ticket detail ID`.
- [ ] Ticket owner can read their own ticket in private chat.
- [ ] A member from another group cannot access the ticket.
- [ ] Group Admin can only access tickets in their own group; Owner can access across groups.

## B. Website ↔ WhatsApp profile
- [ ] Create a profile using `.portfolio daftar`.
- [ ] Confirm the website sees the same designer ID and profile.
- [ ] Set public WhatsApp from bot; verify both `publicWhatsApp` and `contactPhone` are present.
- [ ] Open public website profile and click WhatsApp CTA; confirm the destination number is correct.
- [ ] Edit number from website; confirm bot `.portfolio preview` displays the new number.
- [ ] Hide number from bot; confirm website no longer shows the WhatsApp CTA.
- [ ] Confirm internal `ownerJid` and `contactJid` are never displayed publicly.

## C. Designer Studio and notification inbox
- [ ] Register at `/studio/register` using the same WhatsApp number.
- [ ] Link with `.portfolio link KODE` in private chat.
- [ ] Complete email verification and OTP login.
- [ ] Upload an artwork and submit it for moderation.
- [ ] Approve the artwork as Owner and verify public visibility.
- [ ] Generate a website notification.
- [ ] Read unread notifications with `.portfolio notifikasi` in private chat.
- [ ] Confirm only displayed notifications are marked read.
- [ ] Confirm `.portfolio notifikasi` in group is rejected.
- [ ] Confirm another designer cannot read this profile's notifications.
- [ ] Compare website analytics with `.portfolio analytics`.

## D. Community and permissions
- [ ] Learning progress is private to the member.
- [ ] Challenge gallery and peer feedback are scoped to the source group.
- [ ] Self-review and duplicate review are rejected.
- [ ] Ordinary members cannot hide/restore submissions.
- [ ] Group Admin can moderate only their group; Owner can moderate as authorized.
- [ ] Mentor profiles are opt-in.
- [ ] Collaboration join capacity is enforced.
- [ ] No bot command starts a payment or order transaction.

## E. Deployment and recovery
- [ ] `npm ci` succeeds from the committed lockfile.
- [ ] `npm run website:install` succeeds.
- [ ] `npm run check`, `npm run website:check`, and `npm run audit:release` pass.
- [ ] `npm test` and `npm run website:test` pass.
- [ ] `npm run integration:doctor` reports no critical mismatch.
- [ ] `npm run verify:database` confirms shared collections and required indexes.
- [ ] `npm run smoke:deployment` reports 2/2 ready.
- [ ] `mongodump` creates a protected archive.
- [ ] `mongorestore` restores to a separate staging database without touching production.
- [ ] Staging website and bot can read the restored profile, portfolio item and notification.
- [ ] Media backup is restored and image URLs resolve.
- [ ] Rollback procedure is rehearsed.

## Sign-off
- Tester:
- Date:
- Staging database:
- WhatsApp test group:
- Backup archive:
- Restore duration:
- Open issues:
- Approval:
