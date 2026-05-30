# Slack Emoji Link

Copy custom Slack emoji between workspaces you are already logged into in your browser.

This project is a cross-browser web extension (Chrome/Edge and Firefox) with no backend. Emoji listing and uploads run in the extension background service worker, while the UI stays responsive and listens for progress over a runtime port.

**Not affiliated with Slack Technologies.**

- **Privacy Policy:** https://aaroncohen.github.io/slack-emoji-link/privacy.html
- **Project site:** https://aaroncohen.github.io/slack-emoji-link/

## Features

- Auto-detect Slack workspaces from existing Slack browser sessions
- Pick source and destination workspaces
- Browse, search, and multi-select emoji
- Shift+click range selection and Cmd/Ctrl+click toggle
- One-click "Copy entire workspace"
- Collision resolver with rename suggestions and skip-all
- Off-main-thread transfer with progress bar, live log, and cancel support
- Confirmation screen with copied emoji summary

## Development

```bash
npm install
npm run dev          # Chrome/Edge
npm run dev:firefox  # Firefox
npm test
```

Build distributable zips:

```bash
npm run zip
npm run zip:firefox
```

## Load unpacked

### Chrome / Edge

1. Run `npm run dev` or `npm run build`.
2. Open `chrome://extensions`.
3. Enable Developer mode.
4. Click **Load unpacked** and select `.output/chrome-mv3`.

### Firefox

1. Run `npm run dev:firefox` or `npm run build:firefox`.
2. Open `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on…** and choose `.output/firefox-mv2/manifest.json`.

## How workspace discovery works

When you visit Slack in the browser, Slack stores per-workspace session tokens in `localStorage.localConfig_v2`. The extension content script reads those team entries and sends them to the background worker, which persists them locally. If no workspaces are found, open Slack in a normal tab, sign in, then click **Refresh workspaces** in the manager UI.

## Security note

Your Slack session tokens and cookies never leave your browser. All API calls are made directly from the extension background worker to Slack using your existing browser session. No remote server is involved.

## Limitations

- Uses Slack's undocumented `emoji.add` endpoint, which requires an authenticated workspace session.
- Large transfers are rate-limited by Slack; the extension throttles uploads and retries on `429`/`ratelimited`.
- Intended for personal use with workspaces where you have permission to manage custom emoji.

## License

MIT — see [LICENSE](LICENSE).
