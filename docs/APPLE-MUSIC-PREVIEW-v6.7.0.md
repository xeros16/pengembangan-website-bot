# Apple Music Public Preview — v6.7.0

## Supported commands

```text
.music preview https://music.apple.com/id/album/album-title/ALBUM_ID?i=TRACK_ID
.dl apple https://music.apple.com/id/album/album-title/ALBUM_ID?i=TRACK_ID
.dl https://music.apple.com/id/song/song-title/TRACK_ID
```

A single-track link is required. For an album URL, use the `?i=TRACK_ID` parameter Apple includes when opening a specific song. An album page without a track ID cannot identify which preview to send.

## What is downloaded
PIR calls Apple's public iTunes Lookup API for the track. If Apple returns `previewUrl`, PIR checks that it is an HTTPS URL on an allowlisted Apple audio CDN host, manually follows at most two redirects while revalidating each target against the same allowlist, checks the audio content type, enforces a 15 MB maximum, and sends the preview as audio to WhatsApp.

The preview is usually a short sample (often around 30 seconds), but the exact duration and availability are controlled by Apple.

## What is not supported
- Downloading the full Apple Music subscription track.
- Decrypting or bypassing FairPlay/DRM.
- Extracting audio from a subscriber-only stream.
- Downloading a preview when Apple does not publish one.

If no public preview is present, the bot tells the user that the track is not available for preview. It does not silently fall back to an unofficial source.
