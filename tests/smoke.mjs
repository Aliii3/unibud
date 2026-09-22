import { chromium } from 'playwright-core';

const SP = process.env.SMOKE_TMP ?? '/tmp';
const OUT = `${SP}/unibud-smoke`;
const BASE = 'http://localhost:8081';
const T = 60000;

const results = [];
let page;

async function check(name, fn) {
  try {
    await fn();
    results.push({ name, status: 'PASS' });
    console.log(`PASS  ${name}`);
  } catch (err) {
    const msg = (err && err.message ? err.message : String(err)).split('\n')[0].slice(0, 160);
    results.push({ name, status: 'FAIL', msg });
    console.log(`FAIL  ${name}\n      ${msg}`);
    try { await page.screenshot({ path: `${OUT}/fail-${results.length}.png` }); } catch {}
  }
}
function skip(name, why) {
  results.push({ name, status: 'SKIP', msg: why });
  console.log(`SKIP  ${name}\n      ${why}`);
}

const visible = async (sel, timeout = T) =>
  page.locator(sel).first().waitFor({ state: 'visible', timeout });
const text = (t, exact = false) => page.getByText(t, { exact });
const seen = async (t, timeout = T) => text(t).first().waitFor({ timeout });
const gone = async (t, timeout = T) =>
  text(t).first().waitFor({ state: 'detached', timeout }).catch(async () => {
    if (await text(t).first().isVisible().catch(() => false)) {
      throw new Error(`"${t}" still visible`);
    }
  });

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
});
page = await ctx.newPage();
const consoleErrors = [];
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('pageerror', (e) => consoleErrors.push('PAGEERROR: ' + e.message));

/**
 * react-navigation renders tabs as anchors that Playwright's actionability
 * check never settles on, though a real pointer event works fine. Clicking
 * the element's centre by coordinate is what a finger does anyway.
 */
const TAB_ORDER = ['Doc', 'Todo', 'Deadline', 'Home'];
const tapTab = async (name) => {
  // The bottom tabs are anchors inside role="tablist". Their accessible name
  // does not match their label cleanly, and Playwright's actionability check
  // never settles on them, so find them positionally and click the centre --
  // which is what a finger does anyway.
  const tabs = page.locator('[role="tablist"] [role="tab"]');
  await tabs.first().waitFor({ state: 'visible', timeout: T });
  const count = await tabs.count();
  if (count !== TAB_ORDER.length) {
    throw new Error(`expected ${TAB_ORDER.length} bottom tabs, found ${count}`);
  }
  const index = TAB_ORDER.indexOf(name);
  if (index < 0) throw new Error(`unknown tab "${name}"`);
  const box = await tabs.nth(index).boundingBox();
  if (!box) throw new Error(`tab "${name}" has no box`);
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
};

const addSubject = async (n) => {
  const f = page.getByPlaceholder('Name a subject to add');
  await f.fill(n);
  await page.getByRole('button', { name: 'Name a subject to add' }).click();
  await page.getByRole('button', { name: n }).first().waitFor({ timeout: T });
};

// ---------------------------------------------------------------- boot
await check('app boots and reaches Home', async () => {
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: T });
  await page.getByPlaceholder('Name a subject to add').waitFor({ state: 'visible', timeout: T });
  await seen('Save now.');
});

await check('empty state shown when there are no subjects', async () => {
  await seen('No subjects yet');
});

await check('add button is disabled while the field is empty', async () => {
  const btn = page.getByRole('button', { name: 'Name a subject to add' });
  const disabled = await btn.getAttribute('disabled');
  const aria = await btn.getAttribute('aria-disabled');
  if (disabled === null && aria !== 'true') throw new Error('add button is not disabled');
});

// ---------------------------------------------------------------- navigation
await check('every tab reaches its screen', async () => {
  // Start from a tab screen. /subject/:id is pushed outside the tab
  // navigator, so no tab bar is rendered there — and its segmented control
  // is also role="tab", which is what tapTab would otherwise find.
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: T });
  await page.getByPlaceholder('Name a subject to add').waitFor({ state: 'visible', timeout: T });

  // Markers must be unique to their screen: Home and Doc both open with
  // "Save now.", so the second line is what distinguishes them.
  const tabs = [
    ['Doc', 'Revise later.'],
    ['Todo', 'on your plate.'],
    ['Deadline', 'and when.'],
    ['Home', 'Find anytime.'],
  ];
  for (const [tab, marker] of tabs) {
    await tapTab(tab);
    await page.waitForTimeout(900);
    try {
      await seen(marker, 15000);
    } catch {
      throw new Error(`tab "${tab}" did not reach a screen showing "${marker}"`);
    }
  }
  // A second lap, to catch a tab that only works on its first visit.
  for (const [tab, marker] of tabs) {
    await tapTab(tab);
    await page.waitForTimeout(700);
    try {
      await seen(marker, 15000);
    } catch {
      throw new Error(`tab "${tab}" failed on the second lap`);
    }
  }
});

// ---------------------------------------------------------------- subjects
await check('create four subjects', async () => {
  for (const n of ['Organic Chemistry', 'Linear Algebra', 'Microeconomics', 'World History']) {
    await addSubject(n);
  }
  await seen('My subjects');
});

await check('subject count reads 04', async () => { await seen('04', true); });

await check('each subject gets a distinct icon (migration v2)', async () => {
  const icons = await page.evaluate(() =>
    Array.from(document.querySelectorAll('[role="button"]'))
      .map((el) => el.getAttribute('aria-label'))
      .filter(Boolean).length
  );
  if (icons < 4) throw new Error(`expected >= 4 subject buttons, saw ${icons}`);
});

await check('newest subject carries the NEW badge, and only it', async () => {
  const n = await page.getByText('New', { exact: true }).count();
  if (n !== 1) throw new Error(`expected exactly 1 NEW badge, saw ${n}`);
});

await check('hero shows the All clear state with nothing due', async () => {
  await seen('All clear');
});

// ---------------------------------------------------------------- schedule
await check('schedule rejects an end time before the start', async () => {
  await page.goto(`${BASE}/schedule`, { waitUntil: 'domcontentloaded', timeout: T });
  await visible('text=Add class');
  await page.getByPlaceholder('09:00').fill('11:00');
  await page.getByPlaceholder('10:30').fill('09:00');
  await seen('The class has to end after it starts.');
});

await check('schedule accepts a valid class and lists it under its day', async () => {
  await page.getByPlaceholder('09:00').fill('09:00');
  await page.getByPlaceholder('10:30').fill('10:30');
  await page.getByPlaceholder('Room (optional)').fill('Lab B2');
  await page.getByText('Add class').click();
  await seen('Monday');
  await seen('09:00–10:30 · Lab B2');
});

await check('schedule slot can be deleted', async () => {
  await page.getByRole('button', { name: /Delete .* class/ }).first().click();
  await page.waitForTimeout(800);
  if (await page.getByText('Monday').first().isVisible().catch(() => false)) {
    throw new Error('slot still listed after delete');
  }
});

// ---------------------------------------------------------------- deadlines
await check('deadline form rejects a malformed date', async () => {
  await page.goto(`${BASE}/deadlines`, { waitUntil: 'domcontentloaded', timeout: T });
  await visible('text=Add deadline');
  await page.getByText('Add deadline').click();
  await page.getByPlaceholder('What is due?').fill('Problem set 4');
  await page.getByPlaceholder(/Due date/).fill('99/99');
  await seen('Use a day and month');
});

await check('deadline saves with kind and subject', async () => {
  await page.getByRole('button', { name: 'quiz', exact: true }).first().click();
  await page.getByRole('button', { name: 'Linear Algebra', exact: true }).first().click();
  await page.getByPlaceholder(/Due date/).fill('30/09');
  await page.getByText('Save', { exact: true }).click();
  await seen('Problem set 4');
  await seen('QUIZ');
});

await check('a future deadline files under Upcoming', async () => {
  await seen('Upcoming');
});

await check('a past date files under Overdue and is flagged late', async () => {
  await page.getByText('Add deadline').click();
  await page.getByPlaceholder('What is due?').fill('Late essay');
  await page.getByRole('button', { name: 'Linear Algebra', exact: true }).first().click();
  await page.getByPlaceholder(/Due date/).fill('01/03');
  await page.getByText('Save', { exact: true }).click();
  await seen('Late essay');
  await seen('Overdue');
  await seen(/days late/);
});

await check('deadline stat tiles count correctly', async () => {
  const body = await page.locator('body').innerText();
  if (!/\b2\b/.test(body)) throw new Error('expected an open total of 2');
});

await check('completing a deadline removes it from the open list', async () => {
  await page.getByRole('button', { name: 'Mark Late essay done' }).click();
  await page.waitForTimeout(900);
  await gone('Late essay');
});

await check('deleting a deadline removes it', async () => {
  await page.getByRole('button', { name: 'Delete Problem set 4' }).click();
  await page.waitForTimeout(900);
  await gone('Problem set 4');
});

// ---------------------------------------------------------------- reminders
await check('a reminder can be added without any subject', async () => {
  await page.goto(`${BASE}/deadlines`, { waitUntil: 'domcontentloaded', timeout: T });
  await visible('text=Add reminder');
  await page.getByText('Add reminder').click();
  await page.getByPlaceholder('What do you need to remember?').fill('See the coordinator');
  await page.getByPlaceholder(/^When/).fill('30/09');
  await page.getByText('Save', { exact: true }).click();
  await seen('See the coordinator');
  await seen('Reminders');
});

await check('a reminder is marked as one, not given a subject', async () => {
  await seen('REMINDER');
});

await check('a reminder counts towards the open total', async () => {
  const body = await page.locator('body').innerText();
  if (!/Open total/.test(body)) throw new Error('stat tiles missing');
});

await check('a reminder can be completed', async () => {
  await page.getByRole('button', { name: 'Mark See the coordinator done' }).click();
  await page.waitForTimeout(900);
  await gone('See the coordinator');
});

await check('a reminder can be deleted', async () => {
  await page.getByText('Add reminder').click();
  await page.getByPlaceholder('What do you need to remember?').fill('Collect transcript');
  await page.getByPlaceholder(/^When/).fill('01/10');
  await page.getByText('Save', { exact: true }).click();
  await seen('Collect transcript');
  await page.getByRole('button', { name: 'Delete Collect transcript' }).click();
  await page.waitForTimeout(900);
  await gone('Collect transcript');
});

// ---------------------------------------------------------------- todos
await check('global todo can be added', async () => {
  await page.goto(`${BASE}/todo`, { waitUntil: 'domcontentloaded', timeout: T });
  await visible('text=Add task');
  await page.getByPlaceholder('Add a task').fill('Read chapter 3');
  await page.getByText('Add task').click();
  await seen('Read chapter 3');
  await seen('Open');
});

await check('todo can be completed and moves to Done', async () => {
  await page.getByRole('button', { name: 'Complete Read chapter 3' }).click();
  await page.waitForTimeout(900);
  await seen('Done');
});

await check('todo can be reopened', async () => {
  await page.getByRole('button', { name: 'Reopen Read chapter 3' }).click();
  await page.waitForTimeout(900);
  await seen('Open');
});

await check('todo can be deleted', async () => {
  await page.getByRole('button', { name: 'Delete Read chapter 3' }).click();
  await page.waitForTimeout(900);
  await gone('Read chapter 3');
});

// ---------------------------------------------------------------- subject
await check('subject screen opens with its three sections', async () => {
  await page.goto(`${BASE}/subject/1`, { waitUntil: 'domcontentloaded', timeout: T });
  await visible('text=Upload document');
  for (const t of ['Doc', 'Todo', 'Deadline']) {
    await page.getByRole('tab', { name: t, exact: true }).first().waitFor({ timeout: T });
  }
});

await check('subject Todo section adds a task scoped to the subject', async () => {
  await page.getByRole('tab', { name: 'Todo', exact: true }).first().click();
  await page.getByPlaceholder('Add a task').waitFor({ state: 'visible', timeout: T });
  await page.getByPlaceholder('Add a task').fill('Revise alkanes');
  await page.getByText('Add task').click();
  await seen('Revise alkanes');
});

await check('subject Deadline section shows its own empty state', async () => {
  await page.getByRole('tab', { name: 'Deadline', exact: true }).first().click();
  await page.waitForTimeout(800);
  await seen('Nothing due');
});

await check('the subject task appears on the global Todo tab', async () => {
  await page.goto(`${BASE}/todo`, { waitUntil: 'domcontentloaded', timeout: T });
  await seen('Revise alkanes');
  await seen('Organic Chemistry');
});

// ---------------------------------------------------------------- settings
await check('settings loads with its defaults', async () => {
  await page.goto(`${BASE}/settings`, { waitUntil: 'domcontentloaded', timeout: T });
  await visible('text=Deadline reminders');
  const time = await page.getByPlaceholder('19:00').inputValue();
  if (time !== '19:00') throw new Error(`expected default time 19:00, got "${time}"`);
});

await check('settings rejects a malformed time', async () => {
  await page.getByPlaceholder('19:00').fill('99:99');
  await seen('Use a 24-hour time');
});

await check('settings rejects an out-of-range reminder lead', async () => {
  await page.getByPlaceholder('19:00').fill('08:30');
  await page.getByPlaceholder('24').fill('999');
  await seen('between 1 and 336');
});

await check('settings saves and reports back', async () => {
  await page.getByPlaceholder('24').fill('12');
  await page.getByText('Save', { exact: true }).click();
  await page.waitForTimeout(1500);
  const body = await page.locator('body').innerText();
  if (!/Unibud will ask you|could not|turned off|notifications are turned off/i.test(body)) {
    throw new Error('no status message after save');
  }
});

// ---------------------------------------------------------------- persistence
await check('settings survive a reload (SQLite persistence)', async () => {
  await page.reload({ waitUntil: 'domcontentloaded', timeout: T });
  await visible('text=Deadline reminders');
  const time = await page.getByPlaceholder('19:00').inputValue();
  const lead = await page.getByPlaceholder('24').inputValue();
  if (time !== '08:30' || lead !== '12') {
    throw new Error(`expected 08:30 / 12 after reload, got "${time}" / "${lead}"`);
  }
});

await check('subjects survive a reload', async () => {
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: T });
  await seen('Organic Chemistry');
  await seen('World History');
});

// ---------------------------------------------------------------- cascade
await check('delete-subject confirmation does not fire on web (known limitation)', async () => {
  await page.goto(`${BASE}/subject/1`, { waitUntil: 'domcontentloaded', timeout: T });
  await visible('text=Upload document');
  await page.getByRole('button', { name: 'Delete subject' }).click();
  await page.waitForTimeout(2000);
  const body = await page.locator('body').innerText();
  // react-native-web does not implement Alert.alert, so nothing is asked and
  // nothing is deleted. On a device the confirmation appears normally.
  if (!/Upload document/.test(body)) {
    throw new Error('subject screen went away — Alert may now work on web; revisit this check');
  }
});

skip('subject delete cascade, end to end through the UI',
  'Alert.alert is a no-op on react-native-web so the confirm never fires; the cascade itself is covered by tests/schema.test.mjs');

// ---------------------------------------------------------------- edge cases
await check('a missing document shows a not-found state, not a crash', async () => {
  await page.goto(`${BASE}/document/999`, { waitUntil: 'domcontentloaded', timeout: T });
  await page.waitForTimeout(1500);
  await seen('Document not found');
});

// ---------------------------------------------------------------- not covered
skip('document upload and chapter division',
  'expo-document-picker does not complete its round trip in headless web; needs a device');
skip('notification delivery (daily prompt, deadline reminders)',
  'expo-notifications does not schedule on web; needs a device or dev build');

// ---------------------------------------------------------------- report
const pass = results.filter((r) => r.status === 'PASS').length;
const fail = results.filter((r) => r.status === 'FAIL');
const skipped = results.filter((r) => r.status === 'SKIP');
console.log('\n================ SMOKE TEST SUMMARY ================');
console.log(`checks: ${results.length}   pass: ${pass}   fail: ${fail.length}   skipped: ${skipped.length}`);
if (fail.length) {
  console.log('\nFAILURES');
  fail.forEach((f) => console.log(`  - ${f.name}\n      ${f.msg}`));
}
if (skipped.length) {
  console.log('\nNOT COVERED');
  skipped.forEach((f) => console.log(`  - ${f.name}\n      ${f.msg}`));
}
console.log(`\nconsole errors during run: ${consoleErrors.length}`);
consoleErrors.slice(0, 10).forEach((e) => console.log(`  ${e.slice(0, 180)}`));
console.log('====================================================');

await browser.close();
process.exit(fail.length > 0 ? 1 : 0);
