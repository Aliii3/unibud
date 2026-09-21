// Runs the app's real migrations against SQLite and checks the cascade the
// UI test could not reach, because Alert.alert is a no-op on web.
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../src/db/schema.ts', import.meta.url), 'utf8');
const migrations = [...src.matchAll(/`([\s\S]*?)`/g)].map((m) => m[1]);
console.log(`loaded ${migrations.length} migrations from schema.ts`);

function build({ foreignKeys }) {
  const db = new DatabaseSync(':memory:');
  // node:sqlite turns foreign keys ON by default, so the control has to
  // switch them OFF explicitly to be a control at all.
  db.exec(`PRAGMA foreign_keys = ${foreignKeys ? 'ON' : 'OFF'};`);
  migrations.forEach((m) => db.exec(m));
  db.exec(`INSERT INTO subjects (name,color,icon,created_at) VALUES ('Chem','#3760F9','flask',1)`);
  db.exec(`INSERT INTO schedule_slots (subject_id,weekday,start_min,end_min) VALUES (1,1,540,630)`);
  db.exec(`INSERT INTO deadlines (subject_id,title,kind,due_at,created_at) VALUES (1,'PS4','quiz',1,1)`);
  db.exec(`INSERT INTO todos (subject_id,title,created_at) VALUES (1,'Read',1)`);
  db.exec(`INSERT INTO documents (subject_id,name,uri,created_at) VALUES (1,'a.pdf','file://a',1)`);
  db.exec(`INSERT INTO chapters (document_id,title,position) VALUES (1,'Ch1',0)`);
  return db;
}
const counts = (db) =>
  ['schedule_slots', 'deadlines', 'todos', 'documents', 'chapters'].map(
    (t) => `${t}=${db.prepare(`SELECT COUNT(*) c FROM ${t}`).get().c}`
  ).join(' ');

let failures = 0;
function expect(label, cond, detail) {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${cond ? '' : `\n      ${detail}`}`);
  if (!cond) failures += 1;
}

// 1. Migrations apply cleanly, in order, from scratch.
const a = build({ foreignKeys: true });
expect('migrations apply from scratch', true, '');
expect('subject row has the v2 icon column',
  a.prepare('SELECT icon FROM subjects WHERE id=1').get().icon === 'flask', 'icon missing');

// 2. Cascade with foreign keys enforced — what the app does in migrate().
console.log(`  before delete: ${counts(a)}`);
a.exec('DELETE FROM subjects WHERE id = 1');
const after = counts(a);
console.log(`  after  delete: ${after}`);
expect('deleting a subject cascades to every child table',
  /schedule_slots=0 deadlines=0 todos=0 documents=0 chapters=0/.test(after),
  `rows survived: ${after}`);

// 3. The same delete WITHOUT the pragma, to show the pragma is what matters.
const b = build({ foreignKeys: false });
b.exec('DELETE FROM subjects WHERE id = 1');
const orphans = counts(b);
expect('without PRAGMA foreign_keys the rows are orphaned (pragma is load-bearing)',
  !/todos=0/.test(orphans), `expected orphans, got: ${orphans}`);

// 4. Deleting a document cascades to its chapters.
const c = build({ foreignKeys: true });
c.exec('DELETE FROM documents WHERE id = 1');
expect('deleting a document cascades to its chapters',
  c.prepare('SELECT COUNT(*) n FROM chapters').get().n === 0, 'chapters survived');

// 5. CHECK constraints reject bad data.
const d = build({ foreignKeys: true });
let rejected = false;
try { d.exec(`INSERT INTO deadlines (subject_id,title,kind,due_at,created_at) VALUES (1,'x','nonsense',1,1)`); }
catch { rejected = true; }
expect('deadline kind CHECK rejects an unknown kind', rejected, 'bad kind was accepted');

rejected = false;
try { d.exec(`INSERT INTO schedule_slots (subject_id,weekday,start_min,end_min) VALUES (1,9,1,2)`); }
catch { rejected = true; }
expect('weekday CHECK rejects a day outside 0-6', rejected, 'weekday 9 was accepted');

// 6. Deleting a deadline nulls the todo link rather than deleting the todo.
const e = build({ foreignKeys: true });
e.exec(`UPDATE todos SET deadline_id = 1 WHERE id = 1`);
e.exec('DELETE FROM deadlines WHERE id = 1');
const t = e.prepare('SELECT COUNT(*) n FROM todos').get().n;
const link = e.prepare('SELECT deadline_id FROM todos WHERE id=1').get().deadline_id;
expect('deleting a deadline keeps its todo and clears the link',
  t === 1 && link === null, `todos=${t} deadline_id=${link}`);

console.log(`\nschema checks: ${failures === 0 ? 'ALL PASS' : `${failures} FAILED`}`);
process.exit(failures ? 1 : 0);
