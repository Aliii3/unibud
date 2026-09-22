import type * as SQLite from 'expo-sqlite';

import type { Deadline, DeadlineKind, WithSubject } from './types';

export async function listOpenDeadlines(
  db: SQLite.SQLiteDatabase
): Promise<WithSubject<Deadline>[]> {
  return db.getAllAsync<WithSubject<Deadline>>(`
    SELECT d.*, s.name AS subject_name, s.color AS subject_color
    FROM deadlines d
    JOIN subjects s ON s.id = d.subject_id
    WHERE d.done = 0
    ORDER BY d.due_at
  `);
}

export async function listDoneDeadlines(
  db: SQLite.SQLiteDatabase
): Promise<WithSubject<Deadline>[]> {
  return db.getAllAsync<WithSubject<Deadline>>(`
    SELECT d.*, s.name AS subject_name, s.color AS subject_color
    FROM deadlines d
    JOIN subjects s ON s.id = d.subject_id
    WHERE d.done = 1
    ORDER BY d.due_at DESC
    LIMIT 50
  `);
}

export async function listDeadlinesForSubject(
  db: SQLite.SQLiteDatabase,
  subjectId: number
): Promise<Deadline[]> {
  return db.getAllAsync<Deadline>(
    'SELECT * FROM deadlines WHERE subject_id = ? ORDER BY done, due_at',
    subjectId
  );
}

export async function createDeadline(
  db: SQLite.SQLiteDatabase,
  input: {
    subject_id: number;
    title: string;
    kind: DeadlineKind;
    due_at: number;
    reminder_id?: string | null;
  }
): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO deadlines (subject_id, title, kind, due_at, reminder_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    input.subject_id,
    input.title.trim(),
    input.kind,
    input.due_at,
    input.reminder_id ?? null,
    Date.now()
  );
  return result.lastInsertRowId;
}

export async function getDeadline(
  db: SQLite.SQLiteDatabase,
  id: number
): Promise<Deadline | null> {
  return db.getFirstAsync<Deadline>('SELECT * FROM deadlines WHERE id = ?', id);
}

export async function setDeadlineDone(
  db: SQLite.SQLiteDatabase,
  id: number,
  done: boolean
): Promise<void> {
  await db.runAsync(
    'UPDATE deadlines SET done = ? WHERE id = ?',
    done ? 1 : 0,
    id
  );
}

export async function setDeadlineReminder(
  db: SQLite.SQLiteDatabase,
  id: number,
  reminderId: string | null
): Promise<void> {
  await db.runAsync(
    'UPDATE deadlines SET reminder_id = ? WHERE id = ?',
    reminderId,
    id
  );
}

export async function deleteDeadline(
  db: SQLite.SQLiteDatabase,
  id: number
): Promise<void> {
  await db.runAsync('DELETE FROM deadlines WHERE id = ?', id);
}
