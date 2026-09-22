import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  createReminder,
  setReminderNotification,
} from '@/db/reminders';
import { DEFAULTS, getNumberSetting, KEYS } from '@/db/settings';
import { parseDueDate } from '@/lib/format';
import { scheduleDeadlineReminder } from '@/lib/notifications';
import { border, colors, radius, spacing } from '@/theme';
import { Button, Field } from '@/ui';

/**
 * Capture for something dated that belongs to no subject — seeing the
 * coordinator, collecting a transcript. Same date parsing and the same
 * reminder lead time as a subject deadline.
 */
export function AddReminderForm({
  onAdded,
  onCancel,
}: {
  onAdded: () => void;
  onCancel: () => void;
}) {
  const db = useSQLiteContext();
  const [title, setTitle] = useState('');
  const [due, setDue] = useState('');
  const [saving, setSaving] = useState(false);

  const dueAt = parseDueDate(due);
  const dateLooksWrong = due.trim().length > 0 && dueAt == null;
  const canSave = !saving && title.trim().length > 0 && dueAt != null;

  async function onSave() {
    if (dueAt == null) return;
    setSaving(true);
    try {
      const id = await createReminder(db, { title, due_at: dueAt });

      // Scheduling is best-effort, exactly as it is for a deadline: the
      // reminder is saved either way.
      const lead = await getNumberSetting(
        db,
        KEYS.reminderLeadHours,
        DEFAULTS.reminderLeadHours
      );
      const notificationId = await scheduleDeadlineReminder(
        title.trim(),
        'Reminder',
        dueAt,
        lead
      );
      if (notificationId) {
        await setReminderNotification(db, id, notificationId);
      }

      setTitle('');
      setDue('');
      onAdded();
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.form}>
      <Text style={styles.heading}>New reminder</Text>
      <Text style={styles.hint}>
        For anything that is not tied to a subject.
      </Text>

      <Field
        autoFocus
        value={title}
        onChangeText={setTitle}
        placeholder="What do you need to remember?"
      />

      <Field
        value={due}
        onChangeText={setDue}
        placeholder="When — 14/03 or 2026-03-14"
        keyboardType="numbers-and-punctuation"
        autoCorrect={false}
      />
      {dateLooksWrong ? (
        <Text style={styles.warn}>
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
  hint: { fontSize: 13, color: colors.muted, fontWeight: '500', marginTop: -6 },
  warn: { fontSize: 12, color: colors.warning, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  action: { flex: 1, minWidth: 0 },
});
