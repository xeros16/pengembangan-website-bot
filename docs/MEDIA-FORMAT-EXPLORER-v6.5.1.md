# Media Format Explorer v6.5.1 — Public URL Guardrails

## Commands

```text
.mediaformat
.mediaformat cek https://tautan-publik
.mediaformat estimasi video-wa 120
.mediaformat estimasi video-compact 120
.mediaformat estimasi audio-mp3 240
.mediaformat estimasi audio-high 240
```

`cek` runs yt-dlp metadata inspection with `--ignore-config`, `--skip-download`, `--no-playlist`, and internal retries disabled. It does not save or send media. A requester has a 15-second cooldown and the bot allows at most two concurrent inspections. Provider support and access rules remain controlled by yt-dlp and the source website.

## Recognized media and send limits

- Video containers: MP4, WebM, M4V, MOV, MKV; maximum 50 MB.
- Audio containers: MP3, M4A, AAC, OGG, OPUS, WAV, FLAC, WebM; maximum 15 MB.
- Image containers: JPG, PNG, WebP, GIF, BMP, AVIF; maximum 10 MB. JPG/PNG/WebP are recommended for compatibility.

The recognized extension list does not guarantee every provider, codec, or WhatsApp client will accept every file. The actual metadata inspection is provider-specific and may fail for private, deleted, login-only, rate-limited, or unsupported media.

## Preset estimates

| Preset | Target profile | Estimate basis |
|---|---|---|
| `video-wa` | H.264 720p + AAC 96 kbps | 1000 + 96 kbps |
| `video-compact` | H.264 480p + AAC 64 kbps | 650 + 64 kbps |
| `audio-mp3` | MP3 128 kbps | 128 kbps |
| `audio-high` | AAC/MP3 192 kbps | 192 kbps |

Estimates accept durations from 1 to 14,400 seconds and add 8% overhead. They are planning estimates only; this release does not convert media using these presets.


## v6.5.1 URL validation hardening

- Rejects loopback, private, link-local, carrier-grade NAT, benchmarking, documentation, multicast, and reserved IPv4 literals.
- Rejects IPv6 loopback, unique-local, link-local, multicast, documentation, IPv4-mapped, and other non-public special-use literals.
- Rejects localhost and common private/reserved host suffixes such as `.internal`, `.lan`, `.home.arpa`, `.test`, `.example`, and `.invalid`, plus single-label hostnames.
- These checks reduce obvious local-network targets but do not replace deployment-level outbound network restrictions. DNS rebinding and provider redirects must also be controlled by the host/network egress policy.
