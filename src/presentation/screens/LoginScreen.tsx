import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { useAuthStore } from '../store/authStore';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuthStore();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor ingresa email y contraseña');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
    } catch (error: any) {
      Alert.alert('Error', 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 justify-center px-8">
          <View className="items-center mb-12">
            <Text className="text-4xl font-bold text-gray-900 mb-2">
              Tortillería
            </Text>
            <Text className="text-lg text-gray-600">
              Inicia sesión en tu cuenta
            </Text>
          </View>

          <View className="space-y-6">
            <View>
              <Text className="text-gray-700 font-medium mb-2">Email</Text>
              <TextInput
                className="bg-gray-100 rounded-xl px-4 py-4 border border-gray-300 text-lg"
                placeholder="tu@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View>
              <Text className="text-gray-700 font-medium mb-2">Contraseña</Text>
              <TextInput
                className="bg-gray-100 rounded-xl px-4 py-4 border border-gray-300 text-lg"
                placeholder="Tu contraseña"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <TouchableOpacity
              className="bg-blue-500 rounded-xl py-4 mt-6"
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-center font-semibold text-lg">
                  Iniciar Sesión
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <View className="mt-12 bg-gray-100 rounded-xl p-4">
            <Text className="text-gray-700 font-medium text-center mb-2">
              Credenciales de Demo
            </Text>
            <Text className="text-gray-600 text-sm text-center">
              Admin: admin@tortilleria.com / admin123
            </Text>
            <Text className="text-gray-600 text-sm text-center">
              Empleado: empleado@tortilleria.com / empleado123
            </Text>
            <Text className="text-gray-600 text-sm text-center">
              Repartidor: repartidor@tortilleria.com / repartidor123
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
