# Feature Discovery Hub — v6.7.0

The WhatsApp main menu intentionally remains short. The complete catalog is exposed through `.fitur` so features are not hidden merely because they do not fit in the home menu.

## Commands

- `.fitur` — category index with live command counts.
- `.fitur cari <kebutuhan>` — natural-language search.
- `.fitur kategori <nama kategori>` — browse a category.
- `.fitur semua [halaman]` — browse the full command catalog.
- `.fitur alur` — list guided workflows.
- `.fitur alur <workflow-id>` — show the steps of one workflow.
- `.help <command>` — explain purpose, syntax, example, category, and general access.
- `.cepat` — save personal shortcuts to frequently used commands.
- `.asisten <kebutuhan>` — ask PIR Assistant to recommend commands/workflows; it does not execute commands.

Aliases: `.features` and `.jelajah`.

## Example discovery flow

```text
.fitur
.fitur cari kolaborasi desainer
.fitur kategori Creative Asset Studio
.fitur semua 2
.fitur alur
.fitur alur apple-music-preview
.help assetstudio
```

The catalog is generated from the active command registry. A listed command may still depend on permissions, MongoDB, external providers, installed media tools, or group/private-chat context. The command's runtime handler remains the authority for access.

## Website

The public website exposes `/commands` as **Semua Fitur Bot** in the primary navigation. The page reads generated `docs/commands.json`; it displays and copies commands but does not execute them or access WhatsApp chat data.
