import type { ReactNode } from 'react';
import { StyleSheet, type StyleProp, View, type ViewStyle } from 'react-native';

import { border, colors, offset as offsets, radius } from '@/theme';

/**
 * The one raised surface in the app: an outlined face sitting on a solid
 * rectangle offset down and right.
 *
 * React Native cannot draw a hard shadow portably — iOS could with
 * shadowRadius 0, but Android's elevation always blurs — so the shadow is a
 * real View behind the face.
 *
 * The shadow sits *inside* the wrapper's box rather than overhanging it: the
 * face is inset from the wrapper's right and bottom by `depth`, and the
 * shadow fills what that leaves. It overhung at first, which measured as a
 * 16px left gutter against an 11px right one on every screen — a card looked
 * closer to the right edge of the display than the left, by exactly the
 * depth. Reserving the space costs the face `depth` of width and makes the
 * gutters true.
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
  /** Layout for the whole surface, shadow included. Margins belong here. */
  style?: StyleProp<ViewStyle>;
  /**
   * Styles for the outlined face. Do not set `marginRight` or `marginBottom`
   * here — those are how the shadow is given its room, and overriding them
   * detaches the shadow from the face.
   */
  faceStyle?: StyleProp<ViewStyle>;
  fill?: string;
  r?: number;
  depth?: number;
  shadowColor?: string;
}) {
  return (
    <View style={[styles.wrap, style]}>
      <View
        pointerEvents="none"
        style={[
          styles.shadow,
          { left: depth, top: depth, right: 0, bottom: 0 },
          { backgroundColor: shadowColor, borderRadius: r },
        ]}
      />
      <View
        style={[
          styles.face,
          { backgroundColor: fill, borderRadius: r },
          { marginRight: depth, marginBottom: depth },
          faceStyle,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative' },
  shadow: { position: 'absolute' },
  face: {
    borderWidth: border.width,
    borderColor: border.color,
    overflow: 'hidden',
  },
});
