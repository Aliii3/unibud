/**
 * Schema migrations, applied in order against PRAGMA user_version.
 * Add a new entry to migrate the database; never edit an entry that shipped.
 */
export const MIGRATIONS: string[] = [
  // v1 — subjects, schedule, deadlines, todos, documents, chapters, settings.
  `
  CREATE TABLE subjects (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL,
    color      TEXT    NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE schedule_slots (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    weekday    INTEGER NOT NULL CHECK (weekday BETWEEN 0 AND 6),
    start_min  INTEGER NOT NULL,
    end_min    INTEGER NOT NULL,
    location   TEXT
  );
  CREATE INDEX idx_slots_subject ON schedule_slots(subject_id);
  CREATE INDEX idx_slots_weekday ON schedule_slots(weekday, start_min);

  CREATE TABLE deadlines (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_id  INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    title       TEXT    NOT NULL,
    kind        TEXT    NOT NULL CHECK (kind IN ('assignment','quiz','exam')),
    due_at      INTEGER NOT NULL,
    done        INTEGER NOT NULL DEFAULT 0,
    reminder_id TEXT,
    created_at  INTEGER NOT NULL
  );
  CREATE INDEX idx_deadlines_due ON deadlines(done, due_at);
  CREATE INDEX idx_deadlines_subject ON deadlines(subject_id);

  CREATE TABLE todos (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_id  INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    title       TEXT    NOT NULL,
    done        INTEGER NOT NULL DEFAULT 0,
    deadline_id INTEGER REFERENCES deadlines(id) ON DELETE SET NULL,
    created_at  INTEGER NOT NULL
  );
  CREATE INDEX idx_todos_subject ON todos(subject_id, done);

  CREATE TABLE documents (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    name       TEXT    NOT NULL,
    uri        TEXT    NOT NULL,
    mime       TEXT,
    size       INTEGER,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX idx_documents_subject ON documents(subject_id);

  CREATE TABLE chapters (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    title       TEXT    NOT NULL,
    position    INTEGER NOT NULL,
    note        TEXT
  );
  CREATE INDEX idx_chapters_document ON chapters(document_id, position);

  CREATE TABLE settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  `,

  // v2 — each subject carries an icon, shown on its folder card.
  `
  ALTER TABLE subjects ADD COLUMN icon TEXT NOT NULL DEFAULT 'book';
  `,
];
