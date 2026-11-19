# PIR Visuals v5.35.0 — Designer Password UX

## Designer Studio only
- Made the password reset entry point prominent on the Designer Studio login page.
- Added a dedicated reset page with clear instructions, expiry notice (20 minutes), spam-folder hint, and a direct return-to-login link.
- Improved email/password autocomplete hints for the login and reset forms.
- Added an authenticated change-password panel inside Designer Studio.
- Change password requires the current password, valid session CSRF token, a matching confirmation, and a new password of 12–128 characters.
- Password changes invalidate all active Designer Studio sessions and clear any pending password-reset token.
- After changing password, the designer is redirected to login with a success notice.
- Existing email-based reset flow remains restricted to verified designer email addresses.

## Scope
- No Owner Dashboard password/reset functionality was changed.
- WhatsApp Baileys, MongoDB, website process separation, and Game Center separation are preserved.

## Validation
- Website JavaScript syntax check passed.
- Website security tests include visible reset entry, authenticated password change, CSRF, current-password verification, session revocation and email-token expiry.
- Live SMTP delivery and Cloudflare tunnel rendering must be checked on the Windows deployment.
