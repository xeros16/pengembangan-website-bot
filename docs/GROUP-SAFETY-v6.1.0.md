# Group Safety Upgrade — v6.1.0

## `.antitoxic`

The filter is opt-in per group and uses a list maintained by that group's Admins. It is intentionally not an AI classifier: exact whole-word matching is predictable and reduces false positives compared with substring matching or automatic sentiment inference.

Commands:

```text
.antitoxic
.antitoxic tambah <kata>
.antitoxic daftar
.antitoxic on
.antitoxic off
.antitoxic hapus <kata>
.antitoxic reset
```

Rules:
- Only group Admins can change or inspect the filter list.
- Maximum 30 entries; each entry is one token, 2–32 Unicode letters/numbers/underscore/hyphen.
- Adding a word never enables the filter automatically.
- The filter is disabled by default and is disabled automatically if the last word is removed.
- Group Admins and verified bot Owners are exempt from the filter.
- The bot deletes a matching message only if it has group Admin permission; otherwise it warns without claiming deletion.
- The moderation log stores a generic match detail rather than copying the full offending message.

## Warning review

The system counts warnings from the rolling last 30 days. When the count reaches three, the bot reminds Admins to review `.warnings` and `.modlogs`. This is a review reminder only: the bot does not auto-kick, auto-ban, or auto-mute a member.

## Existing protections retained

- `.antilink` remains enabled by default for non-admin members.
- `.antispam` remains enabled by default with the existing in-memory rate/repeat detector.
- Welcome, goodbye, rules, manual warning, moderation logs, and Admin access checks remain unchanged.

## Limits

- The word list is group-configured and cannot infer intent, sarcasm, spelling variants, or context.
- The in-memory spam detector resets when the process restarts; this release does not claim persistent anti-spam counters.
- Live deletion depends on the bot's actual WhatsApp group role and must be verified in a test group.
