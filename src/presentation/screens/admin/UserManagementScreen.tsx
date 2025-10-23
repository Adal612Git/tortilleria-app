import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useAuthStore } from '../../store/authStore';

export default function UserManagementScreen() {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState([
    { id: 1, name: 'Administrador', email: 'admin@tortilleria.com', role: 'admin', isActive: true },
    { id: 2, name: 'Empleado Ventas', email: 'empleado@tortilleria.com', role: 'empleado', isActive: true },
    { id: 3, name: 'Repartidor Express', email: 'repartidor@tortilleria.com', role: 'repartidor', isActive: true },
  ]);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-500';
      case 'empleado': return 'bg-blue-500';
      case 'repartidor': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'empleado': return 'Empleado';
      case 'repartidor': return 'Repartidor';
      default: return role;
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-6 py-4 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900">Gestión de Usuarios</Text>
        <Text className="text-gray-600 mt-1">Administra empleados y repartidores</Text>
      </View>

      <View className="px-6 py-4">
        <TouchableOpacity className="bg-blue-500 py-3 px-6 rounded-lg">
          <Text className="text-white font-semibold text-lg text-center">+ Crear Usuario</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6">
        {users.map((user) => (
          <Swipeable
            key={user.id}
            renderRightActions={() => (
              <View className="flex-row items-stretch">
                {user.id !== currentUser!.id && (
                  <TouchableOpacity className="bg-red-500 justify-center px-4">
                    <Text className="text-white font-semibold">Eliminar</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity className="bg-blue-500 justify-center px-4">
                  <Text className="text-white font-semibold">Editar</Text>
                </TouchableOpacity>
              </View>
            )}
          >
            <View className="bg-white rounded-lg p-4 mb-3 shadow-sm border border-gray-200">
              <View className="flex-row justify-between items-start">
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-gray-900">
                    {user.name}
                    {user.id === currentUser!.id && (
                      <Text className="text-blue-500 text-sm"> (Tú)</Text>
                    )}
                  </Text>
                  <Text className="text-gray-600 text-sm mt-1">{user.email}</Text>
                  <View className="flex-row mt-2 space-x-2">
                    <View className={`px-3 py-1 rounded-full ${getRoleColor(user.role)}`}>
                      <Text className="text-white text-xs font-medium">
                        {getRoleText(user.role)}
                      </Text>
                    </View>
                    <View className={`px-3 py-1 rounded-full ${user.isActive ? 'bg-green-100' : 'bg-red-100'}`}>
                      <Text className={`text-xs font-medium ${user.isActive ? 'text-green-800' : 'text-red-800'}`}>
                        {user.isActive ? 'Activo' : 'Inactivo'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </Swipeable>
        ))}
      </ScrollView>
    </View>
  );
}
