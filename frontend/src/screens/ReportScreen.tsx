import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, Alert, SafeAreaView, Modal,
} from 'react-native';
import {
  Cancel01Icon, MapPinIcon, AlertCircleIcon, Sent02Icon, MagicWand01Icon,
  CheckmarkCircle02Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../theme';
import { supabase, REPORT_PHOTOS_BUCKET } from '../services/supabase';
import { api, ApiError } from '../services/api';
import { useAppConfig } from '../hooks/useConfig';
import { iconFor } from '../utils/icons';
import { CopyrightFooter } from '../components/CopyrightFooter';
import { centeredScrollContent, SCREEN_MAX_WIDTH } from '../components/ScreenContent';

export default function ReportScreen({ route, navigation }: any) {
  const { config } = useAppConfig();
  const { photoUri, location } = route.params;
  const [description, setDescription] = useState('');
  const [userNote, setUserNote] = useState('');
  const [category, setCategory] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [duplicate, setDuplicate] = useState<{
    id: string;
    image_url?: string;
    description?: string;
    category?: string;
    status?: string;
    created_at?: string;
    distance?: number;
  } | null>(null);
  const [uploaded, setUploaded] = useState<{ path: string; publicUrl: string } | null>(null);

  useEffect(() => {
    if (!category && config?.categories?.length) setCategory(config.categories[0].code);
  }, [config, category]);

  const uploadPhoto = async (userId: string) => {
    const extMatch = /\.(\w+)(?:\?.*)?$/.exec(photoUri);
    const ext = (extMatch?.[1] ?? 'jpg').toLowerCase();
    const path = `${userId}/${Date.now()}.${ext}`;
    const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';
    const res = await fetch(photoUri);
    const blob = await res.blob();
    const body = await new Response(blob).arrayBuffer();

    const { error } = await supabase.storage
      .from(REPORT_PHOTOS_BUCKET)
      .upload(path, body, { contentType, upsert: false });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from(REPORT_PHOTOS_BUCKET).getPublicUrl(path);
    return { path, publicUrl };
  };

  const submitReport = async (force: boolean) => {
    if (!category) {
      Alert.alert('Category required', 'Please select a category for this issue.');
      return;
    }
    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      let asset = uploaded;
      if (!asset) {
        asset = await uploadPhoto(session.user.id);
        setUploaded(asset);
      }

      await api.createReport(
        {
          category,
          description,
          user_note: userNote.trim() || undefined,
          location: { latitude: location.latitude, longitude: location.longitude },
          image_url: asset.publicUrl,
          image_path: asset.path,
          exif_data: { timestamp: location.timestamp, accuracy: location.accuracy },
        },
        { force },
      );

      setDuplicate(null);
      setShowSuccess(true);
    } catch (error: any) {
      if (error instanceof ApiError && error.status === 409 && error.body?.detail) {
        const d = error.body.detail;
        const ex = d.existing_report || {};
        setDuplicate({
          id: d.existing_report_id,
          image_url: ex.image_url,
          description: ex.description,
          category: ex.category,
          status: ex.status,
          created_at: ex.created_at,
          distance: d.distance,
        });
        return;
      }
      const msg = error instanceof ApiError ? error.message : (error?.message || 'Unknown error');
      Alert.alert('Submission failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = () => submitReport(false);

  const confirmSameAsExisting = async () => {
    if (!duplicate) return;
    try {
      await api.addReportComment(duplicate.id, 'Confirmed by another citizen.');
    } catch { }
    setDuplicate(null);
    navigation.navigate('ReportDetail', { reportId: duplicate.id });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Submit Report</Text>
          <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
            <HugeiconsIcon icon={Cancel01Icon} color={Colors.text} size={20} />
          </TouchableOpacity>
        </View>

        <View style={styles.imageCard}>
          <Image source={{ uri: photoUri }} style={styles.image} />
          {location && (
            <View style={styles.locBadge}>
              <HugeiconsIcon icon={MapPinIcon} color="white" size={12} />
              <Text style={styles.locText}>
                {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Select Category</Text>
          <View style={styles.catGrid}>
            {config?.categories?.map((c) => {
              const active = category === c.code;
              return (
                <TouchableOpacity
                  key={c.code}
                  onPress={() => setCategory(c.code)}
                  style={[styles.catChip, active && { borderColor: Colors.accent, backgroundColor: Colors.accentSoft }]}
                >
                  <HugeiconsIcon icon={iconFor(c.icon)} color={active ? Colors.accent : Colors.textMuted} size={16} />
                  <Text style={[styles.catChipText, active && { color: Colors.accent }]}>{c.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Context (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Help our AI understand what you see..."
            placeholderTextColor={Colors.textMuted}
            multiline
            value={description}
            onChangeText={setDescription}
            underlineColorAndroid="transparent"
          />
        </View>

        <View style={styles.infoRow}>
          <HugeiconsIcon icon={MagicWand01Icon} color={Colors.accent} size={18} />
          <Text style={styles.infoText}>AI will verify your report within seconds of submission.</Text>
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, isSubmitting && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? <ActivityIndicator color="white" /> : (
            <>
              <HugeiconsIcon icon={Sent02Icon} color="white" size={20} />
              <Text style={styles.submitBtnText}>Submit Action</Text>
            </>
          )}
        </TouchableOpacity>

        <CopyrightFooter />
      </ScrollView>

      {/* Success Modal */}
      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.successCard}>
            <View style={styles.successIconWrap}>
              <HugeiconsIcon icon={CheckmarkCircle02Icon} color={Colors.success} size={56} />
            </View>
            <Text style={styles.successTitle}>Action Recorded!</Text>
            <Text style={styles.successSub}>Thank you for contributing to a better community. Our AI is verifying your report.</Text>
            <TouchableOpacity
              style={styles.successBtn}
              onPress={() => {
                setShowSuccess(false);
                navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
              }}
            >
              <Text style={styles.successBtnText}>Return Home</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Duplicate Modal */}
      <Modal visible={!!duplicate} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.dupCard}>
            <View style={styles.dupHeader}>
              <HugeiconsIcon icon={AlertCircleIcon} color={Colors.warning} size={24} />
              <Text style={styles.dupTitle}>Nearby Report Found</Text>
            </View>
            <Text style={styles.dupSub}>A similar issue was reported {duplicate?.distance ? `${Math.round(duplicate.distance)}m` : 'nearby'} recently. Is this the same issue?</Text>

            {duplicate?.image_url && <Image source={{ uri: duplicate.image_url }} style={styles.dupImg} />}

            <TouchableOpacity style={styles.dupPrimaryBtn} onPress={confirmSameAsExisting}>
              <Text style={styles.dupPrimaryText}>It's the same — Confirm</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dupSecondaryBtn} onPress={() => submitReport(true)}>
              <Text style={styles.dupSecondaryText}>It's different — Submit Anyway</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dupCancel} onPress={() => setDuplicate(null)}>
              <Text style={styles.dupCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { ...centeredScrollContent, gap: Spacing.lg, paddingBottom: Spacing.xxl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.heavy, color: Colors.text, letterSpacing: -0.4 },
  closeBtn: { width: 40, height: 40, borderRadius: BorderRadius.sm, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border, ...Shadow.sm },
  imageCard: { width: '100%', height: 280, borderRadius: BorderRadius.lg, overflow: 'hidden', ...Shadow.md },
  image: { width: '100%', height: '100%' },
  locBadge: { position: 'absolute', bottom: 12, left: 12, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.round },
  locText: { color: 'white', fontSize: 10, fontWeight: FontWeight.bold },
  section: { gap: Spacing.sm },
  sectionLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.text },
  catGrid: { flexDirection: 'row', gap: 12 },
  catChip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface },
  catChipText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textMuted },
  input: {
    backgroundColor: Colors.surface, padding: Spacing.md, borderRadius: BorderRadius.lg,
    color: Colors.text, fontSize: FontSize.md, minHeight: 80, textAlignVertical: 'top',
    borderWidth: 1, borderColor: Colors.border,
    // @ts-ignore
    outlineStyle: 'none',
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.accentSoft, padding: Spacing.md, borderRadius: BorderRadius.lg },
  infoText: { flex: 1, fontSize: 12, color: Colors.accent, fontWeight: FontWeight.bold, lineHeight: 18 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: Colors.primary, height: 54, borderRadius: BorderRadius.lg, ...Shadow.md },
  submitBtnText: { color: 'white', fontSize: FontSize.lg, fontWeight: FontWeight.heavy },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  successCard: {
    width: '100%',
    maxWidth: SCREEN_MAX_WIDTH,
    backgroundColor: 'white',
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  successIconWrap: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: `${Colors.success}15`,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  successTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.heavy, color: Colors.text },
  successSub: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  successBtn: { backgroundColor: Colors.accent, paddingHorizontal: 32, paddingVertical: 14, borderRadius: BorderRadius.lg, marginTop: Spacing.md },
  successBtnText: { color: 'white', fontWeight: FontWeight.heavy, fontSize: FontSize.md },
  dupCard: {
    width: '100%',
    maxWidth: SCREEN_MAX_WIDTH,
    backgroundColor: 'white',
    borderRadius: BorderRadius.xxl,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  dupHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dupTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.heavy, color: Colors.text },
  dupSub: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  dupImg: { width: '100%', height: 160, borderRadius: BorderRadius.lg, backgroundColor: Colors.surfaceMuted },
  dupPrimaryBtn: { backgroundColor: Colors.primary, height: 52, borderRadius: BorderRadius.lg, alignItems: 'center', justifyContent: 'center' },
  dupPrimaryText: { color: 'white', fontWeight: FontWeight.bold },
  dupSecondaryBtn: { height: 52, borderRadius: BorderRadius.lg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  dupSecondaryText: { color: Colors.text, fontWeight: FontWeight.bold },
  dupCancel: { alignItems: 'center', paddingVertical: 8 },
  dupCancelText: { color: Colors.textMuted, fontSize: FontSize.sm, fontWeight: FontWeight.bold },
});