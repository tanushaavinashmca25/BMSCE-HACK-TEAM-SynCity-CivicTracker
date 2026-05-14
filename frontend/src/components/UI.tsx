import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../theme';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Fire03Icon, AlertCircleIcon } from '@hugeicons/core-free-icons';

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{children}</Text>
      {action}
    </View>
  );
}

export function ProgressBar({ value, color = Colors.accent, height = 6 }: { value: number; color?: string; height?: number }) {
  const w = Math.max(0, Math.min(1, value)) * 100;
  return (
    <View style={[styles.progressTrack, { height, borderRadius: height }]}>
      <View style={{ width: `${w}%`, height: '100%', backgroundColor: color, borderRadius: height }} />
    </View>
  );
}

export function StatPill({ icon, value, label, color }: { icon: any; value: string | number; label: string; color: string }) {
  return (
    <View style={styles.statPill}>
      <View style={[styles.statIcon, { backgroundColor: `${color}10` }]}>
        <HugeiconsIcon icon={icon} color={color} size={16} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );
}

export function Avatar({ name, size = 44, color = Colors.primary, uri }: { name?: string | null; size?: number; color?: string; uri?: string | null }) {
  const initials = (name || '?').trim().split(/\s+/).slice(0, 2).map((s) => s[0] || '').join('').toUpperCase() || '?';
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: `${color}10`, borderWidth: 1, borderColor: `${color}20` }]}>
      <Text style={[styles.avatarText, { color, fontSize: size * 0.35 }]}>{initials}</Text>
    </View>
  );
}

export function EmptyState({
  title, subtitle, icon, color = Colors.textSecondary,
}: { title: string; subtitle?: string; icon?: any; color?: string }) {
  const Icon = icon || AlertCircleIcon;
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: `${color}15` }]}>
        <HugeiconsIcon icon={Icon} color={color} size={28} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle ? <Text style={styles.emptySub}>{subtitle}</Text> : null}
    </View>
  );
}

export function Badge({ text, color = Colors.primary, soft = true }: { text: string; color?: string; soft?: boolean }) {
  return (
    <View style={[styles.badge, { backgroundColor: soft ? `${color}10` : color, borderColor: `${color}20`, borderWidth: soft ? 1 : 0 }]}>
      <Text style={[styles.badgeText, { color: soft ? color : 'white' }]}>{text}</Text>
    </View>
  );
}

export function StreakFlame({ count, size = 20 }: { count: number; size?: number }) {
  const inactive = !count;
  return (
    <View style={[styles.streakWrap, inactive && styles.streakWrapInactive, { height: size * 1.6, paddingHorizontal: size * 0.5 }]}>
      <HugeiconsIcon
        icon={Fire03Icon}
        color={inactive ? Colors.textMuted : 'white'}
        size={size}
      />
      <Text style={[
        styles.streakText,
        { fontSize: size * 0.7, color: inactive ? Colors.textSecondary : 'white' },
      ]}>{count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.heavy,
    color: Colors.text,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  progressTrack: {
    width: '100%',
    backgroundColor: Colors.surfaceMuted,
    overflow: 'hidden',
  },
  statPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statIcon: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  statValue: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.heavy,
    color: Colors.text,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: FontWeight.bold,
    textTransform: 'uppercase',
  },
  avatar: { alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontWeight: '900' },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    gap: Spacing.xs,
  },
  emptyIcon: {
    width: 56, height: 56, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.heavy,
    color: Colors.text,
    marginTop: -Spacing.sm,
  },
  emptySub: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
    lineHeight: 20,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.round,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: FontWeight.heavy,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  streakWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.round,
  },
  streakWrapInactive: {
    backgroundColor: Colors.surfaceMuted,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  streakText: { fontWeight: FontWeight.heavy },
});
