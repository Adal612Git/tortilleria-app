#!/bin/bash
echo "🔧 REPARANDO COMILLAS FALTANTES EN RoleBasedNavigator"
sed -i "s|import LoginScreen from ../screens/auth/LoginScreen';|import LoginScreen from '../screens/auth/LoginScreen';|g" src/presentation/navigation/RoleBasedNavigator.tsx
sed -i "s|import TabletDashboard from ../screens/TabletDashboard';|import TabletDashboard from '../screens/TabletDashboard';|g" src/presentation/navigation/RoleBasedNavigator.tsx
sed -i "s|import SalesScreen from ../screens/SalesScreen';|import SalesScreen from '../screens/SalesScreen';|g" src/presentation/navigation/RoleBasedNavigator.tsx
sed -i "s|import InventoryScreen from ../screens/InventoryScreen';|import InventoryScreen from '../screens/InventoryScreen';|g" src/presentation/navigation/RoleBasedNavigator.tsx
sed -i "s|import ReportsScreen from ../screens/ReportsScreen';|import ReportsScreen from '../screens/ReportsScreen';|g" src/presentation/navigation/RoleBasedNavigator.tsx
sed -i "s|import DeliveryDashboard from ../screens/DeliveryDashboard';|import DeliveryDashboard from '../screens/DeliveryDashboard';|g" src/presentation/navigation/RoleBasedNavigator.tsx
echo "✅ Comillas reparadas - ejecuta: npm start"
