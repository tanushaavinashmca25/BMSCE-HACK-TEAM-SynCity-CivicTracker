import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Animated, Easing } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import * as Location from 'expo-location';
import { Cancel01Icon, Location01Icon, Camera01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../theme';

export default function CameraScreen({ navigation }: any) {
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number; acc: number | null } | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef<Camera>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
      if (!hasPermission) await requestPermission();
    })();

    // Warm up HF Space
    const url = process.env.EXPO_PUBLIC_YOLO_URL;
    if (url) {
      fetch(url, { method: 'GET' }).catch(() => {});
    }
  }, [hasPermission, requestPermission]);

  useEffect(() => {
    if (!locationPermission) return;
    let sub: Location.LocationSubscription | undefined;
    let cancelled = false;
    (async () => {
      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 1, timeInterval: 1000 },
        (loc) => {
          if (cancelled) return;
          setCoords({
            lat: loc.coords.latitude,
            lng: loc.coords.longitude,
            acc: loc.coords.accuracy ?? null,
          });
        },
      );
    })();
    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, [locationPermission]);

  if (!hasPermission || !device) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={Colors.primary} size="large" />
        <Text style={{ color: 'white', marginTop: 16, fontSize: FontSize.sm }}>
          {!hasPermission ? 'Waiting for camera permission…' : 'Starting camera…'}
        </Text>
      </View>
    );
  }

  const takePicture = async () => {
    if (isCapturing || !cameraRef.current) return;
    setIsCapturing(true);
    try {
      const live = coords;
      const loc = live
        ? { latitude: live.lat, longitude: live.lng, accuracy: live.acc ?? 0, timestamp: Date.now() }
        : await (async () => {
            const l = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
            return {
              latitude: l.coords.latitude,
              longitude: l.coords.longitude,
              accuracy: l.coords.accuracy ?? 0,
              timestamp: l.timestamp,
            };
          })();

      const photo = await cameraRef.current.takePhoto({
        flash: 'off',
        enableShutterSound: true,
      });

      navigation.navigate('Report', {
        photoUri: `file://${photo.path}`,
        location: loc,
      });
    } catch (error) {
      Alert.alert('Capture failed', 'Ensure the camera has focus and try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        photo={true}
      />

      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <HugeiconsIcon icon={Cancel01Icon} color="white" size={24} />
        </TouchableOpacity>
        <GpsBadge active={!!locationPermission} coords={coords} />
      </View>

      <View style={styles.overlay}>
        <View style={styles.guideBox}>
          <Text style={styles.guideTitle}>Mission: Precise Evidence</Text>
          <Text style={styles.guideSub}>Align the issue in view. High accuracy GPS required.</Text>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.captureBtn, (isCapturing || !locationPermission) && styles.captureBtnDisabled]}
            onPress={takePicture}
            disabled={isCapturing || !locationPermission}
          >
            {isCapturing ? (
              <ActivityIndicator color={Colors.accent} size="large" />
            ) : (
              <View style={styles.captureInner} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function GpsBadge({ active, coords }: { active: boolean; coords: any }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) return;
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ]),
    ).start();
  }, [active, pulse]);

  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });

  return (
    <View style={[styles.gpsBadge, !active && styles.gpsBadgeOff]}>
      <Animated.View style={[styles.gpsDot, { opacity }, !active && { backgroundColor: Colors.danger, opacity: 1 }]} />
      <Text style={styles.gpsText}>
        {active ? (coords ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : 'LOCATING...') : 'GPS OFFLINE'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  header: { 
    position: 'absolute', top: 60, left: 24, right: 24, 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 10,
  },
  closeBtn: { 
    width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(15,23,42,0.6)', 
    alignItems: 'center', justifyContent: 'center',
  },
  gpsBadge: { 
    flexDirection: 'row', alignItems: 'center', gap: 8, 
    backgroundColor: 'rgba(15,23,42,0.8)', paddingHorizontal: 12, paddingVertical: 8, 
    borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.accent,
  },
  gpsBadgeOff: { borderColor: Colors.danger },
  gpsDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.accent },
  gpsText: { color: 'white', fontSize: 10, fontWeight: FontWeight.heavy, letterSpacing: 0.5 },
  overlay: { position: 'absolute', bottom: 40, left: 0, right: 0, alignItems: 'center', gap: 32 },
  guideBox: { alignItems: 'center', gap: 4, backgroundColor: 'rgba(15,23,42,0.6)', paddingHorizontal: 20, paddingVertical: 12, borderRadius: BorderRadius.lg },
  guideTitle: { color: 'white', fontSize: FontSize.sm, fontWeight: FontWeight.heavy, textTransform: 'uppercase', letterSpacing: 1 },
  guideSub: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: FontWeight.medium },
  controls: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'white' },
  captureBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' },
  captureBtnDisabled: { opacity: 0.5 },
  captureInner: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: Colors.primary },
});
