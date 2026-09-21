# Unibud

A study companion for university students. Subjects are folders; documents,
chapters, to-dos and deadlines live inside them. Once a day Unibud asks what is
due, rather than waiting to be told.

Built from the handwritten concept notes — see
[`docs/unibud-concept-spec.pdf`](docs/unibud-concept-spec.pdf) for the written
specification, including the open questions the notes left unanswered.

## Stack

- **Expo SDK 57** / React Native 0.86, TypeScript
- **expo-router** for file-based navigation
- **expo-sqlite** for storage — local to the device, no accounts, no backend
- **expo-notifications** for the daily check-in and deadline reminders

## Running it

```bash
npm install
npm start
```

Scan the QR code with Expo Go, or press `i` / `a` for a simulator. Note that
scheduled notifications do not fire in Expo Go on Android — use a development
build to test the daily check-in there.

```bash
npm run typecheck    # tsc --noEmit
npx expo-doctor      # project health
npm run spec         # regenerate docs/unibud-concept-spec.pdf
```

## Layout

```
app/                      screens (expo-router)
  (tabs)/                 home | doc | todo | deadline
  subject/[id].tsx        inside a subject
  document/[id].tsx       divide a document into chapters
  schedule.tsx            weekly timetable
  settings.tsx            daily check-in time, reminder lead time
src/db/                   schema, migrations, one module per table
src/lib/                  notifications, file storage, formatting, useQuery
src/components/           shared UI
docs/                     concept spec + the script that generates it
```

### Data

`src/db/schema.ts` holds an ordered list of migrations applied against
`PRAGMA user_version`. To change the schema, append a new entry — never edit
one that has shipped, or existing installs will skip it.

Every table cascades from `subjects`, so deleting a subject removes its
schedule, documents, chapters, to-dos and deadlines with it.

### Notifications

Two kinds, both local — nothing is sent to a server:

- **Daily check-in** — one repeating notification, configured in Settings.
- **Deadline reminders** — one-shot, a configurable number of hours before a
  deadline. Scheduling is best-effort: if permission is denied or the lead time
  has already passed, the deadline is still saved, just without a reminder.

## State of the build

Working: subjects, weekly schedule, deadlines and quizzes with reminders,
to-dos, document upload, manual chapter division, the daily check-in.

Deliberately not built yet:

- **Automatic chapter parsing.** Chapters are named by hand. Parsing an
  uploaded file into sections is open question 2 in the spec and by far the
  largest piece of work in the project.
- **In-app document viewing.** Files are stored and listed, but not rendered.
  Which formats to support is open question 3.
- **Sync.** Storage is local to the device by design.

Two deviations from the notes worth knowing about:

- The sketch drew the tab bar as `doc | todo | deadline | home`. Home is first
  here because it is the entry point and a cold launch has to land somewhere
  useful. Reorder the `<Tabs.Screen>` entries in `app/(tabs)/_layout.tsx` to
  match the sketch exactly.
- Inside a subject, the three subject-scoped sections are a segmented control
  rather than a second tab bar, so the app-level tabs stay reachable.
