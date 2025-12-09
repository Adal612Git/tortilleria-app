#!/bin/bash

echo "🔧 CORRIGIENDO RUTAS DE IMPORTACIÓN..."

# Corregir importación en RoleBasedNavigator.tsx
sed -i 's|../application/services/AuthService|../../application/services/AuthService|g' src/presentation/navigation/RoleBasedNavigator.tsx

# Corregir importación en LoginScreen.tsx  
sed -i 's|../../application/services/AuthService|../../../application/services/AuthService|g' src/presentation/screens/auth/LoginScreen.tsx

# Corregir importación en App.tsx
sed -i 's|./src/presentation/navigation/RoleBasedNavigator|./src/presentation/navigation/RoleBasedNavigator|g' App.tsx

echo "✅ Rutas corregidas"
echo "📁 Verificando estructura..."

# Verificar que los archivos existen
check_files=(
  "src/application/services/AuthService.ts"
  "src/presentation/screens/auth/LoginScreen.tsx" 
  "src/presentation/navigation/RoleBasedNavigator.tsx"
  "App.tsx"
)

for file in "${check_files[@]}"; do
  if [ -f "$file" ]; then
    echo "✅ $file"
  else
    echo "❌ $file - NO EXISTE"
  fi
done

echo "🎯 LISTO! Ejecuta: npm start"
