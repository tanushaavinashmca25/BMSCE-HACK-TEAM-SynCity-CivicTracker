import React, { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Session } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabase';
import { api } from '../services/api';
import MainTabs from '../screens/MainTabs';
import ReportScreen from '../screens/ReportScreen';
import ReportDetailScreen from '../screens/ReportDetailScreen';
import AuthScreen from '../screens/AuthScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import { Colors } from '../theme';
// Lazy: defer Vision Camera + TFLite model compile until the user taps "Report an issue".
const CameraScreen = lazy(() => import('../screens/CameraScreen'));

function CameraScreenWithSuspense(props: any) {
  return (
    <Suspense
      fallback={
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'black' }}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      }
    >
      <CameraScreen {...props} />
    </Suspense>
  );
}

const Stack = createNativeStackNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: Colors.background,
    card: Colors.surface,
    text: Colors.text,
    border: Colors.border,
    primary: Colors.primary,
  },
};

const ONBOARDING_KEY = (uid: string) => `civic.onboarded.${uid}`;

export default function AppNavigator() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [onboarded, setOnboarded] = useState<boolean | null>(null);
  const lastUserId = useRef<string | null>(null);

  const refreshOnboarding = useCallback(async (userId: string, hadCachedTrue: boolean) => {
    try {
      const me = await api.me();
      setOnboarded(me.onboarding_complete);
      await AsyncStorage.setItem(ONBOARDING_KEY(userId), me.onboarding_complete ? '1' : '0');
    } catch {
      // Network/API failure: don't kick a returning user back to onboarding.
      // Only fall through to onboarding when we have no prior signal.
      if (!hadCachedTrue) setOnboarded(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setReady(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (!s) {
        setOnboarded(null);
        lastUserId.current = null;
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    if (lastUserId.current === session.user.id) return;
    lastUserId.current = session.user.id;

    let cancelled = false;
    (async () => {
      const cached = await AsyncStorage.getItem(ONBOARDING_KEY(session.user.id));
      const cachedTrue = cached === '1';
      if (!cancelled && cachedTrue) {
        // Returning user — show app immediately, verify in background.
        setOnboarded(true);
      }
      await refreshOnboarding(session.user.id, cachedTrue);
    })();

    return () => { cancelled = true; };
  }, [session, refreshOnboarding]);

  const markOnboarded = useCallback(async () => {
    setOnboarded(true);
    if (session) {
      await AsyncStorage.setItem(ONBOARDING_KEY(session.user.id), '1');
    }
  }, [session]);

  if (!ready || (session && onboarded === null)) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: Colors.background },
        }}
      >
        {!session ? (
          <Stack.Screen name="Auth" component={AuthScreen} />
        ) : !onboarded ? (
          <Stack.Screen name="Onboarding">
            {() => <OnboardingScreen onDone={markOnboarded} />}
          </Stack.Screen>
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="Camera" component={CameraScreenWithSuspense} options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="Report" component={ReportScreen} options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="ReportDetail" component={ReportDetailScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
