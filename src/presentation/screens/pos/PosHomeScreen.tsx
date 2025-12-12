import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

export default function PosHomeScreen() {
  const nav = useNavigation<any>();
  const { logout } = useAuthStore();

  const actions = [
    { title: 'Nueva venta', subtitle: 'Cobros en caja', icon: 'pricetag-outline', color: '#2563EB', onPress: () => nav.navigate('Sales') },
    { title: 'Historial', subtitle: 'Boletas recientes', icon: 'time-outline', color: '#7C3AED', onPress: () => nav.navigate('SalesHistory') },
    { title: 'Reportes de venta', subtitle: 'Graficas y metricas', icon: 'stats-chart-outline', color: '#16A34A', onPress: () => nav.navigate('Reports') },
    { title: 'Arqueo de caja', subtitle: 'Control de efectivo', icon: 'cash-outline', color: '#EA580C', onPress: () => nav.navigate('CashAudit') },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Punto de venta</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout} accessibilityRole='button'>
          <Ionicons name='log-out-outline' size={18} color='#0F172A' style={{ marginRight: 6 }} />
          <Text style={styles.logoutText}>Cerrar sesion</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.grid}>
        {actions.map((a, i) => (
          <TouchableOpacity key={i} style={[styles.card, { backgroundColor: a.color }]} onPress={a.onPress}>
            <Ionicons name={a.icon as any} size={32} color='white' style={styles.icon} />
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
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  title: { fontSize: 20, fontWeight: '800', color: '#111827' },
  logoutBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: '#CBD5F5' },
  logoutText: { color: '#0F172A', fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { borderRadius: 16, padding: 18, width: '48%', minWidth: 280, maxWidth: 360, minHeight: 180, maxHeight: 220, justifyContent: 'space-between' },
  icon: { alignSelf: 'flex-start', marginBottom: 12 },
  cardTitle: { color: 'white', fontWeight: '800', fontSize: Platform.OS === 'web' ? undefined : 16 },
  cardSubtitle: { color: 'white', opacity: 0.9, fontSize: Platform.OS === 'web' ? undefined : 13 },
});
