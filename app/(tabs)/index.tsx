import { Link, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Button,
  EmptyState,
  Field,
  HeroStat,
  IconButton,
  Loading,
  ScreenTitle,
  SectionHeader,
} from '@/components/ui';
import { createSubject, listSubjects, type SubjectSummary } from '@/db/subjects';
import { useQuery } from '@/lib/useQuery';
import { colors, onSubject, radius, shadow, spacing, type } from '@/theme';

/**
 * Home — the "subjects page" from the notes, drawn as a grid of folders.
 * Everything else in the app hangs off a subject, so this is the entry point.
 */
export default function HomeScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { data, loading, refresh } = useQuery(listSubjects);
  const [name, setName] = useState('');
  const [adding, setAdding] = useState(false);

  const subjects = data ?? [];
  const openDeadlines = subjects.reduce((n, s) => n + s.open_deadlines, 0);
  const openTodos = subjects.reduce((n, s) => n + s.open_todos, 0);

  // A lone item on the final row would stretch to full width, so pad to even.
  const grid: (SubjectSummary | null)[] =
    subjects.length % 2 === 1 ? [...subjects, null] : subjects;

  async function onAdd() {
    if (!name.trim()) return;
    await createSubject(db, name);
    setName('');
    setAdding(false);
    refresh();
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <FlatList
        data={grid}
        keyExtractor={(item, index) => (item ? String(item.id) : `spacer-${index}`)}
        numColumns={2}
        columnWrapperStyle={styles.column}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <ScreenTitle
              title={'Your subjects,\nall in one place.'}
              action={
                <Link href="/schedule" asChild>
                  <Pressable accessibilityRole="button">
                    <IconButton
                      icon="calendar-outline"
                      label="Schedule"
                      surface
                      onPress={() => router.push('/schedule')}
                    />
                  </Pressable>
                </Link>
              }
            />

            {subjects.length > 0 ? (
              <HeroStat
                value={String(openDeadlines)}
                label="Due soon"
                caption={
                  openTodos > 0
                    ? `${openTodos} task${openTodos === 1 ? '' : 's'} still open`
                    : 'No open tasks'
                }
                onPress={() => router.push('/deadlines')}
              />
            ) : null}

            {adding ? (
              <View style={styles.addRow}>
                <Field
                  autoFocus
                  value={name}
                  onChangeText={setName}
                  placeholder="Subject name"
                  returnKeyType="done"
                  onSubmitEditing={onAdd}
                  style={styles.addField}
                />
                <Button label="Add" onPress={onAdd} disabled={!name.trim()} variant="lime" />
              </View>
            ) : null}

            {subjects.length > 0 ? (
              <SectionHeader
                action={
                  <Text style={styles.count}>
                    ({String(subjects.length).padStart(2, '0')})
                  </Text>
                }
              >
                My subjects
              </SectionHeader>
            ) : null}
          </View>
        }
        renderItem={({ item }) =>
          item ? (
            <FolderCard
              subject={item}
              onPress={() => router.push(`/subject/${item.id}`)}
            />
          ) : (
            <View style={styles.folder} />
          )
        }
        ListEmptyComponent={
          loading ? (
            <Loading />
          ) : (
            <EmptyState
              icon="folder-open-outline"
              title="No subjects yet"
              body="Add what you are taking this term. Documents, to-dos and deadlines all live inside a subject."
            />
          )
        }
        ListFooterComponent={
          adding ? null : (
            <View style={styles.footer}>
              <Button label="Add subject" icon="add" onPress={() => setAdding(true)} />
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

/**
 * A folder: a coloured tab sitting behind a white body, so the grid reads as
 * a drawer of subjects rather than a list of tiles.
 */
function FolderCard({
  subject,
  onPress,
}: {
  subject: SubjectSummary;
  onPress: () => void;
}) {
  const badges: string[] = [];
  if (subject.open_deadlines > 0) badges.push(`${subject.open_deadlines} due`);
  if (subject.open_todos > 0) badges.push(`${subject.open_todos} to do`);
  if (subject.documents > 0) {
    badges.push(`${subject.documents} doc${subject.documents === 1 ? '' : 's'}`);
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.folder, pressed ? styles.pressed : null]}
    >
      <View style={[styles.folderTab, { backgroundColor: subject.color }]} />
      <View style={styles.folderBody}>
        <View style={[styles.folderMark, { backgroundColor: subject.color }]}>
          <Text style={[styles.folderInitial, { color: onSubject(subject.color) }]}>
            {subject.name.trim().charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.folderName} numberOfLines={2}>
          {subject.name}
        </Text>
        <Text style={styles.folderMeta} numberOfLines={1}>
          {badges.length > 0 ? badges.join(' · ') : 'Empty'}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  column: { gap: spacing.md },
  addRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  addField: { flex: 1, minWidth: 0 },
  count: { ...type.h2, color: colors.faint },
  footer: { marginTop: spacing.lg },

  folder: { flex: 1, minWidth: 0, marginBottom: spacing.md },
  folderTab: {
    width: '52%',
    height: 14,
    borderTopLeftRadius: radius.sm,
    borderTopRightRadius: radius.sm,
  },
  folderBody: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderTopLeftRadius: 0,
    padding: spacing.lg,
    minHeight: 132,
    justifyContent: 'flex-start',
    ...shadow,
  },
  folderMark: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  folderInitial: { fontSize: 17, fontWeight: '800' },
  folderName: { fontSize: 15, fontWeight: '700', color: colors.ink, letterSpacing: -0.2 },
  folderMeta: { fontSize: 12, color: colors.muted, marginTop: spacing.xs, fontWeight: '500' },
  pressed: { opacity: 0.6 },
});
