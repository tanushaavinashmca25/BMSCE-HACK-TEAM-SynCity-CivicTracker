import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList, RefreshControl,
  TouchableOpacity, Image, ActivityIndicator, PanResponder, Animated,
} from 'react-native';
import * as Location from 'expo-location';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  MapPinIcon, AlertCircleIcon, CheckmarkCircle02Icon, Shield01Icon,
} from '@hugeicons/core-free-icons';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../theme';
import { api } from '../services/api';
import type { Report, WardReports } from '../services/types';
import { Card, EmptyState } from '../components/UI';
import { CopyrightFooter } from '../components/CopyrightFooter';
import { ScreenContent } from '../components/ScreenContent';

const PENDING_STATUSES = new Set([
  'Reported', 'Pending Review', 'Verified', 'Assigned', 'In-Progress',
]);
const RESOLVED_STATUSES = new Set(['Resolved']);

type Tab = 'pending' | 'resolved';

const statusColor = (s: string) => {
  if (RESOLVED_STATUSES.has(s)) return Colors.success;
  if (s === 'Rejected') return Colors.danger;
  if (s === 'In-Progress' || s === 'Assigned') return Colors.info;
  if (s === 'Pending Review') return Colors.warning;
  return Colors.primary;
};

export default function WardScreen({
  navigation,
  active = true,
}: { navigation?: any; active?: boolean }) {
  const [data, setData] = useState<WardReports | null>(null);
  const [tab, setTab] = useState<Tab>('pending');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  // Persistent: committed radius drives the fetch. Draft: what the slider shows
  // while the user is dragging, so we don't re-fetch on every pixel of movement.
  const [radius, setRadius] = useState(2000);
  const [draftRadius, setDraftRadius] = useState(2000);

  const fetchFor = useCallback(async (lat: number, lng: number, r: number) => {
    try {
      setErr(null);
      const res = await api.wardReports(lat, lng, r);
      setData(res);
    } catch (e: any) {
      setErr(e?.message || 'Could not load ward reports');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const load = useCallback(async () => {
    try {
      let here = coords;
      if (!here) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErr('Location permission is needed to load your ward.');
          setLoading(false);
          return;
        }
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        here = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(here);
      }
      await fetchFor(here.lat, here.lng, radius);
    } catch (e: any) {
      setErr(e?.message || 'Could not load ward reports');
      setLoading(false);
      setRefreshing(false);
    }
  }, [coords, radius, fetchFor]);

  useEffect(() => { if (active) load(); }, [active, load]);

  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, [load]);

  const onRadiusCommit = useCallback((value: number) => {
    const next = Math.round(value);
    setRadius(next);
    if (coords) {
      setLoading(true);
      fetchFor(coords.lat, coords.lng, next);
    }
  }, [coords, fetchFor]);

  const allReports = data?.reports || [];
  const pending = allReports.filter((r) => PENDING_STATUSES.has(r.status));
  const resolved = allReports.filter((r) => RESOLVED_STATUSES.has(r.status));
  const shown = tab === 'pending' ? pending : resolved;

  const wardLabel = data?.ward?.ward_name
    || (data?.fallback ? 'Around you' : (data?.ward ? 'Your ward' : 'Around you'));
  const fmtRadius = (m: number) => (m >= 1000 ? `${(m / 1000).toFixed(m % 1000 === 0 ? 0 : 1)} km` : `${m} m`);

  if (loading && !data) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenContent>
      <View style={styles.headerRow}>
        <View style={styles.headerIcon}>
          <HugeiconsIcon icon={Shield01Icon} color={Colors.primary} size={24} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Your ward</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <HugeiconsIcon icon={MapPinIcon} color={Colors.textSecondary} size={12} />
            <Text style={styles.subtitle} numberOfLines={1}>
              {wardLabel}
              {data?.fallback ? ` · ${fmtRadius(radius)} radius` : ''}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.sliderRow}>
        <View style={styles.sliderHeader}>
          <Text style={styles.sliderLabel}>Search radius</Text>
          <Text style={styles.sliderValue}>{fmtRadius(draftRadius)}</Text>
        </View>
        <RadiusSlider
          min={200}
          max={10000}
          step={100}
          initial={radius}
          onChange={setDraftRadius}
          onCommit={onRadiusCommit}
        />
        <View style={styles.sliderTicks}>
          <Text style={styles.sliderTickText}>200 m</Text>
          <Text style={styles.sliderTickText}>10 km</Text>
        </View>
      </View>

      <View style={styles.tabBar}>
        <TabBtn
          label="Pending"
          count={pending.length}
          active={tab === 'pending'}
          onPress={() => setTab('pending')}
          icon={AlertCircleIcon}
          accent={Colors.warning}
        />
        <TabBtn
          label="Resolved"
          count={resolved.length}
          active={tab === 'resolved'}
          onPress={() => setTab('resolved')}
          icon={CheckmarkCircle02Icon}
          accent={Colors.success}
        />
      </View>

      {err ? (
        <Card style={{ margin: Spacing.lg }}>
          <EmptyState title="Couldn't load" subtitle={err} icon={AlertCircleIcon} />
        </Card>
      ) : (
        <FlatList
          data={shown}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
          }
          ListEmptyComponent={
            <Card>
              <EmptyState
                title={tab === 'pending' ? 'Nothing pending here' : 'No resolutions yet'}
                subtitle={
                  tab === 'pending'
                    ? 'Your area is clear — for now.'
                    : 'Once nearby reports are marked resolved, they show up here.'
                }
                icon={tab === 'pending' ? CheckmarkCircle02Icon : AlertCircleIcon}
              />
            </Card>
          }
          renderItem={({ item }) => (
            <ReportRow report={item} onPress={() => navigation?.navigate('ReportDetail', { reportId: item.id })} />
          )}
          ListFooterComponent={<CopyrightFooter />}
        />
      )}
      </ScreenContent>
    </SafeAreaView>
  );
}

function TabBtn({
  label, count, active, onPress, icon, accent,
}: {
  label: string; count: number; active: boolean; onPress: () => void; icon: any; accent: string;
}) {
  return (
    <TouchableOpacity
      style={[styles.tabBtn, active && { backgroundColor: `${accent}1A`, borderColor: accent }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <HugeiconsIcon icon={icon} color={active ? accent : Colors.textMuted} size={16} />
      <Text style={[styles.tabBtnLabel, active && { color: accent }]}>{label}</Text>
      <View style={[styles.countBadge, active && { backgroundColor: accent }]}>
        <Text style={[styles.countBadgeText, active && { color: 'white' }]}>{count}</Text>
      </View>
    </TouchableOpacity>
  );
}

function ReportRow({ report, onPress }: { report: Report; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <Card style={styles.row}>
        {report.image_url ? (
          <Image source={{ uri: report.image_url }} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder]}>
            <HugeiconsIcon icon={AlertCircleIcon} color={Colors.textMuted} size={18} />
          </View>
        )}
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={styles.rowTitle} numberOfLines={1}>{report.category}</Text>
          {report.description ? (
            <Text style={styles.rowDesc} numberOfLines={2}>{report.description}</Text>
          ) : report.address ? (
            <Text style={styles.rowDesc} numberOfLines={1}>{report.address}</Text>
          ) : null}
          <View style={styles.rowMeta}>
            <View style={[styles.statusDot, { backgroundColor: statusColor(report.status) }]} />
            <Text style={[styles.statusText, { color: statusColor(report.status) }]}>{report.status}</Text>
            <Text style={styles.metaDivider}>·</Text>
            <Text style={styles.metaText}>{timeAgo(report.created_at)}</Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const THUMB = 24;

function RadiusSlider({
  min, max, step, initial, onChange, onCommit,
}: {
  min: number; max: number; step: number; initial: number;
  onChange: (v: number) => void;
  onCommit: (v: number) => void;
}) {
  const trackRef = React.useRef<View>(null);
  const trackPageX = React.useRef(0);
  const trackWidth = React.useRef(0);
  const animX = React.useRef(new Animated.Value(0)).current;
  const lastValue = React.useRef(initial);
  const rafScheduled = React.useRef(false);

  const snap = (raw: number) => {
    const c = Math.max(min, Math.min(max, raw));
    return Math.round(c / step) * step;
  };

  const setFromPageX = (pageX: number, commit: boolean) => {
    const w = trackWidth.current;
    if (w <= 0) return;
    const x = Math.max(0, Math.min(w, pageX - trackPageX.current));
    animX.setValue(x);                       // native-driven visual update (no React render)
    const v = snap(min + (x / w) * (max - min));
    if (v !== lastValue.current) {
      lastValue.current = v;
      // Throttle the label update to one per frame so the parent doesn't render at 60fps.
      if (!rafScheduled.current) {
        rafScheduled.current = true;
        requestAnimationFrame(() => {
          rafScheduled.current = false;
          onChange(lastValue.current);
        });
      }
    }
    if (commit) onCommit(v);
  };

  const responder = React.useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: (e) => setFromPageX(e.nativeEvent.pageX, false),
    onPanResponderMove: (e) => setFromPageX(e.nativeEvent.pageX, false),
    onPanResponderRelease: () => onCommit(lastValue.current),
    onPanResponderTerminate: () => onCommit(lastValue.current),
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), []);

  const measureTrack = React.useCallback(() => {
    trackRef.current?.measure((_x, _y, w, _h, pageX) => {
      trackWidth.current = w;
      trackPageX.current = pageX;
      const p = (lastValue.current - min) / (max - min);
      animX.setValue(p * w);
    });
  }, [min, max, animX]);

  // Re-measure if `initial` changes externally (e.g. parent committed a new radius).
  React.useEffect(() => {
    lastValue.current = initial;
    measureTrack();
  }, [initial, measureTrack]);

  return (
    <View
      ref={trackRef}
      onLayout={measureTrack}
      style={sliderStyles.trackHit}
      {...responder.panHandlers}
    >
      <View style={sliderStyles.track}>
        <Animated.View style={[sliderStyles.fill, { width: animX }]} />
      </View>
      <Animated.View
        style={[
          sliderStyles.thumb,
          { transform: [{ translateX: Animated.subtract(animX, THUMB / 2) }] },
        ]}
      />
    </View>
  );
}

const sliderStyles = StyleSheet.create({
  trackHit: { height: 36, justifyContent: 'center' },
  track: {
    height: 6, borderRadius: 3,
    backgroundColor: Colors.border,
    overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: Colors.primary },
  thumb: {
    position: 'absolute',
    left: 0,
    width: THUMB, height: THUMB, borderRadius: THUMB / 2,
    backgroundColor: Colors.primary,
    top: (36 - THUMB) / 2,
    ...Shadow.md,
  },
});

function timeAgo(iso: string) {
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const day = Math.floor(h / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(iso).toLocaleDateString();
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { alignItems: 'center', justifyContent: 'center' },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.sm,
  },
  headerIcon: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.heavy, color: Colors.text },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, flexShrink: 1 },
  sliderRow: {
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.xs, paddingBottom: 4,
  },
  sliderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  sliderLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.semibold },
  sliderValue: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.heavy },
  sliderTicks: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -4 },
  sliderTickText: { fontSize: 10, color: Colors.textMuted },
  tabBar: {
    flexDirection: 'row', gap: Spacing.sm,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
  },
  tabBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: BorderRadius.round,
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
  },
  tabBtnLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textSecondary },
  countBadge: {
    minWidth: 22, paddingHorizontal: 6, paddingVertical: 1,
    borderRadius: BorderRadius.round, backgroundColor: Colors.surfaceMuted,
    alignItems: 'center', justifyContent: 'center',
  },
  countBadgeText: { fontSize: 11, fontWeight: FontWeight.heavy, color: Colors.textSecondary },
  listContent: { padding: Spacing.lg, gap: Spacing.sm, paddingBottom: 140 },
  row: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center', padding: Spacing.sm + 2 },
  thumb: {
    width: 64, height: 64, borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceMuted,
  },
  thumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  rowDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 18 },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  metaDivider: { fontSize: FontSize.xs, color: Colors.textMuted },
  metaText: { fontSize: FontSize.xs, color: Colors.textMuted },
});