# PIR Assistant — v6.3.0

## Purpose
`.asisten <kebutuhan>` is a deterministic intent router that searches the current command catalog and recommends existing PIR Visuals commands.

## Usage
```text
.asisten
.asisten aku ingin membuat poster promosi
.asisten cari lagu dan informasi album
.asisten cari anime populer
.asisten unduh audio dari tautan publik yang diizinkan
.asisten belajar tipografi untuk pemula
```

## Behavior
- Uses `searchCommandsByNeed()` and the same command catalog used by `.cari` / `.commands`.
- Shows one primary recommendation plus related commands.
- Rewrites default-dot examples to the configured bot prefix.
- Does not execute suggested commands.
- Does not process ordinary chat messages automatically.
- Does not call a generative AI provider and must not be marketed as an AI chat model.

## Safety and privacy
- Query is limited to 120 characters and stripped of control/WhatsApp formatting characters.
- No query history is persisted.
- Existing command permissions remain authoritative; suggestions do not grant access.
- The feature is available only when explicitly invoked with `.asisten`.
