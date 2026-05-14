import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, Image, TextInput,
  TouchableOpacity, ActivityIndicator, Alert, RefreshControl, KeyboardAvoidingView, Platform,
} from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  Cancel01Icon, MapPinIcon, SentIcon, Message01Icon, Note01Icon,
  CheckmarkCircle02Icon, AlertCircleIcon, ShieldIcon, UserIcon,
} from '@hugeicons/core-free-icons';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../theme';
import { api, ApiError } from '../services/api';
import type { Report, ReportUpdate } from '../services/types';
import { Card, Badge, EmptyState, Avatar } from '../components/UI';

const statusColor = (s?: string | null) => {
  switch (s) {
    case 'Resolved':
    case 'Verified': return Colors.success;
    case 'In-Progress':
    case 'Assigned': return Colors.info;
    case 'Pending Review': return Colors.warning;
    default: return Colors.primary;
  }
};

const fmtTime = (iso: string) => {
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch { return iso; }
};

export default function ReportDetailScreen({ route, navigation }: any) {
  const { reportId } = route.params;
  const [report, setReport] = useState<Report | null>(null);
  const [updates, setUpdates] = useState<ReportUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try {
      const [r, u] = await Promise.all([
        api.getReport(reportId),
        api.reportUpdates(reportId).catch(() => [] as ReportUpdate[]),
      ]);
      setReport(r);
      setUpdates(u);
    } catch (e: any) {
      Alert.alert('Could not load report', e?.message || 'Unknown error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [reportId]);

  useEffect(() => { load(); }, [load]);

  const sendNote = async () => {
    const text = note.trim();
    if (!text) return;
    setSending(true);
    try {
      const created = await api.addReportComment(reportId, text);
      setUpdates((prev) => [...prev, created]);
      setNote('');
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Could not post comment';
      Alert.alert('Try again', msg);
    } finally {
      setSending(false);
    }
  };

  if (loading && !report) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  if (!report) return null;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
            <HugeiconsIcon icon={Cancel01Icon} color={Colors.text} size={20} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle} numberOfLines={1}>{report.category}</Text>
            <Text style={styles.headerSub}>{fmtTime(report.created_at)}</Text>
          </View>
          <Badge text={report.status} color={statusColor(report.status)} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
        >
          <View style={styles.imageWrap}>
            <Image source={{ uri: report.image_url }} style={styles.image} />
            {report.location ? (
              <View style={styles.locationTag}>
                <HugeiconsIcon icon={MapPinIcon} color="white" size={14} />
                <Text style={styles.locationText}>
                  {report.location.latitude.toFixed(4)}, {report.location.longitude.toFixed(4)}
                </Text>
              </View>
            ) : null}
          </View>

          {report.description ? (
            <Card>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.bodyText}>{report.description}</Text>
            </Card>
          ) : null}

          {report.user_note ? (
            <Card style={{ backgroundColor: Colors.primarySoft, borderColor: Colors.primarySoft }}>
              <View style={styles.row}>
                <HugeiconsIcon icon={Note01Icon} color={Colors.primary} size={16} />
                <Text style={[styles.sectionTitle, { color: Colors.primaryDark }]}>Your note</Text>
              </View>
              <Text style={[styles.bodyText, { color: Colors.primaryDark }]}>{report.user_note}</Text>
            </Card>
          ) : null}

          <View>
            <Text style={[styles.sectionTitle, { marginBottom: Spacing.sm }]}>Progress</Text>
            {updates.length === 0 ? (
              <Card>
                <EmptyState
                  icon={Message01Icon}
                  title="No updates yet"
                  subtitle="Authority updates and comments will show up here."
                />
              </Card>
            ) : (
              <View style={{ gap: Spacing.sm }}>
                {updates.map((u) => {
                  const isAuthority = u.author_role === 'authority';
                  const color = isAuthority ? Colors.info : Colors.primary;
                  return (
                    <Card key={u.id} style={styles.updateCard}>
                      <View style={styles.updateHeader}>
                        <View style={[styles.roleIcon, { backgroundColor: `${color}1A` }]}>
                          <HugeiconsIcon icon={isAuthority ? ShieldIcon : UserIcon} color={color} size={14} />
                        </View>
                        <Text style={styles.authorName}>{u.author_name || (isAuthority ? 'Authority' : 'Citizen')}</Text>
                        <Text style={styles.dot}>·</Text>
                        <Text style={styles.timeText}>{fmtTime(u.created_at)}</Text>
                      </View>
                      {u.status_to ? (
                        <View style={[styles.statusPill, { backgroundColor: `${statusColor(u.status_to)}1A` }]}>
                          <HugeiconsIcon icon={CheckmarkCircle02Icon} color={statusColor(u.status_to)} size={14} />
                          <Text style={[styles.statusPillText, { color: statusColor(u.status_to) }]}>
                            Status → {u.status_to}
                          </Text>
                        </View>
                      ) : null}
                      {u.note ? <Text style={styles.bodyText}>{u.note}</Text> : null}
                    </Card>
                  );
                })}
              </View>
            )}
          </View>

          <View style={{ height: 80 }} />
        </ScrollView>

        <View style={styles.composer}>
          <TextInput
            style={styles.composerInput}
            placeholder="Add a comment…"
            placeholderTextColor={Colors.textMuted}
            value={note}
            onChangeText={setNote}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!note.trim() || sending) && { opacity: 0.5 }]}
            onPress={sendNote}
            disabled={!note.trim() || sending}
          >
            {sending ? <ActivityIndicator color="white" /> : <HugeiconsIcon icon={SentIcon} color="white" size={18} />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  closeBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.surfaceMuted,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.heavy, color: Colors.text },
  headerSub: { fontSize: FontSize.xs, color: Colors.textSecondary },
  content: { padding: Spacing.lg, gap: Spacing.md },
  imageWrap: { width: '100%', height: 240, borderRadius: BorderRadius.xl, overflow: 'hidden', backgroundColor: Colors.surfaceMuted },
  image: { width: '100%', height: '100%' },
  locationTag: {
    position: 'absolute', bottom: Spacing.sm, left: Spacing.sm,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(15,23,42,0.7)',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: BorderRadius.round,
  },
  locationText: { color: 'white', fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  bodyText: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20, marginTop: 4 },
  updateCard: { gap: 6, padding: Spacing.sm + 2 },
  updateHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  roleIcon: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  authorName: { fontWeight: FontWeight.semibold, color: Colors.text, fontSize: FontSize.sm },
  dot: { color: Colors.textMuted },
  timeText: { fontSize: FontSize.xs, color: Colors.textMuted },
  statusPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: BorderRadius.round,
  },
  statusPillText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  composer: {
    flexDirection: 'row', gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderTopWidth: 1, borderTopColor: Colors.border,
    alignItems: 'flex-end',
  },
  composerInput: {
    flex: 1, maxHeight: 100, minHeight: 44,
    backgroundColor: Colors.surfaceMuted,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md, paddingVertical: 10,
    fontSize: FontSize.md, color: Colors.text,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    ...Shadow.lg,
  },
});
