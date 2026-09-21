export const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

/** 555 -> "09:15". Minutes are stored as an offset from midnight. */
export function minutesToClock(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** "9:15", "09:15" or "0915" -> 555. Returns null if it is not a time. */
export function clockToMinutes(text: string): number | null {
  const compact = text.trim();
  const match = /^(\d{1,2})[:.]?(\d{2})$/.exec(compact);
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h > 23 || m > 59) return null;
  return h * 60 + m;
}

export function formatDueDate(timestamp: number): string {
  const due = new Date(timestamp);
  return due.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export function formatDueTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Human distance to a deadline, e.g. "in 3 days", "today", "2 days late". */
export function relativeDue(timestamp: number): string {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfDue = new Date(timestamp);
  startOfDue.setHours(0, 0, 0, 0);

  const days = Math.round(
    (startOfDue.getTime() - startOfToday.getTime()) / 86_400_000
  );
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days === -1) return '1 day late';
  if (days < 0) return `${Math.abs(days)} days late`;
  if (days < 7) return `in ${days} days`;
  if (days < 14) return 'next week';
  return `in ${Math.round(days / 7)} weeks`;
}

export function isOverdue(timestamp: number): boolean {
  return timestamp < Date.now();
}

/** Parses "2026-03-14" / "14/03/2026" / "14-3" into a timestamp at 23:59. */
export function parseDueDate(text: string, now = new Date()): number | null {
  const t = text.trim();
  let year: number;
  let month: number;
  let day: number;

  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(t);
  const dmy = /^(\d{1,2})[/.-](\d{1,2})(?:[/.-](\d{2,4}))?$/.exec(t);

  if (iso) {
    year = Number(iso[1]);
    month = Number(iso[2]);
    day = Number(iso[3]);
  } else if (dmy) {
    day = Number(dmy[1]);
    month = Number(dmy[2]);
    year = dmy[3] ? Number(dmy[3]) : now.getFullYear();
    if (year < 100) year += 2000;
  } else {
    return null;
  }

  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(year, month - 1, day, 23, 59, 0, 0);
  // Rejects overflow like 31 February, which Date would roll into March.
  if (date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date.getTime();
}
