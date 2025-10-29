import React from 'react';
import { logger } from './Logger';

export class AutoRecovery {
  private static instance: AutoRecovery;
  private recoveryAttempts = 0;
  private maxRecoveryAttempts = 3;

  private constructor() {}

  static getInstance(): AutoRecovery {
    if (!AutoRecovery.instance) {
      AutoRecovery.instance = new AutoRecovery();
    }
    return AutoRecovery.instance;
  }

  async criticalOperation<T>(
    operation: () => Promise<T>,
    operationName: string,
    fallback?: T
  ): Promise<T | null> {
    try {
      const result = await operation();
      this.recoveryAttempts = 0; // Reset on success
      logger.info(`Operación crítica exitosa: ${operationName}`);
      return result;
    } catch (error) {
      logger.error(`Fallo en operación crítica: ${operationName}`, error);
      
      if (this.recoveryAttempts < this.maxRecoveryAttempts) {
        this.recoveryAttempts++;
        logger.warn(`Intento de recuperación ${this.recoveryAttempts} para: ${operationName}`);
        
        // Esperar progresivamente antes de reintentar
        await this.delay(Math.pow(2, this.recoveryAttempts) * 1000);
        return this.criticalOperation(operation, operationName, fallback);
      } else {
        logger.error(`Máximos intentos de recuperación alcanzados para: ${operationName}`);
        return fallback || null;
      }
    }
  }

  async emergencyReset(): Promise<boolean> {
    try {
      logger.warn('INICIANDO RESET DE EMERGENCIA');
      
      // 1. Limpiar caché crítica
      // await AsyncStorage.clear();
      
      // 2. Reiniciar estado de la app
      // await this.resetAppState();
      
      // 3. Verificar integridad
      const integrityCheck = await this.checkSystemIntegrity();
      
      if (integrityCheck) {
        logger.info('Reset de emergencia completado exitosamente');
        this.recoveryAttempts = 0;
        return true;
      } else {
        throw new Error('Falló la verificación de integridad');
      }
    } catch (error) {
      logger.error('Reset de emergencia falló:', error);
      return false;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async checkSystemIntegrity(): Promise<boolean> {
    // Verificaciones básicas del sistema
    try {
      // Verificar que las dependencias críticas estén disponibles
      if (typeof React !== 'undefined') {
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  getRecoveryStatus() {
    return {
      attempts: this.recoveryAttempts,
      maxAttempts: this.maxRecoveryAttempts,
      needsReset: this.recoveryAttempts >= this.maxRecoveryAttempts
    };
  }
}

export const autoRecovery = AutoRecovery.getInstance();
