import React from 'react';
import { TextInput, View, Text, ViewStyle, TextStyle } from 'react-native';

interface InputProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  label?: string;
  error?: string;
  secureTextEntry?: boolean;
  disabled?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  onSubmitEditing?: () => void;
  returnKeyType?: 'done' | 'next' | 'search' | 'go';
}

export const Input: React.FC<InputProps> = ({
  placeholder,
  value,
  onChangeText,
  label,
  error,
  secureTextEntry = false,
  disabled = false,
  autoCapitalize = 'none',
  keyboardType = 'default',
  onSubmitEditing,
  returnKeyType = 'done',
}) => {
  const getBorderColor = (): string => {
    if (error) return '#ef4444';
    if (disabled) return '#e5e7eb';
    return '#d1d5db';
  };

  return (
    <View style={{ marginBottom: 16 }}>
      {label && (
        <Text style={{ 
          color: '#374151', 
          fontWeight: '500', 
          marginBottom: 8, 
          fontSize: 14 
        }}>
          {label}
        </Text>
      )}
      <TextInput
        style={{
          borderWidth: 2,
          borderColor: getBorderColor(),
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 14,
          backgroundColor: '#ffffff',
          color: '#111827',
          opacity: disabled ? 0.5 : 1,
          fontSize: 16,
        }}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        editable={!disabled}
        selectTextOnFocus={!disabled}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        onSubmitEditing={onSubmitEditing}
        returnKeyType={returnKeyType}
      />
      {error && (
        <Text style={{ 
          color: '#ef4444', 
          fontSize: 12, 
          marginTop: 4,
          fontWeight: '500'
        }}>
          {error}
        </Text>
      )}
    </View>
  );
};
