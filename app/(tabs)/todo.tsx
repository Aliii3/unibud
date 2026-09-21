import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Button,
  Card,
  Chip,
  EmptyState,
  Field,
  IconButton,
  Loading,
  ScreenTitle,
  SectionHeader,
  StatTile,
} from '@/components/ui';
import { listSubjects, type SubjectSummary } from '@/db/subjects';
import { createTodo, deleteTodo, listTodos, toggleTodo } from '@/db/todos';
import type { Todo, WithSubject } from '@/db/types';
import { useQuery } from '@/lib/useQuery';
import { border, colors, radius, spacing } from '@/theme';

/** The "todo" tab: tasks from every subject in one list. */
export default function TodoScreen() {
  const db = useSQLiteContext();
  const { data, loading, refresh } = useQuery(listTodos);
  const [subjects, setSubjects] = useState<SubjectSummary[]>([]);
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState<number | undefined>();

  useEffect(() => {
    listSubjects(db).then((rows) => {
      setSubjects(rows);
      setSubjectId((current) => current ?? rows[0]?.id);
    });
  }, [db, data]);

  const todos = data ?? [];
  const open = todos.filter((t) => t.done === 0);
  const done = todos.filter((t) => t.done === 1);

  async function onAdd() {
    if (!title.trim() || subjectId == null) return;
    await createTodo(db, { subject_id: subjectId, title });
    setTitle('');
    refresh();
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenTitle title={'Everything\non your plate.'} />

        {todos.length > 0 ? (
          <View style={styles.tiles}>
            <StatTile value={String(open.length)} label="Still to do" tone="lime" />
            <StatTile value={String(done.length)} label="Done" tone="lavender" />
          </View>
        ) : null}

        {subjects.length > 0 ? (
          <View style={styles.composer}>
            <Field
              value={title}
              onChangeText={setTitle}
              placeholder="Add a task"
              returnKeyType="done"
              onSubmitEditing={onAdd}
            />
            <View style={styles.chips}>
              {subjects.map((s) => (
                <Chip
                  key={s.id}
                  label={s.name}
                  color={s.color}
                  selected={subjectId === s.id}
                  onPress={() => setSubjectId(s.id)}
                />
              ))}
            </View>
            <Button label="Add task" icon="add" onPress={onAdd} disabled={!title.trim()} />
          </View>
        ) : null}

        {loading && todos.length === 0 ? <Loading /> : null}

        {open.length > 0 ? (
          <>
            <SectionHeader>Open</SectionHeader>
            {open.map((t) => (
              <TodoRow
                key={t.id}
                todo={t}
                onToggle={async () => {
                  await toggleTodo(db, t.id);
                  refresh();
                }}
                onDelete={async () => {
                  await deleteTodo(db, t.id);
                  refresh();
                }}
              />
            ))}
          </>
        ) : null}

        {done.length > 0 ? (
          <>
            <SectionHeader>Done</SectionHeader>
            {done.map((t) => (
              <TodoRow
                key={t.id}
                todo={t}
                onToggle={async () => {
                  await toggleTodo(db, t.id);
                  refresh();
                }}
                onDelete={async () => {
                  await deleteTodo(db, t.id);
                  refresh();
                }}
              />
            ))}
          </>
        ) : null}

        {!loading && todos.length === 0 ? (
          <EmptyState
            icon={subjects.length === 0 ? 'folder-open-outline' : 'checkbox-outline'}
            title={subjects.length === 0 ? 'Add a subject first' : 'Nothing to do'}
            body={
              subjects.length === 0
                ? 'Tasks belong to a subject, so create one on Home before adding tasks.'
                : 'Tasks you add show up on their subject as well as here.'
            }
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function TodoRow({
  todo,
  onToggle,
  onDelete,
}: {
  todo: WithSubject<Todo>;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const complete = todo.done === 1;
  return (
    <Card accent={todo.subject_color}>
      <View style={styles.row}>
        <IconButton
          icon={complete ? 'checkbox' : 'square-outline'}
          label={`${complete ? 'Reopen' : 'Complete'} ${todo.title}`}
          onPress={onToggle}
          color={complete ? colors.blue : colors.ink}
        />
        <View style={styles.rowBody}>
          <Text style={[styles.rowTitle, complete ? styles.struck : null]}>{todo.title}</Text>
          <Text style={styles.rowMeta}>{todo.subject_name}</Text>
        </View>
        <IconButton
          icon="trash-outline"
          label={`Delete ${todo.title}`}
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
  tiles: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  composer: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: border.width,
    borderColor: border.color,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowBody: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: 15, fontWeight: '600', color: colors.ink },
  rowMeta: { fontSize: 12, color: colors.muted, marginTop: 2, fontWeight: '500' },
  struck: { textDecorationLine: 'line-through', color: colors.faint },
});
