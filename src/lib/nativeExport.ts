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
  try {
    if (entity === Calendar.EntityTypes.REMINDER && Platform.OS !== 'ios') {
      return { error: 'Reminders is an iOS app. Try Add to calendar instead.' };
    }

    const permission =
      entity === Calendar.EntityTypes.REMINDER
        ? await Calendar.requestRemindersPermissionsAsync()
        : await Calendar.requestCalendarPermissionsAsync();
    if (permission.status !== 'granted') {
      return {
        error:
          entity === Calendar.EntityTypes.REMINDER
            ? 'Unibud needs permission to add to Reminders. Enable it in system settings.'
            : 'Unibud needs permission to add to your calendar. Enable it in system settings.',
      };
    }

    // iOS has a default calendar for each entity type. Android has no
    // default and no Reminders at all, so pick the first calendar that
    // actually allows writing.
    if (Platform.OS === 'ios') {
      const fallback = await Calendar.getDefaultCalendarAsync();
      if (fallback?.id) return { id: fallback.id };
    }
    const all = await Calendar.getCalendarsAsync(entity);
    const writable = all.find((c) => c.allowsModifications);
    if (!writable) return { error: 'No calendar on this device accepts new entries.' };
    return { id: writable.id };
  } catch {
    return { error: 'Could not reach the calendar on this device.' };
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
