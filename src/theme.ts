/**
 * Unibud design tokens.
 *
 * Palette is the one supplied with the references. The surface language is
 * the second reference's: every raised thing is an outlined face sitting on
 * a solid offset rectangle, so depth is drawn rather than blurred.
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

  canvas: '#F7F3EA',
  canvasTint: '#EFE9DC',
  surface: '#FFFDF8',
  onInk: '#FFFFFF',

  muted: '#6B6862',
  faint: '#9C978D',
  line: '#17161B',
  inset: '#F2EEE4',

  pink: '#FF4D86',

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

/** Squarer than the last pass: the reference's corners are crisp, not pill. */
export const radius = { sm: 10, md: 14, lg: 18, xl: 22, pill: 999 } as const;

/** Every outlined surface uses the same weight, so nothing reads as heavier. */
export const border = { width: 2, color: '#17161B' } as const;

/** How far the solid shadow sits below and right of its surface. */
export const offset = { sm: 3, md: 5 } as const;

/**
 * Depth is drawn, not blurred: see the Surface component, which paints a
 * solid offset rectangle behind an outlined face. React Native's own shadow
 * props cannot do this portably — Android's elevation always blurs — so
 * these remain only for the few places that want a faint lift.
 */
export const shadow = {
  shadowColor: '#17161B',
  shadowOpacity: 0.06,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
} as const;

export const shadowSoft = shadow;

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
