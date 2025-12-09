const SQLite = require('expo-sqlite');
const Crypto = require('expo-crypto');

async function emergencyFix() {
  console.log('🚨 ACTIVANDO MODO EMERGENCIA...\n');
  
  const db = await SQLite.openDatabaseAsync('tortilleria.db');
  
  // 1. ELIMINAR BLOQUEOS - Resetear todos los usuarios
  console.log('1. 🔓 ELIMINANDO BLOQUEOS...');
  await db.runAsync('DELETE FROM users');
  console.log('   ✅ Todos los usuarios eliminados');
  
  // 2. CREAR USUARIOS DE EMERGENCIA
  console.log('\n2. 👥 CREANDO USUARIOS DE EMERGENCIA...');
  
  const emergencyUsers = [
    { 
      email: 'emergency@tortilleria.com', 
      password: 'emergency123', 
      name: 'Usuario Emergencia',
      role: 'admin'
    },
    {
      email: 'admin@tortilleria.com',
      password: 'admin123', 
      name: 'Admin',
      role: 'admin'
    }
  ];
  
  for (const user of emergencyUsers) {
    const hashedPassword = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      user.password
    );
    
    await db.runAsync(
      `INSERT INTO users (name, email, password, role, isActive, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [user.name, user.email, hashedPassword, user.role, 1, new Date().toISOString(), new Date().toISOString()]
    );
    
    console.log(`   ✅ ${user.email} / ${user.password}`);
  }
  
  console.log('\n🎉 MODO EMERGENCIA ACTIVADO!');
  console.log('📱 USA ESTAS CREDENCIALES:');
  console.log('   emergency@tortilleria.com / emergency123');
  console.log('   admin@tortilleria.com / admin123');
  console.log('\n⚠️  RECOMENDACIÓN:');
  console.log('   - Desinstala la app de tu teléfono');
  console.log('   - Reinicia el teléfono');
  console.log('   - Vuelve a instalar Expo Go');
  console.log('   - Escanea el QR code de nuevo');
}

emergencyFix().catch(console.error);
