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
