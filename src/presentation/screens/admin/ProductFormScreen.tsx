import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useProductStore } from '../../store/productStore';

type Params = { ProductForm: { id?: string } };

export default function ProductFormScreen() {
  const route = useRoute<RouteProp<Params, 'ProductForm'>>();
  const navigation = useNavigation<any>();
  const { products, add, update } = useProductStore();
  const editing = !!route.params?.id;
  const existing = products.find(p => p.id === route.params?.id);

  const [name, setName] = useState(existing?.name ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [price, setPrice] = useState(existing?.price?.toString() ?? '');
  const [stock, setStock] = useState(existing?.stock?.toString() ?? '0');
  const [category, setCategory] = useState(existing?.category ?? 'tortilla');

  useEffect(() => {
    navigation.setOptions({ title: editing ? 'Editar Producto' : 'Nuevo Producto' });
  }, [editing]);

  const onSubmit = async () => {
    const parsedPrice = parseFloat(price);
    const parsedStock = parseInt(stock || '0', 10);
    if (!name || isNaN(parsedPrice)) {
      Alert.alert('Validación', 'Nombre y precio son requeridos');
      return;
    }
    if (editing && existing) {
      await update(existing.id, { name, description, price: parsedPrice, stock: parsedStock, category });
    } else {
      await add({ name, description, price: parsedPrice, stock: parsedStock, unit: 'kg', category: category as any, isActive: true });
    }
    navigation.goBack();
  };

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 16 }}>
      <Text className="text-2xl font-bold mb-12 text-[#212121]">{editing ? 'Editar' : 'Crear'} producto</Text>

      <View className="mb-4">
        <Text className="text-[#212121] mb-2">Nombre</Text>
        <TextInput className="bg-[#F1F5F9] rounded-xl px-3 py-3" value={name} onChangeText={setName} placeholder="Nombre del producto" />
      </View>
      <View className="mb-4">
        <Text className="text-[#212121] mb-2">Descripción</Text>
        <TextInput className="bg-[#F1F5F9] rounded-xl px-3 py-3" value={description} onChangeText={setDescription} placeholder="Descripción" />
      </View>
      <View className="mb-4">
        <Text className="text-[#212121] mb-2">Precio</Text>
        <TextInput className="bg-[#F1F5F9] rounded-xl px-3 py-3" value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder="0.00" />
      </View>
      <View className="mb-4">
        <Text className="text-[#212121] mb-2">Stock</Text>
        <TextInput className="bg-[#F1F5F9] rounded-xl px-3 py-3" value={stock} onChangeText={setStock} keyboardType="number-pad" placeholder="0" />
      </View>
      <View className="mb-6">
        <Text className="text-[#212121] mb-2">Categoría</Text>
        <View className="flex-row flex-wrap">
          {(['tortilla','tostada','masa','otros'] as const).map(cat => (
            <TouchableOpacity key={cat} onPress={() => setCategory(cat)} className={`px-4 py-3 mr-2 mb-2 rounded-xl ${category===cat? 'bg-[#E65100]':'bg-[#F1F5F9]'}`}>
              <Text className={`${category===cat?'text-white':'text-[#212121]'}`}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity onPress={onSubmit} className="bg-[#E65100] py-4 rounded-xl">
        <Text className="text-white text-center text-[16px] font-semibold">Guardar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

