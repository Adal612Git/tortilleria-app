#!/bin/bash
echo "🎯 CORRIGIENDO NOMBRE DEL DASHBOARD"

# Verificar cómo se llaman las tabs en RoleBasedNavigator
echo "📋 TABS DISPONIBLES EN ROLEBASEDNAVIGATOR:"
grep -A5 "OwnerTabs" src/presentation/navigation/RoleBasedNavigator.tsx | grep "Tab.Screen"

# Corregir la navegación para que coincida con los nombres reales
sed -i 's/navigation.navigate("Dashboard")/navigation.navigate("Main")/g' src/presentation/screens/auth/LoginScreen.tsx

echo "✅ CORRECCIÓN APLICADA"
echo "🎯 AHORA REDIRIGE A: Main (que es el navigator principal)"
echo "📋 VERIFICACIÓN:"
grep -n "navigation.navigate" src/presentation/screens/auth/LoginScreen.tsx

echo "🚀 RECARGA LA APP Y PRUEBA CON PIN: 1234"
