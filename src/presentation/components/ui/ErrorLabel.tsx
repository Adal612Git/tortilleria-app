import React from 'react';
import { Text, View, TextStyle, ViewStyle } from 'react-native';

interface ErrorLabelProps {
  message: string;
  type?: 'error' | 'warning' | 'info';
}

export const ErrorLabel: React.FC<ErrorLabelProps> = ({ 
  message, 
  type = 'error' 
}) => {
  const getStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (type) {
      case 'error':
        return {
          container: { 
            backgroundColor: '#fef2f2', 
            borderLeftWidth: 4,
            borderLeftColor: '#ef4444',
            padding: 12,
            borderRadius: 8,
            marginVertical: 8
          },
          text: { color: '#dc2626', fontSize: 14 }
        };
      case 'warning':
        return {
          container: { 
            backgroundColor: '#fffbeb', 
            borderLeftWidth: 4,
            borderLeftColor: '#f59e0b',
            padding: 12,
            borderRadius: 8,
            marginVertical: 8
          },
          text: { color: '#92400e', fontSize: 14 }
        };
      case 'info':
        return {
          container: { 
            backgroundColor: '#eff6ff', 
            borderLeftWidth: 4,
            borderLeftColor: '#3b82f6',
            padding: 12,
            borderRadius: 8,
            marginVertical: 8
          },
          text: { color: '#1e40af', fontSize: 14 }
        };
      default:
        return {
          container: { 
            backgroundColor: '#fef2f2', 
            borderLeftWidth: 4,
            borderLeftColor: '#ef4444',
            padding: 12,
            borderRadius: 8,
            marginVertical: 8
          },
          text: { color: '#dc2626', fontSize: 14 }
        };
    }
  };

  const styles = getStyles();

  if (!message) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
};
