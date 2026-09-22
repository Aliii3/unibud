import type * as SQLite from 'expo-sqlite';

export const KEYS = {
  dailyPromptEnabled: 'daily_prompt_enabled',
  dailyPromptHour: 'daily_prompt_hour',
  dailyPromptMinute: 'daily_prompt_minute',
  dailyPromptId: 'daily_prompt_notification_id',
  reminderLeadHours: 'reminder_lead_hours',
} as const;

export const DEFAULTS = {
  dailyPromptEnabled: true,
  dailyPromptHour: 19,
  dailyPromptMinute: 0,
  reminderLeadHours: 24,
} as const;

export async function getSetting(
  db: SQLite.SQLiteDatabase,
  key: string
): Promise<string | null> {
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    key
  );
  return row?.value ?? null;
}

export async function setSetting(
  db: SQLite.SQLiteDatabase,
  key: string,
  value: string
): Promise<void> {
  await db.runAsync(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    key,
    value
  );
}

export async function getNumberSetting(
  db: SQLite.SQLiteDatabase,
  key: string,
  fallback: number
): Promise<number> {
  const raw = await getSetting(db, key);
  const parsed = raw == null ? NaN : Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function getBoolSetting(
  db: SQLite.SQLiteDatabase,
  key: string,
  fallback: boolean
): Promise<boolean> {
  const raw = await getSetting(db, key);
  return raw == null ? fallback : raw === '1';
}
