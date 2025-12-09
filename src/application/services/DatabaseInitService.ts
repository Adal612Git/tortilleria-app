import { UserRepository } from '../../infrastructure/repositories/UserRepository';
import { EncryptionService } from '../../core/utils/encryption';
import { DemoDataService } from './DemoDataService';

export class DatabaseInitService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async initializeApp(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🚀 INICIANDO APP - MODO EMERGENCIA...');
      
      // 1. Verificar si hay usuarios
      const existingUsers = await this.userRepository.getAllUsers();
      console.log(`📊 Usuarios encontrados: ${existingUsers.length}`);
      
      // 2. SI HAY USUARIOS, VERIFICAR SI ESTÁN BLOQUEADOS
      if (existingUsers.length > 0) {
        console.log('🔍 Analizando estado de usuarios...');
        
        // Verificar el primer usuario como muestra
        const sampleUser = existingUsers[0];
        console.log(`🔐 Usuario muestra: ${sampleUser.email}`);
        console.log(`   Contraseña: ${sampleUser.password} (${sampleUser.password.length} chars)`);
        console.log(`   ¿Hasheada?: ${sampleUser.password.length === 64 ? '✅ SÍ' : '❌ NO'}`);
        
        // Si las contraseñas no están hasheadas, hacer RESET AUTOMÁTICO
        if (sampleUser.password.length !== 64) {
          console.log('🔄 CONTRASEÑAS NO HASHED - EJECUTANDO RESET AUTOMÁTICO...');
          return await this.emergencyReset();
        }
        
        console.log('✅ Usuarios parecen correctos');
        // Semilla de ventas demo si no hay suficientes
        await new DemoDataService().seedDemoSalesIfEmpty(3);
        return { success: true, message: 'App lista' };
      }
      
      // 3. SI NO HAY USUARIOS, CREARLOS
      console.log('👤 CREANDO USUARIOS POR DEFECTO...');
      await this.createDefaultUsers();
      // Semilla de ventas demo
      await new DemoDataService().seedDemoSalesIfEmpty(3);
      return { success: true, message: 'App lista con usuarios nuevos' };
      
    } catch (error: any) {
      console.error('❌ Error crítico:', error);
      return { success: false, message: `Error: ${error.message}` };
    }
  }

  private async createDefaultUsers(): Promise<void> {
    const users = [
      { name: 'Admin', email: 'admin@tortilleria.com', password: 'admin123', role: 'admin' as const },
      { name: 'Empleado', email: 'empleado@tortilleria.com', password: 'empleado123', role: 'empleado' as const },
      { name: 'Repartidor', email: 'repartidor@tortilleria.com', password: 'repartidor123', role: 'repartidor' as const },
    ];

    for (const user of users) {
      try {
        const hashedPassword = await EncryptionService.hashPassword(user.password);
        const userId = await this.userRepository.createUser({
          name: user.name,
          email: user.email,
          password: hashedPassword,
          role: user.role,
          isActive: true
        });
        console.log(`✅ ${user.email} CREADO (ID: ${userId})`);
      } catch (error: any) {
        console.log(`⚠️ ${user.email} - ${error.message}`);
      }
    }
  }

  private async emergencyReset(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🚨 ACTIVANDO PROTOCOLO DE EMERGENCIA...');
      
      // 1. Eliminar todos los usuarios
      const db = await this.userRepository['dbService'].getDatabase();
      await db.execAsync('DELETE FROM users');
      console.log('✅ Todos los usuarios eliminados');
      
      // 2. Crear usuarios nuevos
      await this.createDefaultUsers();
      
      console.log('🎉 RESET DE EMERGENCIA COMPLETADO');
      return { success: true, message: 'Reset de emergencia completado' };
      
    } catch (error: any) {
      console.error('💥 Error en reset de emergencia:', error);
      return { success: false, message: `Reset falló: ${error.message}` };
    }
  }
}
