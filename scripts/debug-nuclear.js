const SQLite = require('expo-sqlite');
const Crypto = require('expo-crypto');
const fs = require('fs');
const path = require('path');

async function nuclearDebug() {
  console.log('🔍 INICIANDO AUDITORÍA NUCLEAR...\n');

  // 1. VERIFICAR BASE DE DATOS
  console.log('1. 📊 VERIFICANDO BASE DE DATOS...');
  try {
    const db = await SQLite.openDatabaseAsync('tortilleria.db');
    console.log('   ✅ Base de datos accesible');
    
    // Verificar tablas
    const tables = await db.getAllAsync(
      "SELECT name FROM sqlite_master WHERE type='table'"
    );
    console.log('   📋 Tablas encontradas:', tables.map(t => t.name).join(', '));
    
    // Verificar usuarios
    const users = await db.getAllAsync('SELECT * FROM users');
    console.log(`   👥 Usuarios en BD: ${users.length}`);
    
    for (const user of users) {
      console.log(`\n   🔍 USUARIO: ${user.email}`);
      console.log(`      Contraseña: "${user.password}"`);
      console.log(`      Longitud: ${user.password.length} chars`);
      console.log(`      ¿Hasheada?: ${user.password.length === 64 ? '✅ SÍ' : '❌ NO'}`);
      console.log(`      Rol: ${user.role}`);
      console.log(`      Activo: ${user.isActive ? '✅' : '❌'}`);
      
      // Verificar hash
      if (user.password.length === 64) {
        const testHash = await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          getPasswordByEmail(user.email)
        );
        const matches = testHash === user.password;
        console.log(`      ¿Hash coincide?: ${matches ? '✅ SÍ' : '❌ NO'}`);
      }
    }
    
  } catch (error) {
    console.log('   ❌ Error accediendo BD:', error.message);
  }

  // 2. VERIFICAR CONTRASEÑAS ESPERADAS
  console.log('\n2. 🔐 CONTRASEÑAS ESPERADAS:');
  const expectedPasswords = {
    'admin@tortilleria.com': 'admin123',
    'empleado@tortilleria.com': 'empleado123', 
    'repartidor@tortilleria.com': 'repartidor123',
    'test@tortilleria.com': 'test123'
  };
  
  for (const [email, password] of Object.entries(expectedPasswords)) {
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      password
    );
    console.log(`   ${email}:`);
    console.log(`      Texto: "${password}"`);
    console.log(`      Hash:  "${hash}"`);
  }

  // 3. RESET NUCLEAR
  console.log('\n3. 💥 EJECUTANDO RESET NUCLEAR...');
  try {
    const db = await SQLite.openDatabaseAsync('tortilleria.db');
    
    // ELIMINAR TODOS LOS USUARIOS
    await db.runAsync('DELETE FROM users');
    console.log('   ✅ Todos los usuarios eliminados');
    
    // CREAR USUARIOS NUEVOS CON CONTRASEÑAS CORRECTAS
    const users = [
      { name: 'Administrador', email: 'admin@tortilleria.com', password: 'admin123', role: 'admin' },
      { name: 'Empleado', email: 'empleado@tortilleria.com', password: 'empleado123', role: 'empleado' },
      { name: 'Repartidor', email: 'repartidor@tortilleria.com', password: 'repartidor123', role: 'repartidor' },
      { name: 'Test', email: 'test@tortilleria.com', password: 'test123', role: 'empleado' }
    ];

    for (const user of users) {
      const hashedPassword = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        user.password
      );
      
      await db.runAsync(
        `INSERT INTO users (name, email, password, role, isActive, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [user.name, user.email, hashedPassword, user.role, 1, new Date().toISOString(), new Date().toISOString()]
      );
      console.log(`   ✅ ${user.email} creado con hash correcto`);
    }
    
    console.log('\n🎉 RESET NUCLEAR COMPLETADO!');
    console.log('🔑 CREDENCIALES LISTAS PARA USAR:');
    console.log('   admin@tortilleria.com / admin123');
    console.log('   empleado@tortilleria.com / empleado123');
    console.log('   repartidor@tortilleria.com / repartidor123');
    
  } catch (error) {
    console.log('   ❌ Error en reset nuclear:', error.message);
  }
}

function getPasswordByEmail(email) {
  const passwords = {
    'admin@tortilleria.com': 'admin123',
    'empleado@tortilleria.com': 'empleado123',
    'repartidor@tortilleria.com': 'repartidor123', 
    'test@tortilleria.com': 'test123'
  };
  return passwords[email] || 'unknown';
}

nuclearDebug().catch(console.error);
