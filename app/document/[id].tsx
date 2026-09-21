import { Stack, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  Button,
  Card,
  EmptyState,
  Field,
  IconButton,
  Loading,
  ScreenTitle,
  SectionHeader,
} from '@/ui';
import {
  createChapter,
  deleteChapter,
  getDocument,
  listChapters,
} from '@/db/documents';
import { formatBytes } from '@/lib/files';
import { useQuery } from '@/lib/useQuery';
import { colors, radius, spacing } from '@/theme';

/**
 * "allows you to divide the chapters and content".
 *
 * v1 divides by hand: the student names the chapters they care about. The
 * concept spec (open question 2) leaves automatic parsing of the file for
 * later, since it is by far the largest piece of work in the project.
 */
export default function DocumentScreen() {
  const db = useSQLiteContext();
  const params = useLocalSearchParams<{ id: string }>();
  const documentId = Number(params.id);

  const doc = useQuery((database) => getDocument(database, documentId));
  const chapters = useQuery((database) => listChapters(database, documentId));
  const [title, setTitle] = useState('');

  async function onAdd() {
    if (!title.trim()) return;
    await createChapter(db, documentId, title);
    setTitle('');
    chapters.refresh();
  }

  if (doc.loading && !doc.data) {
    return <Loading />;
  }
  if (!doc.data) {
    return (
      <EmptyState
        icon="alert-circle-outline"
        title="Document not found"
        body="It may have been deleted from its subject."
      />
    );
  }

  const rows = chapters.data ?? [];

  return (
    <>
      <Stack.Screen options={{ title: doc.data.subject_name }} />
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenTitle
          title={doc.data.name}
          subtitle={[doc.data.mime, formatBytes(doc.data.size)]
            .filter(Boolean)
            .join(' · ')}
        />

        <SectionHeader>Chapters</SectionHeader>

        {rows.map((chapter, index) => (
          <Card key={chapter.id}>
            <View style={styles.row}>
              <Text style={styles.index}>{index + 1}</Text>
              <Text style={styles.rowTitle}>{chapter.title}</Text>
              <IconButton
                icon="trash-outline"
                label={`Delete ${chapter.title}`}
                onPress={async () => {
                  await deleteChapter(db, chapter.id);
                  chapters.refresh();
                }}
              />
            </View>
          </Card>
        ))}

        {rows.length === 0 && !chapters.loading ? (
          <EmptyState
            icon="list-outline"
            title="Not divided yet"
            body="Break the document into the chapters you actually revise from."
          />
        ) : null}

        <View style={styles.composer}>
          <Field
            value={title}
            onChangeText={setTitle}
            placeholder="Chapter name"
            returnKeyType="done"
            onSubmitEditing={onAdd}
          />
          <Button
            label="Add chapter"
            icon="add"
            onPress={onAdd}
            disabled={!title.trim()}
            variant="quiet"
          />
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  index: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.ink,
    backgroundColor: colors.lime,
    borderRadius: radius.pill,
    width: 24,
    height: 24,
    lineHeight: 24,
    textAlign: 'center',
    overflow: 'hidden',
  },
  rowTitle: { flex: 1, minWidth: 0, fontSize: 15, color: colors.ink, fontWeight: '600' },
  composer: { gap: spacing.md, marginTop: spacing.lg },
});
