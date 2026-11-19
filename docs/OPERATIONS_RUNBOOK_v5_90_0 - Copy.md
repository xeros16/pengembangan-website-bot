# Operations Runbook — PIR Visuals Bot v5.90.0

## Release scope
Designer Workflow 2.0 adds a six-stage workflow state to existing per-user design projects. It uses the existing `User.preferences.designProjects` field and requires no database schema migration.

## Pre-deployment
- Back up MongoDB and WhatsApp auth state.
- Keep `.env`, auth directories, backups, and runtime configuration outside the release archive.
- Install dependencies with `npm ci`.
- Run root tests, website tests, syntax checks, and `npm run audit:release`.
- Verify the bot can connect to staging WhatsApp and MongoDB.

## User workflow operations
- Create: `.designproject start <name> | <kind> | <theme> | <audience> | <platform>`
- View current stage: `.designproject step <name>`
- Confirm stage: `.designproject done <name>`
- Progress: `.designproject progress <name>`
- Board: `.designproject board`
- Reopen: `.designproject reopen <name> | <stage>`
- Export: `.designproject export <name>`

## State semantics
- Stage order is fixed: `brief`, `concept`, `layout`, `visual`, `qa`, `handoff`.
- A stage is completed only after explicit user confirmation.
- Completion advances exactly one stage; attempts to skip are rejected.
- Reopening a completed stage clears that stage and all downstream completion flags.
- Duplicate creates a new project with the same brief but resets workflow progress.
- Legacy projects without workflow start at `brief`.
- Project lifecycle status (`planning`, `progress`, `review`, `done`) remains separate from workflow stage progress.

## Troubleshooting
- If the workspace is unavailable, check MongoDB connectivity and the `User` model.
- If a project is missing, confirm the command is sent from the same WhatsApp JID used to create it.
- If stage guidance is not relevant, update the project's kind/theme/platform using `.designproject edit`.
- If a stage was marked done accidentally, use `.designproject reopen <name> | <stage>`.
- If two bot processes write the same user's projects concurrently, the in-process queue does not coordinate across processes; use a single active bot writer or implement a distributed lock before multi-instance deployment.

## Verification still required
Automated tests do not validate real WhatsApp delivery, MongoDB replica/standalone behavior, live backup restoration, or user comprehension. Perform a staging walkthrough with beginner and experienced designer accounts before production rollout.
