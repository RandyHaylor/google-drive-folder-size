# Drive Folder Size

See how much space each folder in your Google Drive takes up.

Google Drive shows the size of individual files but not of folders. This is a small web app that scans your My Drive and shows an expandable folder tree, largest first, with the storage used, total file size and file count for every folder, including everything in its subfolders.

It runs entirely inside Google (as a Google Apps Script web app), asks for read-only access to file information, and cannot change anything in your Drive.

## Use it

1. Open the app: https://script.google.com/macros/s/AKfycbwJb93H1_lIPK0LfQRNruVHEy8O4nFNRKDB6kbUZKr_YDyvk8AZ5soAWyBRe2VcYOLy7A/exec
2. Sign in with the Google account whose Drive you want to scan.
3. The first time, Google asks you to authorize the app:
   - You will see **"Google hasn't verified this app"**. Click **Advanced**, then **Go to Drive Folder Size (unsafe)**. The warning appears because this is a personal project that has not been through Google's review, not because of anything it does.
   - Click **Allow**. The only permission requested is *See information about your Google Drive files*.
4. Click **Scan my Drive**. A progress bar runs while it reads your file list, 1,000 files at a time.
5. When it finishes, click the arrow beside any folder to open it.

Nothing is saved between visits. Click **Scan again** for fresh numbers.

### Reading the results

| Column | Meaning |
|---|---|
| **Storage used** | Bytes the folder's files count against your Google storage quota, as reported by Drive. Folders are sorted by this. |
| **File size** | The sum of the files' own sizes. This can differ from storage used, for example when old versions of a file are kept. |
| **Files** | Number of files in the folder and all its subfolders. Folders and shortcuts are not counted. |

Two rows can appear at the top level:

- **My Drive** — everything in your own folder tree.
- **Outside My Drive folders** — files and folders you own that sit inside someone else's folder. They still use your storage, so they are listed, but they have no place in your own tree.

### What is and isn't counted

- Only files **you own**. Files other people shared with you don't use your storage and are left out.
- Only **My Drive**. Shared drives are not scanned.
- Files in the **trash** are left out.
- Gmail and Google Photos storage are not part of Drive and are not shown, so the total here will be lower than your overall Google storage figure.

The progress bar is an estimate. Drive doesn't say how many files you have, so the bar compares storage found so far against your Drive's total usage. It moves unevenly and waits at 99% until the scan has really finished.

## Privacy

- **Read-only.** The app requests a single permission, `drive.metadata.readonly`. It can see file names, sizes and folder structure. It cannot open file contents, and it cannot edit, move, share or delete anything.
- **It runs as you.** Each visitor's scan runs under their own Google account and reads only their own Drive. The person who deployed the app cannot see your files or your results.
- **Nothing is stored.** No database, no logging of your file list, no analytics. Folder names and totals are held in your browser tab until you close it. File names never leave Google's servers.
- **You can revoke access** at any time at https://myaccount.google.com/permissions.

The whole app is the four files in [`src/`](src), if you want to check these claims.

## Limits

- **100 users.** Google limits unverified apps to 100 new users in total. If the link above stops accepting new sign-ins, deploy your own copy (below); it takes a few minutes and has its own limit.
- **Very large Drives** take longer. Each 1,000 files is one request, so a Drive with 200,000 files needs 200 requests. If Drive rate-limits the scan, it waits and retries on its own.

## Deploy your own copy

You need [Node.js](https://nodejs.org) 20 or later and a Google account. No Google Cloud Console setup is required.

1. Clone the repository and install Google's Apps Script command-line tool:
   ```
   git clone https://github.com/RandyHaylor/google-drive-folder-size.git
   cd google-drive-folder-size
   npm install -g @google/clasp
   ```
2. Switch on the Apps Script API for your account at https://script.google.com/home/usersettings.
3. Log in. A browser window opens; this authorizes `clasp` itself to manage your Apps Script projects, and its permission list is longer than the app's.
   ```
   clasp login
   ```
4. Create your own Apps Script project. Remove the existing `.clasp.json` first, because it points at the original project. Creating the project overwrites `src/appsscript.json` with a blank one, so restore it afterwards.
   ```
   rm .clasp.json
   clasp create-script --type webapp --title "Drive Folder Size" --rootDir src
   git checkout src/appsscript.json
   ```
5. Upload the code and deploy:
   ```
   clasp push --force
   clasp create-deployment --description "First version"
   ```
   The last command prints a deployment ID. Your app's address is:
   ```
   https://script.google.com/macros/s/DEPLOYMENT_ID/exec
   ```

To publish a change later at the same address:

```
clasp push --force
clasp create-deployment --deploymentId DEPLOYMENT_ID --description "What changed"
```

### Who can use your copy

`src/appsscript.json` sets this in the `webapp` section. As shipped, anyone with a Google account can open the link, and each person scans their own Drive. To keep it to yourself, change `"access": "ANYONE"` to `"access": "MYSELF"` before deploying.

## Development

| Path | What it is |
|---|---|
| `src/Code.js` | Server side. Lists one page of Drive files per call and reduces it to folders plus per-folder totals. |
| `src/rollup.html` | Builds the folder tree and adds up the totals. Pure logic, no Google APIs. |
| `src/index.html` | The page: scan loop, progress bar and tree view. |
| `src/appsscript.json` | Apps Script manifest: permission, Drive service, web app settings. |
| `tests/` | Unit tests for the listing and rollup logic. |
| `docs/verified-facts.md` | The Google API behaviour this relies on, with sources. |

Run the tests with:

```
npm test
```

There is no build step. The tests load the files in `src/` directly.
