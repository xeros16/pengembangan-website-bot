# Sticker Studio v6.6.0

## Commands

- `.sticker` — create a transparent proportional sticker from an image or supported video/animated sticker.
- `.sticker bulat` — crop a static image/sticker into a circle.
- `.sticker 1:1` — crop to a square.
- `.sticker help` — show usage.
- `.resize`, `.crop`, `.imgconvert`, `.compress`, `.ratio`, `.palette`, and `.hd` remain available.

## Processing guardrails

- Image metadata is inspected before Sharp transforms.
- Input maximum: 40 megapixels and 12,000 px on either side.
- Static and animated sticker output must remain at or below 1 MB after pack metadata is added.
- Image transform outputs are capped at 12 MB.
- Animated sticker temporary files are cleaned after success and on failure.
- AI upscaler response must have an image content type, stay within 12 MB, and pass the same dimension validation.

The incoming media download limits and WhatsApp client limits still apply. Real-device sticker acceptance should be run on the target WhatsApp/Baileys version.
