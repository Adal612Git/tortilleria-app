const SQLite = require('expo-sqlite');

function emergencyReset() {
  console.log('🚨 INICIANDO RESET DE EMERGENCIA...');
  
  try {
    const db = SQLite.openDatabaseSync('tortilleria.db');
    
    // Eliminar todos los usuarios existentes
    db.runSync('DELETE FROM users');
    console.log('✅ Todos los usuarios eliminados');
    
    console.log('🎯 La próxima vez que inicies la app, creará usuarios nuevos con contraseñas hasheadas');
  } catch (error) {
    console.error('❌ Error en reset:', error);
  }
}

emergencyReset();
