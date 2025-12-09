import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, TextInput, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Productos</Text>
        <Text style={styles.subtitle}>Administra el inventario</Text>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#757575" />
          <TextInput
            placeholder="Buscar producto..."
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <View style={styles.itemRow}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemDesc} numberOfLines={1}>{item.description}</Text>
                <View style={styles.itemBottomRow}>
                  <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
                  <Text style={styles.itemStock}>Stock: {item.stock}</Text>
                </View>
              </View>
              <View style={styles.actionsInline}>
                <TouchableOpacity
                  accessibilityRole="button"
                  style={[styles.roundIcon, { backgroundColor: '#E3F2FD', marginRight: 8 }]}
                  onPress={() => navigation.getParent()?.navigate('ProductForm', { id: item.id })}
                >
                  <Ionicons name="pencil" size={20} color="#1E88E5" />
                </TouchableOpacity>
                <TouchableOpacity
                  accessibilityRole="button"
                  style={[styles.roundIcon, { backgroundColor: '#FFEBEE' }]}
                  onPress={() => remove(item.id)}
                >
                  <Ionicons name="trash" size={20} color="#D32F2F" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Sin productos</Text>
          </View>
        )}
      />

      <TouchableOpacity
        onPress={() => navigation.getParent()?.navigate('ProductForm')}
        style={styles.fab}
        accessibilityLabel="Agregar producto"
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  title: { fontSize: 20, fontWeight: '800', color: '#212121' },
  subtitle: { color: '#757575', marginTop: 2 },
  searchBox: { marginTop: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 12, paddingHorizontal: 12 },
  searchInput: { flex: 1, paddingVertical: 12, paddingHorizontal: 8, fontSize: 16, color: '#212121' },
  listContent: { padding: 12, paddingBottom: 96 },
  itemCard: { backgroundColor: 'white', borderRadius: 16, marginBottom: 12, padding: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemName: { fontSize: 18, fontWeight: '700', color: '#212121' },
  itemDesc: { color: '#757575', fontSize: 14, marginTop: 2 },
  itemBottomRow: { flexDirection: 'row', marginTop: 8 },
  itemPrice: { color: '#388E3C', fontWeight: '700', marginRight: 12 },
  itemStock: { color: '#757575' },
  actionsInline: { flexDirection: 'row', alignItems: 'center' },
  roundIcon: { padding: 10, borderRadius: 999 },
  emptyBox: { paddingHorizontal: 16, paddingVertical: 24, alignItems: 'center' },
  emptyText: { color: '#757575' },
  fab: { position: 'absolute', right: 20, bottom: 20, backgroundColor: '#E65100', width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 5 }
});
