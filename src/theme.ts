/**
 * Unibud design tokens.
 *
 * Palette is the one supplied with the design references; the layout language
 * (big tight headlines, folder cards with a coloured tab, black pill buttons
 * with a lime action circle) comes from the second reference, kept soft-edged
 * rather than outlined.
 */
export const colors = {
  blue: '#3760F9',
  blueDeep: '#2A49C9',
  ink: '#17161B',
  lime: '#D2FC59',
  lavender: '#DAD9FB',

  canvas: '#F6F6F8',
  surface: '#FFFFFF',
  onInk: '#FFFFFF',
  onLime: '#17161B',

  muted: '#6E6D78',
  faint: '#A3A2AD',
  line: '#E8E8EE',

  danger: '#E5484D',
  warning: '#B87503',
} as const;

/** Tab colours for subject folders, cycled as subjects are created. */
export const subjectColors = [
  '#3760F9',
  '#D2FC59',
  '#DAD9FB',
  '#17161B',
  '#8B7BF7',
  '#59D9FC',
] as const;

/** Text that sits on a subject colour. Lime and lavender need dark ink. */
export function onSubject(color: string): string {
  return color === '#D2FC59' || color === '#DAD9FB' || color === '#59D9FC'
    ? colors.ink
    : colors.onInk;
}

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 36 } as const;

export const radius = { sm: 10, md: 16, lg: 22, pill: 999 } as const;

/** One soft elevation, used on every raised surface so the app reads flat. */
export const shadow = {
  shadowColor: '#17161B',
  shadowOpacity: 0.07,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 8 },
  elevation: 3,
} as const;

export const type = {
  display: { fontSize: 34, fontWeight: '800', letterSpacing: -1 },
  title: { fontSize: 26, fontWeight: '800', letterSpacing: -0.6 },
  h2: { fontSize: 17, fontWeight: '700', letterSpacing: -0.2 },
  body: { fontSize: 15, fontWeight: '400' },
  label: { fontSize: 13, fontWeight: '600' },
  caption: { fontSize: 12, fontWeight: '500' },
} as const;
