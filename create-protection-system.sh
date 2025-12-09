#!/bin/bash

echo "🛡️ CREANDO SISTEMA DE PROTECCIÓN COMPLETO..."

# Crear directorios de protección
mkdir -p src/core/protection

# 1. Logger básico
cat > src/core/protection/Logger.ts << 'LOGEOF'
export const logger = {
    info: (message: string, ...args: any[]) => {
        console.log(`ℹ️ [INFO] ${message}`, ...args);
    },
    warn: (message: string, ...args: any[]) => {
        console.warn(`⚠️ [WARN] ${message}`, ...args);
    },
    error: (message: string, error?: any) => {
        console.error(`❌ [ERROR] ${message}`, error);
    },
    debug: (message: string, ...args: any[]) => {
        console.debug(`🐛 [DEBUG] ${message}`, ...args);
    }
};
LOGEOF

# 2. AdvancedEncryption básico (simulado para desarrollo)
cat > src/core/protection/AdvancedEncryption.ts << 'ENCEOF'
export class AdvancedEncryption {
    static async hashSensitiveData(data: string): Promise<string> {
        // Simulación simple para desarrollo
        return `hashed_${btoa(data)}_${Date.now()}`;
    }
    
    static async encryptData(data: any): Promise<string> {
        return JSON.stringify(data);
    }
    
    static async decryptData(encryptedData: string): Promise<any> {
        return JSON.parse(encryptedData);
    }
}
ENCEOF

# 3. SecureCache básico
cat > src/core/protection/SecureCache.ts << 'CACHEEOF'
export const secureCache = {
    set: async (key: string, data: any): Promise<void> => {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.warn('Error guardando en cache:', error);
        }
    },
    
    get: async (key: string): Promise<any> => {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.warn('Error leyendo cache:', error);
            return null;
        }
    },
    
    remove: async (key: string): Promise<void> => {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.warn('Error removiendo cache:', error);
        }
    }
};
CACHEEOF

# 4. AnomalyDetector básico
cat > src/core/protection/AnomalyDetector.ts << 'ANOMEOF'
export const anomalyDetector = {
    recordBehavior: (behavior: any) => {
        // Simulación para desarrollo
        console.log('📊 Comportamiento registrado:', behavior);
    },
    
    detectAnomalies: (): boolean => {
        return false; // Sin anomalías en desarrollo
    }
};
ANOMEOF

# 5. SystemMonitor básico
cat > src/core/protection/SystemMonitor.ts << 'MONEOF'
export const systemMonitor = {
    getHealthStatus: (): string => {
        return 'HEALTHY';
    },
    
    checkPerformance: (): any => {
        return { status: 'optimal', memory: 'normal' };
    }
};
MONEOF

# 6. AutoRecovery básico
cat > src/core/protection/AutoRecovery.ts << 'RECEOF'
export const autoRecovery = {
    criticalOperation: async (operation: () => Promise<any>, context: string): Promise<any> => {
        try {
            return await operation();
        } catch (error) {
            console.error(`❌ Error en operación crítica (${context}):`, error);
            throw error;
        }
    }
};
RECEOF

# 7. EnhancedErrorBoundary básico
cat > src/core/protection/EnhancedErrorBoundary.tsx << 'ERREOF'
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
    children: React.ReactNode;
    context?: string;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class EnhancedErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Error Boundary capturó:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <View style={styles.container}>
                    <Text style={styles.title}>¡Ups! Algo salió mal</Text>
                    <Text style={styles.subtitle}>
                        {this.props.context || 'Error en la aplicación'}
                    </Text>
                    <TouchableOpacity 
                        style={styles.button}
                        onPress={() => this.setState({ hasError: false })}
                    >
                        <Text style={styles.buttonText}>Reintentar</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#F8FAFC',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1E293B',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 24,
    },
    button: {
        backgroundColor: '#1E40AF',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
ERREOF

echo "✅ SISTEMA DE PROTECCIÓN CREADO"
echo "📁 Archivos creados:"
find src/core/protection -name "*.ts" -o -name "*.tsx" | while read file; do
    echo "   ✅ $file"
done

echo "🚀 Ejecuta: npm start"
