import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type Datum = { label: string; value: number };

type Props = {
  data: Datum[];
  height?: number;
  barColor?: string;
  valueFormatter?: (value: number) => string;
  maxBarThickness?: number;
  barSpacing?: number;
};

const GRID_STEPS = [0.25, 0.5, 0.75];
const DEFAULT_BAR_THICKNESS = 48;
const DEFAULT_BAR_SPACING = 6;

export default function BarChart({
  data,
  height = 160,
  barColor = '#2563EB',
  valueFormatter,
  maxBarThickness,
  barSpacing,
}: Props) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const resolvedBarWidth = maxBarThickness ?? DEFAULT_BAR_THICKNESS;
  const resolvedSpacing = barSpacing ?? DEFAULT_BAR_SPACING;
  return (
    <View style={[styles.container, { height }]}>
      <View style={styles.grid}>
        {GRID_STEPS.map((step) => (
          <View key={step} style={[styles.gridLine, { top: `${100 - step * 100}%` }]} />
        ))}
        <View style={[styles.gridLine, { top: `${100 - 1 * 100}%`, opacity: 0.4 }]} />
      </View>
      {data.map((d, idx) => {
        const rawHeight = Math.round((d.value / max) * (height - 32));
        const barHeight = Math.max(12, rawHeight);
        const labelValue = valueFormatter ? valueFormatter(d.value) : d.value.toFixed(0);
        return (
          <View
            key={idx}
            style={[
              styles.item,
              { width: resolvedBarWidth },
              idx < data.length - 1 && { marginRight: resolvedSpacing },
            ]}
          >
            <Text style={styles.valueLabel}>{labelValue}</Text>
            <View
              style={[
                styles.bar,
                {
                  height: barHeight,
                  width: resolvedBarWidth,
                  backgroundColor: barColor,
                },
              ]}
            />
            <Text style={styles.label} numberOfLines={1} allowFontScaling={false}>
              {d.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    paddingHorizontal: 8,
    position: 'relative',
  },
  grid: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 4,
    bottom: 0,
    justifyContent: 'flex-end',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#E5E7EB',
    opacity: 0.5,
  },
  item: {
    alignItems: 'center',
  },
  bar: {
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    marginTop: 6,
  },
  label: {
    marginTop: 6,
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
  },
  valueLabel: {
    fontSize: 10,
    color: '#111827',
    fontWeight: '600',
    marginBottom: 4,
  },
});
