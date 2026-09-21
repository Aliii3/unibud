import type * as SQLite from 'expo-sqlite';

import { removeStoredDocument } from '../lib/files';
import type { Chapter, Doc, WithSubject } from './types';

export interface DocSummary extends Doc {
  chapters: number;
}

export async function listDocuments(
  db: SQLite.SQLiteDatabase
): Promise<WithSubject<DocSummary>[]> {
  return db.getAllAsync<WithSubject<DocSummary>>(`
    SELECT f.*, s.name AS subject_name, s.color AS subject_color,
      (SELECT COUNT(*) FROM chapters c WHERE c.document_id = f.id) AS chapters
    FROM documents f
    JOIN subjects s ON s.id = f.subject_id
    ORDER BY f.created_at DESC
  `);
}

export async function listDocumentsForSubject(
  db: SQLite.SQLiteDatabase,
  subjectId: number
): Promise<DocSummary[]> {
  return db.getAllAsync<DocSummary>(
    `SELECT f.*,
       (SELECT COUNT(*) FROM chapters c WHERE c.document_id = f.id) AS chapters
     FROM documents f
     WHERE f.subject_id = ?
     ORDER BY f.created_at DESC`,
    subjectId
  );
}

export async function createDocument(
  db: SQLite.SQLiteDatabase,
  input: {
    subject_id: number;
    name: string;
    uri: string;
    mime: string | null;
    size: number | null;
  }
): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO documents (subject_id, name, uri, mime, size, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    input.subject_id,
    input.name,
    input.uri,
    input.mime,
    input.size,
    Date.now()
  );
  return result.lastInsertRowId;
}

/** Removes the stored file as well as the row, so storage does not leak. */
export async function deleteDocument(
  db: SQLite.SQLiteDatabase,
  id: number
): Promise<void> {
  const doc = await db.getFirstAsync<Doc>(
    'SELECT * FROM documents WHERE id = ?',
    id
  );
  if (doc) {
    removeStoredDocument(doc.uri);
  }
  await db.runAsync('DELETE FROM documents WHERE id = ?', id);
}

export async function listChapters(
  db: SQLite.SQLiteDatabase,
  documentId: number
): Promise<Chapter[]> {
  return db.getAllAsync<Chapter>(
    'SELECT * FROM chapters WHERE document_id = ? ORDER BY position',
    documentId
  );
}

export async function createChapter(
  db: SQLite.SQLiteDatabase,
  documentId: number,
  title: string
): Promise<number> {
  const last = await db.getFirstAsync<{ p: number | null }>(
    'SELECT MAX(position) AS p FROM chapters WHERE document_id = ?',
    documentId
  );
  const result = await db.runAsync(
    'INSERT INTO chapters (document_id, title, position) VALUES (?, ?, ?)',
    documentId,
    title.trim(),
    (last?.p ?? -1) + 1
  );
  return result.lastInsertRowId;
}

export async function deleteChapter(
  db: SQLite.SQLiteDatabase,
  id: number
): Promise<void> {
  await db.runAsync('DELETE FROM chapters WHERE id = ?', id);
}

export async function getDocument(
  db: SQLite.SQLiteDatabase,
  id: number
): Promise<WithSubject<Doc> | null> {
  return db.getFirstAsync<WithSubject<Doc>>(
    `SELECT f.*, s.name AS subject_name, s.color AS subject_color
     FROM documents f
     JOIN subjects s ON s.id = f.subject_id
     WHERE f.id = ?`,
    id
  );
}
