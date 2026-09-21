import type { ReactNode } from 'react';
import { StyleSheet, type StyleProp, View, type ViewStyle } from 'react-native';

import { border, colors, offset as offsets, radius } from '@/theme';

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
    <View style={[styles.wrap, style]}>
      <View
        pointerEvents="none"
        style={[
          styles.shadow,
          { left: depth, top: depth, right: -depth, bottom: -depth },
          { backgroundColor: shadowColor, borderRadius: r },
        ]}
      />
      <View style={[styles.face, { backgroundColor: fill, borderRadius: r }, faceStyle]}>
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
