# PIR Visuals Bot v6.7.7

- Bundles PIR Visuals Website v3.54.0 with the latest Designer Studio upload and form-layout fixes.
- Profile photo uploads now support high-resolution PNG/JPG/WebP exports up to 100 megapixels (5 MB file ceiling), with server-side 512 × 512 WebP downsampling when needed.
- Designer Studio work actions, testimonial/service forms, profile pricing and checkbox groups now have clearer spacing and more readable text fields.
- Existing bot commands, WhatsApp flows, `.env`, auth state, uploads, backups and database handling are unchanged.

Website verification: 16/16 focused tests passed; `node --check` passed for the modified website server and media helper.
