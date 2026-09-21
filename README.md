# Unibud

A study companion for university students. Subjects are folders; documents,
chapters, to-dos and deadlines live inside them. Once a day Unibud asks what is
due, rather than waiting to be told.

Built from the handwritten concept notes — see
[`docs/unibud-concept-spec.pdf`](docs/unibud-concept-spec.pdf) for the written
specification, including the open questions the notes left unanswered.

## Brand

![Unibud](docs/unibud-logo.png)

The mark is a folder, because "a subject is a folder" is the idea the app is
built on, drawn in the interface's own language: flat colour, heavy black
outline, lime on blue.

Every icon asset is generated from one definition — run
`python3 scripts/build_icons.py` after changing it, and do not hand-edit the
PNGs. What it produces and why:

| Asset | Notes |
| --- | --- |
| `assets/icon.png` | 1024, **opaque** — App Store review rejects an icon with an alpha channel |
| `assets/android-icon-foreground.png` | 1024, alpha, mark kept inside the middle 66% so launcher crops cannot clip it |
| `assets/android-icon-background.png` | 1024, opaque |
| `assets/android-icon-monochrome.png` | 1024, silhouette for themed icons, tick punched out so it survives recolouring |
| `assets/splash-icon.png` | 1024, alpha |
| `assets/favicon.png` | 196 |
| `docs/unibud-logo.png` | wordmark for a listing or README |

The icon carries no rounded corners of its own; iOS and Android apply their
own masks.

## Design

Palette and layout language come from the supplied references:

| Token | Value | Used for |
| --- | --- | --- |
| `blue` | `#3760F9` | hero panels, active states |
| `ink` | `#17161B` | text, primary buttons |
| `lime` | `#D2FC59` | action circles, active tab, highlight tiles |
| `lavender` | `#DAD9FB` | secondary tiles, empty-state marks |

Everything lives in `src/theme.ts` (colours, spacing, radii, border weight,
shadow offsets) and `src/components/ui.tsx` (the primitives every screen
composes from). Change a token there and it propagates.

The look is the second reference's: a cream ground, crisp corners, a 2px
black outline on everything raised, and a solid black rectangle offset down
and right instead of a blur.

`Surface` is the primitive that draws it. React Native cannot produce a hard
shadow portably — iOS could with `shadowRadius: 0`, but Android's elevation
always blurs — so the shadow is a real `View` behind an outlined face. Pass
margins via its `style` (the wrapper), never `faceStyle`: the shadow is
measured against the wrapper, so a margin on the face pads the wrapper and
thickens the drawn shadow by that much.

Each subject is assigned a colour and an Ionicons name on create, cycled
through `subjectColors` and `subjectIcons` so neighbours in the grid differ.
The most recently added subject wears a NEW badge for 24 hours.

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
npm run web          # open it in a browser, no simulator needed
npm run test:schema  # migrations, cascades and CHECK constraints
npm run test:smoke   # drives every screen against a running dev server
npm run spec         # regenerate docs/unibud-concept-spec.pdf
```

## Shipping

`eas.json` is set up and validated. Three build profiles:

| Profile | What it makes |
| --- | --- |
| `development` | a dev client — iOS simulator build, Android APK |
| `preview` | an installable internal build (`npm run build:preview`) |
| `production` | a store build (`npm run build:ios` / `build:android`) |

Versioning uses `appVersionSource: "remote"`, so **EAS owns the build number
and version code** — that is why neither is set in `app.json`. Bump
`expo.version` there for a marketing version (currently `1.0.0`); the build
number increments by itself.

First time, on a machine logged into your Apple account:

```bash
npx eas login
npx eas init            # creates the EAS project and writes extra.eas.projectId
npm run build:ios       # EAS generates the signing credentials for you
npm run submit:ios      # prompts for Apple ID, team and the App Store Connect app
```

`eas submit` asks for the Apple ID, team ID and App Store Connect app ID
interactively. Only for a non-interactive CI submit do they need to go into
`eas.json` under `submit.production.ios` as `appleId`, `appleTeamId` and
`ascAppId` — placeholders are deliberately absent because the file is
validated on their format and would not parse.

Android submission expects a Play service account key at
`./play-service-account.json`. That path and the usual signing material are
gitignored; do not commit them.

Still needed on the App Store Connect side, none of which lives in this
repo: screenshots at the required device sizes, a privacy policy URL, and
the privacy questionnaire — which for Unibud is "no data collected", since
everything is stored on the device and nothing is sent anywhere. A build
must have run through `eas build` before `eas submit` has anything to send.

## Public pages

`docs/` doubles as the site GitHub Pages serves, which covers the two URLs
App Store Connect insists on:

| Page | Serves as |
| --- | --- |
| `docs/index.html` | the Support URL, and a plain landing page |
| `docs/privacy.html` | the Privacy policy URL |
| `docs/privacy.md` | the same policy as readable source |

Enable them in Settings → Pages → *Deploy from a branch*, folder `/docs`.
`docs/.nojekyll` stops Jekyll rewriting anything.

**Before publishing, replace `CONTACT_EMAIL`** in `docs/index.html`,
`docs/privacy.html` and `docs/privacy.md`. These pages are public, so that
address is public too.

The policy says the app collects nothing and makes no network requests.
That is checked, not assumed — no fetch or upload call in `app/` or `src/`,
no analytics package, and `expo-updates` is not installed. If any of that
changes, the policy has to change with it.

## Tests

`npm run test:schema` runs the real migrations from `src/db/schema.ts`
against an in-memory SQLite and asserts the cascades, the CHECK constraints
and the `ON DELETE SET NULL` on a todo's deadline link. It needs nothing
running.

`npm run test:smoke` drives the app end to end in a headless browser, so
start `npm run web` first. Three things it cannot cover there, all because
of the web target rather than the app:

- **Document upload and chapters** — `expo-document-picker` does not
  complete its round trip headlessly.
- **Notifications** — `expo-notifications` does not schedule on web.
- **Deleting a subject** — `Alert.alert` is a no-op on react-native-web, so
  the confirmation never appears and nothing is deleted. The cascade behind
  it is covered by the schema test instead.

Two things the smoke test has to work around, worth knowing before editing
it: the bottom tabs are anchors whose accessible name does not match their
label and which Playwright's actionability check never settles on, so
`tapTab` finds them positionally inside `role="tablist"` and clicks their
centre; and the subject screen's segmented control is also `role="tab"`,
so anything looking for a bottom tab has to be on a tab screen first.

`npm run web` is a convenience for eyeballing a layout quickly; iOS and
Android are the real targets. Notifications do not fire on web, and
`metro.config.js` exists only to make expo-sqlite's WebAssembly build work
there.

## Layout

```
app/                      screens (expo-router)
  (tabs)/                 home | doc | todo | deadline
  subject/[id].tsx        inside a subject
  document/[id].tsx       divide a document into chapters
  schedule.tsx            weekly timetable
  settings.tsx            daily check-in time, reminder lead time
src/
  ui/                     the shared kit, imported as '@/ui'
    Surface.tsx           the outlined-face-on-offset-shadow primitive
    layout.tsx            ScreenTitle, SectionHeader, ScreenHeader
    controls.tsx          Button, Field, Chip, AddRow, IconButton
    display.tsx           Card, HeroStat, StatTile, IconTile, Pill, MetaStat,
                          LegendDot, EmptyState, Loading
  features/               composites owned by one part of the app
    subjects/FolderCard.tsx
    deadlines/AddDeadlineForm.tsx
  db/                     schema, migrations, one module per table
  lib/                    notifications, file storage, formatting, useQuery
  theme.ts                design tokens
docs/                     concept spec + the script that generates it
```

Screens import primitives from the `@/ui` barrel rather than reaching into
its files, so the kit can be regrouped without touching them. Anything that
knows about a specific table or screen belongs in `features/`, not `ui/`.

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

- The tab bar is ordered `doc | todo | deadline | home`, as drawn. Home is
  still the tab a cold launch lands on — `unstable_settings.initialRouteName`
  in `app/(tabs)/_layout.tsx` pins that, since an empty Doc list is a poor
  first screen. Tab order follows the order the `<Tabs.Screen>` entries are
  declared in.
- Inside a subject, the three subject-scoped sections are a segmented control
  rather than a second tab bar, so the app-level tabs stay reachable.
