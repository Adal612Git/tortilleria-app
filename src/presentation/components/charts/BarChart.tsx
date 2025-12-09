import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type Datum = { label: string; value: number };

type Props = {
  data: Datum[];
  height?: number;
  barColor?: string;
};

export default function BarChart({ data, height = 160, barColor = '#2563EB' }: Props) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <View style={[styles.container, { height }]}> 
      {data.map((d, idx) => {
        const h = Math.max(2, Math.round((d.value / max) * (height - 36)));
        return (
          <View key={idx} style={styles.item}>
            <View style={[styles.bar, { height: h, backgroundColor: barColor }]} />
            <Text style={styles.label} numberOfLines={1}>{d.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 8 },
  item: { alignItems: 'center', width: 36 },
  bar: { width: 24, borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  label: { marginTop: 6, fontSize: 10, color: '#6B7280' },
});

