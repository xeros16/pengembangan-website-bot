# QA Report — PIR Visuals Website v3.61.0

## Implemented
- Designer Studio work editor: image cover selection, image removal, gallery additions, maximum five images, optional `priceFrom`, and visible `itemId`.
- Private preview route checks the Designer Studio session and only serves media belonging to the signed-in designer.
- Gallery changes update `imagePath` and `galleryPaths` together; removed media is unlinked only when no other portfolio item references it.
- Editing a work returns it to `pending` Owner moderation, matching the existing moderation workflow.
- Desktop two-column portfolio layout and mobile single-column layout.
- Owner image previews use natural image height and width.
- Visual Site Studio editor surface is borderless; live preview panel remains available.
- Public case-study metadata includes the optional starting price.

## Checks
- `npm run check`: PASS.
- Focused Designer Studio + Owner FAQ/layout tests: 13/13 PASS.
- Full repository suite: 470/538 PASS; 68 existing failures remain in older intro, navigation, animation, release/cache, and unrelated workflow tests. No failure is in the new v3.61.0 test file.

## Notes
- No database migration required; the existing `PortfolioItem` schema already supports `priceFrom`, `imagePath`, and `galleryPaths`.
- Browser-level upload/visual verification still needs to be performed against the live local installation with its MongoDB and upload directory.
