# Test patterns for slack-emoji-link

## Conventions

- Prefer behavior-focused unit tests in `lib/` modules. Mock `fetch` only when testing retry/backoff helpers.
- Test outputs and public helper contracts, not React component implementation details.
- Keep emoji fixtures small: one alias entry, one image URL entry, and a couple of collision cases.

## What works well

- Pure functions for emoji parsing, collision detection, selection range math, and retry delay parsing are easy to test and stable.
- Building transfer item lists from store-like inputs in isolation avoids needing a browser runtime in tests.

## Learnings

- Slack alias entries use the `alias:original_name` URL protocol in `emoji.list` responses; tests should cover that explicitly.
- Collision rename suggestions should follow existing separator conventions (`-` vs `_`) before falling back to `-`.
- `copy entire workspace` must pass an explicit name set into collision resolution because React state updates are asynchronous.
