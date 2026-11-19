# PIR Visuals v6.7.3 — Text-Only Menu & Complete Feature Catalog

**Bot package:** 6.7.3  
**Website package:** 3.50.0 (unchanged)  
**Release status:** Development Candidate; production staging acceptance is required.

## 1. Menu behavior

- Removed the PIR Visuals main-menu poster from `.menu`, `.help` without a topic, and `.fitur`. These commands now send text only.
- Removed the menu-poster asset and its file-read/media-send code path. The separate Pixel Realm Game Center menu artwork is unchanged.
- The main menu remains copyable and continues to respect the configured command prefix.

## 2. Complete `.fitur` catalog

- `.fitur` now prints every registered top-level command, grouped by category, using a copyable text layout inspired by the supplied reference.
- The output is generated directly from `COMMAND_CATALOG`: **230 registered command names across 24 categories** in this source revision.
- Each entry includes a short description and an example where the catalog provides one. New commands added to the registry are automatically included.
- `.fitur cari <kata kunci>`, `.fitur kategori <nama>`, `.fitur semua [halaman]`, and `.fitur alur [id]` remain available. `.help <perintah>` continues to show format, parameters, examples, and access rules.
- The full catalog is 34,205 UTF-8 bytes in this build and fits in one WhatsApp text message under the 65,536-byte limit.

## 3. Integrity and compatibility

- Added regression tests proving that every routed command set and every game metadata entry is represented in the catalog.
- Added text-only assertions for `.menu`, `.help`, and `.fitur`; no menu artwork is sent.
- No new npm dependency, database collection, schema, index, or migration.
- Website package remains 3.50.0.

## 4. Staging still required

- Verify `.menu`, `.help`, `.fitur`, category filtering, and custom prefixes on live WhatsApp Android/iOS clients.
- Confirm the 34 KB catalog message is displayed and remains copyable in the deployed WhatsApp client.
- Live WhatsApp delivery and production environment acceptance are not performed by local unit tests.
