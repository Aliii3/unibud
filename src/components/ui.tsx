import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type StyleProp,
  type TextInputProps,
  View,
  type ViewStyle,
} from 'react-native';

import {
  border,
  colors,
  lighten,
  offset as offsets,
  onSubject,
  pale,
  radius,
  spacing,
  type,
} from '../theme';

/**
 * The one raised surface in the app: an outlined face sitting on a solid
 * rectangle offset down and right.
 *
 * React Native cannot draw a hard shadow portably — iOS could with
 * shadowRadius 0, but Android's elevation always blurs — so the shadow is a
 * real View behind the face. The face stays in normal flow, so layout is
 * unaffected and only the drawn depth extends past the box.
 */
export function Surface({
  children,
  style,
  faceStyle,
  fill = colors.surface,
  r = radius.md,
  depth = offsets.md,
  shadowColor = colors.ink,
}: {
  children?: ReactNode;
  /** Layout for the whole surface. Margins belong here, not on the face:
   *  the shadow is measured against the wrapper, so a margin on the face
   *  would pad the wrapper and thicken the drawn shadow by that much. */
  style?: StyleProp<ViewStyle>;
  faceStyle?: StyleProp<ViewStyle>;
  fill?: string;
  r?: number;
  depth?: number;
  shadowColor?: string;
}) {
  return (
    <View style={[styles.surfaceWrap, style]}>
      <View
        pointerEvents="none"
        style={[
          styles.surfaceShadow,
          { left: depth, top: depth, right: -depth, bottom: -depth },
          { backgroundColor: shadowColor, borderRadius: r },
        ]}
      />
      <View
        style={[
          styles.surfaceFace,
          { backgroundColor: fill, borderRadius: r },
          faceStyle,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

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
        {accent ? (
          <View style={[styles.cardAccent, { backgroundColor: accent }]} />
        ) : null}
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
 * The hero panel: one headline number on a saturated block, with a lime
 * action square, as in the reference's collection header.
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
    <Surface fill={colors.blue} r={radius.lg} style={styles.heroSpacing}>
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <Text style={styles.heroLabel}>{label}</Text>
          {onPress ? (
            <View style={styles.heroSquare}>
              <Ionicons name="arrow-forward" size={18} color={colors.ink} />
            </View>
          ) : null}
        </View>
        <Text style={styles.heroValue}>{value}</Text>
        {caption ? <Text style={styles.heroCaption}>{caption}</Text> : null}
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
 * A squared, outlined button on a solid offset shadow. The primary variant
 * is black with a lime action square, the reference's main call to action.
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
  const fill = disabled
    ? colors.inset
    : variant === 'primary'
      ? colors.ink
      : variant === 'lime'
        ? colors.lime
        : colors.surface;
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
      style={({ pressed }) => (pressed ? styles.pressed : null)}
    >
      <Surface
        fill={fill}
        r={radius.md}
        depth={disabled ? 0 : offsets.sm}
        style={styles.buttonSpacing}
      >
        <View style={styles.button}>
          {icon ? <Ionicons name={icon} size={18} color={tint} /> : null}
          <Text style={[styles.buttonLabel, { color: tint }]}>{label}</Text>
          {variant === 'primary' && !disabled ? (
            <View style={styles.buttonSquare}>
              <Ionicons name="arrow-forward" size={14} color={colors.ink} />
            </View>
          ) : null}
        </View>
      </Surface>
    </Pressable>
  );
}

export function Field(props: TextInputProps) {
  return (
    <Surface r={radius.md} depth={offsets.sm} style={styles.fieldSpacing}>
      <TextInput
        placeholderTextColor={colors.faint}
        {...props}
        style={[styles.field, props.style]}
      />
    </Surface>
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
      style={({ pressed }) => (pressed ? styles.pressed : null)}
    >
      <Surface
        fill={selected ? color : colors.surface}
        r={radius.sm}
        depth={selected ? offsets.sm : 0}
      >
        <View style={styles.chip}>
          <Text
            style={[
              styles.chipLabel,
              selected ? { color: onSubject(color), fontWeight: '800' } : null,
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
        </View>
      </Surface>
    </Pressable>
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
  /** Draws the icon as an outlined square, as in the reference's header. */
  surface?: boolean;
}) {
  const glyph = <Ionicons name={icon} size={surface ? 20 : 20} color={color} />;
  if (!surface) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        hitSlop={10}
        onPress={onPress}
        style={({ pressed }) => (pressed ? styles.pressed : null)}
      >
        {glyph}
      </Pressable>
    );
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => (pressed ? styles.pressed : null)}
    >
      <Surface r={radius.sm} depth={offsets.sm}>
        <View style={styles.iconSurface}>{glyph}</View>
      </Surface>
    </Pressable>
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

/** Top bar of outlined square controls, as in the reference's header. */
export function ScreenHeader({
  left,
  right,
}: {
  left?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerSide}>{left}</View>
      <View style={styles.headerSide}>{right}</View>
    </View>
  );
}

/**
 * An always-visible input with a square action button beside it, mirroring
 * the reference's paste-to-save row.
 */
export function AddRow({
  value,
  onChangeText,
  placeholder,
  onSubmit,
  icon = 'add',
  disabled,
}: {
  value: string;
  onChangeText: (next: string) => void;
  placeholder: string;
  onSubmit: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
}) {
  return (
    <View style={styles.addRow}>
      <View style={styles.addFieldWrap}>
        <Surface r={radius.md} depth={offsets.sm}>
          <View style={styles.addField}>
            <Text style={styles.addHash}>#</Text>
            <TextInput
              value={value}
              onChangeText={onChangeText}
              placeholder={placeholder}
              placeholderTextColor={colors.faint}
              returnKeyType="done"
              onSubmitEditing={onSubmit}
              style={styles.addInput}
            />
          </View>
        </Surface>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={placeholder}
        disabled={disabled}
        onPress={onSubmit}
        style={({ pressed }) => (pressed ? styles.pressed : null)}
      >
        <Surface
          fill={disabled ? pale(colors.lime) : colors.lime}
          r={radius.md}
          depth={disabled ? 0 : offsets.sm}
        >
          <View style={styles.addButton}>
            <Ionicons name={icon} size={26} color={colors.ink} />
          </View>
        </Surface>
      </Pressable>
    </View>
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
  titleText: { flex: 1, minWidth: 0 },
  title: { ...type.display, color: colors.ink },
  subtitle: { fontSize: 14, color: colors.muted, marginTop: 4, fontWeight: '500' },

  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionHeader: { ...type.h2, color: colors.ink },

  cardSpacing: { marginBottom: spacing.md },
  cardPadded: { padding: spacing.lg },
  cardAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 6 },

  heroSpacing: { marginBottom: spacing.md },
  hero: { padding: spacing.xl },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroLabel: {
    color: colors.onInk,
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    minWidth: 0,
  },
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
  heroValue: {
    color: colors.onInk,
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: -2,
    marginTop: spacing.md,
  },
  heroCaption: { color: colors.onInk, fontSize: 13, marginTop: 2, fontWeight: '600' },

  tileWrap: { flex: 1, minWidth: 0 },
  tile: { padding: spacing.lg },
  tileValue: { ...type.title, color: colors.ink },
  tileLabel: { fontSize: 12, color: colors.muted, marginTop: 4, fontWeight: '600' },

  buttonSpacing: {},
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  buttonLabel: { fontSize: 15, fontWeight: '800', letterSpacing: -0.2 },
  buttonSquare: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xs,
  },

  fieldSpacing: {},
  field: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    fontSize: 15,
    color: colors.ink,
  },

  chip: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm + 2, maxWidth: 170 },
  chipLabel: { fontSize: 13, color: colors.muted, fontWeight: '700' },

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

  iconSurface: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  iconTile: { alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  headerSide: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },

  addRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
    alignItems: 'stretch',
  },
  addFieldWrap: { flex: 1, minWidth: 0 },
  addField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  addHash: { fontSize: 20, fontWeight: '800', color: colors.ink },
  addInput: { flex: 1, minWidth: 0, fontSize: 15, color: colors.ink },
  addButton: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },

  surfaceWrap: { position: 'relative' },
  surfaceShadow: { position: 'absolute' },
  surfaceFace: {
    borderWidth: border.width,
    borderColor: border.color,
    overflow: 'hidden',
  },

  pressed: { opacity: 0.6 },
});
