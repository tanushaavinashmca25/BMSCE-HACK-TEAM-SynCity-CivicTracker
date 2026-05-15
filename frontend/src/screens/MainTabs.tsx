import React, { useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Session } from '@supabase/supabase-js';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Home01Icon, AwardIcon, UserCircleIcon, Add01Icon, Shield01Icon } from '@hugeicons/core-free-icons';
import { Colors, Spacing, BorderRadius, FontWeight, Shadow, Fonts } from '../theme';
import { SCREEN_MAX_WIDTH } from '../components/ScreenContent';
import HomeScreen from './HomeScreen';
import LeaderboardScreen from './LeaderboardScreen';
import ProfileScreen from './ProfileScreen';
import WardScreen from './WardScreen';

type Tab = 'home' | 'ward' | 'leaderboard' | 'profile';

type Props = {
  navigation: any;
  session: Session | null;
  onboarded: boolean;
  onReportPress: () => void;
};

export default function MainTabs({ navigation, session, onReportPress }: Props) {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('home');
  const visited = useRef<Set<Tab>>(new Set(['home']));
  visited.current.add(tab);

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'home', label: 'Home', icon: Home01Icon },
    { key: 'ward', label: 'Ward', icon: Shield01Icon },
    { key: 'leaderboard', label: 'Ranks', icon: AwardIcon },
    { key: 'profile', label: session ? 'Profile' : 'Sign in', icon: UserCircleIcon },
  ];

  return (
    <View style={styles.root}>
      <View style={{ flex: 1 }}>
        {visited.current.has('home') && (
          <View style={[styles.pane, tab !== 'home' && styles.paneHidden]}>
            <HomeScreen
              navigation={navigation}
              active={tab === 'home'}
              session={session}
              onReportPress={onReportPress}
            />
          </View>
        )}
        {visited.current.has('ward') && (
          <View style={[styles.pane, tab !== 'ward' && styles.paneHidden]}>
            <WardScreen navigation={navigation} active={tab === 'ward'} />
          </View>
        )}
        {visited.current.has('leaderboard') && (
          <View style={[styles.pane, tab !== 'leaderboard' && styles.paneHidden]}>
            <LeaderboardScreen active={tab === 'leaderboard'} />
          </View>
        )}
        {visited.current.has('profile') && (
          <View style={[styles.pane, tab !== 'profile' && styles.paneHidden]}>
            <ProfileScreen
              navigation={navigation}
              active={tab === 'profile'}
              session={session}
              onSignIn={() => navigation.navigate('Auth')}
            />
          </View>
        )}
      </View>

      <View style={[styles.tabBarWrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.tabBar}>
          {tabs.slice(0, 2).map((t) => (
            <TabItem key={t.key} t={t} active={tab === t.key} onPress={() => setTab(t.key)} />
          ))}

          <TouchableOpacity style={styles.centerBtn} onPress={onReportPress} activeOpacity={0.9}>
            <View style={styles.centerBtnInner}>
              <HugeiconsIcon icon={Add01Icon} color="white" size={26} />
            </View>
            <Text style={styles.centerLabel}>Report</Text>
          </TouchableOpacity>

          {tabs.slice(2).map((t) => (
            <TabItem key={t.key} t={t} active={tab === t.key} onPress={() => setTab(t.key)} />
          ))}
        </View>
      </View>
    </View>
  );
}

function TabItem({
  t, active, onPress,
}: { t: { key: Tab; label: string; icon: any }; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.tabBtn} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.tabIconWrap, active && styles.tabIconWrapActive]}>
        <HugeiconsIcon icon={t.icon} color={active ? Colors.primary : Colors.textMuted} size={22} />
      </View>
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{t.label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  pane: { ...StyleSheet.absoluteFillObject },
  paneHidden: { display: 'none' },
  tabBarWrap: { paddingHorizontal: Spacing.md, paddingTop: 8 },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 6,
    ...Shadow.lg,
    ...(Platform.OS === 'web' ? { maxWidth: SCREEN_MAX_WIDTH, alignSelf: 'center', width: '100%' } : {}),
  },
  tabBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 6 },
  tabIconWrap: {
    width: 44,
    height: 34,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconWrapActive: { backgroundColor: Colors.primarySoft },
  tabLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
    fontFamily: Fonts.sans,
  },
  tabLabelActive: { color: Colors.primary, fontWeight: FontWeight.bold },
  centerBtn: { width: 76, alignItems: 'center', justifyContent: 'flex-end', marginTop: -30 },
  centerBtnInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: Colors.surface,
    ...Shadow.lg,
  },
  centerLabel: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: Colors.accent,
    marginTop: 5,
    fontFamily: Fonts.sans,
    letterSpacing: 0.3,
  },
});
