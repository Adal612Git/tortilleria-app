import { DatabaseService } from '../infrastructure/database/DatabaseService';
import { EncryptionService } from '../core/utils/encryption';

export const hardReset = async (): Promise<void> => {
  try {
    console.log('💥 INICIANDO RESET COMPLETO DE LA BASE DE DATOS...');
    
    const dbService = DatabaseService.getInstance();
    const db = await dbService.getDatabase();
    await db.execAsync('DROP TABLE IF EXISTS users');
    await db.execAsync('DROP TABLE IF EXISTS products');
    await db.execAsync('DROP TABLE IF EXISTS sales');
    
    console.log('✅ Tablas eliminadas. Reiniciando app...');
    
    // La próxima vez que se inicie la app, creará las tablas y usuarios desde cero
  } catch (error) {
    console.error('❌ Error en hard reset:', error);
  }
};
