# Designer Portfolio Directory — Bot Feature v5.91.0

The bot marketplace has been simplified into a **designer portfolio and direct-contact directory**. It helps people discover designers through approved work and contact the designer directly.

## Product boundary

PIR Visuals Bot does not process or mediate jobs. There is no request brief, offer, bid, order lifecycle, checkout, payment gateway, manual payment ledger, escrow, commission, delivery approval, revision workflow, transaction rating, or dispute resolution. Communication and agreement happen directly between the prospective client and the designer through the public contact details supplied by that designer.

## Public discovery commands

- `.design` — directory help and browse.
- `.design kategori <nama>` — category filter.
- `.design gaya <nama>` — visual style filter.
- `.design lokasi <kota>` — location filter.
- `.design cari <kata>` — search portfolio and public profile fields.
- `.design unggulan` — featured work/designer discovery.
- `.design next` / `.design prev` — result pagination.
- `.design simpan DSN-ID` / `.design favorit` / `.design batal DSN-ID` — favorites.
- `.designer DSN-ID` — profile, approved portfolio, and public contact links.

Search requires approved portfolio work. It does not rank designers by prices, accepting-orders flags, or transaction ratings.

## Designer profile commands

- `.portfolio daftar` — guided profile wizard: public name, bio, specialties, optional location, optional public WhatsApp.
- `.portfolio edit nama <nama>`
- `.portfolio edit bio <teks>`
- `.portfolio edit spesialisasi <tag, tag>`
- `.portfolio edit lokasi <kota>`
- `.portfolio edit whatsapp 6281234567890` / `.portfolio edit whatsapp off`
- `.portfolio edit instagram <username>`
- `.portfolio edit behance <username/link>`
- `.portfolio edit dribbble <username/link>`
- `.portfolio edit website <url>`
- `.portfolio add` — upload satu karya langsung dari chat pribadi WhatsApp (JPEG, PNG, WebP, atau SVG; maksimal 15 MB), lalu isi judul, kategori, dan deskripsi. Upload website tetap tersedia.
- `.portfolio karya` — own work and moderation status.
- `.portfolio preview` — public profile preview.
- `.portfolio website` / `.portfolio qr` — public profile link/QR.
- `.portfolio status on|off` — publish or hide profile.
- `.portfolio analytics` / `.studio` — profile and contact analytics.
- `.portfolio unggulan ART-ID` — toggle up to three approved featured works.
- `.portfolio delete ART-ID` — delete own work.

WhatsApp contact is public only when the designer explicitly enters it. The internal `contactJid` is not a public fallback. Social links are optional.

## Owner moderation

- `.marketadmin` — public/hidden profiles, approved/pending/rejected works, featured designers, and open reports.
- `.marketadmin designers [page]`
- `.marketadmin pending [page]`
- `.marketadmin reports [page]`
- `.marketadmin activity`
- `.portfolio pending` / `.portfolio approve ART-ID` / `.portfolio reject ART-ID alasan`
- `.portfolio verified DSN-ID on|off`
- `.portfolio popular DSN-ID on|off`
- `.marketreport` / `.marketreport tutup RPT-ID catatan` / `.marketreport abaikan RPT-ID catatan`

## Legacy commands

`.requestdesign`, `.client`, `.klien`, `.service`, and `.layanan` are recognized only to return a clear deprecation message. They do not create briefs, offers, orders, packages, payment records, or contact relays. Old `.marketadmin orders/payments/finance/ratings` views are disabled.

Old MongoDB schemas for order, offer, review, service, activity, dispute, and payment records remain in the model file solely for historical data compatibility. The active v5.91 bot feature does not import or query them. Do not drop old collections during deployment.

## Security and boundaries

- Public profile contacts are opt-in.
- Public WhatsApp is normalized to digits and rendered as `https://wa.me/<number>`.
- Internal account JIDs are never included in public profile output.
- Only approved work and public profiles appear in discovery.
- Reports are content-safety moderation, not dispute arbitration.
- Designer/client agreements, scope, fees, delivery, rights, and payment remain outside the bot.

## Staging requirements

Automated tests do not verify WhatsApp live delivery, MongoDB staging behavior, website contact routing, or real user consent comprehension. Verify those before production release.
