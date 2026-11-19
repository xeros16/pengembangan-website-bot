# PIR Visuals v5.71.0 — Interaction Design Notes

This release extends the existing PIR visual language rather than introducing a separate component style. The interface continues to use the dark forest/ivory palette, editorial typography, restrained borders, and existing spacing tokens.

## Interaction decisions

- **Gallery:** a native `<dialog>` is used for modal semantics, browser-managed focus trapping, Escape handling, and predictable mobile behavior. Gallery groups are scoped to one case study. Arrow keys and touch swipe provide equivalent navigation.
- **Quick View:** a native dialog exposes a small public profile summary without a network request or private profile fields. All inserted values are assigned through `textContent`; avatar URLs are restricted to HTTPS.
- **Discovery:** category chips and keyword search filter only the already-approved work cards rendered by the server. The existing server-side designer search and GET query contract are unchanged.
- **Analytics:** metric switching only re-renders the visualization from the existing daily view/contact/portfolio counts. It does not infer conversion or transaction outcomes.
- **Upload:** previews use temporary object URLs and revoke them when replaced or when the page is left. The native multipart form remains the upload mechanism.

## Motion and accessibility

- Transitions are short and restrained; no extra scroll listeners, global animation loops, or new dependencies are introduced.
- Motion Off and `prefers-reduced-motion` remove the new modal/card transitions.
- Buttons have explicit labels, status changes use polite live regions, and dialogs return focus to their opener where applicable.
- Touch navigation supplements, rather than replaces, the previous/next buttons.

## Safety and privacy boundaries

- Quick View displays only fields already shown publicly on the designer card.
- No private contact details, edit tokens, or collection secrets are copied into the preview.
- No new analytics events or data collection endpoints are added.
