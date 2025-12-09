import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const TabletDashboard = () => {
  const metrics = [
    { title: 'Ventas Hoy', value: '₡47,500', icon: '💰', color: '#10B981' },
    { title: 'Productos', value: '24', icon: '📦', color: '#3B82F6' },
    { title: 'Clientes', value: '156', icon: '👥', color: '#8B5CF6' },
    { title: 'Eficiencia', value: '94%', icon: '⚡', color: '#F59E0B' },
  ];

  const quickActions = [
    { title: 'Nueva Venta', icon: '🛒', color: '#EF4444' },
    { title: 'Inventario', icon: '📊', color: '#06B6D4' },
    { title: 'Reportes', icon: '📈', color: '#8B5CF6' },
    { title: 'Clientes', icon: '👥', color: '#F59E0B' },
  ];

  const recentActivity = [
    { id: '00125', customer: 'Juan Pérez', amount: '₡12,500', time: '10:30 AM' },
    { id: '00124', customer: 'María López', amount: '₡8,750', time: '09:45 AM' },
    { id: '00123', customer: 'Carlos Rojas', amount: '₡15,200', time: '09:15 AM' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>¡Buenos días, Admin! 👋</Text>
        <Text style={styles.subtitle}>Resumen de operaciones - Hoy</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Métricas */}
        <View style={styles.metricsSection}>
          <Text style={styles.sectionTitle}>Métricas del Día</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.metricsContainer}>
              {metrics.map((metric, index) => (
                <View key={index} style={[styles.metricCard, { backgroundColor: metric.color }]}>
                  <Text style={styles.metricIcon}>{metric.icon}</Text>
                  <Text style={styles.metricValue}>{metric.value}</Text>
                  <Text style={styles.metricTitle}>{metric.title}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Acciones Rápidas */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity key={index} style={styles.actionCard}>
                <Text style={styles.actionIcon}>{action.icon}</Text>
                <Text style={styles.actionTitle}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Actividad Reciente */}
        <View style={styles.activitySection}>
          <Text style={styles.sectionTitle}>Actividad Reciente</Text>
          <View style={styles.activityList}>
            {recentActivity.map((activity, index) => (
              <View key={index} style={styles.activityItem}>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityId}>Venta #{activity.id}</Text>
                  <Text style={styles.activityCustomer}>{activity.customer}</Text>
                  <Text style={styles.activityTime}>{activity.time}</Text>
                </View>
                <Text style={styles.activityAmount}>{activity.amount}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    padding: 24,
    paddingBottom: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
  },
  scrollView: {
    flex: 1,
  },
  metricsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16,
    marginLeft: 8,
  },
  metricsContainer: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 8,
  },
  metricCard: {
    padding: 20,
    borderRadius: 16,
    width: 160,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  metricIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  metricTitle: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
  },
  actionsSection: {
    padding: 16,
    paddingTop: 0,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  actionCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    width: '48%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 12,
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  activitySection: {
    padding: 16,
    paddingTop: 0,
  },
  activityList: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  activityInfo: {
    flex: 1,
  },
  activityId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  activityCustomer: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  activityTime: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  activityAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
  },
});

export default TabletDashboard;
