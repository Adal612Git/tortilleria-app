import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import BarChart from '../components/charts/BarChart';
import { formatCurrency } from '../utils/currency';
import { useReportsData } from '../hooks/useReportsData';

const filters: { key: 'today' | 'week' | 'month' | 'custom'; label: string }[] = [
  { key: 'today', label: 'Hoy' },
  { key: 'week', label: '7 dias' },
  { key: 'month', label: '30 dias' },
  { key: 'custom', label: 'Rango' },
];

const formatDateDisplay = (value?: string) => {
  if (!value) return 'Seleccionar';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Seleccionar';
  return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
};
const formatMonthLabel = (key: string) => {
  if (key.length < 7) return key;
  const [year, month] = key.split('-');
  return `${month}/${year.slice(-2)}`;
};
const formatDateTime = (iso?: string | null) => {
  if (!iso) return 'Sin registro';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Sin registro';
  return `${date.getDate()}/${date.getMonth() + 1}`;
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
  const [chartMode, setChartMode] = useState<'day' | 'month'>('day');
  const [pickerState, setPickerState] = useState<{ field: 'start' | 'end' | null; value: Date }>({ field: null, value: new Date() });

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const paymentSlices = data.paymentMethods;
  const chartData = useMemo(() => {
    if (chartMode === 'day') {
      return data.salesByDate;
    }
    const grouped = new Map<string, number>();
    data.salesByDate.forEach((item) => {
      const key = (item.date ?? '').slice(0, 7) || 'Sin fecha';
      grouped.set(key, (grouped.get(key) ?? 0) + item.value);
    });
    return Array.from(grouped.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, value]) => ({ date: key, label: formatMonthLabel(key), value }));
  }, [chartMode, data.salesByDate]);

  const openPicker = (field: 'start' | 'end') => {
    const base = field === 'start' ? customStart : customEnd;
    const candidate = base ? new Date(base) : new Date();
    const safe = Number.isNaN(candidate.getTime()) ? new Date() : candidate;
    setPickerState({ field, value: safe });
  };

  const handlePickerChange = (_event: any, selectedDate?: Date) => {
    if (!pickerState.field) {
      setPickerState({ field: null, value: new Date() });
      return;
    }
    if (selectedDate) {
      const iso = selectedDate.toISOString().slice(0, 10);
      if (pickerState.field === 'start') {
        setCustomStart(iso);
        if (!customEnd) {
          setCustomEnd(iso);
        }
      } else {
        setCustomEnd(iso);
      }
    }
    setPickerState({ field: null, value: new Date() });
  };

  const closePicker = () => setPickerState({ field: null, value: new Date() });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor="#0F172A" />}>
        <Text style={styles.title}>Reportes de venta</Text>
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
            <TouchableOpacity style={styles.rangePicker} onPress={() => openPicker('start')}>
              <Text style={styles.rangeLabel}>Inicio</Text>
              <Text style={styles.rangeValue}>{formatDateDisplay(customStart)}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.rangePicker} onPress={() => openPicker('end')}>
              <Text style={styles.rangeLabel}>Fin</Text>
              <Text style={styles.rangeValue}>{formatDateDisplay(customEnd)}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.rangeApply} onPress={refresh}>
              <Text style={styles.rangeButtonText}>Aplicar</Text>
            </TouchableOpacity>
          </View>
        )}

        {pickerState.field && (
          <DateTimePicker
            value={pickerState.value}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
            onChange={handlePickerChange}
            onTouchCancel={closePicker}
          />
        )}

        <View style={styles.cardGrid}>
          <View style={[styles.card, styles.cardSpacer]}>
            <Text style={styles.muted}>Ingresos</Text>
            <Text style={styles.big}>{formatCurrency(data.totals.revenue)}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.muted}>Piezas vendidas</Text>
            <Text style={styles.big}>{data.totals.items}</Text>
            <Text style={styles.mutedSmall}>Ticket promedio {formatCurrency(data.totals.avgTicket)}</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Productos vendidos</Text>
            <Text style={styles.sectionSubtitle}>Top del rango seleccionado</Text>
          </View>
          {data.products.length === 0 ? (
            <Text style={styles.muted}>Sin datos disponibles</Text>
          ) : (
            data.products.map((product) => (
              <View key={product.name} style={styles.rowBetween}>
                <Text style={styles.itemName}>{product.name}</Text>
                <Text style={styles.itemQty}>{product.quantity} piezas | {formatCurrency(product.revenue)}</Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Ventas por fecha</Text>
            <View style={styles.toggleRow}>
              {(['day', 'month'] as const).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  style={[styles.toggleButton, chartMode === mode ? styles.toggleButtonActive : styles.toggleButtonInactive]}
                  onPress={() => setChartMode(mode)}>
                  <Text style={chartMode === mode ? styles.toggleTextActive : styles.toggleTextInactive}>
                    {mode === 'day' ? 'Por dia' : 'Por mes'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          {chartData.length === 0 ? (
            <Text style={styles.muted}>Sin datos</Text>
          ) : (
            <BarChart data={chartData} barColor="#7C3AED" />
          )}
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Metodos de pago</Text>
          </View>
          {paymentSlices.length === 0 ? (
            <Text style={styles.muted}>Sin datos</Text>
          ) : (
            paymentSlices.map((slice) => (
              <View key={slice.method} style={styles.paymentRow}>
                <View style={styles.paymentLabelBox}>
                  <Text style={styles.itemName}>{slice.method}</Text>
                  <Text style={styles.mutedSmall}>{slice.percentage}%</Text>
                </View>
                <View style={styles.paymentBarTrack}>
                  <View style={[styles.paymentBarFill, { width: `${Math.min(slice.percentage, 100)}%` }]} />
                </View>
                <Text style={styles.itemQty}>{formatCurrency(slice.amount)}</Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Ventas vs inventario</Text>
            <Text style={styles.sectionSubtitle}>Seguimiento de salidas</Text>
          </View>
          {data.stockMovements.length === 0 ? (
            <Text style={styles.muted}>Sin datos</Text>
          ) : (
            data.stockMovements.map((movement) => (
              <View key={movement.product} style={styles.stockRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{movement.product}</Text>
                  <Text style={styles.stockMeta}>Actualizado {formatDateTime(movement.lastSale)}</Text>
                </View>
                <View style={styles.stockBadge}>
                  <Text style={styles.stockBadgeText}>-{movement.sold}</Text>
                </View>
                <View style={[styles.stockBadge, styles.stockBadgePositive]}>
                  <Text style={styles.stockBadgeText}>Inventario {movement.remaining}</Text>
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
  rangeRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12, columnGap: 8 },
  rangePicker: { flex: 1, backgroundColor: 'white', borderWidth: 1, borderColor: '#CBD5F5', borderRadius: 12, padding: 12 },
  rangeLabel: { color: '#475569', marginBottom: 4, fontWeight: '600' },
  rangeValue: { color: '#0F172A', fontWeight: '700' },
  rangeApply: { backgroundColor: '#2563EB', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12 },
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
  toggleRow: { flexDirection: 'row', columnGap: 8 },
  toggleButton: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  toggleButtonActive: { backgroundColor: '#0F172A' },
  toggleButtonInactive: { backgroundColor: '#E2E8F0' },
  toggleTextActive: { color: '#FFFFFF', fontWeight: '700' },
  toggleTextInactive: { color: '#0F172A', fontWeight: '600' },
  paymentRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  paymentLabelBox: { width: 90 },
  paymentBarTrack: { flex: 1, height: 10, backgroundColor: '#E2E8F0', borderRadius: 999, marginHorizontal: 8 },
  paymentBarFill: { height: 10, borderRadius: 999, backgroundColor: '#059669' },
  stockRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  stockMeta: { color: '#94A3AF', fontSize: 12 },
  stockBadge: { backgroundColor: '#FECACA', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, marginHorizontal: 6 },
  stockBadgePositive: { backgroundColor: '#DCFCE7' },
  stockBadgeText: { color: '#0F172A', fontWeight: '700' },
});
