import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';

export default function AdminDashboardScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();

  const dashboardCards = [
    {
      title: 'Gestion de Usuarios',
      description: 'Administrar empleados y repartidores',
      icon: 'people-outline',
      screen: 'Users',
      color: 'bg-blue-500'
    },
    {
      title: 'Reportes de Ventas',
      description: 'Ver reportes y estadisticas',
      icon: 'stats-chart-outline',
      screen: 'Reports',
      color: 'bg-green-500'
    },
    {
      title: 'Inventario',
      description: 'Gestionar productos y stock',
      icon: 'cube-outline',
      screen: 'Products',
      color: 'bg-purple-500'
    },
    {
      title: 'Punto de Venta',
      description: 'Nueva venta rapida',
      icon: 'cash-outline',
      screen: 'PosSales',
      color: 'bg-orange-500'
    },
    {
      title: 'Hieleras',
      description: 'Reparto e inventario en ruta',
      icon: 'snow-outline',
      screen: 'CoolerManagement',
      color: 'bg-teal-500'
    },
    {
      title: 'Configuracion',
      description: 'Ajustes del sistema',
      icon: 'settings-outline',
      screen: 'Settings',
      color: 'bg-blue-500'
    },
  ];

  const { logout } = useAuthStore();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Panel Admin</Text>
            <Text style={styles.headerSubtitle}>Bienvenido, {user?.name}</Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.headerButton} accessibilityRole='button'>
            <Ionicons name='log-out-outline' size={18} color='#111827' style={styles.headerButtonIcon} />
            <Text style={styles.headerButtonText}>Salir</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.grid}>
          {dashboardCards.map((card, index) => (
            <View key={index} style={styles.gridItem}>
              <TouchableOpacity
                style={[styles.card, { backgroundColor: mapColor(card.color) }]}
                onPress={() => navigation.navigate(card.screen)}
              >
                <Ionicons name={card.icon as any} size={30} color='white' style={styles.cardIcon} />
                <View>
                  <Text style={styles.cardTitle} className="dashboard-card-title">{card.title}</Text>
                  <Text style={styles.cardDescription} className="dashboard-card-subtitle">{card.description}</Text>
                </View>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Resumen del Sistema</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNumber, { color: '#2563EB' }]}>4</Text>
              <Text style={styles.summaryLabel}>Usuarios</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNumber, { color: '#16A34A' }]}>12</Text>
              <Text style={styles.summaryLabel}>Productos</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNumber, { color: '#7C3AED' }]}>47</Text>
              <Text style={styles.summaryLabel}>Ventas Hoy</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const mapColor = (tw: string) => {
  // Mapea clases de color tailwind usadas originalmente a hex
  switch (tw) {
    case 'bg-blue-500': return '#3B82F6';
    case 'bg-green-500': return '#22C55E';
    case 'bg-purple-500': return '#8B5CF6';
    case 'bg-orange-500': return '#F97316';
    case 'bg-teal-500': return '#14B8A6';
    default: return '#3B82F6';
  }
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#111827' },
  headerSubtitle: { color: '#6B7280', marginTop: 4 },
  headerButton: { backgroundColor: '#F3F4F6', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', flexDirection: 'row', alignItems: 'center' },
  headerButtonIcon: { marginRight: 6 },
  headerButtonText: { color: '#111827', fontWeight: '700' },

  content: { paddingHorizontal: 24, paddingVertical: 24, width: '100%', maxWidth: 1280, alignSelf: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridItem: { width: '48%', paddingHorizontal: 8, marginBottom: 20, minWidth: 280, maxWidth: 360 },
  card: { borderRadius: 18, padding: 18, minHeight: 180, maxHeight: 220, justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 5 },
  cardIcon: { alignSelf: 'flex-start', marginBottom: 12 },
  cardTitle: { color: 'white', fontWeight: '800', marginBottom: 4, fontSize: Platform.OS === 'web' ? undefined : 18 },
  cardDescription: { color: 'white', opacity: 0.9, fontSize: Platform.OS === 'web' ? undefined : 13 },

  summaryCard: { backgroundColor: 'white', borderRadius: 16, padding: 16 },
  summaryTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryItem: { alignItems: 'center' },
  summaryNumber: { fontSize: 22, fontWeight: '800' },
  summaryLabel: { color: '#6B7280', fontSize: 12 },
});

