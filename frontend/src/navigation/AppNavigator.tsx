import React, { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { NavigationContainer, DefaultTheme, NavigationContainerRef } from '@react-navigation/native';
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
import { AuthProvider } from '../context/AuthContext';
import { Colors } from '../theme';
import { APP_NAME } from '../constants/branding';

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
  const pendingReport = useRef(false);
  const navRef = useRef<NavigationContainerRef<any>>(null);

  const refreshOnboarding = useCallback(async (userId: string, hadCachedTrue: boolean) => {
    try {
      const me = await api.me();
      setOnboarded(me.onboarding_complete);
      await AsyncStorage.setItem(ONBOARDING_KEY(userId), me.onboarding_complete ? '1' : '0');
    } catch {
      if (!hadCachedTrue) setOnboarded(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session: s }, error }) => {
      if (error) {
        await supabase.auth.signOut().catch(() => {});
        setSession(null);
      } else {
        setSession(s);
      }
      setReady(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      // Synchronize with static About-Us page on web
      if (Platform.OS === 'web') {
        if (s) {
          localStorage.setItem('synCity_token', s.access_token);
        } else {
          localStorage.removeItem('synCity_token');
        }
      }
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
      if (!cancelled && cachedTrue) setOnboarded(true);
      await refreshOnboarding(session.user.id, cachedTrue);
    })();

    return () => { cancelled = true; };
  }, [session, refreshOnboarding]);

  useEffect(() => {
    if (pendingReport.current && session && onboarded) {
      pendingReport.current = false;
      navRef.current?.navigate('Camera');
    }
  }, [session, onboarded]);

  const markOnboarded = useCallback(async () => {
    setOnboarded(true);
    if (session) {
      await AsyncStorage.setItem(ONBOARDING_KEY(session.user.id), '1');
    }
  }, [session]);

  const openAuth = useCallback(() => {
    navRef.current?.navigate('Auth');
  }, []);

  const openOnboarding = useCallback(() => {
    navRef.current?.navigate('Onboarding');
  }, []);

  const requestReport = useCallback(() => {
    if (!session) {
      pendingReport.current = true;
      openAuth();
      return;
    }
    if (!onboarded) {
      pendingReport.current = true;
      openOnboarding();
      return;
    }
    navRef.current?.navigate('Camera');
  }, [session, onboarded, openAuth, openOnboarding]);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  return (
    <AuthProvider
      session={session}
      onboarded={!!onboarded}
      onNeedAuth={openAuth}
      onNeedOnboarding={openOnboarding}
    >
      <NavigationContainer
        ref={navRef}
        theme={navTheme}
        documentTitle={{
          enabled: true,
          formatter: () => APP_NAME,
        }}
      >
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            contentStyle: { backgroundColor: Colors.background },
          }}
        >
          <Stack.Screen name="Main">
            {(props) => (
              <MainTabs
                {...props}
                session={session}
                onboarded={!!onboarded}
                onReportPress={requestReport}
              />
            )}
          </Stack.Screen>
          <Stack.Screen
            name="Auth"
            component={AuthScreen}
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          {session && !onboarded ? (
            <Stack.Screen name="Onboarding">
              {() => <OnboardingScreen onDone={markOnboarded} />}
            </Stack.Screen>
          ) : null}
          <Stack.Screen name="Camera" component={CameraScreenWithSuspense} options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="Report" component={ReportScreen} options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="ReportDetail" component={ReportDetailScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}
