# Install PIR Visuals Website Update v3.64.0

1. Back up the existing `portfolio-website` folder.
2. Stop the website process.
3. Extract this update ZIP into the project root and allow the listed files to overwrite their existing counterparts.
4. Keep `.env`, `node_modules`, database files and WhatsApp authentication/session files untouched.
5. From the `portfolio-website` folder run:

   ```bash
   npm run check
   node --test tests/pir-brand-harmony-v3.63.test.js tests/pir-whole-site-v3.64.test.js
   npm start
   ```

6. Hard-refresh the browser with `Ctrl + Shift + R`.

This is a presentation-focused update. Existing routes, forms, query parameters, directory filters, account workflows, portfolio records and command catalogue behavior are preserved. The full legacy test suite currently has unrelated outstanding failures; use the focused v3.63/v3.64 tests above to verify this update.
