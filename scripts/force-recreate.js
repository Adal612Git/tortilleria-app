// Script para forzar recreación de base de datos
console.log('💥 FORZANDO RECREACIÓN COMPLETA DE BD...');

// En Expo con SQLite, la BD se crea automáticamente al abrir la conexión
// Simplemente necesitamos asegurarnos de que no hay usuarios existentes

const sqlite = require('expo-sqlite');

function forceRecreate() {
  try {
    console.log('🔧 Abriendo base de datos...');
    const db = sqlite.openDatabaseSync('tortilleria.db');
    
    console.log('🗑️ Eliminando tabla de usuarios...');
    db.execSync('DROP TABLE IF EXISTS users');
    
    console.log('🗑️ Eliminando tabla de productos...');
    db.execSync('DROP TABLE IF EXISTS products');
    
    console.log('🗑️ Eliminando tabla de ventas...');
    db.execSync('DROP TABLE IF EXISTS sales');
    
    console.log('✅ Todas las tablas eliminadas. Se recrearán al iniciar la app.');
    
  } catch (error) {
    console.log('⚠️ No se pudo eliminar tablas (puede ser normal si no existen):', error.message);
  }
}

forceRecreate();
