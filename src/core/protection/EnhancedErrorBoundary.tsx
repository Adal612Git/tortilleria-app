import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
    children: React.ReactNode;
    context?: string;
}

interface State {
    hasError: boolean;
}

export class EnhancedErrorBoundary extends React.Component<Props, State> {
    state: State = { hasError: false };

    static getDerivedStateFromError(): State {
        return { hasError: true };
    }

    componentDidCatch(error: Error) {
        console.error('Error Boundary:', error);
    }

    render() {
        if (this.state.hasError) {
            return (
                <View style={styles.container}>
                    <Text style={styles.title}>¡Algo salió mal!</Text>
                    <Text style={styles.subtitle}>{this.props.context || 'Error en la app'}</Text>
                    <TouchableOpacity style={styles.button} onPress={() => this.setState({ hasError: false })}>
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
        flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#F8FAFC'
    },
    title: {
        fontSize: 24, fontWeight: 'bold', color: '#1E293B', marginBottom: 8
    },
    subtitle: {
        fontSize: 16, color: '#64748B', textAlign: 'center', marginBottom: 24
    },
    button: {
        backgroundColor: '#1E40AF', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8
    },
    buttonText: {
        color: 'white', fontSize: 16, fontWeight: 'bold'
    },
});
