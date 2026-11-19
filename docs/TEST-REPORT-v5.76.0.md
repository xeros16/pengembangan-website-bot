# Test Report — PIR Visuals v5.76.0

## Release scope

Light Mode contrast and surface harmonization. The update changes the shared website page shell and its regression coverage. It does not change bot commands, WhatsApp session handling, authentication logic, or database schemas.

## Automated checks

| Check | Result |
|---|---:|
| `npm run website:check` | PASS |
| `npm run website:test` | PASS — 269/269 |
| Server JavaScript syntax | PASS |
| Models JavaScript syntax | PASS |
| New Light Mode regression suite | PASS |

## Browser visual QA

Chromium previews were rendered from the actual website HTML for:

- `/contact` — desktop 1440 px, Light and Dark Mode
- `/contact` — responsive widths 760, 600, 520, 390, 360, and 320 px
- `/about`, `/how-it-works`, `/collections`, `/shortlist` — desktop 1440 px
- `/studio`, `/client` — mobile 390 px

Results:
- No browser page errors on the rendered routes.
- No horizontal document overflow at the tested responsive widths after correcting the full-bleed footer margins.
- Customer Support italic heading, service hours, aside card title, and aside list text use darker Light Mode foregrounds.
- The `SUPPORT / 01` card now has an opaque pale-sage surface instead of a translucent grey overlay.
- Dark Mode contact-page preview remains visually coherent.

## Contrast checks

The regression suite checks these semantic foreground/background pairs:

| Foreground | Background | Contrast |
|---|---|---:|
| `#202820` | `#FFFEFA` | 15.02:1 |
| `#4E5B50` | `#FFFEFA` | 7.09:1 |
| `#5D6B60` | `#F4F2EC` | 5.02:1 |
| `#31583A` | `#F7F8F2` | 7.67:1 |
| `#765C2F` | `#FFFEFA` | 6.23:1 |
| `#1F2C22` | `#FFFEFA` | 14.43:1 |
| `#405445` | `#EEF3E9` | 7.24:1 |
| `#FFFFFF` | `#35583A` | 8.05:1 |

All listed pairs exceed WCAG AA's 4.5:1 threshold for normal text.

## QA limitations

The preview environment did not have a connected MongoDB instance. Database-dependent dynamic pages such as the live homepage directory, Discover results, and Categories data were therefore not live-rendered in this QA session. Shared Light/Dark theme CSS, static public pages, support surfaces, forms, navigation shell, and regression source checks were tested.

The WhatsApp bot was not modified or tested in this website-only update.
