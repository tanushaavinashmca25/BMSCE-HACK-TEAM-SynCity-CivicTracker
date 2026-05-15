import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  SafeAreaView, KeyboardAvoidingView, Platform,
} from 'react-native';
import {
  sendEmailLoginCode,
  verifyEmailOtp,
  formatAuthError,
  normalizeOtpInput,
} from '../services/authHelpers';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow, Fonts } from '../theme';
import { Mail01Icon, SecurityCheckIcon, Cancel01Icon, MapPinIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { APP_NAME } from '../constants/branding';
import { CopyrightFooter } from '../components/CopyrightFooter';
import { PrimaryButton, InputField } from '../components/Form';
import { SCREEN_MAX_WIDTH } from '../components/ScreenContent';

type Stage = 'email' | 'code';

export default function AuthScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<Stage>('email');

  const sendCode = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return Alert.alert('Email required', 'Enter your email to continue.');
    setLoading(true);
    const { error } = await sendEmailLoginCode(trimmed);
    setLoading(false);
    if (error) return Alert.alert('Could not send code', formatAuthError(error));
    setCode('');
    setStage('code');
  };

  const verifyCode = async () => {
    const digits = normalizeOtpInput(code);
    if (digits.length < 6) {
      return Alert.alert('Enter code', 'Enter the 6-digit code from your email (numbers only).');
    }
    setLoading(true);
    const { error } = await verifyEmailOtp(email, code);
    setLoading(false);
    if (error) {
      Alert.alert('Could not sign in', formatAuthError(error));
      return;
    }
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <TouchableOpacity style={styles.close} onPress={() => navigation.goBack()} activeOpacity={0.85}>
          <HugeiconsIcon icon={Cancel01Icon} color={Colors.text} size={22} />
        </TouchableOpacity>

        <View style={styles.content}>
          <View style={styles.hero}>
            <View style={styles.heroMark}>
              <HugeiconsIcon icon={MapPinIcon} color="white" size={32} />
            </View>
            <Text style={styles.brand}>{APP_NAME}</Text>
            <Text style={styles.brandTag}>Civic reporting · Hackathon 2026</Text>
          </View>

          <Text style={styles.title}>
            {stage === 'email' ? 'Sign in to report' : 'Check your email'}
          </Text>
          <Text style={styles.subtitle}>
            {stage === 'email'
              ? 'You need an account to submit pothole reports. Browsing the map is free without login.'
              : `We sent a code to ${email.trim().toLowerCase()}`}
          </Text>

          <View style={styles.formCard}>
            <InputField
              label={stage === 'email' ? 'Email address' : 'Verification code'}
              icon={
                <HugeiconsIcon
                  icon={stage === 'email' ? Mail01Icon : SecurityCheckIcon}
                  color={Colors.primary}
                  size={20}
                />
              }
              onChangeText={stage === 'email' ? setEmail : setCode}
              value={stage === 'email' ? email : code}
              placeholder={stage === 'email' ? 'you@email.com' : '000000'}
              autoCapitalize="none"
              keyboardType={stage === 'email' ? 'email-address' : 'number-pad'}
              maxLength={stage === 'email' ? 100 : 8}
              editable={!loading}
              style={stage === 'code' ? styles.codeInput : undefined}
            />

            <PrimaryButton
              onPress={stage === 'email' ? sendCode : verifyCode}
              disabled={loading}
              loading={loading}
            >
              {stage === 'email' ? 'Send login code' : 'Verify & continue'}
            </PrimaryButton>
          </View>

          {stage === 'code' ? (
            <View style={styles.codeActions}>
              <TouchableOpacity onPress={sendCode} disabled={loading} activeOpacity={0.75}>
                <Text style={styles.switchText}>Resend code</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { setStage('email'); setCode(''); }}
                disabled={loading}
                activeOpacity={0.75}
              >
                <Text style={[styles.switchText, styles.switchTextMuted]}>Use a different email</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <CopyrightFooter compact />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  close: {
    margin: Spacing.md,
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    alignSelf: 'flex-end',
    ...Shadow.sm,
  },
  content: {
    padding: Spacing.xl,
    gap: Spacing.lg,
    flex: 1,
    justifyContent: 'center',
    maxWidth: SCREEN_MAX_WIDTH,
    width: '100%',
    alignSelf: 'center',
  },
  hero: { alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.sm },
  heroMark: {
    width: 76,
    height: 76,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.lg,
  },
  brand: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
    fontFamily: Fonts.heading,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: Spacing.sm,
  },
  brandTag: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontFamily: Fonts.sans,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.heavy,
    color: Colors.text,
    letterSpacing: -0.6,
    fontFamily: Fonts.heading,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    lineHeight: 24,
    fontFamily: Fonts.sans,
  },
  formCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.md,
  },
  codeInput: { letterSpacing: 8, textAlign: 'center', fontWeight: FontWeight.semibold },
  codeActions: { gap: Spacing.sm, alignItems: 'center' },
  switchText: {
    color: Colors.primary,
    textAlign: 'center',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    fontFamily: Fonts.sans,
  },
  switchTextMuted: { color: Colors.textSecondary, fontWeight: FontWeight.medium },
});
