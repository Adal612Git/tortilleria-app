import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { formatCurrency } from '../../utils/currency';
import { DatabaseService } from '../../../infrastructure/database/DatabaseService';

type Row = {
  id: number;
  name?: string;
  quantity: number;
  totalPrice: number;
  saleDate: string;
  saleDay: string;
};

type DailyTotal = { date: string; total: number; quantity: number };

const formatDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const formatDateDisplay = (value?: string) => {
  if (!value) return 'Seleccionar';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Seleccionar';
  return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1)
    .toString()
    .padStart(2, '0')}/${date.getFullYear()}`;
};

export default function SalesHistoryScreen() {
  const [rows, setRows] = useState<Row[]>([]);
  const [dailyTotals, setDailyTotals] = useState<DailyTotal[]>([]);
  const [startDate, setStartDate] = useState(() => {
    const base = new Date();
    base.setDate(base.getDate() - 6);
    return formatDateKey(base);
  });
  const [endDate, setEndDate] = useState(() => formatDateKey(new Date()));
  const [pickerState, setPickerState] = useState<{ field: 'start' | 'end' | null; value: Date }>({
    field: null,
    value: new Date(),
  });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const db = await DatabaseService.getInstance().getDatabase();
      const data = await db.getAllAsync<any>(
        `
          SELECT
            s.id as id,
          p.name as name,
          s.quantity as quantity,
          s.totalPrice as totalPrice,
          s.saleDate as saleDate,
          DATE(s.saleDate) as saleDay
        FROM sales s
          LEFT JOIN products p ON p.id = s.productId
        WHERE DATE(s.saleDate) BETWEEN ? AND ?
        ORDER BY s.saleDate DESC
      `,
      [startDate, endDate]
    );
    const mapped: Row[] = data.map((r: any) => ({
      id: r.id,
      name: r.name ?? 'Producto',
      quantity: r.quantity,
      totalPrice: r.totalPrice,
      saleDate: r.saleDate,
      saleDay: r.saleDay ?? formatDateKey(new Date(r.saleDate)),
    }));
    setRows(mapped);

    const totalsMap: Record<string, { total: number; quantity: number }> = {};
    mapped.forEach((row) => {
      const key = row.saleDay;
      if (!totalsMap[key]) {
        totalsMap[key] = { total: 0, quantity: 0 };
      }
      totalsMap[key].total += Number(row.totalPrice || 0);
      totalsMap[key].quantity += Number(row.quantity || 0);
    });
      const summary = Object.entries(totalsMap)
        .sort(([a], [b]) => (a < b ? 1 : a > b ? -1 : 0))
        .map(([date, stats]) => ({
          date,
          total: stats.total,
          quantity: stats.quantity,
        }));
      setDailyTotals(summary);
    } catch (err) {
      console.error('Sales history load failed', err);
      setRows([]);
      setDailyTotals([]);
    } finally {
      setLoading(false);
    }
  }, [endDate, startDate]);

  useEffect(() => {
    load();
  }, [load]);

  const openPicker = (field: 'start' | 'end') => {
    const base = field === 'start' ? startDate : endDate;
    setPickerState({ field, value: new Date(base) });
  };

  const handlePickerChange = (_event: any, selectedDate?: Date) => {
    if (!pickerState.field) {
      setPickerState({ field: null, value: new Date() });
      return;
    }
    if (selectedDate) {
      const formatted = formatDateKey(selectedDate);
      if (pickerState.field === 'start') {
        setStartDate(formatted);
        if (formatted > endDate) {
          setEndDate(formatted);
        }
      } else {
        setEndDate(formatted);
        if (formatted < startDate) {
          setStartDate(formatted);
        }
      }
    }
    setPickerState({ field: null, value: new Date() });
  };

  const handleWebRangeChange =
    (field: 'start' | 'end') => (event: React.ChangeEvent<HTMLInputElement>) => {
      const raw = event.target.value.replace(/[^0-9-]/g, '').slice(0, 10);
      if (!raw) return;
      if (field === 'start') {
        setStartDate(raw);
        if (raw > endDate) {
          setEndDate(raw);
        }
      } else {
        setEndDate(raw);
        if (raw < startDate) {
          setStartDate(raw);
        }
      }
    };

  const renderDateField = (field: 'start' | 'end') => {
    const label = field === 'start' ? 'Desde' : 'Hasta';
    const value = field === 'start' ? startDate : endDate;
    if (Platform.OS === 'web') {
      return (
        <View key={field} style={styles.filterField}>
          <Text style={styles.filterLabel}>{label}</Text>
          <input
            type="date"
            value={value}
            max={formatDateKey(new Date())}
            onChange={handleWebRangeChange(field)}
            style={styles.webDateInput}
          />
        </View>
      );
    }
    return (
      <TouchableOpacity key={field} style={styles.filterField} onPress={() => openPicker(field)}>
        <Text style={styles.filterLabel}>{label}</Text>
        <Text style={styles.filterValue}>{formatDateDisplay(value)}</Text>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={styles.title}>Historial de Ventas</Text>
      <View style={styles.filterRow}>
        {renderDateField('start')}
        {renderDateField('end')}
        <TouchableOpacity style={styles.filterButton} onPress={load}>
          <Text style={styles.filterButtonText}>Aplicar</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.dailyCard}>
        <Text style={styles.dailyTitle}>Desglose diario</Text>
        {dailyTotals.length === 0 ? (
          <Text style={styles.muted}>Sin ventas en el rango seleccionado.</Text>
        ) : (
          dailyTotals.map((total) => (
            <View key={total.date} style={styles.dailyRow}>
              <Text style={styles.dailyLabel}>{formatDateDisplay(total.date)}</Text>
              <View style={styles.dailyStats}>
                <Text style={styles.dailyValue}>{formatCurrency(total.total)}</Text>
                <Text style={styles.muted}>x{total.quantity}</Text>
              </View>
            </View>
          ))
        )}
      </View>
      <Text style={styles.subtitle}>Ventas individuales</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {pickerState.field && Platform.OS !== 'web' && (
        <DateTimePicker
          value={pickerState.value}
          mode="date"
          display="default"
          onChange={handlePickerChange}
          maximumDate={new Date()}
        />
      )}
      <FlatList
        data={rows}
        keyExtractor={(i) => String(i.id)}
        contentContainerStyle={{ paddingBottom: 160 }}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View>
              <Text style={styles.itemTitle}>{item.name}</Text>
              <Text style={styles.muted}>{new Date(item.saleDate).toLocaleString()}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.qty}>x{item.quantity}</Text>
              <Text style={styles.total}>{formatCurrency(item.totalPrice)}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={[styles.muted, { textAlign: 'center', marginTop: 20 }]}>
            {loading ? 'Cargando ventas...' : 'Sin ventas en el rango seleccionado.'}
          </Text>
        }
        ListHeaderComponent={renderHeader}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  headerContainer: { paddingHorizontal: 16, paddingTop: 20 },
  title: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 12 },
  subtitle: { fontWeight: '600', color: '#475569', marginTop: 16, fontSize: 14 },
  filterRow: { flexDirection: 'row', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 12 },
  filterField: { flex: 1, marginRight: 8 },
  filterLabel: { color: '#475569', fontSize: 12, marginBottom: 4 },
  filterValue: { fontSize: 16, color: '#111827', fontWeight: '600' },
  webDateInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#CBD5F5',
    borderRadius: 12,
    padding: 10,
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    backgroundColor: '#fff',
  },
  filterButton: {
    backgroundColor: '#0F172A',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    justifyContent: 'center',
  },
  filterButtonText: { color: 'white', fontWeight: '700' },
  dailyCard: { backgroundColor: 'white', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  dailyTitle: { fontWeight: '700', color: '#0F172A', marginBottom: 6 },
  dailyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  dailyLabel: { color: '#475569', fontWeight: '600' },
  dailyStats: { alignItems: 'flex-end' },
  dailyValue: { color: '#059669', fontWeight: '700' },
  item: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemTitle: { color: '#111827', fontWeight: '700' },
  muted: { color: '#6B7280' },
  qty: { color: '#111827', fontWeight: '700' },
  total: { color: '#059669', fontWeight: '800' },
});
