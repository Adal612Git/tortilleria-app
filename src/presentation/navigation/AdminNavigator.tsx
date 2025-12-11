import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AdminTabsNavigator from './AdminTabsNavigator';
import ProductFormScreen from '../screens/admin/ProductFormScreen';
import SalesScreen from '../screens/employee/SalesScreen';
import SettingsScreen from '../screens/admin/SettingsScreen';
import CoolerManagementScreen from '../screens/admin/CoolerManagementScreen';

export type AdminStackParamList = {
  AdminTabs: undefined;
  ProductForm: { id?: string } | undefined;
  Settings: undefined;
  PosSales: undefined;
  CoolerManagement: undefined;
};

const Stack = createStackNavigator<AdminStackParamList>();

export default function AdminNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="AdminTabs" component={AdminTabsNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="ProductForm" component={ProductFormScreen} options={{ title: 'Producto' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Configuración' }} />
      <Stack.Screen name="PosSales" component={SalesScreen} options={{ title: 'Punto de Venta' }} />
      <Stack.Screen name="CoolerManagement" component={CoolerManagementScreen} options={{ title: 'Hieleras' }} />
    </Stack.Navigator>
  );
}
