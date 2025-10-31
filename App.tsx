import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/presentation/navigation/AppNavigator';
import { StatusBar } from 'expo-status-bar';
import { DatabaseInitService } from './src/application/services/DatabaseInitService';

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
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                    <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 12 }}>¡Algo salió mal!</Text>
                    <TouchableOpacity onPress={() => this.setState({ hasError: false })} style={{ paddingVertical: 12, paddingHorizontal: 20, backgroundColor: '#1E40AF', borderRadius: 8 }}>
                        <Text style={{ color: 'white', fontWeight: '600' }}>Reintentar</Text>
                    </TouchableOpacity>
                </View>
            );
        }
        return this.props.children;
    }
}

const initializeApp = async () => {
    try {
        console.log('🚀 INICIANDO APLICACIÓN TORTILLERÍA...');
        const init = new DatabaseInitService();
        const res = await init.initializeApp();
        console.log(`✅ ${res.message}`);
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
            <SafeAreaProvider>
                <StatusBar style="dark" />
                <AppNavigator />
            </SafeAreaProvider>
        </SimpleErrorBoundary>
    );
}
