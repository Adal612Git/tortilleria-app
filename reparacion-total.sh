#!/bin/bash
echo "🎯 CORRECCIÓN TOTAL DE RUTAS - MAPEANDO DESDE CADA UBICACIÓN"

# 1. Desde presentation/screens/auth/ -> ../../../core/
find src/presentation/screens/auth -name "*.ts" -o -name "*.tsx" | xargs sed -i 's|from.*core/protection/|from "../../../core/protection/|g'

# 2. Desde presentation/screens/ -> ../../core/  
find src/presentation/screens -maxdepth 1 -name "*.ts" -o -name "*.tsx" | xargs sed -i 's|from.*core/protection/|from "../../core/protection/|g'

# 3. Desde presentation/navigation/ -> ../../core/
find src/presentation/navigation -name "*.ts" -o -name "*.tsx" | xargs sed -i 's|from.*core/protection/|from "../../core/protection/|g'

# 4. Desde application/services/ -> ../../core/
find src/application/services -name "*.ts" -o -name "*.tsx" | xargs sed -i 's|from.*core/protection/|from "../../core/protection/|g'

# 5. Verificar correcciones
echo "✅ RUTAS CORREGIDAS:"
echo "LoginScreen: $(grep "from.*Logger" src/presentation/screens/auth/LoginScreen.tsx)"
echo "SalesScreen: $(grep "from.*Logger" src/presentation/screens/SalesScreen.tsx)"
echo "AuthService: $(grep "from.*Logger" src/application/services/AuthService.ts)"
echo "RoleBasedNav: $(grep "from.*AuthService" src/presentation/navigation/RoleBasedNavigator.tsx)"

echo "🚀 EJECUTANDO: npm start"
npm start
