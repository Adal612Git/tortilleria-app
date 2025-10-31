import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DatabaseService } from '../../infrastructure/database/DatabaseService';
import BarChart from '../components/charts/BarChart';

type Summary = {
  todayRevenue: number;
  todayItems: number;
  weekRevenue: number;
  weekItems: number;
};

type TopItem = { name: string; qty: number; total: number };

export default function ReportsScreen() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [topItems, setTopItems] = useState<TopItem[]>([]);
  const [dailySeries, setDailySeries] = useState<{ date: Date; revenue: number }[]>([]);
  const [hourlySeries, setHourlySeries] = useState<{ hour: number; revenue: number }[]>([]);

  type FilterType = 'today' | 'week' | 'month' | 'range';
  const [filter, setFilter] = useState<FilterType>('week');
  const [rangeStart, setRangeStart] = useState<string>(''); // YYYY-MM-DD
  const [rangeEnd, setRangeEnd] = useState<string>('');

  const parseISODate = (s: string) => {
    // Simple parser YYYY-MM-DD to local date at 00:00
    const [y, m, d] = s.split('-').map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, (m - 1), d);
  };

  const getRange = () => {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1); // exclusive
    if (filter === 'today') {
      const start = new Date(end); start.setDate(start.getDate() - 1);
      return { start, end };
    }
    if (filter === 'week') {
      const start = new Date(end); start.setDate(start.getDate() - 7);
      return { start, end };
    }
    if (filter === 'month') {
      const start = new Date(end); start.setDate(start.getDate() - 30);
      return { start, end };
    }
    const s = parseISODate(rangeStart);
    const e = parseISODate(rangeEnd);
    if (s && e && e > s) {
      const endExclusive = new Date(e); endExclusive.setDate(endExclusive.getDate() + 1);
      return { start: s, end: endExclusive };
    }
    // Fallback
    const start = new Date(end); start.setDate(start.getDate() - 7);
    return { start, end };
  };

  const load = async () => {
    const db = await DatabaseService.getInstance().getDatabase();
    const { start, end } = getRange();

    const todayRows = await db.getAllAsync<any>(
      'SELECT SUM(COALESCE(totalPrice, total)) as revenue, SUM(quantity) as items FROM sales WHERE saleDate >= ? AND saleDate < ?',
      [new Date(end.getFullYear(), end.getMonth(), end.getDate() - 1).toISOString(), end.toISOString()]
    );
    const rangeRows = await db.getAllAsync<any>(
      'SELECT SUM(COALESCE(totalPrice, total)) as revenue, SUM(quantity) as items FROM sales WHERE saleDate >= ? AND saleDate <= ?',
      [start.toISOString(), end.toISOString()]
    );

    const topRows = await db.getAllAsync<any>(
      `SELECT p.name as name, SUM(s.quantity) as qty, SUM(COALESCE(s.totalPrice, s.total)) as total
       FROM sales s LEFT JOIN products p ON p.id = s.productId
       WHERE s.saleDate >= ? AND s.saleDate <= ?
       GROUP BY p.name
       ORDER BY qty DESC
       LIMIT 5`,
      [start.toISOString(), end.toISOString()]
    );

    setSummary({
      todayRevenue: Number(todayRows?.[0]?.revenue ?? 0),
      todayItems: Number(todayRows?.[0]?.items ?? 0),
      weekRevenue: Number(rangeRows?.[0]?.revenue ?? 0),
      weekItems: Number(rangeRows?.[0]?.items ?? 0),
    });
    setTopItems(topRows.map(r => ({ name: r.name ?? 'Producto', qty: Number(r.qty ?? 0), total: Number(r.total ?? 0) })));

    // Serie diaria del rango
    const rangeSales = await db.getAllAsync<any>(
      'SELECT COALESCE(totalPrice, total) as totalPrice, saleDate FROM sales WHERE saleDate >= ? AND saleDate <= ? ORDER BY saleDate ASC',
      [start.toISOString(), end.toISOString()]
    );
    const days = Math.max(1, Math.ceil((+end - +start) / (1000*60*60*24)));
    const byDay: Record<string, number> = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(start); d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      byDay[key] = 0;
    }
    for (const r of rangeSales) {
      const key = String(r.saleDate).slice(0, 10);
      if (byDay[key] !== undefined) byDay[key] += Number(r.totalPrice || 0);
    }
    setDailySeries(Object.keys(byDay).map(k => ({ date: new Date(k), revenue: Number(byDay[k].toFixed(2)) })));

    // Serie por hora (sumatoria)
    const byHour: number[] = new Array(24).fill(0);
    for (const r of rangeSales) {
      const dt = new Date(r.saleDate);
      const h = dt.getHours();
      byHour[h] += Number(r.totalPrice || 0);
    }
    setHourlySeries(byHour.map((v, h) => ({ hour: h, revenue: Number(v.toFixed(2)) })));
  };

  useEffect(() => { load(); }, []);

  const last7Chart = useMemo(() => dailySeries.map(d => ({ label: `${d.date.getDate()}/${d.date.getMonth()+1}`, value: d.revenue })), [dailySeries]);
  const hourlyChart = useMemo(() => hourlySeries.map(h => ({ label: String(h.hour), value: h.revenue })), [hourlySeries]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Reportes y Estadísticas</Text>

        {/* Filtros */}
        <View style={styles.filtersRow}>
          {(['today','week','month','range'] as const).map(ft => (
            <TouchableOpacity key={ft} style={[styles.filterChip, filter===ft? styles.filterActive: styles.filterInactive]} onPress={() => setFilter(ft)}>
              <Text style={filter===ft? styles.filterTextActive: styles.filterTextInactive}>
                {ft==='today'?'Hoy':ft==='week'?'7 días':ft==='month'?'30 días':'Rango'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {filter==='range' && (
          <View style={styles.rangeRow}>
            <View style={styles.rangeInputBox}>
              <Text style={styles.mutedSmall}>Inicio (YYYY-MM-DD)</Text>
              <TextInput style={styles.rangeInput} value={rangeStart} onChangeText={setRangeStart} placeholder="2025-01-01" placeholderTextColor="#9CA3AF" />
            </View>
            <View style={styles.rangeInputBox}>
              <Text style={styles.mutedSmall}>Fin (YYYY-MM-DD)</Text>
              <TextInput style={styles.rangeInput} value={rangeEnd} onChangeText={setRangeEnd} placeholder="2025-01-31" placeholderTextColor="#9CA3AF" />
            </View>
            <TouchableOpacity style={styles.rangeApplyBtn} onPress={load}><Text style={styles.rangeApplyTxt}>Aplicar</Text></TouchableOpacity>
          </View>
        )}

        <View style={styles.cardRow}>
          <View style={styles.card}> 
            <Text style={styles.muted}>Ventas Hoy</Text>
            <Text style={styles.big}>${(summary?.todayRevenue ?? 0).toFixed(2)}</Text>
            <Text style={styles.mutedSmall}>{summary?.todayItems ?? 0} artículos</Text>
          </View>
          <View style={styles.card}> 
            <Text style={styles.muted}>{filter==='today'?'Hoy': filter==='week'?'Últimos 7 días': filter==='month'?'Últimos 30 días':'Rango'}</Text>
            <Text style={styles.big}>${(summary?.weekRevenue ?? 0).toFixed(2)}</Text>
            <Text style={styles.mutedSmall}>{summary?.weekItems ?? 0} artículos</Text>
          </View>
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.sectionTitle}>Serie diaria</Text>
          <BarChart data={last7Chart} barColor="#7C3AED" />
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.sectionTitle}>Ventas por hora</Text>
          <BarChart data={hourlyChart} barColor="#F59E0B" />
        </View>

        <View style={styles.listCard}>
          <Text style={styles.sectionTitle}>Top productos (7 días)</Text>
          {topItems.length === 0 ? (
            <Text style={styles.muted}>Sin datos</Text>
          ) : (
            topItems.map((it, idx) => (
              <View key={idx} style={styles.rowBetween}>
                <Text style={styles.itemName}>{it.name}</Text>
                <Text style={styles.itemQty}>{it.qty} • ${it.total.toFixed(2)}</Text>
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
  content: { padding: 16 },
  title: { fontSize: 20, fontWeight: '800', color: '#1E293B', marginBottom: 12 },
  filtersRow: { flexDirection: 'row', marginBottom: 8 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, marginRight: 8 },
  filterActive: { backgroundColor: '#1D4ED8' },
  filterInactive: { backgroundColor: '#E5E7EB' },
  filterTextActive: { color: 'white', fontWeight: '700' },
  filterTextInactive: { color: '#111827', fontWeight: '600' },
  rangeRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 8 },
  rangeInputBox: { flex: 1, marginRight: 8 },
  rangeInput: { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB', borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10, color: '#111827' },
  rangeApplyBtn: { backgroundColor: '#10B981', paddingHorizontal: 12, paddingVertical: 12, borderRadius: 10 },
  rangeApplyTxt: { color: 'white', fontWeight: '700' },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  card: { backgroundColor: 'white', borderRadius: 16, padding: 16, flex: 1, borderWidth: 1, borderColor: '#E5E7EB', marginRight: 8 },
  muted: { color: '#6B7280' },
  big: { fontSize: 22, fontWeight: '800', color: '#111827', marginTop: 4 },
  mutedSmall: { color: '#9CA3AF', marginTop: 2 },
  listCard: { backgroundColor: 'white', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  chartCard: { backgroundColor: 'white', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 8 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  itemName: { color: '#111827', fontWeight: '600' },
  itemQty: { color: '#6B7280' },
});
