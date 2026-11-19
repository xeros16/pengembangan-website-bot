# Operations Runbook — PIR Visuals Bot v5.93.0

## Community Hub boundaries

- Mentor/learner profiles are opt-in and scoped to one group.
- `.off` disables discovery; `.hapus` deletes the caller's profile in the current group.
- Mentor search does not expose stored JID or phone fields.
- Collaboration projects are visible only in their originating group.
- Collaboration is voluntary and does not create an order, contract, payment, escrow, commission, prize, or dispute process.
- Participation milestones are activity summaries, not certifications or quality rankings.

## Normal operation

### Profiles and mentor matching

- `.designcommunity mentor <topics>` enables mentor discovery.
- `.designcommunity belajar <topics>` records learning interests.
- `.designcommunity cari <topic>` searches current-group mentors; `.designcommunity cari belajar <topic>` discovers opted-in learners in the same group.
- `.designcommunity profil` shows the caller's current-group profile.
- `.designcommunity intro <text>` updates the opt-in profile introduction.
- `.designcommunity off` hides the profile and clears mentor/learner opt-in flags.
- `.designcommunity hapus` deletes the profile for this group.

Supported topics: branding, poster, ui/ux, ilustrasi, tipografi, motion, fotografi, kemasan, social media, layout, riset ux, copywriting.

### Milestones

`.designcommunity badges` calculates achievements from the caller's completed learning modules, active challenge submissions, peer reviews given, collaborations created/joined, and active mentor opt-in. If a source collection is unavailable, the command reports a load failure rather than inventing a count.

### Collaboration Board

- `.designcommunity collab buat <title> | <brief> | <skills> | <slots>` creates a project.
- `.designcommunity collab list` lists open projects in the current group.
- `.designcommunity collab join <CODE>` joins when a slot is available.
- `.designcommunity collab leave <CODE>` leaves a project.
- `.designcommunity collab tutup <CODE>` closes a project as owner or group Admin.

Capacity is 2–5 including the owner. Each owner can have at most three open projects per group. MongoDB conditional update protects the last slot against concurrent joins.

## Database operations

- Include `communityprofiles` and `communitycollaborations` in regular MongoDB backups.
- Confirm unique and lookup indexes after deployment.
- Monitor duplicate-key and write-conflict logs if multiple bot instances are deployed.
- Cross-document transactions are not used; the last-slot capacity guard is a single-document atomic update.
- Do not delete or rename existing learning, challenge, portfolio, or marketplace collections.

## Incident response

- Unwanted mentor listing: instruct the member to run `.designcommunity off`; if needed, remove the group-scoped profile after following group moderation procedures.
- Wrong-group result: immediately inspect every query and verify `groupJid` is included in the filter.
- Overfilled project: inspect join filter and confirm `$expr` compares current collaborator count with `slots - 1`; pause joins if indexes or writes are unhealthy.
- Unauthorized project closure: inspect `ownerJid` comparison and group Admin metadata; only owner/Admin should close.
- Personal identifier exposure: stop the affected output path, inspect formatting, and ensure only `displayName`/public fields are rendered.
- MongoDB unavailable: no profile, milestone, or project mutation should claim success.

## Production readiness

Automated tests do not verify real WhatsApp group metadata, MongoDB index creation, multi-instance race behavior, or member understanding of mentoring and collaboration etiquette. Complete staging tests with at least two groups and several test accounts before production rollout.
