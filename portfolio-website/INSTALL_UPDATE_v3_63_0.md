# Install PIR Visuals Website Update v3.63.0

1. Back up the existing `portfolio-website` folder.
2. Stop the website process.
3. Extract this update ZIP into the project root and allow the listed files to overwrite their existing counterparts. The brand refinements are appended to the already-loaded final stylesheet, so no additional stylesheet link is needed.
4. Keep your existing `.env`, `node_modules`, MongoDB data, and WhatsApp session/authentication files untouched.
5. From the `portfolio-website` folder run:

   ```bash
   npm run check
   node --test tests/pir-brand-harmony-v3.63.test.js
   npm start
   ```

6. Hard-refresh the browser with `Ctrl + Shift + R`.

This is a presentation-only update. Existing routes, data, forms, and account workflows are not intentionally changed.
