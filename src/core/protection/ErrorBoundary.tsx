import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error capturado:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#F8FAFC' }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 10, color: '#DC2626' }}>
            ⚠️ Algo salió mal
          </Text>
          <Text style={{ textAlign: 'center', marginBottom: 20, color: '#64748B' }}>
            {this.state.error?.message || 'Error desconocido'}
          </Text>
          <TouchableOpacity 
            style={{ backgroundColor: '#2563EB', padding: 15, borderRadius: 10, minWidth: 120 }}
            onPress={this.resetError}
          >
            <Text style={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}
