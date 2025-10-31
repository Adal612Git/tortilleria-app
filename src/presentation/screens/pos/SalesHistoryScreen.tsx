import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DatabaseService } from '../../../infrastructure/database/DatabaseService';

type Row = { id: number; name?: string; quantity: number; totalPrice: number; saleDate: string };

export default function SalesHistoryScreen() {
  const [rows, setRows] = useState<Row[]>([]);

  const load = async () => {
    const db = await DatabaseService.getInstance().getDatabase();
    const data = await db.getAllAsync<any>(
      `SELECT s.id as id, p.name as name, s.quantity as quantity, s.totalPrice as totalPrice, s.saleDate as saleDate
       FROM sales s LEFT JOIN products p ON p.id = s.productId
       ORDER BY s.saleDate DESC
       LIMIT 50`
    );
    setRows(data.map((r: any) => ({ id: r.id, name: r.name ?? 'Producto', quantity: r.quantity, totalPrice: r.totalPrice, saleDate: r.saleDate })));
  };

  useEffect(() => { load(); }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Historial de Ventas</Text>
      <FlatList
        data={rows}
        keyExtractor={(i) => String(i.id)}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View>
              <Text style={styles.itemTitle}>{item.name}</Text>
              <Text style={styles.muted}>{new Date(item.saleDate).toLocaleString()}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.qty}>x{item.quantity}</Text>
              <Text style={styles.total}>${item.totalPrice.toFixed(2)}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={[styles.muted, { textAlign: 'center', marginTop: 20 }]}>Sin ventas aún</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  title: { fontSize: 20, fontWeight: '800', color: '#111827', margin: 16 },
  item: { backgroundColor: 'white', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#E5E7EB', flexDirection: 'row', justifyContent: 'space-between' },
  itemTitle: { color: '#111827', fontWeight: '700' },
  muted: { color: '#6B7280' },
  qty: { color: '#111827', fontWeight: '700' },
  total: { color: '#059669', fontWeight: '800' },
});

