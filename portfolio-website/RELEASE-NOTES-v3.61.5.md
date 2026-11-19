# PIR Visuals — Release Notes v3.61.5

## Homepage showcase image sizing correction
- Removed the accidental 560px maximum size from the desktop showcase image/video.
- Restored the image to its natural dimensions whenever it fits inside the right green panel.
- Kept horizontal and vertical centering in the green panel.
- Preserved the original aspect ratio with `object-fit: contain`; the image only scales down when the available panel width requires it.
- Desktop-only override; mobile layout and the left copy column are unchanged.
- Bumped the showcase stylesheet cache key to `20261118-image-center-q`.
