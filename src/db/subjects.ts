import type * as SQLite from 'expo-sqlite';

import { subjectColors } from '../theme';
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
  // Cycle the palette by how many subjects already exist, so a new subject
  // rarely lands on the same colour as its neighbour in the grid.
  const count = await db.getFirstAsync<{ n: number }>(
    'SELECT COUNT(*) AS n FROM subjects'
  );
  const color = subjectColors[(count?.n ?? 0) % subjectColors.length];
  const result = await db.runAsync(
    'INSERT INTO subjects (name, color, created_at) VALUES (?, ?, ?)',
    name.trim(),
    color,
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
