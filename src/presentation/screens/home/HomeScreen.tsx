import React from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fefefe' },
  scrollContent: { padding: 16 },
  
  // Header mejorado
  headerContainer: { 
    backgroundColor: '#fffbeb', 
    padding: 20, 
    borderBottomLeftRadius: 24, 
    borderBottomRightRadius: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4
  },
  welcomeTitle: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#92400e', 
    marginBottom: 4,
    textAlign: 'center'
  },
  welcomeSubtitle: { 
    color: '#57534e', 
    fontSize: 16, 
    textAlign: 'center'
  },
  
  // Card de perfil mejorada
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4
  },
  profileTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 12
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  profileText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8
  },
  
  // Estado del sistema
  statusCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#22c55e'
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#166534',
    marginBottom: 4
  },
  statusText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8
  },
  colorPalette: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12
  },
  colorItem: {
    alignItems: 'center'
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginBottom: 4
  },
  colorLabel: {
    fontSize: 12,
    color: '#6b7280'
  },
  
  // Acciones rápidas mejoradas
  actionsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4
  },
  actionsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 16,
    textAlign: 'center'
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12
  },
  
  // Botón cerrar sesión
  logoutButton: {
    backgroundColor: '#fef2f2',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  logoutText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#dc2626'
  },
  
  // Footer mejorado
  footer: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb'
  },
  footerText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 2
  }
});

export default function HomeScreen() {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sí, cerrar sesión', onPress: logout }
      ]
    );
  };

  const getRoleDisplayName = () => {
    switch (user?.role) {
      case 'admin': return 'Administrador Principal';
      case 'empleado': return 'Empleado de Ventas';
      case 'repartidor': return 'Repartidor Express';
      default: return 'Usuario';
    }
  };

  const handleQuickAction = (action: string) => {
    Alert.alert('Próximamente', `${action} en desarrollo`);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.scrollContent}>
        
        {/* Header Mejorado */}
        <View style={styles.headerContainer}>
          <Text style={styles.welcomeTitle}>🌮 ¡Bienvenido, {getRoleDisplayName()}!</Text>
          <Text style={styles.welcomeSubtitle}>
            {user?.role === 'admin' ? 'Control total de tu tortillería' :
             user?.role === 'empleado' ? 'Gestión eficiente de ventas' :
             'Entregas rápidas y seguras'}
          </Text>
        </View>

        {/* Card de Perfil Mejorada */}
        <View style={styles.profileCard}>
          <Text style={styles.profileTitle}>📋 Información de Perfil</Text>
          
          <View style={styles.profileRow}>
            <Text>🧑</Text>
            <Text style={styles.profileText}>Rol: {getRoleDisplayName()}</Text>
          </View>
          
          <View style={styles.profileRow}>
            <Text>📧</Text>
            <Text style={styles.profileText}>Email: {user?.email}</Text>
          </View>
          
          <View style={styles.profileRow}>
            <Text>🕒</Text>
            <Text style={styles.profileText}>Último acceso: {new Date().toLocaleDateString('es-MX')}</Text>
          </View>
        </View>

        {/* Estado del Sistema Mejorado */}
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>✅ HU1.4 Completada</Text>
          <Text style={styles.statusText}>Sistema de estilos configurado correctamente</Text>
          
          <Text style={{ fontSize: 14, color: '#374151', marginTop: 12, marginBottom: 8 }}>
            🎨 Paleta de colores por rol:
          </Text>
          
          <View style={styles.colorPalette}>
            <View style={styles.colorItem}>
              <View style={[styles.colorCircle, { backgroundColor: '#3b82f6' }]} />
              <Text style={styles.colorLabel}>Admin</Text>
            </View>
            <View style={styles.colorItem}>
              <View style={[styles.colorCircle, { backgroundColor: '#10b981' }]} />
              <Text style={styles.colorLabel}>Empleado</Text>
            </View>
            <View style={styles.colorItem}>
              <View style={[styles.colorCircle, { backgroundColor: '#f59e0b' }]} />
              <Text style={styles.colorLabel}>Repartidor</Text>
            </View>
          </View>
        </View>

        {/* Acciones Rápidas Mejoradas */}
        <View style={styles.actionsCard}>
          <Text style={styles.actionsTitle}>🚀 Acciones Rápidas</Text>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#dbeafe' }]}
            onPress={() => handleQuickAction('Ver Productos')}
          >
            <Text>🧺</Text>
            <Text style={[styles.actionText, { color: '#1e40af' }]}>Ver Productos</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#fef3c7' }]}
            onPress={() => handleQuickAction('Gestionar Ventas')}
          >
            <Text>💰</Text>
            <Text style={[styles.actionText, { color: '#92400e' }]}>Gestionar Ventas</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#ffedd5' }]}
            onPress={() => handleQuickAction('Control de Inventario')}
          >
            <Text>📦</Text>
            <Text style={[styles.actionText, { color: '#9a3412' }]}>Control de Inventario</Text>
          </TouchableOpacity>
        </View>

        {/* Botón Cerrar Sesión Mejorado */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>🚪 Cerrar Sesión</Text>
        </TouchableOpacity>

        {/* Footer Mejorado */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>🚀 Tortillería App v1.0</Text>
          <Text style={styles.footerText}>NativeWind • React Native • Clean Architecture</Text>
        </View>
      </View>
    </ScrollView>
  );
}
