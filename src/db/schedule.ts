import type * as SQLite from 'expo-sqlite';

import type { ScheduleSlot, WithSubject } from './types';

export async function listSlotsForWeek(
  db: SQLite.SQLiteDatabase
): Promise<WithSubject<ScheduleSlot>[]> {
  return db.getAllAsync<WithSubject<ScheduleSlot>>(`
    SELECT sl.*, s.name AS subject_name, s.color AS subject_color
    FROM schedule_slots sl
    JOIN subjects s ON s.id = sl.subject_id
    ORDER BY sl.weekday, sl.start_min
  `);
}

export async function listSlotsForSubject(
  db: SQLite.SQLiteDatabase,
  subjectId: number
): Promise<ScheduleSlot[]> {
  return db.getAllAsync<ScheduleSlot>(
    `SELECT * FROM schedule_slots WHERE subject_id = ?
     ORDER BY weekday, start_min`,
    subjectId
  );
}

export async function createSlot(
  db: SQLite.SQLiteDatabase,
  slot: Omit<ScheduleSlot, 'id'>
): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO schedule_slots (subject_id, weekday, start_min, end_min, location)
     VALUES (?, ?, ?, ?, ?)`,
    slot.subject_id,
    slot.weekday,
    slot.start_min,
    slot.end_min,
    slot.location
  );
  return result.lastInsertRowId;
}

export async function deleteSlot(
  db: SQLite.SQLiteDatabase,
  id: number
): Promise<void> {
  await db.runAsync('DELETE FROM schedule_slots WHERE id = ?', id);
}
