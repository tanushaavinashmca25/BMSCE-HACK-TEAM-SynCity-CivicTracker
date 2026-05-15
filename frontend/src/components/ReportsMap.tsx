import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking,
} from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { MapPinIcon } from '@hugeicons/core-free-icons';
import type { Report } from '../services/types';
import { pinColor } from '../lib/mapPins';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../theme';

type Props = {
  reports: Report[];
  height?: number;
  onSelectReport?: (id: string) => void;
};

/** Native fallback: pin list with open-in-maps links (full map on web). */
export default function ReportsMap({ reports, height = 280, onSelectReport }: Props) {
  const points = reports.filter(
    (r) => typeof r.location?.latitude === 'number' && typeof r.location?.longitude === 'number',
  );

  if (points.length === 0) {
    return (
      <View style={[styles.wrap, { height }]}>
        <Text style={styles.empty}>No geolocated reports yet.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.wrap, { height }]}>
      <View style={styles.header}>
        <HugeiconsIcon icon={MapPinIcon} color={Colors.primary} size={18} />
        <Text style={styles.headerText}>{points.length} issues on map</Text>
        <Text style={styles.hint}>Use web for full map view</Text>
      </View>
      <ScrollView style={styles.list} nestedScrollEnabled>
        {points.slice(0, 12).map((r) => (
          <TouchableOpacity
            key={r.id}
            style={styles.row}
            onPress={() => onSelectReport?.(r.id)}
            activeOpacity={0.85}
          >
            <View style={[styles.dot, { backgroundColor: pinColor(r.status) }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{r.category}</Text>
              <Text style={styles.sub} numberOfLines={1}>{r.status} · {r.address || 'Nearby'}</Text>
            </View>
            <TouchableOpacity
              onPress={() => Linking.openURL(
                `https://www.google.com/maps?q=${r.location.latitude},${r.location.longitude}`,
              )}
              hitSlop={8}
            >
              <Text style={styles.mapsLink}>Maps</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerText: { flex: 1, fontWeight: FontWeight.semibold, color: Colors.text, fontSize: FontSize.sm },
  hint: { fontSize: 10, color: Colors.textMuted },
  list: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  title: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.text },
  sub: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  mapsLink: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.primary },
  empty: { padding: Spacing.lg, textAlign: 'center', color: Colors.textMuted, fontSize: FontSize.sm },
});
