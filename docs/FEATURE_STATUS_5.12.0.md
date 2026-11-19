# Feature Status — PIR Visuals Bot 5.12.0

## Access Manager / Allowlist

| Capability | Status | Notes |
|---|---|---|
| Persistent approved groups | Complete in code | MongoDB `access_lists` + local JSON fallback |
| Persistent approved contacts | Complete in code | Supports phone JID and LID |
| Group alias | Complete in code | `.allowlist group name <alias>` inside approved group |
| Group WhatsApp subject snapshot | Partial | Captured when approving/renaming; not live-refreshed |
| Group internal note | Complete in code | `.allowlist group note <text>` |
| Contact alias | Complete in code | `.allowlist contact name <number> <alias>` |
| Contact profile name | Partial | Read from Baileys store when available; otherwise alias/JID |
| Contact internal note | Complete in code | `.allowlist contact note <number> <text>` |
| Identity listing | Complete in code | `.allowlist list` shows alias, available WhatsApp name, ID, and note |
| Search/filter identities | Not implemented | Planned for a future Access Manager UX update |
| Explicit remove | Complete in code | Existing group/contact remove commands retained |
| Local backup | Complete in code | `config/allowed-chats.json.bak` before each atomic write |
| Corrupt JSON safety | Complete in code | Restore backup or throw; never silently return empty list |
| Deployment-safe DB restore | Complete in code | Monotonic revision prevents newer empty config timestamp from replacing DB data |
| Offline local change sync | Complete in code | Higher local revision is synced when MongoDB reconnects |
| Multi-tenant labels/expiry dashboard | Partial | Alias/note available; automated lease expiry and tenant dashboard not included |

## Validation

- JavaScript syntax check: 146 files passed.
- Full automated test suite: 229 passed, 0 failed.
- Focused access-control tests: 11 passed, 0 failed.
- Live WhatsApp and production MongoDB deployment tests: not performed.

## Operational requirement

For persistence across deployments, configure `MONGO_URI` to a persistent MongoDB database and retain the `access_lists` collection. Local JSON is a fallback, not a substitute for persistent storage on ephemeral hosting.
