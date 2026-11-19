# Design Brief Wizard Persistence — v6.1.0

## Storage contract

The wizard stores one active draft for each `(chatJid, userJid)` pair in the `designbriefsessions` collection.

Fields:
- `chatJid`: WhatsApp chat scope (private chat or group).
- `userJid`: normalized account identity; phone JID is preferred when available.
- `step`: active step index (0–6).
- `answers`: draft answers for the seven brief questions.
- `expiresAt`: expiration timestamp, set to 24 hours after the latest saved answer or state-changing action.

Indexes:
- Unique compound index `chatJid_1_userJid_1` prevents duplicate active drafts for the same user/chat.
- TTL index `expiresAt_1` removes expired documents asynchronously.
- Application-level expiry checks run on read, so correctness does not depend on the TTL monitor's exact schedule.

## Lifecycle

- Starting a wizard creates a draft.
- Each accepted answer updates the draft and refreshes the 24-hour expiry.
- `lanjut`, `kembali`, and `status` read/update only the current user's draft in the current chat.
- Completion and `batal` delete the draft.
- `ulang` deletes the previous draft and starts a new one.
- Starting onboarding clears an active brief draft to prevent two conversational flows from competing for the next message.

## Privacy

Drafts may contain client project details. The WhatsApp prompt discloses the 24-hour storage period and tells users not to include passwords, OTPs, or confidential client data. The bot does not expose draft retrieval to other users. The current chat's visibility still applies: group answers are visible to group members, so private chat should be used for confidential briefs.

## Operations

Run `npm run db:ensure-directory-indexes` to create the compound and TTL indexes additively. Run `npm run verify:database` to verify them after the collection exists. No destructive migration is required.
