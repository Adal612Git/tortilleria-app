import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { PaymentStatus } from '../../hooks/usePaymentFlow';

type Props = {
  visible: boolean;
  total: number;
  paid: number;
  remaining: number;
  change: number;
  status: PaymentStatus;
  processing?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function PaymentConfirmationModal({
  visible,
  total,
  paid,
  remaining,
  change,
  status,
  processing = false,
  onCancel,
  onConfirm,
}: Props) {
  const isReady = status === 'ready';
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Confirmar venta</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total</Text>
            <Text style={styles.summaryValue}>${total.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Pagado</Text>
            <Text style={styles.summaryValue}>${paid.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Cambio</Text>
            <Text style={styles.summaryValue}>${change.toFixed(2)}</Text>
          </View>

          {isReady ? (
            <Text style={styles.success}>Cobro completo. Puedes finalizar la venta.</Text>
          ) : (
            <Text style={styles.warning}>Faltan ${remaining.toFixed(2)} por cobrar.</Text>
          )}

          <View style={styles.actions}>
            <TouchableOpacity style={[styles.actionBtn, styles.actionCancel]} onPress={onCancel}>
              <Text style={styles.actionTextDark}>Regresar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionConfirm, (!isReady || processing) && styles.actionDisabled]}
              onPress={onConfirm}
              disabled={!isReady || processing}
            >
              <Text style={styles.actionText}>
                {processing ? 'Procesando...' : 'Confirmar venta'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.4)', justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: 'white', width: '90%', borderRadius: 20, padding: 20, gap: 12 },
  title: { fontSize: 18, fontWeight: '800', color: '#0F172A', textAlign: 'center' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { color: '#475569' },
  summaryValue: { fontWeight: '700', color: '#0F172A' },
  warning: { color: '#DC2626', fontWeight: '600', textAlign: 'center', marginTop: 4 },
  success: { color: '#059669', fontWeight: '600', textAlign: 'center', marginTop: 4 },
  actions: { flexDirection: 'row', marginTop: 12, gap: 12 },
  actionBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  actionCancel: { backgroundColor: '#E2E8F0' },
  actionConfirm: { backgroundColor: '#0F172A' },
  actionDisabled: { opacity: 0.5 },
  actionText: { color: 'white', fontWeight: '700' },
  actionTextDark: { color: '#0F172A', fontWeight: '700' },
});
