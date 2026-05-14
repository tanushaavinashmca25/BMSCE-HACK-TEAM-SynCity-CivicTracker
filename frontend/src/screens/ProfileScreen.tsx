import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, Image,
  TouchableOpacity, RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import {
  Logout01Icon, ChampionIcon, Fire03Icon, MapPinIcon, StarIcon,
  LockedIcon, MagicWand01Icon, Settings01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../theme';
import { supabase } from '../services/supabase';
import { api } from '../services/api';
import type { UserProfile, Badge as BadgeT, Report } from '../services/types';
import { Avatar, Card, ProgressBar, StatPill, EmptyState, Badge, StreakFlame } from '../components/UI';
import { iconFor } from '../utils/icons';

type Tab = 'history' | 'badges';

const statusColor = (s: string) => {
  switch (s) {
    case 'Resolved':
    case 'Verified': return Colors.accent;
    case 'In-Progress':
    case 'Assigned': return Colors.info;
    case 'Pending Review': return Colors.warning;
    default: return Colors.textMuted;
  }
};

export default function ProfileScreen({ navigation, active = true }: any = {}) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [badges, setBadges] = useState<BadgeT[]>([]);
  const [tab, setTab] = useState<Tab>('history');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [p, r, b] = await Promise.all([
        api.me(),
        api.myReports().catch(() => [] as Report[]),
        api.achievements().catch(() => [] as BadgeT[]),
      ]);
      setProfile(p);
      setReports(r);
      setBadges(b);
    } catch (e: any) {
      Alert.alert('Failed to load', e?.message || 'Unknown error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { if (active) load(); }, [active, load]);

  if (loading && !profile) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={Colors.accent} />
      </View>
    );
  }

  const stats = profile?.stats;
  const nextXp = stats?.next_level ? Math.max(0, stats.next_level.min_xp - stats.xp_total) : 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.accent} />}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Civic Profile</Text>
          <TouchableOpacity style={styles.settingsBtn} onPress={() => supabase.auth.signOut()}>
            <HugeiconsIcon icon={Logout01Icon} color={Colors.danger} size={20} />
          </TouchableOpacity>
        </View>

        <View style={styles.profileHero}>
          <Avatar name={profile?.display_name || profile?.email} size={88} color={Colors.accent} />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profile?.display_name || profile?.email?.split('@')[0]}</Text>
            <View style={styles.levelRow}>
              <Badge text={`LEVEL ${stats?.level.tier}`} color={Colors.accent} soft />
              {stats?.streak_count ? <StreakFlame count={stats.streak_count} size={16} /> : null}
            </View>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <StatPill icon={MapPinIcon} value={stats?.reports_submitted ?? 0} label="Reports" color={Colors.accent} />
          <StatPill icon={ChampionIcon} value={stats?.reports_resolved ?? 0} label="Impact" color={Colors.info} />
          <StatPill icon={StarIcon} value={stats?.reputation_score ?? 0} label="Rep" color={Colors.warning} />
        </View>

        <Card style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>{stats?.level.name}</Text>
            <Text style={styles.progressXp}>{stats?.xp_total} XP</Text>
          </View>
          <ProgressBar value={stats?.progress_to_next ?? 0} />
          <Text style={styles.progressFooter}>
            {stats?.next_level ? `${nextXp} XP to become a ${stats.next_level.name}` : 'Maximum Level Achieved'}
          </Text>
        </Card>

        <View style={styles.tabBar}>
          {(['history', 'badges'] as Tab[]).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tab, tab === t && styles.tabActive]}
              onPress={() => setTab(t)}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === 'history' ? 'Action History' : 'Achievements'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === 'history' ? (
          reports.length === 0 ? (
            <Card>
              <EmptyState
                icon={MapPinIcon}
                title="No actions taken"
                subtitle="Your journey to bettering society starts with your first report."
              />
            </Card>
          ) : (
            <View style={styles.reportList}>
              {reports.map((r) => (
                <TouchableOpacity
                  key={r.id}
                  activeOpacity={0.8}
                  onPress={() => navigation?.navigate?.('ReportDetail', { reportId: r.id })}
                >
                  <Card style={styles.reportCard}>
                    {r.image_url ? <Image source={{ uri: r.image_url }} style={styles.reportImg} /> : null}
                    <View style={styles.reportInfo}>
                      <View style={styles.reportHeader}>
                        <Text style={styles.reportCat}>{r.category}</Text>
                        <Badge text={r.status} color={statusColor(r.status)} />
                      </View>
                      <Text style={styles.reportDate}>{new Date(r.created_at).toLocaleDateString()}</Text>
                    </View>
                  </Card>
                </TouchableOpacity>
              ))}
            </View>
          )
        ) : (
          <View style={styles.badgeGrid}>
            {badges.map((b) => (
              <View key={b.code} style={[styles.badgeItem, !b.awarded && styles.badgeLocked]}>
                <View style={[styles.badgeIconWrap, { backgroundColor: b.awarded ? Colors.accentSoft : Colors.surfaceMuted }]}>
                  <HugeiconsIcon
                    icon={b.awarded ? iconFor(b.icon) : LockedIcon}
                    color={b.awarded ? Colors.accent : Colors.textMuted}
                    size={24}
                  />
                </View>
                <Text style={styles.badgeLabel} numberOfLines={1}>{b.name}</Text>
                {b.awarded ? (
                  <Text style={styles.badgeStatus}>UNLOCKED</Text>
                ) : (
                  <View style={styles.badgeProgressWrap}>
                    <ProgressBar value={b.progress / (b.threshold || 1)} height={4} color={Colors.textMuted} />
                    <Text style={styles.badgeProgressText}>{b.progress}/{b.threshold}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, gap: Spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.heavy, color: Colors.text },
  settingsBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  profileHero: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  profileInfo: { gap: 4 },
  profileName: { fontSize: FontSize.xl, fontWeight: FontWeight.heavy, color: Colors.text },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  statsGrid: { flexDirection: 'row', gap: Spacing.sm },
  progressCard: { gap: Spacing.md },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  progressTitle: { fontSize: FontSize.md, fontWeight: FontWeight.heavy, color: Colors.text },
  progressXp: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textSecondary },
  progressFooter: { fontSize: 10, color: Colors.textMuted, textAlign: 'center', fontWeight: FontWeight.medium },
  tabBar: {
    flexDirection: 'row', backgroundColor: Colors.surfaceMuted,
    padding: 4, borderRadius: BorderRadius.lg, gap: 4,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: BorderRadius.md },
  tabActive: { backgroundColor: Colors.surface, ...Shadow.sm },
  tabText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textSecondary },
  tabTextActive: { color: Colors.text },
  reportList: { gap: Spacing.md },
  reportCard: { flexDirection: 'row', padding: Spacing.sm, gap: Spacing.md, alignItems: 'center' },
  reportImg: { width: 56, height: 56, borderRadius: 10, backgroundColor: Colors.surfaceMuted },
  reportInfo: { flex: 1, gap: 4 },
  reportHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reportCat: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  reportDate: { fontSize: FontSize.xs, color: Colors.textMuted },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  badgeItem: { 
    flexBasis: '30%', flexGrow: 1, alignItems: 'center', gap: 6,
    backgroundColor: Colors.surface, padding: Spacing.md, borderRadius: BorderRadius.xl,
    borderWidth: 1, borderColor: Colors.border,
  },
  badgeLocked: { opacity: 0.7 },
  badgeIconWrap: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  badgeLabel: { fontSize: 10, fontWeight: FontWeight.bold, color: Colors.text, textAlign: 'center' },
  badgeStatus: { fontSize: 8, fontWeight: FontWeight.heavy, color: Colors.accent, letterSpacing: 0.5 },
  badgeProgressWrap: { width: '100%', gap: 4 },
  badgeProgressText: { fontSize: 8, color: Colors.textMuted, textAlign: 'center', fontWeight: FontWeight.bold },
});
