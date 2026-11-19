# Install PIR Visuals Website Update v3.65.0

1. Back up the current `portfolio-website` folder.
2. Stop the local website process.
3. Extract this update ZIP into the project root and allow the listed files to overwrite their existing counterparts.
4. Keep `.env`, `node_modules`, database files, and WhatsApp authentication/session files untouched.
5. From the `portfolio-website` folder run:

   ```bash
   npm run check
   node --test tests/discover-functional-qa-v3.65.test.js tests/directory-quality-v5.97.test.js tests/matchmaking-v5.99.test.js
   npm start
   ```

6. Open `http://localhost:3080/discover` and hard-refresh with `Ctrl + Shift + R`.

The main Discover repair is the contained filter rail: on desktop it stays alongside the designer directory but stops before the Selected Work section. On tablet/mobile it returns to normal flow.
