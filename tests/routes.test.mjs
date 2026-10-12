/**
 * Guards the route tree against files nobody meant to add.
 *
 * expo-router turns every file under `app/` into a route, and every file
 * under `app/(tabs)/` into a tab. So a stray file is not dead weight that
 * sits there harmlessly — it is a new tab in the dock.
 *
 * This shipped. A build went to TestFlight with nine tabs, five of them
 * called `docs 2`, `todo 2`, `index 2`, `_layout 2` and `deadlines 2`: iCloud
 * sync-conflict copies, written beside the originals because the working
 * copy sat in `~/Desktop`, which macOS syncs by default. Nothing in the repo
 * was wrong, nothing failed to compile, and the only symptom was on a phone.
 *
 * Runs in milliseconds with no device, server or database, so there is no
 * excuse for building without it.
 */
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const results = [];
function check(name, fn) {
  try {
    fn();
    results.push({ name, ok: true });
    console.log(`PASS  ${name}`);
  } catch (err) {
    results.push({ name, ok: false, msg: err.message });
    console.log(`FAIL  ${name}\n      ${err.message}`);
  }
}

/** Every route file, as paths relative to `app/`. */
function routeFiles(dir = 'app', prefix = '') {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...routeFiles(full, `${prefix}${entry}/`));
    } else {
      out.push(`${prefix}${entry}`);
    }
  }
  return out.sort();
}

const EXPECTED = [
  '(tabs)/_layout.tsx',
  '(tabs)/deadlines.tsx',
  '(tabs)/docs.tsx',
  '(tabs)/index.tsx',
  '(tabs)/todo.tsx',
  '_layout.tsx',
  'document/[id].tsx',
  'schedule.tsx',
  'settings.tsx',
  'subject/[id].tsx',
].sort();

const actual = routeFiles();

check('the route tree holds exactly the routes it should', () => {
  const extra = actual.filter((f) => !EXPECTED.includes(f));
  const missing = EXPECTED.filter((f) => !actual.includes(f));
  if (extra.length || missing.length) {
    const lines = [];
    if (extra.length) lines.push(`unexpected: ${extra.join(', ')}`);
    if (missing.length) lines.push(`missing: ${missing.join(', ')}`);
    // Adding a screen on purpose means adding it to EXPECTED above, which is
    // the point: a new route should be a deliberate edit, not a side effect.
    throw new Error(lines.join(' | '));
  }
});

check('the tab bar has exactly four tabs', () => {
  const tabs = actual.filter((f) => f.startsWith('(tabs)/') && !f.includes('_layout'));
  if (tabs.length !== 4) {
    throw new Error(`expected 4 tabs, found ${tabs.length}: ${tabs.join(', ')}`);
  }
});

check('no sync-conflict or editor copies anywhere in the source', () => {
  const suspects = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      if (entry === 'node_modules' || entry === '.git' || entry === 'ios' || entry === 'android') {
        continue;
      }
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      // " 2.tsx" from iCloud, "copy" from Finder, " (1)" from a browser.
      else if (/ \d+\.|\bcopy\b|copy\.| \(\d+\)/i.test(entry)) suspects.push(full);
    }
  };
  for (const dir of ['app', 'src', 'tests', 'scripts']) walk(dir);
  if (suspects.length) {
    throw new Error(`conflict copies present: ${suspects.join(', ')}`);
  }
});

const failed = results.filter((r) => !r.ok);
console.log(`\nroute checks: ${failed.length ? `${failed.length} FAILED` : 'ALL PASS'}`);
process.exit(failed.length ? 1 : 0);
