import React, { useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Product } from '../../../domain/entities/Product';
import { useSaleCalculator } from '../../hooks/useSaleCalculator';
import { formatCurrency } from '../../utils/currency';

const keypadKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'C'] as const;
const kiloPresets = [
  { label: '1/4 kg', value: 0.25 },
  { label: '1/2 kg', value: 0.5 },
  { label: '1 kg', value: 1 },
  { label: '2 kg', value: 2 },
] as const;

type Props = {
  product: Product | null;
  visible: boolean;
  onClose: () => void;
  onConfirm: (payload: { mode: 'pesos' | 'kilos'; kilos: number }) => void;
};

export function SalePanel({ product, visible, onClose, onConfirm }: Props) {
  const price = product?.price ?? 0;
  const { mode, setMode, input, setInput, moneyValue, kilosValue, reset } = useSaleCalculator(price);

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

  const handleKeyPress = (key: (typeof keypadKeys)[number]) => {
    if (mode !== 'pesos') {
      return;
    }
    if (key === 'C') {
      setInput('0');
      return;
    }
    if (key === '.' && input.includes('.')) {
      return;
    }
    const next = input === '0' && key !== '.' ? key : `${input}${key}`;
    setInput(next);
  };

  const handlePreset = (value: number) => {
    const current = parseFloat(input) || 0;
    const total = current + value;
    setInput(total.toString());
  };

  const handleClear = () => {
    setInput('0');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>{product.name}</Text>
              <Text style={styles.subtitle}>{formatCurrency(price)} / kg</Text>
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

          {mode === 'kilos' && (
            <View style={styles.presetsColumn}>
              <View style={styles.presetsRow}>
                {kiloPresets.map((preset) => (
                  <TouchableOpacity key={preset.value} style={styles.presetButton} onPress={() => handlePreset(preset.value)}>
                    <Text style={styles.presetText}>{preset.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
                <Text style={styles.clearButtonText}>Limpiar</Text>
              </TouchableOpacity>
            </View>
          )}

          {mode === 'pesos' && (
            <View style={styles.keypad}>
              {keypadKeys.map((key) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.keypadKey, key === 'C' && styles.keypadKeyClear]}
                  onPress={() => handleKeyPress(key)}
                >
                  <Text style={[styles.keypadKeyText, key === 'C' && styles.keypadKeyTextClear]}>
                    {key === 'C' ? 'Limpiar' : key}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.summaryRow}>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>Pesos</Text>
              <Text style={styles.summaryValue}>{formatCurrency(moneyValue)}</Text>
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
  presetsColumn: { gap: 10 },
  presetsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  presetButton: { flexGrow: 1, flexBasis: '22%', minWidth: 70, backgroundColor: '#EEF2FF', borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  presetText: { fontWeight: '700', color: '#1E3A8A', fontSize: 12 },
  clearButton: { borderWidth: 1, borderColor: '#F87171', borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  clearButtonText: { color: '#B91C1C', fontWeight: '700' },
  keypad: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  keypadKey: { flexBasis: '30%', backgroundColor: '#F1F5F9', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  keypadKeyClear: { backgroundColor: '#FFE4E6' },
  keypadKeyText: { fontWeight: '700', fontSize: 18, color: '#0F172A' },
  keypadKeyTextClear: { color: '#B91C1C' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryBox: { flex: 1 },
  summaryLabel: { color: '#94A3B8', fontSize: 12 },
  summaryValue: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  addButton: { backgroundColor: '#059669', borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  addButtonDisabled: { opacity: 0.4 },
  addButtonText: { color: 'white', fontWeight: '700', fontSize: 16 },
});


