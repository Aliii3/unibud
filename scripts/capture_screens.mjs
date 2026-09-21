/**
 * Captures raw app screens for the store listing at iPhone 6.9" logical size
 * (430x932 at 3x = 1290x2796), against a running `npm run web`.
 *
 * Seeds realistic data first: a listing full of empty states sells nothing.
 */
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const OUT = process.env.SHOT_DIR ?? '/tmp/unibud-shots/raw';
const BASE = process.env.SHOT_BASE ?? 'http://localhost:8081';
const T = 90000;
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM ?? '/opt/pw-browsers/chromium',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const ctx = await browser.newContext({
  viewport: { width: 430, height: 932 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
});
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

const shot = async (n) => {
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${OUT}/${n}.png` });
  console.log('shot:', n);
};
const seen = (t, timeout = T) => page.getByText(t).first().waitFor({ timeout });

await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: T });
const field = page.getByPlaceholder('Name a subject to add');
await field.waitFor({ state: 'visible', timeout: T });

// --- seed -----------------------------------------------------------------
const SUBJECTS = ['Organic Chemistry', 'Linear Algebra', 'Microeconomics', 'World History'];
for (const n of SUBJECTS) {
  await field.fill(n);
  await page.getByRole('button', { name: 'Name a subject to add' }).click();
  await page.getByRole('button', { name: n }).first().waitFor({ timeout: T });
}

const addDeadline = async (title, kind, subject, due) => {
  await page.goto(`${BASE}/deadlines`, { waitUntil: 'domcontentloaded', timeout: T });
  await page.getByText('Add deadline').waitFor({ state: 'visible', timeout: T });
  await page.getByText('Add deadline').click();
  await page.getByPlaceholder('What is due?').fill(title);
  await page.getByRole('button', { name: kind, exact: true }).first().click();
  await page.getByRole('button', { name: subject, exact: true }).first().click();
  await page.getByPlaceholder(/Due date/).fill(due);
  await page.getByText('Save', { exact: true }).click();
  await seen(title);
};
const year = new Date().getFullYear();
const inDays = (d) => {
  const t = new Date(Date.now() + d * 86400000);
  return `${String(t.getDate()).padStart(2, '0')}/${String(t.getMonth() + 1).padStart(2, '0')}/${year}`;
};
await addDeadline('Titration lab report', 'assignment', 'Organic Chemistry', inDays(2));
await addDeadline('Matrix methods quiz', 'quiz', 'Linear Algebra', inDays(5));
await addDeadline('Midterm exam', 'exam', 'Microeconomics', inDays(11));

const addTodo = async (subjectId, title) => {
  await page.goto(`${BASE}/subject/${subjectId}`, { waitUntil: 'domcontentloaded', timeout: T });
  await page.getByText('Upload document').waitFor({ state: 'visible', timeout: T });
  await page.getByRole('tab', { name: 'Todo', exact: true }).first().click();
  const t = page.getByPlaceholder('Add a task');
  await t.waitFor({ state: 'visible', timeout: T });
  await t.fill(title);
  await page.getByText('Add task').click();
  await seen(title);
};
await addTodo(1, 'Read chapter 7 on alkenes');
await addTodo(1, 'Write up the lab method');
await addTodo(2, 'Practice eigenvalue problems');

// Schedule
await page.goto(`${BASE}/schedule`, { waitUntil: 'domcontentloaded', timeout: T });
await page.getByText('Add class').waitFor({ state: 'visible', timeout: T });
const addClass = async (subject, day, start, end, room) => {
  await page.getByRole('button', { name: subject, exact: true }).first().click();
  await page.getByRole('button', { name: day, exact: true }).first().click();
  await page.getByPlaceholder('09:00').fill(start);
  await page.getByPlaceholder('10:30').fill(end);
  await page.getByPlaceholder('Room (optional)').fill(room);
  await page.getByText('Add class').click();
  await page.waitForTimeout(700);
};
await addClass('Organic Chemistry', 'Mon', '09:00', '10:30', 'Lab B2');
await addClass('Linear Algebra', 'Mon', '13:00', '14:30', 'Hall 4');
await addClass('Microeconomics', 'Wed', '11:00', '12:30', 'Room 210');

// --- capture --------------------------------------------------------------
await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: T });
await seen('My subjects');
await shot('01-home');

await page.goto(`${BASE}/deadlines`, { waitUntil: 'domcontentloaded', timeout: T });
await seen('Titration lab report');
await shot('02-deadlines');

await page.goto(`${BASE}/schedule`, { waitUntil: 'domcontentloaded', timeout: T });
await seen('Monday');
await shot('03-schedule');

await page.goto(`${BASE}/todo`, { waitUntil: 'domcontentloaded', timeout: T });
await seen('Read chapter 7 on alkenes');
await shot('04-todo');

await page.goto(`${BASE}/subject/1`, { waitUntil: 'domcontentloaded', timeout: T });
await page.getByText('Upload document').waitFor({ state: 'visible', timeout: T });
await page.getByRole('tab', { name: 'Todo', exact: true }).first().click();
await seen('Read chapter 7 on alkenes');
await shot('05-subject');

await page.goto(`${BASE}/settings`, { waitUntil: 'domcontentloaded', timeout: T });
await page.getByText('Deadline reminders').waitFor({ state: 'visible', timeout: T });
await shot('06-settings');

// One iPad-width capture, to judge whether declaring iPad support is honest.
const pad = await browser.newContext({
  viewport: { width: 1024, height: 1366 }, deviceScaleFactor: 2,
});
const padPage = await pad.newPage();
await padPage.goto(BASE, { waitUntil: 'domcontentloaded', timeout: T });
await padPage.getByText('Save now.').first().waitFor({ timeout: T });
await padPage.waitForTimeout(1500);
await padPage.screenshot({ path: `${OUT}/ipad-check.png` });
console.log('shot: ipad-check');

console.log('page errors:', errors.length ? errors.join('; ') : 'none');
await browser.close();
