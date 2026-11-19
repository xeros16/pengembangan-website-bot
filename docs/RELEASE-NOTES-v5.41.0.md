# PIR Visuals v5.41.0 — Designer Reputation System

## What changed
- Public designer profiles show an overall rating and review count based on all published, email-verified and Owner-approved reviews.
- Latest approved reviews are displayed with star ratings and an email-verified label.
- A Top Rated badge is awarded automatically at 5 or more approved reviews with an average of at least 4.5/5.
- Review submission requires client name, email, rating, project and a meaningful review message.
- Client email verification is required before the review enters Owner moderation.
- Each email address can submit one review per designer; only a SHA-256 hash is stored for duplicate prevention.
- Owner approves or rejects verified reviews from `/dashboard`.
- Designers can hide a published review but cannot publish or approve reviews themselves.
- Failed SMTP sends remove the pending review reservation so the client can retry.
- Review submission and verification routes are now reachable before the public-directory fallback.

## How to use
1. Open a public designer profile.
2. Submit a review after completing a project.
3. Verify the email from the received message.
4. Owner opens `/dashboard` and approves or rejects the review.
5. Approved reviews and the aggregate rating appear on the public designer profile.

## Trust and scope
- The platform labels email-verified reviews; it does not claim independent proof of a paid/completed project.
- PIR Visuals remains a discovery/portfolio platform. Client and designer arrangements stay direct.
- SMTP must be configured for email verification.
