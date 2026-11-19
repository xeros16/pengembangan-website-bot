# Feature Status — PIR Visuals Bot 5.14.0

This release is based on the uploaded v5.13.0 source archive. It removes WhatsApp interactive navigation while retaining the existing allowlist/search and feature implementations.

## Navigation

- Home menu and category menus send plain text only.
- No WhatsApp list message or button payload is used by bot navigation.
- Category navigation remains available through `.menu` commands.
- Command help and pagination remain text-based.

## Access Manager

- `.allowlist search <keyword>` searches approved groups and contacts.
- `.allowlist search group <keyword>` filters groups.
- `.allowlist search contact <keyword>` filters contacts.
- Search matches aliases, saved WhatsApp names, JIDs, and notes; result count is bounded.
- Allowlist mutations and Owner-only authorization are unchanged by this navigation update.

## Validation

- JavaScript syntax check: 146 files pass.
- Full automated test suite: 231 tests pass.
- WhatsApp live-device behavior and production MongoDB connectivity were not tested in this environment.
