# PIR Visuals Website v3.61.0

## Designer Studio — portfolio editing
- Each uploaded portfolio can now be edited in place without re-uploading the whole project.
- Manage up to five images per work: choose an existing image as the cover, remove selected images, and add new gallery images.
- Portfolio images are previewed in Designer Studio through a private, authenticated media route, including works waiting for Owner moderation.
- Added an optional per-work starting price on both new uploads and edits. Blank price keeps the work unpriced; a saved price is shown on public portfolio cards and the work case-study details.
- Every portfolio card displays its ART work ID.
- Portfolio cards now use a two-column desktop grid and a single-column mobile layout.

## Owner Dashboard and image layout
- Owner portfolio previews follow the natural width/height ratio of each uploaded image instead of forcing a 16:9 crop.
- Removed the unnecessary card/frame treatment around the Visual Site Studio editor while retaining the live website preview panel.

## Compatibility
- No database migration is required. Existing works keep their current cover and gallery.
- Existing `.env`, MongoDB data, and upload folders must be preserved during installation.
