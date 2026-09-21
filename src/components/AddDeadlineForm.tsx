import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { createDeadline, setDeadlineReminder } from '@/db/deadlines';
import { DEFAULTS, getNumberSetting, KEYS } from '@/db/settings';
import { listSubjects, type SubjectSummary } from '@/db/subjects';
import type { DeadlineKind } from '@/db/types';
import { parseDueDate } from '@/lib/format';
import { scheduleDeadlineReminder } from '@/lib/notifications';
import { border, colors, radius, spacing } from '@/theme';

import { Button, Chip, Field } from './ui';

const KINDS: DeadlineKind[] = ['assignment', 'quiz', 'exam'];

/**
 * Capture for a deadline or quiz. `subjectId` fixes the subject when the form
 * is opened from inside one; otherwise the student picks.
 */
export function AddDeadlineForm({
  subjectId,
  onAdded,
  onCancel,
}: {
  subjectId?: number;
  onAdded: () => void;
  onCancel: () => void;
}) {
  const db = useSQLiteContext();
  const [subjects, setSubjects] = useState<SubjectSummary[]>([]);
  const [chosen, setChosen] = useState<number | undefined>(subjectId);
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<DeadlineKind>('assignment');
  const [due, setDue] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (subjectId != null) return;
    listSubjects(db).then((rows) => {
      setSubjects(rows);
      setChosen((current) => current ?? rows[0]?.id);
    });
  }, [db, subjectId]);

  const dueAt = parseDueDate(due);
  const dateLooksWrong = due.trim().length > 0 && dueAt == null;
  const canSave = !saving && title.trim().length > 0 && chosen != null && dueAt != null;

  async function onSave() {
    if (chosen == null || dueAt == null) return;
    setSaving(true);
    try {
      const id = await createDeadline(db, {
        subject_id: chosen,
        title,
        kind,
        due_at: dueAt,
      });

      // Scheduling can fail (permission denied, or the lead time has already
      // passed). The deadline is still saved; it simply has no reminder.
      const lead = await getNumberSetting(
        db,
        KEYS.reminderLeadHours,
        DEFAULTS.reminderLeadHours
      );
      const subjectName = subjects.find((s) => s.id === chosen)?.name ?? 'Unibud';
      const reminderId = await scheduleDeadlineReminder(
        title.trim(),
        subjectName,
        dueAt,
        lead
      );
      if (reminderId) await setDeadlineReminder(db, id, reminderId);

      setTitle('');
      setDue('');
      onAdded();
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.form}>
      <Text style={styles.heading}>New deadline</Text>

      <Field autoFocus value={title} onChangeText={setTitle} placeholder="What is due?" />

      <View style={styles.row}>
        {KINDS.map((k) => (
          <Chip
            key={k}
            label={k}
            selected={kind === k}
            onPress={() => setKind(k)}
            color={colors.ink}
          />
        ))}
      </View>

      {subjectId == null ? (
        <View style={styles.row}>
          {subjects.map((s) => (
            <Chip
              key={s.id}
              label={s.name}
              color={s.color}
              selected={chosen === s.id}
              onPress={() => setChosen(s.id)}
            />
          ))}
        </View>
      ) : null}

      <Field
        value={due}
        onChangeText={setDue}
        placeholder="Due date — 14/03 or 2026-03-14"
        keyboardType="numbers-and-punctuation"
        autoCorrect={false}
      />
      {dateLooksWrong ? (
        <Text style={styles.hint}>
          Use a day and month, like 14/03, or a full date like 2026-03-14.
        </Text>
      ) : null}

      <View style={styles.actions}>
        <View style={styles.action}>
          <Button label="Cancel" variant="quiet" onPress={onCancel} />
        </View>
        <View style={styles.action}>
          <Button label="Save" onPress={onSave} disabled={!canSave} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.md,
    borderWidth: border.width,
    borderColor: border.color,
  },
  heading: { fontSize: 17, fontWeight: '800', color: colors.ink, letterSpacing: -0.3 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  hint: { fontSize: 12, color: colors.warning, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  action: { flex: 1, minWidth: 0 },
});
