# PIR Visuals Bot v5.93.0 — Community Intelligence & Engagement

## Summary

v5.93.0 adds a group-scoped Community Hub to the v5.92 learning and challenge foundation. Members can opt in to mentor discovery, share learning interests, view participation milestones, and organize small designer collaborations.

## What's new

- `.designcommunity mentor <topics>` opts in to mentor discovery for selected skills.
- `.designcommunity belajar <topics>` opts in as a learner seeking support.
- `.designcommunity cari <topic>` searches opted-in mentors; `.designcommunity cari belajar <topic>` discovers opted-in learners, both only in the current WhatsApp group.
- `.designcommunity profil`, `.intro`, `.off`, and `.hapus` manage the caller's community profile.
- `.designcommunity badges` calculates milestones from learning progress, challenge submissions, peer reviews, collaboration activity, and mentor opt-in.
- Designer Collaboration Board supports project creation, listing, joining, leaving, and closing.
- Projects have unique codes, a short brief, required skills, capacity 2–5 including owner, and a maximum of three open projects per owner per group.
- Collaboration joins use an atomic capacity condition to reduce overbooking during concurrent joins.
- Only the project owner or group Admin can close a project.
- Added `CommunityProfile` and `CommunityCollaboration` models and indexes.
- Added Community Hub tutorial, onboarding recommendations, natural-language search support, command catalog entry, and release documentation.

The clean source package is distributed in two complementary ZIP parts with a SHA-256 manifest. Extract both parts into the same folder; neither archive is standalone.

## Privacy and product boundaries

- Mentor and learner profiles are opt-in and group-scoped.
- `.off` removes the profile from discovery; `.hapus` deletes the profile for the current group.
- Mentor search and collaboration board never print stored JIDs or phone numbers.
- Profiles and projects are not visible across groups.
- Milestones are activity summaries, not professional certification, quality ratings, XP, coins, or public rankings.
- Collaboration Board does not handle orders, contracts, payment, escrow, commissions, prizes, or disputes.
- The public Designer Portfolio Directory remains separate and continues to use its existing moderation and explicit contact-consent flow.
- Website runtime and website package/cache version remain unchanged.

## Commands

```text
.designcommunity help
.designcommunity profil
.designcommunity mentor branding,uiux
.designcommunity belajar poster,tipografi
.designcommunity intro Saya fokus pada branding dan senang berbagi proses desain.
.designcommunity cari branding
.designcommunity badges
.designcommunity off
.designcommunity hapus
.designcommunity collab buat Judul | brief proyek kolaborasi yang jelas | poster,ilustrasi | 3
.designcommunity collab list
.designcommunity collab join KODE
.designcommunity collab leave KODE
.designcommunity collab tutup KODE
```

## Validation

See `QA_REPORT_v5_93_0.md`. Source syntax, isolated Community Hub tests, full-suite dependency availability, and live WhatsApp/MongoDB staging are reported separately. Do not treat source-level tests as a substitute for live group smoke tests.
