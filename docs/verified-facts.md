# Verified facts

Checked against Google's official documentation on 2026-11-17. Each line names the page it came from. Anything under "Not verified" is an assumption the code currently relies on.

## Drive API

- `size` is "Size in bytes of blobs and Google Workspace editor files" and is not populated for folders or shortcuts. The docs do not say native Docs/Sheets/Slides report 0. — developers.google.com/drive/api/reference/rest/v3/files
- `quotaBytesUsed` is "the number of storage quota bytes used by the file", including the head revision and kept revisions. — same page
- A file has exactly one parent folder. — same page
- Folder MIME type is `application/vnd.google-apps.folder`; shortcut is `application/vnd.google-apps.shortcut`. — same page and guides/search-files
- `files.list` maximum `pageSize` is 1000. Default `corpora` is `user` ("files owned by or shared to the user"). Trashed files are returned unless `trashed = false` is in the query. — reference/rest/v3/files/list
- `files.list` returns only `kind`, `id`, `name`, `mimeType`, `resourceKey` unless `fields` asks for more. — same page
- Page tokens are "typically valid for several hours". `incompleteSearch: true` means results may be missing. — same page
- `orderBy` should be avoided on large collections (timeouts). — same page
- Rate limit errors are `403 User rate limit exceeded` or `429`; the documented handling is exponential backoff capped at 32 or 64 seconds. A `files.list` call costs 100 quota units of 325,000 per user per minute. — guides/limits

## Apps Script

- Script runtime limit is 6 minutes per execution for both consumer and Workspace accounts. 30 simultaneous executions per user. — apps-script/guides/services/quotas
- `google.script.run` allows 10 concurrent calls; arguments and return values must be primitives, arrays and plain objects (no `Date`). — apps-script/guides/html/communication
- The advanced Drive service (v3) is enabled through the manifest's `enabledAdvancedServices` or the editor's "Add a service". With the default Apps Script-managed Cloud project, no Cloud Console step is needed. — apps-script/guides/services/advanced
- A web app can execute "as me" or "as user accessing the web app". In the second mode each visitor authorizes and it runs under their identity; the owner's email is shown on the authorization screen. New-user authorization is rate-limited. — apps-script/guides/web
- Scopes can be narrowed with `oauthScopes` in `appsscript.json`. — apps-script/concepts/scopes
- clasp needs Node 20+, `clasp login`, and the Apps Script API switched on at script.google.com/home/usersettings. `clasp create --type webapp` exists; deploy is `clasp version` then `clasp deploy`. — apps-script/guides/clasp

## Sharing limits

- `drive.metadata.readonly` and `drive.readonly` are restricted scopes. `drive.file` is the only non-sensitive Drive file scope, and it covers only files opened with or shared to the app, so it cannot list a whole Drive (that last part is inference from the description). — drive/api/guides/api-specific-auth
- An unverified app using sensitive or restricted scopes shows an "unverified app" screen to users outside the owner's Workspace domain, including a Gmail owner on their own script. — apps-script/guides/client-verification
- Unverified apps are limited to "100 new users in total". Personal-use apps with fewer than 100 users may stay unverified. — support.google.com/cloud/answer/7454865 and /13464323
- Verification requires switching to a standard (hand-managed) Cloud project, which cannot be undone, plus a privacy policy URL and site ownership check; it "might require several months". — apps-script/guides/client-verification, apps-script/guides/cloud-platform-projects, support answer 7454865

## Confirmed by a real run (2026-11-17)

- The query `'me' in owners and trashed = false` is accepted.
- The manifest values `"executeAs": "USER_ACCESSING"` and `"access": "ANYONE"` are accepted and deploy.
- `Drive.Files.get('root')` works under `drive.metadata.readonly`.

## Not verified

- That `Drive.About.get` works under `drive.metadata.readonly`, and that `storageQuota.usageInDrive` includes trashed files (the progress bar subtracts `usageInDriveTrash`). If the lookup fails the page falls back to a bar with no percentage.
- That the My Drive root folder is not itself returned by `files.list` (the code tolerates either).
- Whether the 100-user cap is a lifetime total or can be reset.
- What restricted-scope verification costs (security assessment, annual recertification); those pages were not read.
- Whether native Google Docs/Sheets/Slides count toward quota. The app shows `quotaBytesUsed` as reported, so it does not depend on the answer.
