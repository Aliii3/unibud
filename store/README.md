# Store listing assets

Regenerate everything here; nothing is hand-edited.

```bash
npm run web                                  # terminal 1
node scripts/capture_screens.mjs             # raw app screens
python3 scripts/build_screenshots.py         # branded frames
```

`capture_screens.mjs` seeds realistic data first — subjects, three deadlines
with real dates, tasks and a timetable. A listing full of empty states sells
nothing, and empty screens hide layout problems.

## What is here

`screenshots/iphone-6.9` — 1290x2796. The size App Store Connect requires.
`screenshots/iphone-6.5` — 1242x2688. Still accepted, and some listings ask.

Upload the 6.9" set; App Store Connect scales it down for smaller devices.

## No iPad screenshots

`ios.supportsTablet` is `false`, so none are required. The layout is
phone-first: at 1024pt it is a small headline, a full-width input and a lot
of empty space. Shipping that as iPad support risks a rejection under
guideline 2.4.1. Turning tablet support back on means designing wider
layouts first, then adding a 13" iPad set (2064x2752).

## Listing copy

`listing.md` holds every text field. `npm run check:listing` parses it and
fails if a field is over its App Store Connect limit, or if the keywords
repeat a word already indexed from the name or subtitle — Connect only tells
you on submit, which is a slow way to find out.

The copy claims nothing the app does not do: there is no sync, no sharing,
and documents are stored and listed but not opened for reading, so none of
that appears.

## Still to write by hand

- Support and marketing URLs
- Privacy policy URL
- The privacy questionnaire: "Data Not Collected". Everything is in
  device-local SQLite, and the app makes no network requests — verified by
  grep: no fetch, no analytics package, no expo-updates.
