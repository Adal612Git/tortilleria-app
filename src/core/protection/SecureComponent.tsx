import React, { Component, ComponentType } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { logger } from './Logger';
import { autoRecovery } from './AutoRecovery';
import { anomalyDetector } from './AnomalyDetector';

interface SecureComponentProps {
  componentId: string;
  fallback?: React.ComponentType<any>;
  timeout?: number;
}

interface SecureComponentState {
  hasError: boolean;
  error: Error | null;
  isTimedOut: boolean;
}

export function withSecurity<P extends object>(
  WrappedComponent: ComponentType<P>,
  options: SecureComponentProps = { componentId: 'Unknown' }
): ComponentType<P> {
  const { componentId, fallback: FallbackComponent, timeout = 10000 } = options;

  return class SecureComponent extends Component<P, SecureComponentState> {
    state: SecureComponentState = {
      hasError: false,
      error: null,
      isTimedOut: false,
    };

    private renderTimer: NodeJS.Timeout | null = null;
    private mounted = false;

    componentDidMount() {
      this.mounted = true;
      this.startRenderTimer();
      anomalyDetector.recordBehavior({
        action: `component_mount_${componentId}`,
        timestamp: Date.now(),
        success: true,
        metadata: { componentId },
      });
    }

    componentWillUnmount() {
      this.mounted = false;
      this.clearRenderTimer();
      anomalyDetector.recordBehavior({
        action: `component_unmount_${componentId}`,
        timestamp: Date.now(),
        success: true,
        metadata: { componentId },
      });
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      logger.error(`Error en componente seguro: ${componentId}`, { error, errorInfo });
      anomalyDetector.recordBehavior({
        action: `component_error_${componentId}`,
        timestamp: Date.now(),
        success: false,
        metadata: { error: error.message, componentId },
      });
      this.setState({ hasError: true, error, isTimedOut: false });
      autoRecovery.criticalOperation(async () => {
        if (this.mounted) {
          this.setState({ hasError: false, error: null, isTimedOut: false });
        }
      }, `recover_component_${componentId}`);
    }

    private startRenderTimer() {
      this.clearRenderTimer();
      this.renderTimer = setTimeout(() => {
        if (this.mounted) {
          logger.warn(`Timeout de renderizado en componente: ${componentId}`);
          this.setState({ isTimedOut: true });
          anomalyDetector.recordBehavior({
            action: `component_timeout_${componentId}`,
            timestamp: Date.now(),
            success: false,
            metadata: { componentId, timeout },
          });
        }
      }, timeout);
    }

    private clearRenderTimer() {
      if (this.renderTimer) {
        clearTimeout(this.renderTimer);
        this.renderTimer = null;
      }
    }

    private handleRetry = () => {
      logger.info(`Reintentando componente: ${componentId}`);
      this.setState({ hasError: false, error: null, isTimedOut: false });
      this.startRenderTimer();
      anomalyDetector.recordBehavior({
        action: `component_retry_${componentId}`,
        timestamp: Date.now(),
        success: true,
        metadata: { componentId },
      });
    };

    private handleEmergencyReset = () => {
      logger.warn(`Reset de emergencia para componente: ${componentId}`);
      autoRecovery.emergencyReset().then((success) => {
        if (success) {
          this.handleRetry();
        }
      });
    };

    render() {
      const { hasError, error, isTimedOut } = this.state;

      if (hasError || isTimedOut) {
        if (FallbackComponent) {
          return <FallbackComponent {...this.props} />;
        }

        return (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>
              {isTimedOut ? 'Tiempo excedido' : 'Error en componente'}
            </Text>
            <Text style={styles.errorMessage}>
              {error?.message || 'El componente tardo demasiado en responder'}
            </Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.retryButton} onPress={this.handleRetry}>
                <Text style={styles.buttonText}>Reintentar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.emergencyButton} onPress={this.handleEmergencyReset}>
                <Text style={styles.buttonText}>Reset</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      }

      return <WrappedComponent {...this.props} />;
    }
  };
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    margin: 10,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#7F1D1D',
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  retryButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  emergencyButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
});

export const SecureView: React.FC<{ children: React.ReactNode; id: string }> = ({ children, id }) => {
  const SecureContentView = withSecurity(() => <>{children}</>, { componentId: id });
  return <SecureContentView />;
};
