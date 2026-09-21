import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, EmptyState, Field, Loading, ScreenTitle } from '@/components/ui';
import { createSubject, listSubjects, type SubjectSummary } from '@/db/subjects';
import { useQuery } from '@/lib/useQuery';
import { colors, radius, spacing } from '@/theme';

/**
 * Home — the "subjects page" from the notes: a grid of subject folders.
 * Every other screen hangs off a subject, so this is also where a new
 * student starts.
 */
export default function HomeScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { data, loading, refresh } = useQuery(listSubjects);
  const [name, setName] = useState('');
  const [adding, setAdding] = useState(false);

  const subjects = data ?? [];
  // FlatList gives a lone item on the final row the full width, which makes an
  // odd number of subjects render one double-width card. A spacer keeps the
  // grid square.
  const grid: (SubjectSummary | null)[] =
    subjects.length % 2 === 1 ? [...subjects, null] : subjects;

  async function onAdd() {
    const trimmed = name.trim();
    if (!trimmed) return;
    await createSubject(db, trimmed);
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
        columnWrapperStyle={subjects.length > 0 ? styles.column : undefined}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View>
            <ScreenTitle
              title="Subjects"
              subtitle={
                subjects.length === 0
                  ? undefined
                  : `${subjects.length} subject${subjects.length === 1 ? '' : 's'}`
              }
              action={
                <Link href="/schedule" asChild>
                  <Pressable accessibilityRole="button" hitSlop={10}>
                    <Ionicons name="calendar-outline" size={22} color={colors.accent} />
                  </Pressable>
                </Link>
              }
            />
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
                <Button label="Add" onPress={onAdd} disabled={!name.trim()} />
              </View>
            ) : null}
          </View>
        }
        renderItem={({ item }) =>
          item ? (
            <SubjectCard
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
              body="Add the subjects you are taking this term. Documents, to-dos and deadlines all live inside a subject."
            />
          )
        }
        ListFooterComponent={
          adding ? null : (
            <View style={styles.footer}>
              <Button
                label="Add subject"
                icon="add"
                onPress={() => setAdding(true)}
                variant={subjects.length === 0 ? 'primary' : 'quiet'}
              />
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

function SubjectCard({
  subject,
  onPress,
}: {
  subject: SubjectSummary;
  onPress: () => void;
}) {
  const badges: string[] = [];
  if (subject.open_deadlines > 0) badges.push(`${subject.open_deadlines} due`);
  if (subject.open_todos > 0) badges.push(`${subject.open_todos} to do`);
  if (subject.documents > 0) badges.push(`${subject.documents} doc`);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.folder, pressed ? styles.pressed : null]}
    >
      {/* The tab along the top is what makes the card read as a folder,
          matching the hand-drawn grid on page 3 of the notes. */}
      <View style={[styles.folderTab, { backgroundColor: subject.color }]} />
      <View style={styles.folderBody}>
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
  addRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  addField: { flex: 1 },
  footer: { marginTop: spacing.lg },
  folder: { flex: 1, marginBottom: spacing.md },
  folderTab: {
    width: '45%',
    height: 10,
    borderTopLeftRadius: radius.sm,
    borderTopRightRadius: radius.sm,
  },
  folderBody: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderTopLeftRadius: 0,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 84,
    justifyContent: 'space-between',
  },
  folderName: { fontSize: 15, fontWeight: '600', color: colors.ink },
  folderMeta: { fontSize: 12, color: colors.muted, marginTop: spacing.sm },
  pressed: { opacity: 0.6 },
});
