/**
 * Unibud palette. The green is the colour the app name was written in on the
 * source notes; the subject colours are used to tint the folder cards on home.
 */
export const colors = {
  accent: '#2E9E4F',
  accentSoft: '#E6F4EA',
  ink: '#1A1A1A',
  muted: '#6B6B6B',
  faint: '#9A9A9A',
  line: '#E3E3E3',
  surface: '#FFFFFF',
  canvas: '#F7F8F6',
  danger: '#C0392B',
  warning: '#B8860B',
} as const;

export const subjectColors = [
  '#2E9E4F',
  '#3A86C8',
  '#C0563B',
  '#7B5EA7',
  '#B8860B',
  '#2A9D8F',
] as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const radius = { sm: 8, md: 12, lg: 16 } as const;

export const type = {
  title: { fontSize: 28, fontWeight: '700' },
  h1: { fontSize: 20, fontWeight: '700' },
  h2: { fontSize: 16, fontWeight: '600' },
  body: { fontSize: 15, fontWeight: '400' },
  label: { fontSize: 13, fontWeight: '500' },
  caption: { fontSize: 12, fontWeight: '400' },
} as const;
