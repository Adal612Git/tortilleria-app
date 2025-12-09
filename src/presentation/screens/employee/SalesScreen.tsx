import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, LayoutAnimation, UIManager, Platform, Alert, Modal, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProductStore } from '../../store/productStore';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
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
  const [quickQty, setQuickQty] = useState(1);
  const salesRepo = new SalesRepository();
  const { user } = useAuthStore();

  useEffect(() => { seedIfEmpty(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(p => p.name.toLowerCase().includes(q) || (p.description ?? '').toLowerCase().includes(q));
  }, [products, search]);

  const handleAdd = (id: string) => {
    const p = products.find(x => x.id === id);
    if (!p) return;
    for (let i = 0; i < quickQty; i++) {
      addItem({ productId: p.id, name: p.name, price: p.price });
    }
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
      await salesRepo.recordSale(items, undefined, undefined, (user as any)?.id);
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
      style={[styles.card, { minHeight: 92 }]}
      onPress={() => handleAdd(item.id)}
      accessibilityRole="button"
    >
      <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
      <Text style={styles.cardSubtitle} numberOfLines={1}>{item.description}</Text>
      <View style={styles.cardRowBetween}>
        <Text style={styles.cardPrice}>${item.price.toFixed(2)}</Text>
        <Text style={styles.cardStock}>Stock: {item.stock}</Text>
      </View>
    </TouchableOpacity>
  );

  const { logout } = useAuthStore();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Ventas</Text>
          <TouchableOpacity onPress={logout} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>Salir</Text>
          </TouchableOpacity>
        </View>
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
        <View style={styles.qtyRow}>
          {[1,5,10].map(q => (
            <TouchableOpacity key={q} style={[styles.qtyChip, quickQty===q? styles.qtyActive: styles.qtyInactive]} onPress={() => setQuickQty(q)}>
              <Text style={quickQty===q? styles.qtyTextActive: styles.qtyTextInactive}>x{q}</Text>
            </TouchableOpacity>
          ))}
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
      <View style={[styles.cartSheet, { height: isOpen ? 280 : 72 }]}>
        <TouchableOpacity
          style={styles.cartHeader}
          onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); toggle(); }}
          accessibilityRole="button"
        >
          <View style={styles.rowCenter}>
            <Ionicons name="cart" size={20} color="#E65100" />
            <Text style={styles.cartTitle}>Carrito ({items.length})</Text>
          </View>
          <Text style={styles.cartTotal}>${total().toFixed(2)}</Text>
        </TouchableOpacity>

        {isOpen && (
          <View style={{ paddingHorizontal: 16 }}>
            {items.length === 0 ? (
              <Text style={styles.muted}>Sin productos</Text>
            ) : (
              <>
                {items.map(it => (
                  <View key={it.productId} style={styles.cartItemRow}>
                    <Text style={styles.cartItemName} numberOfLines={1}>{it.name}</Text>
                    <View style={styles.rowCenter}>
                      <TouchableOpacity style={styles.qtyBtn} onPress={() => decrement(it.productId)}>
                        <Text style={styles.qtyBtnText}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.qtyText}>{it.quantity}</Text>
                      <TouchableOpacity style={styles.qtyBtn} onPress={() => increment(it.productId)}>
                        <Text style={styles.qtyBtnText}>+</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.removeBtn} onPress={() => remove(it.productId)}>
                        <Ionicons name="trash" size={18} color="#D32F2F" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
                <TouchableOpacity style={styles.payButton} onPress={startPayment} accessibilityLabel="Cobrar">
                  <Text style={styles.payButtonText}>Cobrar</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </View>

      {/* Payment modal */}
      <Modal visible={payOpen} transparent animationType="slide" onRequestClose={() => setPayOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.mutedCenter}>Total</Text>
            <Text style={styles.modalBig}>${total().toFixed(2)}</Text>
            <Text style={styles.mutedCenter}>Efectivo</Text>
            <Text style={styles.modalBig}>${cash || '0'}</Text>

            <View style={styles.keypadRowWrap}>
              {['1','2','3','4','5','6','7','8','9','C','0','.'].map(key => (
                <TouchableOpacity key={key} style={styles.keypadKey}
                  onPress={() => {
                    if (key === 'C') setCash('');
                    else setCash(prev => (prev + key).replace(/(^0)(?=\d)/, ''));
                  }}
                >
                  <Text style={styles.keypadKeyText}>{key}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, styles.modalCancel]} onPress={() => setPayOpen(false)}>
                <Text style={styles.modalBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.modalConfirm]} onPress={confirmPayment}>
                <Text style={styles.modalBtnText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#212121' },
  headerButton: { backgroundColor: '#F1F5F9', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  headerButtonText: { color: '#212121', fontWeight: '700' },
  searchBox: { marginTop: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 12, paddingHorizontal: 12 },
  searchInput: { flex: 1, paddingVertical: 12, paddingHorizontal: 8, fontSize: 16, color: '#212121' },
  qtyRow: { flexDirection: 'row', marginTop: 10 },
  qtyChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, marginRight: 8 },
  qtyActive: { backgroundColor: '#1D4ED8' },
  qtyInactive: { backgroundColor: '#E5E7EB' },
  qtyTextActive: { color: 'white', fontWeight: '700' },
  qtyTextInactive: { color: '#111827', fontWeight: '600' },

  card: { backgroundColor: 'white', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  cardTitle: { color: '#212121', fontSize: 16, fontWeight: '700' },
  cardSubtitle: { color: '#757575', fontSize: 12, marginTop: 2 },
  cardRowBetween: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  cardPrice: { color: '#388E3C', fontWeight: '700' },
  cardStock: { color: '#757575' },

  cartSheet: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  cartHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  rowCenter: { flexDirection: 'row', alignItems: 'center' },
  cartTitle: { marginLeft: 8, color: '#212121', fontWeight: '700' },
  cartTotal: { color: '#212121', fontWeight: '800', fontSize: 16 },
  muted: { color: '#757575' },
  cartItemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  cartItemName: { flex: 1, marginRight: 8, color: '#212121' },
  qtyBtn: { backgroundColor: '#F1F5F9', width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  qtyBtnText: { fontSize: 20 },
  qtyText: { marginHorizontal: 12, fontSize: 16, color: '#212121' },
  removeBtn: { marginLeft: 12, backgroundColor: '#FFEBEE', width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  payButton: { backgroundColor: '#E65100', marginVertical: 8, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  payButtonText: { color: 'white', fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16 },
  mutedCenter: { textAlign: 'center', color: '#757575' },
  modalBig: { textAlign: 'center', fontSize: 28, fontWeight: '800', color: '#212121', marginBottom: 8 },
  keypadRowWrap: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  keypadKey: { margin: 8, width: 72, height: 56, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#F1F5F9' },
  keypadKeyText: { fontSize: 18, color: '#212121' },
  modalActions: { flexDirection: 'row', marginTop: 8 },
  modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  modalCancel: { backgroundColor: '#D32F2F', marginRight: 8 },
  modalConfirm: { backgroundColor: '#388E3C' },
  modalBtnText: { color: 'white', fontWeight: '700' },
});
