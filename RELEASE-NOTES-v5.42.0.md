# PIR Visuals v5.42.0 — Client Collections & Moodboards

## Features
- Client-facing `/collections` page to create multiple inspiration collections.
- Collections can contain up to 20 public designer profiles and 30 approved portfolio works.
- Public collections have shareable URLs; private collections are accessible only through the one-time secret management link.
- Collection management supports title, description, designer IDs, portfolio item IDs, visibility changes and deletion.
- Secret management token is stored as a SHA-256 hash in MongoDB; the raw token is shown only once.
- Collection views are counted for public collections.
- Profile and portfolio cards display IDs needed to add them to a collection.
- Moodboard destination is linked from the main navigation and footer.
- No client payment, booking or intermediary transaction flow is introduced.

## How to use
1. Open `/collections`.
2. Enter a title and description.
3. Copy Designer ID from a public designer profile and portfolio Item ID from a published work.
4. Add IDs separated by commas.
5. Choose public or private and create the collection.
6. Save the management link securely; share only the public URL for public boards.
7. Use the secret management link to edit or delete the collection.

## Security notes
- Create and edit endpoints are rate limited.
- IDs are validated against public designer profiles and approved works.
- Private board access and editing require a high-entropy secret key; only its hash is stored.
- Public board responses are cacheable briefly; private responses are no-store and noindex.
