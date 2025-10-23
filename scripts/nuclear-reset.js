const fs = require('fs');
const path = require('path');

function nuclearReset() {
  console.log('💥 INICIANDO RESET NUCLEAR...');
  
  try {
    // En Expo, la base de datos está en un lugar específico
    // Pero podemos forzar la recreación eliminando el archivo
    const dbPath = path.join(__dirname, '..', 'tortilleria.db');
    
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
      console.log('✅ Base de datos eliminada');
    }
    
    console.log('💡 La app creará una nueva base de datos al iniciar');
  } catch (error) {
    console.error('❌ Error en reset nuclear:', error);
  }
}

nuclearReset();
