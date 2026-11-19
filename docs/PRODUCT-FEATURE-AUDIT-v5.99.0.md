# Product Feature Audit — PIR Visuals v5.99.0

## Product boundary

- Bot WhatsApp remains a designer directory and direct-contact route only.
- Website is the primary discovery and portfolio experience.
- Website project workspace remains optional and non-transactional.
- No payment, checkout, commission, escrow, contract handling, or transaction mediation through PIR.

## v5.99.0 completed source work

### Visitor discovery

- Beginner-friendly guided finder added above advanced directory filters.
- Categories, skill, optional location, optional keyword, and budget presets are supported.
- Fit sorting is deterministic and explainable; it is not an AI claim or quality rating.
- Featured and PIR-reviewed flags are not ranking bonuses.
- Match reasons are displayed only when relevant to the current fit sort.
- Existing filters, pagination, budget overlap, favorites, shortlist, portfolio links, and direct contact remain intact.

### Designer experience

- Private checklist estimates portfolio readiness based on completeness signals.
- Checklist actions link to profile, portfolio, and service sections.
- Approved portfolio count is read directly from MongoDB; pending items do not count.
- A case study must be approved and contain challenge + solution; outcome provides the final increment.
- The checklist is private and disclaims any professional-quality or client-acquisition guarantee.

## Known limits

- Fit matching uses fields the designer has supplied; incomplete profiles can score lower even when the designer is capable.
- Location matching is text-based and does not use maps/geocoding.
- Budget is an overlap with the advertised price range, not a quote or guarantee.
- Skill matching is text-based and does not infer synonyms beyond what the profile contains.
- Readiness is a completeness checklist, not an assessment of visual quality.
- Live MongoDB and browser acceptance are still required.

## Next priorities

1. Run full local tests and E2E.
2. Observe finder queries on staging and validate index/query performance.
3. Review matching language with first-time users.
4. Add aggregate, privacy-conscious discovery analytics only after consent/retention review.
5. Keep operational monitoring and restore drills as release gates.
