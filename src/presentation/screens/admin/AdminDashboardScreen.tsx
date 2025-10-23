import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { StackNavigationProp } from '@react-navigation/stack';

export default function AdminDashboardScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();

  const dashboardCards = [
    {
      title: 'Gestión de Usuarios',
      description: 'Administrar empleados y repartidores',
      icon: '👥',
      screen: 'Users' as any,
      color: 'bg-blue-500'
    },
    {
      title: 'Reportes de Ventas',
      description: 'Ver reportes y estadísticas',
      icon: '📊',
      screen: 'Dashboard' as any,
      color: 'bg-green-500'
    },
    {
      title: 'Inventario',
      description: 'Gestionar productos y stock',
      icon: '📦',
      screen: 'Products' as any,
      color: 'bg-purple-500'
    },
    {
      title: 'Configuración',
      description: 'Ajustes del sistema',
      icon: '⚙️',
      screen: 'Dashboard' as any,
      color: 'bg-orange-500'
    },
  ];

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-6 py-6 border-b border-gray-200">
        <Text className="text-3xl font-bold text-gray-900">Panel Admin</Text>
        <Text className="text-gray-600 mt-2">
          Bienvenido, {user?.name}
        </Text>
      </View>

      <ScrollView className="flex-1 px-6 py-6">
        <View className="flex-row flex-wrap -mx-2">
          {dashboardCards.map((card, index) => (
            <View key={index} className="w-1/2 px-2 mb-4">
              <TouchableOpacity
                className={`${card.color} rounded-2xl p-6 aspect-square justify-between`}
                onPress={() => navigation.navigate(card.screen)}
              >
                <Text className="text-4xl">{card.icon}</Text>
                <View>
                  <Text className="text-white font-bold text-lg mt-4">
                    {card.title}
                  </Text>
                  <Text className="text-white/90 text-sm mt-1">
                    {card.description}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View className="bg-white rounded-2xl p-6 mt-4">
          <Text className="text-xl font-bold text-gray-900 mb-4">
            Resumen del Sistema
          </Text>
          <View className="flex-row justify-between">
            <View className="items-center">
              <Text className="text-2xl font-bold text-blue-600">4</Text>
              <Text className="text-gray-600 text-sm">Usuarios</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-green-600">12</Text>
              <Text className="text-gray-600 text-sm">Productos</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-purple-600">47</Text>
              <Text className="text-gray-600 text-sm">Ventas Hoy</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
