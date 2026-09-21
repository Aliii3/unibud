import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { createSubject, listSubjects, type SubjectSummary } from '@/db/subjects';
import { FolderCard } from '@/features/subjects/FolderCard';
import { useQuery } from '@/lib/useQuery';
import { colors, spacing, type } from '@/theme';
import {
  AddRow,
  EmptyState,
  HeroStat,
  IconButton,
  Loading,
  ScreenHeader,
  ScreenTitle,
  SectionHeader,
} from '@/ui';

/**
 * Home — the "subjects page" from the notes, drawn as a grid of folders.
 * Everything else in the app hangs off a subject, so this is the entry point.
 */
export default function HomeScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { data, loading, refresh } = useQuery(listSubjects);
  const [name, setName] = useState('');

  const subjects = data ?? [];
  const openDeadlines = subjects.reduce((n, s) => n + s.open_deadlines, 0);
  const openTodos = subjects.reduce((n, s) => n + s.open_todos, 0);

  // Only the single most recent subject wears the badge — marking every
  // subject added today turns it into wallpaper rather than a signal.
  const newestId = subjects.reduce<SubjectSummary | null>(
    (best, s) => (best == null || s.created_at > best.created_at ? s : best),
    null
  )?.id;

  // A lone item on the final row would stretch to full width, so pad to even.
  const grid: (SubjectSummary | null)[] =
    subjects.length % 2 === 1 ? [...subjects, null] : subjects;

  async function onAdd() {
    if (!name.trim()) return;
    await createSubject(db, name);
    setName('');
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
            <ScreenHeader
              left={
                <IconButton
                  icon="settings-outline"
                  label="Daily check-in"
                  surface
                  onPress={() => router.push('/settings')}
                />
              }
              right={
                <IconButton
                  icon="calendar-outline"
                  label="Schedule"
                  surface
                  onPress={() => router.push('/schedule')}
                />
              }
            />

            <ScreenTitle title={'Save now.\nFind anytime.'} />

            <AddRow
              value={name}
              onChangeText={setName}
              placeholder="Name a subject to add"
              onSubmit={onAdd}
              disabled={!name.trim()}
            />

            {subjects.length > 0 ? (
              <HeroStat
                tone={openDeadlines === 0 ? 'lime' : 'blue'}
                icon={openDeadlines === 0 ? 'checkmark-circle' : undefined}
                value={openDeadlines === 0 ? 'All clear' : String(openDeadlines)}
                label={openDeadlines === 0 ? 'Nothing due' : 'Due soon'}
                caption={
                  openTodos > 0
                    ? `${openTodos} task${openTodos === 1 ? '' : 's'} still open`
                    : 'No open tasks either'
                }
                onPress={() => router.push('/deadlines')}
              />
            ) : null}

            {subjects.length > 0 ? (
              <SectionHeader
                action={
                  <Text style={styles.count}>
                    {String(subjects.length).padStart(2, '0')}
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
              isNewest={item.id === newestId}
              onPress={() => router.push(`/subject/${item.id}`)}
            />
          ) : (
            <View style={styles.spacer} />
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
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  column: { gap: spacing.lg },
  count: { ...type.h2, color: colors.muted },
  spacer: { flex: 1, minWidth: 0 },
});
