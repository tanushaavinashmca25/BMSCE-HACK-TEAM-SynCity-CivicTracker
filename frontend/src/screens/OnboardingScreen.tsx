import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Alert,
  ActivityIndicator, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  UserIcon, SmartPhone01Icon, MagicWand01Icon, ArrowRight02Icon, Logout01Icon,
} from '@hugeicons/core-free-icons';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../theme';
import { api, ApiError } from '../services/api';
import { supabase } from '../services/supabase';

type Props = { onDone: () => void };

const phoneOk = (raw: string) => /^[0-9+\-\s()]{7,}$/.test(raw.trim());

export default function OnboardingScreen({ onDone }: Props) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    if (!trimmedName) return Alert.alert('Identity required', 'Your name is how the community recognizes your impact.');
    if (!phoneOk(trimmedPhone)) return Alert.alert('Contact required', 'Officials need a valid line for verification.');
    setLoading(true);
    try {
      await api.completeOnboarding({ display_name: trimmedName, phone: trimmedPhone });
      onDone();
    } catch (e: any) {
      const msg = e instanceof ApiError ? e.message : (e?.message || 'Profile sync failed');
      Alert.alert('Try again', msg);
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = name.trim().length > 0 && phoneOk(phone);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={styles.brandRow}>
              <View style={styles.brandBadge}>
                <HugeiconsIcon icon={MagicWand01Icon} color={Colors.accent} size={16} />
                <Text style={styles.brandLabel}>IDENTITY SETUP</Text>
              </View>
              <TouchableOpacity style={styles.logoutBtn} onPress={() => supabase.auth.signOut()}>
                <HugeiconsIcon icon={Logout01Icon} color={Colors.danger} size={18} />
              </TouchableOpacity>
            </View>
            <Text style={styles.title}>Define Your Presence</Text>
            <Text style={styles.subtitle}>
              How should the community and local authorities recognize your contributions to society?
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Display Name</Text>
              <View style={styles.inputWrap}>
                <HugeiconsIcon icon={UserIcon} color={Colors.accent} size={20} />
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Arjun Dev"
                  placeholderTextColor={Colors.textMuted}
                  style={styles.input}
                  editable={!loading}
                  autoCapitalize="words"
                  autoCorrect={false}
                  maxLength={80}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Contact Line</Text>
              <View style={styles.inputWrap}>
                <HugeiconsIcon icon={SmartPhone01Icon} color={Colors.accent} size={20} />
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+91 00000 00000"
                  placeholderTextColor={Colors.textMuted}
                  style={styles.input}
                  editable={!loading}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  maxLength={32}
                />
              </View>
              <Text style={styles.hint}>Used strictly for official verification and impact updates.</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.cta, (!canSubmit || loading) && styles.ctaDisabled]}
            disabled={!canSubmit || loading}
            onPress={submit}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Text style={styles.ctaText}>Initialize Mission</Text>
                <HugeiconsIcon icon={ArrowRight02Icon} color="white" size={20} />
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.xl, flexGrow: 1, gap: Spacing.xl },
  header: { gap: 12, marginTop: Spacing.md },
  brandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  brandBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.round },
  brandLabel: { color: 'white', fontSize: 10, fontWeight: FontWeight.heavy, letterSpacing: 1 },
  logoutBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  title: { fontSize: FontSize.display, fontWeight: FontWeight.heavy, color: Colors.text, letterSpacing: -1 },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, lineHeight: 24, fontWeight: FontWeight.medium },
  form: { gap: Spacing.lg },
  field: { gap: 8 },
  label: { fontSize: 10, fontWeight: FontWeight.heavy, color: Colors.text, textTransform: 'uppercase', letterSpacing: 1 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, paddingHorizontal: Spacing.lg,
    height: 60, borderWidth: 1, borderColor: Colors.border, ...Shadow.sm,
  },
  input: { flex: 1, color: Colors.text, fontSize: FontSize.md, fontWeight: FontWeight.bold },
  hint: { fontSize: 11, color: Colors.textMuted, fontWeight: FontWeight.medium, marginLeft: 4 },
  cta: {
    marginTop: 'auto', height: 60, borderRadius: BorderRadius.xl,
    backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: Spacing.md, ...Shadow.lg,
  },
  ctaDisabled: { opacity: 0.5 },
  ctaText: { color: 'white', fontSize: FontSize.lg, fontWeight: FontWeight.heavy },
});
