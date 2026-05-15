import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import type { Session } from '@supabase/supabase-js';
import {
  ChampionIcon, MapPinIcon, Add01Icon, UserCircleIcon, AlertCircleIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow, Fonts } from '../theme';
import { api } from '../services/api';
import type { UserProfile, ActivityItem, Report } from '../services/types';
import { useAppConfig } from '../hooks/useConfig';
import { Card, ProgressBar, StatPill, EmptyState, StreakFlame } from '../components/UI';
import ReportsMap from '../components/ReportsMap';
import { pinColor } from '../lib/mapPins';
import { APP_NAME } from '../constants/branding';
import { CopyrightFooter } from '../components/CopyrightFooter';
import { centeredScrollContent } from '../components/ScreenContent';

type Props = {
  navigation: any;
  active?: boolean;
  session: Session | null;
  onReportPress: () => void;
};

export default function HomeScreen({ navigation, active = true, session, onReportPress }: Props) {
  const { config } = useAppConfig();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [mapReports, setMapReports] = useState<Report[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mapFilter, setMapFilter] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const reportsPromise = api.reports();
      if (session) {
        const [p, reports, a] = await Promise.all([
          api.me(),
          reportsPromise,
          api.activity(8).catch(() => [] as ActivityItem[]),
        ]);
        setProfile(p);
        setMapReports(reports);
        setActivity(a);
      } else {
        const reports = await reportsPromise;
        setProfile(null);
        setMapReports(reports);
        setActivity([]);
      }
    } catch {
      setMapReports([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session]);

  useEffect(() => { if (active) load(); }, [active, load]);

  const filteredMapReports = useMemo(() => {
    if (!mapFilter) return mapReports;
    return mapReports.filter((r) => r.category === mapFilter);
  }, [mapReports, mapFilter]);

  const potholeCount = mapReports.filter((r) => r.category === 'Pothole').length;
  const verifiedCount = mapReports.filter((r) => ['Verified', 'Resolved'].includes(r.status)).length;

  if (loading && mapReports.length === 0) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const stats = profile?.stats;
  const nextLevel = stats?.next_level;
  const xpToNext = nextLevel ? Math.max(0, nextLevel.min_xp - (stats?.xp_total ?? 0)) : 0;
  const displayName = profile?.display_name || profile?.email?.split('@')[0] || 'Citizen';
  const appName = APP_NAME;
  const tagline = config?.tagline || 'Spot it. Snap it. Solve it.';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
      >
        <View style={styles.topBar}>
          <View style={styles.logoMark}>
            <HugeiconsIcon icon={MapPinIcon} color="white" size={22} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.appName}>{appName}</Text>
            <Text style={styles.tagline}>{tagline}</Text>
          </View>
          {!session ? (
            <TouchableOpacity style={styles.signInBtn} onPress={() => navigation.navigate('Auth')}>
              <HugeiconsIcon icon={UserCircleIcon} color={Colors.primary} size={18} />
              <Text style={styles.signInText}>Sign in</Text>
            </TouchableOpacity>
          ) : stats?.streak_count ? (
            <StreakFlame count={stats.streak_count} />
          ) : null}
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statChip}>
            <Text style={styles.statNum}>{mapReports.length}</Text>
            <Text style={styles.statLbl}>Total reports</Text>
          </View>
          <View style={styles.statChip}>
            <Text style={[styles.statNum, { color: Colors.accent }]}>{potholeCount}</Text>
            <Text style={styles.statLbl}>Potholes</Text>
          </View>
          <View style={styles.statChip}>
            <Text style={[styles.statNum, { color: Colors.success }]}>{verifiedCount}</Text>
            <Text style={styles.statLbl}>Verified</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your progress</Text>
          {session && profile ? (
            <>
              <Card style={styles.heroCard}>
                <View style={styles.heroGlow} pointerEvents="none" />
                <Text style={styles.welcomeName}>Hi, {displayName}</Text>
                <Text style={styles.impactTitle}>{stats?.level.name}</Text>
                <Text style={styles.xpText}>{stats?.xp_total ?? 0} XP · Rank #{stats?.rank || '—'}</Text>
                <View style={styles.heroProgress}>
                  <ProgressBar value={stats?.progress_to_next ?? 0} trackColor="rgba(255,255,255,0.28)" color="#FFFFFF" />
                  <Text style={styles.progressSub}>
                    {nextLevel ? `${xpToNext} XP to ${nextLevel.name}` : 'Maximum level reached'}
                  </Text>
                </View>
              </Card>
              <View style={styles.statsGrid}>
                <StatPill icon={MapPinIcon} value={stats?.reports_submitted ?? 0} label="Reports" color={Colors.accent} />
                <StatPill icon={ChampionIcon} value={stats?.reports_resolved ?? 0} label="Resolved" color={Colors.info} />
              </View>
            </>
          ) : (
            <Card style={styles.guestCard}>
              <HugeiconsIcon icon={UserCircleIcon} color={Colors.primary} size={28} />
              <Text style={styles.guestTitle}>Sign in to track progress</Text>
              <Text style={styles.guestSub}>
                Earn XP, level up, and see your report history after you sign in.
              </Text>
              <TouchableOpacity style={styles.guestSignIn} onPress={() => navigation.navigate('Auth')}>
                <Text style={styles.guestSignInText}>Sign in</Text>
              </TouchableOpacity>
            </Card>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Live issue map</Text>
            <Text style={styles.sectionSub}>Tap a pin for details</Text>
          </View>
          <View style={styles.filterRow}>
            <FilterChip label="All" active={!mapFilter} onPress={() => setMapFilter(null)} />
            {config?.categories?.map((c) => (
              <FilterChip
                key={c.code}
                label={c.label}
                active={mapFilter === c.code}
                color={c.color}
                onPress={() => setMapFilter(mapFilter === c.code ? null : c.code)}
              />
            ))}
          </View>
          <ReportsMap
            reports={filteredMapReports}
            height={300}
            onSelectReport={(id) => navigation.navigate('ReportDetail', { reportId: id })}
          />
          <View style={styles.legend}>
            {['Reported', 'Pending Review', 'Rejected', 'Verified', 'Resolved'].map((s) => (
              <View key={s} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: pinColor(s) }]} />
                <Text style={styles.legendText}>{s}</Text>
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.ctaCard} onPress={onReportPress} activeOpacity={0.92}>
          <View style={{ flex: 1 }}>
            <Text style={styles.ctaTitle}>Report a pothole</Text>
            <Text style={styles.ctaSub}>
              {session ? 'Snap a photo — AI verifies in seconds.' : 'Sign in required to submit a report.'}
            </Text>
          </View>
          <View style={styles.ctaBtn}>
            <HugeiconsIcon icon={Add01Icon} color="white" size={22} />
          </View>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your activity</Text>
          {session && profile ? (
            activity.length === 0 ? (
              <Card>
                <EmptyState icon={MapPinIcon} title="No activity yet" subtitle="Submit your first report to earn XP." />
              </Card>
            ) : (
              <View style={styles.activityList}>
                {activity.map((a) => (
                  <Card key={a.id} style={styles.activityCard}>
                    <View style={styles.activityDot} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.activityTitle}>{a.title}</Text>
                      <Text style={styles.activityTime}>{new Date(a.created_at).toLocaleDateString()}</Text>
                    </View>
                    {a.xp_delta > 0 && (
                      <View style={styles.xpChip}>
                        <Text style={styles.xpDelta}>+{a.xp_delta} XP</Text>
                      </View>
                    )}
                  </Card>
                ))}
              </View>
            )
          ) : (
            <Card>
              <EmptyState
                icon={AlertCircleIcon}
                title="No activity yet"
                subtitle="Sign in and report an issue to see your timeline here."
              />
            </Card>
          )}
        </View>

        <CopyrightFooter />
      </ScrollView>
    </SafeAreaView>
  );
}

function FilterChip({
  label, active, onPress, color,
}: { label: string; active: boolean; onPress: () => void; color?: string }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.filterChip,
        active && { backgroundColor: color || Colors.primary, borderColor: color || Colors.primary },
      ]}
    >
      {color && !active ? <View style={[styles.filterDot, { backgroundColor: color }]} /> : null}
      <Text style={[styles.filterChipText, active && { color: 'white' }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { justifyContent: 'center', alignItems: 'center' },
  content: {
    ...centeredScrollContent,
    gap: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  logoMark: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.md,
  },
  appName: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.heavy,
    color: Colors.text,
    letterSpacing: -0.4,
    fontFamily: Fonts.heading,
  },
  tagline: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
    fontFamily: Fonts.sans,
  },
  signInBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
  },
  signInText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.primary },
  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  statChip: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    padding: Spacing.md, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border, ...Shadow.sm,
  },
  statNum: { fontSize: FontSize.xl, fontWeight: FontWeight.heavy, color: Colors.primary },
  statLbl: { fontSize: 10, color: Colors.textMuted, marginTop: 4, fontWeight: FontWeight.medium },
  section: { gap: Spacing.sm },
  sectionHead: { gap: 2 },
  sectionTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  sectionSub: { fontSize: FontSize.xs, color: Colors.textMuted },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: BorderRadius.round,
    borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  filterDot: { width: 8, height: 8, borderRadius: 4 },
  filterChipText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10, color: Colors.textMuted },
  ctaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.primaryDark,
    ...Shadow.lg,
  },
  ctaTitle: { color: 'white', fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  ctaSub: { color: 'rgba(255,255,255,0.9)', fontSize: FontSize.sm, marginTop: 4, lineHeight: 20 },
  ctaBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  heroCard: {
    backgroundColor: Colors.primary, padding: Spacing.lg, gap: Spacing.sm,
    overflow: 'hidden', borderColor: Colors.primaryDark, ...Shadow.lg,
  },
  heroGlow: {
    position: 'absolute', width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.08)', top: -40, right: -30,
  },
  welcomeName: { color: 'rgba(255,255,255,0.85)', fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  impactTitle: { color: 'white', fontSize: FontSize.xl, fontWeight: FontWeight.heavy },
  xpText: { color: 'rgba(255,255,255,0.75)', fontSize: FontSize.xs, fontWeight: FontWeight.medium },
  heroProgress: { marginTop: Spacing.sm, gap: 6 },
  progressSub: { color: 'rgba(255,255,255,0.55)', fontSize: 10 },
  statsGrid: { flexDirection: 'row', gap: Spacing.md },
  activityList: { gap: Spacing.sm },
  activityCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm },
  activityDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.accent },
  activityTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text },
  activityTime: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  xpChip: { backgroundColor: Colors.accentSoft, paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.round },
  xpDelta: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.accent },
  guestCard: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.lg },
  guestTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  guestSub: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  guestSignIn: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
  },
  guestSignInText: { color: 'white', fontWeight: FontWeight.bold, fontSize: FontSize.sm },
});
