import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Button,
  Card,
  EmptyState,
  IconButton,
  Loading,
  ScreenTitle,
} from '@/components/ui';
import { deleteDocument, listDocuments, type DocSummary } from '@/db/documents';
import { listSubjects, type SubjectSummary } from '@/db/subjects';
import type { WithSubject } from '@/db/types';
import { formatBytes } from '@/lib/files';
import { pickDocumentForSubject } from '@/lib/pickDocument';
import { useQuery } from '@/lib/useQuery';
import { colors, radius, spacing } from '@/theme';

/** The "doc" tab: every uploaded document, newest first. */
export default function DocsScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { data, loading, refresh } = useQuery(listDocuments);
  const [subjects, setSubjects] = useState<SubjectSummary[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    listSubjects(db).then(setSubjects);
  }, [db, data]);

  const documents = data ?? [];

  async function onUpload() {
    if (subjects.length === 0) return;
    if (subjects.length === 1) {
      await upload(subjects[0].id);
      return;
    }
    // More than one subject, so ask which folder the file belongs in.
    Alert.alert(
      'Add to which subject?',
      undefined,
      [
        ...subjects.slice(0, 8).map((s) => ({
          text: s.name,
          onPress: () => {
            void upload(s.id);
          },
        })),
        { text: 'Cancel', style: 'cancel' as const },
      ],
      { cancelable: true }
    );
  }

  async function upload(subjectId: number) {
    setBusy(true);
    try {
      if (await pickDocumentForSubject(db, subjectId)) {
        refresh();
      }
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
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenTitle title="Documents" subtitle="Files kept on this device" />

        {subjects.length > 0 ? (
          <Button
            label={busy ? 'Adding…' : 'Upload document'}
            icon="cloud-upload-outline"
            onPress={onUpload}
            disabled={busy}
            variant={documents.length === 0 ? 'primary' : 'quiet'}
          />
        ) : null}

        {loading && documents.length === 0 ? <Loading /> : null}

        <View style={styles.list}>
          {documents.map((doc) => (
            <DocRow
              key={doc.id}
              doc={doc}
              onOpen={() => router.push(`/document/${doc.id}`)}
              onDelete={async () => {
                await deleteDocument(db, doc.id);
                refresh();
              }}
            />
          ))}
        </View>

        {!loading && documents.length === 0 ? (
          <EmptyState
            icon={subjects.length === 0 ? 'folder-open-outline' : 'document-text-outline'}
            title={subjects.length === 0 ? 'Add a subject first' : 'No documents yet'}
            body={
              subjects.length === 0
                ? 'Documents are filed under a subject, so create one on Home first.'
                : 'Upload lecture notes or slides, then divide them into chapters.'
            }
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function DocRow({
  doc,
  onOpen,
  onDelete,
}: {
  doc: WithSubject<DocSummary>;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const meta = [
    doc.subject_name,
    formatBytes(doc.size),
    doc.chapters > 0
      ? `${doc.chapters} chapter${doc.chapters === 1 ? '' : 's'}`
      : 'No chapters',
  ].filter(Boolean);

  return (
    <Card accent={doc.subject_color} onPress={onOpen}>
      <View style={styles.row}>
        <View style={[styles.badge, { backgroundColor: `${doc.subject_color}1A` }]}>
          <Text style={[styles.badgeText, { color: doc.subject_color }]}>
            {extensionOf(doc.name)}
          </Text>
        </View>
        <View style={styles.rowBody}>
          <Text style={styles.rowTitle} numberOfLines={1}>
            {doc.name}
          </Text>
          <Text style={styles.rowMeta}>{meta.join(' · ')}</Text>
        </View>
        <IconButton
          icon="trash-outline"
          label={`Delete ${doc.name}`}
          onPress={onDelete}
        />
      </View>
    </Card>
  );
}

function extensionOf(name: string): string {
  const dot = name.lastIndexOf('.');
  if (dot < 0 || dot === name.length - 1) return 'FILE';
  return name.slice(dot + 1).toUpperCase().slice(0, 4);
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  list: { marginTop: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowBody: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '600', color: colors.ink },
  rowMeta: { fontSize: 12, color: colors.muted, marginTop: 2 },
  badge: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
});
