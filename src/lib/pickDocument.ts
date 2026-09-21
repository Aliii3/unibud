import * as DocumentPicker from 'expo-document-picker';
import type * as SQLite from 'expo-sqlite';

import { createDocument } from '@/db/documents';

import { storeDocument } from './files';

/**
 * Picks a file and files it under a subject. Returns false when the student
 * backed out of the picker, so callers can skip a refresh.
 *
 * v1 accepts any file type — see open question 3 in the concept spec. Narrow
 * `type` here once the formats the app can actually display are decided.
 */
export async function pickDocumentForSubject(
  db: SQLite.SQLiteDatabase,
  subjectId: number
): Promise<boolean> {
  const result = await DocumentPicker.getDocumentAsync({
    type: '*/*',
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled) return false;

  const asset = result.assets[0];
  if (!asset) return false;

  const stored = await storeDocument(asset.uri, asset.name);
  await createDocument(db, {
    subject_id: subjectId,
    name: asset.name,
    uri: stored.uri,
    mime: asset.mimeType ?? null,
    size: stored.size ?? asset.size ?? null,
  });
  return true;
}
