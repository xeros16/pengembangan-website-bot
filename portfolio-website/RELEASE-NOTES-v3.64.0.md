# PIR Visuals Website — v3.64.0

## Whole-site responsive refinement

- Applied a final brand layer across homepage, For Business, Discover, Designer Studio, Command Explorer, portfolio/category/profile pages, support surfaces and shared public components.
- Removed remaining high-saturation mustard/yellow treatment from the homepage's latest showcase slide and fourth service category card; replaced it with PIR sage and muted clay/peach tones.
- Rebalanced the For Business service cards into three equal desktop columns, two columns on tablet, and a single column on mobile.
- Harmonized cards, forms, tags, buttons, focus states, CTA bands and metadata around forest green, sage, warm cream, ivory and restrained clay.
- Added responsive safeguards for overflow, form controls, small-screen spacing, touch targets and reduced-motion preferences.
- Preserved existing routes, query parameters, forms, account workflows, filtering behavior, portfolio records and command catalogue behavior.

## Files

- `pir-whole-site-v3.64.css` — final cascade layer loaded after existing styles.
- `server.js` — stylesheet registration and cache-revalidated static asset allowlist.
- `package.json`, `package-lock.json` — version metadata.
- `tests/pir-whole-site-v3.64.test.js` — focused regression checks.
- `tests/pir-brand-harmony-v3.63.test.js` — current package version assertion updated.

## Validation

- `npm run check` — passed.
- Focused v3.63/v3.64 regression tests — 13/13 passed.
- CSS parser — 76 top-level rules, 0 parse errors.
- Full website suite — 682/785 passed; 103 legacy tests still fail on older release/cache expectations and existing interaction assertions, so the complete suite is not yet green.
- Live browser rendering was not available in the build environment because the native `sharp` runtime could not load; verify the rendered pages after installing the update locally.
