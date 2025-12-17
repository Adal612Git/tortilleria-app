import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Pressable,
  LayoutAnimation,
  UIManager,
  Platform,
  Alert,
  Modal,
  StyleSheet,
  ScrollView,
  Image,
  ListRenderItemInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useProductStore } from '../../store/productStore';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { Product } from '../../../domain/entities/Product';
import { SalePanel } from '../../components/ui/SalePanel';
import { PaymentConfirmationModal } from '../../components/ui/PaymentConfirmationModal';
import { formatCurrency } from '../../utils/currency';
import { usePaymentFlow } from '../../hooks/usePaymentFlow';
import { useCashCutState } from '../../hooks/useCashCutState';
import { CheckoutService } from '../../../application/services/CheckoutService';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const catalogFilters = [
  { key: 'tortilla', label: 'Tortillas' },
  { key: 'tostada', label: 'Tostadas' },
  { key: 'masa', label: 'Masa' },
  { key: 'otros', label: 'Otros' },
] as const;

type CatalogFilterKey = (typeof catalogFilters)[number]['key'];

const keypadLayout = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', 'C'],
] as const;
const productPlaceholder = require('../../../../assets/icon.png');

const matchesCategory = (product: Product, filter: CatalogFilterKey) => {
  if (filter === 'otros') {
    return product.category === 'otros';
  }
  return product.category === filter;
};

const formatQuantity = (value: number) => {
  if (Number.isInteger(value)) return value.toString();
  const normalized = parseFloat(value.toFixed(3)).toString();
  return normalized.replace(/0+$/, '').replace(/\.$/, '');
};

const KG_ALLOWED_CATEGORIES = new Set(['masa', 'tortilla']);

export default function SalesScreen() {
  const { products, seedIfEmpty, load } = useProductStore();
  const { items, addItem, increment, decrement, remove, clear, isOpen, toggle, total } = useCartStore();
  const { user, logout } = useAuthStore();
  const [payOpen, setPayOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [processingSale, setProcessingSale] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CatalogFilterKey>('tortilla');
  const [saleProduct, setSaleProduct] = useState<Product | null>(null);
  const checkoutService = useMemo(() => new CheckoutService(), []);
  const cartTotal = useMemo(() => total(), [items, total]);
  const payment = usePaymentFlow(cartTotal);

  const ensureStockAvailability = useCallback((product: Product, requestedDelta: number) => {
    const cartItem = items.find(i => i.productId === product.id);
    const inCart = cartItem?.quantity ?? 0;
    const rawStock = Number(product.stock ?? 0);
    const remaining = rawStock - inCart;
    const isInfiniteStock = !Number.isFinite(rawStock) || rawStock >= 1e12;
    if (isInfiniteStock || !Number.isFinite(remaining)) {
      return true;
    }
    if (requestedDelta > remaining + 1e-6) {
      const unitLabel = product.unit === 'kg' ? 'kg' : product.unit === 'pieza' ? 'pz' : product.unit;
      const decimals = unitLabel === 'kg' ? 3 : 0;
      const formattedRemaining = Math.max(remaining, 0);
      Alert.alert(
        'Stock insuficiente',
        `Solo quedan ${formattedRemaining.toFixed(decimals)} ${unitLabel} disponibles de ${product.name}.`
      );
      return false;
    }
    return true;
  }, [items]);

  const handleIncrement = useCallback((productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const cartItem = items.find(i => i.productId === productId);
    const step = cartItem?.unitAmount ?? 1;
    if (!ensureStockAvailability(product, step)) {
      return;
    }
    increment(productId, step);
  }, [products, items, ensureStockAvailability, increment]);

  useEffect(() => {
    seedIfEmpty();
  }, [seedIfEmpty]);

  const filtered = useMemo(() => products.filter(product => matchesCategory(product, activeCategory)), [
    products,
    activeCategory,
  ]);

  const pushItemToCart = (product: Product, quantity: number, unitLabel?: string, unitAmount?: number): boolean => {
    const normalized = parseFloat(quantity.toFixed(3));
    if (normalized <= 0) return false;
    if (!ensureStockAvailability(product, normalized)) {
      return false;
    }
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: normalized,
      unitLabel,
      unitAmount: unitAmount ?? normalized,
    });
    Haptics.selectionAsync();
    if (!isOpen) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      toggle(true);
    }
    return true;
  };

  const handleProductPress = (product: Product) => {
    const canUseKg = KG_ALLOWED_CATEGORIES.has(product.category);
    if (product.unit === 'kg' && canUseKg) {
      setSaleProduct(product);
      return;
    }
    const label = product.unit === 'pieza' ? 'pz' : product.unit;
    pushItemToCart(product, 1, label, 1);
  };

  const handlePanelConfirm = ({ kilos, mode }: { kilos: number; mode: 'pesos' | 'kilos' }) => {
    if (!saleProduct) return;
    const added = pushItemToCart(saleProduct, kilos, mode, kilos);
    if (added) {
      setSaleProduct(null);
    }
  };

  const { state: cashCutState } = useCashCutState();

  const startPayment = () => {
    console.log('--- CLICK DETECTADO EN COBRAR ---', {
      itemsCount: items.length,
      cartTotal,
      cajaAbierta: cashCutState.isOpen,
    });
    if (!cashCutState.isOpen && user?.role === 'empleado') {
      Alert.alert('Caja cerrada', 'Abre la caja antes de comenzar a cobrar.');
      clear();
      payment.reset();
      toggle(false);
      return;
    }
    if (items.length === 0) {
      Alert.alert('No se puede cobrar', 'Agrega productos al carrito antes de cobrar.');
      return;
    }
    payment.reset();
    payment.setAmount('0');
    setReviewOpen(false);
    setPayOpen(true);
  };

  const closePaymentModal = () => {
    setPayOpen(false);
    setReviewOpen(false);
    payment.reset();
  };

  const handleSaleConfirmation = async () => {
    if (processingSale || payment.status === 'insufficient') return;
    setProcessingSale(true);
    setReviewOpen(false);
    setPayOpen(false);
    try {
      const result = await checkoutService.completeSale({
        items,
        paidAmount: payment.paidAmount,
        userId: (user as any)?.id,
      });
      const change = Math.max(result.change, 0);
      Alert.alert('Venta completada', `Cambio: ${formatCurrency(change)}`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      clear();
      payment.reset();
      await load();
      toggle(false);
      closePaymentModal();
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', e?.message ?? 'No se pudo registrar la venta.');
      await load();
      setPayOpen(true);
      setReviewOpen(false);
    } finally {
      setProcessingSale(false);
    }
  };

  const renderProduct = ({ item }: ListRenderItemInfo<Product>) => (
    <TouchableOpacity style={styles.card} onPress={() => handleProductPress(item)} accessibilityRole="button">
      <Image source={productPlaceholder} style={styles.productImage} resizeMode="cover" />
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.cardSubtitle} numberOfLines={1}>{item.description}</Text>
        <View style={styles.cardRowBetween}>
          <Text style={styles.cardPrice}>{formatCurrency(item.price)}</Text>
          <Text style={styles.cardStock}>Stock: {item.stock}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const isWeb = Platform.OS === 'web';
  const bottomSheetHeight = isOpen ? 320 : 72;
  const estimatedTopArea = 220;
  const safeHeight = Math.max(0, estimatedTopArea + bottomSheetHeight);
  const contentWrapperStyles = [styles.mainContent];
  if (isWeb) {
    contentWrapperStyles.push({
      maxHeight: `calc(100vh - ${safeHeight}px)`,
      overflowY: 'auto',
      minHeight: 0,
    });
  }

  return (
    <SafeAreaView style={[styles.container, isWeb && styles.containerWeb]}>
      <View style={contentWrapperStyles}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Ventas</Text>
            <TouchableOpacity onPress={logout} style={styles.headerButton}>
              <Text style={styles.headerButtonText}>Salir</Text>
            </TouchableOpacity>
          </View>
        </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroll}
        style={styles.categoryWrapper}
      >
          {catalogFilters.map(filter => {
            const active = activeCategory === filter.key;
            return (
              <TouchableOpacity
                key={filter.key}
                style={[styles.categoryChip, active && styles.categoryChipActive]}
                onPress={() => setActiveCategory(filter.key)}
              >
                <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>{filter.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <FlatList<Product>
          data={filtered}
          keyExtractor={(item) => item.id}
          style={styles.productList}
          contentContainerStyle={styles.productListContent}
          numColumns={2}
          columnWrapperStyle={{ gap: 12 }}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          showsVerticalScrollIndicator
          renderItem={(info) => (
            <View style={{ flex: 1 }}>
              {renderProduct(info)}
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Sin productos</Text>
              <Text style={styles.emptySubtitle}>Ajusta la busqueda o agrega inventario.</Text>
            </View>
          }
        />
      </View>

      <View style={[styles.cartSheet, { height: isOpen ? 320 : 72 }]} accessibilityHint="Panel del carrito">
        <TouchableOpacity
          style={styles.cartHeader}
          onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); toggle(); }}
          accessibilityRole="button"
        >
          <View style={styles.rowCenter}>
            <Ionicons name="cart" size={20} color="#E65100" />
            <Text style={styles.cartTitle}>Carrito ({items.length})</Text>
          </View>
          <Text style={styles.cartTotal}>{formatCurrency(cartTotal)}</Text>
        </TouchableOpacity>

        {isOpen && (
          <View style={{ paddingHorizontal: 16 }}>
            {items.length === 0 ? (
              <Text style={styles.muted}>Sin productos</Text>
            ) : (
              <>
                {items.map(it => (
                  <View key={it.productId} style={styles.cartItemRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cartItemName} numberOfLines={1}>{it.name}</Text>
                      {it.unitLabel && <Text style={styles.cartItemUnit}>{it.unitLabel}</Text>}
                    </View>
                    <View style={styles.rowCenter}>
                      <TouchableOpacity style={styles.qtyBtn} onPress={() => decrement(it.productId, it.unitAmount)}>
                        <Text style={styles.qtyBtnText}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.qtyText}>{formatQuantity(it.quantity)}</Text>
                      <TouchableOpacity style={styles.qtyBtn} onPress={() => handleIncrement(it.productId)}>
                        <Text style={styles.qtyBtnText}>+</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.removeBtn} onPress={() => remove(it.productId)}>
                        <Ionicons name="trash" size={18} color="#D32F2F" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
                <Pressable style={styles.payButton} onPress={startPayment} accessibilityLabel="Cobrar">
                  <Text style={styles.payButtonText}>Cobrar</Text>
                </Pressable>
              </>
            )}
          </View>
        )}
      </View>

      <Modal visible={payOpen} transparent animationType="slide" onRequestClose={closePaymentModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.mutedCenter}>Total</Text>
            <Text style={styles.modalBig}>{formatCurrency(cartTotal)}</Text>
            <Text style={styles.mutedCenter}>Efectivo</Text>
            <Text style={styles.modalBig}>{formatCurrency(payment.input || '0')}</Text>

            <View style={styles.keypad}>
              {keypadLayout.map((row, rowIndex) => (
                <View
                  key={`row-${rowIndex}`}
                  style={[styles.keypadRow, rowIndex === keypadLayout.length - 1 && styles.keypadRowLast]}
                >
                  {row.map((key, keyIndex) =>
                    key ? (
                      <TouchableOpacity
                        key={`${key}-${rowIndex}-${keyIndex}`}
                        style={[styles.keypadKey, key === 'C' && styles.keypadKeyClear]}
                        onPress={() => payment.handleKeyPress(key)}
                      >
                        <Text style={[styles.keypadKeyText, key === 'C' && styles.keypadKeyTextClear]}>{key}</Text>
                      </TouchableOpacity>
                    ) : (
                      <View key={`empty-${rowIndex}-${keyIndex}`} style={[styles.keypadKey, styles.keypadKeyPlaceholder]} />
                    )
                  )}
                </View>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, styles.modalCancel]} onPress={closePaymentModal}>
                <Text style={styles.modalBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.modalConfirm]} onPress={() => setReviewOpen(true)}>
                <Text style={styles.modalBtnText}>Revisar cobro</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <SalePanel
        product={saleProduct}
        visible={!!saleProduct}
        onClose={() => setSaleProduct(null)}
        onConfirm={handlePanelConfirm}
      />

      <PaymentConfirmationModal
        visible={reviewOpen}
        total={cartTotal}
        paid={payment.paidAmount}
        remaining={payment.remaining}
        change={payment.change}
        status={payment.status}
        processing={processingSale}
        onCancel={() => setReviewOpen(false)}
        onConfirm={handleSaleConfirmation}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  containerWeb: {
    maxHeight: '100vh',
  },
  mainContent: {
    flex: 1,
    minHeight: 0,
  },
  header: { backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#212121' },
  headerButton: { backgroundColor: '#F1F5F9', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', flexDirection: 'row', alignItems: 'center' },
  headerButtonIcon: { marginRight: 6 },
  headerButtonText: { color: '#212121', fontWeight: '700' },
  categoryWrapper: { height: 50 },
  categoryScroll: { paddingVertical: 6, paddingRight: 16, alignItems: 'center' },
  categoryChip: {
    height: 36,
    paddingVertical: 0,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: '#E2E8F0',
    marginRight: 6,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryChipActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
    borderWidth: 1,
  },
  categoryChipText: {
    fontWeight: '700',
    color: '#475569',
    fontSize: 11,
    lineHeight: 16,
  },
  categoryChipTextActive: { color: 'white' },
  productList: { flex: 1 },
  productListContent: { padding: 12, paddingBottom: 260, flexGrow: 1 },
  card: { backgroundColor: 'white', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden' },
  cardInfo: { padding: 12 },
  productImage: { width: '100%', height: 90, backgroundColor: '#F8FAFC' },
  cardTitle: { color: '#212121', fontSize: 16, fontWeight: '700' },
  cardSubtitle: { color: '#757575', fontSize: 12, marginTop: 2 },
  cardRowBetween: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  cardPrice: { color: '#388E3C', fontWeight: '700' },
  cardStock: { color: '#757575' },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  emptySubtitle: { color: '#6B7280', marginTop: 4, textAlign: 'center' },
  cartSheet: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  cartHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  rowCenter: { flexDirection: 'row', alignItems: 'center' },
  cartTitle: { marginLeft: 8, color: '#212121', fontWeight: '700' },
  cartTotal: { color: '#212121', fontWeight: '800', fontSize: 16 },
  muted: { color: '#757575' },
  cartItemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  cartItemName: { color: '#212121', fontSize: 14, fontWeight: '600' },
  cartItemUnit: { color: '#94A3B8', fontSize: 12 },
  qtyBtn: { backgroundColor: '#F1F5F9', width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  qtyBtnText: { fontSize: 20, color: '#212121' },
  qtyText: { marginHorizontal: 12, fontSize: 16, color: '#212121', minWidth: 40, textAlign: 'center' },
  removeBtn: { marginLeft: 12, backgroundColor: '#FFEBEE', width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  payButton: { backgroundColor: '#E65100', marginVertical: 8, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  payButtonText: { color: 'white', fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16 },
  mutedCenter: { textAlign: 'center', color: '#757575' },
  modalBig: { textAlign: 'center', fontSize: 28, fontWeight: '800', color: '#212121', marginBottom: 8 },
  keypad: { marginTop: 16 },
  keypadRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, marginHorizontal: -6 },
  keypadRowLast: { marginBottom: 0 },
  keypadKey: { flex: 1, marginHorizontal: 6, height: 56, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#F1F5F9' },
  keypadKeyClear: { backgroundColor: '#FFE4E6' },
  keypadKeyPlaceholder: { backgroundColor: 'transparent' },
  keypadKeyText: { fontSize: 18, color: '#212121', fontWeight: '600' },
  keypadKeyTextClear: { color: '#B91C1C' },
  modalActions: { flexDirection: 'row', marginTop: 8 },
  modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  modalCancel: { backgroundColor: '#D32F2F', marginRight: 8 },
  modalConfirm: { backgroundColor: '#388E3C' },
  modalBtnText: { color: 'white', fontWeight: '700' },
});
