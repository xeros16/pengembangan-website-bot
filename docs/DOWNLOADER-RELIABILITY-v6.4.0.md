# Downloader Reliability — v6.4.0

## Retry policy
- Maximum one application-level retry.
- Retry only when `classifyDownloaderError()` returns `network` or `rate-limited` (HTTP 429).
- No retry for timeout, unsupported URL/format, HTTP 401/403, private/unavailable content, file-size limits, or missing Python/yt-dlp/FFmpeg.
- yt-dlp's internal file/fragment/extractor retries are disabled for these operations so the application wrapper owns the single retry decision.
- Active AbortSignal is passed to child-process execution; cancellation aborts retry backoff immediately.

## Queue and status
- Each job tracks requester, phase, attempt, enqueue time, and AbortController.
- `.dl status` reports the requester's active phase or queue position.
- `.dl cancel` removes the requester's waiting job or aborts their active subprocess.
- A media send already in progress cannot be recalled; the command reports that limitation rather than claiming cancellation succeeded.
- Queue capacity remains bounded and reserved synchronously.

## Audio metadata and format
- FFprobe is optional; when installed, metadata inspection reads title, artist, album, duration, and container/format.
- Metadata inspection failure does not block an otherwise valid download; an explicit cancellation still aborts.
- MIME mapping uses the resulting file extension: MP3, M4A, AAC, OGG, Opus, WAV, FLAC, and WebM.
- `.dl health` reports Python/yt-dlp, FFmpeg, and optional FFprobe status.

## Safety
- Existing public HTTP(S) URL validation, local/private IP rejection, queue caps, size limits, and cleanup remain. Pinterest's public metadata-only fallback is attempted only for unsupported-format errors on Pinterest hosts; never after network, 429, 401/403, timeout, or private/unavailable errors.
- Do not use the bot to download content without the right or permission to do so.
