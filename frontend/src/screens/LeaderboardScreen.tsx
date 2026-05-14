import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { AwardIcon, Fire03Icon, ChampionIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../theme';
import { api } from '../services/api';
import type { LeaderboardEntry } from '../services/types';
import { Avatar, Card, EmptyState, Badge } from '../components/UI';

const medalFor = (rank: number) => {
  if (rank === 1) return { color: '#F59E0B', label: '🥇' };
  if (rank === 2) return { color: '#94A3B8', label: '🥈' };
  if (rank === 3) return { color: '#B45309', label: '🥉' };
  return null;
};

export default function LeaderboardScreen({ active = true }: { active?: boolean } = {}) {
  const [rows, setRows] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setErr(null);
      const data = await api.leaderboard(50);
      setRows(data);
    } catch (e: any) {
      setErr(e?.message || 'Could not load leaderboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { if (active) load(); }, [active, load]);

  const top3 = rows.slice(0, 3);
  const rest = rows.slice(3);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.accent} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Civic Rankings</Text>
          <Text style={styles.subtitle}>Top citizens driving change in our society</Text>
        </View>

        {loading && rows.length === 0 ? (
          <View style={{ paddingVertical: Spacing.xxl }}>
            <ActivityIndicator color={Colors.accent} />
          </View>
        ) : err ? (
          <Card><EmptyState title="Sync failed" subtitle={err} /></Card>
        ) : rows.length === 0 ? (
          <Card><EmptyState title="No rankings" subtitle="Be the first to report and lead the board." /></Card>
        ) : (
          <>
            {top3.length > 0 && (
              <View style={styles.podium}>
                {[top3[1], top3[0], top3[2]].filter(Boolean).map((entry, idx) => {
                  const isWinner = entry.rank === 1;
                  return (
                    <View key={entry.user_id} style={[styles.podiumCol, isWinner && styles.winnerCol]}>
                      <Avatar name={entry.display_name} size={isWinner ? 64 : 48} color={Colors.accent} />
                      <Text style={styles.podiumName} numberOfLines={1}>{entry.display_name}</Text>
                      <Text style={styles.podiumXp}>{entry.xp_total} XP</Text>
                      <View style={[styles.podiumBar, { height: isWinner ? 120 : 80, backgroundColor: isWinner ? Colors.primary : Colors.surfaceMuted }]}>
                        <Text style={[styles.podiumRank, { color: isWinner ? 'white' : Colors.textMuted }]}>#{entry.rank}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            <View style={styles.list}>
              {rest.map((entry) => {
                const medal = medalFor(entry.rank);
                return (
                  <View key={entry.user_id} style={styles.row}>
                    <Text style={[styles.rank, medal && { color: medal.color }]}>
                      {medal ? medal.label : entry.rank}
                    </Text>
                    <Avatar name={entry.display_name} size={40} color={Colors.accent} />
                    <View style={styles.rowInfo}>
                      <Text style={styles.name} numberOfLines={1}>{entry.display_name}</Text>
                      <Text style={styles.level}>{entry.level.name}</Text>
                    </View>
                    <View style={styles.rowStats}>
                      <Text style={styles.xp}>{entry.xp_total} XP</Text>
                      <View style={styles.metrics}>
                        {entry.streak_count > 0 && (
                          <View style={styles.metric}>
                            <HugeiconsIcon icon={Fire03Icon} color={Colors.accent} size={10} />
                            <Text style={styles.metricVal}>{entry.streak_count}</Text>
                          </View>
                        )}
                        {entry.reports_resolved > 0 && (
                          <View style={styles.metric}>
                            <HugeiconsIcon icon={ChampionIcon} color={Colors.info} size={10} />
                            <Text style={styles.metricVal}>{entry.reports_resolved}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}
        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, gap: Spacing.lg },
  header: { gap: 4 },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.heavy, color: Colors.text },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  podium: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: Spacing.md, marginTop: Spacing.md },
  podiumCol: { alignItems: 'center', flex: 1, gap: 4 },
  winnerCol: { transform: [{ translateY: -10 }] },
  podiumName: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.text, marginTop: 4 },
  podiumXp: { fontSize: 10, color: Colors.textMuted, fontWeight: FontWeight.heavy },
  podiumBar: { 
    width: '100%', borderTopLeftRadius: BorderRadius.lg, borderTopRightRadius: BorderRadius.lg,
    alignItems: 'center', justifyContent: 'flex-start', paddingTop: 12,
  },
  podiumRank: { fontWeight: FontWeight.heavy, fontSize: FontSize.lg },
  list: { gap: Spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surface, padding: Spacing.md, borderRadius: BorderRadius.xl, borderWidth: 1, borderColor: Colors.border },
  rank: { width: 28, textAlign: 'center', fontWeight: FontWeight.heavy, color: Colors.textMuted, fontSize: FontSize.sm },
  rowInfo: { flex: 1, gap: 2 },
  name: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  level: { fontSize: 10, fontWeight: FontWeight.bold, color: Colors.textMuted, textTransform: 'uppercase' },
  rowStats: { alignItems: 'flex-end', gap: 4 },
  xp: { fontSize: FontSize.sm, fontWeight: FontWeight.heavy, color: Colors.primary },
  metrics: { flexDirection: 'row', gap: 8 },
  metric: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: Colors.surfaceMuted, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  metricVal: { fontSize: 9, fontWeight: FontWeight.heavy, color: Colors.textSecondary },
});
