export const Colors = {
  // Brand - Navy & Orange
  primary: '#1E3A8A',         // Navy Blue
  primaryDark: '#172554',     // Dark Navy
  primarySoft: '#DBEAFE',     // Soft Blue
  accent: '#F97316',          // Orange
  accentSoft: '#FFEDD5',      // Soft Orange

  // Semantic
  success: '#10B981',
  successSoft: '#D1FAE5',
  danger: '#EF4444',
  dangerSoft: '#FEF2F2',
  warning: '#F59E0B',
  warningSoft: '#FEF3C7',
  info: '#3B82F6',
  infoSoft: '#EFF6FF',

  // Neutrals
  background: '#FFFFFF',      // White
  surface: '#F8FAFC',         // Off-white/Light Slate
  surfaceMuted: '#F1F5F9',
  text: '#0F172A',            // Deep Navy Text
  textSecondary: '#334155',   // Lighter Slate/Navy
  textMuted: '#64748B',
  border: '#E2E8F0',          // Slate Border
  borderStrong: '#94A3B8',
  overlay: 'rgba(15, 23, 42, 0.6)',
};

export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  round: 999,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  display: 32,
  hero: 40,
};

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  heavy: '800' as const,
};

export const Shadow = {
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  lg: {
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 10,
  },
};

};
