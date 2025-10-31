import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import UserManagementScreen from '../screens/admin/UserManagementScreen';
import ProductListScreen from '../screens/admin/ProductListScreen';
import ReportsScreen from '../screens/ReportsScreen';
import { Ionicons } from '@expo/vector-icons';

export type AdminTabParamList = {
  Dashboard: undefined;
  Products: undefined;
  Users: undefined;
  Reports: undefined;
};

const Tab = createBottomTabNavigator<AdminTabParamList>();

export default function AdminTabsNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#E65100',
        tabBarInactiveTintColor: '#757575',
        tabBarStyle: { height: 64, paddingBottom: 8, paddingTop: 8 },
        tabBarLabelStyle: { fontSize: 12 },
        tabBarIcon: ({ color, size }) => {
          const name = route.name === 'Dashboard'
            ? 'home'
            : route.name === 'Products'
            ? 'cube'
            : route.name === 'Users'
            ? 'people'
            : 'stats-chart';
          return <Ionicons name={name as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={AdminDashboardScreen} options={{ title: 'Inicio' }} />
      <Tab.Screen name="Products" component={ProductListScreen} options={{ title: 'Productos' }} />
      <Tab.Screen name="Users" component={UserManagementScreen} options={{ title: 'Usuarios' }} />
      <Tab.Screen name="Reports" component={ReportsScreen} options={{ title: 'Reportes' }} />
    </Tab.Navigator>
  );
}
