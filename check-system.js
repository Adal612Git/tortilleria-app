const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando sistema...');

const filesToCheck = [
  'src/core/protection/ErrorBoundary.tsx',
  'src/core/protection/ValidationService.ts', 
  'src/core/protection/Logger.ts',
  'src/presentation/screens/TabletDashboard.tsx',
  'App.tsx'
];

let allGood = true;

filesToCheck.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - FALTANTE`);
    allGood = false;
  }
});

if (allGood) {
  console.log('\n🎉 ¡SISTEMA CONFIGURADO EXITOSAMENTE!');
  console.log('🚀 Ejecuta: npm start');
  console.log('📱 La nueva interfaz está lista para usar');
} else {
  console.log('\n❌ Hay archivos faltantes - Revisa el script');
}
