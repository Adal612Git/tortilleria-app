import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../../domain/entities/User';
import { AuthService } from '../../application/services/AuthService';
import { Logger } from '../../core/utils/logger';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  loginAttempts: number;
  lastAttempt: number | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  initializeAuth: () => Promise<void>;
}

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutos

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      error: null,
      loginAttempts: 0,
      lastAttempt: null,
      
      initializeAuth: async () => {
        console.log('✅ Auth store inicializado');
      },

      login: async (email: string, password: string) => {
        const state = get();
        const now = Date.now();
        
        // Validar intentos bloqueados
        if (state.loginAttempts >= MAX_LOGIN_ATTEMPTS && 
            state.lastAttempt && 
            (now - state.lastAttempt) < LOCKOUT_DURATION) {
          const remainingTime = Math.ceil((LOCKOUT_DURATION - (now - state.lastAttempt)) / 60000);
          set({ 
            error: `Demasiados intentos. Espere ${remainingTime} minutos.`,
            isLoading: false 
          });
          await Logger.logAuthEvent('LOGIN_BLOCKED', email, false);
          return;
        }

        set({ isLoading: true, error: null });

        try {
          // Validaciones básicas
          if (!email || !password) {
            throw new Error('Email y contraseña son requeridos');
          }

          if (!/\S+@\S+\.\S+/.test(email)) {
            throw new Error('Formato de email inválido');
          }

          const authService = new AuthService();
          const result = await authService.login(email, password);
          
          if (result.success && result.user) {
            // Login exitoso - resetear contadores
            set({ 
              user: result.user as any, 
              isLoading: false, 
              error: null,
              loginAttempts: 0,
              lastAttempt: null 
            });
            await Logger.logAuthEvent('LOGIN_SUCCESS', email, true);
          } else {
            // Login fallido - incrementar contadores
            const newAttempts = state.loginAttempts + 1;
            set({ 
              isLoading: false, 
              error: result.message || 'Usuario o contraseña incorrectos',
              loginAttempts: newAttempts,
              lastAttempt: now
            });
            await Logger.logAuthEvent('LOGIN_FAILED', email, false);
          }
        } catch (error: any) {
          await Logger.logAuthEvent('LOGIN_ERROR', email, false);
          set({ 
            isLoading: false, 
            error: error.message 
          });
        }
      },
      
      logout: () => {
        const userEmail = get().user?.email;
        Logger.logAuthEvent('LOGOUT', userEmail, true);
        set({ 
          user: null, 
          error: null,
          loginAttempts: 0,
          lastAttempt: null 
        });
      },
      
      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      version: 2,
      migrate: async (persistedState: any, version: number) => {
        // Resetear sesión de versiones anteriores o roles inválidos
        const allowedRoles = ['admin', 'empleado', 'repartidor'];
        const user = persistedState?.state?.user ?? persistedState?.user;
        const role = user?.role;
        const invalidRole = role && !allowedRoles.includes(role);
        if (version < 2 || invalidRole) {
          const base = persistedState?.state ?? persistedState ?? {};
          return {
            ...base,
            user: null,
            error: null,
            loginAttempts: 0,
            lastAttempt: null,
          };
        }
        return persistedState;
      },
    }
  )
);
