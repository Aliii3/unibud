import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export const ANDROID_CHANNEL_ID = 'unibud-reminders';

/**
 * Foreground presentation. Without this a notification that fires while the
 * app is open is delivered silently and the daily prompt is easy to miss.
 *
 * Guarded because this runs at import time, and expo-notifications is not
 * supported in Expo Go on Android from SDK 53. An unguarded throw here takes
 * the whole screen tree down at startup, which is a poor trade for a
 * presentation preference.
 */
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
} catch (error) {
  console.warn('Unibud: could not set the notification handler', error);
}

export async function configureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: 'Reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
    lightColor: '#2E9E4F',
  });
}

/** Returns true if we may schedule. Never throws — callers degrade quietly. */
export async function ensurePermissions(): Promise<boolean> {
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    if (!current.canAskAgain) return false;
    const asked = await Notifications.requestPermissionsAsync();
    return asked.granted;
  } catch {
    return false;
  }
}

export async function cancel(identifier: string | null): Promise<void> {
  if (!identifier) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch {
    // Already fired or already cancelled; nothing to undo.
  }
}

/**
 * The daily check-in from the notes: "asks daily for your deadlines and
 * assignments". Repeats every day at the chosen time.
 */
export async function scheduleDailyPrompt(
  hour: number,
  minute: number
): Promise<string | null> {
  if (!(await ensurePermissions())) return null;
  try {
    await configureAndroidChannel();
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Anything due?',
        body: 'Add today’s deadlines and assignments while they are fresh.',
        data: { kind: 'daily-prompt' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: ANDROID_CHANNEL_ID,
      },
    });
  } catch {
    // The caller reports that the prompt could not be scheduled.
    return null;
  }
}

/**
 * A one-shot reminder `leadHours` before a deadline. Returns null when that
 * moment has already passed, which is the common case for something added
 * the night before it is due.
 */
export async function scheduleDeadlineReminder(
  title: string,
  subjectName: string,
  dueAt: number,
  leadHours: number
): Promise<string | null> {
  const fireAt = dueAt - leadHours * 60 * 60 * 1000;
  if (fireAt <= Date.now()) return null;
  if (!(await ensurePermissions())) return null;
  try {
    await configureAndroidChannel();
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: `${subjectName}: ${title}`,
        body: `Due in ${leadHours} hours.`,
        data: { kind: 'deadline-reminder' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(fireAt),
        channelId: ANDROID_CHANNEL_ID,
      },
    });
  } catch {
    // Saving the deadline matters more than the reminder; the deadline is
    // already stored by the time this runs, so it simply goes without one.
    return null;
  }
}
