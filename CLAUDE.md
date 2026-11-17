# google-drive-folder-size

A tool that reports how much space each folder in a Google Drive takes up, rolled up through the folder tree.

## Status

Planning. No code yet. The runtime (local CLI, Apps Script, or web app) is not decided; do not scaffold one until the user picks.

## Ground rules

- The idea came from a web-search AI summary that the user considers unreliable. Do not treat any Drive API or Apps Script claim as fact until it is checked against the official Google docs (developers.google.com/drive, developers.google.com/apps-script). Record what was verified, and where, in `docs/verified-facts.md` once that exists.
- Read-only against Drive. Request the narrowest scope that works (metadata-only if it is enough). The tool must never modify, move, or delete Drive content.
- Never commit OAuth client secrets, tokens, or scan output containing file names. `.gitignore` covers the usual file names; check before adding new ones.

## Things known to need verification before design is final

- Whether native Google Docs/Sheets/Slides report a size, and which field (`size` vs `quotaBytesUsed`) reflects quota use.
- `files.list` page size limits and rate quotas.
- How shortcuts, shared drives, and "shared with me" items appear in listings, and whether they should count.
- Current Apps Script execution time limits.

## Repo

- GitHub: `RandyHaylor/google-drive-folder-size` (private)
- Default branch: `main`
