import { type ReactNode, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { addToCalendar, addToReminders } from '@/lib/nativeExport';
import { Button, IconButton } from '@/ui';
import { colors, spacing } from '@/theme';

/**
 * The per-item "put this in my calendar" control, for deadline and reminder
 * rows.
 *
 * Returned as two pieces rather than one component because they belong in
 * two places: the trigger sits in the row beside the delete button, and the
 * panel has to open underneath it. A single component could not do both
 * without the panel being squeezed into the flex row beside the title.
 *
 * The two destinations are buttons in the row rather than a native dialog on
 * purpose. `Alert.alert` is a no-op on react-native-web, so a dialog would
 * put this whole feature beyond the reach of the smoke suite — which has
 * already been caught out by exactly that, twice.
 */
export function useExportActions({
  title,
  dueAt,
  notes,
}: {
  title: string;
  dueAt: number;
  notes?: string;
}): { trigger: ReactNode; panel: ReactNode } {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);

  async function run(fn: typeof addToCalendar) {
    if (busy) return;
    setBusy(true);
    setStatus(null);
    const result = await fn(title, dueAt, notes);
    setStatus(result);
    setBusy(false);
    // A failure keeps the panel open so the reason can be read. A success
    // closes it: the row has said what it needed to.
    if (result.ok) setOpen(false);
  }

  const trigger = (
    <IconButton
      icon={open ? 'close-outline' : 'calendar-outline'}
      label={open ? `Hide export options for ${title}` : `Add ${title} to calendar`}
      color={colors.muted}
      onPress={() => {
        setOpen(!open);
        setStatus(null);
      }}
    />
  );

  const panel =
    open || status?.ok ? (
      <View style={styles.panel}>
        {open ? (
          <>
            <Button
              label="Add to calendar"
              icon="calendar-outline"
              variant="quiet"
              disabled={busy}
              onPress={() => void run(addToCalendar)}
            />
            <Button
              label="Add to Reminders"
              icon="checkbox-outline"
              variant="quiet"
              disabled={busy}
              onPress={() => void run(addToReminders)}
            />
          </>
        ) : null}
        {status ? (
          <Text style={status.ok ? styles.done : styles.failed}>{status.message}</Text>
        ) : null}
      </View>
    ) : null;

  return { trigger, panel };
}

const styles = StyleSheet.create({
  panel: { marginTop: spacing.md, gap: spacing.sm },
  failed: { fontSize: 12, color: colors.warning, fontWeight: '600', lineHeight: 17 },
  done: { fontSize: 12, color: colors.muted, fontWeight: '600' },
});
