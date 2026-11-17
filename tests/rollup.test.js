// Run with: npm test
//
// The app has no build step, so the tests load the Apps Script sources
// as text and evaluate them in a sandbox.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const src = (name) => fs.readFileSync(path.join(__dirname, '..', 'src', name), 'utf8');

function load(code, names) {
  return vm.runInNewContext(code + '\n;({' + names.join(',') + '});');
}

const { summarizePage_ } = load(src('Code.js'), ['summarizePage_']);
const rollupSource = src('rollup.html').replace(/<\/?script>/g, '');
const { newState, mergePage, buildTree, formatBytes, progressPercent } =
  load(rollupSource, ['newState', 'mergePage', 'buildTree', 'formatBytes', 'progressPercent']);

const FOLDER = 'application/vnd.google-apps.folder';
const SHORTCUT = 'application/vnd.google-apps.shortcut';
const plain = (v) => JSON.parse(JSON.stringify(v));

test('summarizePage_ splits folders from files and totals per parent', () => {
  const page = summarizePage_({
    nextPageToken: 'tok',
    files: [
      { id: 'A', name: 'Photos', mimeType: FOLDER, parents: ['root'] },
      { id: 'f1', name: 'a.jpg', mimeType: 'image/jpeg', parents: ['A'], size: '100', quotaBytesUsed: '150' },
      { id: 'f2', name: 'b.jpg', mimeType: 'image/jpeg', parents: ['A'], size: '50', quotaBytesUsed: '50' },
      { id: 'f3', name: 'doc', mimeType: 'application/vnd.google-apps.document', parents: ['root'] },
      { id: 'f4', name: 'link', mimeType: SHORTCUT, parents: ['root'] },
      { id: 'f5', name: 'loose', mimeType: 'text/plain', size: '7', quotaBytesUsed: '7' }
    ]
  });
  assert.deepEqual(plain(page), {
    folders: [['A', 'Photos', 'root']],
    sums: { A: [150, 200, 2], root: [0, 0, 1], '': [7, 7, 1] },
    next: 'tok',
    incomplete: false
  });
});

test('summarizePage_ handles an empty response and the incomplete flag', () => {
  assert.deepEqual(plain(summarizePage_({})), { folders: [], sums: {}, next: null, incomplete: false });
  assert.equal(summarizePage_({ incompleteSearch: true }).incomplete, true);
});

test('mergePage accumulates across pages', () => {
  const state = newState();
  mergePage(state, { folders: [['A', 'Photos', 'root']], sums: { A: [10, 10, 1] }, incomplete: false });
  mergePage(state, { folders: [['B', 'Docs', 'root']], sums: { A: [5, 6, 2], B: [1, 1, 1] }, incomplete: true });
  assert.deepEqual(plain(state.direct), { A: [15, 16, 3], B: [1, 1, 1] });
  assert.equal(state.fileCount, 4);
  assert.equal(state.quotaBytes, 17);
  assert.equal(Object.keys(state.folders).length, 2);
  assert.equal(state.incomplete, true);
});

test('buildTree rolls sizes up through nested folders, largest first', () => {
  const state = newState();
  mergePage(state, {
    // A child listed before its parent must still attach correctly.
    folders: [['C', 'Raw', 'A'], ['A', 'Photos', 'root'], ['B', 'Docs', 'root']],
    sums: { root: [1, 1, 1], A: [10, 10, 1], C: [100, 300, 2], B: [50, 50, 5] },
    incomplete: false
  });
  const { root, other } = buildTree(state, 'root', 'My Drive');
  assert.equal(other, null);
  assert.deepEqual([root.size, root.quota, root.files], [161, 361, 9]);
  // plain(): arrays made inside the sandbox have a different Array prototype.
  assert.deepEqual(plain(root.children.map((n) => n.name)), ['Photos', 'Docs']);
  const photos = root.children[0];
  assert.deepEqual([photos.size, photos.quota, photos.files], [110, 310, 3]);
  assert.deepEqual([photos.ownQuota, photos.ownFiles], [10, 1]);
  assert.deepEqual(plain(photos.children.map((n) => [n.name, n.quota])), [['Raw', 300]]);
});

test('buildTree puts items with unknown or missing parents under "other"', () => {
  const state = newState();
  mergePage(state, {
    folders: [['X', 'In someone else’s folder', 'not-mine'], ['Y', 'Sub', 'X']],
    sums: { '': [5, 5, 1], 'not-mine-2': [3, 3, 1], Y: [20, 20, 2], root: [1, 1, 1] },
    incomplete: false
  });
  const { root, other } = buildTree(state, 'root', 'My Drive');
  assert.deepEqual([root.quota, root.files], [1, 1]);
  assert.deepEqual([other.quota, other.files, other.ownFiles], [28, 4, 2]);
  assert.equal(other.children[0].children[0].name, 'Sub');
});

test('buildTree survives a very deep folder chain', () => {
  const state = newState();
  const folders = [];
  const depth = 20000;
  for (let i = 0; i < depth; i++) folders.push(['d' + i, 'd' + i, i === 0 ? 'root' : 'd' + (i - 1)]);
  mergePage(state, { folders, sums: { ['d' + (depth - 1)]: [9, 9, 1] }, incomplete: false });
  const { root } = buildTree(state, 'root');
  assert.equal(root.quota, 9);
  assert.equal(root.name, 'My Drive');
});

test('progressPercent', () => {
  assert.equal(progressPercent(0, 1000), 0);
  assert.equal(progressPercent(250, 1000), 25);
  assert.equal(progressPercent(1000, 1000), 99);   // held until the scan ends
  assert.equal(progressPercent(5000, 1000), 99);
  assert.equal(progressPercent(10, null), null);
  assert.equal(progressPercent(10, 0), null);
});

test('formatBytes', () => {
  assert.equal(formatBytes(0), '0 B');
  assert.equal(formatBytes(1023), '1023 B');
  assert.equal(formatBytes(1024), '1.00 KB');
  assert.equal(formatBytes(1536), '1.50 KB');
  assert.equal(formatBytes(15 * 1024 * 1024), '15.0 MB');
  assert.equal(formatBytes(250 * 1024 * 1024 * 1024), '250 GB');
});
