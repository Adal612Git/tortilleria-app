import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { authService } from "../../application/services/AuthService";

// Importar pantallas
import LoginScreen from '../screens/auth/LoginScreen';
import TabletDashboard from '../screens/TabletDashboard';
import SalesScreen from '../screens/SalesScreen';
import InventoryScreen from '../screens/InventoryScreen';
import ReportsScreen from '../screens/ReportsScreen';
import DeliveryDashboard from '../screens/DeliveryDashboard';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Navigator para Dueño/Supervisor
const OwnerTabs = () => (
    <Tab.Navigator
        screenOptions={{
            tabBarStyle: { backgroundColor: '#1E40AF' },
            tabBarActiveTintColor: 'white',
            tabBarInactiveTintColor: '#93C5FD',
        }}
    >
        <Tab.Screen 
            name="Dashboard" 
            component={TabletDashboard}
            options={{ tabBarIcon: () => '📊' }}
        />
        <Tab.Screen 
            name="Ventas" 
            component={SalesScreen}
            options={{ tabBarIcon: () => '🛒' }}
        />
        <Tab.Screen 
            name="Inventario" 
            component={InventoryScreen}
            options={{ tabBarIcon: () => '📦' }}
        />
        <Tab.Screen 
            name="Reportes" 
            component={ReportsScreen}
            options={{ tabBarIcon: () => '📈' }}
        />
    </Tab.Navigator>
);

// Navigator para Despachador
const DispatcherTabs = () => (
    <Tab.Navigator
        screenOptions={{
            tabBarStyle: { backgroundColor: '#059669' },
            tabBarActiveTintColor: 'white',
            tabBarInactiveTintColor: '#A7F3D0',
        }}
    >
        <Tab.Screen 
            name="Vender" 
            component={SalesScreen}
            options={{ tabBarIcon: () => '🛒' }}
        />
        <Tab.Screen 
            name="Inventario" 
            component={InventoryScreen}
            options={{ tabBarIcon: () => '📦' }}
        />
    </Tab.Navigator>
);

// Navigator para Repartidor
const DeliveryTabs = () => (
    <Tab.Navigator
        screenOptions={{
            tabBarStyle: { backgroundColor: '#7C3AED' },
            tabBarActiveTintColor: 'white',
            tabBarInactiveTintColor: '#C4B5FD',
        }}
    >
        <Tab.Screen 
            name="Pedidos" 
            component={DeliveryDashboard}
            options={{ tabBarIcon: () => '🚚' }}
        />
        <Tab.Screen 
            name="Historial" 
            component={ReportsScreen}
            options={{ tabBarIcon: () => '📋' }}
        />
    </Tab.Navigator>
);

export const AppNavigator = () => {
    const currentUser = authService.getCurrentUser();

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {!currentUser ? (
                    <Stack.Screen name="Login" component={LoginScreen} />
                ) : (
                    <>
                        {currentUser.role === 'owner' || currentUser.role === 'supervisor' ? (
                            <Stack.Screen name="Main" component={OwnerTabs} />
                        ) : currentUser.role === 'dispatcher' ? (
                            <Stack.Screen name="Main" component={DispatcherTabs} />
                        ) : currentUser.role === 'delivery' ? (
                            <Stack.Screen name="Main" component={DeliveryTabs} />
                        ) : (
                            <Stack.Screen name="Main" component={OwnerTabs} />
                        )}
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};
