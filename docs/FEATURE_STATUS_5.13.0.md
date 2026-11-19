# Feature Status — PIR Visuals Bot 5.13.0

## Access Manager / Allowlist

| Capability | Status | Notes |
|---|---|---|
| Persistent approved groups and contacts | Implemented in code | MongoDB `access_lists` with local JSON fallback |
| Group/contact aliases and internal notes | Implemented in code | Existing `.allowlist group/contact name` and `note` actions |
| Search identities | Implemented in code | `.allowlist search <query>` |
| Filter by identity type | Implemented in code | `.allowlist search group <query>` / `contact <query>` |
| Search fields | Implemented in code | Alias, stored WhatsApp name, JID, and internal note; case-insensitive |
| Result limit | Implemented in code | WhatsApp command displays at most 10 results |
| Local previous-file backup | Existing implementation | `config/allowed-chats.json.bak` before writes |
| Corrupt JSON safety | Existing implementation | Reads backup or throws; does not silently treat corruption as an empty list |
| MongoDB restore and revision sync | Existing implementation | Unit tests use a mocked model; production database not tested here |
| Automated rental expiry/reminders | Not implemented | Separate rental-management milestone |
| Tenant dashboard | Not implemented | Separate rental-management milestone |

## Validation scope

- Added unit tests for search filters, case-insensitive matching, matching notes/JIDs, result caps, and read-only behavior.
- Syntax and test results are recorded in the release notes after local validation.
- Live WhatsApp compatibility and a real MongoDB staging/production test are not performed by the patch build.

## Upgrade safety

This patch contains only changed source, tests, package version metadata, and documentation. It does not include `.env`, WhatsApp auth/session folders, `node_modules`, local allowlist data, MongoDB dumps, or backups. Keep the existing local config and auth directory when applying the patch.
