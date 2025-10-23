import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AdminTabsNavigator from './AdminTabsNavigator';
import ProductFormScreen from '../screens/admin/ProductFormScreen';

export type AdminStackParamList = {
  AdminTabs: undefined;
  ProductForm: { id?: string } | undefined;
};

const Stack = createStackNavigator<AdminStackParamList>();

export default function AdminNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="AdminTabs" component={AdminTabsNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="ProductForm" component={ProductFormScreen} options={{ title: 'Producto' }} />
    </Stack.Navigator>
  );
}
