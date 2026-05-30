# Store submission notes

Reference links for publishing Slack Emoji Link.

## Hosted pages

After GitHub Pages is enabled (automatic via `.github/workflows/pages.yml` on push to `main`):

- **Site:** https://aaroncohen.github.io/slack-emoji-link/
- **Privacy policy (store listing URL):** https://aaroncohen.github.io/slack-emoji-link/privacy.html

If Pages is not live yet, open **Repository → Settings → Pages** and confirm the source is **GitHub Actions**.

## Release builds

```bash
npm ci
npm test
npm run zip
npm run zip:firefox
```

Upload the zips from `.output/` to each store developer dashboard.

## Chrome Web Store

- Privacy policy URL: https://aaroncohen.github.io/slack-emoji-link/privacy.html
- Declare that authentication/session data is used locally to call Slack; nothing is sent to the developer.
- Justify `cookies`, `scripting`, `tabs`, and Slack host permissions in the listing form.

## Firefox Add-ons (AMO)

- Extension ID: `slack-emoji-link@aaroncohen.github.io` (set in `wxt.config.ts`)
- Data collection: `none` (declared in manifest)
- Include source upload and build instructions from README
- Privacy policy URL: same as above

## Trademark

Use “Not affiliated with Slack Technologies” in store descriptions.
