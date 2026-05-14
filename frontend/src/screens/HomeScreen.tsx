import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import {
  ChampionIcon, MapPinIcon, Fire03Icon, StarIcon, Add01Icon, MagicWand01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../theme';
import { api } from '../services/api';
import type { UserProfile, ActivityItem } from '../services/types';
import { useAppConfig } from '../hooks/useConfig';
import { Card, ProgressBar, StatPill, EmptyState, Badge, StreakFlame } from '../components/UI';
import { iconFor } from '../utils/icons';

export default function HomeScreen({ navigation, active = true }: any) {
  const { config } = useAppConfig();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setErr(null);
      const [p, a] = await Promise.all([api.me(), api.activity(8).catch(() => [] as ActivityItem[])]);
      setProfile(p);
      setActivity(a);
    } catch (e: any) {
      setErr(e?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { if (active) load(); }, [active, load]);

  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, [load]);

  if (loading && !profile) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  const stats = profile?.stats;
  const nextLevel = stats?.next_level;
  const xpToNext = nextLevel ? Math.max(0, nextLevel.min_xp - (stats?.xp_total ?? 0)) : 0;
  const displayName = profile?.display_name || profile?.email?.split('@')[0] || 'Citizen';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning,</Text>
            <Text style={styles.name}>{displayName}</Text>
          </View>
          {stats?.streak_count ? <StreakFlame count={stats.streak_count} /> : null}
        </View>

        <Card style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>RANK #{stats?.rank || '—'}</Text>
            </View>
            <View style={styles.levelWrap}>
              <Text style={styles.levelLabel}>LEVEL</Text>
              <Text style={styles.levelValue}>{stats?.level.tier}</Text>
            </View>
          </View>
          
          <Text style={styles.impactTitle}>{stats?.level.name}</Text>
          <Text style={styles.xpText}>{stats?.xp_total ?? 0} TOTAL XP</Text>
          
          <View style={styles.heroProgress}>
            <ProgressBar value={stats?.progress_to_next ?? 0} />
            <Text style={styles.progressSub}>
              {nextLevel ? `${xpToNext} XP to ${nextLevel.name}` : 'Maximum Citizen Impact'}
            </Text>
          </View>
        </Card>

        <View style={styles.statsGrid}>
          <StatPill icon={MapPinIcon} value={stats?.reports_submitted ?? 0} label="Reports" color={Colors.accent} />
          <StatPill icon={ChampionIcon} value={stats?.reports_resolved ?? 0} label="Resolved" color={Colors.info} />
        </View>

        <Card style={styles.streakCard}>
          <StreakFlame count={stats?.streak_count ?? 0} size={28} />
          <View style={{ flex: 1 }}>
            <Text style={styles.streakTitle}>
              {(stats?.streak_count ?? 0) === 0
                ? 'Start your streak'
                : `${stats?.streak_count}-day streak`}
            </Text>
            <Text style={styles.streakSub}>
              {(stats?.streak_count ?? 0) === 0
                ? 'Submit a verified report today to begin.'
                : 'Verify a report each day to keep it alive.'}
            </Text>
          </View>
        </Card>

        <View style={styles.missionCard}>
          <View style={styles.missionText}>
            <Text style={styles.missionTitle}>Take Action</Text>
            <Text style={styles.missionDesc}>Improve your community by reporting local issues.</Text>
          </View>
          <TouchableOpacity style={styles.reportBtn} onPress={() => navigation.navigate('Camera')}>
            <HugeiconsIcon icon={Add01Icon} color="white" size={20} />
            <Text style={styles.reportBtnText}>Report</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Impact Areas</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
            {config?.categories?.map((c) => (
              <TouchableOpacity key={c.code} style={styles.catCard}>
                <View style={[styles.catIconWrap, { backgroundColor: `${c.color}10` }]}>
                  <HugeiconsIcon icon={iconFor(c.icon)} color={c.color} size={20} />
                </View>
                <Text style={styles.catLabel}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Recent Activity</Text>
          {activity.length === 0 ? (
            <Card>
              <EmptyState
                icon={MapPinIcon}
                title="No recent reports"
                subtitle="Your contributions to society will appear here."
              />
            </Card>
          ) : (
            <View style={styles.activityList}>
              {activity.map((a) => (
                <View key={a.id} style={styles.activityRow}>
                  <View style={styles.activityDot} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.activityTitle}>{a.title}</Text>
                    <Text style={styles.activityTime}>{new Date(a.created_at).toLocaleDateString()}</Text>
                  </View>
                  {a.xp_delta > 0 && <Text style={styles.xpDelta}>+{a.xp_delta} XP</Text>}
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { justifyContent: 'center', alignItems: 'center' },
  content: { padding: Spacing.lg, gap: Spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.bold, textTransform: 'uppercase', letterSpacing: 1 },
  name: { fontSize: FontSize.xxl, fontWeight: FontWeight.heavy, color: Colors.text, marginTop: 2 },
  heroCard: { backgroundColor: Colors.primary, padding: Spacing.xl, gap: Spacing.md, overflow: 'hidden' },
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroBadge: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
  heroBadgeText: { color: 'white', fontSize: 10, fontWeight: FontWeight.heavy, letterSpacing: 1 },
  levelWrap: { alignItems: 'flex-end' },
  levelLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 8, fontWeight: FontWeight.heavy },
  levelValue: { color: 'white', fontSize: FontSize.xl, fontWeight: FontWeight.heavy, marginTop: -2 },
  impactTitle: { color: 'white', fontSize: FontSize.xxl, fontWeight: FontWeight.heavy, marginTop: Spacing.sm },
  xpText: { color: 'rgba(255,255,255,0.7)', fontSize: FontSize.xs, fontWeight: FontWeight.bold, letterSpacing: 0.5 },
  heroProgress: { marginTop: Spacing.sm, gap: 6 },
  progressSub: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: FontWeight.medium },
  streakCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.md,
  },
  streakTitle: { fontSize: FontSize.md, fontWeight: FontWeight.heavy, color: Colors.text },
  streakSub: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  statsGrid: { flexDirection: 'row', gap: Spacing.md },
  missionCard: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.accent, padding: Spacing.md, borderRadius: BorderRadius.xl,
    ...Shadow.md,
  },
  missionText: { flex: 1, gap: 2 },
  missionTitle: { color: 'white', fontSize: FontSize.md, fontWeight: FontWeight.heavy },
  missionDesc: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: FontWeight.medium },
  reportBtn: { 
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: BorderRadius.lg,
  },
  reportBtnText: { color: 'white', fontWeight: FontWeight.bold, fontSize: FontSize.sm },
  section: { gap: Spacing.md },
  sectionHeader: { fontSize: FontSize.sm, fontWeight: FontWeight.heavy, color: Colors.text, textTransform: 'uppercase', letterSpacing: 1 },
  catScroll: { gap: Spacing.sm, paddingRight: Spacing.lg },
  catCard: { 
    alignItems: 'center', gap: 8, backgroundColor: Colors.surface, 
    padding: Spacing.md, borderRadius: BorderRadius.xl, width: 100,
    borderWidth: 1, borderColor: Colors.border,
  },
  catIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  catLabel: { fontSize: 11, fontWeight: FontWeight.bold, color: Colors.text },
  activityList: { gap: Spacing.md },
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  activityDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.accent },
  activityTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  activityTime: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  xpDelta: { fontSize: FontSize.sm, fontWeight: FontWeight.heavy, color: Colors.accent },
});
