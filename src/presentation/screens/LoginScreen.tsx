import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet
} from 'react-native';
import { useAuthStore } from '../store/authStore';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, error, clearError } = useAuthStore();

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
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.headerBox}>
            <Text style={styles.title}>Tortillería</Text>
            <Text style={styles.subtitle}>Inicia sesión en tu cuenta</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputBlock}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="tu@email.com"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.inputBlock}>
              <Text style={styles.label}>Contraseña</Text>
              <TextInput
                style={styles.input}
                placeholder="Tu contraseña"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleLogin} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Iniciar Sesión</Text>}
            </TouchableOpacity>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>

          <View style={styles.demoBox}>
            <Text style={styles.demoTitle}>Credenciales de Demo</Text>
            <Text style={styles.demoText}>Admin: admin@tortilleria.com / admin123</Text>
            <Text style={styles.demoText}>Empleado: empleado@tortilleria.com / empleado123</Text>
            <Text style={styles.demoText}>Repartidor: repartidor@tortilleria.com / repartidor123</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  safe: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 24 },
  headerBox: { alignItems: 'center', marginBottom: 28 },
  title: { fontSize: 32, fontWeight: '800', color: '#111827', marginBottom: 6 },
  subtitle: { fontSize: 16, color: '#6B7280' },
  form: { gap: 14 },
  inputBlock: { marginBottom: 10 },
  label: { color: '#374151', fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB', borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14, fontSize: 16, color: '#111827' },
  button: { backgroundColor: '#1D4ED8', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '700' },
  errorText: { color: '#DC2626', textAlign: 'center', marginTop: 8 },
  demoBox: { marginTop: 28, backgroundColor: '#F3F4F6', borderRadius: 12, padding: 14 },
  demoTitle: { color: '#374151', fontWeight: '700', textAlign: 'center', marginBottom: 6 },
  demoText: { color: '#6B7280', fontSize: 13, textAlign: 'center' },
});
