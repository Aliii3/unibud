import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { SubjectSummary } from '@/db/subjects';
import { border, colors, offset as offsets, radius, spacing } from '@/theme';
import { IconTile, MetaStat, Pill, Surface } from '@/ui';

/** How long the newest subject keeps its NEW badge. */
export const NEW_FOR_MS = 24 * 60 * 60 * 1000;

/**
 * A folder: a coloured tab tucked behind an outlined body. The icon and any
 * NEW badge sit on the top row, the name fills the middle, and the counts
 * run along the foot as icon-and-number stats — which reads at a glance and
 * uses the space the old single "3 docs · 1 due" line left empty.
 */
export function FolderCard({
  subject,
  isNewest,
  onPress,
}: {
  subject: SubjectSummary;
  isNewest: boolean;
  onPress: () => void;
}) {
  const isNew = isNewest && Date.now() - subject.created_at < NEW_FOR_MS;
  const empty =
    subject.documents === 0 && subject.open_todos === 0 && subject.open_deadlines === 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={subject.name}
      onPress={onPress}
      style={({ pressed }) => [styles.folder, pressed ? styles.pressed : null]}
    >
      <View style={[styles.tab, { backgroundColor: subject.color }]} />
      <Surface r={radius.md} depth={offsets.md} faceStyle={styles.face}>
        <View style={styles.body}>
          <View style={styles.top}>
            <IconTile
              icon={subject.icon as keyof typeof Ionicons.glyphMap}
              color={subject.color}
              size={42}
            />
            {isNew ? <Pill label="New" color={colors.pink} /> : null}
          </View>

          <Text style={styles.name} numberOfLines={2}>
            {subject.name}
          </Text>

          <View style={styles.foot}>
            {empty ? (
              <Text style={styles.emptyLabel}>Nothing yet</Text>
            ) : (
              <>
                {subject.documents > 0 ? (
                  <MetaStat icon="document-text" value={String(subject.documents)} />
                ) : null}
                {subject.open_todos > 0 ? (
                  <MetaStat icon="checkbox" value={String(subject.open_todos)} />
                ) : null}
                {subject.open_deadlines > 0 ? (
                  <MetaStat icon="alarm" value={String(subject.open_deadlines)} />
                ) : null}
              </>
            )}
          </View>
        </View>
      </Surface>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  folder: { flex: 1, minWidth: 0, marginBottom: spacing.lg },
  // The tab sits behind the card body, so only its top edge shows.
  tab: {
    width: '52%',
    height: 20,
    marginLeft: spacing.md,
    borderTopLeftRadius: radius.sm,
    borderTopRightRadius: radius.sm,
    borderWidth: border.width,
    borderBottomWidth: 0,
    borderColor: border.color,
  },
  face: { marginTop: -2 },
  body: { padding: spacing.lg, minHeight: 146 },
  top: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: -0.4,
    marginTop: spacing.md,
  },
  foot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.line + '18',
    paddingTop: spacing.sm,
  },
  emptyLabel: { fontSize: 12, color: colors.faint, fontWeight: '600' },
  pressed: { opacity: 0.6 },
});
