import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';

import { colors, onSubject, radius, shadow, spacing, type } from '../theme';

/** Big, tight headline. The subtitle sits under it in muted grey. */
export function ScreenTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.titleRow}>
      <View style={styles.titleText}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {action}
    </View>
  );
}

export function SectionHeader({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionHeader}>{children}</Text>
      {action}
    </View>
  );
}

export function Card({
  children,
  onPress,
  accent,
  padded = true,
}: {
  children: ReactNode;
  onPress?: () => void;
  accent?: string;
  padded?: boolean;
}) {
  const content = (
    <View style={[styles.card, padded ? styles.cardPadded : null]}>
      {accent ? <View style={[styles.cardAccent, { backgroundColor: accent }]} /> : null}
      {children}
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => (pressed ? styles.pressed : null)}>
      {content}
    </Pressable>
  );
}

/**
 * The blue hero panel: one headline number with a lime action circle, as in
 * the reference's "number of tasks performed" card.
 */
export function HeroStat({
  value,
  label,
  caption,
  onPress,
}: {
  value: string;
  label: string;
  caption?: string;
  onPress?: () => void;
}) {
  const body = (
    <LinearGradient
      colors={[colors.blue, colors.blueDeep]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.hero}
    >
      <View style={styles.heroTop}>
        <Text style={styles.heroLabel}>{label}</Text>
        {onPress ? (
          <View style={styles.heroCircle}>
            <Ionicons name="arrow-forward" size={16} color={colors.ink} />
          </View>
        ) : null}
      </View>
      <Text style={styles.heroValue}>{value}</Text>
      {caption ? <Text style={styles.heroCaption}>{caption}</Text> : null}
    </LinearGradient>
  );
  if (!onPress) return body;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => (pressed ? styles.pressed : null)}>
      {body}
    </Pressable>
  );
}

/** Small stat tile. `tone` picks the surface: lavender, lime or plain. */
export function StatTile({
  value,
  label,
  tone = 'plain',
}: {
  value: string;
  label: string;
  tone?: 'plain' | 'lavender' | 'lime';
}) {
  const bg =
    tone === 'lavender' ? colors.lavender : tone === 'lime' ? colors.lime : colors.surface;
  return (
    <View style={[styles.tile, { backgroundColor: bg }]}>
      <Text style={styles.tileValue}>{value}</Text>
      <Text style={styles.tileLabel} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

/**
 * Black pill button. The primary variant carries a lime circle on the right,
 * which is the reference's main call to action.
 */
export function Button({
  label,
  onPress,
  icon,
  variant = 'primary',
  disabled,
}: {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: 'primary' | 'quiet' | 'lime' | 'danger';
  disabled?: boolean;
}) {
  // A disabled button gets its own flat surface rather than a dimmed fill,
  // which on the black pill read as an active grey button.
  const tint = disabled
    ? colors.faint
    : variant === 'primary'
      ? colors.onInk
      : variant === 'danger'
        ? colors.danger
        : colors.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        disabled
          ? styles.buttonDisabled
          : variant === 'primary'
            ? styles.buttonPrimary
            : variant === 'lime'
              ? styles.buttonLime
              : styles.buttonQuiet,
        pressed ? styles.pressed : null,
      ]}
    >
      {icon ? <Ionicons name={icon} size={17} color={tint} /> : null}
      <Text style={[styles.buttonLabel, { color: tint }]}>{label}</Text>
      {variant === 'primary' && !disabled ? (
        <View style={styles.buttonCircle}>
          <Ionicons name="arrow-forward" size={14} color={colors.ink} />
        </View>
      ) : null}
    </Pressable>
  );
}

export function Field(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={colors.faint}
      {...props}
      style={[styles.field, props.style]}
    />
  );
}

/** Selectable chip. Selected chips fill with `color` and flip their text. */
export function Chip({
  label,
  selected,
  onPress,
  color = colors.ink,
  role = 'button',
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  color?: string;
  role?: 'button' | 'tab';
}) {
  return (
    <Pressable
      accessibilityRole={role}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.chip,
        selected ? { backgroundColor: color, borderColor: color } : null,
      ]}
    >
      <Text
        style={[
          styles.chipLabel,
          selected ? { color: onSubject(color), fontWeight: '700' } : null,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** Static badge, e.g. a deadline's kind. */
export function Pill({
  label,
  color = colors.lime,
  dark,
}: {
  label: string;
  color?: string;
  dark?: boolean;
}) {
  return (
    <View style={[styles.pill, { backgroundColor: dark ? colors.ink : color }]}>
      <Text style={[styles.pillLabel, { color: dark ? colors.lime : colors.ink }]}>
        {label}
      </Text>
    </View>
  );
}

/** Legend dot used under the calendar-style lists. */
export function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legend}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  body,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
}) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={24} color={colors.ink} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
    </View>
  );
}

export function Loading() {
  return (
    <View style={styles.empty}>
      <ActivityIndicator color={colors.blue} />
    </View>
  );
}

export function IconButton({
  icon,
  onPress,
  color = colors.ink,
  label,
  surface,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  color?: string;
  label: string;
  /** Draws the icon on a round surface, as in the reference's header controls. */
  surface?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={10}
      onPress={onPress}
      style={({ pressed }) => [
        surface ? styles.iconSurface : null,
        pressed ? styles.pressed : null,
      ]}
    >
      <Ionicons name={icon} size={surface ? 18 : 20} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  titleText: { flex: 1 },
  title: { ...type.display, color: colors.ink },
  subtitle: { fontSize: 14, color: colors.muted, marginTop: 4 },

  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionHeader: { ...type.h2, color: colors.ink },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadow,
  },
  cardPadded: { padding: spacing.lg },
  cardAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },

  hero: {
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.md,
    ...shadow,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroLabel: {
    color: colors.onInk,
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.85,
    flex: 1,
  },
  heroCircle: {
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    backgroundColor: colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroValue: {
    color: colors.onInk,
    fontSize: 46,
    fontWeight: '800',
    letterSpacing: -1.5,
    marginTop: spacing.md,
  },
  heroCaption: { color: colors.onInk, opacity: 0.8, fontSize: 13, marginTop: 2 },

  tile: {
    flex: 1,
    minWidth: 0,
    borderRadius: radius.md,
    padding: spacing.lg,
    ...shadow,
  },
  tileValue: { ...type.title, color: colors.ink },
  tileLabel: { fontSize: 12, color: colors.muted, marginTop: 4, fontWeight: '500' },

  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
  },
  buttonPrimary: { backgroundColor: colors.ink },
  buttonLime: { backgroundColor: colors.lime },
  buttonQuiet: { backgroundColor: colors.surface, ...shadow },
  buttonDisabled: { backgroundColor: '#E9E9EF' },
  buttonLabel: { fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },
  buttonCircle: {
    width: 26,
    height: 26,
    borderRadius: radius.pill,
    backgroundColor: colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xs,
  },

  // A tinted inset rather than a raised surface, so inputs read the same on
  // the canvas and inside a white card.
  field: {
    backgroundColor: '#F1F1F5',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    fontSize: 15,
    color: colors.ink,
  },

  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    maxWidth: 170,
  },
  chipLabel: { fontSize: 13, color: colors.muted, fontWeight: '600' },

  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  pillLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase' },

  legend: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  legendDot: { width: 8, height: 8, borderRadius: radius.pill },
  legendLabel: { fontSize: 12, color: colors.muted, fontWeight: '500' },

  empty: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.xs },
  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.lavender,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emptyTitle: { ...type.h2, color: colors.ink },
  emptyBody: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    lineHeight: 20,
  },

  iconSurface: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
  pressed: { opacity: 0.6 },
});
