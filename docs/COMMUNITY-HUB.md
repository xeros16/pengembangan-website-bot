# PIR Visuals Community Hub — v5.93.0

## Product purpose

Community Hub connects members who want to learn, people who are willing to mentor, and designers who want to collaborate on small group projects. It is designed for existing WhatsApp groups and does not create a public cross-group directory.

## Group-scoped profile and consent

All profile, mentor/learner search, milestone, and collaboration operations require a group chat and MongoDB. The read-only `.designcommunity help` command is available in private chat and while MongoDB is offline. A profile is stored by `{ groupJid, userJid }`.

| Command | Purpose |
|---|---|
| `.designcommunity` | Show Community Hub help |
| `.designcommunity profil` | View the caller's profile in this group |
| `.designcommunity mentor branding,uiux` | Opt in to mentor discovery for selected skills |
| `.designcommunity belajar poster,tipografi` | Opt in as a learner seeking support |
| `.designcommunity intro <text>` | Set a short introduction shown in mentor search results |
| `.designcommunity cari branding` | Find visible, opted-in mentors in this group |
| `.designcommunity cari belajar poster` | Find members who opted in to seek learning support |
| `.designcommunity off` | Disable visibility and mentor/learner matching in this group |
| `.designcommunity hapus` | Delete the caller's community profile in this group |
| `.designcommunity badges` | View personal participation milestones in the current group |

Supported topics: `branding`, `poster`, `ui/ux`, `ilustrasi`, `tipografi`, `motion`, `fotografi`, `kemasan`, `social media`, `layout`, `riset ux`, and `copywriting`.

Mentor and learner registration is explicit. A member can be both. `.cari <topic>` returns profiles with `visible=true`, `mentorOptIn=true`, and a matching `mentorTopics` entry; `.cari belajar <topic>` returns profiles with `visible=true`, `learnerOptIn=true`, and a matching `seekingTopics` entry. Both searches include the current `groupJid`. Results show WhatsApp display name, opted-in topics, and optional introduction; they do not print stored JID, phone number, email, or contact links.

`off` hides the profile from discovery and clears mentor/learner opt-in flags and topics while retaining the record so the member can reactivate later. `hapus` deletes the profile document for that group. These actions do not change profiles in other groups.

## Participation milestones

`.designcommunity badges` calculates milestones at request time from existing records:

- Langkah Pertama — one completed learning module.
- Penjelajah Materi — four completed learning modules.
- Tuntas 12 Modul — all twelve learning modules.
- Berbagi Karya — one active challenge submission in the current group.
- Kreator Aktif — five active challenge submissions in the current group.
- Apresiasi Komunitas — three peer reviews given in the current group.
- Rekan Kolaborasi — at least one collaboration created or joined in the current group.
- Mentor Terbuka — currently opted in as a visible mentor in the current group.

Milestones are not persisted as awards, do not grant XP or coins, do not rank artistic quality, and are not professional certifications. They are a summary of activity recorded by the bot.

## Designer Collaboration Board

| Command | Purpose |
|---|---|
| `.designcommunity collab help` | Show collaboration commands |
| `.designcommunity collab buat Judul | brief | poster,ilustrasi | 3` | Create a group project |
| `.designcommunity collab list` | List open projects in this group |
| `.designcommunity collab join KODE` | Join a project with available capacity |
| `.designcommunity collab leave KODE` | Leave a project |
| `.designcommunity collab tutup KODE` | Close a project as owner or group Admin |

Project requirements:

- Title: 5–80 characters.
- Brief: at least 15 characters, maximum 300.
- Skills: one to four supported topics.
- Capacity: 2–5 people, including the project owner.
- Each owner may have at most three open projects per group; this count is enforced at application level, not by a distributed lock across multiple bot instances.
- Project codes are randomly generated short references.
- Project visibility and membership queries are scoped to `groupJid`.
- A member cannot join their own project or join twice.
- Joining is protected by an atomic MongoDB capacity condition so concurrent joins cannot overfill the last slot.
- Only the owner or a group Admin may close a project.

The board is for organizing voluntary creative collaboration. It does not create a contract, order, commission, payment, escrow, prize, dispute process, or automatic intellectual-property transfer. Members should agree on roles, deadlines, usage rights, and attribution in their own group discussion before beginning work.

## Data model and indexes

### `CommunityProfile`

- Unique `{ groupJid: 1, userJid: 1 }`.
- Discovery `{ groupJid: 1, visible: 1, mentorOptIn: 1, mentorTopics: 1, updatedAt: -1 }`.
- Stores display name, explicit opt-in flags, skill topic arrays, optional intro, and consent timestamp.

### `CommunityCollaboration`

- Unique `code`.
- Board lookup `{ groupJid: 1, status: 1, createdAt: -1 }`.
- Owner limit lookup `{ groupJid: 1, ownerJid: 1, status: 1 }`.
- Stores owner identity internally, public display name, brief, needed skills, capacity, collaborators, status, and close metadata.

Both collections are additive. Existing User learning progress and LearningSubmission records are not rewritten.

## Privacy and moderation

- All read/write filters for profiles and projects include the current `groupJid`.
- JIDs are stored only for internal identity checks and are not included in formatted search/list output.
- Mentor and learner discovery are opt-in. A member may turn it off or delete the group profile.
- Profile introductions and project briefs reject phone-like numbers, JIDs, email addresses, and URLs to reduce accidental contact disclosure.
- Project owner identity is internal; board output uses the supplied WhatsApp display name.
- Project creation and joining are voluntary. Do not post private contact details in project briefs.
- Group Admins can close a project that violates group rules; this does not delete the historical record.
- Community Hub is not a substitute for the separate moderated public Designer Portfolio Directory.

## Staging smoke tests

1. In group A, enable a mentor profile; confirm group A search finds it.
2. Search the same topic from group B; confirm the profile is not returned.
3. Enable learner topics, update intro, turn profile off, and confirm it disappears from search.
4. Delete the profile and confirm it no longer appears in the profile command.
5. Verify milestone thresholds using separate test users and existing learning/challenge activity.
6. Create a project with capacity two; verify owner is counted as the first slot.
7. Join from one member; reject duplicate join, self-join, cross-group join, and a join after the last slot is consumed.
8. Verify the project owner can close it; ordinary members cannot; group Admin can.
9. Verify no formatted output contains JIDs or phone numbers.
10. Verify all profile/project operations fail closed when MongoDB is unavailable.
