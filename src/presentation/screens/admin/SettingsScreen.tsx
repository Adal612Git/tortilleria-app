import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { DemoDataService } from '../../../application/services/DemoDataService';
import { DatabaseService } from '../../../infrastructure/database/DatabaseService';

export default function SettingsScreen() {
  const { logout, user } = useAuthStore();
  const [busy, setBusy] = useState(false);

  const seedDemo = async (months: number, wipeFirst = false) => {
    try {
      setBusy(true);
      const db = await DatabaseService.getInstance().getDatabase();
      if (wipeFirst) {
        await db.execAsync('DELETE FROM sales');
      }
      await new DemoDataService().seedDemoSales(months);
      Alert.alert('Demo', 'Ventas demo generadas');
    } catch (e: any) {
      Alert.alert('Demo', e.message ?? 'Error generando demo');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Configuración</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Cuenta</Text>
        <Text style={styles.muted}>Sesión iniciada como</Text>
        <Text style={styles.bold}>{user?.name} • {user?.email}</Text>
        <TouchableOpacity style={[styles.btn, styles.btnDanger]} onPress={logout}>
          <Text style={styles.btnText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Acerca de</Text>
        <Text style={styles.muted}>Tortillería App • v1.0.0</Text>
        <Text style={styles.muted}>Desarrollado con Expo</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Herramientas de demo</Text>
        {busy ? <ActivityIndicator /> : (
          <>
            <View style={styles.row}>
              <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={() => seedDemo(3, false)}>
                <Text style={styles.btnText}>Generar 3 meses</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnPrimary, { marginLeft: 8 }]} onPress={() => seedDemo(1, false)}>
                <Text style={styles.btnText}>Generar 1 mes</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={[styles.btn, styles.btnDanger, { marginTop: 8 }]} onPress={() => Alert.alert('Reiniciar ventas', '¿Borrar ventas y generar 3 meses?', [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Reiniciar', style: 'destructive', onPress: () => seedDemo(3, true) }
            ])}>
              <Text style={styles.btnText}>Reiniciar y generar 3 meses</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 16 },
  title: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 12 },
  card: { backgroundColor: 'white', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 6 },
  muted: { color: '#6B7280' },
  bold: { color: '#111827', fontWeight: '700', marginVertical: 6 },
  btn: { marginTop: 8, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  btnDanger: { backgroundColor: '#DC2626' },
  btnPrimary: { backgroundColor: '#1D4ED8' },
  btnText: { color: 'white', fontWeight: '700' },
  row: { flexDirection: 'row' },
});
