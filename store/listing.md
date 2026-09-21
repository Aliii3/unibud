# App Store listing copy

Every field below is within its App Store Connect limit — see
`scripts/check_listing.py`, which parses this file and fails on an overrun.

Claims are limited to what the app actually does. Notably it does **not**
sync, share, or open documents for reading, so none of that is implied here.

---

## Name (30)

```
Unibud: Study Planner
```

## Subtitle (30)

```
Deadlines, classes, to-dos
```

## Keywords (100)

Comma-separated, no spaces — a space costs a character. Words already in the
name and subtitle are indexed too, so none are repeated here.

```
homework,assignment,timetable,university,college,coursework,exam,revision,semester,schedule,tracker
```

## Promotional text (170)

Editable without review, so use it for whatever is true this month.

```
Term just started? Add your subjects, drop in your timetable, and let Unibud ask you once a day what is due. Everything stays on your phone.
```

## Description (4000)

```
Every subject in one place. Unibud keeps your coursework the way you actually think about it — one folder per subject, with the deadlines, tasks and notes for that subject inside it.

Then it does the part you forget: it asks. Once a day, at a time you choose, Unibud checks in so an assignment set three weeks ago does not become tomorrow's problem.

SUBJECTS AS FOLDERS
Add the subjects you are taking this term. Everything else — documents, tasks, deadlines — lives in the folder it belongs to, not in one endless list.

DEADLINES YOU CAN SEE COMING
Add assignments, quizzes and exams with the date they are due. Unibud sorts them by what comes first, flags anything overdue, and reminds you a set number of hours ahead.

YOUR WEEK, CLASS BY CLASS
Put your timetable in once. Class times sit beside everything else you owe, so your week is one picture instead of three apps.

TASKS THAT KNOW THEIR SUBJECT
Add a task to a subject and it shows up both places: on the subject and in one combined list when you want to see the lot.

A DAILY CHECK-IN
One notification a day, at a time you set. Answer it in a few seconds and nothing gets remembered at the last minute.

YOUR FILES, FILED
Attach lecture notes and slides to the subject they belong to, and keep a list of the chapters you are revising against each one.

NO ACCOUNT. NOTHING LEAVES YOUR PHONE.
There is no sign-up, because there is nothing to sign up to. Unibud stores everything in a database on your device. No cloud, no servers, no analytics, no ads, no tracking. Nothing is uploaded, because there is nowhere to upload it to. It works with the plane mode on.

Built for students who want their term organised, not gamified.
```

## What's New — 1.0.0 (4000)

```
First release.

Subjects as folders, with documents, tasks and deadlines inside each one. A weekly timetable. Reminders before anything is due, and a daily check-in so nothing is remembered too late.

Everything stays on your device. No account, no sync, no tracking.
```

---

## Notes for App Store Connect

- **Category** — Education, with Productivity as the secondary.
- **Age rating** — 4+. No user content, no web views, no ads.
- **Privacy** — "Data Not Collected". Everything is device-local SQLite and
  the app makes no network requests, so every question answers the same way.
- **Support URL** — required. A GitHub repo page or a one-page site is fine.
- **Sign-in** — do not supply a demo account; there is no login. Say so in
  the review notes so a reviewer is not left looking for one.
