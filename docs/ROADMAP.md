## PIR Visuals — active development path (v6.7.2)

- **v5.87.0 — Operational Stability:** backup validation/retention, loopback health/readiness, single-use Designer Studio activation, five-minute OTP, and public profile curation controls.
- **v5.88.0 — Final Audit & Release Candidate:** CSP-safe interaction handlers, protected private collection edit links, consistent QR-page security headers, health-method restrictions, and coordinated release metadata.
- **v5.89.0 — Beginner Experience & Guided Onboarding:** interactive onboarding, need-based command discovery, personalized recommendations, expanded user journeys, and welcome-message guidance.
- **v5.90.0 — Designer Workflow 2.0:** persistent six-stage project pipeline, guided stage instructions, project board/progress, sequential completion, reopening with downstream reset, safe duplicate reset, and in-process per-account mutation serialization.
- **v5.91.0 — Designer Portfolio & Direct Contact Directory:** marketplace bot is a public portfolio directory with opt-in designer contact only; no request, offers, orders, payments, commission, escrow, or mediation.
- **v5.92.0 — Learning Path & Community Challenge:** persistent 12-module learning progress, WIB-based daily/weekly challenges, group-scoped artwork gallery, constructive peer review, and contribution summaries.
- **v5.93.0 — Community Intelligence & Engagement:** opt-in group-scoped community profiles, mentor matching, participation milestones, and capacity-limited designer collaboration board.
- **v5.94.0 — Product Stabilization & Support System:** unified help center, FAQ, safer ticket/report workflows, group-scoped authorization, display-name privacy, and WhatsApp-aware health diagnostics.
- **v5.95.0 — Production Readiness & Support Hardening:** ticket conversation detail, requester-first privacy, group-scoped Admin access, and best-effort anti-spam throttles for tickets/reports.
- **v5.99.0 — Designer Intelligence & Platform Growth:** guided designer matching, transparent fit signals, and private portfolio readiness checklist.
- **v5.98.0 — Automation, Privacy & End-to-End Experience:** WhatsApp push opt-in/out, workspace revocation, Playwright harness, backup/restore verification.
- **v5.97.0 — Directory Quality, Trust & Hybrid Workspace:** filtered pagination, accurate budget overlap, relevance ranking, PIR-reviewed badge semantics, transparent email-verified testimonials, opt-in public availability, and explicit optional website workspace disclosures.

The current source baseline is bot v6.7.2 and website package v3.50.0. Automated checks and package audits must pass before distribution. Live WhatsApp, MongoDB, yt-dlp/FFmpeg/FFprobe, browser rendering, and real-client behavior still require staging verification.

# PIR Visuals Bot — Roadmap Pengembangan

**Arah produk:** Designer Community & Creative Tools Platform  
**Baseline source:** v6.6.0 — Creative Asset Studio & Design Seasons  
**Current release:** v6.6.0 — Creative Asset Studio & Design Seasons

## v6.7.2 — Voice Lab & Local Information

**Status:** implemented in source; focused tests and local FFmpeg filter smoke checks pass; live WhatsApp/provider staging remains required.

- `.voice help` lists the audio effects; reply to voice note/audio with `.bass`, `.8d`, `.karaoke`, `.tempo 1.25`, or other effect aliases.
- FFmpeg processing is allowlisted to fixed filters and bounded by input/output/duration limits. Basic karaoke reduces centered stereo content and is not AI vocal separation.
- `.cuaca Bandung` returns current weather and daily temperature range from Open-Meteo.
- `.gempa` returns the latest earthquake summary from BMKG.
- Website Creative Studio now documents Voice Lab and local information utilities; Command Explorer uses the generated registry.
- No new dependency or database migration.

## v6.7.1 — Illustrated Feature Menu

**Status:** implemented in source; automated menu regression tests pass; live WhatsApp delivery still requires staging.

- `.menu`, `.help` without a topic, and `.fitur` send a branded six-category infographic followed by the authoritative text menu/catalog.
- Missing image or transport failures fall back to text. Custom-prefix installations remain text-only to avoid incorrect dot-prefixed examples.
- No new dependency, database schema, or index.

## v6.7.0 — Feature Discovery, Anime Resilience & Apple Music Preview

**Status:** implemented in source; automated checks pass; live staging acceptance remains required.

- `.fitur`, `.features`, and `.jelajah` expose all command categories, natural-language search, pagination, and guided workflows.
- WhatsApp main menu advertises the discovery hub; website primary navigation exposes `/commands` as Semua Fitur Bot.
- Anime Discovery uses Jikan first and automatically falls back to AniList for search, popular, current-season, and MAL-ID detail requests.
- Apple Music single-song links can deliver only the public preview URL returned by Apple's Lookup API via `.music preview`, `.dl apple`, or direct `.dl <Apple Music URL>`.
- Preview downloads enforce Apple audio CDN allowlisting, timeout, audio content-type validation, and a 15 MB cap. No full-track DRM bypass.
- No new runtime dependency, MongoDB collection, or index.

## v6.8.0 — Designer Collaboration & Portfolio 2.0

**Next planned milestone:** Team Workspace, invitation and role boundaries, project collaboration board, review threads, portfolio case-study builder, project activity history, and asset-to-project integration. Every feature must remain permission-scoped and discoverable through `.fitur`.

## v6.6.0 — Creative Asset Studio & Design Seasons

**Status:** implemented in source; staging acceptance remains required.

- `.assetstudio` stores group-scoped HTTPS reference metadata, private by default, with explicit sharing, attribution/license notes, owner controls, and Admin moderation.
- `.designseason` provides 2–8 round group competitions, one active season per group, one active round at a time, one submission per participant per round, group-scoped gallery, peer review, immutable round close, and final results.
- Sticker Studio adds circular crop and bounded static/animated output; image transforms enforce 40 MP/12,000 px input dimensions and 12 MB output caps.
- `.music top` displays Apple Indonesia RSS chart metadata and official links without audio redistribution.
- Website v3.49.0 adds `/creative-studio` and navigation/sitemap integration.
- New additive collections: `designseasons`, `designseasonsubmissions`, `creativeassets`; their indexes are required before staging.
- Focused tests cover authorization, group isolation, explicit sharing, moderation, season lifecycle, review freeze, image guards, chart parsing, catalog generation, and website route behavior.

## Target roadmap after v6.6.0

- **v6.7.0 — Designer Collaboration & Portfolio 2.0:** team workspaces, project roles, review threads, portfolio case studies, asset-to-project linking, and project activity history.
- **v6.8.0 — Smart Assistant & Workflow Automation:** contextual recommendations, guided project workflow, personal reminders, milestone notifications, and opt-in automation.
- **v6.9.0 — Trust, Safety & Reliability 2.0:** privacy controls, moderation center, observability, backup/restore drills, provider health, and downloader resilience.
- **v7.0.0 — PIR Creative Community Platform:** unify Learning, Designer, Intelligence, Multifunction, and Website/WhatsApp platform pillars with shared identity, permission boundaries, internal APIs, and end-to-end validation.

## Batas produk marketplace bot (v5.91.0)

Bot hanya menampilkan profil desainer, karya yang dimoderasi, dan kontak publik yang diatur secara sukarela. Calon klien menghubungi desainer langsung. Bot tidak memproses brief, penawaran, pesanan, checkout, pembayaran, escrow, komisi, mediasi, atau sengketa. Skema transaksi lama hanya dipertahankan untuk menjaga data historis dan tidak dipakai oleh runtime aktif.

Roadmap historis v5.19–v5.23 dipertahankan sebagai arsip konteks. Roadmap tidak otomatis menyatakan fitur sudah tersedia; status rilis ditentukan oleh source code, pengujian, dokumentasi, dan validasi paket.

## v6.1.0 — WhatsApp Workflow & Group Safety Upgrade

**Tujuan:** meningkatkan ketahanan alur desain di WhatsApp dan memberi Admin grup kontrol moderasi yang lebih jelas tanpa menambahkan tindakan otomatis yang berisiko.

### Implementasi
- Design Brief Wizard menggunakan koleksi `designbriefsessions` yang dipisahkan berdasarkan `chatJid` dan `userJid`.
- Draft memiliki TTL 24 jam, compound unique index, dan TTL index; aplikasi juga memeriksa expiry agar tidak bergantung pada jadwal TTL monitor MongoDB.
- Wizard mendukung lanjut, kembali, ulang, status, dan batal. Draft dihapus setelah brief selesai atau dibatalkan.
- `.antitoxic` memakai daftar kata per grup yang dikelola Admin; OFF secara default, maksimal 30 kata, satu token per entri, pencocokan whole-word setelah normalisasi Unicode.
- Admin grup dan Owner bot terverifikasi tidak terkena filter kata; jika bot Admin, pesan pelanggaran dihapus. Jika bot bukan Admin, sistem hanya memberi peringatan karena tidak memiliki izin penghapusan.
- Peringatan ke-3 dalam jendela 30 hari memicu pengingat peninjauan kepada Admin. Tidak ada auto-kick atau auto-ban.
- Database index setup dan verifier mencakup unique/TTL index untuk draft wizard.

### Batas validasi
- Automated focused tests mencakup persistence mock, isolasi chat/akun, resume setelah cache proses dihapus, backtracking, cancel, filter kata utuh, bypass Admin, dan warning escalation.
- MongoDB TTL index, WhatsApp delete-message permission, Baileys LID/PN identity, dan real group acceptance harus diuji di lingkungan lokal/staging.
- Draft brief dapat berisi informasi klien; bot memberi disclosure penyimpanan 24 jam dan instruksi penghapusan. Jangan memasukkan password, OTP, atau data rahasia.

### Kriteria penerimaan
- Pengguna dapat melanjutkan draft setelah restart selama MongoDB dan indeks tersedia.
- Draft tidak dapat dibaca oleh pengguna lain karena kunci unik memuat chat dan akun pemilik.
- Draft terhapus setelah selesai, dibatalkan, atau melewati TTL.
- Filter kata tidak aktif sampai Admin mengaktifkannya dan hanya mencocokkan kata utuh.
- Tidak ada auto-kick/ban; Admin tetap memutuskan tindakan lanjutan.

## v6.2.0 — Balanced Bot Expansion & Anime Discovery

**Status:** implemented in source; development candidate pending target-host/live-provider verification.

### Core and general feature mix
- General/multifunction feature: Anime Discovery using public MyAnimeList metadata through Jikan API.
- `.anime cari`, `.anime populer`, `.anime musim`, and `.anime detail`.
- Safe-for-work filtering, request pacing, bounded in-memory cache, query/ID validation, timeout, and provider error handling.
- Added `.menu anime`, `.commands anime`, `.help anime`, `.alur anime`, and natural-language search terms for anime/manga.
- No database migration, new runtime dependency, or website package change.

### Balanced release policy
Every future release must include:
1. At least one core PIR improvement (WhatsApp UX, AI/design workflow, community, website integration, moderation, privacy, or reliability).
2. At least one general/multifunction feature or meaningful enhancement (anime/manga, music/audio, downloader/media, stickers, search, utilities, or similar).
3. Regression improvements for existing features touched by the release.

General features rotate; they should not be added merely to inflate command count. Provider terms, copyright, rate limits, safety, cost, and user demand must be checked before implementation.

### Verification gates
- Automated tests cover command output, API URL parameters, SFW flag, caching, detail validation, and 429 handling.
- Live Jikan provider availability, real WhatsApp delivery, and target-host Node.js compatibility remain staging checks.
- Anime discovery does not stream or download copyrighted media.

## v6.3.0 — PIR Assistant & Music Discovery

**Status:** implemented in source; development candidate pending full dependency suite and live staging.

### Core PIR work
- `.asisten <kebutuhan>` searches the live command catalog and recommends one primary command plus related tools.
- The assistant is deterministic catalog-based routing, not generative AI.
- Suggestions never execute commands, and ordinary chat messages are not intercepted.
- Added `.menu musik`, `.alur musik`, help guides, and command catalog integration.

### General/multifunction feature slot
- `.music cari <judul/artis>` searches song metadata.
- `.music album <judul/artis>` searches album metadata.
- `.music artis <nama>` searches artist metadata.
- `.music detail <track ID>` looks up track metadata.
- Results include official Apple Music/iTunes links where available; explicit results are filtered and no preview audio is redistributed.
- Existing `.song` / `.play` / `.lagu` search now displays artist/channel and optional view count/upload date when yt-dlp provides them.
- Existing download rights guidance, queue, file-size limits, and provider boundaries remain unchanged.

### Verification gates
- Unit tests cover intent routing, iTunes search/lookup, explicit filtering, cache, timeout/error handling, command catalog, and downloader regressions.
- Live iTunes API, yt-dlp/FFmpeg, WhatsApp delivery, and target-host checks remain staging tasks.
- No schema migration or new runtime dependency.

## v6.4.0 — Community Challenge & Downloader Reliability

**Status:** implemented in source; Development Candidate pending full dependency suite and live staging.

### Core PIR work

#### Designer Profile & Contribution Summary
- `.designcommunity ringkasan` summarizes the requesting member's learning progress, challenge submissions, peer reviews, mentor opt-in, and collaboration activity.
- The summary is scoped to the current group and requesting member.
- Output does not reveal WhatsApp JIDs/phone identifiers and does not create a public profile or public leaderboard.
- Feedback detail is bounded to the latest 200 personal and 500 group submissions read by the summary.

#### Design Battle
- `.designchallenge battle buat` creates a 1–168 hour group-only event with title, brief, category, start and end time.
- Admin/Owner creates and closes a battle; the creator can also close their own event.
- Members opt in by submitting an HTTPS work link or attaching an image to the group message.
- One active entry per member per battle; entry can be updated before closure.
- Gallery, existing constructive peer review, and transparent peer-review score summary are group-scoped.
- No automatic prize, payment, AI quality score, certification, or external publication.
- Added `DesignBattle` collection and `designbattles` unique-code/group-time indexes; `LearningSubmission` additionally supports `challengeMode: 'battle'`.

#### Command Explorer
- Added public `/commands` page linked from website navigation.
- `npm run docs:commands` generates Markdown and JSON from the same `COMMAND_CATALOG` registry.
- Search, category filter, example copy buttons, and access labels are rendered from generated registry data.
- Website package advanced to 3.47.0; service version 6.4.0, cache epoch v43, and static asset version 6400.

#### Group Admin Control Center
- `.modstatus` shows read-only anti-link, anti-spam, word filter, welcome/goodbye, and group-rule status.
- `.modpreset preview` previews `proteksi-dasar`, `ramah`, or `tenang`.
- `.modpreset apply <preset> konfirmasi` requires explicit confirmation and Admin/Owner permission.
- Presets update only named fields; custom word lists, rules, and unrelated settings are preserved. Apply requires a same-admin/same-group preview within five minutes and rejects stale settings.

### General/multifunction feature — Downloader Reliability
- One application-level retry maximum, only for transient network and HTTP 429 errors.
- No retry for HTTP 401/403, unsupported URLs, unavailable/private media, timeouts, or local dependency failures.
- `.dl status` reports the requester's current job phase and attempt.
- `.dl cancel` removes the requester's waiting job or aborts their active subprocess when supported; an already-started WhatsApp send cannot be recalled.
- `.dl health` checks Python/yt-dlp, FFmpeg, and optional FFprobe.
- FFprobe can read audio title, artist, album, duration, and format; failure is non-blocking.
- Audio MIME is selected from the actual file extension.
- Existing public URL validation, queue caps, file size limits, cleanup, and rights guidance remain.

### Verification gates
- Focused tests cover group isolation, permission boundaries, lifecycle, preview/apply safety, retry policy, cancellation, audio metadata, command registry generation, and Command Explorer.
- Additive index setup and database verifier cover the new DesignBattle collection.
- Live WhatsApp/Baileys, MongoDB, downloader providers, FFmpeg/FFprobe, browser, and rollback remain staging tasks.
- No new npm dependency; no destructive database migration.

## v6.5.0 — Creative Learning Studio & Media Format Explorer

**Status:** implemented in source; Development Candidate pending full dependency suite and live staging.

### Core PIR work
- `.cohort` creates group-scoped 1–12 week learning circles with voluntary enrollment, up to five facilitators, up to 12 milestones, and up to 50 participants.
- Facilitators start/close programs, review check-ins, and view aggregate progress; participants see only their own progress.
- Check-ins are unique per cohort/milestone/member. Participants can delete their own check-ins; creator/Admin/Owner can delete a cohort with explicit confirmation.
- `.designcommunity growth` compares recorded learning completions, artwork submissions, peer reviews given, and feedback received over two 30-day windows.
- Public `/commands` now contains four guided workflows generated from the same command registry; copy-only, never executes WhatsApp commands.

### General/multifunction feature slot
- `.mediaformat` explains the formats and send limits recognized by the current pipeline.
- `.mediaformat cek` inspects public provider metadata using yt-dlp `--skip-download`; it never downloads a file.
- Preset estimates support `video-wa`, `video-compact`, `audio-mp3`, and `audio-high` with bounded duration and 8% overhead. They do not perform conversion.
- Video MIME types now follow the actual MP4/M4V, WebM, MOV, and MKV container extension.

### Deferred scope
- Multi-round Battle Seasons, automated judging, and prize/payment handling are deferred. Existing Design Battle remains unchanged until its lifecycle has passed live staging.
- No new runtime dependency; new cohort/check-in collections and indexes are additive.

### Verification gates
- Focused tests cover cohort role boundaries, group isolation, lifecycle, personal/aggregate progress, deletion, Growth Insights windows, metadata-only inspection, estimates, registry, and index requirements.
- Live MongoDB index creation, PN/LID mentions, WhatsApp delivery, yt-dlp providers, FFmpeg/FFprobe, and browser rendering remain staging tasks.

## v6.5.1 — Learning Lifecycle, Privacy & Visual System Refinement

**Status:** patch hardening in source; Development Candidate pending full dependency suite and live staging.

- Learning Cohort registration can remain open without consuming the 1–12 week learning period. `.cohort mulai` sets the actual start/end dates and recalculates milestone deadlines from stored day offsets.
- Existing open cohorts from v6.5.0 retain their intended milestone offsets when started; the offset is reconstructed from the previous `dueAt` and `startsAt` fields if `dueDay` is absent.
- Former members retain private access to their own recorded progress and can delete their own check-ins after leaving. Their records are excluded from active review queues and active-member aggregate counts. Data deletion remains scoped to current group + cohort + requester.
- URL validation blocks additional special-use/private IPv4 and IPv6 literals and private/reserved host suffixes. Network-level egress restrictions remain necessary for DNS rebinding and provider redirects.
- Website adds a same-origin semantic visual stylesheet, sparse background lines, a single organic outline, consistent surface tokens, improved mobile navigation action spacing, and stronger light/dark contrast.
- Command Explorer search includes guided workflows, separate result counts, a combined empty state, and reliable copy-label restoration.

### Verification gates
- Focused tests cover delayed cohort starts, legacy milestone schedule preservation, former-member privacy/deletion, reserved IP URL rejection, workflow search hooks, stylesheet route, and responsive visual tokens.
- Live MongoDB, WhatsApp PN/LID, downloader provider redirects, DNS egress policy, and real desktop/mobile browser rendering remain staging requirements.
- No new npm dependency, collection, or destructive migration.

## Proposed v6.6.0 — Creative Asset Studio & Battle Seasons

**Fokus:** memperluas alat produksi visual dan mengembangkan kompetisi desain menjadi musim bertahap.

- Sticker Studio, sticker pack manager, image resize/compression/conversion, QR visual generator, and curated design asset library.
- Battle Seasons with multiple rounds, round deadlines, opt-in judging, transparent participation history, and moderation.
- No automatic prize, payment, or commercial transaction flow.
- Continue provider-safe media improvements and keep image/video conversion behind explicit size and runtime limits.

## Proposed v6.7.0 — Designer Collaboration & Portfolio 2.0

- Team Workspace, project roles, invitations, capacity limits, collaboration board, version history, and structured feedback.
- Portfolio links to approved works and group/community learning outcomes only with explicit opt-in.
- Music discovery collections and private media metadata library as the general feature slot.
- Marketplace remains a portfolio/direct-contact directory, not an order, payment, escrow, or mediation system.

## Proposed v6.8.0 — Smart Assistant & Workflow Automation

- Context-aware deterministic assistant over the command catalog, guided project workflow, personal reminders, and learning recommendations based on recorded activity.
- User-approved reminders and scheduled workflows with opt-out, quiet hours, and bounded delivery retries.
- Unified search across commands, learning materials, and supported metadata providers.
- Utilities and anime/manga discovery enhancements; no unauthorized streaming or copyrighted downloads.

## Proposed v6.9.0 — Trust, Safety & Reliability 2.0

- Privacy center, data export/deletion controls, moderation review queue, audit events, and stronger group-level permission tests.
- Backup/restore rehearsal, health/readiness metrics, provider diagnostics, and queue/resource controls.
- Downloader reliability improvements with strict public-URL checks, file-size/time limits, and explicit rights guidance.
- Full integration and end-to-end staging gates before major release.

## Proposed v7.0.0 — PIR Creative Community Platform

Unify the product into five pillars:
1. **Learning Ecosystem:** Learning Path, Cohort, mentors, community challenges, Battle Seasons, and growth insights.
2. **Designer Ecosystem:** opt-in profiles, portfolio, team collaboration, and project workspace.
3. **PIR Intelligence:** deterministic assistant, recommendations, and guided workflows.
4. **Multifunction Hub:** downloader/media, music, anime/manga discovery, stickers, image tools, search, and utilities.
5. **Unified Platform:** consistent WhatsApp and website identity, modular APIs, command discovery, privacy controls, and release operations.

v7.0 Stable requires full root/website suites with all dependencies installed, live MongoDB index verification, backup/restore rehearsal, WhatsApp PN/LID acceptance, real provider tests, desktop/mobile light/dark browser QA, and documented rollback. Feature count alone is not a Stable criterion.

### Balanced release rule
Every release combines at least one core PIR improvement with at least one general/multifunction feature or meaningful enhancement. General features rotate across anime/manga, music/audio, downloader/media, stickers, search, and utilities; they must not be added solely to inflate command count.

## v5.99.0 — Designer Intelligence & Platform Growth

**Tujuan:** membuat pencarian desainer lebih mudah bagi pengunjung baru dan memberi desainer panduan praktis untuk melengkapi portfolio, tanpa mengubah marketplace menjadi sistem transaksi.

### Implementasi source
- Guided Designer Finder pada `/discover` dengan bidang, skill, lokasi, kata kunci, dan preset anggaran.
- Fit ranking transparan berdasarkan kategori, spesialisasi, lokasi, overlap rentang harga, dan kata kunci.
- Alasan kecocokan ditampilkan pada kartu hasil; featured/PIR-reviewed tidak memberi bonus skor.
- Private Portfolio Readiness checklist di Designer Studio dengan tautan langsung ke bagian yang perlu dilengkapi.
- Jumlah karya disetujui dihitung langsung dari database; karya pending/rejected tidak dihitung.
- Checklist bukan penilaian kualitas visual/profesional dan tidak ditampilkan pada profil publik.
- Tidak ada migrasi skema atau dependency runtime baru.

### Batas validasi
- Unit/focused tests lulus pada source environment.
- Live MongoDB aggregation, data riil, browser desktop/mobile, dan full dependency suites harus divalidasi lokal.
- Fit ranking hanya menggunakan data yang dipublikasikan; informasi yang tidak diisi tidak boleh ditafsirkan sebagai ketidakmampuan atau ketidaktersediaan.

### Kriteria penerimaan
- Form pencarian mudah digunakan oleh pengguna baru dan responsif di ponsel.
- Budget preset memakai overlap harga yang sama dengan filter direktori.
- Fit sort tidak memberi bonus pada featured atau reviewed status.
- Reason labels cocok dengan sinyal yang benar-benar cocok.
- Portfolio readiness privat, akurat, dan hanya menghitung karya approved.
- Bot tetap direktori/kontak langsung; workspace tetap opsional; tidak ada transaksi PIR.

## v5.98.0 — Automation, Privacy & End-to-End Experience

**Tujuan:** mengotomatiskan notifikasi yang disetujui pengguna, memperkuat kontrol akses workspace, dan menyediakan jalur E2E serta backup/restore yang dapat dijalankan di komputer lokal.

### Implementasi source
- WhatsApp push opt-in/out privat melalui `.portfolio notifikasi push aktif|nonaktif|status`.
- Quiet hours WIB, default 22.00–08.00, lease-based outbox, retry bertahap, consent timestamp, dan pencegahan pengiriman backlog sebelum opt-in.
- Outbound-only linked-designer registry; tidak mengubah izin inbound umum atau akses grup.
- Client workspace session revocation, invalidasi invitation token, rate limit akses/invite, no-store/no-referrer.
- `npm run backup:verify` untuk dump, restore ke database unik, verifikasi jumlah dokumen, dan SHA-256 media.
- Playwright E2E harness opsional untuk homepage, discovery, proteksi workspace, dan mobile overflow.
- Index outbox ditambahkan ke shared database verifier dan index setup.

### Batas validasi
- Browser E2E memerlukan Playwright/Chromium yang dipasang pada komputer lokal.
- Backup/restore membutuhkan MongoDB Database Tools dan database lokal aktif.
- Delivery WhatsApp nyata tetap memerlukan akun test yang sudah dipairing dan persetujuan push dari pemilik profil.
- Stable release menunggu hasil tes lokal tersebut; source-level tests tidak menggantikan uji live.

## v5.97.0 — Directory Quality, Trust & Hybrid Workspace

**Tujuan:** meningkatkan kualitas discovery, kejelasan trust signal, dan mempertahankan workspace website sebagai fitur opsional tanpa mengubah bot dari direktori kontak langsung.

### Implementasi
- Pagination 24 desainer per halaman, filtered total, filter-preserving navigation.
- Relevance ranking dan sorting terbaru.
- Filter budget berdasarkan irisan rentang harga.
- Badge “Profil ditinjau PIR” dan keterangan testimoni berbasis verifikasi email.
- Public availability opt-in; catatan kalender tetap privat.
- Project workspace website tetap opsional dengan disclosure non-transaksi.

### Dokumen
- `RELEASE-NOTES-v5.97.0.md`
- `INSTALL_UPDATE_v5_97_0.md`
- `QA_REPORT_v5_97_0.md`
- `docs/HYBRID-WORKSPACE-POLICY-v5.97.0.md`
- `docs/VERIFICATION-STANDARD-v5.97.0.md`
- `docs/PRODUCT-FEATURE-AUDIT-v5.97.0.md`

### Gate sebelum Stable
- Jalankan semua test suite dengan dependency lengkap.
- Uji query MongoDB, browser E2E, SMTP, dan WhatsApp lokal.
- Selesaikan backup/restore database serta media.


## v5.96.0 — Website ↔ Bot Integration

**Tujuan:** menyatukan data profil, kontak, analytics, dan notifikasi website dengan bot tanpa mengubah model marketplace menjadi sistem transaksi.

### Implementasi
- Shared profile/portfolio data dan alias kontak publik.
- Ringkasan Designer Studio read-only dan private-chat-only.
- Inbox notifikasi website pada chat pribadi.
- Integration doctor, database verifier, deployment smoke test, dan CI workflow.
- Local development guide dan staging acceptance.

### Temuan audit yang harus ditutup sebelum stable
- Lihat `docs/PRODUCT-FEATURE-AUDIT-v5.96.0.md` untuk inventaris fitur dan prioritas pengembangan.
- Lanjutkan penyelarasan metadata dokumentasi dan pengujian end-to-end.
- Perbaiki paginasi dan akurasi filter pencarian direktori.
- Perjelas arti badge verifikasi dan status testimoni.
- Lengkapi E2E test browser dan skenario WhatsApp/MongoDB nyata.
- Pastikan kalender ketersediaan punya arti yang jelas bagi pengunjung publik.

## v5.95.0 — Production Readiness & Support Hardening

**Tujuan:** menutup celah operasional pada pusat bantuan sebelum uji produksi, tanpa memperluas ruang lingkup fitur besar.

### Implementasi
- `.ticket detail <ID>` menampilkan maksimal 15 pesan terbaru kepada pemilik tiket, Admin grup asal, atau Owner.
- Pemilik tiket dapat membaca tiket miliknya dari chat mana pun; Admin tetap dibatasi oleh `groupJid`.
- Pesan percakapan menggunakan label peran, bukan JID atau nomor akun.
- Pembuatan tiket dibatasi maksimal tiga tiket terbuka dan lima tiket baru per akun dalam 24 jam berjalan.
- Laporan dibatasi maksimal tiga laporan per anggota per grup dalam 10 menit berjalan.
- Ditambahkan indeks untuk query pembatasan laporan dan tiket berdasarkan waktu.
- Pembatasan berbasis hitung dokumen ini adalah throttling best-effort; deployment dengan trafik tinggi tetap memerlukan pengujian konkurensi dan monitoring.

### Kriteria penerimaan
- Pemilik tiket dapat membaca percakapan sendiri tanpa melihat JID.
- Admin grup lain tidak dapat membaca tiket yang bukan berasal dari grupnya.
- Admin grup asal dan Owner dapat membaca detail sesuai kewenangannya.
- Throttling tiket/laporan memberi pesan yang jelas dan tidak menghapus data historis.
- Full test suite, MongoDB staging, WhatsApp delivery, dan backup/restore harus lulus sebelum stable release.

## v5.94.0 — Product Stabilization & Support System

**Tujuan:** mempermudah pengguna meminta bantuan dan menutup celah akses pada tiket/laporan tanpa menambah sistem transaksi atau layanan eksternal.

### Implementasi
- `.support` sebagai pusat bantuan tunggal dengan FAQ, filter kata kunci, tiket, dan pelaporan.
- Tiket dibatasi tiga tiket terbuka per akun, subjek 180 karakter, balasan 1.200 karakter, dan riwayat maksimal 100 pesan.
- Admin grup hanya dapat mengelola tiket yang `groupJid`-nya sama dengan grup aktif; Owner dapat menangani tiket global.
- Pemilik tiket dapat menutup tiket sendiri.
- Laporan dapat dilihat, dirinci, dan ditutup oleh Admin grup asal; Owner dapat meninjau/menutup laporan global.
- Output grup tidak menampilkan JID pelapor, target, atau pemilik tiket.
- `.health` menampilkan status koneksi WhatsApp dari lifecycle event, selain status MongoDB.
- Endpoint `/health` dan `/ready` tetap loopback-only; `/ready` mensyaratkan WhatsApp dan MongoDB siap.
- Perintah dukungan tetap tersedia selama maintenance mode.
- Perubahan schema Report/Ticket bersifat additive dan memakai indeks komposit untuk query grup/pemilik.

### Kriteria penerimaan
- Tiket dan laporan tidak dapat diakses Admin grup lain.
- Ticket owner dapat menutup tiketnya sendiri.
- Owner dapat menangani tiket lintas grup.
- FAQ, support, dan ticket dapat digunakan saat maintenance mode.
- Full test suite, MongoDB staging, WhatsApp delivery, dan backup/restore harus lulus sebelum stable release.

## v5.93.0 — Community Intelligence & Engagement

**Tujuan:** membantu anggota saling menemukan keahlian, memberi dukungan belajar, dan membangun proyek kreatif bersama tanpa mengubah bot menjadi perantara transaksi.

### Implementasi
- `.designcommunity mentor <topik>` mengaktifkan profil mentor secara sukarela per grup.
- `.designcommunity belajar <topik>` mencatat kebutuhan belajar dan mengaktifkan profil pembelajar secara sukarela.
- `.designcommunity cari <topik>` hanya mengembalikan mentor aktif pada `groupJid` yang sama.
- `.designcommunity profil`, `.intro`, `.off`, dan `.hapus` mengelola profil pribadi; off menonaktifkan visibilitas, hapus menghapus dokumen profil pada grup tersebut.
- `.designcommunity badges` menghitung milestone dari `User.preferences.learningProgress`, submission aktif, peer review yang diberikan, proyek yang dibuat/diikuti, dan status mentor opt-in.
- Milestone tidak memberi XP/koin, tidak menyusun ranking kualitas, dan bukan sertifikasi.
- Collaboration Board mendukung `.collab buat`, `list`, `join`, `leave`, dan `tutup`.
- Proyek memiliki kode unik, brief, skill yang dibutuhkan, kapasitas 2–5 orang termasuk pemilik, maksimal tiga proyek terbuka per pemilik per grup, dan penutupan oleh pemilik/Admin grup.
- Join menggunakan filter kapasitas atomik MongoDB untuk mengurangi risiko dua anggota mengambil slot terakhir secara bersamaan.
- Menambahkan `CommunityProfile` dan `CommunityCollaboration` collection dengan indeks group/user dan group/status.
- Tutorial, onboarding, command discovery, command catalog, README, roadmap, changelog, QA, install guide, dan runbook diperbarui.

### Batasan dan kriteria penerimaan
- Semua perintah hanya berjalan pada grup dan membutuhkan MongoDB.
- Mentor/pembelajar harus opt-in; hasil pencarian hanya berasal dari profil visible dalam grup yang sama.
- Off menyembunyikan profil dari pencarian; hapus menghapus profil pada grup asal.
- Tidak menampilkan JID/nomor kontak pribadi pada direktori mentor atau papan kolaborasi.
- Proyek hanya berlaku pada grup asal; tidak ada transaksi, kontrak, pembayaran, escrow, hadiah, atau mediasi.
- Join harus menolak pemilik, anggota duplikat, proyek penuh, proyek tertutup, dan kode dari grup lain.
- Hanya pemilik proyek atau Admin grup yang dapat menutup proyek.
- Milestone berdasarkan aktivitas tercatat, bukan kualitas karya atau kemampuan profesional.

## v5.92.0 — Learning Path & Community Challenge

**Tujuan:** membuat aktivitas belajar dan berbagi karya menjadi berkelanjutan, mudah diikuti pemula, dan tetap aman dalam ruang komunitas masing-masing.

### Implementasi
- `.designlearn jalur` menampilkan 12 modul (3 tingkat × 4 topik).
- `.designlearn mulai <level> <topik>` menyimpan materi aktif pada `User.preferences.learningProgress`.
- `.designlearn selesai` menandai modul selesai berdasarkan konfirmasi mandiri; `.lanjut`, `.progress`, dan `.reset konfirmasi` mengelola jalur pribadi.
- Sintaks lama `.designlearn pemula warna` tetap didukung; materi masih dapat dibaca saat database tidak tersedia.
- Challenge harian dan mingguan menggunakan zona waktu `Asia/Jakarta` (WIB) untuk penentuan tanggal/periode.
- `.designchallenge submit` mencatat satu entri per anggota/grup/per tantangan; entri berikutnya memperbarui karya milik sendiri.
- `.designchallenge galeri` menampilkan kiriman dalam grup yang sama, tanpa mengungkap JID/nomor akun.
- `.designchallenge feedback` mengizinkan satu masukan per anggota pada karya anggota lain; self-review ditolak.
- `.designchallenge progress` dan `.kontributor` menampilkan partisipasi grup tanpa mengklaim sertifikasi atau kualitas profesional.
- `.designchallenge hide/restore` memberi Admin grup/Owner kontrol moderasi galeri yang tetap dibatasi ke grup asal.
- Menambahkan `LearningSubmission` collection dengan indeks kode unik dan kunci unik grup/tantangan/anggota; progress belajar disimpan pada Mixed `User.preferences` tanpa migrasi.
- Tutorial, command catalog, README, changelog, QA, install guide, dan runbook diperbarui.

### Batasan dan kriteria penerimaan
- Submission/galeri/feedback/moderasi hanya tersedia di grup; query wajib memuat `groupJid` dan tindakan hide/restore memerlukan Admin grup atau Owner.
- Karya harus berupa gambar pada pesan grup atau tautan HTTPS; bot tidak mengunduh atau meng-host file dari URL.
- Tidak ada auto-publish ke direktori desainer, hadiah otomatis, AI critique, transaksi, atau pembayaran.
- Feedback bukan rating publik profesional; komentar harus cukup panjang dan konstruktif.
- Data tidak boleh menampilkan JID atau nomor telepon anggota.
- Pengujian wajib mencakup WIB midnight, progress isolation, challenge uniqueness, group isolation, self-feedback, duplicate feedback, dan validasi URL.

## v5.90.0 — Designer Workflow 2.0

**Tujuan:** mengubah `.designflow` dan `.designproject` yang sudah ada menjadi satu workspace produksi yang dapat diikuti tahap demi tahap, tanpa menggandakan command studio yang tersedia.

### Implementasi
- Menambahkan pure workflow engine dengan enam tahap berurutan: `brief`, `concept`, `layout`, `visual`, `qa`, `handoff`.
- `.designproject start` membuat proyek baru dengan workflow mulai dari Brief; `.save` tetap kompatibel dan mempertahankan workflow ketika preset diperbarui.
- `.designproject step` memberi tujuan, checklist, dan rekomendasi command yang disesuaikan dengan jenis proyek.
- `.designproject done` memerlukan konfirmasi manual dan hanya membuka tahap berikutnya; tahap tidak dapat dilompati.
- `.designproject progress` dan `.board` menampilkan progress per proyek.
- `.designproject reopen` membuka ulang tahap dan mengembalikan tahap setelahnya ke status belum selesai.
- `.designproject duplicate` menyalin brief tetapi memulai workflow baru dari Brief.
- `show`, `list`, `flow`, dan `export` menampilkan progress workflow.
- Operasi workspace diserialisasi per akun WhatsApp dalam satu proses untuk mengurangi risiko lost update akibat dua perintah bersamaan.
- Data workflow disimpan pada `User.preferences.designProjects`; tidak ada perubahan skema atau migrasi. Proyek lama tanpa workflow dimulai dari Brief.
- Menambahkan tes unit, transisi tahap, backward compatibility, isolasi, duplikasi, board, dan mutasi bersamaan.

### Kriteria penerimaan
- Enam tahap selalu berurutan; tidak ada lompatan tahap.
- Membuka ulang tahap menghapus status selesai tahap sesudahnya.
- Duplikasi tidak mewarisi progress proyek sumber.
- Perintah lama `.designproject save/edit/list/show/export/flow/template/status/delete` tetap bekerja.
- Workspace tetap privat berdasarkan JID pengguna.
- Pencarian dan command discovery mengenali format baru.
- Root tests, website tests, syntax checks, dan release audit lulus.

### Batasan
- Penandaan tahap selesai adalah konfirmasi manual pengguna, bukan pemeriksaan otomatis file desain.
- Tidak ada kolaborasi lintas akun, upload artefak, sinkronisasi file, atau persetujuan klien otomatis.
- Serialisasi mutasi berlaku dalam satu proses bot; bukan distributed lock untuk beberapa instance bot.
- Perilaku MongoDB, WhatsApp live, dan penggunaan nyata tetap memerlukan staging verification.

## v5.89.0 — Beginner Experience & Guided Onboarding

**Tujuan:** anggota baru dapat menemukan manfaat bot dan menyelesaikan tugas pertama tanpa menghafal command.

### Implementasi
- `.mulai` memulai onboarding dua langkah untuk memilih kebutuhan utama dan tingkat pengalaman.
- Rekomendasi disusun dari command yang benar-benar terdaftar: desain, belajar, olah gambar, mencari jasa, menawarkan jasa, komunitas, dan game.
- `.mulai cepat`, `.mulai profil`, `.mulai ulang`, dan `.mulai batal` mendukung pengguna yang ingin melewati atau mengubah onboarding.
- Preferensi disimpan pada `User.preferences.onboarding` saat MongoDB siap. Tanpa database, onboarding tetap berfungsi dengan fallback dalam memori proses.
- `.cari <kebutuhan>` dan `.commands cari <kata>` menggunakan pencarian berbobot dengan sinonim Indonesia/Inggris.
- `.alur` mencakup perjalanan desain, marketplace, penawaran layanan, komunitas, dan game.
- Pesan sambutan default mengarahkan anggota baru ke `.mulai`, `.cari`, dan `.rules`.
- Menu utama dan teks contoh Owner diselaraskan dengan navigasi baru.

### Kriteria penerimaan
- Setiap pilihan onboarding menghasilkan rekomendasi command yang ada di katalog.
- Prefix khusus selain `.` tetap digunakan di semua panduan.
- Input tidak valid memberi penjelasan dan tidak menghapus sesi.
- `batal` menghentikan sesi; command lain keluar dari onboarding dan tetap diproses.
- Preferensi tidak menimpa field lain di `User.preferences`.
- Tidak ada perubahan skema database atau migrasi.
- Tes bot, tes website, pemeriksaan sintaks, dan audit paket lulus.

### Batasan
- Sesi percakapan yang belum selesai disimpan di memori proses dan hilang jika bot restart.
- Preferensi hanya persisten jika MongoDB aktif dan model User dapat diakses.
- Pencarian memberi rekomendasi, bukan menjalankan command otomatis.
- Onboarding tidak mengubah hak akses; fitur premium, Owner, dan Admin tetap mengikuti pemeriksaan izin yang ada.

## Ringkasan versi historis (sebelum seri v5.87)

| Versi | Fokus | Status |
|---|---|---|
| v5.19.0 | Security & Access Control | Kandidat; menunggu verifikasi operasional |
| v5.20.0 | Designer Tools Expansion | Rencana berikutnya |
| v5.21.0 | Downloader & Media Tools | Rencana |
| v5.22.0 | Command Center & UI/UX | Rencana |
| v5.23.0 | Designer Workflow: Brief Builder, Moodboard, Design Critique | Kandidat pengembangan; belum rilis produksi |

## Arsip historis v5.19.0 — Security & Access Control

Bagian ini dipertahankan sebagai riwayat pengembangan, bukan prioritas aktif.

- Audit allowlist grup dan kontak pada seluruh jalur pesan masuk.
- Pastikan bypass Owner hanya berlaku pada chat pribadi dengan identitas terverifikasi.
- Pesan Owner di grup tetap harus memenuhi allowlist grup.
- Audit pemetaan identitas WhatsApp JID, LID, dan nomor telepon.
- Audit outbound message guard dan tujuan balasan pribadi Owner.
- Pastikan Admin tidak memperoleh hak Owner dan Member hanya dapat memakai fitur sesuai izin.
- Tambahkan tes regresi untuk akses Owner, Admin, Member, grup, kontak, LID, dan nomor.
- Uji dengan WhatsApp aktif dan konfigurasi MongoDB yang representatif sebelum rilis.
- Perbarui dokumentasi keamanan, changelog, dan arsip rilis bersih.

**Kriteria selesai:** tidak ada bypass grup yang tidak disengaja; semua jalur inbound/outbound konsisten; tes otomatis lulus; verifikasi operasional dicatat. Kandidat tidak dianggap rilis produksi sebelum seluruh kriteria terpenuhi.

## v5.20.0 — Designer Tools Expansion

**Tujuan:** menjadikan alat bantu desainer sebagai salah satu fungsi inti bot, dengan alur kerja yang saling terhubung dan mudah ditemukan.

### Fondasi yang sudah tersedia

Perintah berikut sudah tercatat dalam source saat roadmap ini dibuat. Audit berikutnya harus mempertahankan kompatibilitas dan memperbaiki kualitasnya, bukan membuat ulang tanpa alasan:

- Brief dan ide: `.wizard`, `.brief`, `.creative`, `.designprompt`.
- Layout dan tipografi: `.layout`, `.fontpair`.
- Warna dan aksesibilitas: `.colorpalette`, `.contrast`; `.colorconvert` kini tersedia untuk konversi HEX/RGB/HSL.
- Pemeriksaan dan revisi: `.checklist`, `.revision`, `.designscore`.
- Sistem desain dan UX: `.brandkit`, `.designsystem`, `.uxflow`, `.uxaudit`, `.designflow`.
- Utilitas gambar: `.info`, `.ratio`, `.resize`, `.compress`, `.sticker`.
- Estimasi layanan: `.pricing`.

### Implementasi v5.20.0 yang mulai dikerjakan

- Menambahkan `.colorconvert` untuk menerima HEX, RGB, atau HSL dan mengembalikan ketiga format.
- Mendaftarkan perintah di katalog dan bantuan agar dapat ditemukan melalui menu/help.
- Menambahkan tes untuk konversi HEX, RGB, HSL, dan input tidak valid.
- Menambahkan `.typescale` untuk menghasilkan skala modular tipografi dengan validasi base, ratio, dan jumlah langkah.
- Menyempurnakan `.fontpair` dengan pencarian kategori gaya (editorial, futuristik, poster, edukasi, fashion, dan lainnya) serta hasil deterministik.
- Menyempurnakan `.creative` menjadi Creative Concept Studio: tiga arah konsep deterministik, deteksi kategori desain, arahan produksi (fokus, komposisi, warna, tipografi), prompt siap salin, dan QA sesuai jenis proyek.
- Menghubungkan output `.creative` dengan pintasan `.wizard`, `.colorpalette`, `.colorconvert`, `.fontpair`, dan `.designreview`.
- Memperbarui bantuan/katalog dan menambahkan tes regresi untuk alur Creative Concept Studio.

### Implementasi Design QA & Handoff — pekerjaan berjalan

- Menambahkan `.designqa` dengan checklist khusus poster, sosial, logo, cetak, kemasan, web, dan app.
- Memperluas `.checklist` sebagai alias kompatibel untuk checklist QA yang sama.
- Menambahkan `.handoff` untuk membuat template spesifikasi serah-terima ke klien atau developer, termasuk ukuran/platform, format, warna, tipografi, aset, lisensi, dan persetujuan.
- Untuk UI, handoff mencakup komponen, design tokens, breakpoint, dan state komponen.
- Untuk desain non-UI, handoff mencakup file master/final, variasi, safe area/bleed, aset, dan panduan penggunaan.
- Fitur menghasilkan template teks; tidak mengunggah file, memverifikasi lisensi, atau mengekspor paket otomatis.

### Integrasi Designer Workflow — pekerjaan berjalan

- Memperluas `.designflow` agar satu balasan menghubungkan brief, urutan produksi, design direction, palet warna awal, arahan tipografi, spesifikasi output, prompt, QA, dan pintasan handoff.
- Pemilihan palet berbasis kata kunci tema bersifat rekomendasi awal dan deterministik; pengguna tetap dapat mengganti warna melalui `.colorpalette` atau `.colorconvert`.
- Menambahkan batas panjang input agar tema/audiens/platform tidak menghasilkan balasan berlebihan atau memecah format WhatsApp.
- Menambahkan tes integrasi untuk kategori digital dan kemasan, pemilihan palet, tipografi, spesifikasi, QA, serta handoff.
- Output workflow adalah template/rancangan; tidak menyimpan proyek, mengukur gambar, atau menguji pengguna secara otomatis.

### Pengembangan berikutnya

1. **Color Studio**
   - Konversi HEX, RGB, dan HSL dua arah.
   - Generator palet dari HEX utama dengan skema complementary, analogous, triadic, dan monochromatic.
   - Pemeriksaan kontras untuk beberapa pasangan warna dan rekomendasi perbaikan.
   - Simpan/kelola palet favorit secara opsional dengan batas penyimpanan yang jelas.

2. **Typography Studio**
   - `.fontpair <gaya>` mencari pasangan font berdasarkan karakter proyek, dengan hasil yang konsisten dan kategori yang jelas.
   - Panduan hierarki tipografi: display, heading, body, caption.
   - `.typescale` menghasilkan skala modular ukuran teks dan saran line-height untuk kebutuhan digital.
   - Rekomendasi ukuran dan line-height untuk kebutuhan digital/cetak.
   - Cantumkan sumber dan lisensi font; jangan mengklaim font tersedia atau bebas lisensi tanpa verifikasi.

3. **Design Brief & Creative Assistant**
   - Satukan wizard brief, ide kreatif, prompt, dan saran layout ke alur yang konsisten.
   - Template brief untuk poster, logo, identitas brand, konten sosial, kemasan, dan UI.
   - Prompt generator dengan variabel tujuan, audiens, gaya, warna, komposisi, dan output.
   - Ekspor ringkasan brief dalam teks yang mudah disalin.

4. **Design QA & Handoff**
   - Checklist berbeda untuk desain cetak, sosial, logo, dan UI.
   - Pemeriksaan dimensi, rasio, keterbacaan, kontras, dan kelengkapan aset.
   - Template handoff untuk spesifikasi file, font, warna, aset, dan catatan penggunaan.
   - Skor desain harus transparan sebagai rubric bantuan, bukan penilaian objektif otomatis.
   - Lanjutkan pengujian Design QA dan Handoff dengan fixture proyek cetak, kemasan, dan UI; pertimbangkan ekspor dokumen setelah kebutuhan format ditetapkan.

5. **Image Utility Upgrade**
   - Audit resize dan compress untuk menjaga kualitas serta metadata yang relevan.
   - Tambahkan crop dan konversi format jika dependensi mendukung dengan aman.
   - Validasi MIME type, ukuran input/output, batas resolusi, timeout, dan file sementara.
   - Background removal hanya melalui provider/engine yang jelas, dengan konfigurasi dan batas penggunaan; jangan menjanjikan fitur sebelum integrasi tersedia.

6. **Designer workflow & UX**
   - Satukan pintasan menjadi alur: brief → konsep → layout → warna/tipografi → produksi → QA → handoff.
   - Perjelas bantuan, contoh, alias, dan kategori `.menu tools`.
   - Pertahankan mode teks WhatsApp dan prefix yang dikonfigurasi.

**Kriteria selesai:** semua tools tercantum di katalog dan bantuan; input divalidasi; batas ukuran/timeout diterapkan; tes unit/regresi tersedia; dokumentasi sesuai perilaku aktual; tidak ada klaim integrasi eksternal yang belum dibuat.

## v5.21.0 — Downloader & Media Tools

- Audit downloader yang sudah ada, sumber yang didukung, dan kepatuhan ketentuan layanan/hak cipta.
- Perbaiki validasi URL, MIME type, ukuran file, durasi, timeout, dan pembatasan permintaan.
- Standarkan pesan error dan fallback ketika provider tidak tersedia.
- Audit pemrosesan gambar/video/audio dan pembersihan file sementara.
- Pisahkan Pinterest Search yang hanya membuat tautan pencarian dari fitur unduh; jangan menyebutnya downloader Pinterest.
- Tambahkan tes untuk URL tidak valid, provider gagal, file terlalu besar, timeout, dan format tidak didukung.

**Kriteria selesai:** unduhan hanya berjalan pada sumber/format yang memang didukung; resource dibatasi; file sementara dibersihkan; error tidak membocorkan token atau data internal.

## v5.22.0 — Command Center & UI/UX

- Audit ulang `.menu`, `.commands`, `.help`, `.tutorial`, `.mulai`, dan navigasi kategori.
- Pastikan seluruh perintah baru Designer Tools dan Downloader ditemukan melalui katalog.
- Samakan prefix dinamis, alias, format contoh, dan pesan akses.
- Perbaiki navigasi panjang dengan pagination dan pencarian yang konsisten.
- Sediakan tutorial berbasis kebutuhan (poster, logo, sosial, UI, revisi, aset, dan belajar).
- Audit konsistensi teks, error state, empty state, serta pesan sukses/gagal.
- Pertahankan navigasi teks WhatsApp; jangan menambahkan tombol/list interaktif tanpa kebutuhan dan uji kompatibilitas.

**Kriteria selesai:** tidak ada command yatim yang hilang dari katalog; contoh bantuan dapat dijalankan; navigasi dan prefix konsisten; tes menu/help/tutorial lulus.

## v5.23.0 — Database Stability & Performance

- Audit koneksi MongoDB, lifecycle koneksi, reconnect, dan shutdown.
- Audit retry/backoff, timeout, error handling, dan perilaku saat database offline.
- Periksa konsistensi model, index, validasi, dan operasi tulis yang rawan duplikasi.
- Uji backup, restore, dan pemulihan data dengan prosedur yang terdokumentasi.
- Periksa transaksi/ledger marketplace agar status dan catatan aktivitas tetap konsisten.
- Isolasi fixture tes dari `.env`, database, allowlist, dan data produksi.
- Tambahkan tes integrasi menggunakan database uji; jangan menguji dengan database produksi.
- Ukur query dan operasi berat sebelum melakukan optimasi.

**Kriteria selesai:** reconnect tidak menyebabkan kehilangan/duplikasi data; backup dapat dipulihkan; tes integrasi terisolasi; konfigurasi produksi tidak ikut arsip distribusi.

## Standar wajib untuk setiap versi

- Balanced scope: setiap versi memadukan pekerjaan inti PIR dengan minimal satu fitur umum/multifungsi yang relevan; rotasikan anime/manga, musik/audio, downloader/media, dan utilitas.
- Integrasi eksternal: catat provider, atribusi, batas request, timeout, cache, fallback, privasi, serta batas hak cipta.
- Keamanan: tidak ada akses tanpa izin; Owner/Admin/Member diuji terpisah.
- Kompatibilitas: prefix dan alias mengikuti konfigurasi.
- Data: tidak menghapus atau memigrasikan data tanpa alasan, backup, dan prosedur rollback.
- Media: validasi format, ukuran, timeout, dan pembersihan file.
- UX: pesan singkat, jelas, konsisten, dan memiliki contoh yang benar.
- Dokumentasi: README, bantuan, katalog, dan changelog sesuai kode aktual.
- Pengujian: jalankan `npm run check` dan `npm test`; catat tes yang dilewati beserta alasannya.
- Distribusi: keluarkan `.env`, sesi WhatsApp, database, backup, cache, `node_modules`, dan file sementara dari ZIP rilis; sertakan `.env.example` dan instruksi `npm ci`.
- Rilis: jangan menyebut versi final sebelum tes, audit arsip, dan pemeriksaan instalasi selesai.

## Urutan kerja saat ini

1. Jalankan staging acceptance v6.6.0 pada grup WhatsApp uji: Asset Studio privacy/sharing, Design Season round lifecycle, moderation, dan image/sticker limits.
2. Jalankan `npm run db:ensure-shared-indexes` dan `npm run verify:database` pada database staging.
3. Pasang seluruh dependency dengan `npm ci` dan `npm ci --prefix portfolio-website`, lalu jalankan full root dan website test suite.
4. Uji website `/creative-studio` dan `/commands` pada desktop/mobile serta kedua tema; verifikasi navigasi, contrast, workflow, dan copy controls.
5. Validasi Sharp/FFmpeg/FFprobe, Apple RSS, downloader, backup, dan rollback.
6. Pertahankan status Development Candidate sampai seluruh uji live dan pemulihan berhasil.


### v5.20.0 — Image Utilities Upgrade (fondasi)
- [x] Crop berdasarkan rasio tengah.
- [x] Konversi JPG/PNG/WebP dengan kontrol kualitas.
- [x] Dokumentasi format dan batas input.
- [ ] Uji end-to-end dengan media WhatsApp dan Sharp pada mesin target.


### Designer Workspace & Project Presets — pekerjaan berjalan
- `.designproject` menyimpan, melihat, memperbarui, dan menghapus preset brief per akun WhatsApp; data berada pada `User.preferences.designProjects` dengan batas 10 proyek per akun.
- Fitur yang sudah diimplementasikan: `save`, `edit`, `list` dengan filter status/jenis, `search`, `show`, `duplicate`, `status`, `history`, `template`, `flow`, dan `delete`.
- `flow` meneruskan jenis, tema, audiens, dan platform preset ke `.designflow`; template awal tersedia untuk poster, logo, sosial, web, app, dan kemasan.
- `export <nama>` menghasilkan ringkasan brief teks yang mudah disalin tanpa mengubah data proyek atau membuat file desain.
- Riwayat perubahan disimpan per proyek dengan batas 20 entri; duplikasi membuat proyek baru berstatus `planning`.
- Isolasi akun menggunakan pencarian `User.findOne({ jid: userJid })`; tes unit memverifikasi perilaku handler, tetapi verifikasi MongoDB produksi dan dua akun nyata belum dilakukan.
- Fitur memerlukan profil pengguna dan koneksi database aktif. Belum ada sinkronisasi file desain atau kolaborasi lintas akun.


## v5.23.0 — Designer Workflow

- `.briefbuilder` menggunakan kembali wizard brief tujuh langkah yang sudah ada.
- `.moodboard` menyusun arah visual berbasis kurasi teks, bukan kolase gambar otomatis.
- `.designcritique` menyediakan rubrik evaluasi; analisis gambar AI opsional bergantung pada `OPENAI_API_KEY` dan koneksi provider.
- `.critique` dan `.rate` tetap menjadi peer-review komunitas dan tidak digantikan.
- Lihat `docs/DESIGNER-WORKFLOW-5.23.0.md` dan `docs/FEATURE_STATUS_5.23.0.md` untuk detail implementasi, batasan, dan validasi.


## v5.96.0 — Final Integration
- Sinkronisasi field kontak dan schema profil/karya antara bot dan website.
- Inbox notifikasi Designer Studio privat di WhatsApp.
- Diagnostics environment/database dan deployment smoke test.
- Staging acceptance, full test suite, dan restore drill tetap menjadi gerbang sebelum Stable Release.


## v6.0.0 — Bot Experience & Intelligence Upgrade

**Tujuan:** mengoptimalkan pengalaman WhatsApp bot sebelum memperluas fitur website lagi.

- `.cepat` menyediakan akses pribadi untuk maksimal delapan command favorit.
- Riwayat command bersifat opt-in, nonaktif secara default, maksimal delapan command unik, dan hanya menyimpan nama command tanpa argumen atau isi pesan.
- Semua tampilan/pengaturan Quick Access dibatasi ke chat pribadi.
- Menu utama, onboarding, katalog, dan pencarian bahasa alami mengenalkan Quick Access.
- Tutorial desain, belajar, tantangan, dan komunitas harus menghormati prefix yang dikonfigurasi.
- Metadata katalog game dipisahkan dari handler runtime agar bantuan/katalog lebih ringan untuk diuji.
- Tidak ada migrasi database, dependency baru, atau perubahan batas model hybrid.

**Kriteria selesai:** 85 focused tests lulus, seluruh JavaScript lolos syntax check, full test suite dependency-backed lulus, dan uji lokal memverifikasi penyimpanan preferensi, privasi chat pribadi, riwayat opt-in, command routing, serta custom prefix.
