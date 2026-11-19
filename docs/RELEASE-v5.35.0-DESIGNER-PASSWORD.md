# PIR Visuals v5.35.0 — Reset Password Designer (Windows)

## Public reset flow
1. Open `https://your-domain/studio`.
2. On the login page, use the highlighted **Lupa password? Reset sekarang** panel.
3. Enter the verified email address used by the Designer Studio account.
4. Check inbox and spam for the reset email.
5. Open the link within 20 minutes and set a new password (12–128 characters).
6. Return to `/studio` and sign in again with email, new password, and WhatsApp OTP.

Direct reset route: `/studio/forgot`.

## Change password while logged in
1. Open Designer Studio.
2. Scroll to **Keamanan akun**.
3. Enter current password, new password and confirmation.
4. Submit **Ganti password**.
5. Sign in again with the new password and WhatsApp OTP. Other active sessions are revoked.

## If the email does not arrive
- Confirm `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, and `SMTP_FROM` in `portfolio-website/.env`.
- Confirm `PORTFOLIO_PUBLIC_BASE_URL` points to the currently reachable public website URL (HTTPS when public).
- Restart the website process after changing `.env`.
- Check spam/junk.
- The email reset route intentionally shows a generic response and does not reveal whether an address is registered.
- The reset email link is valid for 20 minutes.

## Deploy
1. Stop the website process.
2. Back up the current source and `portfolio-website/.env`.
3. Extract v5.35.0 into a new folder and copy the existing environment file securely.
4. Run `npm install` in `portfolio-website`.
5. Start the website and test `/studio`, `/studio/forgot`, and a reset email using a test designer account.
6. Do not upload `.env`, Baileys auth, or backup folders to public storage.
