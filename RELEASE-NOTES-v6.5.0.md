# PIR Visuals Bot v6.5.0 — Creative Learning Studio & Media Format Explorer

**Status:** Development Candidate. Source-level tests pass for the features listed below; live WhatsApp, MongoDB, yt-dlp provider, FFmpeg/FFprobe, and browser staging are still required before Stable.

## 1. WhatsApp Learning Cohort

New `.cohort` command creates group-scoped learning programs lasting 1–12 weeks.

- Group Admin or bot Owner creates a cohort; the creator becomes its primary facilitator.
- Members join and leave voluntarily; maximum 50 participants, five facilitators, and 12 milestones per cohort.
- Maximum three unexpired open/active cohorts per group (checked before creation).
- Facilitators can add milestones with a due day, start/close the program, view check-ins, and review work as approved or revision requested.
- Members submit one check-in per milestone, optionally with a public HTTPS work link; resubmission updates the same record.
- Participant progress is private to that participant. Facilitator/Admin summary shows aggregate counts without member ranking or identifiers.
- Personal check-in deletion and full cohort deletion require explicit confirmation.
- Every lookup is scoped by the current WhatsApp group. No public profile, ranking, payment, prize, contract, or automatic certification is created.

## 2. Designer Growth Insights

- `.designcommunity growth` compares recorded learning completions, submissions, reviews given, and reviews received across the latest 30 days versus the previous 30 days.
- Output is private to the requesting account and current group.
- Insights use only recorded activity; they are not AI quality scores, professional ratings, predictions, or public leaderboards.
- Detail reads are bounded to 200 personal and 500 group submissions; learning completion history is bounded by the existing 24-entry history.

## 3. Media Format Explorer

- `.mediaformat` explains the downloader's recognized containers, send-size limits, and supported inspection flow.
- `.mediaformat cek <public-url>` asks yt-dlp for metadata only using `--ignore-config` and `--skip-download`; no media file is downloaded. Inspection has a 15-second per-requester cooldown and at most two concurrent provider calls.
- The result shows a bounded list of recognized audio/video formats and provider metadata.
- `.mediaformat estimasi <preset> <seconds>` estimates output size for `video-wa`, `video-compact`, `audio-mp3`, and `audio-high` presets.
- Estimates use target bitrates plus 8% overhead; they are not guaranteed file sizes and do not perform conversion.
- Video MIME type now follows MP4/M4V, WebM, MOV, and MKV container extensions.

## 4. Website Command Explorer

- Public `/commands` adds four guided workflows: Learning Cohort participant, Cohort facilitator, media preflight, and Designer Growth.
- Workflow steps are generated from the same source registry as WhatsApp command metadata.
- Users can copy a full workflow; the website does not execute WhatsApp commands or access chat history.
- Responsive workflow cards use the existing theme tokens and external CSP-safe script.

## 5. Database and compatibility

- Added `LearningCohort` and `LearningCohortCheckin` collections with unique group/code and per-member/per-milestone check-in indexes.
- Index setup and shared database verifier are additive; existing collections and indexes are not dropped.
- No new npm runtime dependency.
- Bot package: `6.5.0`; website package: `3.48.0`.

## 6. Deferred scope

Multi-round Battle Seasons, automated judging, and prize/payment handling are not part of v6.5.0. Existing Design Battle remains unchanged; a future release may add season grouping only after the current lifecycle is validated in staging. No automatic prize/payment handling is planned.
