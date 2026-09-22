export type DeadlineKind = 'assignment' | 'quiz' | 'exam';

export interface Subject {
  id: number;
  name: string;
  color: string;
  /** An Ionicons name, assigned on create. */
  icon: string;
  created_at: number;
}

/** A recurring class slot. `weekday` is 0=Sunday .. 6=Saturday, times are
 *  minutes from midnight so they sort and compare without date maths. */
export interface ScheduleSlot {
  id: number;
  subject_id: number;
  weekday: number;
  start_min: number;
  end_min: number;
  location: string | null;
}

export interface Deadline {
  id: number;
  subject_id: number;
  title: string;
  kind: DeadlineKind;
  due_at: number;
  done: number;
  reminder_id: string | null;
  created_at: number;
}

export interface Todo {
  id: number;
  subject_id: number;
  title: string;
  done: number;
  deadline_id: number | null;
  created_at: number;
}

export interface Doc {
  id: number;
  subject_id: number;
  name: string;
  uri: string;
  mime: string | null;
  size: number | null;
  created_at: number;
}

/** A manually marked section of a document. See spec/unibud-concept-spec.pdf,
 *  open question 2: v1 divides chapters by hand rather than parsing the file. */
export interface Chapter {
  id: number;
  document_id: number;
  title: string;
  position: number;
  note: string | null;
}

export type WithSubject<T> = T & { subject_name: string; subject_color: string };
