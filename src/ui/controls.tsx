import { Ionicons } from '@expo/vector-icons';
import {
  Pressable,
  type StyleProp,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
  type ViewStyle,
} from 'react-native';

import { colors, offset as offsets, onSubject, pale, radius, spacing } from '@/theme';

import { Surface } from './Surface';

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
      <Surface fill={fill} r={radius.md} depth={disabled ? 0 : offsets.sm}>
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

export function Field({
  containerStyle,
  style,
  ...props
}: TextInputProps & { containerStyle?: StyleProp<ViewStyle> }) {
  // Layout belongs on the surface, not the input inside it. A `flex: 1` sent
  // to the TextInput leaves the wrapper sized to its content, so fields in a
  // row do not share it and the last one overflows — which only showed up at
  // wider handset widths.
  return (
    <Surface r={radius.md} depth={offsets.sm} style={containerStyle}>
      <TextInput
        placeholderTextColor={colors.faint}
        {...props}
        style={[styles.field, style]}
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
  const glyph = <Ionicons name={icon} size={20} color={color} />;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={surface ? undefined : 10}
      onPress={onPress}
      style={({ pressed }) => (pressed ? styles.pressed : null)}
    >
      {surface ? (
        <Surface r={radius.sm} depth={offsets.sm}>
          <View style={styles.iconSurface}>{glyph}</View>
        </Surface>
      ) : (
        glyph
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
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

  field: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    fontSize: 15,
    color: colors.ink,
  },

  chip: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm + 2, maxWidth: 170 },
  chipLabel: { fontSize: 13, color: colors.muted, fontWeight: '700' },

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

  iconSurface: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },

  pressed: { opacity: 0.6 },
});
