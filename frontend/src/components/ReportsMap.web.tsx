import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import type { Report } from '../services/types';
import { loadLeaflet, pinIcon, OSM_TILES, escapeHtml } from '../lib/leaflet.web';
import { pinColor } from '../lib/mapPins';
import { Colors, BorderRadius, FontSize, FontWeight } from '../theme';

type Props = {
  reports: Report[];
  height?: number;
  onSelectReport?: (id: string) => void;
};

export default function ReportsMap({ reports, height = 280, onSelectReport }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const points = useMemo(
    () => reports.filter(
      (r) => typeof r.location?.latitude === 'number' && typeof r.location?.longitude === 'number',
    ),
    [reports],
  );

  useEffect(() => {
    let cancelled = false;
    loadLeaflet()
      .then(() => {
        if (cancelled || !containerRef.current || !window.L) return;
        const L = window.L;
        if (!mapRef.current) {
          mapRef.current = L.map(containerRef.current, {
            center: [12.9716, 77.5946],
            zoom: 12,
            scrollWheelZoom: true,
          });
          L.tileLayer(OSM_TILES.url, { attribution: OSM_TILES.attribution, maxZoom: 19 }).addTo(mapRef.current);
        }
        setReady(true);
      })
      .catch((e: Error) => {
        if (!cancelled) {
          setError(e.message);
        }
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!ready || !mapRef.current || !window.L) return;
    const L = window.L;
    if (layerRef.current) {
      layerRef.current.remove();
      layerRef.current = null;
    }
    if (points.length === 0) return;

    const groups = new Map<string, Report[]>();
    points.forEach((r) => {
      const key = `${r.location.latitude.toFixed(5)},${r.location.longitude.toFixed(5)}`;
      const arr = groups.get(key) ?? [];
      arr.push(r);
      groups.set(key, arr);
    });

    const layer = L.layerGroup();
    const latlngs: [number, number][] = [];

    groups.forEach((bucket) => {
      bucket.forEach((r, i) => {
        let lat = r.location.latitude;
        let lng = r.location.longitude;
        if (bucket.length > 1) {
          const angle = (2 * Math.PI * i) / bucket.length;
          lat += 0.00008 * Math.cos(angle);
          lng += (0.00008 * Math.sin(angle)) / Math.max(Math.cos((lat * Math.PI) / 180), 0.1);
        }
        latlngs.push([lat, lng]);
        const color = pinColor(r.status);
        const marker = L.marker([lat, lng], { icon: pinIcon(L, color, r.id) });
        const html = `<div style="font-family:system-ui;min-width:180px">
          <div style="font-weight:600;font-size:13px">${escapeHtml(r.category)}</div>
          <div style="font-size:11px;color:#64748b;margin:4px 0">${escapeHtml(r.address || '')}</div>
          <div style="display:inline-block;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:600;color:#fff;background:${color}">${escapeHtml(r.status)}</div>
        </div>`;
        marker.bindPopup(html);
        marker.on('click', () => onSelectReport?.(r.id));
        marker.addTo(layer);
      });
    });

    layer.addTo(mapRef.current);
    layerRef.current = layer;
    if (latlngs.length === 1) mapRef.current.setView(latlngs[0], 15);
    else mapRef.current.fitBounds(latlngs, { padding: [36, 36] });
  }, [points, ready, onSelectReport]);

  if (error) {
    return (
      <View style={[styles.wrap, { height }]}>
        <Text style={styles.err}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.wrap, { height }]}>
      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: BorderRadius.lg,
          overflow: 'hidden',
          border: `1px solid ${Colors.border}`,
        }}
      />
      {!ready ? (
        <View style={styles.loading}>
          <ActivityIndicator color={Colors.primary} />
          <Text style={styles.loadingText}>Loading map…</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative', width: '100%', borderRadius: BorderRadius.lg, overflow: 'hidden' },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(248,250,252,0.9)',
  },
  loadingText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  err: { padding: 16, color: Colors.danger, fontSize: FontSize.sm },
});
