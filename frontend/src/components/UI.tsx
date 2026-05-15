import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow, Fonts } from '../theme';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Fire03Icon, AlertCircleIcon } from '@hugeicons/core-free-icons';

const textBase: TextStyle = { fontFamily: Fonts.sans };
const headingBase: TextStyle = { fontFamily: Fonts.heading, letterSpacing: -0.3 };

export function Card({ children, style, elevated }: { children: React.ReactNode; style?: ViewStyle; elevated?: boolean }) {
  return <View style={[styles.card, elevated && styles.cardElevated, style]}>{children}</View>;
}

export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{children}</Text>
      {action}
    </View>
  );
}

export function ProgressBar({
  value, color = Colors.accent, height = 8, trackColor = Colors.surfaceMuted,
}: { value: number; color?: string; height?: number; trackColor?: string }) {
  const w = Math.max(0, Math.min(1, value)) * 100;
  return (
    <View style={[styles.progressTrack, { height, borderRadius: height, backgroundColor: trackColor }]}>
      <View style={{ width: `${w}%`, height: '100%', backgroundColor: color, borderRadius: height }} />
    </View>
  );
}

export function StatPill({ icon, value, label, color }: { icon: any; value: string | number; label: string; color: string }) {
  return (
    <View style={styles.statPill}>
      <View style={[styles.statIcon, { backgroundColor: `${color}18` }]}>
        <HugeiconsIcon icon={icon} color={color} size={20} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );
}

export function Avatar({ name, size = 48, color = Colors.primary, uri }: { name?: string | null; size?: number; color?: string; uri?: string | null }) {
  const initials = (name || '?').trim().split(/\s+/).slice(0, 2).map((s) => s[0] || '').join('').toUpperCase() || '?';
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: `${color}14`, borderColor: `${color}30` }]}>
      <Text style={[styles.avatarText, { color, fontSize: size * 0.36 }]}>{initials}</Text>
    </View>
  );
}

export function EmptyState({
  title, subtitle, icon, color = Colors.textSecondary,
}: { title: string; subtitle?: string; icon?: any; color?: string }) {
  const Icon = icon || AlertCircleIcon;
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: `${color}14` }]}>
        <HugeiconsIcon icon={Icon} color={color} size={30} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle ? <Text style={styles.emptySub}>{subtitle}</Text> : null}
    </View>
  );
}

export function Badge({ text, color = Colors.primary, soft = true }: { text: string; color?: string; soft?: boolean }) {
  return (
    <View style={[styles.badge, { backgroundColor: soft ? `${color}14` : color, borderColor: soft ? `${color}28` : 'transparent', borderWidth: soft ? 1 : 0 }]}>
      <Text style={[styles.badgeText, { color: soft ? color : 'white' }]}>{text}</Text>
    </View>
  );
}

export function StreakFlame({ count, size = 20 }: { count: number; size?: number }) {
  const inactive = !count;
  return (
    <View style={[styles.streakWrap, inactive && styles.streakWrapInactive, { height: size * 1.6, paddingHorizontal: size * 0.6 }]}>
      <HugeiconsIcon icon={Fire03Icon} color={inactive ? Colors.textMuted : 'white'} size={size} />
      <Text style={[styles.streakText, { fontSize: size * 0.68, color: inactive ? Colors.textSecondary : 'white' }]}>{count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  cardElevated: { ...Shadow.md },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    ...headingBase,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  progressTrack: { width: '100%', overflow: 'hidden' },
  statPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    ...headingBase,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.heavy,
    color: Colors.text,
  },
  statLabel: {
    ...textBase,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
    marginTop: 2,
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  avatarText: { fontWeight: '800', fontFamily: Fonts.heading },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.xs,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  emptyTitle: {
    ...headingBase,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  emptySub: {
    ...textBase,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
    lineHeight: 22,
    marginTop: 4,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.round,
    alignSelf: 'flex-start',
  },
  badgeText: {
    ...textBase,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  streakWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.round,
    ...Shadow.sm,
  },
  streakWrapInactive: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  streakText: { fontWeight: FontWeight.heavy, fontFamily: Fonts.sans },
});
