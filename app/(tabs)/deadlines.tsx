import { Link } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AddDeadlineForm } from '@/components/AddDeadlineForm';
import {
  Button,
  Card,
  EmptyState,
  IconButton,
  LegendDot,
  Loading,
  Pill,
  ScreenTitle,
  SectionHeader,
  StatTile,
} from '@/components/ui';
import { deleteDeadline, listOpenDeadlines, setDeadlineDone } from '@/db/deadlines';
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
  const thisWeek = upcoming.filter(
    (d) => d.due_at < Date.now() + 7 * 86_400_000
  );

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
          <StatTile value={String(overdue.length)} label="Overdue" tone="lime" />
          <StatTile value={String(thisWeek.length)} label="Next 7 days" tone="lavender" />
          <StatTile value={String(deadlines.length)} label="Open total" />
        </View>

        <View style={styles.legendRow}>
          <LegendDot color={colors.danger} label="Overdue" />
          <LegendDot color={colors.blue} label="Upcoming" />
          <LegendDot color={colors.ink} label="Quiz or exam" />
        </View>

        {adding ? (
          <View style={styles.form}>
            <AddDeadlineForm
              onAdded={() => {
                setAdding(false);
                refresh();
              }}
              onCancel={() => setAdding(false)}
            />
          </View>
        ) : (
          <View style={styles.cta}>
            <Button label="Add deadline" icon="add" onPress={() => setAdding(true)} />
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

        {!loading && deadlines.length === 0 && !adding ? (
          <EmptyState
            icon="alarm-outline"
            title="Nothing due"
            body="Deadlines show up on their subject too, and set a reminder before they are due."
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

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  tiles: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  cta: { marginBottom: spacing.sm },
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
