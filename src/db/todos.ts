import type * as SQLite from 'expo-sqlite';

import type { Todo, WithSubject } from './types';

export async function listTodos(
  db: SQLite.SQLiteDatabase
): Promise<WithSubject<Todo>[]> {
  return db.getAllAsync<WithSubject<Todo>>(`
    SELECT t.*, s.name AS subject_name, s.color AS subject_color
    FROM todos t
    JOIN subjects s ON s.id = t.subject_id
    ORDER BY t.done, t.created_at DESC
  `);
}

export async function listTodosForSubject(
  db: SQLite.SQLiteDatabase,
  subjectId: number
): Promise<Todo[]> {
  return db.getAllAsync<Todo>(
    'SELECT * FROM todos WHERE subject_id = ? ORDER BY done, created_at DESC',
    subjectId
  );
}

export async function createTodo(
  db: SQLite.SQLiteDatabase,
  input: { subject_id: number; title: string; deadline_id?: number | null }
): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO todos (subject_id, title, deadline_id, created_at)
     VALUES (?, ?, ?, ?)`,
    input.subject_id,
    input.title.trim(),
    input.deadline_id ?? null,
    Date.now()
  );
  return result.lastInsertRowId;
}

export async function toggleTodo(
  db: SQLite.SQLiteDatabase,
  id: number
): Promise<void> {
  await db.runAsync(
    'UPDATE todos SET done = CASE done WHEN 0 THEN 1 ELSE 0 END WHERE id = ?',
    id
  );
}

export async function deleteTodo(
  db: SQLite.SQLiteDatabase,
  id: number
): Promise<void> {
  await db.runAsync('DELETE FROM todos WHERE id = ?', id);
}
