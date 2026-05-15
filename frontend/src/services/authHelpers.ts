import { Platform } from 'react-native';
import type { AuthError, AuthResponse } from '@supabase/supabase-js';
import { supabase } from './supabase';

/** Where Supabase may redirect magic links (must be allowlisted in dashboard). */
export function getEmailRedirectTo(): string | undefined {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.origin}${window.location.pathname}`;
  }
  return undefined;
}

export function normalizeOtpInput(raw: string): string {
  return raw.replace(/\D/g, '');
}

export function formatAuthError(error: AuthError | null): string {
  if (!error) return 'Something went wrong. Try again.';
  const msg = error.message || '';
  const code = (error as AuthError & { code?: string }).code ?? '';

  if (
    code === 'otp_expired' ||
    /expired|invalid/i.test(msg) ||
    error.status === 403
  ) {
    return (
      'That code did not work. Use the latest 6-digit code from your email (not the link). ' +
      'If emails only contain a link, enable OTP in Supabase: Auth → Email Templates → Magic Link → include {{ .Token }}.'
    );
  }
  return msg;
}

/**
 * Verify email OTP. Tries type "email" first, then legacy "signup" for new accounts.
 */
export async function verifyEmailOtp(
  email: string,
  rawToken: string,
): Promise<AuthResponse> {
  const trimmedEmail = email.trim().toLowerCase();
  const token = normalizeOtpInput(rawToken);

  if (token.length < 6) {
    return {
      data: { user: null, session: null },
      error: {
        name: 'AuthError',
        message: 'Enter the full 6-digit code from your email.',
        status: 400,
      } as AuthError,
    };
  }

  const attempt = async (type: 'email' | 'signup') =>
    supabase.auth.verifyOtp({
      email: trimmedEmail,
      token,
      type,
    });

  const primary = await attempt('email');
  if (!primary.error) return primary;

  const secondary = await attempt('signup');
  if (!secondary.error) return secondary;

  return primary;
}

export async function sendEmailLoginCode(email: string) {
  const trimmed = email.trim().toLowerCase();
  return supabase.auth.signInWithOtp({
    email: trimmed,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: getEmailRedirectTo(),
    },
  });
}
