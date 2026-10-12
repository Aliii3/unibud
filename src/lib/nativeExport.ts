import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';

/**
 * Handing a deadline to the system Calendar or Reminders app.
 *
 * This is the one place Unibud passes anything outside itself, and the only
 * way it can: the user taps a button per item. Nothing is exported
 * automatically, and nothing written here is tracked afterwards — a copy is
 * handed over and the two stop being related, which is why the button says
 * "add" rather than "sync".
 *
 * Worth being honest about in the privacy policy: a calendar that syncs to
 * iCloud will carry the copy off the device. That is the system calendar's
 * behaviour, not something Unibud can see or control.
 *
 * Written against expo-calendar's object-oriented API. The first version
 * called `requestCalendarPermissionsAsync` and `createEventAsync`, which read
 * as the obvious entry points but are the older surface — in SDK 57 they live
 * behind `expo-calendar/legacy`, and calling them through the main import
 * *throws* a deprecation error. On a device that was indistinguishable from
 * the native module being absent, which is where the first two guesses went.
 */

export type ExportResult = { ok: boolean; message: string };

/** The short version of whatever was thrown, for a message a user can send on. */
function reason(err: unknown): string {
  const text = err instanceof Error ? err.message : String(err);
  return text.replace(/\s+/g, ' ').trim().slice(0, 90) || 'no message';
}

/** Half an hour, so a deadline shows as a block rather than a zero-length event. */
const BLOCK_MS = 30 * 60 * 1000;

/**
 * Nothing here may throw. These run from a row in a list, and a rejected
 * promise would take the screen down over a calendar the user may not even
 * have — far worse than the deadline simply not being exported.
 *
 * Each step has its own guard and its own message, carrying whatever was
 * actually thrown. One catch around the lot reported the same sentence for
 * four unrelated causes, and the sentence it picked was the wrong one.
 */
async function pickCalendar(
  entity: Calendar.EntityTypes
): Promise<{ calendar: Calendar.ExpoCalendar } | { error: string }> {
  const reminders = entity === Calendar.EntityTypes.REMINDER;
  const what = reminders ? 'Reminders' : 'your calendar';

  if (reminders && Platform.OS !== 'ios') {
    return { error: 'Reminders is an iOS app. Try Add to calendar instead.' };
  }

  let status: string;
  try {
    // Write-only is all this needs and the least it can ask for: Unibud adds
    // an entry and never reads what is already there.
    const permission = reminders
      ? await Calendar.requestRemindersPermissions()
      : await Calendar.requestCalendarPermissions(true);
    status = permission.status;
  } catch (err) {
    return { error: `Could not ask for ${what} access. (E1: ${reason(err)})` };
  }
  if (status !== 'granted') {
    return {
      error: `Unibud needs permission to add to ${what}. Enable it in system settings. (E2)`,
    };
  }

  try {
    const all = await Calendar.getCalendars(entity);
    // Under iOS 17 write-only access this is a single virtual calendar that
    // creates events without exposing any, and it does not necessarily
    // report `allowsModifications` — so take it rather than refusing.
    const target = all.find((c) => c.allowsModifications) ?? all[0];
    if (target) return { calendar: target };
    return {
      error: `There are no ${reminders ? 'Reminders lists' : 'calendars'} set up on this device yet. (E3)`,
    };
  } catch (err) {
    return { error: `Could not read ${what} on this device. (E4: ${reason(err)})` };
  }
}

export async function addToCalendar(
  title: string,
  dueAt: number,
  notes?: string
): Promise<ExportResult> {
  const target = await pickCalendar(Calendar.EntityTypes.EVENT);
  if ('error' in target) return { ok: false, message: target.error };
  try {
    await target.calendar.createEvent({
      title,
      startDate: new Date(dueAt),
      endDate: new Date(dueAt + BLOCK_MS),
      notes,
    });
    return { ok: true, message: 'Added to your calendar.' };
  } catch (err) {
    return { ok: false, message: `Could not add this to your calendar. (E5: ${reason(err)})` };
  }
}

export async function addToReminders(
  title: string,
  dueAt: number,
  notes?: string
): Promise<ExportResult> {
  const target = await pickCalendar(Calendar.EntityTypes.REMINDER);
  if ('error' in target) return { ok: false, message: target.error };
  try {
    await target.calendar.createReminder({
      title,
      dueDate: new Date(dueAt),
      notes,
    });
    return { ok: true, message: 'Added to Reminders.' };
  } catch (err) {
    return { ok: false, message: `Could not add this to Reminders. (E5: ${reason(err)})` };
  }
}
