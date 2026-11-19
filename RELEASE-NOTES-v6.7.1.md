# PIR Visuals Bot v6.7.1 — Illustrated Feature Menu

## What changed

- Added a branded, six-category infographic for the main PIR Visuals feature menu, using the supplied Pixel Realm help poster as a layout reference.
- `.menu`, `.help` without a topic, and `.fitur` now send the poster first and then the full text navigation/catalog.
- The six visual groups are Design & Creative, Image & Media, Learning & Community, Portfolio & Directory, Group & Support, and Games & Entertainment.
- The image is a visual index only. The text catalog remains authoritative and includes the detailed command descriptions, permissions, category filters, search, and workflows.
- If the poster is missing or WhatsApp rejects the image, the bot automatically falls back to text.
- Installations using a custom command prefix stay text-only because the poster artwork displays the default `.` prefix; this prevents showing incorrect command examples.

## Existing features referenced by the poster

The poster surfaces existing commands; it does not create or unlock them. Examples include `.wizard`, `.creative`, `.designproject`, `.info`, `.resize`, `.sticker`, `.designlearn`, `.designchallenge`, `.designcommunity`, `.cohort`, `.design`, `.designer`, `.portfolio`, `.studio`, `.rules`, `.support`, `.ticket`, `.games`, `.pr menu`, `.anime`, and `.music`. Access checks and provider/database requirements remain unchanged.

## Compatibility

- Bot package: `6.7.1`.
- Website package: `3.50.0` (unchanged).
- No new runtime npm dependency.
- No MongoDB collection, schema, or index migration.
- Existing text navigation remains available as a fallback.

See `QA_REPORT_v6_7_1.md` and `INSTALL_UPDATE_v6_7_1.md`.
