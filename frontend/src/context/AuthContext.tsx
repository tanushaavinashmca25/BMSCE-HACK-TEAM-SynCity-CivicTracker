import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';

type PendingRoute = 'Camera' | null;

type AuthContextValue = {
  session: Session | null;
  onboarded: boolean;
  isGuest: boolean;
  setPendingRoute: (route: PendingRoute) => void;
  /** Navigate to login/onboarding if needed; returns true when caller may continue. */
  guardReport: (navigation: { navigate: (name: string, params?: object) => void }) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
  session,
  onboarded,
  onNeedAuth,
  onNeedOnboarding,
}: {
  children: React.ReactNode;
  session: Session | null;
  onboarded: boolean;
  onNeedAuth: () => void;
  onNeedOnboarding: () => void;
}) {
  const [pendingRoute, setPendingRoute] = useState<PendingRoute>(null);

  const guardReport = useCallback(
    (navigation: { navigate: (name: string, params?: object) => void }) => {
      if (!session) {
        setPendingRoute('Camera');
        onNeedAuth();
        return false;
      }
      if (!onboarded) {
        setPendingRoute('Camera');
        onNeedOnboarding();
        return false;
      }
      navigation.navigate('Camera');
      return true;
    },
    [session, onboarded, onNeedAuth, onNeedOnboarding],
  );

  const value = useMemo(
    () => ({
      session,
      onboarded,
      isGuest: !session,
      setPendingRoute,
      guardReport,
    }),
    [session, onboarded, guardReport],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export type { PendingRoute };
