import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AddDeadlineForm } from '@/components/AddDeadlineForm';
import {
  Button,
  Card,
  EmptyState,
  Field,
  IconButton,
  Loading,
  ScreenTitle,
} from '@/components/ui';
import { listDeadlinesForSubject, setDeadlineDone } from '@/db/deadlines';
import { deleteDocument, listDocumentsForSubject } from '@/db/documents';
import { listSlotsForSubject } from '@/db/schedule';
import { deleteSubject, getSubject } from '@/db/subjects';
import { createTodo, deleteTodo, listTodosForSubject, toggleTodo } from '@/db/todos';
import { formatBytes } from '@/lib/files';
import { formatDueDate, minutesToClock, WEEKDAYS_SHORT } from '@/lib/format';
import { cancel } from '@/lib/notifications';
import { pickDocumentForSubject } from '@/lib/pickDocument';
import { useQuery } from '@/lib/useQuery';
import { colors, onSubject, radius, shadow, spacing } from '@/theme';

type Section = 'doc' | 'todo' | 'deadline';

const SECTIONS: { key: Section; label: string }[] = [
  { key: 'doc', label: 'Doc' },
  { key: 'todo', label: 'Todo' },
  { key: 'deadline', label: 'Deadline' },
];

/**
 * "inside the subject" from page 3 of the notes: one content panel with the
 * sketched tabs across it. The app-level tab bar keeps Home reachable, so the
 * three subject-scoped sections are a segmented control here.
 */
export default function SubjectScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const subjectId = Number(params.id);
  const [section, setSection] = useState<Section>('doc');

  const subject = useQuery((database) => getSubject(database, subjectId));

  if (subject.loading && !subject.data) return <Loading />;
  if (!subject.data) {
    return (
      <EmptyState
        icon="alert-circle-outline"
        title="Subject not found"
        body="It may have been deleted."
      />
    );
  }

  const tint = subject.data.color;

  function confirmDelete() {
    Alert.alert(
      `Delete ${subject.data?.name}?`,
      'Its schedule, documents, chapters, to-dos and deadlines are deleted too. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteSubject(db, subjectId);
            router.back();
          },
        },
      ]
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: '',
          headerRight: () => (
            <IconButton
              icon="trash-outline"
              label="Delete subject"
              color={colors.danger}
              onPress={confirmDelete}
            />
          ),
        }}
      />
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenTitle title={subject.data.name} />
        <SubjectSchedule subjectId={subjectId} tint={tint} />

        <View style={styles.segments}>
          {SECTIONS.map((s) => {
            const active = section === s.key;
            return (
              <Pressable
                key={s.key}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                onPress={() => setSection(s.key)}
                style={[styles.segment, active ? { backgroundColor: tint } : null]}
              >
                <Text
                  style={[
                    styles.segmentLabel,
                    active ? { color: onSubject(tint), fontWeight: '800' } : null,
                  ]}
                >
                  {s.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {section === 'doc' ? <DocsSection subjectId={subjectId} /> : null}
        {section === 'todo' ? <TodosSection subjectId={subjectId} /> : null}
        {section === 'deadline' ? <DeadlinesSection subjectId={subjectId} /> : null}
      </ScrollView>
    </>
  );
}

function SubjectSchedule({ subjectId, tint }: { subjectId: number; tint: string }) {
  const { data } = useQuery((database) => listSlotsForSubject(database, subjectId));
  const slots = data ?? [];
  if (slots.length === 0) return null;
  return (
    <View style={styles.slots}>
      {slots.map((slot) => (
        <View key={slot.id} style={styles.slot}>
          <Text style={[styles.slotDay, { color: tint }]}>
            {WEEKDAYS_SHORT[slot.weekday]}
          </Text>
          <Text style={styles.slotTime}>
            {minutesToClock(slot.start_min)}–{minutesToClock(slot.end_min)}
          </Text>
        </View>
      ))}
    </View>
  );
}

function DocsSection({ subjectId }: { subjectId: number }) {
  const db = useSQLiteContext();
  const router = useRouter();
  const { data, loading, refresh } = useQuery((database) =>
    listDocumentsForSubject(database, subjectId)
  );
  const [busy, setBusy] = useState(false);
  const documents = data ?? [];

  async function onUpload() {
    setBusy(true);
    try {
      if (await pickDocumentForSubject(db, subjectId)) refresh();
    } catch (error) {
      Alert.alert(
        'Could not add that file',
        error instanceof Error ? error.message : 'Unknown error'
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <View>
      {documents.map((doc) => (
        <Card key={doc.id} onPress={() => router.push(`/document/${doc.id}`)}>
          <View style={styles.row}>
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle} numberOfLines={1}>
                {doc.name}
              </Text>
              <Text style={styles.rowMeta}>
                {[
                  formatBytes(doc.size),
                  doc.chapters > 0
                    ? `${doc.chapters} chapter${doc.chapters === 1 ? '' : 's'}`
                    : 'No chapters',
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
            </View>
            <IconButton
              icon="trash-outline"
              label={`Delete ${doc.name}`}
              onPress={async () => {
                await deleteDocument(db, doc.id);
                refresh();
              }}
            />
          </View>
        </Card>
      ))}

      {documents.length === 0 && !loading ? (
        <EmptyState
          icon="document-text-outline"
          title="No documents"
          body="Add lecture notes or slides for this subject."
        />
      ) : null}

      <Button
        label={busy ? 'Adding…' : 'Upload document'}
        icon="cloud-upload-outline"
        variant="quiet"
        disabled={busy}
        onPress={onUpload}
      />
    </View>
  );
}

function TodosSection({ subjectId }: { subjectId: number }) {
  const db = useSQLiteContext();
  const { data, loading, refresh } = useQuery((database) =>
    listTodosForSubject(database, subjectId)
  );
  const [title, setTitle] = useState('');
  const todos = data ?? [];

  async function onAdd() {
    if (!title.trim()) return;
    await createTodo(db, { subject_id: subjectId, title });
    setTitle('');
    refresh();
  }

  return (
    <View>
      {todos.map((todo) => (
        <Card key={todo.id}>
          <View style={styles.row}>
            <IconButton
              icon={todo.done ? 'checkbox' : 'square-outline'}
              label={`${todo.done ? 'Reopen' : 'Complete'} ${todo.title}`}
              color={todo.done ? colors.blue : colors.ink}
              onPress={async () => {
                await toggleTodo(db, todo.id);
                refresh();
              }}
            />
            <Text
              style={[styles.rowTitle, styles.rowBody, todo.done ? styles.struck : null]}
            >
              {todo.title}
            </Text>
            <IconButton
              icon="trash-outline"
              label={`Delete ${todo.title}`}
              onPress={async () => {
                await deleteTodo(db, todo.id);
                refresh();
              }}
            />
          </View>
        </Card>
      ))}

      {todos.length === 0 && !loading ? (
        <EmptyState icon="checkbox-outline" title="Nothing to do" body="Add a task for this subject." />
      ) : null}

      <View style={styles.composer}>
        <Field
          value={title}
          onChangeText={setTitle}
          placeholder="Add a task"
          returnKeyType="done"
          onSubmitEditing={onAdd}
        />
        <Button
          label="Add task"
          icon="add"
          variant="quiet"
          onPress={onAdd}
          disabled={!title.trim()}
        />
      </View>
    </View>
  );
}

function DeadlinesSection({ subjectId }: { subjectId: number }) {
  const db = useSQLiteContext();
  const { data, loading, refresh } = useQuery((database) =>
    listDeadlinesForSubject(database, subjectId)
  );
  const [adding, setAdding] = useState(false);
  const deadlines = data ?? [];

  return (
    <View>
      {deadlines.map((deadline) => (
        <Card key={deadline.id}>
          <View style={styles.row}>
            <IconButton
              icon={deadline.done ? 'checkmark-circle' : 'ellipse-outline'}
              label={`${deadline.done ? 'Reopen' : 'Complete'} ${deadline.title}`}
              color={deadline.done ? colors.blue : colors.ink}
              onPress={async () => {
                await setDeadlineDone(db, deadline.id, deadline.done === 0);
                if (deadline.done === 0) await cancel(deadline.reminder_id);
                refresh();
              }}
            />
            <View style={styles.rowBody}>
              <Text style={[styles.rowTitle, deadline.done ? styles.struck : null]}>
                {deadline.title}
              </Text>
              <Text style={styles.rowMeta}>
                {deadline.kind} {'·'} {formatDueDate(deadline.due_at)}
              </Text>
            </View>
          </View>
        </Card>
      ))}

      {deadlines.length === 0 && !loading && !adding ? (
        <EmptyState
          icon="alarm-outline"
          title="Nothing due"
          body="Add an assignment, quiz or exam for this subject."
        />
      ) : null}

      {adding ? (
        <AddDeadlineForm
          subjectId={subjectId}
          onAdded={() => {
            setAdding(false);
            refresh();
          }}
          onCancel={() => setAdding(false)}
        />
      ) : (
        <Button
          label="Add deadline"
          icon="add"
          variant="quiet"
          onPress={() => setAdding(true)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  segments: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    padding: 4,
    marginBottom: spacing.lg,
    ...shadow,
  },
  segment: {
    flex: 1,
    minWidth: 0,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  segmentLabel: { fontSize: 14, fontWeight: '600', color: colors.muted },
  segmentActive: { color: colors.onInk },
  slots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  slot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadow,
  },
  slotDay: { fontSize: 12, fontWeight: '800' },
  slotTime: { fontSize: 12, color: colors.muted, fontWeight: '500' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowBody: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: 15, fontWeight: '600', color: colors.ink },
  rowMeta: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
    textTransform: 'capitalize',
    fontWeight: '500',
  },
  struck: { textDecorationLine: 'line-through', color: colors.faint },
  composer: { gap: spacing.md, marginTop: spacing.sm },
});
