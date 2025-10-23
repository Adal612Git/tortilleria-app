import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, TextInput } from 'react-native';
import { useProductStore } from '../../store/productStore';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function ProductListScreen() {
  const navigation = useNavigation<any>();
  const { products, load, seedIfEmpty, remove, setSearch, search } = useProductStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const init = async () => {
      await seedIfEmpty();
    };
    init();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(p => p.name.toLowerCase().includes(q) || (p.description ?? '').toLowerCase().includes(q));
  }, [products, search]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <View className="flex-1 bg-[#FAFAFA]">
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <Text className="text-2xl font-bold text-[#212121]">Productos</Text>
        <Text className="text-[#757575]">Administra el inventario</Text>
        <View className="mt-3 flex-row items-center bg-[#F1F5F9] rounded-xl px-3">
          <Ionicons name="search" size={18} color="#757575" />
          <TextInput
            placeholder="Buscar producto..."
            className="flex-1 px-2 py-3 text-[16px]"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ padding: 12, paddingBottom: 96 }}
        renderItem={({ item }) => (
          <View className="bg-white rounded-2xl mb-3 p-4 border border-gray-200">
            <View className="flex-row justify-between items-center">
              <View className="flex-1 pr-3">
                <Text className="text-[18px] font-semibold text-[#212121]">{item.name}</Text>
                <Text className="text-[#757575] text-[14px]" numberOfLines={1}>{item.description}</Text>
                <View className="flex-row mt-2">
                  <Text className="text-[#388E3C] font-bold mr-3">${item.price.toFixed(2)}</Text>
                  <Text className="text-[#757575]">Stock: {item.stock}</Text>
                </View>
              </View>
              <View className="flex-row items-center">
                <TouchableOpacity
                  accessibilityRole="button"
                  className="mr-3 bg-[#E3F2FD] p-3 rounded-full"
                  onPress={() => navigation.getParent()?.navigate('ProductForm', { id: item.id })}
                >
                  <Ionicons name="pencil" size={20} color="#1E88E5" />
                </TouchableOpacity>
                <TouchableOpacity
                  accessibilityRole="button"
                  className="bg-[#FFEBEE] p-3 rounded-full"
                  onPress={() => remove(item.id)}
                >
                  <Ionicons name="trash" size={20} color="#D32F2F" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={() => (
          <View className="px-4 py-8 items-center">
            <Text className="text-[#757575]">Sin productos</Text>
          </View>
        )}
      />

      <TouchableOpacity
        onPress={() => navigation.getParent()?.navigate('ProductForm')}
        className="absolute right-5 bottom-5 bg-[#E65100] w-[56px] h-[56px] rounded-full items-center justify-center shadow"
        accessibilityLabel="Agregar producto"
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}
