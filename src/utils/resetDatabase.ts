import { DatabaseInitService } from '../application/services/DatabaseInitService';

export const resetDatabase = async () => {
  try {
    console.log('🔄 Reseteando base de datos...');
    const initService = new DatabaseInitService();
    await initService.initializeApp();
    console.log('✅ Base de datos reseteada exitosamente');
  } catch (error) {
    console.error('❌ Error al resetear base de datos:', error);
  }
};
