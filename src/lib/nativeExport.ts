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
 */

export type ExportResult = { ok: boolean; message: string };

/** Half an hour, so a deadline shows as a block rather than a zero-length event. */
const BLOCK_MS = 30 * 60 * 1000;

/**
 * Nothing here may throw. These run from a row in a list, and a rejected
 * promise would take the screen down over a calendar the user may not even
 * have — far worse than the deadline simply not being exported.
 */
async function writableCalendar(
  entity: Calendar.EntityTypes
): Promise<{ id: string } | { error: string }> {
  const reminders = entity === Calendar.EntityTypes.REMINDER;
  const what = reminders ? 'Reminders' : 'your calendar';

  if (reminders && Platform.OS !== 'ios') {
    return { error: 'Reminders is an iOS app. Try Add to calendar instead.' };
  }

  // Each step gets its own guard, and each failure its own message. One
  // try/catch around the lot reported "could not reach the calendar" for
  // four unrelated causes, which is what it said on a device with a working
  // calendar -- true, useless, and impossible to act on. The codes are here
  // so a screenshot says which step failed; there is no crash reporting and
  // no way to read someone else's device.
  let status: string;
  try {
    const permission = reminders
      ? await Calendar.requestRemindersPermissionsAsync()
      : await Calendar.requestCalendarPermissionsAsync();
    status = permission.status;
  } catch {
    return { error: `${what} is not available in this build. (E1)` };
  }
  if (status !== 'granted') {
    return {
      error: `Unibud needs permission to add to ${what}. Enable it in system settings. (E2)`,
    };
  }

  // The default-calendar shortcut is for events only. It returns the default
  // *event* calendar, so using it for a reminder handed `createReminderAsync`
  // an events calendar -- which is why Add to Reminders could never work.
  // It is also allowed to fail: a device with no default calendar throws
  // here, and the list below still has an answer.
  if (Platform.OS === 'ios' && !reminders) {
    try {
      const preferred = await Calendar.getDefaultCalendarAsync();
      if (preferred?.id && preferred.allowsModifications !== false) {
        return { id: preferred.id };
      }
    } catch {
      // fall through to the list
    }
  }

  try {
    const all = await Calendar.getCalendarsAsync(entity);
    const writable = all.find((c) => c.allowsModifications);
    if (writable) return { id: writable.id };
    return {
      error: all.length
        ? `None of the ${all.length} ${reminders ? 'Reminders lists' : 'calendars'} on this device accept new entries. (E3)`
        : `There are no ${reminders ? 'Reminders lists' : 'calendars'} set up on this device yet. (E4)`,
    };
  } catch {
    return { error: `Could not read ${what} on this device. (E5)` };
  }
}

export async function addToCalendar(
  title: string,
  dueAt: number,
  notes?: string
): Promise<ExportResult> {
  const target = await writableCalendar(Calendar.EntityTypes.EVENT);
  if ('error' in target) return { ok: false, message: target.error };
  try {
    await Calendar.createEventAsync(target.id, {
      title,
      startDate: new Date(dueAt),
      endDate: new Date(dueAt + BLOCK_MS),
      notes,
    });
    return { ok: true, message: 'Added to your calendar.' };
  } catch {
    return { ok: false, message: 'Could not add this to your calendar.' };
  }
}

export async function addToReminders(
  title: string,
  dueAt: number,
  notes?: string
): Promise<ExportResult> {
  const target = await writableCalendar(Calendar.EntityTypes.REMINDER);
  if ('error' in target) return { ok: false, message: target.error };
  try {
    await Calendar.createReminderAsync(target.id, {
      title,
      dueDate: new Date(dueAt),
      notes,
    });
    return { ok: true, message: 'Added to Reminders.' };
  } catch {
    return { ok: false, message: 'Could not add this to Reminders.' };
  }
}
