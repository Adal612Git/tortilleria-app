import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import BarChart from '../components/charts/BarChart';
import { useReportsData } from '../hooks/useReportsData';

const filters: { key: 'today' | 'week' | 'month' | 'custom'; label: string }[] = [
  { key: 'today', label: 'Hoy' },
  { key: 'week', label: '7 dias' },
  { key: 'month', label: '30 dias' },
  { key: 'custom', label: 'Rango' },
];

const currency = (value: number) => `$${value.toFixed(2)}`;

const formatDateTime = (iso?: string | null) => {
  if (!iso) return 'Sin registros';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Sin registros';
  return `${date.getDate()}/${date.getMonth() + 1} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
};

export default function ReportsScreen() {
  const {
    data,
    loading,
    error,
    range,
    setRange,
    customStart,
    setCustomStart,
    customEnd,
    setCustomEnd,
    refresh,
    usingFakeData,
  } = useReportsData();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const paymentSlices = data.paymentMethods.length > 0
    ? data.paymentMethods
    : [{ method: 'Efectivo', amount: data.totals.revenue, percentage: 100 }];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor="#0F172A" />}>
        <Text style={styles.title}>Reportes del POS</Text>
        {usingFakeData && <Text style={styles.fakeLabel}>Mostrando datos de ejemplo</Text>}
        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.filtersRow}>
          {filters.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, range === f.key ? styles.filterActive : styles.filterInactive]}
              onPress={() => setRange(f.key)}>
              <Text style={range === f.key ? styles.filterTextActive : styles.filterTextInactive}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {range === 'custom' && (
          <View style={styles.rangeRow}>
            <View style={styles.rangeInputBox}>
              <Text style={styles.rangeLabel}>Inicio</Text>
              <TextInput
                style={styles.rangeInput}
                value={customStart}
                onChangeText={setCustomStart}
                placeholder="2025-01-01"
                placeholderTextColor="#94A3B8"
              />
            </View>
            <View style={styles.rangeInputBox}>
              <Text style={styles.rangeLabel}>Fin</Text>
              <TextInput
                style={styles.rangeInput}
                value={customEnd}
                onChangeText={setCustomEnd}
                placeholder="2025-01-31"
                placeholderTextColor="#94A3B8"
              />
            </View>
            <TouchableOpacity style={styles.rangeButton} onPress={refresh}>
              <Text style={styles.rangeButtonText}>Aplicar</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.cardGrid}>
          <View style={[styles.card, styles.cardSpacer]}>
            <Text style={styles.muted}>Ingresos</Text>
            <Text style={styles.big}>{currency(data.totals.revenue)}</Text>
            <Text style={styles.mutedSmall}>Ultima venta: {formatDateTime(data.totals.lastSale)}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.muted}>Articulos vendidos</Text>
            <Text style={styles.big}>{data.totals.items}</Text>
            <Text style={styles.mutedSmall}>Ticket promedio {currency(data.totals.avgTicket)}</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Productos vendidos</Text>
            <Text style={styles.sectionSubtitle}>Top basado en el rango</Text>
          </View>
          {data.products.length === 0 ? (
            <Text style={styles.muted}>Sin datos disponibles</Text>
          ) : (
            data.products.map((product) => (
              <View key={product.name} style={styles.rowBetween}>
                <Text style={styles.itemName}>{product.name}</Text>
                <Text style={styles.itemQty}>{product.quantity} uds - {currency(product.revenue)}</Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Ventas por fecha</Text>
            <Text style={styles.sectionSubtitle}>Agrupadas por dia</Text>
          </View>
          {data.salesByDate.length === 0 ? (
            <Text style={styles.muted}>Sin datos</Text>
          ) : (
            <BarChart data={data.salesByDate} barColor="#7C3AED" />
          )}
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Metodos de pago</Text>
            <Text style={styles.sectionSubtitle}>Distribucion actual</Text>
          </View>
          {paymentSlices.map((slice) => (
            <View key={slice.method} style={styles.paymentRow}>
              <View style={styles.paymentLabelBox}>
                <Text style={styles.itemName}>{slice.method}</Text>
                <Text style={styles.mutedSmall}>{slice.percentage}%</Text>
              </View>
              <View style={styles.paymentBarTrack}>
                <View style={[styles.paymentBarFill, { width: `${Math.min(slice.percentage, 100)}%` }]} />
              </View>
              <Text style={styles.itemQty}>{currency(slice.amount)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Movimiento de stock</Text>
            <Text style={styles.sectionSubtitle}>Ventas vs inventario</Text>
          </View>
          {data.stockMovements.length === 0 ? (
            <Text style={styles.muted}>Sin datos</Text>
          ) : (
            data.stockMovements.map((movement) => (
              <View key={movement.product} style={styles.stockRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{movement.product}</Text>
                  <Text style={styles.mutedSmall}>Ultima venta {formatDateTime(movement.lastSale)}</Text>
                </View>
                <View style={styles.stockBadge}>
                  <Text style={styles.stockBadgeText}>-{movement.sold}</Text>
                </View>
                <View style={[styles.stockBadge, styles.stockBadgePositive]}>
                  <Text style={styles.stockBadgeText}>Stock {movement.remaining}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  fakeLabel: { color: '#9CA3AF', marginBottom: 8 },
  errorText: { color: '#DC2626', marginBottom: 8 },
  filtersRow: { flexDirection: 'row', marginBottom: 12 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, marginRight: 8 },
  filterActive: { backgroundColor: '#0F172A' },
  filterInactive: { backgroundColor: '#E2E8F0' },
  filterTextActive: { color: 'white', fontWeight: '700' },
  filterTextInactive: { color: '#0F172A', fontWeight: '600' },
  rangeRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12 },
  rangeInputBox: { flex: 1, marginRight: 8 },
  rangeLabel: { color: '#475569', marginBottom: 4 },
  rangeInput: { borderWidth: 1, borderColor: '#CBD5F5', borderRadius: 10, padding: 10, color: '#0F172A', backgroundColor: 'white' },
  rangeButton: { backgroundColor: '#2563EB', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12 },
  rangeButtonText: { color: 'white', fontWeight: '700' },
  cardGrid: { flexDirection: 'row', marginBottom: 12 },
  card: { flex: 1, backgroundColor: 'white', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  cardSpacer: { marginRight: 12 },
  muted: { color: '#94A3AF' },
  big: { fontSize: 24, fontWeight: '800', color: '#0F172A', marginTop: 4 },
  mutedSmall: { color: '#94A3AF', marginTop: 2 },
  sectionCard: { backgroundColor: 'white', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16 },
  sectionHeader: { marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  sectionSubtitle: { color: '#94A3AF', fontSize: 12 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  itemName: { color: '#0F172A', fontWeight: '600' },
  itemQty: { color: '#475569', fontWeight: '600' },
  paymentRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  paymentLabelBox: { width: 90 },
  paymentBarTrack: { flex: 1, height: 10, backgroundColor: '#E2E8F0', borderRadius: 999, marginHorizontal: 8 },
  paymentBarFill: { height: 10, borderRadius: 999, backgroundColor: '#059669' },
  stockRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  stockBadge: { backgroundColor: '#FECACA', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, marginHorizontal: 6 },
  stockBadgePositive: { backgroundColor: '#DCFCE7' },
  stockBadgeText: { color: '#0F172A', fontWeight: '700' },
});
