import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Alert,
  ActivityIndicator, SafeAreaView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { supabase } from '../services/supabase';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../theme';
import { Mail01Icon, SecurityCheckIcon, MagicWand01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { useAppConfig } from '../hooks/useConfig';

type Stage = 'email' | 'code';

export default function AuthScreen() {
  const { config } = useAppConfig();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<Stage>('email');

  const sendCode = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return Alert.alert('Credentials required', 'Enter your email to join the mission.');
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: { shouldCreateUser: true },
    });
    setLoading(false);
    if (error) return Alert.alert('Transmission failed', error.message);
    setStage('code');
  };

  const verifyCode = async () => {
    const c = code.trim();
    if (c.length < 6) return Alert.alert('Verification incomplete', 'Enter the 6-digit access code.');
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: c,
      type: 'email',
    });
    setLoading(false);
    if (error) Alert.alert('Access denied', error.message);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.content}
      >
        <View style={styles.hero}>
          <View style={styles.heroMark}>
            <HugeiconsIcon icon={MagicWand01Icon} color="white" size={36} />
          </View>
          <View style={styles.brandBadge}>
            <HugeiconsIcon icon={MagicWand01Icon} color={Colors.accent} size={20} />
            <Text style={styles.brandName}>{config?.app_name || 'CIVIC'}</Text>
          </View>
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>
            {stage === 'email' ? 'Join the Mission' : 'Secure Verification'}
          </Text>
          <Text style={styles.subtitle}>
            {stage === 'email'
              ? "Sign in to start improving your community. We'll send a secure access code."
              : `Access code sent to ${email.trim().toLowerCase()}`}
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <HugeiconsIcon 
              icon={stage === 'email' ? Mail01Icon : SecurityCheckIcon} 
              color={Colors.accent} 
              size={20} 
            />
            <TextInput
              onChangeText={stage === 'email' ? setEmail : setCode}
              value={stage === 'email' ? email : code}
              placeholder={stage === 'email' ? "you@email.com" : "000 000"}
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType={stage === 'email' ? "email-address" : "number-pad"}
              maxLength={stage === 'email' ? 100 : 6}
              style={[styles.input, stage === 'code' && styles.codeInput]}
              editable={!loading}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            disabled={loading}
            onPress={stage === 'email' ? sendCode : verifyCode}
          >
            {loading
              ? <ActivityIndicator color="white" />
              : <Text style={styles.buttonText}>{stage === 'email' ? 'Secure Access' : 'Confirm Entry'}</Text>}
          </TouchableOpacity>

          {stage === 'code' && (
            <TouchableOpacity onPress={() => { setStage('email'); setCode(''); }} disabled={loading}>
              <Text style={styles.switchText}>Use a different channel</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>By entry, you pledge to be a force for civic good.</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.xl, flex: 1, justifyContent: 'center', gap: Spacing.xl },
  hero: { alignItems: 'center', gap: Spacing.md },
  heroMark: {
    width: 96, height: 96, borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    ...Shadow.lg,
  },
  brandBadge: { 
    flexDirection: 'row', alignItems: 'center', gap: 8, 
    backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 8, 
    borderRadius: BorderRadius.round, marginTop: -Spacing.lg,
  },
  brandName: { color: 'white', fontWeight: FontWeight.heavy, letterSpacing: 1, fontSize: 12 },
  header: { gap: 8 },
  title: { fontSize: FontSize.display, fontWeight: FontWeight.heavy, color: Colors.text, letterSpacing: -1 },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, lineHeight: 24, fontWeight: FontWeight.medium },
  form: { gap: Spacing.lg },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, paddingHorizontal: Spacing.lg,
    height: 64, borderWidth: 1, borderColor: Colors.border, ...Shadow.sm,
  },
  input: { flex: 1, color: Colors.text, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  codeInput: { letterSpacing: 8, textAlign: 'center' },
  button: {
    backgroundColor: Colors.accent, height: 60, borderRadius: BorderRadius.xl,
    justifyContent: 'center', alignItems: 'center', ...Shadow.lg,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: 'white', fontSize: FontSize.lg, fontWeight: FontWeight.heavy },
  switchText: { color: Colors.textMuted, fontWeight: FontWeight.bold, textAlign: 'center', fontSize: FontSize.sm },
  footer: { marginTop: Spacing.md },
  footerText: { color: Colors.textMuted, fontSize: 10, textAlign: 'center', fontWeight: FontWeight.heavy, textTransform: 'uppercase', letterSpacing: 1 },
});
