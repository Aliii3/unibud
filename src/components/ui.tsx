import { Ionicons } from '@expo/vector-icons';
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

import { colors, radius, spacing } from '../theme';

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

export function SectionHeader({ children }: { children: ReactNode }) {
  return <Text style={styles.sectionHeader}>{children}</Text>;
}

export function Card({
  children,
  onPress,
  accent,
}: {
  children: ReactNode;
  onPress?: () => void;
  accent?: string;
}) {
  const content = (
    <View style={[styles.card, accent ? { borderLeftColor: accent, borderLeftWidth: 3 } : null]}>
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
      <Ionicons name={icon} size={34} color={colors.faint} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
    </View>
  );
}

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
  variant?: 'primary' | 'quiet' | 'danger';
  disabled?: boolean;
}) {
  const tint =
    variant === 'primary'
      ? colors.surface
      : variant === 'danger'
        ? colors.danger
        : colors.accent;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' ? styles.buttonPrimary : styles.buttonQuiet,
        disabled ? styles.buttonDisabled : null,
        pressed ? styles.pressed : null,
      ]}
    >
      {icon ? <Ionicons name={icon} size={16} color={tint} /> : null}
      <Text style={[styles.buttonLabel, { color: tint }]}>{label}</Text>
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

export function Pill({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.pill, { backgroundColor: `${color}1A` }]}>
      <Text style={[styles.pillLabel, { color }]}>{label}</Text>
    </View>
  );
}

export function Loading() {
  return (
    <View style={styles.empty}>
      <ActivityIndicator color={colors.accent} />
    </View>
  );
}

export function IconButton({
  icon,
  onPress,
  color = colors.muted,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  color?: string;
  label: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={10}
      onPress={onPress}
      style={({ pressed }) => (pressed ? styles.pressed : null)}
    >
      <Ionicons name={icon} size={20} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  titleText: { flex: 1 },
  title: { fontSize: 28, fontWeight: '700', color: colors.ink },
  subtitle: { fontSize: 14, color: colors.muted, marginTop: 2 },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.faint,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  pressed: { opacity: 0.6 },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.xs },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.ink,
    marginTop: spacing.sm,
  },
  emptyBody: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.sm,
  },
  buttonPrimary: { backgroundColor: colors.accent },
  buttonQuiet: { backgroundColor: colors.accentSoft },
  buttonDisabled: { opacity: 0.45 },
  buttonLabel: { fontSize: 15, fontWeight: '600' },
  field: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 15,
    color: colors.ink,
  },
  pill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
  pillLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
});
