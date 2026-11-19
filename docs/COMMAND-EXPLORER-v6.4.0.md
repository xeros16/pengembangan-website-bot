# Command Explorer — v6.4.0

- Public route: `/commands`.
- Data source: `docs/commands.json`, generated from `COMMAND_CATALOG` by `npm run docs:commands`.
- `docs/commands.md` and `docs/commands.json` are generated together from the same runtime registry.
- The page supports client-side text search and category filtering, shows examples and access labels, and provides copy-example buttons.
- The route is read-only and does not execute bot commands.
- If the generated JSON is missing, the route returns a safe 503 message with the generation command.
- Client-side search/filter/copy behavior is served from same-origin `portfolio-website/command-explorer.js`, preserving the site's strict `script-src 'self'` Content Security Policy.
- The route is included in the public sitemap and linked from the website's “Lainnya” navigation.
