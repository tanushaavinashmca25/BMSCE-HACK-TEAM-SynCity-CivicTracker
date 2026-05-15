import React, { useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Home01Icon, AwardIcon, UserCircleIcon, Add01Icon, Shield01Icon } from '@hugeicons/core-free-icons';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../theme';
import HomeScreen from './HomeScreen';
import LeaderboardScreen from './LeaderboardScreen';
import ProfileScreen from './ProfileScreen';
import WardScreen from './WardScreen';

type Tab = 'home' | 'ward' | 'leaderboard' | 'profile';

export default function MainTabs({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('home');
  const visited = useRef<Set<Tab>>(new Set(['home']));
  visited.current.add(tab);

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'home', label: 'Action', icon: Home01Icon },
    { key: 'ward', label: 'Impact', icon: Shield01Icon },
    { key: 'leaderboard', label: 'Ranks', icon: AwardIcon },
    { key: 'profile', label: 'Profile', icon: UserCircleIcon },
  ];

  return (
    <View style={styles.root}>
      <View style={{ flex: 1 }}>
        {visited.current.has('home') && (
          <View style={[styles.pane, tab !== 'home' && styles.paneHidden]}>
            <HomeScreen navigation={navigation} active={tab === 'home'} />
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
            <ProfileScreen navigation={navigation} active={tab === 'profile'} />
          </View>
        )}
      </View>

      <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {tabs.slice(0, 2).map((t) => (
          <TabItem key={t.key} t={t} active={tab === t.key} onPress={() => setTab(t.key)} />
        ))}

        <TouchableOpacity
          style={styles.centerBtn}
          onPress={() => navigation.navigate('Camera')}
          activeOpacity={0.9}
        >
          <View style={styles.centerBtnInner}>
            <HugeiconsIcon icon={Add01Icon} color="white" size={28} />
          </View>
        </TouchableOpacity>

        {tabs.slice(2).map((t) => (
          <TabItem key={t.key} t={t} active={tab === t.key} onPress={() => setTab(t.key)} />
        ))}
      </View>
    </View>
  );
}

function TabItem({
  t, active, onPress,
}: { t: { key: Tab; label: string; icon: any }; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.tabBtn} onPress={onPress} activeOpacity={0.7}>
      <HugeiconsIcon
        icon={t.icon}
        color={active ? Colors.accent : Colors.textMuted}
        size={22}
      />
      <Text style={[styles.tabLabel, active && { color: Colors.accent }]}>
        {t.label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  pane: { ...StyleSheet.absoluteFillObject },
  paneHidden: { display: 'none' },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 10,
    paddingHorizontal: Spacing.sm,
    ...Shadow.sm,
  },
  tabBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  tabLabel: { fontSize: 10, color: Colors.textMuted, fontWeight: FontWeight.heavy, textTransform: 'uppercase', letterSpacing: 0.5 },
  centerBtn: {
    width: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerBtnInner: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    marginTop: -22, // lift above the tab bar
    borderWidth: 4,
    borderColor: Colors.surface,
    ...Shadow.lg,
  },
});
