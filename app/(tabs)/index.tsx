import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AddRow,
  EmptyState,
  HeroStat,
  IconButton,
  IconTile,
  Loading,
  Pill,
  ScreenHeader,
  ScreenTitle,
  SectionHeader,
  Surface,
} from '@/components/ui';
import { createSubject, listSubjects, type SubjectSummary } from '@/db/subjects';
import { useQuery } from '@/lib/useQuery';
import { border, colors, offset as offsets, radius, spacing, type } from '@/theme';

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
  const newestId = subjects.reduce<number | null>(
    (best, s) =>
      best == null || s.created_at > (subjects.find((x) => x.id === best)?.created_at ?? 0)
        ? s.id
        : best,
    null
  );

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
      />
    </SafeAreaView>
  );
}

/** How long the newest subject keeps its NEW badge. */
const NEW_FOR_MS = 24 * 60 * 60 * 1000;

/**
 * A folder: a coloured tab tucked behind an outlined body, with the icon
 * tile and counts up top and the subject name along the bottom.
 */
function FolderCard({
  subject,
  isNewest,
  onPress,
}: {
  subject: SubjectSummary;
  isNewest: boolean;
  onPress: () => void;
}) {
  const counts: string[] = [];
  if (subject.open_deadlines > 0) counts.push(`${subject.open_deadlines} due`);
  if (subject.open_todos > 0) counts.push(`${subject.open_todos} to do`);
  if (subject.documents > 0) {
    counts.push(`${subject.documents} doc${subject.documents === 1 ? '' : 's'}`);
  }
  const isNew = isNewest && Date.now() - subject.created_at < NEW_FOR_MS;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.folder, pressed ? styles.pressed : null]}
    >
      <View style={[styles.folderTab, { backgroundColor: subject.color }]} />
      <Surface r={radius.md} depth={offsets.md} style={styles.folderFace}>
        <View style={styles.folderBody}>
          <View style={styles.folderTop}>
            <IconTile
              icon={subject.icon as keyof typeof Ionicons.glyphMap}
              color={subject.color}
              size={46}
            />
            <View style={styles.folderCounts}>
              {counts.length > 0 ? (
                counts.slice(0, 2).map((c) => (
                  <Text key={c} style={styles.folderCount} numberOfLines={1}>
                    {c}
                  </Text>
                ))
              ) : (
                <Text style={styles.folderCount}>Empty</Text>
              )}
              {isNew ? (
                <View style={styles.folderBadge}>
                  <Pill label="New" color={colors.pink} />
                </View>
              ) : null}
            </View>
          </View>
          <Text style={styles.folderName} numberOfLines={2}>
            {subject.name}
          </Text>
        </View>
      </Surface>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  column: { gap: spacing.lg },
  count: { ...type.h2, color: colors.muted },

  folder: { flex: 1, minWidth: 0, marginBottom: spacing.lg },
  // The tab sits behind the card body, so only its top edge shows.
  folderTab: {
    width: '52%',
    height: 20,
    marginLeft: spacing.md,
    borderTopLeftRadius: radius.sm,
    borderTopRightRadius: radius.sm,
    borderWidth: border.width,
    borderBottomWidth: 0,
    borderColor: border.color,
  },
  folderFace: { marginTop: -2 },
  folderBody: { padding: spacing.lg, minHeight: 150, justifyContent: 'space-between' },
  folderTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  folderCounts: { flex: 1, minWidth: 0, paddingTop: 2 },
  folderCount: { fontSize: 12, color: colors.muted, fontWeight: '600' },
  folderBadge: { marginTop: spacing.xs },
  folderName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: -0.4,
    marginTop: spacing.lg,
  },
  pressed: { opacity: 0.6 },
});
