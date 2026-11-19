PIR Visuals Bot v6.2.0 — Parts Guide

Part 1 and Part 2 are complementary source archives. BOTH are required.
Extract both into the SAME parent folder so their shared PIR-Visuals-v6.2.0/
directory is merged. Neither part is a standalone installation.

Distribution:
- Unique source files in Part 1: 391
- Unique source files in Part 2: 387
- Shared bootstrap/documentation files duplicated in both parts: 8
- Unique source files across both parts: 778
- Every unique source file appears exactly once across the two parts.
- The shared files are identical in both archives and safe to overwrite during extraction.
- Verify the reconstructed folder against RELEASE-MANIFEST-v6.2.0.txt.

Release highlights:
- Anime Discovery: .anime cari, populer, musim, detail.
- Anime & Hiburan category, help/menu/workflow navigation, and natural-language discovery.
- Jikan API integration with SFW filtering, cache, request pacing, timeout, and API error handling.
- Balanced release policy: core PIR work plus at least one general/multifunction feature per release.
- Bot package v6.2.0; website remains v3.46.0.

Read first: PACKAGE-INSTRUCTIONS-v6.2.0.txt and INSTALL_UPDATE_v6_2_0.md.
Production readiness remains conditional until full dependency-backed tests and
local WhatsApp/Jikan staging checks pass.
