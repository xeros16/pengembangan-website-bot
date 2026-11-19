# PIR Visuals — Profile Review & Testimonial Transparency Standard (v5.97.0)

## 1. PIR-reviewed profile badge

The existing database field and Owner command remain backward-compatible:

- Database field: `DesignerProfile.isVerified`
- Owner command: `.portfolio verified DSN-ID on|off`
- Public label: **Profil ditinjau PIR** / **PIR-reviewed profile**

The badge means that a PIR Owner/moderator has manually reviewed the profile against the checks below. It is not a legal identity certificate, professional license, guarantee of authorship, endorsement, transaction history, service quality, delivery, or payment reliability.

### Minimum review checklist

1. The designer controls the WhatsApp account linked to the profile.
2. Public display name, profile description, and specialties are coherent and not obviously impersonating another person or brand.
3. At least one portfolio item has passed content moderation, or the profile is explicitly marked as a new creator profile and is not presented as an established portfolio.
4. Public contact channels are intentionally supplied by the designer; internal account JIDs are never used as public fallbacks.
5. No unresolved high-confidence impersonation, stolen-work, or safety report is known to the moderator at review time.

Record the review date and moderator in the operational moderation log. Re-review after a credible report, major ownership/profile change, or periodic directory audit. Remove the badge when the basis for the review is no longer valid.

## 2. Testimonials

Public testimonials currently require:
- successful email verification;
- Owner/moderator approval;
- no duplicate reviewer email for the same designer.

The public label must say **Email terverifikasi**. It must not say “verified client”, “verified purchase”, “verified transaction”, or imply that PIR has checked a commercial relationship. The current platform does not verify that a reviewer actually hired or paid the designer.

## 3. Reporting and moderation

Users can report a designer or portfolio item. Moderators should:
- review the public evidence and report context;
- avoid publishing private identity documents or private contact details;
- record a concise reason for approval/rejection when a workflow supports it;
- remove misleading verification claims promptly;
- escalate credible impersonation, copyright, or safety issues.

## 4. Required product language

Use:
- “Profil ditinjau PIR” for `isVerified`;
- “Email terverifikasi” for email-confirmed testimonials;
- “Karya disetujui” for portfolio moderation.

Do not use those terms interchangeably. PIR review, email verification, and portfolio moderation are three separate checks.
