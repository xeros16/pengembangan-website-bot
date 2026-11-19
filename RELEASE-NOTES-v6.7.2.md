# PIR Visuals v6.7.2 — Voice Lab & Local Information

**Bot package:** 6.7.2  
**Website package:** 3.50.0 (content refresh)  
**Release status:** Development Candidate; production staging acceptance is required.

## 1. Features adopted from the supplied command reference

### Voice Lab

- Added `.voice help` and 46 Voice Lab command entries/aliases for bass/treble, clean, compressor, normalize, echo/reverb, pitch/tempo, chipmunk, nightcore, 8D, stereo, telephone, radio, robot, tremolo, underwater, reverse, volume controls, and basic karaoke reduction.
- Supports replying to WhatsApp voice notes, audio messages, and audio documents.
- Outputs MP3 through FFmpeg. Uses fixed allowlisted filters, numeric tempo validation, bounded input/output/duration, a two-job concurrency cap, and guaranteed temporary-file cleanup.
- `.karaoke` performs simple stereo center reduction. It is not AI vocal separation and may also reduce centered instruments.
- Extreme-volume `earrape` is intentionally excluded.

### Local Information

- Added `.cuaca <kota>` and alias `.weather <kota>` using Open-Meteo geocoding and current weather data.
- Added `.gempa` using BMKG's latest public earthquake feed.
- Requests are timeout-bounded and results are cached briefly in memory.

## 2. Website and discovery

- Updated the public Creative Studio guide with Voice Lab and Local Information cards.
- Command Explorer and generated WhatsApp catalog now include the new commands and two guided workflows.
- Catalog now contains **230 top-level command names**, **24 categories**, and **9 guided workflows**. Voice Lab and Local Information are discoverable through `.menu musik`, `.menu info`, `.alur suara`, `.alur info`, `.help voice`, `.help cuaca`, and `.help gempa`.
- Public asset query token updated to `v=6710`; service-worker cache epoch advanced to `v46`.
- Website package remains v3.50.0; no website runtime dependency was added.

## 3. Commands to try

```text
.voice help
# Reply to a voice note/audio message with:
.bass
.8d
.karaoke
.tempo 1.25

.cuaca Bandung
.cuaca Jakarta
.gempa
```

## 4. Requirements and limits

- Node.js 20 recommended; MongoDB remains required only for the existing database-backed features.
- FFmpeg must be installed and available on `PATH` for Voice Lab. Voice input max 12 MB; processing max 10 minutes; MP3 output max 15 MB.
- Weather and earthquake commands require outbound internet access to Open-Meteo and BMKG.
- No new npm dependency, MongoDB collection, index, or migration.

## 5. Not copied from the source list

OTP/SMS bombing, fake payment/account artifacts, stalker/private-data extraction, access-control bypass, unauthorized DRM circumvention, and other abusive or deceptive commands are not adopted. Existing PIR modules are reused rather than duplicated.

## 6. Staging still required

- Real WhatsApp quoted voice-note/audio-document download and MP3 delivery on Android/iOS.
- FFmpeg availability and resource use on the production host.
- Live Open-Meteo and BMKG endpoint availability from the production network.
- Browser visual acceptance of the Creative Studio page and Command Explorer in Light/Dark Mode.

Do not label this release Stable until the dependency-complete suites and live staging checks pass.
