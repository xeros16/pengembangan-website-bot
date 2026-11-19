# PIR Visuals Website v3.60.1

- Fixes `ReferenceError: featuredCards is not defined` in `renderHome()`.
- Restores the featured-designer card HTML from the existing featured designer query before rendering the homepage talent section.
- Adds a regression test to prevent the declaration from being removed during future homepage showcase edits.
- Retains the v3.60.0 standalone Community Showcase and Owner Dashboard features.
- No database migration is required.
