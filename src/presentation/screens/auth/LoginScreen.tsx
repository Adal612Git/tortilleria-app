import React, { useState } from 'react';
import { View, Text, Alert, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fefefe' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  
  // Header mejorado
  headerContainer: { 
    alignItems: 'center', 
    marginBottom: 32,
    backgroundColor: '#fffbeb',
    padding: 24,
    borderRadius: 24,
    marginHorizontal: 8
  },
  title: { 
    fontSize: 32, 
    fontWeight: 'bold', 
    color: '#92400e', 
    marginBottom: 8 
  },
  subtitle: { 
    color: '#57534e', 
    fontSize: 16, 
    textAlign: 'center' 
  },
  
  // Login card
  loginTitle: { 
    fontSize: 24, 
    fontWeight: '600', 
    color: '#1f2937', 
    marginBottom: 8 
  },
  loginSubtitle: { 
    color: '#6b7280', 
    fontSize: 16, 
    marginBottom: 24 
  },
  
  // Error container
  errorContainer: { 
    marginTop: 16, 
    padding: 12, 
    backgroundColor: '#fef2f2', 
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444'
  },
  errorText: { 
    color: '#dc2626', 
    fontSize: 14, 
    textAlign: 'center' 
  },
  
  // Info card mejorada
  infoCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 20,
    padding: 20,
    marginTop: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#22c55e'
  },
  infoTitle: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: '#166534', 
    marginBottom: 12 
  },
  roleContainer: { 
    marginBottom: 16 
  },
  roleRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  roleColor: { 
    width: 24, 
    height: 24, 
    borderRadius: 12, 
    marginRight: 12, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  roleText: { 
    fontSize: 14, 
    fontWeight: '500', 
    color: '#374151' 
  },
  roleSubtext: { 
    fontSize: 12, 
    color: '#6b7280' 
  },
  
  // Credentials
  credentialsContainer: { 
    paddingTop: 16, 
    borderTopWidth: 1, 
    borderTopColor: '#d1d5db' 
  },
  credentialsTitle: { 
    fontSize: 14, 
    fontWeight: '500', 
    color: '#374151', 
    marginBottom: 8 
  },
  credentialText: { 
    fontSize: 12, 
    color: '#6b7280', 
    marginBottom: 2 
  }
});

export default function LoginScreen() {
  const [email, setEmail] = useState('admin@tortilleria.com');
  const [password, setPassword] = useState('admin123');
  const { login, isLoading, error } = useAuthStore();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor ingresa email y contraseña');
      return;
    }
    
    await login(email, password);
  };

  const handleTestLogin = (testEmail: string, testPassword: string) => {
    setEmail(testEmail);
    setPassword(testPassword);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.scrollContent}>
        
        {/* Header Mejorado */}
        <View style={styles.headerContainer}>
          <Text style={styles.title}>🌮 Tortillería App</Text>
          <Text style={styles.subtitle}>Sistema de gestión integral</Text>
        </View>

        {/* Login Card */}
        <Card variant="elevated" padding="lg">
          <Text style={styles.loginTitle}>👋 Iniciar Sesión</Text>
          <Text style={styles.loginSubtitle}>Ingresa tus credenciales para continuar</Text>

          <Input
            label="📧 Correo electrónico"
            placeholder="usuario@tortilleria.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Input
            label="🔑 Contraseña" 
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Button
            title="🎯 Iniciar Sesión"
            onPress={handleLogin}
            loading={isLoading}
            fullWidth
            size="lg"
          />

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </Card>

        {/* Info Card Mejorada */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>🎨 Sistema de Diseño - HU1.4</Text>
          
          <View style={styles.roleContainer}>
            <View style={styles.roleRow}>
              <View style={[styles.roleColor, { backgroundColor: '#3b82f6' }]}>
                <Text style={{ color: 'white', fontSize: 12 }}>A</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.roleText}>Admin</Text>
                <Text style={styles.roleSubtext}>Confianza y control</Text>
              </View>
              <TouchableOpacity 
                onPress={() => handleTestLogin('admin@tortilleria.com', 'admin123')}
                style={{ padding: 8, backgroundColor: '#dbeafe', borderRadius: 8 }}
              >
                <Text style={{ fontSize: 12, color: '#1e40af' }}>Probar</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.roleRow}>
              <View style={[styles.roleColor, { backgroundColor: '#10b981' }]}>
                <Text style={{ color: 'white', fontSize: 12 }}>E</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.roleText}>Empleado</Text>
                <Text style={styles.roleSubtext}>Productividad y estabilidad</Text>
              </View>
              <TouchableOpacity 
                onPress={() => handleTestLogin('empleado@tortilleria.com', 'empleado123')}
                style={{ padding: 8, backgroundColor: '#d1fae5', borderRadius: 8 }}
              >
                <Text style={{ fontSize: 12, color: '#065f46' }}>Probar</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.roleRow}>
              <View style={[styles.roleColor, { backgroundColor: '#f59e0b' }]}>
                <Text style={{ color: 'white', fontSize: 12 }}>R</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.roleText}>Repartidor</Text>
                <Text style={styles.roleSubtext}>Energía y acción</Text>
              </View>
              <TouchableOpacity 
                onPress={() => handleTestLogin('repartidor@tortilleria.com', 'repartidor123')}
                style={{ padding: 8, backgroundColor: '#fef3c7', borderRadius: 8 }}
              >
                <Text style={{ fontSize: 12, color: '#92400e' }}>Probar</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.credentialsContainer}>
            <Text style={styles.credentialsTitle}>💡 Credenciales de prueba:</Text>
            <Text style={styles.credentialText}>• Admin: admin@tortilleria.com / admin123</Text>
            <Text style={styles.credentialText}>• Empleado: empleado@tortilleria.com / empleado123</Text>
            <Text style={styles.credentialText}>• Repartidor: repartidor@tortilleria.com / repartidor123</Text>
            <Text style={styles.credentialText}>• Test: test@tortilleria.com / test123</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
