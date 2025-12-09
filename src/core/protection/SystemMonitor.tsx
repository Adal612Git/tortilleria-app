import { logger } from './Logger';

interface SystemMetrics {
  timestamp: number;
  performance: {
    memoryUsage: number;
    renderTime: number;
    fps: number;
  };
  errors: {
    total: number;
    critical: number;
    recovered: number;
  };
  business: {
    activeSessions: number;
    pendingOperations: number;
    successfulOperations: number;
  };
}

export class SystemMonitor {
  private metrics: SystemMetrics[] = [];
  private maxMetricsHistory = 100;
  private errorCount = 0;
  private criticalErrorCount = 0;
  private recoveredErrorCount = 0;

  private performanceObserver: any = null;
  private lastRenderTime = 0;

  constructor() {
    this.startMonitoring();
  }

  private startMonitoring() {
    // Monitorear rendimiento (simulado en React Native)
    this.monitorPerformance();
    
    // Monitorear errores globales
    this.monitorGlobalErrors();
    
    logger.info('Sistema de monitoreo iniciado');
  }

  private monitorPerformance() {
    // En una app real, usaría Performance API o métricas nativas
    setInterval(() => {
      const metric: SystemMetrics = {
        timestamp: Date.now(),
        performance: {
          memoryUsage: this.estimateMemoryUsage(),
          renderTime: this.measureRenderTime(),
          fps: this.estimateFPS()
        },
        errors: {
          total: this.errorCount,
          critical: this.criticalErrorCount,
          recovered: this.recoveredErrorCount
        },
        business: {
          activeSessions: 1, // Simulado
          pendingOperations: 0,
          successfulOperations: this.errorCount > 0 ? 0 : 100 // Simulado
        }
      };

      this.metrics.push(metric);
      
      // Mantener solo el historial reciente
      if (this.metrics.length > this.maxMetricsHistory) {
        this.metrics = this.metrics.slice(-this.maxMetricsHistory);
      }

      // Alertar si hay degradación
      this.checkForDegradation(metric);

    }, 30000); // Cada 30 segundos
  }

  private monitorGlobalErrors() {
    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
      this.recordError('CONSOLE_ERROR', args.join(' '));
      originalConsoleError.apply(console, args);
    };

    // En React Native podríamos capturar más errores globales
  }

  recordError(type: string, message: string, isCritical = false) {
    this.errorCount++;
    if (isCritical) {
      this.criticalErrorCount++;
    }
    
    logger.error(`Error registrado: ${type}`, { message, isCritical });
    
    // Verificar si necesitamos acción inmediata
    if (this.criticalErrorCount > 5) {
      this.triggerEmergencyProtocol();
    }
  }

  recordRecovery() {
    this.recoveredErrorCount++;
    logger.info('Recuperación de error registrada');
  }

  private estimateMemoryUsage(): number {
    // Simulación - en React Native real usaría Memory API
    return Math.random() * 100;
  }

  private measureRenderTime(): number {
    const now = Date.now();
    const renderTime = now - this.lastRenderTime;
    this.lastRenderTime = now;
    return renderTime;
  }

  private estimateFPS(): number {
    // Simulación de FPS
    return 60 - (this.errorCount * 2);
  }

  private checkForDegradation(metric: SystemMetrics) {
    const recentMetrics = this.metrics.slice(-5);
    
    // Verificar tendencia de errores
    const errorTrend = recentMetrics.filter(m => m.errors.total > 0).length;
    if (errorTrend >= 3) {
      logger.warn('Tendencia de errores detectada', { errorTrend });
    }

    // Verificar rendimiento
    const avgRenderTime = recentMetrics.reduce((sum, m) => sum + m.performance.renderTime, 0) / recentMetrics.length;
    if (avgRenderTime > 1000) { // Más de 1 segundo
      logger.warn('Degradación de rendimiento detectada', { avgRenderTime });
    }
  }

  private triggerEmergencyProtocol() {
    logger.error('PROTOCOLO DE EMERGENCIA ACTIVADO');
    // Aquí se podrían tomar acciones como:
    // - Forzar recarga de la app
    // - Limpiar caché
    // - Cambiar a modo seguro
  }

  getHealthStatus(): 'HEALTHY' | 'DEGRADED' | 'CRITICAL' {
    if (this.criticalErrorCount > 10) return 'CRITICAL';
    if (this.errorCount > 20 || this.criticalErrorCount > 3) return 'DEGRADED';
    return 'HEALTHY';
  }

  getMetrics(): SystemMetrics[] {
    return [...this.metrics];
  }

  resetCounters() {
    this.errorCount = 0;
    this.criticalErrorCount = 0;
    this.recoveredErrorCount = 0;
    logger.info('Contadores del monitor reiniciados');
  }
}

export const systemMonitor = new SystemMonitor();
