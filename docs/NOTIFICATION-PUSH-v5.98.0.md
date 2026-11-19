# Designer Studio WhatsApp Push — v5.98.0

Push is **off by default**. A designer must explicitly enable it from the linked private WhatsApp chat:

```text
.portfolio notifikasi push aktif
.portfolio notifikasi push status
.portfolio notifikasi push nonaktif
.portfolio notifikasi push jam 22:00-08:00
.portfolio notifikasi push tanpa-jam-tenang
.portfolio notifikasi push jam-tenang
```

- The destination is captured from the private chat used for opt-in; the worker does not fall back to a public contact number.
- Only events created after `whatsappPushEnabledAt` are eligible. Old unread notifications are not replayed.
- Default quiet hours are 22:00–08:00 WIB.
- Delivery queue uses an atomic processing lease and retry delays of 1, 5, 15, and 60 minutes, with a maximum of five total attempts.
- The worker sends only to private JIDs and checks the existing outbound allowlist guard. Group JIDs are always rejected.
- Opt-out clears the destination and cancels queued/processing items for that designer. The manual inbox `.portfolio notifikasi` remains available.
- The push body contains a short notification title/message only. Full brief and project history remain inside the authenticated website workspace.

WhatsApp delivery is best-effort and at-least-once: the atomic lease prevents concurrent workers from sending the same item, but a process crash after WhatsApp accepts a message and before MongoDB records `sent` can result in a duplicate on lease recovery. If WhatsApp is offline, delivery retries; after the retry limit, the item remains visible in the manual inbox.
