import React, { useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Product } from '../../../domain/entities/Product';
import { useSaleCalculator } from '../../hooks/useSaleCalculator';

type Props = {
  product: Product | null;
  visible: boolean;
  onClose: () => void;
  onConfirm: (payload: { mode: 'pesos' | 'kilos'; kilos: number }) => void;
};

export function SalePanel({ product, visible, onClose, onConfirm }: Props) {
  const price = product?.price ?? 0;
  const { mode, setMode, input, setInput, moneyValue, kilosValue, addMoney, addKilos, reset } = useSaleCalculator(price);

  useEffect(() => {
    if (product) {
      reset();
    }
  }, [product?.id, reset]);

  if (!product) {
    return null;
  }

  const handleAdd = () => {
    if (kilosValue <= 0) return;
    onConfirm({ mode, kilos: parseFloat(kilosValue.toFixed(3)) });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>{product.name}</Text>
              <Text style={styles.subtitle}>${price.toFixed(2)} / kg</Text>
            </View>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Cerrar">
              <Text style={styles.close}>X</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleButton, mode === 'pesos' && styles.toggleButtonActive]}
              onPress={() => setMode('pesos')}
            >
              <Text style={[styles.toggleText, mode === 'pesos' && styles.toggleTextActive]}>PESOS</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, mode === 'kilos' && styles.toggleButtonActive]}
              onPress={() => setMode('kilos')}
            >
              <Text style={[styles.toggleText, mode === 'kilos' && styles.toggleTextActive]}>KILOS</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            value={input}
            onChangeText={setInput}
            keyboardType="numeric"
            style={styles.bigInput}
            placeholder="0"
            placeholderTextColor="#CBD5F5"
          />

          <View style={styles.quickRow}>
            <TouchableOpacity style={styles.quickButton} onPress={() => addMoney(10)}>
              <Text style={styles.quickText}>+$10</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickButton} onPress={() => addMoney(20)}>
              <Text style={styles.quickText}>+$20</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickButton} onPress={() => addKilos(0.5)}>
              <Text style={styles.quickText}>+0.5 kg</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickButton} onPress={() => addKilos(1)}>
              <Text style={styles.quickText}>+1 kg</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>Pesos</Text>
              <Text style={styles.summaryValue}>${moneyValue.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>Kilos</Text>
              <Text style={styles.summaryValue}>{kilosValue.toFixed(3)} kg</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.addButton, kilosValue <= 0 && styles.addButtonDisabled]}
            onPress={handleAdd}
            disabled={kilosValue <= 0}
          >
            <Text style={styles.addButtonText}>Agregar al carrito</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.4)', justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject },
  card: { backgroundColor: 'white', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, gap: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  subtitle: { color: '#475569', marginTop: 4 },
  close: { fontSize: 22, fontWeight: '700', color: '#475569' },
  toggleRow: { flexDirection: 'row', backgroundColor: '#E2E8F0', borderRadius: 14, padding: 4 },
  toggleButton: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  toggleButtonActive: { backgroundColor: '#0F172A' },
  toggleText: { fontWeight: '700', color: '#475569' },
  toggleTextActive: { color: 'white' },
  bigInput: { fontSize: 48, fontWeight: '800', textAlign: 'center', color: '#0F172A' },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  quickButton: { flexBasis: '48%', backgroundColor: '#F1F5F9', borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  quickText: { fontWeight: '700', color: '#0F172A' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryBox: { flex: 1 },
  summaryLabel: { color: '#94A3B8', fontSize: 12 },
  summaryValue: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  addButton: { backgroundColor: '#059669', borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  addButtonDisabled: { opacity: 0.4 },
  addButtonText: { color: 'white', fontWeight: '700', fontSize: 16 },
});
