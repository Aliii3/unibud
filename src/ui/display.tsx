import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  border,
  colors,
  offset as offsets,
  onSubject,
  radius,
  spacing,
  type,
} from '@/theme';

import { Surface } from './Surface';

export function Card({
  children,
  onPress,
  accent,
  padded = true,
  fill,
}: {
  children: ReactNode;
  onPress?: () => void;
  accent?: string;
  padded?: boolean;
  fill?: string;
}) {
  const content = (
    <Surface fill={fill} r={radius.md} style={styles.cardSpacing}>
      <View style={padded ? styles.cardPadded : null}>
        {accent ? <View style={[styles.cardAccent, { backgroundColor: accent }]} /> : null}
        {children}
      </View>
    </Surface>
  );
  if (!onPress) return content;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => (pressed ? styles.pressed : null)}>
      {content}
    </Pressable>
  );
}

/**
 * The hero panel: one headline figure on a saturated block with a square
 * action. `tone` lets a screen show a settled state in lime rather than a
 * stark zero on blue.
 */
export function HeroStat({
  value,
  label,
  caption,
  onPress,
  tone = 'blue',
  icon,
}: {
  value: string;
  label: string;
  caption?: string;
  onPress?: () => void;
  tone?: 'blue' | 'lime';
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const onFill = tone === 'lime' ? colors.ink : colors.onInk;
  const body = (
    <Surface
      fill={tone === 'lime' ? colors.lime : colors.blue}
      r={radius.lg}
      style={styles.heroSpacing}
    >
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <Text style={[styles.heroLabel, { color: onFill }]}>{label}</Text>
          {onPress ? (
            <View
              style={[
                styles.heroSquare,
                tone === 'lime' ? { backgroundColor: colors.surface } : null,
              ]}
            >
              <Ionicons name="arrow-forward" size={18} color={colors.ink} />
            </View>
          ) : null}
        </View>
        <View style={styles.heroFigure}>
          {icon ? <Ionicons name={icon} size={38} color={onFill} /> : null}
          <Text style={[styles.heroValue, { color: onFill }]}>{value}</Text>
        </View>
        {caption ? (
          <Text style={[styles.heroCaption, { color: onFill }]}>{caption}</Text>
        ) : null}
      </View>
    </Surface>
  );
  if (!onPress) return body;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => (pressed ? styles.pressed : null)}>
      {body}
    </Pressable>
  );
}

/** Small stat tile. `tone` picks the fill. */
export function StatTile({
  value,
  label,
  tone = 'plain',
}: {
  value: string;
  label: string;
  tone?: 'plain' | 'lavender' | 'lime';
}) {
  const fill =
    tone === 'lavender' ? colors.lavender : tone === 'lime' ? colors.lime : colors.surface;
  return (
    <View style={styles.tileWrap}>
      <Surface fill={fill} r={radius.md} depth={offsets.sm}>
        <View style={styles.tile}>
          <Text style={styles.tileValue}>{value}</Text>
          <Text style={styles.tileLabel} numberOfLines={2}>
            {label}
          </Text>
        </View>
      </Surface>
    </View>
  );
}

/**
 * A squared, outlined tile carrying an icon on a flat colour — the mark used
 * on folder cards and document rows.
 */
export function IconTile({
  icon,
  color,
  size = 46,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  size?: number;
}) {
  return (
    <Surface fill={color} r={radius.sm} depth={0}>
      <View style={[styles.iconTile, { width: size, height: size }]}>
        <Ionicons name={icon} size={size * 0.5} color={onSubject(color)} />
      </View>
    </Surface>
  );
}

/** Static badge, e.g. a deadline's kind or a NEW marker. */
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

/** A small icon-and-number stat, used along the foot of a folder card. */
export function MetaStat({
  icon,
  value,
  muted,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  muted?: boolean;
}) {
  const tint = muted ? colors.faint : colors.ink;
  return (
    <View style={styles.metaStat}>
      <Ionicons name={icon} size={13} color={tint} />
      <Text style={[styles.metaValue, { color: tint }]}>{value}</Text>
    </View>
  );
}

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
      <Surface fill={colors.lavender} r={radius.md} depth={offsets.sm}>
        <View style={styles.emptyIcon}>
          <Ionicons name={icon} size={26} color={colors.ink} />
        </View>
      </Surface>
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

const styles = StyleSheet.create({
  cardSpacing: { marginBottom: spacing.lg },
  cardPadded: { padding: spacing.lg },
  cardAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 6 },

  heroSpacing: { marginBottom: spacing.md },
  hero: { padding: spacing.xl },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroLabel: { fontSize: 14, fontWeight: '700', flex: 1, minWidth: 0 },
  heroSquare: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.lime,
    borderWidth: border.width,
    borderColor: border.color,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroFigure: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  heroValue: { fontSize: 46, fontWeight: '800', letterSpacing: -2 },
  heroCaption: { fontSize: 13, marginTop: 2, fontWeight: '600' },

  tileWrap: { flex: 1, minWidth: 0 },
  tile: { padding: spacing.lg },
  tileValue: { ...type.title, color: colors.ink },
  tileLabel: { fontSize: 12, color: colors.muted, marginTop: 4, fontWeight: '600' },

  iconTile: { alignItems: 'center', justifyContent: 'center' },

  pill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: border.width,
    borderColor: border.color,
    alignSelf: 'flex-start',
  },
  pillLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },

  metaStat: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaValue: { fontSize: 12, fontWeight: '700' },

  legend: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: border.color,
  },
  legendLabel: { fontSize: 12, color: colors.muted, fontWeight: '600' },

  empty: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.sm },
  emptyIcon: { width: 60, height: 60, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { ...type.h2, color: colors.ink, marginTop: spacing.sm },
  emptyBody: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    lineHeight: 20,
    fontWeight: '500',
  },

  pressed: { opacity: 0.6 },
});
