/**
 * SynCity — Clean Minimalist Light design system
 * Palette: primary (civic blue) · accent (action orange) · background · surface
 */
import { Platform } from 'react-native';

export const Colors = {
  primary: '#0B2D6B',
  primaryDark: '#071E4A',
  primarySoft: '#E8EEF8',
  accent: '#E85D04',
  accentSoft: '#FFF4ED',

  success: '#047857',
  successSoft: '#D1FAE5',
  danger: '#B91C1C',
  dangerSoft: '#FEE2E2',
  warning: '#B45309',
  warningSoft: '#FEF3C7',
  info: '#0369A1',
  infoSoft: '#E0F2FE',

  background: '#F5F7FA',
  surface: '#FFFFFF',
  surfaceMuted: '#F0F3F8',
  text: '#0C1222',
  textSecondary: '#4B5568',
  textMuted: '#9CA3AF',
  border: '#E5E9F0',
  borderStrong: '#CBD5E1',
  overlay: 'rgba(12, 18, 34, 0.52)',
};

export const Fonts = {
  sans: Platform.select({
    web: '"Plus Jakarta Sans", "Inter", system-ui, -apple-system, sans-serif',
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  }),
  heading: Platform.select({
    web: '"Plus Jakarta Sans", "Inter", system-ui, sans-serif',
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  }),
};

export const Motion = {
  duration: 180,
  easing: 'ease-in-out' as const,
};

export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  section: 56,
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  round: 999,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  display: 28,
  hero: 34,
};

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  heavy: '800' as const,
};

export const LineHeight = {
  tight: 1.15,
  normal: 1.5,
  relaxed: 1.65,
};

export const Shadow = {
  sm: {
    shadowColor: '#0C1222',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#0B2D6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  lg: {
    shadowColor: '#0B2D6B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 8,
  },
};
