# App Review notes

Apple asks first-time developer accounts for this information under
Guideline 2.1. It goes in two places: as a reply in Resolution Center, and
pasted into **App Review Information → Notes** so later submissions have it
on file.

Keep this file in step with the app. Every claim below is checkable, and a
claim that stops being true is worse than no claim at all.

---

## Short version, for the Notes field

```
Unibud is an offline study planner for university and college students. It
organises coursework as one folder per subject, each holding that subject's
deadlines, tasks, attached documents and class times, and sends a daily
local notification asking what is due.

ACCESS
No account, no login, no demo credentials needed. The app opens straight to
the home screen. It is empty on first launch by design — add a subject with
the field at the top of the home screen and the rest of the app fills in.

DATA AND SERVICES
No backend. No network requests of any kind. Everything is stored in a
local SQLite database on the device via expo-sqlite. No analytics, no ads,
no tracking, no third-party SDKs, no authentication, no payments, no AI
services. The app works fully in airplane mode.

NOTIFICATIONS
Local only, scheduled on-device with expo-notifications. There is no push
server and no remote notification capability.

USER CONTENT
Users type in their own subject names, tasks and deadlines, and may attach
their own files. None of it is uploaded, shared, or visible to any other
user, so there is nothing for other users to report or block.

IN-APP PURCHASE
None. The app is free with no paid tier.

REGIONS
Identical everywhere. English (U.S.) only, no region-gated content or
features.
```

---

## Long version, for the Resolution Center reply

### 1. Screen recording

See the attached recording, captured on a physical iPhone running the
latest iOS, beginning from app launch.

The app has **no account registration, login, or account deletion flow**,
because it has no accounts and no server — there is nothing to register
with and no stored identity to delete. Uninstalling removes all data.

It has **no user-generated content in the shared sense**: a user's subjects,
tasks and attached files stay in a local database on their own device and
are never transmitted, published, or made visible to anyone else. There is
no feed, no profiles, no comments, no messaging. Content reporting and
blocking mechanisms therefore do not apply.

It has **no paid content or features**. The app is free with no in-app
purchases and no subscription.

### 2. Purpose and target audience

Unibud is a study planner for university and college students.

The problem: coursework arrives scattered. A deadline is announced in a
lecture, the slides are emailed, the timetable is a PDF, and the reminder
is a note on a phone. Students end up with the same term spread across
four places and remember an assignment the night before it is due.

Unibud organises everything the way students already think about it — by
subject. Each subject is a folder holding its own deadlines, tasks,
attached documents and class times. A daily local notification, at a time
the user picks, asks what is due, so work set weeks earlier surfaces before
it becomes urgent.

The value is being able to see a whole term in one place, and being
reminded before rather than after. It is deliberately small: no gamification,
no streaks, no social feed.

### 3. Setting up and accessing the main features

**No login credentials are required.** There is no account system. The app
opens directly to its home screen with no onboarding, paywall or sign-up.

The app is empty on first launch, which is intended — it holds the user's
own coursework, so there is nothing to show until they add some. To reach
every feature:

1. **Add a subject.** On the home screen, type a name into the field at the
   top (for example "Organic Chemistry") and tap the add button. The subject
   appears as a folder card. Add two or three.
2. **Open a subject** by tapping its card, to see its deadlines, tasks and
   documents, and to attach a file from the device.
3. **Deadlines tab** — add an assignment, quiz or exam with a due date, and
   optionally a reminder a set number of hours ahead. Standalone reminders,
   which belong to no subject, are added here too.
4. **Todo tab** — add tasks and assign them to a subject.
5. **Docs tab** — attach a file from the device and list chapters against it.
   Note that documents are stored and listed but not opened for reading;
   the App Store description does not claim otherwise.
6. **Schedule** — add class times to build the weekly timetable.
7. **Settings**, via the gear icon on the home screen — set the daily
   check-in time. Setting it a few minutes ahead and backgrounding the app
   demonstrates the notification.

No sample files are needed. Any document on the device works for step 5.

### 4. External services, tools and platforms

**None.** The app has no backend and makes no network requests. There are
no data providers, authentication services, payment processors, AI services,
analytics, advertising SDKs, or crash reporters.

Everything it uses is an on-device framework:

| Framework | Used for | Leaves the device? |
| --- | --- | --- |
| expo-sqlite | the local database holding all user data | No |
| expo-notifications | scheduling local notifications on-device | No |
| expo-document-picker | letting the user pick a file from their device | No |
| expo-file-system | storing that file in the app's own sandbox | No |
| expo-router, react-native-* | navigation and UI | No |

The app is built with React Native and Expo, and the binary is compiled by
Expo Application Services. That is a build-time toolchain only; the shipped
app contacts no Expo service at runtime. `expo-updates` is not installed, so
there is no over-the-air update mechanism.

The app functions fully with airplane mode enabled, which is the simplest
way to verify all of the above.

### 5. Regional differences

None. The app behaves identically in every region. It is localised in
English (U.S.) only, and there is no region-gated content, no
region-specific pricing (it is free everywhere), and no feature that varies
by territory.

### 6. Regulated industry or third-party material

Not applicable. Unibud is a personal organiser for a student's own
coursework. It operates in no regulated industry, provides no professional
advice, and contains, shows or accesses no third-party or licensed
material. All content in the app is created by the user or shipped as part
of the app's own interface.

---

## Making the screen recording

Record on a physical iPhone, not the simulator — Apple asks for a real
device. Delete the app first so the recording starts from a genuinely fresh
install, which is what a reviewer sees.

Add Screen Recording to Control Centre: Settings → Control Centre →
Screen Recording. Then swipe down from the top-right and tap the record
button.

Aim for 60–90 seconds, unhurried, pausing on each screen long enough to
read it:

1. Home screen, empty, straight after launch
2. Type a subject name, add it. Add two more.
3. Tap into a subject — show its deadlines, tasks and documents
4. Attach a document: tap upload, pick a file, show it appear in the list
5. Deadlines tab: add a deadline with a due date and a reminder
6. Add a standalone reminder, to show it works without a subject
7. Todo tab: add a task against a subject, tick it off
8. Schedule: add a class, show the weekly timetable
9. Settings: set the daily check-in time, accept the notification prompt
10. Background the app and let the notification arrive on the lock screen

Point 10 is worth waiting for. It is the app's central feature and the one
thing a reviewer cannot infer from a static screen.

Stop the recording, then attach the video to the Resolution Center reply.
