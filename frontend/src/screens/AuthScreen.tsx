import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';

import { supabase } from '../services/supabase';

import {
  Colors,
  Shadow,
} from '../theme';

import {
  Mail01Icon,
  SecurityCheckIcon,
} from '@hugeicons/core-free-icons';

import { HugeiconsIcon } from '@hugeicons/react-native';

type Stage = 'email' | 'code';

const { width } = Dimensions.get('window');

export default function AuthScreen() {

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<Stage>('email');

  const sendCode = async () => {

    const trimmed = email.trim().toLowerCase();

    if (!trimmed) {
      return Alert.alert(
        'Credentials required',
        'Enter your email to continue.'
      );
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: {
        shouldCreateUser: true,
      },
    });

    setLoading(false);

    if (error) {
      return Alert.alert(
        'Transmission failed',
        error.message
      );
    }

    setStage('code');
  };

  const verifyCode = async () => {

    const c = code.trim();

    if (c.length < 6) {
      return Alert.alert(
        'Verification incomplete',
        'Enter the 6-digit code.'
      );
    }

    setLoading(true);

    const { error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: c,
      type: 'email',
    });

    setLoading(false);

    if (error) {
      Alert.alert('Access denied', error.message);
    }
  };

  return (

    <SafeAreaView style={styles.container}>

      <View style={styles.topCircle} />
      <View style={styles.bottomCircle} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.content}
      >

        {/* HERO */}
        <View style={styles.heroSection}>

          <View style={styles.logoContainer}>

            <View style={styles.logoOuterGlow} />

            <View style={styles.logoCircle}>

              <View style={styles.logoInnerCircle}>

                <Text style={styles.logoS}>
                  S
                </Text>

              </View>

            </View>

            <Text style={styles.logoText}>
              SynCity
            </Text>

            <Text style={styles.logoTagline}>
              Smart Civic Platform
            </Text>

          </View>

          <Text style={styles.smallHeading}>
            COMMUNITY FIRST
          </Text>

          <Text style={styles.title}>
            {stage === 'email'
              ? 'Join The Mission'
              : 'Verify Access'}
          </Text>

          <Text style={styles.subtitle}>
            {stage === 'email'
              ? 'Report civic issues, improve your city, and collaborate with your local community effortlessly.'
              : `Enter the secure code sent to ${email.trim().toLowerCase()}`}
          </Text>

        </View>

        {/* CARD */}
        <View style={styles.formCard}>

          {/* INPUT */}
          <View style={styles.inputContainer}>

            <HugeiconsIcon
              icon={
                stage === 'email'
                  ? Mail01Icon
                  : SecurityCheckIcon
              }
              color={Colors.primary}
              size={20}
            />

            <TextInput
              onChangeText={
                stage === 'email'
                  ? setEmail
                  : setCode
              }

              value={
                stage === 'email'
                  ? email
                  : code
              }

              placeholder={
                stage === 'email'
                  ? 'Enter your email'
                  : '000000'
              }

              placeholderTextColor={Colors.textMuted}

              autoCapitalize="none"
              autoCorrect={false}

              keyboardType={
                stage === 'email'
                  ? 'email-address'
                  : 'number-pad'
              }

              maxLength={
                stage === 'email'
                  ? 100
                  : 6
              }

              editable={!loading}

              style={[
                styles.input,
                stage === 'code' &&
                  styles.codeInput,
              ]}
            />

          </View>

          {/* BUTTON */}
          <TouchableOpacity
            activeOpacity={0.85}

            style={[
              styles.button,
              loading && styles.buttonDisabled,
            ]}

            disabled={loading}

            onPress={
              stage === 'email'
                ? sendCode
                : verifyCode
            }
          >

            {loading ? (

              <ActivityIndicator color="#FFFFFF" />

            ) : (

              <View style={styles.buttonContent}>

                <Text style={styles.buttonText}>
                  {stage === 'email'
                    ? 'Continue'
                    : 'Verify Code'}
                </Text>

                <View style={styles.buttonArrow}>
                  <Text style={styles.arrowText}>
                    →
                  </Text>
                </View>

              </View>

            )}

          </TouchableOpacity>

          {/* SWITCH */}
          {stage === 'code' && (

            <TouchableOpacity
              onPress={() => {
                setStage('email');
                setCode('');
              }}
            >

              <Text style={styles.switchText}>
                Use another email
              </Text>

            </TouchableOpacity>

          )}

        </View>

        {/* FOOTER */}
        <View style={styles.footer}>

          <Text style={styles.footerText}>
            BUILDING SMARTER COMMUNITIES
          </Text>

        </View>

      </KeyboardAvoidingView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },

  topCircle: {
    position: 'absolute',
    top: -80,
    right: -80,

    width: 240,
    height: 240,

    borderRadius: 999,

    backgroundColor: Colors.primarySoft,
    opacity: 0.9,
  },

  bottomCircle: {
    position: 'absolute',
    bottom: -120,
    left: -120,

    width: 260,
    height: 260,

    borderRadius: 999,

    backgroundColor: Colors.accentSoft,
    opacity: 0.8,
  },

  heroSection: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 520,
  },

  logoContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },

  logoOuterGlow: {
    position: 'absolute',

    width: width < 500 ? 120 : 150,
    height: width < 500 ? 120 : 150,

    borderRadius: 999,

    backgroundColor: Colors.primarySoft,

    opacity: 0.5,

    top: -10,
  },

  logoCircle: {
    width: width < 500 ? 95 : 120,
    height: width < 500 ? 95 : 120,

    borderRadius: 999,

    backgroundColor: Colors.primary,

    justifyContent: 'center',
    alignItems: 'center',

    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: 14,
    },

    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 12,
  },

  logoInnerCircle: {
    width: '82%',
    height: '82%',

    borderRadius: 999,

    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',

    justifyContent: 'center',
    alignItems: 'center',
  },

  logoS: {
    color: '#FFFFFF',

    fontSize: width < 500 ? 42 : 54,

    fontWeight: '900',

    letterSpacing: 1,
  },

  logoText: {
    marginTop: 18,

    color: Colors.text,

    fontSize: width < 500 ? 30 : 42,

    fontWeight: '900',

    letterSpacing: -1.5,
  },

  logoTagline: {
    marginTop: 6,

    color: Colors.textSecondary,

    fontSize: width < 500 ? 13 : 15,

    letterSpacing: 1,
  },

  smallHeading: {
    marginTop: 30,

    color: Colors.accent,

    fontWeight: '700',

    fontSize: width < 500 ? 12 : 14,

    letterSpacing: 2,
    textAlign: 'center',
  },

  title: {
    marginTop: 12,

    fontSize: width < 500 ? 34 : 58,

    color: Colors.text,

    fontWeight: '800',
    textAlign: 'center',
  },

  subtitle: {
    marginTop: 20,

    color: Colors.textSecondary,

    fontSize: width < 500 ? 15 : 18,

    lineHeight: width < 500 ? 24 : 32,

    textAlign: 'center',

    maxWidth: 620,
  },

  formCard: {
    width: '100%',
    maxWidth: 520,

    marginTop: 50,

    backgroundColor: Colors.surface,

    borderRadius: 36,

    paddingVertical: 26,
    paddingHorizontal: width < 500 ? 18 : 26,

    borderWidth: 1,
    borderColor: Colors.border,

    ...Shadow.md,
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',

    width: '100%',

    minHeight: width < 500 ? 60 : 70,

    borderRadius: 22,

    backgroundColor: Colors.surfaceMuted,

    borderWidth: 1,
    borderColor: Colors.border,

    paddingHorizontal: width < 500 ? 16 : 20,
  },

  input: {
    flex: 1,

    color: Colors.text,

    fontSize: width < 500 ? 15 : 16,

    fontWeight: '600',

    marginLeft: 12,
  },

  codeInput: {
    letterSpacing: width < 500 ? 6 : 10,
    textAlign: 'center',
  },

  button: {
    width: '100%',

    minHeight: width < 500 ? 58 : 68,

    marginTop: 24,

    borderRadius: 24,

    backgroundColor: Colors.accent,

    justifyContent: 'center',
    alignItems: 'center',

    overflow: 'hidden',

    shadowColor: Colors.accent,
    shadowOffset: {
      width: 0,
      height: 12,
    },

    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 10,
  },

  buttonDisabled: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },

  buttonContent: {
    width: '100%',

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    position: 'relative',
  },

  buttonText: {
    color: '#FFFFFF',

    fontSize: width < 500 ? 16 : 18,

    fontWeight: '800',

    letterSpacing: 0.4,
  },

  buttonArrow: {
    position: 'absolute',
    right: 18,

    width: 34,
    height: 34,

    borderRadius: 999,

    backgroundColor: 'rgba(255,255,255,0.18)',

    justifyContent: 'center',
    alignItems: 'center',
  },

  arrowText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },

  switchText: {
    marginTop: 20,

    textAlign: 'center',

    color: Colors.primary,

    fontSize: width < 500 ? 14 : 15,

    fontWeight: '600',
  },

  footer: {
    marginTop: 38,
  },

  footerText: {
    color: Colors.textMuted,

    fontSize: width < 500 ? 11 : 13,

    fontWeight: '700',

    letterSpacing: 3,
    textAlign: 'center',
  },
});