#!/bin/bash

echo "🛡️ BLINDAJE EXTREMO DEFINITIVO - CORRIGIENDO TODO DE UNA VEZ"

# 1. PRIMERO: Verificar estructura actual REAL
echo "🔍 ANALIZANDO ESTRUCTURA ACTUAL..."
find src -type f -name "*.ts" -o -name "*.tsx" | grep -E "(AuthService|RoleBasedNavigator|LoginScreen)" | head -10

# 2. CORREGIR RUTAS EXACTAS BASADO EN ESTRUCTURA REAL
echo "🔧 CORRIGIENDO RUTAS CON PRECISIÓN..."

# Verificar estructura REAL y corregir según eso
if [ -f "src/presentation/navigation/RoleBasedNavigator.tsx" ]; then
    # Calcular ruta CORRECTA desde RoleBasedNavigator.tsx hasta AuthService.ts
    if [ -f "src/application/services/AuthService.ts" ]; then
        sed -i 's|import { authService } from.*AuthService.*|import { authService } from "../../application/services/AuthService";|g' src/presentation/navigation/RoleBasedNavigator.tsx
        echo "✅ RoleBasedNavigator -> AuthService: ../../application/services/AuthService"
    fi
fi

if [ -f "src/presentation/screens/auth/LoginScreen.tsx" ]; then
    if [ -f "src/application/services/AuthService.ts" ]; then
        sed -i 's|import { authService } from.*AuthService.*|import { authService } from "../../../application/services/AuthService";|g' src/presentation/screens/auth/LoginScreen.tsx
        echo "✅ LoginScreen -> AuthService: ../../../application/services/AuthService"
    fi
fi

# 3. VERIFICAR Y CORREGIR App.tsx
if [ -f "App.tsx" ]; then
    sed -i 's|import { AppNavigator } from.*|import { AppNavigator } from "./src/presentation/navigation/RoleBasedNavigator";|g' App.tsx
    sed -i 's|import { authService } from.*|import { authService } from "./src/application/services/AuthService";|g' App.tsx
    echo "✅ App.tsx importaciones corregidas"
fi

# 4. VERIFICAR Y CORREGIR TODAS LAS IMPORTACIONES DE PROTECCIÓN
echo "🛡️ CORRIGIENDO SISTEMA DE PROTECCIÓN..."

# Lista de archivos que necesitan correcciones de protección
protection_files=(
    "src/application/services/AuthService.ts"
    "src/presentation/screens/SalesScreen.tsx"
    "src/presentation/screens/DeliveryDashboard.tsx"
    "App.tsx"
)

for file in "${protection_files[@]}"; do
    if [ -f "$file" ]; then
        # Corregir rutas de protección
        sed -i 's|from.*protection/Logger.*|from "./src/core/protection/Logger";|g' "$file"
        sed -i 's|from.*protection/AdvancedEncryption.*|from "./src/core/protection/AdvancedEncryption";|g' "$file"
        sed -i 's|from.*protection/SecureCache.*|from "./src/core/protection/SecureCache";|g' "$file"
        sed -i 's|from.*protection/AnomalyDetector.*|from "./src/core/protection/AnomalyDetector";|g' "$file"
        sed -i 's|from.*protection/SystemMonitor.*|from "./src/core/protection/SystemMonitor";|g' "$file"
        sed -i 's|from.*protection/AutoRecovery.*|from "./src/core/protection/AutoRecovery";|g' "$file"
        sed -i 's|from.*protection/EnhancedErrorBoundary.*|from "./src/core/protection/EnhancedErrorBoundary";|g' "$file"
        echo "✅ Protección corregida en: $file"
    fi
done

# 5. VERIFICACIÓN FINAL EXTREMA
echo "🔍 VERIFICACIÓN FINAL EXTREMA..."

critical_files=(
    "src/application/services/AuthService.ts"
    "src/presentation/navigation/RoleBasedNavigator.tsx"
    "src/presentation/screens/auth/LoginScreen.tsx"
    "src/presentation/screens/SalesScreen.tsx"
    "src/presentation/screens/DeliveryDashboard.tsx"
    "App.tsx"
)

for file in "${critical_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file - EXISTE"
        # Mostrar primeras líneas con imports para verificación
        echo "   📄 Imports:"
        head -10 "$file" | grep -E "import.*from" | head -3 | while read line; do
            echo "     $line"
        done
    else
        echo "❌ $file - NO EXISTE"
    fi
done

# 6. MOSTRAR RUTAS CORREGIDAS ESPECÍFICAS
echo "🎯 RUTAS CORREGIDAS:"
echo "   RoleBasedNavigator -> AuthService: $(grep "AuthService" src/presentation/navigation/RoleBasedNavigator.tsx | head -1)"
echo "   LoginScreen -> AuthService: $(grep "AuthService" src/presentation/screens/auth/LoginScreen.tsx | head -1)"
echo "   App.tsx -> RoleBasedNavigator: $(grep "RoleBasedNavigator" App.tsx | head -1)"

echo ""
echo "🚀 BLINDAJE COMPLETADO - EJECUTA: npm start"
echo "💡 Si hay errores, ejecuta este comando de nuevo!"
