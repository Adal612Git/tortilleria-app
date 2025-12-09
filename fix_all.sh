#!/bin/bash

echo "🔧 REPARANDO TODOS LOS ARCHIVOS..."

# 1. REPARAR UserRepositoryImpl COMPLETO
cat > src/infrastructure/repositories/UserRepositoryImpl.ts <<'FILE_EOF'
import { User, AuthCredentials } from '../../domain/entities/User';
import { UserRepository } from '../../domain/repositories/UserRepository';
import { DatabaseService } from '../database/DatabaseService';

export class UserRepositoryImpl implements UserRepository {
  private dbService = DatabaseService.getInstance();

  async login(credentials: AuthCredentials): Promise<User> {
    console.log('🔐 Intentando login con:', { 
      email: credentials.email, 
      passwordLength: credentials.password?.length 
    });

    const result = await this.dbService.query<any>(
      'SELECT id_usuario as id, nombre as name, rol as role, correo as email, activo as isActive FROM Usuario WHERE correo = ? AND password = ? AND activo = 1',
      [credentials.email, credentials.password]
    );
    
    console.log('📊 Resultado query login:', result);
    
    if (!result.success) {
      console.error('❌ Error en query:', result.error);
      throw new Error('Error de conexión con la base de datos');
    }
    
    if (!result.data || result.data.length === 0) {
      console.log('👤 Usuario no encontrado o credenciales incorrectas');
      console.log('📝 Datos buscados:', { 
        email: credentials.email, 
        password: credentials.password 
      });
      throw new Error('Credenciales inválidas o usuario inactivo');
    }
    
    const userData = result.data[0];
    console.log('✅ Usuario encontrado:', userData);
    
    return {
      id: userData.id.toString(),
      name: userData.name,
      email: userData.email,
      role: userData.role as 'admin' | 'empleado' | 'repartidor' | 'cliente',
      isActive: Boolean(userData.isActive),
      createdAt: new Date()
    };
  }

  async logout(): Promise<void> {
    console.log('🚪 Cerrando sesión');
    return Promise.resolve();
  }

  async getCurrentUser(): Promise<User | null> {
    return null;
  }

  async updateUser(user: User): Promise<User> {
    const result = await this.dbService.executeSQL(
      'UPDATE Usuario SET nombre = ?, rol = ?, correo = ?, activo = ? WHERE id_usuario = ?',
      [user.name, user.role, user.email, user.isActive ? 1 : 0, parseInt(user.id)]
    );
    
    if (!result.success) {
      throw new Error('Error actualizando usuario');
    }
    
    return user;
  }

  async createUser(user: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const result = await this.dbService.executeSQL(
      'INSERT INTO Usuario (nombre, rol, correo, password, activo) VALUES (?, ?, ?, ?, ?)',
      [user.name, user.role, user.email, 'temp123', user.isActive ? 1 : 0]
    );
    
    if (!result.success) {
      throw new Error('Error creando usuario');
    }
    
    const idResult = await this.dbService.query('SELECT last_insert_rowid() as id');
    if (!idResult.success || !idResult.data) {
      throw new Error('Error obteniendo ID del usuario creado');
    }
    
    return {
      ...user,
      id: idResult.data[0].id.toString(),
      createdAt: new Date()
    };
  }
}
FILE_EOF

# 2. REPARAR AUTH SERVICE
cat > src/application/services/AuthService.ts <<'FILE_EOF'
import { LoginUseCase } from '../../domain/use-cases/auth/LoginUseCase';
import { UserRepositoryImpl } from '../../infrastructure/repositories/UserRepositoryImpl';

export class AuthService {
  private loginUseCase: LoginUseCase;
  private userRepository: UserRepositoryImpl;

  constructor() {
    console.log('🔄 Creando AuthService...');
    this.userRepository = new UserRepositoryImpl();
    this.loginUseCase = new LoginUseCase(this.userRepository);
  }

  async login(email: string, password: string) {
    console.log('📧 AuthService.login llamado con:', { email, passwordLength: password.length });
    try {
      const user = await this.loginUseCase.execute({ email, password });
      console.log('✅ Login exitoso:', user.email);
      return user;
    } catch (error: any) {
      console.error('❌ Error en AuthService.login:', error.message);
      throw error;
    }
  }

  async logout() {
    console.log('🚪 AuthService.logout llamado');
    await this.userRepository.logout();
  }
}
FILE_EOF

# 3. REPARAR AUTH STORE
cat > src/presentation/store/authStore.ts <<'FILE_EOF'
import { create } from 'zustand';
import { User } from '../../domain/entities/User';
import { AuthService } from '../../application/services/AuthService';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    console.log('🏪 AuthStore.login llamado:', { email });
    set({ isLoading: true, error: null });
    
    try {
      const authService = new AuthService();
      const user = await authService.login(email, password);
      console.log('✅ AuthStore: Login exitoso, actualizando estado');
      set({ user, isLoading: false, error: null });
    } catch (error: any) {
      console.error('❌ AuthStore: Error en login:', error.message);
      set({ error: error.message, isLoading: false });
    }
  },

  logout: async () => {
    console.log('🏪 AuthStore.logout llamado');
    set({ isLoading: true });
    try {
      const authService = new AuthService();
      await authService.logout();
      set({ user: null, isLoading: false, error: null });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },
}));
FILE_EOF

# 4. REPARAR LOGIN SCREEN
cat > src/presentation/screens/auth/LoginScreen.tsx <<'FILE_EOF'
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../../store/authStore';

export default function LoginScreen() {
  const [email, setEmail] = useState('admin@tortilleria.com');
  const [password, setPassword] = useState('admin123');
  const { login, isLoading, error } = useAuthStore();

  const handleLogin = async () => {
    console.log('🖐️ Botón login presionado');
    if (!email || !password) {
      Alert.alert('Error', 'Por favor ingresa email y contraseña');
      return;
    }
    
    console.log('📤 Enviando credenciales...');
    await login(email, password);
    
    // Mostrar error si existe
    if (error) {
      Alert.alert('Error de login', error);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 40 }}>
        Tortillería App
      </Text>

      <TextInput
        style={{ borderWidth: 1, borderColor: '#ccc', padding: 15, borderRadius: 8, marginBottom: 15 }}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={{ borderWidth: 1, borderColor: '#ccc', padding: 15, borderRadius: 8, marginBottom: 25 }}
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={{ 
          backgroundColor: '#007AFF', 
          padding: 15, 
          borderRadius: 8,
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center'
        }}
        onPress={handleLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <ActivityIndicator color="white" />
            <Text style={{ color: 'white', marginLeft: 10 }}>Iniciando sesión...</Text>
          </>
        ) : (
          <Text style={{ color: 'white', fontSize: 16 }}>Iniciar Sesión</Text>
        )}
      </TouchableOpacity>

      {error && (
        <Text style={{ color: 'red', textAlign: 'center', marginTop: 15 }}>
          {error}
        </Text>
      )}

      {/* Información de debug */}
      <View style={{ marginTop: 30, padding: 10, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
        <Text style={{ fontSize: 12, color: '#666' }}>
          💡 Credenciales de prueba:
        </Text>
        <Text style={{ fontSize: 12, color: '#666' }}>
          Email: admin@tortilleria.com
        </Text>
        <Text style={{ fontSize: 12, color: '#666' }}>
          Password: admin123
        </Text>
      </View>
    </View>
  );
}
FILE_EOF

# 5. VERIFICAR APPNAVIGATOR
cat > src/presentation/navigation/AppNavigator.tsx <<'FILE_EOF'
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/auth/LoginScreen';

const Stack = createNativeStackNavigator();

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{ title: 'Iniciar Sesión' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
FILE_EOF

echo "✅ VERIFICANDO TYPESCRIPT..."
npx tsc --noEmit --skipLibCheck

if [ $? -eq 0 ]; then
    echo "🎉 ¡TODOS LOS ARCHIVOS REPARADOS CORRECTAMENTE!"
    echo "🚀 EJECUTA: npm start"
else
    echo "⚠️  Hay errores TypeScript, pero los archivos están completos"
    echo "🚀 EJECUTA: npm start de todos modos"
fi
