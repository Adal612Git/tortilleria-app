import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, LayoutAnimation, UIManager, Platform, Alert, Modal } from 'react-native';
import { useProductStore } from '../../store/productStore';
import { useCartStore } from '../../store/cartStore';
import { Ionicons } from '@expo/vector-icons';
import { SalesRepository } from '../../../infrastructure/repositories/SalesRepository';
import * as Haptics from 'expo-haptics';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function SalesScreen() {
  const { products, seedIfEmpty, setSearch, search } = useProductStore();
  const { items, addItem, increment, decrement, remove, clear, isOpen, toggle, total } = useCartStore();
  const [payOpen, setPayOpen] = useState(false);
  const [cash, setCash] = useState('');
  const salesRepo = new SalesRepository();

  useEffect(() => { seedIfEmpty(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(p => p.name.toLowerCase().includes(q) || (p.description ?? '').toLowerCase().includes(q));
  }, [products, search]);

  const handleAdd = (id: string) => {
    const p = products.find(x => x.id === id);
    if (!p) return;
    addItem({ productId: p.id, name: p.name, price: p.price });
    Haptics.selectionAsync();
    if (!isOpen) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      toggle(true);
    }
  };

  const startPayment = () => {
    if (items.length === 0) return;
    setPayOpen(true);
    setCash('');
  };

  const confirmPayment = async () => {
    const cashNum = parseFloat(cash || '0');
    const totalNum = total();
    if (isNaN(cashNum) || cashNum < totalNum) {
      Alert.alert('Cobro', 'Monto insuficiente');
      return;
    }
    try {
      await salesRepo.recordSale(items);
      const change = cashNum - totalNum;
      Alert.alert('Venta completada', `Cambio: $${change.toFixed(2)}`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      clear();
      setPayOpen(false);
      toggle(false);
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', e.message);
    }
  };

  const renderProduct = ({ item }: any) => (
    <TouchableOpacity
      className="bg-white rounded-2xl p-4 border border-gray-200"
      style={{ minHeight: 92 }}
      onPress={() => handleAdd(item.id)}
      accessibilityRole="button"
    >
      <Text className="text-[#212121] text-[16px] font-semibold" numberOfLines={1}>{item.name}</Text>
      <Text className="text-[#757575] text-[12px]" numberOfLines={1}>{item.description}</Text>
      <View className="flex-row justify-between mt-2">
        <Text className="text-[#388E3C] font-bold">${item.price.toFixed(2)}</Text>
        <Text className="text-[#757575]">Stock: {item.stock}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-[#FAFAFA]">
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <Text className="text-2xl font-bold text-[#212121]">Ventas</Text>
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
        contentContainerStyle={{ padding: 12, paddingBottom: 180 }}
        numColumns={2}
        columnWrapperStyle={{ gap: 12 }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={(info) => (
          <View style={{ flex: 1 }}>
            {renderProduct(info)}
          </View>
        )}
      />

      {/* Bottom cart sheet */}
      <View
        className="absolute left-0 right-0 bg-white border-t border-gray-200"
        style={{ bottom: 0, height: isOpen ? 280 : 72 }}
      >
        <TouchableOpacity
          className="flex-row items-center justify-between px-4 py-4"
          onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); toggle(); }}
          accessibilityRole="button"
        >
          <View className="flex-row items-center">
            <Ionicons name="cart" size={20} color="#E65100" />
            <Text className="ml-2 text-[#212121] font-semibold">Carrito ({items.length})</Text>
          </View>
          <Text className="text-[#212121] font-bold text-[16px]">${total().toFixed(2)}</Text>
        </TouchableOpacity>

        {isOpen && (
          <View className="px-4">
            {items.length === 0 ? (
              <Text className="text-[#757575]">Sin productos</Text>
            ) : (
              <>
                {items.map(it => (
                  <View key={it.productId} className="flex-row justify-between items-center py-2">
                    <Text className="flex-1 mr-2 text-[#212121]" numberOfLines={1}>{it.name}</Text>
                    <View className="flex-row items-center">
                      <TouchableOpacity className="bg-[#F1F5F9] w-10 h-10 rounded-full items-center justify-center" onPress={() => decrement(it.productId)}>
                        <Text className="text-[22px]">-</Text>
                      </TouchableOpacity>
                      <Text className="mx-3 text-[16px] text-[#212121]">{it.quantity}</Text>
                      <TouchableOpacity className="bg-[#F1F5F9] w-10 h-10 rounded-full items-center justify-center" onPress={() => increment(it.productId)}>
                        <Text className="text-[22px]">+</Text>
                      </TouchableOpacity>
                      <TouchableOpacity className="ml-3 bg-[#FFEBEE] w-10 h-10 rounded-full items-center justify-center" onPress={() => remove(it.productId)}>
                        <Ionicons name="trash" size={18} color="#D32F2F" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
                <TouchableOpacity className="bg-[#E65100] my-2 py-4 rounded-xl" onPress={startPayment} accessibilityLabel="Cobrar">
                  <Text className="text-white text-center font-semibold text-[16px]">Cobrar</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </View>

      {/* Payment modal */}
      <Modal visible={payOpen} transparent animationType="slide" onRequestClose={() => setPayOpen(false)}>
        <View className="flex-1 bg-black/30 justify-end">
          <View className="bg-white rounded-t-3xl p-4">
            <Text className="text-center text-[16px] text-[#757575]">Total</Text>
            <Text className="text-center text-3xl font-bold text-[#212121] mb-2">${total().toFixed(2)}</Text>
            <Text className="text-center text-[14px] text-[#757575]">Efectivo</Text>
            <Text className="text-center text-3xl font-bold text-[#212121] mb-4">${cash || '0'}</Text>

            <View className="flex-row flex-wrap justify-center">
              {['1','2','3','4','5','6','7','8','9','C','0','.'].map(key => (
                <TouchableOpacity key={key} className="m-2 w-[72px] h-[56px] items-center justify-center rounded-xl bg-[#F1F5F9]"
                  onPress={() => {
                    if (key === 'C') setCash('');
                    else setCash(prev => (prev + key).replace(/(^0)(?=\d)/, ''));
                  }}
                >
                  <Text className="text-[18px] text-[#212121]">{key}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View className="flex-row mt-2">
              <TouchableOpacity className="flex-1 bg-[#D32F2F] py-4 rounded-xl mr-2" onPress={() => setPayOpen(false)}>
                <Text className="text-white text-center font-semibold">Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity className="flex-1 bg-[#388E3C] py-4 rounded-xl" onPress={confirmPayment}>
                <Text className="text-white text-center font-semibold">Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
