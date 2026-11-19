# Guided Designer Matching — v5.99.0

The guided finder submits a normal GET request to `/discover`. It does not create a lead, brief, account, saved preference, or project workspace.

## Matching signals

| Signal | Weight | Rule |
|---|---:|---|
| Primary category | 40 | Exact category match; partial related category earns 28 |
| Specialization | 35 | Text match against the designer's specialties |
| Location | 15 | Text match against the designer's public location |
| Budget overlap | 10 | Advertised price range overlaps the selected budget and at least one advertised price is present |
| Keyword | 15 | Match against public display name, bio, location, or specialties |

The total is an internal ordering score, not a displayed quality score. Cards show the available reason labels rather than the numeric score.

## Ranking fairness

- `isFeatured` and `isVerified` do not add match points.
- Featured and PIR-reviewed filters remain explicit user choices.
- Ties are ordered by profile creation date and display name for deterministic results.
- Only public profiles are considered.

## Important interpretation

The finder can only use the information a designer publishes. A missing specialty, location, or price range may reduce matching signals; it does not mean the designer lacks that skill or is unavailable. Budget overlap is not a quote. Visitors should review the portfolio and confirm scope, price, and availability directly with the designer.
