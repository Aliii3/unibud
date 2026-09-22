import type * as SQLite from 'expo-sqlite';

/** A dated thing to remember that belongs to no subject. */
export interface Reminder {
  id: number;
  title: string;
  due_at: number;
  done: number;
  reminder_id: string | null;
  created_at: number;
}

export async function listOpenReminders(
  db: SQLite.SQLiteDatabase
): Promise<Reminder[]> {
  return db.getAllAsync<Reminder>(
    'SELECT * FROM reminders WHERE done = 0 ORDER BY due_at'
  );
}

export async function countOpenReminders(
  db: SQLite.SQLiteDatabase
): Promise<number> {
  const row = await db.getFirstAsync<{ n: number }>(
    'SELECT COUNT(*) AS n FROM reminders WHERE done = 0'
  );
  return row?.n ?? 0;
}

export async function createReminder(
  db: SQLite.SQLiteDatabase,
  input: { title: string; due_at: number; reminder_id?: string | null }
): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO reminders (title, due_at, reminder_id, created_at)
     VALUES (?, ?, ?, ?)`,
    input.title.trim(),
    input.due_at,
    input.reminder_id ?? null,
    Date.now()
  );
  return result.lastInsertRowId;
}

export async function setReminderNotification(
  db: SQLite.SQLiteDatabase,
  id: number,
  notificationId: string | null
): Promise<void> {
  await db.runAsync(
    'UPDATE reminders SET reminder_id = ? WHERE id = ?',
    notificationId,
    id
  );
}

export async function setReminderDone(
  db: SQLite.SQLiteDatabase,
  id: number,
  done: boolean
): Promise<void> {
  await db.runAsync(
    'UPDATE reminders SET done = ? WHERE id = ?',
    done ? 1 : 0,
    id
  );
}

export async function deleteReminder(
  db: SQLite.SQLiteDatabase,
  id: number
): Promise<void> {
  await db.runAsync('DELETE FROM reminders WHERE id = ?', id);
}
