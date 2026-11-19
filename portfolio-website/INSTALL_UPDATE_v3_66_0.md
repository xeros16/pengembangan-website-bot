# Install PIR Visuals v3.66.0

1. Back up the current project.
2. Stop the local website process.
3. Extract this update at the project root, preserving the `portfolio-website/` folder structure.
4. Allow the included website source, package metadata, tests, and root `package.json` check script to be replaced.
5. Do not replace `.env`, `node_modules`, database files, upload directories, or WhatsApp authentication/session data.
6. From the project root run:

```bash
npm run website:check
node --test portfolio-website/tests/phase2b-business-studio-v3.66.test.js portfolio-website/tests/project-workflow-integration-v5.84.test.js portfolio-website/tests/security-hardening-v5.86.test.js
npm run website
```

The website version is 3.66.0. No dependency installation or database migration is required for this patch.
