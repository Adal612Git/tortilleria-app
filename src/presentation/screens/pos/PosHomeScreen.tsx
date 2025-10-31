import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

export default function PosHomeScreen() {
  const nav = useNavigation<any>();

  const actions = [
    { title: 'Nueva Venta', subtitle: 'Punto de venta', icon: '🧾', color: '#2563EB', onPress: () => nav.navigate('Sales') },
    { title: 'Historial', subtitle: 'Últimas ventas', icon: '🕘', color: '#7C3AED', onPress: () => nav.navigate('SalesHistory') },
    { title: 'Reportes', subtitle: 'Estadísticas', icon: '📊', color: '#16A34A', onPress: () => nav.navigate('Reports') },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>POS</Text>
      <View style={styles.grid}>
        {actions.map((a, i) => (
          <TouchableOpacity key={i} style={[styles.card, { backgroundColor: a.color }]} onPress={a.onPress}>
            <Text style={styles.icon}>{a.icon}</Text>
            <View>
              <Text style={styles.cardTitle}>{a.title}</Text>
              <Text style={styles.cardSubtitle}>{a.subtitle}</Text>
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { borderRadius: 16, padding: 16, width: '48%', aspectRatio: 1, justifyContent: 'space-between' },
  icon: { fontSize: 28 },
  cardTitle: { color: 'white', fontWeight: '800', fontSize: 16 },
  cardSubtitle: { color: 'white', opacity: 0.9 },
});

