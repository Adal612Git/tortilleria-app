import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text } from 'react-native';
import { useAuthStore } from '../store/authStore';
import LoginScreen from '../screens/auth/LoginScreen';
import AdminNavigator from './AdminNavigator';
import EmployeeNavigator from './EmployeeNavigator';

export type RootStackParamList = {
  Login: undefined;
  Admin: undefined;
  Employee: undefined;
  Delivery: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

// Navigators temporales
const TempEmployeeNavigator = undefined as any;

const TempDeliveryNavigator = () => (
  <View className="flex-1 justify-center items-center bg-white">
    <Text className="text-2xl font-bold text-gray-900 mb-2">Pantalla Repartidor</Text>
    <Text className="text-gray-600">Próximamente...</Text>
  </View>
);

export function AppNavigator() {
  const { user } = useAuthStore();

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
      {!user ? (
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
          <Stack.Screen name="Delivery" component={TempDeliveryNavigator} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
