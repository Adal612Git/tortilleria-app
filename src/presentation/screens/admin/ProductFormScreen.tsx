import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
    try {
      if (editing && existing) {
        await update(existing.id, { name, description, price: parsedPrice, stock: parsedStock, category });
      } else {
        await add({ name, description, price: parsedPrice, stock: parsedStock, unit: 'kg', category: category as any, isActive: true });
      }
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'No se pudo guardar el producto');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.title}>{editing ? 'Editar' : 'Crear'} producto</Text>

        <View style={styles.block}>
          <Text style={styles.label}>Nombre</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Nombre del producto" placeholderTextColor="#9CA3AF" />
        </View>
        <View style={styles.block}>
          <Text style={styles.label}>Descripción</Text>
          <TextInput style={styles.input} value={description} onChangeText={setDescription} placeholder="Descripción" placeholderTextColor="#9CA3AF" />
        </View>
        <View style={styles.block}>
          <Text style={styles.label}>Precio</Text>
          <TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor="#9CA3AF" />
        </View>
        <View style={styles.block}>
          <Text style={styles.label}>Stock</Text>
          <TextInput style={styles.input} value={stock} onChangeText={setStock} keyboardType="number-pad" placeholder="0" placeholderTextColor="#9CA3AF" />
        </View>
        <View style={styles.block}>
          <Text style={styles.label}>Categoría</Text>
          <View style={styles.chipsRow}>
            {(['tortilla','tostada','masa','otros'] as const).map(cat => (
              <TouchableOpacity key={cat} onPress={() => setCategory(cat)} style={[styles.chip, category===cat? styles.chipActive: styles.chipInactive]}>
                <Text style={category===cat? styles.chipTextActive: styles.chipTextInactive}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity onPress={onSubmit} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Guardar</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '800', marginBottom: 24, color: '#212121' },
  block: { marginBottom: 12 },
  label: { color: '#212121', marginBottom: 8 },
  input: { backgroundColor: '#F1F5F9', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, marginRight: 8, marginBottom: 8 },
  chipActive: { backgroundColor: '#E65100' },
  chipInactive: { backgroundColor: '#F1F5F9' },
  chipTextActive: { color: 'white', fontWeight: '600' },
  chipTextInactive: { color: '#212121' },
  saveButton: { backgroundColor: '#E65100', paddingVertical: 14, borderRadius: 12 },
  saveButtonText: { color: 'white', textAlign: 'center', fontSize: 16, fontWeight: '700' },
});
