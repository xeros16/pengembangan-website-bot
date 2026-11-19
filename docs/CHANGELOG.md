## v6.7.3 — Text-Only Menu & Complete Feature Catalog

- Removed the illustrated menu poster from `.menu`, `.help` without a topic, and `.fitur`; these entry points now send text only.
- Changed `.fitur` default output to list every registered top-level command, grouped by category in a copyable text layout inspired by the supplied reference.
- Generated the complete list from `COMMAND_CATALOG` so new registered commands appear automatically; category filters, search, compact pagination, and workflows remain available.
- Added regression coverage ensuring every catalog entry appears once and no menu image is sent.
- No new runtime dependency, database migration, or website package change.

## v6.7.2 — Voice Lab & Local Information

- Added `.voice` and dedicated audio-effect commands inspired by the supplied bot command list, including bass/treble, denoise, compressor, pitch/tempo, 8D, echo/reverb, stereo, robot, reverse, and basic karaoke center reduction.
- Audio effects use fixed FFmpeg filters, quoted audio only, a 12 MB input cap, 10-minute duration cap, 15 MB MP3 output cap, temporary-file cleanup, and no shell interpolation. Extreme-volume `earrape` behavior is intentionally excluded.
- Added `.cuaca <kota>` using Open-Meteo geocoding/current weather and `.gempa` using BMKG's latest earthquake feed, with bounded cache, timeout, and concise provider errors.
- Updated WhatsApp command discovery, generated command docs, Voice Lab/local-info workflows, website Creative Studio guide, and public asset cache epoch.
- No new npm dependency, MongoDB collection, index, or migration. Live WhatsApp and external-provider staging checks remain required.

## v6.7.1 — Illustrated Feature Menu

- Added a branded six-category PIR Visuals feature-menu poster inspired by the supplied Pixel Realm help layout.
- `.menu`, `.help` without a topic, and `.fitur` send the poster followed by the copyable text navigation/catalog.
- Missing image files or media-send failures gracefully fall back to the existing text menu.
- No new runtime dependency, database migration, or website package change.

## v6.7.0 — Feature Discovery, Anime Provider Resilience & Apple Music Preview

- Added `.fitur`, `.features`, and `.jelajah` with category counts, natural-language search, complete catalog pagination, and guided workflow discovery.
- Added a discovery footer to the WhatsApp main menu and promoted **Semua Fitur Bot** to the website's primary navigation.
- Added AniList GraphQL fallback for Anime Discovery when Jikan fails, rate-limits, times out, or is unreachable.
- Added official Apple public-preview audio delivery from single-song Apple Music URLs through `.music preview`, `.dl apple`, and direct `.dl <Apple Music URL>`.
- Preview downloads use Apple's returned preview URL only, with Apple CDN host allowlist, 15 MB cap, timeout, and content-type validation; full DRM-protected tracks are not downloaded.
- Updated generated command catalog and website Creative Studio documentation. Bot package 6.7.0; website package 3.50.0. No new dependency or database migration.

## v6.6.0 — Creative Asset Studio & Design Seasons

- Added private-by-default `.assetstudio` reference library with explicit group sharing, HTTPS link validation, attribution notes, owner controls, and Admin moderation.
- Added `.designseason` multi-round group competitions with one active season per group, 2–8 rounds, one submission per participant/round, peer review, frozen round scores, and moderation.
- Added `.sticker bulat`, sticker size optimization, 40 MP/12,000 px image input guard, and 12 MB image transform output cap.
- Added `.music top` for Apple Indonesia Top Songs metadata and official Apple links only.
- Added public `/creative-studio` feature guide and Command Explorer workflows; upgraded website to v3.49.0.
- Added additive `designseasons`, `designseasonsubmissions`, and `creativeassets` collections and indexes.

## v6.5.1 — Learning Lifecycle, Privacy & Visual System Refinement

- Learning Cohort duration and milestone deadlines now start from the actual facilitator start action, not the cohort creation date.
- Former participants retain private access to their own recorded progress and can delete their own data after leaving.
- Downloader URL validation rejects additional private/reserved IPv4 and IPv6 literals and common private host suffixes.
- Website loads a same-origin visual-system stylesheet with restrained background motifs, semantic theme tokens, 4.5:1 WCAG AA token contrast checks, and more consistent responsive navigation spacing.
- Command Explorer search now includes guided workflows, separate result counts, and a no-results state.

## v6.5.0 — Creative Learning Studio & Media Format Explorer

- Added group-scoped Learning Cohort programs with opt-in enrollment, facilitator roles, milestones, check-ins, review, private progress, aggregate summaries, and confirmed deletion.
- Added private Designer Growth Insights comparing recorded activity over two 30-day windows.
- Added Media Format Explorer with yt-dlp metadata-only inspection and preset size estimates; inspection never downloads a media file.
- Expanded the public Command Explorer with four guided workflows generated from the WhatsApp command registry.
- Added additive `learningcohorts` and `learningcohortcheckins` indexes; no runtime dependency was added.

## v6.4.0 — Community Challenge & Downloader Reliability

- Added private, group-scoped `.designcommunity ringkasan` for learning, submissions, peer reviews, mentor opt-in, and collaboration signals without exposing JIDs.
- Added timed `.designchallenge battle` lifecycle with Admin/Owner creation, opt-in member entries, one entry per member, group gallery, peer feedback, close, and score summary.
- Added `DesignBattle` persistence and additive unique-code/group-time indexes, including database setup and verification.
- Added read-only `.modstatus` and `.modpreset preview/apply` with explicit confirmation; unrelated group settings are preserved.
- Added public `/commands` Command Explorer generated from the same `COMMAND_CATALOG` as WhatsApp help, with search, category filter, and copy examples.
- Improved downloader with at most one retry for transient network/429 only, per-user phase/status, active subprocess cancellation, optional FFprobe audio metadata, and extension-based MIME.
- No new npm dependency; bot package advanced to 6.4.0 and website package to 3.47.0. Live staging remains required.

## v6.3.0 — PIR Assistant & Music Discovery

- Added `.asisten <kebutuhan>` as a deterministic intent router over the active command catalog; it recommends existing workflows and never executes commands automatically.
- Added Music Discovery commands for song, album, and artist metadata plus track lookup using Apple's public iTunes Search/Lookup API.
- Music results include track IDs for detail lookup, are explicit-filtered, cached in bounded memory, rate-paced, timeout-protected, and link to Apple Music/iTunes when an HTTPS Apple URL is available.
- Improved existing `.song` / `.play` / `.lagu` search output with artist/channel, view count, and upload date when supplied by yt-dlp.
- Added Musik & Audio and Downloader & Media command categories, `.menu musik`, `.alur musik`, help guides, and natural-language search synonyms.
- No new runtime dependency, database migration, or website package change. Live iTunes, yt-dlp/FFmpeg, and WhatsApp delivery still require staging verification.

## v6.2.0 — Balanced Bot Expansion & Anime Discovery

- Added `.anime cari <judul>`, `.anime populer`, `.anime musim`, and `.anime detail <ID>` using public MyAnimeList data through the Jikan API.
- Anime results are SFW-filtered, include short synopsis/score/metadata, and link to MyAnimeList; no unofficial streaming or media downloading is provided.
- Added bounded in-memory caching, serialized request pacing, query/ID validation, request timeout, and friendly 429/network/provider error messages.
- Added Anime & Hiburan category, `.menu anime`, `.alur anime`, `.help anime`, command-catalog metadata, natural-language search for anime-related requests, and generated command documentation.
- Added a balanced release policy: every release should combine core PIR improvements with at least one general bot feature (anime, music/audio, downloader/media, utilities, or similar).
- No database migration, new runtime dependency, or website package change. Live Jikan availability still requires staging verification.

## v6.1.0 — WhatsApp Workflow & Group Safety Upgrade

- Persisted Design Brief Wizard drafts per WhatsApp account and chat for 24 hours using a dedicated MongoDB collection with a compound unique index and TTL index.
- Added `.wizard lanjut`, `.wizard kembali`, `.wizard ulang`, `.wizard status`, and `.wizard batal` flows; users can resume after a bot restart and delete drafts explicitly.
- Added `.antitoxic` with an Admin-managed per-group blocked-word list (maximum 30 single-token entries); disabled by default and based on normalized whole-word matching rather than AI toxicity classification.
- Automatic moderation now shows an Admin review reminder when a member reaches three warnings in a rolling 30-day window; no automatic kick or ban is performed.
- Added database index setup/verification for `designbriefsessions`; website package and runtime dependencies remain unchanged.
- Release audit now rejects local editable `content/texts.json` so installation-specific menu copy is not overwritten in shared archives; the updated template remains in `content/texts.example.json`.

## v6.0.0 — Bot Experience & Intelligence Upgrade

- Added private `.cepat` Quick Access with up to eight command favorites.
- Added optional recent-command history (OFF by default), storing command names only and capped at eight unique commands.
- Restricted Quick Access views/settings to private chats; no command arguments, message text, or media are recorded.
- Added Quick Access discovery to the main menu, onboarding, command catalog, and natural-language search.
- Fixed custom-prefix rendering in design, Learning Path, Community Challenge, and Community Hub tutorial content.
- Split lightweight game command metadata from database-backed runtime handlers for leaner catalog/help tests.
- No schema migration, runtime dependency, or website package update.

## v5.99.0 — Designer Intelligence & Platform Growth

- Guided Designer Finder pada `/discover` dengan preset anggaran, bidang, skill, lokasi, kata kunci, fit sorting, dan alasan kecocokan transparan.
- Featured dan profil ditinjau PIR tidak mendapat bonus fit score.
- Private Portfolio Readiness checklist di Designer Studio; jumlah karya approved dihitung langsung dari database.
- Tidak ada migrasi database, dependency runtime baru, atau perubahan pada batas model hybrid.
- Source checks: 253 JavaScript files lulus; focused tests 28/28 lulus; full website suite 406/407 dan root suite 479/487 karena dependency `mongoose` belum tersedia di environment pengembangan.

## v5.98.0 — Automation, Privacy & End-to-End Experience

- Added opt-in WhatsApp Designer Studio push notifications with private destination capture, WIB quiet hours, retry/backoff, leases, and consent timestamp checks.
- Added a linked-designer private notification-command exception that does not widen general inbound access or group permissions; outbound delivery still passes through the guard.
- Added Designer Studio push preference guidance and onboarding discovery.
- Added designer-controlled revocation of client workspace sessions and pending invitation tokens.
- Rate-limited client invite access and repeated designer invitations; tightened private workspace cache/referrer headers.
- Added a local MongoDB + portfolio-media backup/restore verification command that restores only into a unique isolated database.
- Added optional Playwright E2E configuration and public/mobile/protected-workspace smoke scenarios.
- Added notification outbox index creation and database verification.
- Bumped bot package to 5.98.0, website package to 3.45.0, and public cache epoch to v41.

## v5.97.0 — Directory Quality, Trust & Hybrid Workspace

- Added 24-item directory pagination, accurate filtered totals, query relevance ranking, newest sorting, and additive MongoDB sort indexes.
- Fixed budget search to use overlapping designer price ranges and made inverted budgets explicit.
- Clarified “Profil ditinjau PIR” and email-verified testimonial semantics.
- Added opt-in public availability dates/status while keeping private calendar notes hidden.
- Kept the website project workspace optional and disclosed that PIR does not process or mediate transactions.
- Kept WhatsApp bot as portfolio directory and direct-contact only.

## v5.96.0 — Website ↔ Bot Integration & QA Preparation
- Menyamakan field kontak publik `publicWhatsApp` dan `contactPhone`.
- Menambahkan inbox notifikasi Designer Studio privat melalui `.portfolio notifikasi`.
- Memperluas `.studio` menjadi ringkasan read-only layanan, koleksi, testimoni, ketersediaan, lead, project room, moderasi karya, analytics dan notifikasi; data klien pribadi tidak ditampilkan.
- Mempertahankan metadata website pada schema profil/karya bot dan metrik portfolio views.
- Memperbaiki integration doctor, menambahkan database verifier dan deployment smoke test.
- Menambahkan GitHub Actions CI untuk install dependency dan menjalankan full test suite pada runner berakses npm.
- Membuat database verifier gagal secara terkontrol saat MONGO_URI atau dependency belum tersedia.
- Menambahkan user guide, install guide, staging access requirements, dan recovery runbook. Full live staging tetap diperlukan.

## v5.95.0 — Production Readiness & Support Hardening

- Added `.ticket detail <ID>` so ticket owners, the originating group Admin, and the bot Owner can read the latest 15 messages without exposing sender JIDs.
- Ticket owners retain access to their own ticket from any chat; Admin access is independently scoped to the ticket's originating `groupJid`.
- Added best-effort abuse throttles: at most five newly created tickets per account per rolling 24 hours, while preserving the three-open-ticket limit; at most three reports per member/group per rolling 10 minutes.
- Added query indexes for reporter/group report throttling and per-account ticket creation history.
- Added regression coverage for ticket transcript privacy, cross-group ticket isolation, ticket creation throttling, and report throttling.
- Full dependency-backed tests and live staging remain conditional because `mongoose` is not installed in this execution workspace; no production-stable claim is made.

## v5.94.0 — Product Stabilization & Support System

- Added `.support` unified help center with FAQ keyword filtering, ticket instructions, and group-report guidance.
- Registered Support Center in the command catalog and beginner start menu.
- Tightened ticket reply authorization: group Admins can only reply to tickets from their originating group; bot Owner can reply globally.
- Tightened ticket closure to ticket owner, originating group Admin, or bot Owner.
- Limited each account to three open tickets, ticket subjects to 180 characters, replies to 1,200 characters, and message history to the latest 100 entries.
- Added ticket/report display names and removed internal JID values from group-facing support output.
- Added group-scoped report detail/close actions and Owner global report resolution.
- Rejected self-reports and report reasons shorter than eight characters.
- Improved `.health` with live WhatsApp connection lifecycle state and combined readiness.
- Kept `/health` and `/ready` loopback-only and kept support commands available during maintenance mode.
- Added additive Report/Ticket schema fields and compound indexes.
- Added isolated support/ticket/report/health regression tests and updated release documentation.

## v5.93.0 — Community Intelligence & Engagement

- Added `.designcommunity` Community Hub for opt-in group profiles, mentor matching, learning interests, and collaboration discovery.
- Added per-group `CommunityProfile` records with explicit mentor/learner opt-in, skill topics, optional introduction, off switch, and profile deletion.
- Added mentor search that only returns visible, opted-in profiles from the current group and never publishes private phone/JID values.
- Added private-on-demand participation milestones derived from completed lessons, active challenge submissions, peer reviews, mentor opt-in, and collaboration participation.
- Added group-scoped Designer Collaboration Board with unique project codes, brief, required skills, 2–5 member capacity, and maximum three open projects per owner per group.
- Added join/leave/close flows; slot capacity is checked atomically in MongoDB, duplicate/self-join is rejected, and only project owner/group Admin may close a project.
- Added `CommunityProfile` and `CommunityCollaboration` models/indexes without modifying existing learning progress or challenge submission records.
- Updated tutorial content, onboarding recommendations, natural-language command discovery, command catalog, README, roadmap, install guide, QA report, and operations runbook.
- Added isolated tests for mentor opt-in, group scoping, opt-out/deletion, achievement calculation, collaboration capacity, membership, ownership, and database/group guards.
- Website runtime and website package version are unchanged; root bot package is v5.93.0.

## v5.92.0 — Learning Path & Community Challenge

- Expanded `.designlearn` into a persistent 12-module learning path across beginner, intermediate, and advanced levels.
- Added saved active module, manual completion, next-module navigation, progress summary, path overview, and explicit reset confirmation using `User.preferences.learningProgress`.
- Preserved legacy `.designlearn <level> [topic]` syntax and offline reading when MongoDB is unavailable.
- Changed daily/weekly challenge periods to Asia/Jakarta (WIB), avoiding UTC-midnight confusion for the Indonesian community.
- Added group-scoped challenge submissions with an HTTPS artwork link or image message, a short submission code, and one updatable entry per member per challenge.
- Added a group-only artwork gallery, one-per-member constructive peer feedback, personal participation summary, and contribution board.
- Added `LearningSubmission` model/indexes; no destructive migration and no automatic publication to the public designer directory.
- Updated learning/challenge tutorials, command catalog, README, roadmap, install guide, QA report, and operations runbook.
- Added regression tests for WIB date boundaries, learning persistence/progression, submission/gallery group isolation, HTTPS validation, and peer-review restrictions.
- Validation and staging limitations are recorded in `QA_REPORT_v5_92_0.md`.

## v5.91.0 — Designer Portfolio & Direct Contact Directory

- Reframed the bot marketplace as a portfolio discovery directory with direct designer contact only.
- Removed active bot handling for design requests, offers, order lifecycles, service packages, manual payment ledger, finance dashboard, transaction ratings, notifications, and dispute mediation.
- Legacy MongoDB schemas remain for historical data preservation; the active bot feature no longer imports or queries those collections.
- Added an explicit public WhatsApp contact field. The number is normalized and displayed only when the designer opts in; internal `contactJid` is never exposed as a fallback.
- Reworked the profile wizard to collect public name, bio, specialties, optional location, and optional public WhatsApp contact; removed price prompts.
- Removed price display and transaction rating from public directory results; search now focuses on approved work, category, style, location, and public profile text.
- Added location search and a portfolio-only Designer Studio summary with work moderation status, profile/portfolio views, and contact clicks.
- Reworked Owner dashboard to moderate profiles, portfolio items, and user reports only.
- Legacy commands `.requestdesign`, `.client`, `.klien`, `.service`, and `.layanan` now return migration guidance and do not create transaction records.
- Updated onboarding recommendations, help guides, tutorial texts, command catalog, and marketplace documentation to reflect the direct-contact model.
- Automated tests and staging requirements are recorded in `QA_REPORT_v5_91_0.md`.

## v5.90.0 — Designer Workflow 2.0

- Added a six-stage project pipeline: brief → concept → layout → visual system → QA → handoff.
- Added `.designproject start`, `.step`, `.done`, `.progress`, `.board`, and `.reopen` while preserving existing workspace commands.
- Stage guidance is tailored to the saved project's design type and links to existing tools instead of duplicating studio commands.
- Completion requires an explicit member confirmation and advances sequentially; skipping is rejected.
- Reopening a completed stage resets downstream stages so the project timeline remains coherent.
- Duplicate projects retain the brief but start with a fresh workflow.
- Added workflow progress to project list, board, detail, flow summary, and export brief.
- Preserved compatibility with older project records; legacy records without workflow begin at Brief and require no schema migration.
- Serialized workspace operations per WhatsApp JID within one bot process to reduce concurrent lost updates.
- Added tests for stage transitions, reopening, legacy compatibility, project isolation, duplicate reset, board/progress, and concurrent mutations.
- Validation: root 453/453; website 384/384; JavaScript syntax 225 files; website syntax and release audit passed.
- Validation status and known staging limitations are recorded in `QA_REPORT_v5_90_0.md`.

## v5.89.0 — Beginner Experience & Guided Onboarding

- Added a two-step `.mulai` onboarding flow that asks users what they want to do and how experienced they are.
- Added goal- and skill-level-based recommendations for design, learning, image processing, finding services, offering design services, community use, and games.
- Stores onboarding preferences in `User.preferences.onboarding` when MongoDB is ready; keeps an in-process fallback when persistence is unavailable. No schema migration is required.
- Added `.mulai cepat`, `.mulai profil`, `.mulai ulang`, and `.mulai batal` flows.
- Isolated onboarding sessions per member/chat and cleared an unfinished brief wizard when a new onboarding flow starts, preventing competing text prompts.
- Added `.cari <need>` with Indonesian/English synonym expansion and relevance ranking; `.commands cari` uses the same discovery engine.
- Extended `.alur` with service discovery, designer onboarding, community, and game workflows.
- Improved the main menu and default group welcome copy to point new members toward guided onboarding and need-based search.
- Added tests for onboarding sessions, persistence, custom prefixes, cancellation, search ranking, and expanded workflows.
- Added `npm run audit:release` as a first-class package script and expanded the audit to reject local allowlist backups, custom runtime config, and temporary upload/backup directories.
- Automated baseline before changes: root suite 419/419. Release candidate validation is recorded in `QA_REPORT_v5_89_0.md`.

## v5.88.0 — Final Audit & Release Candidate

- Tightened the shared Content Security Policy with explicit same-origin script and connect sources.
- Removed CSP-blocked inline event handlers and replaced them with delegated first-party interactions for image fallback, collection link selection, and delete confirmation.
- Protected collection edit-key responses with `no-store`, `no-referrer`, and `noindex`; kept public collection pages cacheable only when no edit key is present.
- Unified QR page response headers with the shared secure HTML shell and corrected its image policy.
- Restricted `/health` to GET/HEAD and expanded smoke checks to verify GSAP and ScrollTrigger assets.
- Added HTTP route tests, JavaScript bundle parsing checks, and WCAG AA contrast-token checks.
- Validation: root 416/416; website 376/376; root syntax 217 files; website syntax passed.
- Staging still required for live MongoDB, SMTP, WhatsApp, Sharp/GSAP runtime, TLS/proxy, backup restoration, and real-browser desktop/mobile validation.

## v5.23.0 — Designer Workflow (development candidate)

- Added `.briefbuilder` as a discoverable alias for the existing seven-step `.wizard` flow; no parallel brief session system was introduced.
- Added `.moodboard` for an offline-first visual direction brief: mood, palette, typography, imagery, composition, and reference keywords.
- Added `.designcritique` rubric for structured design evaluation. Optional image-based AI analysis uses the existing vision integration only when `OPENAI_API_KEY` is configured; otherwise it explicitly states that no image analysis occurred.
- Preserved the existing group peer-review commands `.critique` and `.rate`, plus the existing `.brandkit` and `.designproject` workflows.
- Added focused regression tests and updated the Designer menu/catalog.
- Limitations: moodboard output is a text direction brief, not an automatically assembled image collage; AI image critique requires a working provider key/network and was not live-verified.

# Changelog

## v5.70.0 — Portfolio Storytelling & Workspace Experience

- Collection & Moodboard detail pages now use an image-led editorial cover, selected-work grid, ordered designer cards, and concise board statistics.
- Collection creation has a live preview that reflects title, creative direction, and deduplicated designer/work ID counts, with helper copy explaining where to find IDs.
- Collection owners can reorder and remove artwork with drag controls or keyboard-operable move buttons; focus is retained after removal, and the existing `itemIds` POST field remains the persistence contract.
- Public share buttons use the canonical public path and do not copy the private edit key. Private boards do not expose a public share button.
- Portfolio case studies receive sticky chapter navigation only when four or more meaningful sections are available.
- Designer Studio displays a setup checklist derived from existing profile, approved-work, service, and availability data.
- Existing routes and data models are retained; no bot or game source was changed.
- Website regression: 212/212 passed; root regression: 387/387 passed; JavaScript syntax: 173 files; Playwright representative QA: 0 browser errors, 0 broken images, and no horizontal overflow at 320–1440px. Backend live integration remains unverified without the user's MongoDB/WhatsApp environment.


## v5.22.1 — Inspiration & Portfolio Learning Expansion (candidate)
- Menambahkan `.designchallenge` dengan challenge harian/mingguan deterministik berbasis kalender UTC, filter kategori, brief, batasan, output, dan evaluasi mandiri.
- Menambahkan `.portfolioguide` untuk checklist publikasi, builder case study, dan bio desainer.
- Memperluas `.designinspire` dan `.designlearn` yang sudah ada tanpa mengganti implementasi atau mengubah format command sebelumnya.
- Mendaftarkan command baru pada router dan katalog; memperbarui menu Designer, contoh command, dokumentasi, dan status fitur.
- Menambahkan tes untuk rotasi challenge, kategori, template portfolio, input kosong, routing, dan katalog.
- Batasan: tidak ada penyimpanan progres challenge/portfolio; tidak ada penilaian otomatis atas karya; tautan inspirasi eksternal tidak memverifikasi lisensi.
- Pemeriksaan sintaks: 170 file JavaScript OK; tes fokus `design-learning.test.js`: 11/11 lulus.
- Full test suite: 335 lulus, 6 gagal dijalankan karena paket `node-fetch` tidak tersedia di lingkungan; `npm ci` belum berhasil diselesaikan.
- Menambahkan `.env.example` tanpa kredensial nyata untuk memenuhi konfigurasi awal dan tes setup doctor.
- Status kandidat; MongoDB dan WhatsApp live belum diuji.

## v5.22.0 — Designer Menu & Command Discovery
- Merombak `menuDesigner` menjadi Designer Workspace yang mengelompokkan brief/workflow, typography, color, layout/social/UX, QA/produksi, resource/image, dan branding.
- Menambahkan empat tools v5.21.0 yang sebelumnya belum tampil di menu: `.fontstudio`, `.layoutstudio`, `.socialkit`, dan `.resourcefind`.
- Menampilkan pintasan tools yang sudah aktif seperti `.designsystem`, `.uxaudit`, `.uxflow`, `.paletteview`, dan `.palettekit`.
- Menambahkan alur penggunaan yang disarankan serta catatan lisensi, safe area, akses premium, dan kebutuhan API.
- Menyinkronkan `content/texts.json` dengan `content/texts.example.json`.
- Memperbaiki contoh perintah `.fontstudio`, `.layoutstudio`, `.socialkit`, dan `.resourcefind` pada katalog agar tidak tertimpa deskripsi.
- Menambahkan tes regresi untuk kelengkapan menu dan deskripsi/contoh katalog.
- Belum dilakukan uji WhatsApp live atau verifikasi seluruh resource/lisensi secara eksternal.

## v5.21.0 — Design Studio Expansion
- Added Typography Pairing Studio 2.0 command `.fontstudio`.
- Added Layout & Composition Studio `.layoutstudio`.
- Added Social Media Design Toolkit `.socialkit`.
- Added Design Resource Finder `.resourcefind` with per-source license caveats.
- Kept existing `.fontpair`, `.typography`, and existing design commands unchanged.

Perubahan lokal — belum menjadi rilis

## FontPair Studio Expansion — 9 November 2026

- Menambahkan live preview Google Fonts melalui dokumen HTML yang memuat keluarga font asli dari Google Fonts CSS2 API; pasangan diverifikasi sebelum file dikirim. File perlu dibuka di browser dengan koneksi internet.
- Menambahkan moodboard/brand matcher melalui `.fontpair mood <brief>` dan `.fontpair brand <brief>`, dengan pemeringkatan pasangan dari kata kunci karakter, industri, dan gaya.
- Menambahkan rekomendasi berbasis kebutuhan melalui `.fontpair recommend <kebutuhan>` / `.fontpair rekomendasi <kebutuhan>`.
- Menambahkan pencarian nama font melalui `.fontpair search <nama>`; hasil lokal dilengkapi tautan pencarian Google Fonts.
- Menambahkan favorit pribadi `.fontpair save <nomor>`, `.fontpair favorites`, dan `.fontpair unsave <nomor>`, disimpan per JID di MongoDB dengan indeks unik.
- Mempertahankan 33 pasangan font, pagination, serta preview PNG yang sudah ada. Menu Designer dan bantuan diperbarui agar fitur baru mudah ditemukan.
- Tes fokus FontPair + Menu Designer: 16/16 lulus; pemeriksaan sintaks: 159 file OK. Full suite: 292 lulus, 6 gagal dijalankan karena dependensi `node-fetch` tidak terpasang di lingkungan ini (jalankan `npm ci` sebelum pengujian penuh).
- Belum dilakukan uji integrasi pada MongoDB produksi atau sesi WhatsApp live.

- Menambahkan kategori navigasi `{prefix}menu designer` sebagai pusat Designer Tools.
- Menambahkan `menuDesigner` pada `content/texts.json`, memisahkan tools aktif dari fitur roadmap.
- Memperluas `.fontpair` menjadi 33 kurasi pasangan font, pencarian berbasis tag gaya/industri, dan mode `.fontpair semua [halaman]` dengan 12 hasil per halaman.
- Menambahkan preview visual FontPair: `.fontpair preview <gaya|nomor>` mengirim kartu PNG berisi spesimen judul/body dan keterangan pasangan font melalui WhatsApp. Preview memakai fallback sistem jika font spesifik tidak tersedia; cek font asli di aplikasi desain sebelum produksi.
- Menambahkan tes navigasi Menu Designer dan regresi FontPair.

# Catatan roadmap (perencanaan; bukan rilis versi)

- Menetapkan arah produk menjadi **Designer Community & Creative Tools Platform**.
- Menyusun ulang urutan rencana setelah kandidat v5.19.0: v5.20.0 Designer Tools Expansion, v5.21.0 Downloader & Media Tools, v5.22.0 Command Center & UI/UX, dan v5.23.0 Database Stability & Performance.
- Mendokumentasikan tools desainer yang sudah ada dan membedakannya dari pengembangan yang masih direncanakan.
- Rincian dan kriteria selesai: `docs/ROADMAP.md`.
- Catatan ini tidak mengubah nomor versi aplikasi dan tidak menyatakan fitur roadmap telah diimplementasikan.

# Changelog

## v5.22.1 — Inspiration & Portfolio Learning Expansion (candidate)
- Menambahkan `.designchallenge` dengan challenge harian/mingguan deterministik berbasis kalender UTC, filter kategori, brief, batasan, output, dan evaluasi mandiri.
- Menambahkan `.portfolioguide` untuk checklist publikasi, builder case study, dan bio desainer.
- Memperluas `.designinspire` dan `.designlearn` yang sudah ada tanpa mengganti implementasi atau mengubah format command sebelumnya.
- Mendaftarkan command baru pada router dan katalog; memperbarui menu Designer, contoh command, dokumentasi, dan status fitur.
- Menambahkan tes untuk rotasi challenge, kategori, template portfolio, input kosong, routing, dan katalog.
- Batasan: tidak ada penyimpanan progres challenge/portfolio; tidak ada penilaian otomatis atas karya; tautan inspirasi eksternal tidak memverifikasi lisensi.
- Status kandidat; MongoDB dan WhatsApp live belum diuji.

## v5.20.1 — Typography Studio & Design QA (candidate) — 1 November 2026

### Ditambahkan
- `.typography hierarchy|size|check` (Typography Studio): hierarki font per jenis desain, pedoman ukuran digital/cetak, dan pemeriksaan konsistensi tipografi dengan prioritas perbaikan.
- `.qareview` (Design QA Review): pemeriksaan kontras, hierarki, tipografi, target sentuh, CTA, alt text, bleed, dan resolusi per jenis desain dari angka yang diisi pengguna.
- Modul baru di `features/design-studio/`; dokumentasi di `docs/DESIGN-STUDIO-v5.20.1.md` dan `docs/audit-designer-workspace-v5.20.1.md`.

### Diperbaiki
- `.designproject flow` kini bekerja untuk proyek dengan jenis bebas yang memuat jenis yang didukung, dan menjelaskan jika jenis tidak didukung.
- `.designproject list status|jenis` tanpa nilai atau dengan status tidak dikenal kini menampilkan petunjuk, bukan "tidak ada proyek yang cocok".
- Versi `package.json`/`package-lock.json` disinkronkan (sebelumnya 5.19.0 pada paket v5.20.0).
- `docs/commands.md` diregenerasi (sebelumnya usang: 144 perintah, katalog sebenarnya 151; kini 153).
- Dua tes usang di `tests/general-help.test.js` diperbarui (alur poster memakai `.designqa`; total perintah dihitung dari katalog).

### Pengujian
- Ditambahkan 38 tes baru: Typography Studio, QA Review, dan isolasi data lintas pengguna untuk seluruh aksi `designproject`.
- Status: kandidat pengembangan; MongoDB staging dan WhatsApp live belum diuji.

## v5.20.0 — Designer Tools Expansion (work in progress)

### Color Studio harmony generator — 1 November 2026
- Memperluas `.colorpalette` agar menerima HEX utama dengan skema complementary, analogous, triadic, dan monochromatic.
- Mempertahankan preset palet bernama yang sudah tersedia.
- Menambahkan validasi warna dan nama skema serta tes regresi untuk seluruh skema.
- Tetap mendukung preset palet bernama yang telah ada.
- Menambahkan dokumentasi format pada bantuan dan roadmap.
- Generator menghasilkan rekomendasi awal; pengguna tetap perlu memeriksa kontras sebelum produksi.

### Designer Workspace export — 1 November 2026
- Menambahkan `.designproject export <nama>` untuk menghasilkan ringkasan brief teks yang mudah disalin.
- Ringkasan mencakup jenis, status, tema, audiens, platform, palet, tipografi, dan timestamp proyek.
- Menambahkan pintasan export pada detail proyek, katalog command, bantuan, dan roadmap.
- Menambahkan tes regresi untuk kelengkapan export dan memastikan operasi export tidak mengubah data tersimpan.
- Export hanya menghasilkan teks; tidak membuat, mengunggah, atau mengirim file desain.
- Status: pekerjaan v5.20.0; bukan rilis final.

### Designer Workspace enhancement — 1 November 2026
- Menambahkan edit field preset tanpa mengosongkan field yang tidak diubah.
- Menambahkan pencarian dan filter proyek berdasarkan status atau jenis.
- Menambahkan duplikasi proyek dengan status awal `planning`.
- Menambahkan riwayat perubahan maksimal 20 entri per proyek.
- Menambahkan template awal untuk poster, logo, sosial, web, app, dan kemasan.
- Menghubungkan `.designproject flow <nama>` ke `.designflow` dengan data preset tersimpan.
- Menambahkan tes regresi untuk fitur workspace tersebut.
- Status: perubahan pengembangan; bukan rilis produksi.

- Meningkatkan `.creative` menjadi Creative Concept Studio dengan tiga arah konsep yang deterministik, bukan pengacakan hasil yang tidak stabil.
- Menambahkan deteksi kategori untuk identitas brand, kemasan, antarmuka digital, konten sosial, banner, dan poster/editorial.
- Menambahkan arahan produksi untuk fokus visual, komposisi, warna, tipografi, dan QA sesuai kategori.
- Menambahkan prompt teks siap salin dan pintasan integrasi ke Brief Wizard, Color Studio, Typography Studio, serta Design Review.
- Memperbarui katalog perintah dan bantuan agar format input opsional gaya dan platform/ukuran dapat ditemukan.
- Menambahkan tes regresi untuk kategori kemasan, UI digital, tiga arah konsep, dan bantuan input.
- Status: pekerjaan v5.20.0 berlangsung; bukan rilis final.
- Menambahkan `.designproject` untuk menyimpan, memperbarui, melihat, dan menghapus hingga 10 preset brief pribadi per akun pada MongoDB.


## v5.20.0 — Designer Tools Expansion (work in progress)

### Designer Workflow Integration
- Memperluas `.designflow` menjadi alur terpadu brief → produksi → design direction → spesifikasi → prompt → QA → handoff.
- Menambahkan rekomendasi palet awal deterministik berdasarkan kata kunci tema (minimalis, futuristik, elegan, alam, retro, pastel).
- Menambahkan arahan tipografi berdasarkan jenis output dan spesifikasi ukuran awal untuk digital/cetak.
- Menambahkan pintasan langsung ke `.colorpalette`, `.typescale`, `.designqa`, `.handoff`, dan `.designsystem`.
- Membatasi panjang field input dan merapikan newline untuk menjaga output WhatsApp tetap terkendali.
- Menambahkan tes integrasi untuk workflow web dan kemasan.
- Catatan: rekomendasi warna/ukuran adalah titik awal, bukan spesifikasi final atau pemeriksaan otomatis atas file desain.

## v5.19.0 — Security & Access Control Audit (candidate)

### Hardening lanjutan — 1 November 2026
- Menyamakan pemeriksaan akses inbound di command handler dengan satu helper `isInboundChatAllowed`.
- Memastikan bypass Owner hanya berlaku untuk JID chat pribadi yang valid; JID grup tetap harus lolos allowlist walaupun flag konteks tidak konsisten.
- Menambahkan opsi `.allowlist group add <JID-grup>` dan `remove <JID-grup>` dari chat pribadi Owner untuk bootstrap grup tanpa membuka akses Owner di grup yang belum diizinkan.
- Menghapus isi pesan dari log inbound dan JID tujuan dari log outbound yang diblokir untuk mengurangi paparan data pribadi.
- Memperbarui README dan panduan access control agar konsisten dengan kebijakan Owner.
- Menambahkan tes regresi untuk bypass Owner, validasi tipe tujuan, dan penggunaan shared gate oleh command handler.
- Status tetap kandidat; pengujian penuh belum selesai karena instalasi dependensi mengalami timeout.

- Batasi bypass inbound Owner hanya untuk chat pribadi yang identitasnya terverifikasi.
- Pesan Owner di grup tetap wajib melewati allowlist grup.
- Daftarkan JID pribadi Owner yang terverifikasi (nomor WhatsApp atau LID) sebagai tujuan balasan outbound; grup tidak pernah otomatis disetujui.
- Tambahkan tes regresi untuk Owner private chat, Owner di grup, dan isolasi konfigurasi allowlist pada tes MongoDB.
- Perbarui ekspektasi tes katalog agar sesuai dengan judul implementasi.
- Status: kandidat; perlu audit menyeluruh, pengujian akhir, dan verifikasi operasional sebelum rilis resmi.

# Changelog

## v5.22.1 — Inspiration & Portfolio Learning Expansion (candidate)
- Menambahkan `.designchallenge` dengan challenge harian/mingguan deterministik berbasis kalender UTC, filter kategori, brief, batasan, output, dan evaluasi mandiri.
- Menambahkan `.portfolioguide` untuk checklist publikasi, builder case study, dan bio desainer.
- Memperluas `.designinspire` dan `.designlearn` yang sudah ada tanpa mengganti implementasi atau mengubah format command sebelumnya.
- Mendaftarkan command baru pada router dan katalog; memperbarui menu Designer, contoh command, dokumentasi, dan status fitur.
- Menambahkan tes untuk rotasi challenge, kategori, template portfolio, input kosong, routing, dan katalog.
- Batasan: tidak ada penyimpanan progres challenge/portfolio; tidak ada penilaian otomatis atas karya; tautan inspirasi eksternal tidak memverifikasi lisensi.
- Status kandidat; MongoDB dan WhatsApp live belum diuji.

## v5.18.0 — Game UX Overhaul

- Menetapkan alur penggunaan yang lebih eksplisit untuk keenam game utama: bantuan, mulai, format jawaban, status/skor, dan penghentian permainan.
- Memperjelas panduan Game Center dan langkah penggunaan Multiplayer untuk Sambung Kata, Kuis Rebutan, serta Duel Suit.
- Memperbaiki pesan panduan Multiplayer agar selalu mengikuti prefix bot yang dikonfigurasi, bukan mengunci contoh ke `.`
- Menyelaraskan dokumentasi Multiplayer dengan implementasi penyimpanan snapshot MongoDB dan perilaku saat database offline.
- Menambahkan tes regresi untuk prefix kustom dan panduan awal ruang Multiplayer.
- Tidak mengubah mekanisme inti permainan.


## v5.17.0 — Game Center menyeluruh & UX game

- Memperjelas bahwa bot memiliki banyak game, bukan hanya Pixel Realm.
- Mengelompokkan menu game menjadi RPG, tebak/kata, investigasi, dan multiplayer.
- Memisahkan permainan utama dari sistem pendukung profil pemain dan misi harian.
- Memperbarui `.games`, `.game`, `.menu game`, dan `.tutorial game` agar menampilkan perintah dan langkah awal yang relevan.
- Memperbaiki kategori katalog perintah agar game tidak lagi semuanya diberi label Pixel Realm.
- Memperbarui dokumentasi Game Center dan panduan penggunaan.

# Changelog

## v5.22.1 — Inspiration & Portfolio Learning Expansion (candidate)
- Menambahkan `.designchallenge` dengan challenge harian/mingguan deterministik berbasis kalender UTC, filter kategori, brief, batasan, output, dan evaluasi mandiri.
- Menambahkan `.portfolioguide` untuk checklist publikasi, builder case study, dan bio desainer.
- Memperluas `.designinspire` dan `.designlearn` yang sudah ada tanpa mengganti implementasi atau mengubah format command sebelumnya.
- Mendaftarkan command baru pada router dan katalog; memperbarui menu Designer, contoh command, dokumentasi, dan status fitur.
- Menambahkan tes untuk rotasi challenge, kategori, template portfolio, input kosong, routing, dan katalog.
- Batasan: tidak ada penyimpanan progres challenge/portfolio; tidak ada penilaian otomatis atas karya; tautan inspirasi eksternal tidak memverifikasi lisensi.
- Status kandidat; MongoDB dan WhatsApp live belum diuji.

## v5.16.0 — Consistent Reply UX Audit

- Memperkuat normalisasi semua balasan teks: membersihkan ANSI escape, CRLF, newline literal, non-breaking space, tab, dan baris kosong berlebih.
- Memperbarui menu Tools dengan pencarian Pinterest/Bing dan pencarian katalog perintah.
- Memperbarui menu Marketplace dengan Client Center serta pelacakan status dan aktivitas pesanan.
- Memperbarui menu Game dengan perintah multiplayer, papan skor, dan keluar ruang.
- Memperbarui menu Owner dengan panduan pencarian allowlist.
- Menyederhanakan pengantar katalog agar cara mencari, membuka detail, dan berpindah kategori lebih jelas.
- Tidak mengubah izin, transaksi, database, maupun perilaku inti handler.

## v5.15.0 — UX teks dan navigasi

- Merapikan normalisasi teks WhatsApp: newline literal, spasi berlebih, CRLF, dan paragraf kosong.
- Memperbaiki pengantar katalog perintah yang sebelumnya menyimpan newline sebagai teks literal.
- Menambahkan pencarian katalog: `.commands cari <kata kunci>` (juga menerima `search` dan `find`).
- Memadatkan tampilan daftar perintah agar contoh dan informasi penting lebih mudah dipindai.
- Menambahkan panduan eksplisit untuk `.allowlist` dan pelacakan marketplace `.requestdesign status/activity`.
- Memperbarui beranda, menu tools, marketplace, game, dan owner agar memuat fitur terbaru.
- Pesan balasan panjang kini dipecah pada batas paragraf/baris, bukan dipotong diam-diam.
- Tetap menggunakan navigasi teks; tidak menambahkan tombol/list interaktif WhatsApp.

## v5.14.0 — Text-Only Navigation

- Menghapus seluruh menu interaktif WhatsApp berbasis list/button dari navigasi utama, Design Studio, Marketplace, dan Tutorial.
- Semua navigasi kini menggunakan pesan teks biasa dengan instruksi perintah yang bisa diketik, sehingga tidak bergantung pada dukungan tombol dari aplikasi WhatsApp.
- Menghapus pemetaan balasan row/button interaktif yang sudah tidak diperlukan; perintah teks dan alias kategori tetap dipertahankan.
- Mempertahankan perubahan v5.13.0, termasuk pencarian allowlist `.allowlist search`, filter grup/kontak, serta fitur pencarian yang ada di paket sumber.
- Menambahkan tes untuk memastikan jalur navigasi tidak lagi mengirim list/button interaktif.

## v5.13.0 — Access Manager Search

- Menambahkan `.allowlist search <kata kunci>` untuk mencari grup dan kontak yang diizinkan berdasarkan alias, nama WhatsApp yang tersimpan, JID/ID, atau catatan internal.
- Menambahkan filter `.allowlist search group <kata kunci>` dan `.allowlist search contact <kata kunci>`.
- Pencarian hanya-baca, dibatasi maksimal 10 hasil di chat, dan tetap dilindungi izin Owner.
- Menambahkan tes untuk pencarian case-insensitive, filter tipe, pencarian JID/catatan, batas hasil, dan memastikan data tidak berubah saat dicari.
- Mempertahankan penyimpanan MongoDB, backup lokal `.bak`, serta perilaku pemulihan yang sudah ada.
- Validasi produksi MongoDB dan WhatsApp live tetap diperlukan; rilis ini tidak mengklaim menguji koneksi produksi.

## v5.7.0 — Design System & UX Flow Studio

- Menambahkan `.designsystem` untuk starter token visual, tipografi, spacing, radius, pola komponen, dan QA.
- Menambahkan `.uxflow` untuk alur web, app, bot, marketplace, dan checkout beserta checklist pengujian.
- Memasukkan kedua perintah ke bantuan dan katalog supaya mudah ditemukan.
- Fokus rilis tetap pada tools desain dan pengalaman pengguna; template tidak diklaim sebagai hasil audit atau usability test otomatis.

## v5.6.0 — Design Prompt Studio

- Menambahkan `.designprompt` untuk menyusun prompt visual siap salin berdasarkan jenis desain, tema, audiens, dan gaya.
- Menambahkan panduan pemakaian di bantuan perintah dan katalog perintah.
- Prompt menekankan hierarki visual, keterbacaan, margin aman, dan konsep orisinal; bot menjelaskan bahwa perintah menghasilkan teks, bukan gambar otomatis.
- Menambahkan tes unit untuk format prompt, registrasi perintah, dan petunjuk penggunaan.

## v5.2.0 — Marketplace Guided UX

- `.portfolio help` / `.portfolio bantuan` now provide a quick-start path for designers, from profile creation to public preview and studio.
- `.cancel` now confirms which active workflow was cancelled (profile, portfolio work, or design request) and clarifies that temporary wizard data was cleared.
- Existing marketplace permissions, order states, and payment behavior are unchanged.

## v5.0.0 — UI/UX Refresh & Owner Navigation

- Menambahkan pusat bantuan Owner `.marketadmin help` dengan daftar submenu dan contoh format yang konsisten.
- Menambahkan pagination 5 item per halaman pada antrean pembayaran, pesanan, desainer, laporan, rating, dan performa.
- Memperjelas judul, posisi halaman, jumlah data, dan petunjuk navigasi agar keluaran WhatsApp lebih mudah dipindai.
- Mengganti pesan submenu tidak dikenal menjadi arahan bantuan yang spesifik.
- Menjaga akses dashboard tetap Owner-only dan mempertahankan label batasan ledger pembayaran manual.
- UI/UX menjadi bagian dari checklist setiap rilis berikutnya; perbaikan dilakukan bertahap berdasarkan alur yang paling sering dipakai dan hasil uji pengguna.

## v4.5.0 — Owner Finance & Performance Dashboard

- Tambah laporan keuangan marketplace per bulan dengan agregasi nominal dan jumlah catatan berdasarkan status.
- Tambah antrean catatan pembayaran terbaru dengan filter status untuk Owner.
- Tambah peringkat performa desainer berdasarkan pesanan selesai.
- Tegaskan batasan: ledger manual bukan integrasi bank, escrow, audit rekening, atau laporan laba bersih.

# Changelog

## v5.22.1 — Inspiration & Portfolio Learning Expansion (candidate)
- Menambahkan `.designchallenge` dengan challenge harian/mingguan deterministik berbasis kalender UTC, filter kategori, brief, batasan, output, dan evaluasi mandiri.
- Menambahkan `.portfolioguide` untuk checklist publikasi, builder case study, dan bio desainer.
- Memperluas `.designinspire` dan `.designlearn` yang sudah ada tanpa mengganti implementasi atau mengubah format command sebelumnya.
- Mendaftarkan command baru pada router dan katalog; memperbarui menu Designer, contoh command, dokumentasi, dan status fitur.
- Menambahkan tes untuk rotasi challenge, kategori, template portfolio, input kosong, routing, dan katalog.
- Batasan: tidak ada penyimpanan progres challenge/portfolio; tidak ada penilaian otomatis atas karya; tautan inspirasi eksternal tidak memverifikasi lisensi.
- Status kandidat; MongoDB dan WhatsApp live belum diuji.

## v5.16.0 — Consistent Reply UX Audit

- Memperkuat normalisasi semua balasan teks: membersihkan ANSI escape, CRLF, newline literal, non-breaking space, tab, dan baris kosong berlebih.
- Memperbarui menu Tools dengan pencarian Pinterest/Bing dan pencarian katalog perintah.
- Memperbarui menu Marketplace dengan Client Center serta pelacakan status dan aktivitas pesanan.
- Memperbarui menu Game dengan perintah multiplayer, papan skor, dan keluar ruang.
- Memperbarui menu Owner dengan panduan pencarian allowlist.
- Menyederhanakan pengantar katalog agar cara mencari, membuka detail, dan berpindah kategori lebih jelas.
- Tidak mengubah izin, transaksi, database, maupun perilaku inti handler.

## 4.0.7 - Marketplace Activity Audit
- Added persistent marketplace activity log for key order status transitions.
- Added `.requestdesign activity BRF-ID` with participant/Owner access control.
- Activity writes are best-effort and do not block authoritative order status updates.
- Added timestamp, actor, transition, action, and revision/rejection notes.

## [4.0.6] - 2026-11-01
### Marketplace Notifications & Reliability
- Centralized private WhatsApp marketplace notifications with recipient validation and failure logging.
- Added context-specific follow-up guidance to order lifecycle notifications.
- Command replies now distinguish persisted status changes from failed private notifications; MongoDB status remains authoritative.

## v4.0.5 — Designer Order Workbench

- Dashboard `.studio` menampilkan hingga lima pesanan aktif terbaru milik desainer.
- Setiap pesanan menampilkan status dan tindakan berikutnya: mulai, kirim hasil, menunggu verifikasi Owner, menunggu pelanggan, atau lanjut revisi.
- Antrian hanya membaca data pesanan dan tidak mengubah status transaksi.

## [4.0.3] - Portfolio Upgrade & UX
- Added featured portfolio works with a maximum of 3 per designer.
- Only Owner-approved works can be featured; designers can toggle the feature flag on their own work.
- Public designer profiles show featured works first and mark them with ⭐.
- Added a compound index for featured portfolio ordering; existing records default to not featured.


## [4.0.2] - Client Center & UX
- Added `.client` / `.klien` dashboard for customers with status summaries and context-aware order shortcuts.
- Registered Client Center in the command catalog, permissions, and examples.
- Improved customer navigation without changing the existing order state machine.
# Changelog

## v5.22.1 — Inspiration & Portfolio Learning Expansion (candidate)
- Menambahkan `.designchallenge` dengan challenge harian/mingguan deterministik berbasis kalender UTC, filter kategori, brief, batasan, output, dan evaluasi mandiri.
- Menambahkan `.portfolioguide` untuk checklist publikasi, builder case study, dan bio desainer.
- Memperluas `.designinspire` dan `.designlearn` yang sudah ada tanpa mengganti implementasi atau mengubah format command sebelumnya.
- Mendaftarkan command baru pada router dan katalog; memperbarui menu Designer, contoh command, dokumentasi, dan status fitur.
- Menambahkan tes untuk rotasi challenge, kategori, template portfolio, input kosong, routing, dan katalog.
- Batasan: tidak ada penyimpanan progres challenge/portfolio; tidak ada penilaian otomatis atas karya; tautan inspirasi eksternal tidak memverifikasi lisensi.
- Status kandidat; MongoDB dan WhatsApp live belum diuji.

## v5.16.0 — Consistent Reply UX Audit

- Memperkuat normalisasi semua balasan teks: membersihkan ANSI escape, CRLF, newline literal, non-breaking space, tab, dan baris kosong berlebih.
- Memperbarui menu Tools dengan pencarian Pinterest/Bing dan pencarian katalog perintah.
- Memperbarui menu Marketplace dengan Client Center serta pelacakan status dan aktivitas pesanan.
- Memperbarui menu Game dengan perintah multiplayer, papan skor, dan keluar ruang.
- Memperbarui menu Owner dengan panduan pencarian allowlist.
- Menyederhanakan pengantar katalog agar cara mencari, membuka detail, dan berpindah kategori lebih jelas.
- Tidak mengubah izin, transaksi, database, maupun perilaku inti handler.

## [4.0.1] - 2026-11-01
### UX / Marketplace
- Menambahkan `studio`, `service`, dan `layanan` ke katalog perintah utama agar fitur v4.0.0 mudah ditemukan.
- Menambahkan panduan kontekstual untuk dashboard desainer, katalog layanan, portofolio, pencarian desainer, dan permintaan desain.
- Menambahkan layar bantuan `.service bantuan` dengan pemisahan petunjuk klien dan desainer.
- Merapikan dashboard `.studio` menjadi ringkasan performa dan daftar tindakan berikutnya.
- Memperjelas validasi paket, deskripsi, harga, durasi, dan revisi saat membuat layanan.
- Memperjelas empty state katalog layanan dan langkah awal bagi desainer baru.


- `.pinsearch` and `.pinterest` now only return a Pinterest search URL.
- Removed Pinterest API/token requirements and Pinterest page scraping from the search command.
- `.bingsearch` remains an independent Bing Images downloader and never acts as a Pinterest fallback.
- Updated command help, README, privacy-policy text, and focused tests.

## v3.40.0 — Pinterest Pin Search Result Validation
- Removed extraction of arbitrary `<img>`, Open Graph previews, and free-floating `i.pinimg.com` URLs that could return Pinterest branding or placeholders.
- Pin Search now accepts image URLs only from structured Pin records with a Pin ID/type and an `images` object.
- Added safe parsing for Pinterest `__PWS_DATA__` JSON assignments and retained CDN host, content-type, image-signature, redirect, and size validation.
- If public Pinterest search does not expose structured Pin records, the bot now reports no usable images instead of sending a misleading placeholder.

# Changelog

## v5.22.1 — Inspiration & Portfolio Learning Expansion (candidate)
- Menambahkan `.designchallenge` dengan challenge harian/mingguan deterministik berbasis kalender UTC, filter kategori, brief, batasan, output, dan evaluasi mandiri.
- Menambahkan `.portfolioguide` untuk checklist publikasi, builder case study, dan bio desainer.
- Memperluas `.designinspire` dan `.designlearn` yang sudah ada tanpa mengganti implementasi atau mengubah format command sebelumnya.
- Mendaftarkan command baru pada router dan katalog; memperbarui menu Designer, contoh command, dokumentasi, dan status fitur.
- Menambahkan tes untuk rotasi challenge, kategori, template portfolio, input kosong, routing, dan katalog.
- Batasan: tidak ada penyimpanan progres challenge/portfolio; tidak ada penilaian otomatis atas karya; tautan inspirasi eksternal tidak memverifikasi lisensi.
- Status kandidat; MongoDB dan WhatsApp live belum diuji.

## v5.16.0 — Consistent Reply UX Audit

- Memperkuat normalisasi semua balasan teks: membersihkan ANSI escape, CRLF, newline literal, non-breaking space, tab, dan baris kosong berlebih.
- Memperbarui menu Tools dengan pencarian Pinterest/Bing dan pencarian katalog perintah.
- Memperbarui menu Marketplace dengan Client Center serta pelacakan status dan aktivitas pesanan.
- Memperbarui menu Game dengan perintah multiplayer, papan skor, dan keluar ruang.
- Memperbarui menu Owner dengan panduan pencarian allowlist.
- Menyederhanakan pengantar katalog agar cara mencari, membuka detail, dan berpindah kategori lebih jelas.
- Tidak mengubah izin, transaksi, database, maupun perilaku inti handler.

## v3.39.0 — Allowlist Persistence & Pinterest Pin Media Fix
- Persisted global allowlist to MongoDB collection `access_lists` while retaining atomic local JSON storage.
- Restore allowlist during startup and MongoDB reconnection; seed MongoDB from local configuration on first run.
- Preserve newer local allowlist changes when MongoDB was temporarily unavailable.
- Improved Pinterest Pin Search extraction for image CDN URLs embedded in escaped page JSON.
- Ensure Pin Search downloads validated Pinterest CDN image bytes and sends them as WhatsApp image media; added injectable fetch for reliable tests.

## v3.30.0 — Guess Game Progression
- Added persistent personal score, wins, attempt count, hints used, and best completion time.
- Added `.tebak skor` / `.tebak statistik` and `.tebak papan` / `.tebak ranking`.
- Added easy, medium, and hard tiers with 10/20/30 base points.
- Each hint deducts 5 points from the reward.

## v3.29.5 — Multicategory Guess Game
- Expanded `.tebak` beyond design into general knowledge, science, technology, geography, animals, food, sports, history, design, and logic riddles.
- Added `.tebak kategori` and `.tebak mulai <kategori>`.
- Improved answer normalization so spaces and punctuation do not cause false negatives.
- Updated game registry metadata, command catalog, and command documentation.

## v3.30.1 — Game Baru
- Menambahkan game Tebak Angka (`.angka`) dengan angka rahasia 1–50, 7 kesempatan, petunjuk arah, dan skor.
- Menambahkan game Acak Kata (`.acak`) dengan kategori beragam, petunjuk, percobaan, dan skor.
- Kedua game memakai sesi per pemain per chat agar permainan antargrup tidak saling bertabrakan.
- Mendaftarkan kedua game di Game Center dan katalog perintah.


## v3.30.2 — Mystery & Detective Game
- Menambahkan game investigasi fiksi dengan kasus misteri, petunjuk bertahap, daftar tersangka, sistem tuduhan, solusi, skor, dan papan peringkat.
- Menambahkan command `.misteri` ke registry, routing, Game Center, dan dokumentasi.
- Cerita disajikan non-grafis dan berfokus pada deduksi, alibi, jadwal, serta bukti.


## v3.31.0 — Mystery Investigation Mode
- Expanded Mystery & Detective from clue-and-accuse into an investigation flow with explorable locations.
- Added location-gated evidence inspection, suspect interviews, and an investigation journal.
- Added evidence/interview completion bonus points while preserving existing clue, accusation, score, and leaderboard commands.
- Expanded content validation tests for locations, evidence mapping, and suspect interviews.

## v3.32.0 — Multiplayer & Social Games
- Added `.multi` command with group room creation, joining, host-controlled start/close, and room status.
- Added group Sambung Kata with turn order, repeated-word prevention, and per-player round points.
- Added group Kuis Rebutan with a shared question and first-correct-answer scoring.
- Added 1v1 Suit challenges by phone number, acceptance/rejection, and hidden move selection until both players submit.
- Player identity prefers the resolved phone JID when available to support Baileys LID identity mapping.
- Active rooms/challenges are in-memory and reset when the bot process restarts; no persistent multiplayer ranking is claimed in this release.
- Added focused multiplayer tests and registered the command in Game Center and command catalog.

## v3.33.0 — Multiplayer Expansion
- Added quiz categories: umum, sains, teknologi, and desain, plus the all-category option.
- Added `.multi papan` / `.multi leaderboard` to display the current room ranking.
- Added `.multi keluar` for lobby members; if the host leaves, host ownership transfers to the first remaining player.
- Improved room menu and status details, and added validation for unsupported quiz categories.
- Added regression tests for lobby exit/host transfer, scoreboard, and quiz category validation.
- Multiplayer data remains in-memory and is cleared when the bot restarts.

## v3.34.0 — Tutorial Marketplace Bergambar
- Added `.tutorial portfolio`, `.tutorial order`, and `.tutorial bukti` with text guides and matching PNG tutorial cards.
- Updated `.tutorial market` with actual marketplace commands for portfolio, briefs, offers, contact handoff, proof review, revisions, confirmation, and ratings.
- Added editable tutorial text keys for Owner content editing and documented `.tutorial perintah` as the registered command catalog.
- Added regression tests for tutorial routing, custom prefixes, image delivery, and proof-review instructions.
- Fixed the configurable command prefix to read `PREFIX` from `.env` and clarified the shared `.reports` route for group admins versus bot Owner.

## v3.35.0 — Stage 8
- Multiplayer group rooms, scores, quiz rounds, word-chain turns, pending duel challenges, and active duel selections are persisted to MongoDB when the database is available.
- Multiplayer state is restored during startup after MongoDB connects.
- Stale rooms (24 hours), duel challenges (5 minutes), and duels (1 hour) are discarded during restoration.
- In-memory operation remains available when MongoDB is offline; persistence is then unavailable and is logged.

## v3.36.0 — Stage 9: Unified Player System
- Menambahkan perintah `.player` untuk profil aktivitas pemain, level, XP, dan pencapaian.
- Menambahkan `.player top` untuk menampilkan 10 pemain global berdasarkan XP.
- Pencapaian otomatis dihitung dari jumlah pesan yang sudah tercatat: pendatang baru, aktif, pengunjung tetap, veteran, dan legenda.
- Menggunakan koleksi `User` serta sistem XP aktivitas yang sudah ada; tidak membuat sistem akun atau saldo terpisah.
- Fitur membutuhkan MongoDB aktif. Peringkat menampilkan level dan XP tanpa membocorkan JID/nomor telepon pemain.


## v3.37.0 — Stage 10: Daily Missions & Rewards

- Added `.mission` to display three daily missions and `.mission claim <id>` to claim completed rewards.
- Added daily progress tracking for allowed-group messages and game commands.
- Added a coin balance to player activity; claims award coins and XP.
- Claims use a conditional MongoDB update so the same mission reward cannot be claimed twice for the same UTC day.
- Daily progress resets at 00:00 UTC.
- Player profiles now display the coin balance.

## v3.38.0 — Stage 11: Player Economy Big Update
- Added a player shop with four collectable items and `.shop` / `.buy <item-id> [quantity]` commands.
- Added `.inventory` / `.inv` to view owned items and `.wallet` / `.saldo` to view the coin balance.
- Added `.daily` for a once-per-UTC-day bonus of 100 coins and 10 XP.
- Purchases use a conditional MongoDB update that checks and deducts the balance in the same operation; quantity is limited to 1–10.
- Added a rolling 30-entry activity transaction history for purchases and daily claims.
- Added economy commands to the command catalog and documented the new feature.
- Added `.env.example` for a clearer first-time setup.

## v4.0.0 — Design Marketplace Big Update
- Added Designer Studio dashboard with designer-scoped portfolio, active service, active/completed order, and review metrics.
- Added designer service catalog with BASIC, PRO, and EXCLUSIVE packages.
- Added service creation, listing, detail, activation, deactivation, and owner-only deletion commands.
- Added MongoDB DesignService model and marketplace documentation.


## v4.0.4 — Public Designer Discovery & Search UX
- Improved designer search cards with short bios, specialties, starting prices, approved portfolio counts, featured-work counts, and review summaries.
- Added `.design unggulan` to filter for designers who have approved featured portfolio work.
- Replaced per-profile count lookups with batched MongoDB aggregations for the current result page.
- Updated marketplace help and documentation.


## 4.0.8 - Marketplace Dispute Center
- Added dispute records linked to marketplace orders.
- Added participant-only dispute creation and dispute history.
- Added Owner-only dispute resolution with explicit outcome and reason.
- Added best-effort notifications to both parties and audit activity records.
- Clarified that dispute handling does not move or hold funds.

## [4.0.9] - 2026-11-01
### Release readiness dan perbaikan instalasi
- Menambahkan `.env.example` yang sebelumnya dirujuk README tetapi tidak tersedia di arsip v4.0.8.
- Menambahkan perintah `npm run doctor` untuk pemeriksaan awal konfigurasi.
- Memperbarui nomor versi paket dan dokumentasi instalasi.
- Menghapus artefak file JavaScript duplikat dengan karakter backtick pada nama file; file tersebut tidak direferensikan oleh aplikasi.

## [4.1.0] - 2026-11-01
### Added
- Manual marketplace payment ledger with per-order payment references.
- Client payment submission and Owner manual verification/rejection.
- Payment events are included in order activity history and notify the involved parties.
### Notes
- This is recordkeeping only; no payment gateway, escrow, bank verification, or automatic transfer is implemented.

## v5.1.0 — Marketplace Search UX

- Added `.design prev` to move backward through designer search results.
- Search pagination no longer silently wraps from the last page to the first page.
- Added clear first-page/last-page guidance and contextual navigation hints.
- Improved unknown `.design` subcommand guidance.
- UI/UX remains part of the release checklist for subsequent versions.


## v5.3.0 — Marketplace order journey UX

- Added role-aware `.requestdesign status BRF-ID` guidance with aliases `progress` and `lacak`.
- Shows the current human-readable status and the next relevant action for client, selected designer, or Owner.
- Restricts order status details to the order participants and bot Owner.
- Links users to the order activity history for a fuller timeline.

## v5.5.0 — Pinterest Public Image Search & Design UX Tools

- `.pinsearch` / `.pinterest` now fetches the public Pinterest search page without API tokens, extracts Pinterest CDN image candidates, downloads and validates images, and sends valid results as WhatsApp image media.
- Pinterest and Bing image search remain separate commands; no Bing fallback is used for Pinterest.
- Clear failure responses are returned when Pinterest blocks access or exposes no usable public image URLs.
- Added `.uxaudit web|app|bot|marketplace` checklists for design and UX/UI review.
- Updated Pinterest and UX/UI help documentation and tests.
- Public-page extraction is best-effort and may be affected by Pinterest CAPTCHA, login walls, or page structure changes.


## v5.8.0 — Design Review Rubric Studio
- Added `.designreview` self-review rubrics for poster, web, app, logo, social content, and marketplace UX.
- Added a consistent 0–2 scoring scale so designers can identify missing or partial criteria before handoff.
- Updated command help, catalog, and design marketplace documentation.
- The command provides a guided checklist; it does not claim automated image or interface analysis.


## v5.9.0 — Design Workflow Studio
- Menambahkan `.designflow` untuk menyatukan brief, urutan produksi, arahan visual/UX, prompt awal, dan checklist QA.
- Mendukung poster, logo, sosial, web, app, bot, marketplace, dan kemasan.
- Memperbarui bantuan, katalog perintah, dokumentasi, serta versi paket.


## v5.10.0 — Design Scorecard & QA Priorities
- Added `.designscore` for poster, web, app, logo, social content, and marketplace reviews.
- Accepts explicit 0–2 ratings, validates rating count/range, calculates percentage, and highlights incomplete criteria.
- Updated help, command catalog, and Design Marketplace documentation.
- Scorecard is a self-assessment aid, not automated visual analysis or certification.

## [5.11.0] - 2026-11-01
### Added
- WhatsApp interactive list navigation for the home menu, Design Studio, Marketplace, and tutorials.
- Menu selections route to existing text commands; text navigation remains available as a compatibility fallback.
- Added focused menu navigation regression tests.
### Notes
- Interactive list rendering depends on WhatsApp client/protocol support. If sending the list fails, the bot sends the corresponding text menu.
- This release improves navigation only; it does not claim automatic visual critique or full payment-gateway integration.

## [5.11.0] - 2026-11-01 (continued)
### Improved
- Added interactive WhatsApp list menus for home, Design Studio, Marketplace, and tutorials with text fallback.
- Routed menu selections through existing command handlers instead of duplicating feature logic.
- Restored safe `.env.example` documentation in the release package (no real secrets).
- Updated a marketplace notification regression test to match the existing best-effort notification helper.
### Validation
- `npm run check`: 146 JavaScript files pass.
- `npm test`: 225 tests pass.

## 5.12.0
- Added persistent group/contact aliases and internal notes to the allowlist.
- Owner allowlist view now displays alias, WhatsApp group name where available, JID/number, and notes.
- Added `.allowlist group name/note` and `.allowlist contact name/note` commands.
- Extended MongoDB `access_lists` document with group/contact profile metadata.
- Added local JSON backup before atomic allowlist writes.
- Replaced fragile filesystem-mtime precedence with monotonic allowlist revisions, preventing fresh deployment configs from overwriting tenant allowlists in MongoDB.
- Corrupt allowlist JSON now fails safely instead of silently becoming an empty allowlist.

## Pekerjaan awal v5.20.0 — belum rilis
- Menambahkan command `.colorconvert` untuk konversi HEX, RGB, dan HSL dua arah tanpa layanan eksternal.
- Menambahkan dokumentasi katalog/help dan tes konversi warna.
- Nomor versi package tetap v5.19.0; fitur ini merupakan pekerjaan awal v5.20.0, bukan rilis final.


## Unreleased — v5.20.0 Designer Tools Expansion

- Added `.typescale` to generate validated modular typography scales for digital design.
- Registered the command in the command catalog and contextual help.
- Documented the Typography Studio progress in the roadmap.
- Improved `.fontpair` with style-based matching and clearer no-match guidance.


## Work in progress — Design QA & Handoff
- Added `.designqa` checklists for poster, social, logo, print, packaging, web, and app deliverables.
- Kept `.checklist` as a backward-compatible alias.
- Added `.handoff` text template for client/developer delivery specifications, assets, licensing notes, and approval.
- Updated command help, README, and roadmap.


## Image Utilities Upgrade — pekerjaan v5.20.0

- Menambahkan `.crop <rasio>` untuk crop tengah dengan rasio 1:1, 4:5, 16:9, dan rasio numerik lain yang valid.
- Menambahkan `.imgconvert <jpg|png|webp> [kualitas]` untuk konversi format gambar dengan kualitas 40–100.
- JPG menggunakan latar putih untuk menangani transparansi secara eksplisit.
- Hasil konversi melaporkan ukuran sebelum/sesudah dan perubahan ukuran; konversi tidak menjamin file selalu lebih kecil.
- Pemrosesan tetap menggunakan Sharp dan batas unduhan media yang sudah diterapkan oleh utilitas WhatsApp.
- Pengembangan ini tidak mengubah versi package; masih bagian dari pekerjaan v5.20.0.
- Menambahkan Designer Workspace `.designproject` untuk menyimpan dan mengelola hingga 10 preset brief per akun pada MongoDB.

## FontPair Design Assistant
- Added `.fontpair ai <brief>` with assistant/asisten/brief aliases.
- Produces ranked font pairings, starter color palette, and art-direction recommendations from design keywords.
- Accepts a sent or quoted reference image and extracts dimensions plus approximate mean RGB color statistics using Sharp.
- Explicitly discloses that image inspection is metadata/color-statistics based, not OCR or semantic vision AI.
- Updated command catalog and help usage; added focused tests.

## AI Design Copilot — Vision Integration
- Added `features/design-studio/design-vision.js` for OpenAI-compatible multimodal Chat Completions.
- `.fontpair ai <brief>` now sends an attached/replied image plus brief to a configurable vision model when `OPENAI_API_KEY` is set.
- The analysis covers visual hierarchy, layout, typography suggestions, HEX palette roles, art direction, and prioritized revisions; font identification is explicitly framed as an estimate.
- Added `OPENAI_API_KEY`, `OPENAI_BASE_URL`, and `OPENAI_VISION_MODEL` to `.env.example`; no credentials are embedded in source.
- Images are limited to 8 MB; missing configuration or provider failures fall back to the existing local recommendation engine with a clear notice.
- Added focused tests for missing configuration, size guard, image payload, successful response, and provider auth errors.

## [Unreleased] — Inspiration & Learning
- Menambahkan `.designinspire` untuk eksplorasi inspirasi per kategori, keyword pencarian, arahan visual, latihan singkat, dan tautan pencarian Pinterest/Bing Images.
- Menambahkan `.designlearn` untuk materi bertahap tingkat pemula, menengah, dan lanjutan dengan topik dasar, warna, tipografi, dan layout.
- Kedua perintah bersifat offline-first dan tidak mengklaim hasil pencarian eksternal telah dikurasi atau diverifikasi lisensinya.


## v5.64.0 — Contrast, Navigation & Motion Refinement
- Semantic color and contrast repair across Light/Dark themes, forms, tables, cards, Shortlist, category index, and Designer Studio.
- Refined mobile navigation grouping, hit areas, and utility spacing; theme/motion controls preserve their internal markup and announce state accessibly.
- Simplified the global background to sparse diagonal linework and an irregular organic outline.
- Preserved existing product routes and reduced-motion support; refreshed public cache to v10.

## v5.65.0 — Theme Contrast Repair
- Corrected category-card text colors so each editorial palette remains readable in both themes.
- Improved Portal desainer and homepage CTA contrast with explicit theme-aware foreground/background tokens.
- Preserved dark editorial panels in Light Mode and improved helper/form text contrast.
- Refreshed public cache to v11.

## v5.66.0 — Mobile Navigation Refinement
- Increased mobile navigation spacing and touch targets while keeping desktop navigation unchanged.
- Aligned the expanded menu to the header width and constrained it to the phone viewport.
- Reorganized mobile actions: Portal desainer and Cari receive full-width rows; Motion and Tema share a balanced two-column row.
- Added theme-specific utility button surfaces, scroll containment for short screens, and reduced-motion support.
- Refreshed public cache to v12.


## v5.72.0 — Navigation Restoration & Content Integrity
- Fixed closed `Lainnya` dropdown panels remaining visible because author CSS overrode native `<details>` closed-state behavior.
- Consolidated mobile navigation event handling, keyboard dismissal, focus restoration, and resize cleanup.
- Added Client Workspace and Contact & Support to the top navigation menu.
- Advanced the public service-worker cache and asset tokens.
