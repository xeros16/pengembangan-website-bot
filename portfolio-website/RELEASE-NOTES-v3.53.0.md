# PIR Visuals Website v3.53.0 — Upload Preview & Workspace Navigation Fix

## Profile photo upload
- The browser now decodes, center-crops and previews the selected JPG/PNG/WebP, then creates a 512 × 512 WebP (PNG fallback) before submitting.
- Profile avatar validation no longer depends on Sharp or its platform-specific native binary. The server checks the real image signature and dimensions, then stores the validated bytes with the matching extension and MIME type.
- Avatar serving supports WebP, PNG and JPEG with path restrictions and `nosniff`.
- A valid original image can still be submitted if browser optimization fails; the server validates it before storage.

## Portfolio SVG upload
- SVG preview tries the original SVG first, then a sanitized SVG fallback. This avoids breaking Figma exports during preview cleanup.
- If browser rasterization fails, the original SVG is still sent to the server for 72 DPI processing instead of blocking the upload.
- Server-side Sharp setup failures now return a clear installation instruction rather than a misleading image-corruption error.

## Workspace
- Workspace icons now have a clear 11 px gap from their labels.
- The global `public-ui.js` cache key is bumped so browsers receive the fixed navigation handler.
- Workspace clicks explicitly scroll the document viewport to the selected section, accounting for the sticky top navigation.
