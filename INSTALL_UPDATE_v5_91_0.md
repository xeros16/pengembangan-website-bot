# PIR Visuals Bot v5.91.0 — Install & Update

## Release scope

v5.91.0 changes the WhatsApp bot marketplace into a designer portfolio directory with opt-in public contact only. It does not provide briefs, offers, orders, checkout, payments, escrow, commissions, transaction mediation, or disputes.

## Before updating an existing installation

1. Stop the bot process cleanly.
2. Back up the MongoDB database and existing project folder.
3. Preserve `.env`, WhatsApp auth/session folders, local uploads, backups, allowlist/configuration files, and any locally managed secrets. The clean source archive intentionally excludes those runtime files.
4. Extract both `PIR-Visuals-v5.91.0-Clean-Source-Part-1.zip` and `Part-2.zip` into the same destination folder. These are split source archives, not separate installations.
5. Copy back only the environment/runtime data that belongs to the existing deployment. Do not overwrite `.env` or WhatsApp auth state with sample files.
6. Run `npm ci` from the project root.
7. Compare `.env.example` with the preserved `.env`; add newly required settings without replacing existing secrets.
8. Ensure `DESIGN_COMMUNITY_GROUPS` contains the approved community group JIDs for profile registration.
9. Run `npm run check`, `npm test`, and `npm run audit:release` after dependencies are installed.
10. Start the bot in staging and validate the smoke tests below before production rollout.

## Existing designer profiles

Existing `contactJid` values are retained as internal account identities but are no longer displayed as public contact. This is intentional privacy protection. Each designer who wants a public WhatsApp link must explicitly set it:

```text
.portfolio edit whatsapp 6281234567890
```

To hide it again:

```text
.portfolio edit whatsapp off
```

Instagram, Behance, Dribbble, and website links can also be configured through `.portfolio edit`.

## Command changes

- `.design` discovers designers with approved portfolio work.
- `.design kategori`, `.design gaya`, `.design lokasi`, `.design cari`, and `.design unggulan` filter the directory.
- `.designer DSN-ID` displays approved work and public contact details.
- `.portfolio daftar` is a five-step guided profile wizard.
- `.portfolio add` gives website-first upload instructions; work remains subject to Owner moderation.
- `.portfolio status on|off` controls public profile visibility.
- `.studio` shows portfolio moderation counts and profile/portfolio/contact analytics.
- `.marketadmin` manages directory profiles, pending work, reports, and activity.
- Legacy `.requestdesign`, `.client`, `.klien`, `.service`, and `.layanan` commands return a migration notice and do not create transaction records.

## Data safety

Legacy MongoDB schemas and collections for previous orders, offers, reviews, services, activity, disputes, and payment records are retained for historical compatibility. v5.91.0 active bot code no longer imports or queries them. Do not delete or migrate these collections as part of this release.

## Staging smoke tests

1. `.design` returns only public designers with approved portfolio work.
2. `.designer DSN-ID` shows approved work and the public contact field.
3. A profile with empty `publicWhatsApp` does not reveal `contactJid` or the account phone.
4. `.portfolio edit whatsapp 628...` displays the explicit `wa.me` link; `off` removes it.
5. `.design lokasi <kota>` narrows results to profiles that have approved work.
6. `.portfolio status off` hides the profile from public discovery.
7. `.requestdesign`, `.client`, `.service`, and aliases show migration guidance only.
8. Owner can approve/reject portfolio items and resolve content reports; no order/payment queue exists.

## Rollback

If staging detects an issue, stop the bot and restore the previous source plus the pre-update backup. Do not remove the legacy database collections. If public contact details were added incorrectly, clear them using `.portfolio edit whatsapp off` or update the profile directly in the database after taking a backup.
