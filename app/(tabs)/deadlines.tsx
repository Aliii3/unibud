import { Link } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AddDeadlineForm } from '@/features/deadlines/AddDeadlineForm';
import { AddReminderForm } from '@/features/reminders/AddReminderForm';
import {
  Button,
  Card,
  EmptyState,
  IconButton,
  Loading,
  Pill,
  ScreenTitle,
  SectionHeader,
  StatTile,
} from '@/ui';
import { deleteDeadline, listOpenDeadlines, setDeadlineDone } from '@/db/deadlines';
import {
  deleteReminder,
  listOpenReminders,
  type Reminder,
  setReminderDone,
} from '@/db/reminders';
import type { Deadline, WithSubject } from '@/db/types';
import { formatDueDate, isOverdue, relativeDue } from '@/lib/format';
import { cancel } from '@/lib/notifications';
import { useQuery } from '@/lib/useQuery';
import { colors, spacing } from '@/theme';

/** The "quizzes and deadlines tab" from the notes, across all subjects. */
export default function DeadlinesScreen() {
  const db = useSQLiteContext();
  const { data, loading, refresh } = useQuery(listOpenDeadlines);
  const remindersQuery = useQuery(listOpenReminders);
  const [adding, setAdding] = useState<null | 'deadline' | 'reminder'>(null);

  const deadlines = data ?? [];
  const reminders = remindersQuery.data ?? [];
  const overdue = deadlines.filter((d) => isOverdue(d.due_at));
  const upcoming = deadlines.filter((d) => !isOverdue(d.due_at));
  const soon = Date.now() + 7 * 86_400_000;
  const thisWeek = [
    ...upcoming.filter((d) => d.due_at < soon),
    ...reminders.filter((r) => !isOverdue(r.due_at) && r.due_at < soon),
  ];
  const overdueCount =
    overdue.length + reminders.filter((r) => isOverdue(r.due_at)).length;
  const openTotal = deadlines.length + reminders.length;

  async function onComplete(deadline: WithSubject<Deadline>) {
    await setDeadlineDone(db, deadline.id, true);
    await cancel(deadline.reminder_id);
    refresh();
  }

  async function onDelete(deadline: WithSubject<Deadline>) {
    await cancel(deadline.reminder_id);
    await deleteDeadline(db, deadline.id);
    refresh();
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ScreenTitle
          title={'What is due,\nand when.'}
          action={
            <Link href="/settings" asChild>
              <Pressable accessibilityRole="button">
                <IconButton
                  icon="notifications-outline"
                  label="Daily check-in"
                  surface
                  onPress={() => {}}
                />
              </Pressable>
            </Link>
          }
        />

        <View style={styles.tiles}>
          <StatTile value={String(overdueCount)} label="Overdue" tone="lime" />
          <StatTile value={String(thisWeek.length)} label="Next 7 days" tone="lavender" />
          <StatTile value={String(openTotal)} label="Open total" />
        </View>

        {adding === 'deadline' ? (
          <View style={styles.form}>
            <AddDeadlineForm
              onAdded={() => {
                setAdding(null);
                refresh();
              }}
              onCancel={() => setAdding(null)}
            />
          </View>
        ) : adding === 'reminder' ? (
          <View style={styles.form}>
            <AddReminderForm
              onAdded={() => {
                setAdding(null);
                remindersQuery.refresh();
              }}
              onCancel={() => setAdding(null)}
            />
          </View>
        ) : (
          <View style={styles.ctaRow}>
            <View style={styles.cta}>
              <Button
                label="Add deadline"
                icon="add"
                onPress={() => setAdding('deadline')}
              />
            </View>
            <View style={styles.cta}>
              <Button
                label="Add reminder"
                icon="notifications-outline"
                variant="quiet"
                onPress={() => setAdding('reminder')}
              />
            </View>
          </View>
        )}

        {loading && deadlines.length === 0 ? <Loading /> : null}

        {overdue.length > 0 ? (
          <>
            <SectionHeader>Overdue</SectionHeader>
            {overdue.map((d) => (
              <DeadlineRow
                key={d.id}
                deadline={d}
                onComplete={() => onComplete(d)}
                onDelete={() => onDelete(d)}
              />
            ))}
          </>
        ) : null}

        {upcoming.length > 0 ? (
          <>
            <SectionHeader>Upcoming</SectionHeader>
            {upcoming.map((d) => (
              <DeadlineRow
                key={d.id}
                deadline={d}
                onComplete={() => onComplete(d)}
                onDelete={() => onDelete(d)}
              />
            ))}
          </>
        ) : null}

        {reminders.length > 0 ? (
          <>
            <SectionHeader>Reminders</SectionHeader>
            {reminders.map((r) => (
              <ReminderRow
                key={r.id}
                reminder={r}
                onComplete={async () => {
                  await setReminderDone(db, r.id, true);
                  await cancel(r.reminder_id);
                  remindersQuery.refresh();
                }}
                onDelete={async () => {
                  await cancel(r.reminder_id);
                  await deleteReminder(db, r.id);
                  remindersQuery.refresh();
                }}
              />
            ))}
          </>
        ) : null}

        {!loading && deadlines.length === 0 && reminders.length === 0 && !adding ? (
          <EmptyState
            icon="alarm-outline"
            title="Nothing due"
            body="Deadlines belong to a subject. Reminders are for everything else \u2014 seeing the coordinator, collecting a transcript."
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function DeadlineRow({
  deadline,
  onComplete,
  onDelete,
}: {
  deadline: WithSubject<Deadline>;
  onComplete: () => void;
  onDelete: () => void;
}) {
  const late = isOverdue(deadline.due_at);
  return (
    <Card accent={late ? colors.danger : deadline.subject_color}>
      <View style={styles.row}>
        <IconButton
          icon="ellipse-outline"
          label={`Mark ${deadline.title} done`}
          onPress={onComplete}
          color={colors.ink}
        />
        <View style={styles.rowBody}>
          <Text style={styles.rowTitle}>{deadline.title}</Text>
          <Text style={styles.rowMeta}>
            {deadline.subject_name} {'·'} {formatDueDate(deadline.due_at)}
          </Text>
          <View style={styles.rowTags}>
            <Pill
              label={deadline.kind}
              color={deadline.kind === 'assignment' ? colors.lavender : colors.lime}
            />
            <Text style={[styles.due, late ? styles.late : null]}>
              {relativeDue(deadline.due_at)}
            </Text>
          </View>
        </View>
        <IconButton
          icon="trash-outline"
          label={`Delete ${deadline.title}`}
          color={colors.faint}
          onPress={onDelete}
        />
      </View>
    </Card>
  );
}

/** A reminder has no subject, so it is marked rather than colour-coded. */
function ReminderRow({
  reminder,
  onComplete,
  onDelete,
}: {
  reminder: Reminder;
  onComplete: () => void;
  onDelete: () => void;
}) {
  const late = isOverdue(reminder.due_at);
  return (
    <Card accent={late ? colors.danger : colors.ink}>
      <View style={styles.row}>
        <IconButton
          icon="ellipse-outline"
          label={`Mark ${reminder.title} done`}
          onPress={onComplete}
          color={colors.ink}
        />
        <View style={styles.rowBody}>
          <Text style={styles.rowTitle}>{reminder.title}</Text>
          <Text style={styles.rowMeta}>{formatDueDate(reminder.due_at)}</Text>
          <View style={styles.rowTags}>
            <Pill label="Reminder" color={colors.lavender} />
            <Text style={[styles.due, late ? styles.late : null]}>
              {relativeDue(reminder.due_at)}
            </Text>
          </View>
        </View>
        <IconButton
          icon="trash-outline"
          label={`Delete ${reminder.title}`}
          color={colors.faint}
          onPress={onDelete}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  ctaRow: { gap: spacing.md, marginBottom: spacing.sm },
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  tiles: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  cta: {},
  form: { marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowBody: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: 15, fontWeight: '700', color: colors.ink, letterSpacing: -0.2 },
  rowMeta: { fontSize: 12, color: colors.muted, marginTop: 2, fontWeight: '500' },
  rowTags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  due: { fontSize: 12, color: colors.muted, fontWeight: '600' },
  late: { color: colors.danger, fontWeight: '700' },
});
