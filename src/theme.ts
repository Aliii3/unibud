/**
 * Unibud design tokens.
 *
 * Palette is the one supplied with the references. The surface language is
 * deliberately soft: generous radii, layered shadows and coloured glows in
 * place of outlines, so depth comes from light rather than borders.
 */
export const colors = {
  blue: '#3760F9',
  blueDeep: '#2438B8',
  blueGlow: '#6E8BFF',
  ink: '#17161B',
  inkSoft: '#2A2832',
  lime: '#D2FC59',
  limeDeep: '#B4E82F',
  lavender: '#DAD9FB',

  canvas: '#F4F5FA',
  canvasTint: '#EDEEF7',
  surface: '#FFFFFF',
  onInk: '#FFFFFF',

  muted: '#6E6D7E',
  faint: '#A6A5B5',
  line: '#EBEBF3',
  inset: '#F2F2F8',

  danger: '#E5484D',
  warning: '#B87503',
} as const;

/** Folder tab colours, cycled as subjects are created. */
export const subjectColors = [
  '#3760F9',
  '#D2FC59',
  '#8B7BF7',
  '#33D6C0',
  '#FF8A5B',
  '#F76FA8',
] as const;

/** Icons cycled alongside the colours, so a new subject looks distinct. */
export const subjectIcons = [
  'flask',
  'calculator',
  'globe',
  'book',
  'color-palette',
  'pulse',
] as const;

/** Text that sits on a subject colour. The light tints need dark ink. */
export function onSubject(color: string): string {
  return color === '#D2FC59' || color === '#33D6C0' || color === '#DAD9FB'
    ? colors.ink
    : colors.onInk;
}

/** A lighter partner for a colour, used as the second gradient stop. */
export function lighten(color: string): string {
  const map: Record<string, string> = {
    '#3760F9': '#6E8BFF',
    '#D2FC59': '#E9FFA8',
    '#8B7BF7': '#B3A6FF',
    '#33D6C0': '#7BEFE0',
    '#FF8A5B': '#FFB596',
    '#F76FA8': '#FFA3C8',
  };
  return map[color] ?? color;
}

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 36 } as const;

/** Rounder than the last pass — the main lever for "smoother". */
export const radius = { sm: 14, md: 20, lg: 28, xl: 34, pill: 999 } as const;

/** Resting elevation for any raised surface. Wide, faint, low contrast. */
export const shadow = {
  shadowColor: '#2A2545',
  shadowOpacity: 0.08,
  shadowRadius: 24,
  shadowOffset: { width: 0, height: 10 },
  elevation: 4,
} as const;

/** Tighter shadow for small controls that should not float. */
export const shadowSoft = {
  shadowColor: '#2A2545',
  shadowOpacity: 0.06,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
} as const;

/**
 * A coloured halo. `strength` scales it: 1 for the hero panel, lower for the
 * small icon tiles, where a full halo reads as a blur rather than a glow.
 */
export function glow(color: string, strength = 1) {
  return {
    shadowColor: color,
    shadowOpacity: 0.42 * strength,
    shadowRadius: 22 * strength,
    shadowOffset: { width: 0, height: 10 * strength },
    elevation: Math.round(8 * strength),
  } as const;
}

/** Pale partner of a colour, for a resting accent surface. */
export function pale(color: string): string {
  const map: Record<string, string> = {
    '#3760F9': '#E2E8FF',
    '#D2FC59': '#F1FED2',
    '#8B7BF7': '#EAE6FF',
    '#33D6C0': '#DCFAF5',
    '#FF8A5B': '#FFE7DD',
    '#F76FA8': '#FFE2EE',
  };
  return map[color] ?? color;
}

export const type = {
  display: { fontSize: 33, fontWeight: '800', letterSpacing: -1.1 },
  title: { fontSize: 25, fontWeight: '800', letterSpacing: -0.7 },
  h2: { fontSize: 16, fontWeight: '700', letterSpacing: -0.3 },
  body: { fontSize: 15, fontWeight: '400' },
  label: { fontSize: 13, fontWeight: '600' },
  caption: { fontSize: 12, fontWeight: '500' },
} as const;
