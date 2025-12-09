// Script simple que funciona con la nueva API de expo-sqlite
console.log('💥 RESET NUCLEAR SIMPLE - CREANDO BD DESDE CERO...');

// Este script se ejecutará DENTRO de la app cuando inicie
// Por ahora, solo necesitamos forzar la recreación de la BD

const fs = require('fs');
const path = require('path');

// Buscar y eliminar cualquier base de datos existente
const possiblePaths = [
  'tortilleria.db',
  '.expo/database/tortilleria.db',
  'node_modules/.cache/tortilleria.db'
];

possiblePaths.forEach(dbPath => {
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log('✅ Eliminada:', dbPath);
  }
});

console.log('🎯 La próxima ejecución creará una BD nueva y limpia');
