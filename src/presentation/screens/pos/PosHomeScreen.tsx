import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

export default function PosHomeScreen() {
  const nav = useNavigation<any>();

  const actions = [
    { title: 'Nueva Venta', subtitle: 'Punto de venta', icon: 'POS', color: '#2563EB', onPress: () => nav.navigate('Sales') },
    { title: 'Historial', subtitle: 'Ultimas ventas', icon: 'HIST', color: '#7C3AED', onPress: () => nav.navigate('SalesHistory') },
    { title: 'Reportes', subtitle: 'Estadisticas', icon: 'RPTS', color: '#16A34A', onPress: () => nav.navigate('Reports') },
    { title: 'Arqueo de caja', subtitle: 'Control de efectivo', icon: 'CAJA', color: '#EA580C', onPress: () => nav.navigate('CashAudit') },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>POS</Text>
      <View style={styles.grid}>
        {actions.map((a, i) => (
          <TouchableOpacity key={i} style={[styles.card, { backgroundColor: a.color }]} onPress={a.onPress}>
            <Text style={styles.icon} className="dashboard-icon">{a.icon}</Text>
            <View>
              <Text style={styles.cardTitle} className="dashboard-card-title">{a.title}</Text>
              <Text style={styles.cardSubtitle} className="dashboard-card-subtitle">{a.subtitle}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 16 },
  title: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { borderRadius: 16, padding: 18, width: '48%', minWidth: 280, maxWidth: 360, minHeight: 180, maxHeight: 220, justifyContent: 'space-between' },
  icon: { alignSelf: 'flex-start', marginBottom: 12 },
  cardTitle: { color: 'white', fontWeight: '800', fontSize: Platform.OS === 'web' ? undefined : 16 },
  cardSubtitle: { color: 'white', opacity: 0.9, fontSize: Platform.OS === 'web' ? undefined : 13 },
});
