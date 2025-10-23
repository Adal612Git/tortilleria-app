import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
}) => {
  const getVariantStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (variant) {
      case 'primary':
        return {
          container: { backgroundColor: '#3b82f6', borderColor: 'transparent' },
          text: { color: '#ffffff' }
        };
      case 'secondary':
        return {
          container: { backgroundColor: '#f3f4f6', borderColor: '#e5e7eb' },
          text: { color: '#111827' }
        };
      case 'outline':
        return {
          container: { backgroundColor: 'transparent', borderColor: '#3b82f6' },
          text: { color: '#3b82f6' }
        };
      default:
        return {
          container: { backgroundColor: '#3b82f6', borderColor: 'transparent' },
          text: { color: '#ffffff' }
        };
    }
  };
  
  const getSizeStyles = (): ViewStyle => {
    switch (size) {
      case 'sm':
        return { paddingHorizontal: 12, paddingVertical: 8 };
      case 'md':
        return { paddingHorizontal: 16, paddingVertical: 12 };
      case 'lg':
        return { paddingHorizontal: 24, paddingVertical: 16 };
      default:
        return { paddingHorizontal: 16, paddingVertical: 12 };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <TouchableOpacity
      style={[
        {
          borderWidth: 2,
          borderRadius: 8,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          opacity: disabled || loading ? 0.5 : 1,
        },
        variantStyles.container,
        sizeStyles,
        fullWidth ? { width: '100%' } : {}
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading && <ActivityIndicator size="small" color={variant === 'primary' ? '#ffffff' : '#3b82f6'} style={{ marginRight: 8 }} />}
      <Text style={[
        { fontWeight: '600' },
        variantStyles.text,
        size === 'sm' ? { fontSize: 14 } : { fontSize: 16 }
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};
