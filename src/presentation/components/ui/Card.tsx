import React from 'react';
import { View, ViewStyle } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  variant?: 'elevated' | 'outlined' | 'filled';
  padding?: 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'elevated',
  padding = 'md',
}) => {
  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: '#ffffff',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 2,
          borderWidth: 1,
          borderColor: '#f3f4f6'
        };
      case 'outlined':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: '#e5e7eb'
        };
      case 'filled':
        return {
          backgroundColor: '#f9fafb',
          borderWidth: 1,
          borderColor: '#f3f4f6'
        };
      default:
        return {
          backgroundColor: '#ffffff',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 2,
          borderWidth: 1,
          borderColor: '#f3f4f6'
        };
    }
  };
  
  const getPaddingStyles = (): ViewStyle => {
    switch (padding) {
      case 'sm':
        return { padding: 12 };
      case 'md':
        return { padding: 16 };
      case 'lg':
        return { padding: 24 };
      default:
        return { padding: 16 };
    }
  };

  const variantStyles = getVariantStyles();
  const paddingStyles = getPaddingStyles();

  return (
    <View style={[
      { borderRadius: 12 },
      variantStyles,
      paddingStyles
    ]}>
      {children}
    </View>
  );
};
