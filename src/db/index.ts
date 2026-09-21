import * as SQLite from 'expo-sqlite';

import { MIGRATIONS } from './schema';

export const DATABASE_NAME = 'unibud.db';

/**
 * Applies any migrations the database has not seen yet. Passed to
 * <SQLiteProvider onInit>, so it runs once before any screen queries.
 */
export async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');

  const row = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  );
  let version = row?.user_version ?? 0;

  for (let i = version; i < MIGRATIONS.length; i += 1) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(MIGRATIONS[i]);
    });
    version = i + 1;
    // PRAGMA does not accept bound parameters, and `version` is a loop counter.
    await db.execAsync(`PRAGMA user_version = ${version}`);
  }
}
