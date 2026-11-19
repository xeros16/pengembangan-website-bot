# Project Workspace Privacy Controls — v5.98.0

- Client invitation token is generated randomly, stored only as a hash, expires after 30 minutes, and is consumed once.
- Client session cookie is HttpOnly and SameSite=Strict; only a token hash is stored, with a 30-day expiry.
- Every client project route compares the session's `projectId` with the requested project ID.
- Designer routes scope project lookup and mutation by the authenticated session's `designerId`.
- Client invite access is rate-limited by source IP; repeated invitations are rate-limited per designer.
- Project pages use `Cache-Control: no-store` and `Referrer-Policy: no-referrer`.
- Designer can use **Cabut semua akses klien** with an explicit confirmation checkbox to delete every active client session for that project and invalidate unused invitation links. A new invite can be issued later.
- Revocation audit timestamp and actor are stored on the project record.
- Workspace is optional and supports project notes/progress only. PIR does not process payment, checkout, commission, escrow, or mediate transactions.
