# google-drive-folder-size

A tool that reports how much space each folder in a Google Drive takes up, rolled up through the folder tree.

## Status

First version written, unit-tested locally, and deployed as a web app. The user ran a full scan of their own Drive successfully on 2026-11-17.

## Layout

- `src/` — the Apps Script project (clasp `rootDir`). `Code.js` is the server (one `files.list` page per call), `rollup.html` is the pure tree-rollup logic, `index.html` is the page.
- `tests/` — Node tests; run `npm test`. They load `src/Code.js` and `src/rollup.html` as text, so keep those free of top-level side effects and use `var`/function declarations at top level.
- `docs/verified-facts.md` — what has been checked against Google's docs, and the assumptions that have not.

## Deploying

clasp 3.x is installed and logged in; the Apps Script project exists and `.clasp.json` points at it. Run clasp from the repo root.

- Upload code: `clasp push --force`
- Update the live web app in place (keeps the same URL): `clasp create-deployment --deploymentId AKfycbwJb93H1_lIPK0LfQRNruVHEy8O4nFNRKDB6kbUZKr_YDyvk8AZ5soAWyBRe2VcYOLy7A --description "..."`
- Live URL: https://script.google.com/macros/s/AKfycbwJb93H1_lIPK0LfQRNruVHEy8O4nFNRKDB6kbUZKr_YDyvk8AZ5soAWyBRe2VcYOLy7A/exec
- Editor: https://script.google.com/d/1hijM4tRgBIZOEQkBllVzdvZnlGJ2QnVHoEk6BpoDjz-WYre4o4Z-3Ip-/edit
- Never run `clasp create-script` again in this repo: it overwrites `src/appsscript.json` with a blank manifest.

## Decisions made

- **Runtime:** a Google Apps Script web app (online, runs inside the user's Google account). Chosen specifically because it avoids manual Google Cloud Console setup (project, consent screen, OAuth client), which the user does not want to do. A static site on GitHub Pages was considered and rejected for that reason; do not propose anything that needs a hand-made OAuth client. Not a local CLI either.
- **Scope of scan:** the signed-in user's My Drive only. No shared drives, no "shared with me".
- **Audience:** the user first, possibly a few other people. Not aiming for Google app verification.

## Ground rules

- The idea came from a web-search AI summary that the user considers unreliable. Do not treat any Drive API or Apps Script claim as fact until it is checked against the official Google docs (developers.google.com/drive, developers.google.com/apps-script). Record what was verified, and where, in `docs/verified-facts.md` once that exists.
- Read-only against Drive. Request the narrowest scope that works (metadata-only if it is enough). The tool must never modify, move, or delete Drive content.
- Never commit OAuth client secrets, tokens, or scan output containing file names. `.gitignore` covers the usual file names; check before adding new ones.

## Known limits

- The Drive listing scope is "restricted", so users see an "unverified app" screen and the app is capped at 100 new users. Lifting that needs a hand-managed Cloud project and Google review, which the user has ruled out for now.
- Open assumptions are listed under "Not verified" in `docs/verified-facts.md`; the first real run will settle most of them.

## Repo

- GitHub: `RandyHaylor/google-drive-folder-size` (public, so nothing private goes in commits)
- `README.md` is the user-facing guide; keep it in step with behaviour changes.
- Default branch: `main`
