#!/bin/bash
echo "🔄 CORRIGIENDO NAVEGACIÓN POST-LOGIN"

# Corregir la redirección en LoginScreen para usar pantallas existentes
sed -i 's/navigation.navigate(.OwnerDashboard.)/navigation.navigate("Dashboard")/g' src/presentation/screens/auth/LoginScreen.tsx
sed -i 's/navigation.navigate(.SupervisorDashboard.)/navigation.navigate("Dashboard")/g' src/presentation/screens/auth/LoginScreen.tsx

# Verificar la corrección
echo "✅ REDIRECCIONES CORREGIDAS:"
grep -n "navigation.navigate" src/presentation/screens/auth/LoginScreen.tsx

echo "🎯 AHORA AL INICIAR SESIÓN IRÁ A: Dashboard (que existe)"
echo "🚀 La app debería funcionar completamente"
