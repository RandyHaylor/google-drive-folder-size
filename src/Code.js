// Server side of the web app. Read-only: it only lists file metadata.
//
// The browser calls listPage() once per page of results, so no single
// execution comes near the 6-minute Apps Script runtime limit.

var FOLDER_MIME = 'application/vnd.google-apps.folder';
var SHORTCUT_MIME = 'application/vnd.google-apps.shortcut';
var LIST_FIELDS =
  'nextPageToken, incompleteSearch, ' +
  'files(id, name, mimeType, parents, size, quotaBytesUsed)';

function doGet() {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('Drive Folder Size');
}

// Used by index.html to inline other HTML files.
function include(name) {
  return HtmlService.createHtmlOutputFromFile(name).getContent();
}

// The My Drive root, plus how many bytes the scan should expect to find
// (Drive usage minus trash) so the page can show a progress bar. Drive has
// no "total file count", so bytes are the only total known up front.
// expectedBytes is null if the quota lookup fails; the scan still works.
function getStart() {
  var root = Drive.Files.get('root', { fields: 'id, name' });
  var expected = null;
  try {
    var quota = Drive.About.get({ fields: 'storageQuota' }).storageQuota || {};
    var inDrive = Number(quota.usageInDrive);
    var inTrash = Number(quota.usageInDriveTrash) || 0;
    if (inDrive > 0) expected = Math.max(inDrive - inTrash, 0);
  } catch (e) {
    expected = null;
  }
  return { id: root.id, name: root.name, expectedBytes: expected };
}

// One page of the user's own, non-trashed files, reduced to what the
// browser needs: the folders, and per-parent totals for everything else.
function listPage(pageToken) {
  var params = {
    q: "'me' in owners and trashed = false",
    corpora: 'user',
    spaces: 'drive',
    pageSize: 1000,
    fields: LIST_FIELDS
  };
  if (pageToken) params.pageToken = pageToken;
  return summarizePage_(Drive.Files.list(params));
}

// Pure function (no Google services) so it can be tested in Node.
//
// Returns:
//   folders:    [[id, name, parentId], ...]
//   sums:       { parentId: [sizeBytes, quotaBytes, fileCount] }
//   next:       next page token, or null
//   incomplete: true if Drive said the listing may be missing items
//
// File names never leave the server; only folder names are sent on.
// Files with no parent are keyed under ''. Shortcuts are skipped: they
// have no size of their own and their target is counted where it lives.
function summarizePage_(response) {
  var files = (response && response.files) || [];
  var folders = [];
  var sums = {};
  for (var i = 0; i < files.length; i++) {
    var f = files[i];
    var parent = (f.parents && f.parents[0]) || '';
    if (f.mimeType === FOLDER_MIME) {
      folders.push([f.id, f.name, parent]);
      continue;
    }
    if (f.mimeType === SHORTCUT_MIME) continue;
    var s = sums[parent] || (sums[parent] = [0, 0, 0]);
    s[0] += Number(f.size) || 0;
    s[1] += Number(f.quotaBytesUsed) || 0;
    s[2] += 1;
  }
  return {
    folders: folders,
    sums: sums,
    next: (response && response.nextPageToken) || null,
    incomplete: !!(response && response.incompleteSearch)
  };
}
