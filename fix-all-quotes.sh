#!/bin/bash
echo "🔧 CORRIGIENDO TODAS LAS COMILLAS MALAS EN TODO EL PROYECTO"

# Corregir comillas simples por dobles en todas las importaciones de protección
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i "s|from '../../core/protection/Logger';|from \"../../core/protection/Logger\";|g"
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i "s|from '../../../core/protection/Logger';|from \"../../../core/protection/Logger\";|g"
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i "s|from \"../../core/protection/Logger';|from \"../../core/protection/Logger\";|g"
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i "s|from \"../../../core/protection/Logger';|from \"../../../core/protection/Logger\";|g"

# Verificar corrección
echo "✅ VERIFICANDO LOGINSCREEN:"
grep -n "Logger" src/presentation/screens/auth/LoginScreen.tsx

echo "🚀 EJECUTANDO: npm start"
npm start
