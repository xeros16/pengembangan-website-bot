# PIR VISUALS — Release v3.66.0

## Phase 2B: Business & Designer Studio functional hardening

### Public business-to-designer brief flow
- Added per-IP, per-designer, and per-email rate limits to public brief submissions.
- Added same-origin / Fetch Metadata checks for browser form submissions.
- Added a honeypot field; bot-filled submissions receive a neutral response and do not create records.
- Normalized optional WhatsApp numbers and require international-format numbers when supplied.
- Added compensating cleanup if creating the lead, client project, or initial timeline entry fails.
- Made the designer notification a non-blocking side effect after the lead and project workspace are saved.

### Designer Studio
- Added clear instructions for requesting the WhatsApp OTP from the linked phone number; the helper copy states the five-minute expiry and one-time use.
- Changed logout from a state-changing GET link to a CSRF-protected POST form in both Studio navigation locations.
- GET `/studio/logout` now returns 405 and does not invalidate the session.

### Preserved behavior
- Existing login, registration, email verification, password reset, portfolio upload, moderation, and project workflow models remain unchanged.
- No schema migration was introduced.
- No email, WhatsApp message, or live database mutation was performed during these tests.

## Live verification still required
- MongoDB persistence must be exercised with a safe test designer account.
- SMTP delivery must be checked with a test inbox.
- WhatsApp account linking and OTP delivery must be checked from the registered phone number.
- No live credentials or production data were used during this QA.
