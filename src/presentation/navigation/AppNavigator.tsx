import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text } from 'react-native';
import { useAuthStore } from '../store/authStore';
// Unificación: usar el Login por email/contraseña
import LoginScreen from '../screens/LoginScreen';
import AdminNavigator from './AdminNavigator';
import EmployeeNavigator from './EmployeeNavigator';
import DeliveryDashboard from '../screens/DeliveryDashboard';

export type RootStackParamList = {
  Login: undefined;
  Admin: undefined;
  Employee: undefined;
  Delivery: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

// Nota: El flujo de repartidor usa la pantalla DeliveryDashboard simple.

export function AppNavigator() {
  const { user } = useAuthStore();

  const isValidRole = user && ['admin','empleado','repartidor'].includes((user as any).role);

  const getInitialRoute = () => {
    if (!user) return 'Login';
    
    switch (user.role) {
      case 'admin':
        return 'Admin';
      case 'empleado':
        return 'Employee';
      case 'repartidor':
        return 'Delivery';
      default:
        return 'Login';
    }
  };

  return (
    <NavigationContainer>
      {!user || !isValidRole ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Navigator>
      ) : user.role === 'admin' ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Admin" component={AdminNavigator} />
        </Stack.Navigator>
      ) : user.role === 'empleado' ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Employee" component={EmployeeNavigator} />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Delivery" component={DeliveryDashboard} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
