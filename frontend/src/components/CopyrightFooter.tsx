import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COPYRIGHT_TEXT, APP_NAME } from '../constants/branding';
import { Colors, Spacing, FontSize, FontWeight } from '../theme';

type Props = {
  /** Override default copyright (e.g. from config). */
  text?: string;
  compact?: boolean;
  /** Use on dark screens (e.g. camera). */
  variant?: 'light' | 'dark';
};

export function CopyrightFooter({
  text = COPYRIGHT_TEXT, compact = false, variant = 'light',
}: Props) {
  const lines = text.split('\n').filter(Boolean);
  const dark = variant === 'dark';

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <View style={[styles.rule, dark && styles.ruleDark]} />
      <Text style={[styles.brand, dark && styles.textDark]}>{APP_NAME}</Text>
      {lines.map((line) => (
        <Text key={line} style={[styles.line, dark && styles.textDarkMuted]}>
          {line}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: 4,
  },
  wrapCompact: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  rule: {
    width: 40,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  brand: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.textMuted,
    letterSpacing: 0.8,
  },
  line: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
    maxWidth: 320,
    fontWeight: FontWeight.medium,
  },
  ruleDark: { backgroundColor: 'rgba(255,255,255,0.2)' },
  textDark: { color: 'rgba(255,255,255,0.7)' },
  textDarkMuted: { color: 'rgba(255,255,255,0.45)' },
});
