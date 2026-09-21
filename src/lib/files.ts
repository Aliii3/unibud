import { Directory, File, Paths } from 'expo-file-system';

/**
 * Picked files arrive as cache or `content://` URIs that the OS is free to
 * reclaim, so every document is copied into app storage before we record it.
 */
const DOCUMENTS_DIRNAME = 'documents';

function documentsDirectory(): Directory {
  const dir = new Directory(Paths.document, DOCUMENTS_DIRNAME);
  if (!dir.exists) {
    dir.create({ intermediates: true, idempotent: true });
  }
  return dir;
}

/** Keeps the extension, strips anything that would be awkward in a path. */
function safeFileName(name: string): string {
  const cleaned = name.replace(/[^\w.\- ]+/g, '_').trim();
  return cleaned.length > 0 ? cleaned : 'document';
}

export interface StoredFile {
  uri: string;
  size: number | null;
}

/**
 * Copies a picked file into app storage under a name that will not collide
 * with an existing document, and returns its permanent URI.
 */
export async function storeDocument(
  sourceUri: string,
  displayName: string
): Promise<StoredFile> {
  const dir = documentsDirectory();
  const base = safeFileName(displayName);

  let target = new File(dir, base);
  if (target.exists) {
    const dot = base.lastIndexOf('.');
    const stem = dot > 0 ? base.slice(0, dot) : base;
    const ext = dot > 0 ? base.slice(dot) : '';
    target = new File(dir, `${stem}-${Date.now()}${ext}`);
  }

  await new File(sourceUri).copy(target);
  return { uri: target.uri, size: target.size ?? null };
}

/** Best-effort: a missing file should not stop the row being deleted. */
export function removeStoredDocument(uri: string): void {
  try {
    const file = new File(uri);
    if (file.exists) {
      file.delete();
    }
  } catch {
    // The file is already gone, or storage denied the delete. Either way the
    // database row is what the UI reads, and the caller is removing it next.
  }
}

export function formatBytes(bytes: number | null): string {
  if (bytes == null) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
