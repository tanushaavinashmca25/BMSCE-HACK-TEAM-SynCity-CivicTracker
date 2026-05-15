import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Spacing } from '../theme';

/** Max width for centered app column on web (matches Home). */
export const SCREEN_MAX_WIDTH = 720;

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
};

/** Centers page content in a fixed-width column on wide screens. */
export function ScreenContent({ children, style }: Props) {
  return (
    <View style={styles.wrapper}>
      <View style={[styles.inner, style]}>{children}</View>
    </View>
  );
}

/** Use on ScrollView / FlatList contentContainerStyle for tab screens. */
export const centeredScrollContent = {
  flexGrow: 1,
  width: '100%' as const,
  maxWidth: SCREEN_MAX_WIDTH,
  alignSelf: 'center' as const,
  paddingHorizontal: Spacing.lg,
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
  },
  inner: {
    flex: 1,
    width: '100%',
    maxWidth: SCREEN_MAX_WIDTH,
  },
});
