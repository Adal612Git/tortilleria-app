import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { AppNavigator } from './src/presentation/navigation/AppNavigator';
import { DatabaseInitService } from './src/application/services/DatabaseInitService';
import { useAuthStore } from './src/presentation/store/authStore';
import './src/global.css';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { initializeAuth } = useAuthStore();

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      console.log('🚀 INICIANDO APP...');
      
      const initService = new DatabaseInitService();
      const result = await initService.initializeApp();
      
      if (!result.success) {
        setError(result.message);
        return;
      }

      await initializeAuth();
      
    } catch (err: any) {
      console.error('💥 Error crítico:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = async () => {
    setIsLoading(true);
    setError(null);
    await initializeApp();
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fefefe' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={{ color: '#6b7280', marginTop: 16, fontSize: 16 }}>
          Inicializando aplicación...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fefefe', padding: 32 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#ef4444', textAlign: 'center', marginBottom: 16 }}>
          Error
        </Text>
        <Text style={{ color: '#374151', textAlign: 'center', fontSize: 16, marginBottom: 24 }}>
          {error}
        </Text>
        <TouchableOpacity 
          style={{ backgroundColor: '#3b82f6', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
          onPress={handleRetry}
        >
          <Text style={{ color: 'white', fontWeight: '600' }}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <AppNavigator />;
}
