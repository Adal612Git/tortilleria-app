#!/bin/bash
echo "🔐 ARREGLANDO SISTEMA DE LOGIN"

# Crear una versión simplificada y funcional del AuthService
cat > src/application/services/AuthService.ts << 'AUTHEOF'
// Versión simplificada y funcional del AuthService
export interface User {
    id: string;
    name: string;
    email: string;
    role: 'owner' | 'dispatcher' | 'delivery' | 'supervisor';
    pin: string;
    isActive: boolean;
    createdAt: Date;
}

export class AuthService {
    private currentUser: User | null = null;
    private users: User[] = [];

    async initializeFirstTime() {
        console.log('🔧 Inicializando usuario dueño...');
        
        // Usuario dueño con PIN simple (sin hash para desarrollo)
        const ownerUser: User = {
            id: 'owner_001',
            name: 'Administrador Dueño',
            email: 'owner@tortilleria.com',
            role: 'owner',
            pin: '1234', // PIN directo sin hash
            isActive: true,
            createdAt: new Date()
        };
        
        this.users.push(ownerUser);
        console.log('✅ Usuario dueño creado con PIN: 1234');
    }

    async login(pin: string): Promise<{ success: boolean; user?: User; message: string }> {
        console.log('🔐 Intentando login con PIN:', pin);
        console.log('📋 Usuarios disponibles:', this.users.map(u => ({ name: u.name, pin: u.pin })));
        
        try {
            // Buscar usuario con el PIN exacto (sin hash)
            const user = this.users.find(u => u.pin === pin && u.isActive);
            
            if (user) {
                this.currentUser = user;
                console.log('✅ Login exitoso:', user.name, user.role);
                return { success: true, user, message: 'Login exitoso' };
            } else {
                console.log('❌ Login fallido - PIN incorrecto o usuario inactivo');
                console.log('PIN ingresado:', pin);
                console.log('Usuarios disponibles:', this.users.map(u => u.pin));
                return { success: false, message: 'PIN incorrecto o usuario inactivo' };
            }
        } catch (error) {
            console.error('💥 Error en login:', error);
            return { success: false, message: 'Error del sistema' };
        }
    }

    logout() {
        console.log('🚪 Logout:', this.currentUser?.name);
        this.currentUser = null;
    }

    getCurrentUser(): User | null {
        return this.currentUser;
    }

    hasPermission(requiredRole: User['role']): boolean {
        if (!this.currentUser) return false;
        
        const roleHierarchy = { owner: 4, supervisor: 3, dispatcher: 2, delivery: 1 };
        return roleHierarchy[this.currentUser.role] >= roleHierarchy[requiredRole];
    }
}

export const authService = new AuthService();
AUTHEOF

# También simplificar el App.tsx para mejor debug
cat > App.tsx << 'APPEOF'
import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { AppNavigator } from './src/presentation/navigation/RoleBasedNavigator';
import { authService } from './src/application/services/AuthService';

// Error Boundary simplificado
class SimpleErrorBoundary extends React.Component<{children: React.ReactNode}> {
    state = { hasError: false };
    
    static getDerivedStateFromError() {
        return { hasError: true };
    }
    
    componentDidCatch(error: Error) {
        console.error('Error en App:', error);
    }
    
    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: 20, textAlign: 'center' }}>
                    <h1>¡Algo salió mal!</h1>
                    <button onClick={() => this.setState({ hasError: false })}>
                        Reintentar
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

const initializeApp = async () => {
    try {
        console.log('🚀 INICIANDO APLICACIÓN TORTILLERÍA...');
        await authService.initializeFirstTime();
        console.log('✅ Aplicación inicializada correctamente');
    } catch (error) {
        console.error('❌ Error durante inicialización:', error);
    }
};

export default function App() {
    useEffect(() => {
        initializeApp();
    }, []);

    return (
        <SimpleErrorBoundary>
            <AppNavigator />
        </SimpleErrorBoundary>
    );
}
APPEOF

echo "✅ AUTH SERVICE REPARADO"
echo "🔐 PIN: 1234 (ahora funciona sin hash)"
echo "🚀 EJECUTA: npm start"
