# Catatan Perbaikan PIR Visuals Website v3.55.0

## Media Beranda terpisah
- Owner Dashboard > Visual Site Studio > Banner & campaign now has one independent media input per banner.
- Supported image formats: JPG, PNG and WebP. Supported video formats: MP4 and WebM.
- Each media file is limited to 50 MB; up to three files can be uploaded in one save.
- Images are orientation-corrected and converted to WebP while preserving their aspect ratio. Videos are stored in the portfolio upload directory under `homepage/` and served with HTTP byte-range support.
- The homepage carousel reads only the Owner-managed CMS slides; it no longer auto-adds the latest portfolio work or featured designer avatars. The separate approved-work gallery remains connected to approved portfolio submissions.

## Preview and profile saving
- Profile-photo preview first uses a local object URL and falls back to a server-generated WebP preview if the browser cannot decode the source.
- Profile save now uses fetch/FormData, reports server errors and timeouts, and redirects to the Designer Studio with a success notice.
- The profile POST route returns a redirect rather than rendering the full dashboard inside the save request.

## Aspect ratio and mobile
- Banner, portfolio-card and upload-preview images use `object-fit: contain` and intrinsic height instead of forced cropping.
- Mobile homepage carousel moves media into a visible, full-width block above the slide copy.

## Validation
- `node --check server.js` passes.
- Targeted Designer Studio, upload, homepage media and SVG tests pass.
- Full website test suite: 610 tests; 546 pass, 64 pre-existing failures (same failing test names as the v6.7.7 baseline).
- Browser/database end-to-end testing is not available in this build environment; final live upload and save verification should be performed after deployment.
