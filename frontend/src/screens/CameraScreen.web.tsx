import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  Cancel01Icon, Camera01Icon, Location01Icon,
} from '@hugeicons/core-free-icons';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../theme';
import { supabase } from '../services/supabase';
import { CopyrightFooter } from '../components/CopyrightFooter';
import { ScreenContent } from '../components/ScreenContent';

export default function CameraScreen({ navigation }: any) {
  const [coords, setCoords] = useState<{ lat: number; lng: number; acc: number | null } | null>(null);
  const [locDenied, setLocDenied] = useState(false);
  const [busy, setBusy] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigation.replace('Auth');
    });
  }, [navigation]);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocDenied(true);
      return;
    }
    const id = navigator.geolocation.watchPosition(
      (pos) => setCoords({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        acc: pos.coords.accuracy ?? null,
      }),
      () => setLocDenied(true),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 },
    );

    const url = process.env.EXPO_PUBLIC_YOLO_URL;
    if (url) {
      fetch(url, { method: 'GET' }).catch(() => {});
    }

    return () => navigator.geolocation.clearWatch(id);
  }, []);

  const getLocationNow = (): Promise<{ latitude: number; longitude: number; accuracy: number; timestamp: number }> =>
    new Promise((resolve, reject) => {
      if (coords) {
        resolve({
          latitude: coords.lat,
          longitude: coords.lng,
          accuracy: coords.acc ?? 0,
          timestamp: Date.now(),
        });
        return;
      }
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not available in this browser.'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy ?? 0,
          timestamp: pos.timestamp,
        }),
        (e) => reject(new Error(e.message || 'Could not get location')),
        { enableHighAccuracy: true, timeout: 15000 },
      );
    });

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      const loc = await getLocationNow();
      const photoUri = URL.createObjectURL(file);
      navigation.navigate('Report', { photoUri, location: loc });
    } catch (e: any) {
      alert(e?.message || 'Could not get GPS — please allow location and retry.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenContent style={styles.column}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
            <HugeiconsIcon icon={Cancel01Icon} color="white" size={22} />
          </TouchableOpacity>
          <GpsBadge coords={coords} denied={locDenied} />
        </View>

        <View style={styles.center}>
          <View style={styles.iconBubble}>
            <HugeiconsIcon icon={Camera01Icon} color="white" size={36} />
          </View>
          <Text style={styles.title}>Capture an issue</Text>
          <Text style={styles.subtitle}>
            Take a photo of the issue. We attach your GPS coordinates automatically.
          </Text>

          {/* @ts-ignore */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
            onChange={(e: any) => handleFile(e.target.files?.[0])}
          />

          <TouchableOpacity
            style={[styles.primaryBtn, (busy || locDenied) && styles.btnDisabled]}
            onPress={() => cameraInputRef.current?.click()}
            disabled={busy || locDenied}
          >
            {busy ? <ActivityIndicator color="white" /> : (
              <>
                <HugeiconsIcon icon={Camera01Icon} color="white" size={18} />
                <Text style={styles.primaryBtnText}>Take photo</Text>
              </>
            )}
          </TouchableOpacity>

          {locDenied ? (
            <Text style={styles.warn}>
              Location permission is required. Enable it in your browser and reload.
            </Text>
          ) : null}
        </View>

        <View style={styles.footer}>
          <CopyrightFooter variant="dark" compact />
        </View>
      </ScreenContent>
    </View>
  );
}

function GpsBadge({
  coords, denied,
}: { coords: { lat: number; lng: number; acc: number | null } | null; denied: boolean }) {
  const offline = denied;
  return (
    <View style={[styles.gpsBadge, offline && styles.gpsBadgeOff]}>
      <HugeiconsIcon
        icon={Location01Icon}
        color={offline ? Colors.danger : (coords ? Colors.accent : Colors.warning)}
        size={12}
      />
      <Text style={styles.gpsText}>
        {offline ? 'GPS OFFLINE' : coords ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : 'LOCATING…'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  column: { paddingHorizontal: Spacing.lg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gpsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  gpsBadgeOff: { borderColor: Colors.danger },
  gpsText: { color: 'white', fontSize: 10, fontWeight: FontWeight.heavy, letterSpacing: 0.5 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.md,
  },
  iconBubble: {
    width: 84,
    height: 84,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.lg,
  },
  title: { color: 'white', fontSize: FontSize.xxl, fontWeight: FontWeight.heavy, marginTop: Spacing.sm },
  subtitle: { color: 'rgba(255,255,255,0.7)', fontSize: FontSize.md, textAlign: 'center', maxWidth: 360, lineHeight: 22 },
  primaryBtn: {
    marginTop: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minWidth: 220,
    height: 52,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary,
    ...Shadow.lg,
  },
  primaryBtnText: { color: 'white', fontWeight: FontWeight.bold, fontSize: FontSize.md },
  btnDisabled: { opacity: 0.5 },
  warn: {
    color: '#FCA5A5',
    fontSize: FontSize.sm,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  footer: {
    paddingBottom: Spacing.lg,
    alignItems: 'center',
  },
});
