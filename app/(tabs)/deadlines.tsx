import { Link } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';

import { AddDeadlineForm } from '@/components/AddDeadlineForm';
import {
  Button,
  Card,
  EmptyState,
  IconButton,
  Loading,
  Pill,
  ScreenTitle,
  SectionHeader,
} from '@/components/ui';
import {
  deleteDeadline,
  listOpenDeadlines,
  setDeadlineDone,
} from '@/db/deadlines';
import type { Deadline, WithSubject } from '@/db/types';
import { formatDueDate, isOverdue, relativeDue } from '@/lib/format';
import { cancel } from '@/lib/notifications';
import { useQuery } from '@/lib/useQuery';
import { colors, spacing } from '@/theme';

/** The "quizzes and deadlines tab" from the notes, across all subjects. */
export default function DeadlinesScreen() {
  const db = useSQLiteContext();
  const { data, loading, refresh } = useQuery(listOpenDeadlines);
  const [adding, setAdding] = useState(false);

  const deadlines = data ?? [];
  const overdue = deadlines.filter((d) => isOverdue(d.due_at));
  const upcoming = deadlines.filter((d) => !isOverdue(d.due_at));

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
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenTitle
          title="Deadlines"
          subtitle="Assignments, quizzes and exams"
          action={
            <Link href="/settings" asChild>
              <Pressable accessibilityRole="button" hitSlop={10}>
                <Ionicons name="notifications-outline" size={22} color={colors.accent} />
              </Pressable>
            </Link>
          }
        />

        {adding ? (
          <AddDeadlineForm
            onAdded={() => {
              setAdding(false);
              refresh();
            }}
            onCancel={() => setAdding(false)}
          />
        ) : (
          <Button label="Add deadline" icon="add" onPress={() => setAdding(true)} />
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

        {!loading && deadlines.length === 0 && !adding ? (
          <EmptyState
            icon="alarm-outline"
            title="Nothing due"
            body="Deadlines you add here show up on their subject too, and set a reminder before they are due."
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
    <Card accent={deadline.subject_color}>
      <View style={styles.row}>
        <IconButton
          icon="ellipse-outline"
          label={`Mark ${deadline.title} done`}
          onPress={onComplete}
          color={colors.accent}
        />
        <View style={styles.rowBody}>
          <Text style={styles.rowTitle}>{deadline.title}</Text>
          <Text style={styles.rowMeta}>
            {deadline.subject_name} {'·'} {formatDueDate(deadline.due_at)}{' '}
            {'·'}{' '}
            <Text style={late ? styles.late : undefined}>
              {relativeDue(deadline.due_at)}
            </Text>
          </Text>
        </View>
        <View style={styles.rowEnd}>
          <Pill
            label={deadline.kind}
            color={deadline.kind === 'assignment' ? colors.muted : colors.warning}
          />
          <IconButton
            icon="trash-outline"
            label={`Delete ${deadline.title}`}
            onPress={onDelete}
          />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowBody: { flex: 1 },
  rowEnd: { alignItems: 'flex-end', gap: spacing.sm },
  rowTitle: { fontSize: 15, fontWeight: '600', color: colors.ink },
  rowMeta: { fontSize: 12, color: colors.muted, marginTop: 2 },
  late: { color: colors.danger, fontWeight: '600' },
});
