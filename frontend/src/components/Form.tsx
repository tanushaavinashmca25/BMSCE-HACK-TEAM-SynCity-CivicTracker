import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import {
  Colors,
  Spacing,
  BorderRadius,
  FontSize,
  FontWeight,
  Shadow,
  Fonts,
} from '../theme';

type ButtonProps = {
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  variant?: 'primary' | 'accent' | 'outline' | 'ghost';
  style?: ViewStyle;
};

export function PrimaryButton({
  onPress,
  disabled,
  loading,
  children,
  variant = 'primary',
  style,
}: ButtonProps) {
  const bg =
    variant === 'accent'
      ? Colors.accent
      : variant === 'outline' || variant === 'ghost'
        ? 'transparent'
        : Colors.primary;
  const border =
    variant === 'outline' ? { borderWidth: 1.5, borderColor: Colors.borderStrong } : {};

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.88}
      style={[
        styles.button,
        { backgroundColor: bg },
        border,
        variant === 'ghost' && styles.buttonGhost,
        (disabled || loading) && styles.buttonDisabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? Colors.primary : 'white'} />
      ) : (
        <Text
          style={[
            styles.buttonText,
            (variant === 'outline' || variant === 'ghost') && styles.buttonTextOutline,
          ]}
        >
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
}

type InputFieldProps = TextInputProps & {
  label: string;
  icon?: React.ReactNode;
  containerStyle?: ViewStyle;
};

/** Floating-style label field — preserves all TextInput handlers */
export function InputField({
  label,
  icon,
  containerStyle,
  value,
  onFocus,
  onBlur,
  style,
  ...inputProps
}: InputFieldProps) {
  const [focused, setFocused] = useState(false);
  const hasValue = Boolean(value && String(value).length > 0);
  const floated = focused || hasValue;

  return (
    <View style={[styles.fieldWrap, containerStyle]}>
      <Text style={[styles.fieldLabel, floated && styles.fieldLabelFloated]}>{label}</Text>
      <View
        style={[
          styles.inputShell,
          focused && styles.inputShellFocused,
          inputProps.editable === false && styles.inputShellDisabled,
        ]}
      >
        {icon ? <View style={styles.inputIcon}>{icon}</View> : null}
        <TextInput
          {...inputProps}
          value={value}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          placeholderTextColor={Colors.textMuted}
          style={[styles.input, icon ? styles.inputWithIcon : null, style]}
          underlineColorAndroid="transparent"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    ...Shadow.md,
  },
  buttonGhost: {
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonDisabled: { opacity: 0.55 },
  buttonText: {
    color: 'white',
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    fontFamily: Fonts.sans,
    letterSpacing: 0.2,
  },
  buttonTextOutline: { color: Colors.primary },
  fieldWrap: { gap: 6 },
  fieldLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    fontFamily: Fonts.sans,
    marginLeft: 4,
  },
  fieldLabelFloated: {
    color: Colors.primary,
    fontSize: FontSize.xs,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  inputShell: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    ...Shadow.sm,
  },
  inputShellFocused: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surface,
  },
  inputShellDisabled: { opacity: 0.6 },
  inputIcon: { marginRight: Spacing.sm },
  input: {
    flex: 1,
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    fontFamily: Fonts.sans,
    paddingVertical: Spacing.sm,
  },
  inputWithIcon: {},
});
