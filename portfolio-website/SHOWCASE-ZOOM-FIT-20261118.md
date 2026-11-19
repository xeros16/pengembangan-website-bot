# PIR Visuals — Showcase Zoom-Fit Update

Date: 18 November 2026

## Changes
- Media wrapper now shrink-wraps to the intrinsic image/video dimensions instead of behaving as a large fixed empty panel.
- The media side uses the PIR forest-green surface; CSS white backgrounds on image/video elements are explicitly removed.
- Media remains proportional with `object-fit: contain`, no cropping or stretching, and viewport-aware maximum dimensions for browser zoom and smaller screens.
- The left editorial copy panel retains the sage identity color.
- The showcase stylesheet cache version was updated to `20261118e`.

Note: white pixels already embedded in an uploaded artwork remain part of that original artwork; this update removes white backgrounds added by the website layout without altering the creator's file.
