# PIR Visuals Website v3.52.0 — SVG Preview, Upload & Designer Studio Usability

## SVG upload reliability
- SVG preview now forces the correct `image/svg+xml` MIME type even when Windows/browser metadata is blank.
- SVG markup is parsed and sanitized for the local preview; unsafe active elements and external resources are removed.
- Before website upload, SVG is rasterized in the browser to optimized WebP (PNG fallback). This avoids sending large Figma vectors directly to the server rasterizer.
- Server-side SVG rasterization now uses 72 DPI instead of 144 DPI. A 3636 × 2045 Figma export stays below the 20 MP processing limit before the final 1800 px optimization.
- Each portfolio file remains limited to 15 MB, up to five files per work.

## Designer Studio
- Workspace navigation now has relevant inline SVG icons, active states, explicit click-to-scroll behavior, and matching section targets.
- Profile photo can be uploaded directly from the device (JPG, PNG, WebP; 5 MB maximum). The server stores an optimized square WebP; a URL is no longer required.
- Profile, portfolio, case-study, service, collection, testimonial and availability fields now include practical examples.
- Existing moderation and shared portfolio storage remain unchanged.
