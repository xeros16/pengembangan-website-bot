# Voice Lab — PIR Visuals v6.7.2

## Commands

- `.voice` / `.voice help` — show supported effects and usage.
- `.voice bass` or `.bass` — boost bass.
- `.treble`, `.clean`, `.compressor`, `.normalize` — audio treatment.
- `.chipmunk`, `.deep`, `.nightcore`, `.fast`, `.slow`, `.tempo 1.25` — pitch/tempo effects.
- `.8d`, `.echo`, `.reverb`, `.robot`, `.tremolo`, `.underwater`, `.telephone`, `.radio`, `.reverse`, `.stereo`, `.wide` — creative effects.
- `.karaoke` — basic center-channel reduction for stereo audio.

## How to use

1. Send a voice note, audio file, or audio document in WhatsApp.
2. Reply to that message with an effect command, for example `.bass` or `.8d`.
3. The bot downloads the quoted audio, applies an allowlisted FFmpeg filter, and sends the result as MP3.

You can also use `.voice bass` while replying to audio.

## Limits and safety

- FFmpeg must be installed and available on `PATH`.
- Input: 12 MB maximum.
- Processing duration: 10 minutes maximum; at most two Voice Lab jobs run concurrently.
- Output: MP3, 15 MB maximum.
- Temporary input/output files are created with random names and deleted in a `finally` cleanup path.
- User input is never inserted into an FFmpeg filter expression or shell command. Effects map to fixed filter strings; tempo is numeric-validated from 0.5× to 2.5×.
- Extreme-volume `earrape` effects are intentionally not included.
- Karaoke is a simple stereo center-reduction effect. It can also remove centered instruments and does not provide AI vocal separation.

## Staging checks still required

Test quoted voice notes, audio documents, long files, actual Baileys media downloads, and MP3 delivery on Android/iOS WhatsApp clients. Verify FFmpeg availability on the production host.
