# PIR Visuals Bot v6.7.6 — Website Upload & Workspace Fix

- Bundled Designer Studio website v3.53.0.
- Profile photos are browser-cropped and previewed; server validation no longer requires Sharp for avatars and supports PNG/JPEG/WebP storage.
- Figma SVG preview now tries the original file before sanitized fallback. Failed browser rasterization no longer blocks submission; original SVG is sent to server processing.
- Sharp setup errors now show an actionable `npm ci` instruction.
- Workspace icon spacing is increased and click navigation explicitly scrolls to the selected section with fresh cache keys.
