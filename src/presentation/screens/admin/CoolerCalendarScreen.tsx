import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteOperationsRepository } from '@infrastructure/repositories/RouteOperationsRepository';
import { CoolerRecord } from '../../../domain/entities/RouteOperations';
import { formatCurrency } from '../../utils/currency';

const WEEK_LABELS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

const formatDateKey = (date: Date) => date.toISOString().slice(0, 10);

const buildCalendarDays = (year: number, month: number) => {
  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = firstOfMonth.getDay();
  const totalCells = 42;
  const days: { date: Date; isCurrentMonth: boolean }[] = [];
  for (let index = 0; index < totalCells; index += 1) {
    const offset = index - startWeekday + 1;
    const date = new Date(year, month, offset);
    days.push({ date, isCurrentMonth: date.getMonth() === month });
  }
  return days;
};

const formatMonthLabel = (year: number, month: number) =>
  new Date(year, month).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

export default function CoolerCalendarScreen() {
  const repository = useMemo(() => new RouteOperationsRepository(), []);
  const today = useMemo(() => new Date(), []);
  const [calendarMonth, setCalendarMonth] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [selectedDate, setSelectedDate] = useState(today);
  const [coolers, setCoolers] = useState<CoolerRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCoolers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await repository.listCoolers(formatDateKey(selectedDate));
      setCoolers(list.filter((cooler) => cooler.status === 'liquidada'));
    } catch (err: any) {
      setError(err?.message ?? 'No se pudo cargar la información de hieleras');
    } finally {
      setLoading(false);
    }
  }, [repository, selectedDate]);

  useEffect(() => {
    fetchCoolers();
  }, [fetchCoolers]);

  const onSelectDate = (date: Date) => {
    setSelectedDate(date);
    setCalendarMonth({ year: date.getFullYear(), month: date.getMonth() });
  };

  const changeMonth = (delta: number) => {
    setCalendarMonth(({ year, month }) => {
      const next = new Date(year, month + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });
  };

  const calendarDays = useMemo(
    () => buildCalendarDays(calendarMonth.year, calendarMonth.month),
    [calendarMonth]
  );

  const totalKilos = coolers.reduce((sum, cooler) => sum + Number(cooler.kilosSold ?? 0), 0);
  const totalCash = coolers.reduce(
    (sum, cooler) => sum + Number(cooler.receivedTotal ?? cooler.expectedTotal ?? 0),
    0
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Calendario de hieleras</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Fecha seleccionada</Text>
            <Text style={styles.summaryValue}>
              {selectedDate.toLocaleDateString('es-ES', {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
              })}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Kilos vendidos</Text>
            <Text style={styles.summaryValue}>{totalKilos.toFixed(2)} kg</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Dinero entregado</Text>
            <Text style={styles.summaryValue}>{formatCurrency(totalCash)}</Text>
          </View>
        </View>

        <View style={styles.calendarHeader}>
          <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.navButton}>
            <Text style={styles.navText}>{'<'}</Text>
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{formatMonthLabel(calendarMonth.year, calendarMonth.month)}</Text>
          <TouchableOpacity onPress={() => changeMonth(1)} style={styles.navButton}>
            <Text style={styles.navText}>{'>'}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.weekRow}>
          {WEEK_LABELS.map((label) => (
            <Text key={label} style={styles.weekLabel}>
              {label}
            </Text>
          ))}
        </View>
        <View style={styles.calendarGrid}>
          {calendarDays.map((cell) => {
            const isSelected = formatDateKey(cell.date) === formatDateKey(selectedDate);
            return (
              <TouchableOpacity
                key={cell.date.toISOString()}
                style={[
                  styles.calendarDay,
                  !cell.isCurrentMonth && styles.calendarDayDisabled,
                  isSelected && styles.calendarDaySelected,
                ]}
                onPress={() => onSelectDate(cell.date)}
              >
                <Text
                  style={[
                    styles.calendarDayNumber,
                    !cell.isCurrentMonth && styles.calendarDayNumberDisabled,
                    isSelected && styles.calendarDayNumberSelected,
                  ]}
                >
                  {cell.date.getDate()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>Hieleras liquidadas</Text>
          <Text style={styles.sectionSubtitle}>
            {coolers.length} registro{coolers.length === 1 ? '' : 's'}
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#0F172A" />
          </View>
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : coolers.length === 0 ? (
          <Text style={styles.emptyText}>No hay liquidaciones registradas en esta fecha.</Text>
        ) : (
          coolers.map((cooler) => (
            <View key={cooler.id ?? `${cooler.date}-${cooler.coolerNumber}-${cooler.riderId}`} style={styles.recordCard}>
              <View style={styles.recordRow}>
                <Text style={styles.recordLabel}>Repartidor</Text>
                <Text style={styles.recordValue}>#{cooler.riderId}</Text>
              </View>
              <View style={styles.recordRow}>
                <Text style={styles.recordLabel}>Kilos vendidos</Text>
                <Text style={styles.recordValue}>{(cooler.kilosSold ?? 0).toFixed(2)} kg</Text>
              </View>
              <View style={styles.recordRow}>
                <Text style={styles.recordLabel}>Dinero entregado</Text>
                <Text style={styles.recordValue}>{formatCurrency(cooler.receivedTotal ?? cooler.expectedTotal ?? 0)}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '800', color: '#0F172A', marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  summaryCard: { flex: 1, backgroundColor: 'white', borderRadius: 12, padding: 12, marginHorizontal: 4 },
  summaryLabel: { color: '#94A3B8', fontSize: 12 },
  summaryValue: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginTop: 4 },
  calendarHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  navButton: { paddingHorizontal: 12, paddingVertical: 4 },
  navText: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  monthLabel: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  weekLabel: { width: 32, textAlign: 'center', color: '#475569', fontWeight: '600' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  calendarDay: {
    width: '14.2%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    marginBottom: 4,
  },
  calendarDayDisabled: { opacity: 0.4 },
  calendarDaySelected: { backgroundColor: '#0F172A' },
  calendarDayNumber: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  calendarDayNumberDisabled: { color: '#94A3B8' },
  calendarDayNumberSelected: { color: 'white' },
  listHeader: { marginTop: 16, marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  sectionSubtitle: { color: '#94A3AF', fontSize: 12 },
  loadingBox: { paddingVertical: 16, alignItems: 'center' },
  errorText: { color: '#DC2626', marginVertical: 12 },
  emptyText: { color: '#64748B', marginVertical: 12 },
  recordCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  recordRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  recordLabel: { color: '#6B7280', fontSize: 12 },
  recordValue: { fontWeight: '700', color: '#0F172A' },
});
