import type * as SQLite from 'expo-sqlite';

import { subjectColors, subjectIcons } from '../theme';
import type { Subject } from './types';

export interface SubjectSummary extends Subject {
  open_todos: number;
  open_deadlines: number;
  documents: number;
}

export async function listSubjects(
  db: SQLite.SQLiteDatabase
): Promise<SubjectSummary[]> {
  return db.getAllAsync<SubjectSummary>(`
    SELECT s.*,
      (SELECT COUNT(*) FROM todos t
        WHERE t.subject_id = s.id AND t.done = 0)     AS open_todos,
      (SELECT COUNT(*) FROM deadlines d
        WHERE d.subject_id = s.id AND d.done = 0)     AS open_deadlines,
      (SELECT COUNT(*) FROM documents f
        WHERE f.subject_id = s.id)                    AS documents
    FROM subjects s
    ORDER BY s.name COLLATE NOCASE
  `);
}

export async function getSubject(
  db: SQLite.SQLiteDatabase,
  id: number
): Promise<Subject | null> {
  return db.getFirstAsync<Subject>('SELECT * FROM subjects WHERE id = ?', id);
}

export async function createSubject(
  db: SQLite.SQLiteDatabase,
  name: string
): Promise<number> {
  // Cycle the palette and icon set by how many subjects already exist, so a
  // new subject rarely matches its neighbour in the grid.
  const count = await db.getFirstAsync<{ n: number }>(
    'SELECT COUNT(*) AS n FROM subjects'
  );
  const n = count?.n ?? 0;
  const result = await db.runAsync(
    'INSERT INTO subjects (name, color, icon, created_at) VALUES (?, ?, ?, ?)',
    name.trim(),
    subjectColors[n % subjectColors.length],
    subjectIcons[n % subjectIcons.length],
    Date.now()
  );
  return result.lastInsertRowId;
}

export async function renameSubject(
  db: SQLite.SQLiteDatabase,
  id: number,
  name: string
): Promise<void> {
  await db.runAsync('UPDATE subjects SET name = ? WHERE id = ?', name.trim(), id);
}

/** Cascades to schedule slots, deadlines, todos, documents and chapters. */
export async function deleteSubject(
  db: SQLite.SQLiteDatabase,
  id: number
): Promise<void> {
  await db.runAsync('DELETE FROM subjects WHERE id = ?', id);
}
