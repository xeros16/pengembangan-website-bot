# PIR Visuals Website — v3.63.0

## Brand Harmony

- Centralized the public-facing palette around PIR Visuals' forest green, soft sage, warm cream, ivory, botanical olive, and restrained clay/peach.
- Removed the bright mustard/yellow treatment from homepage journey and category cards in favor of PIR sage and peach tones.
- Harmonized shared navigation, buttons, form fields, tags, cards, and focus states across public pages.
- Applied the same palette to For Business, Discover, Designer Studio login/recovery, and Command Explorer.
- Preserved existing routes, form actions, directory filtering, designer profile data, and command catalogue behavior.
- Added mobile touch-target and input sizing safeguards plus reduced-motion handling.

## Files

- `pir-reference-blend-v3.62.css` — extends the existing final cascade layer with the v3.63 brand-harmony rules.
- `package.json`, `package-lock.json` — version metadata.
- `tests/pir-brand-harmony-v3.63.test.js` — targeted regression coverage.

## Validation

Run `npm run check` and `node --test tests/pir-brand-harmony-v3.63.test.js` from `portfolio-website`.
