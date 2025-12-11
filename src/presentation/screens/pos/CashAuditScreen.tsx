import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCashAudit } from '../../hooks/useCashAudit';

const formatCurrency = (value: number) => `MX$${value.toFixed(2)}`;

export default function CashAuditScreen() {
  const { audits, loading, error, todaySales, recordAudit, refresh } = useCashAudit();
  const [openingFloat, setOpeningFloat] = useState('0');
  const [entries, setEntries] = useState('0');
  const [exits, setExits] = useState('0');
  const [countedCash, setCountedCash] = useState('0');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const latestAudit = audits[0];

  const parsedOpening = parseFloat(openingFloat) || 0;
  const parsedEntries = parseFloat(entries) || 0;
  const parsedExits = parseFloat(exits) || 0;
  const parsedCounted = parseFloat(countedCash) || 0;
  const expected = parsedOpening + parsedEntries + todaySales - parsedExits;
  const difference = parsedCounted - expected;

  const summary = useMemo(
    () => [
      { label: 'Entradas', value: latestAudit?.entries ?? parsedEntries, accent: '#0EA5E9' },
      { label: 'Salidas', value: latestAudit?.exits ?? parsedExits, accent: '#F97316' },
      { label: 'Ventas', value: latestAudit?.cashSales ?? todaySales, accent: '#10B981' },
      { label: 'Fondo de caja', value: latestAudit?.openingFloat ?? parsedOpening, accent: '#6366F1' },
      {
        label: 'Diferencia',
        value: latestAudit?.difference ?? difference,
        accent: (latestAudit?.difference ?? difference) >= 0 ? '#22C55E' : '#EF4444',
      },
    ],
    [latestAudit, todaySales, parsedOpening, parsedEntries, parsedExits, difference]
  );

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      await recordAudit({
        openingFloat: parsedOpening,
        entries: parsedEntries,
        exits: parsedExits,
        countedCash: parsedCounted,
        notes,
      });
      setOpeningFloat('0');
      setEntries('0');
      setExits('0');
      setCountedCash('0');
      setNotes('');
      Alert.alert('Arqueo registrado', 'La informacion se guardo correctamente.');
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'No se pudo registrar el arqueo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Arqueo de caja</Text>
          <TouchableOpacity onPress={refresh} style={styles.refreshBtn}>
            <Text style={styles.refreshText}>Actualizar</Text>
          </TouchableOpacity>
        </View>
        {error && <Text style={styles.error}>{error}</Text>}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.summaryScroll}>
          {summary.map((item) => (
            <View key={item.label} style={[styles.summaryCard, { borderColor: item.accent }]}>
              <Text style={styles.summaryLabel}>{item.label}</Text>
              <Text
                style={[
                  styles.summaryValue,
                  item.label === 'Diferencia' ? (item.value < 0 ? styles.dangerText : styles.successText) : null,
                ]}
              >
                {formatCurrency(item.value)}
              </Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Registrar nuevo arqueo</Text>
          <Text style={styles.muted}>Ventas registradas hoy: {formatCurrency(todaySales)}</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Fondo de caja</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={openingFloat} onChangeText={setOpeningFloat} />
          </View>

          <View style={styles.rowFields}>
            <View style={styles.fieldGroupHalf}>
              <Text style={styles.fieldLabel}>Entradas</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={entries} onChangeText={setEntries} />
            </View>
            <View style={styles.fieldGroupHalf}>
              <Text style={styles.fieldLabel}>Salidas</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={exits} onChangeText={setExits} />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Efectivo contado</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={countedCash} onChangeText={setCountedCash} />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Notas</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Observaciones"
              multiline
            />
          </View>

          <View style={styles.rowBetween}>
            <Text style={styles.muted}>Efectivo esperado</Text>
            <Text style={styles.boldText}>{formatCurrency(expected)}</Text>
          </View>
          <View style={styles.rowBetween}>
            <Text style={styles.muted}>Diferencia</Text>
            <Text style={[styles.boldText, difference < 0 ? styles.dangerText : styles.successText]}>
              {formatCurrency(difference)}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Guardar arqueo</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Historial</Text>
          {loading ? (
            <ActivityIndicator />
          ) : audits.length === 0 ? (
            <Text style={styles.muted}>Sin registros</Text>
          ) : (
            audits.map((audit) => (
              <View key={audit.id} style={styles.auditRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{new Date(audit.createdAt).toLocaleString()}</Text>
                  <Text style={styles.mutedSmall}>
                    Entradas {formatCurrency(audit.entries)} - Salidas {formatCurrency(audit.exits)}
                  </Text>
                  <Text style={styles.mutedSmall}>
                    Ventas {formatCurrency(audit.cashSales)} - Fondo {formatCurrency(audit.openingFloat)}
                  </Text>
                </View>
                <View>
                  <Text style={[styles.boldText, audit.difference < 0 ? styles.dangerText : styles.successText]}>
                    {formatCurrency(audit.difference)}
                  </Text>
                  <Text style={styles.auditMini}>Contado {formatCurrency(audit.countedCash)}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, paddingBottom: 32 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  refreshBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: '#E2E8F0' },
  refreshText: { fontWeight: '700', color: '#0F172A' },
  error: { color: '#DC2626', marginVertical: 8 },
  summaryScroll: { marginVertical: 16 },
  summaryCard: { padding: 12, borderRadius: 14, borderWidth: 1, backgroundColor: 'white', marginRight: 12, minWidth: 140 },
  summaryLabel: { color: '#475569', marginBottom: 6 },
  summaryValue: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  dangerText: { color: '#DC2626' },
  successText: { color: '#059669' },
  section: { backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 18, borderWidth: 1, borderColor: '#E2E8F0' },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  muted: { color: '#94A3AF' },
  fieldGroup: { marginTop: 12 },
  fieldGroupHalf: { flex: 1 },
  rowFields: { flexDirection: 'row', columnGap: 12, marginTop: 12 },
  fieldLabel: { color: '#475569', marginBottom: 6, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#CBD5F5', borderRadius: 12, padding: 12, color: '#0F172A', backgroundColor: '#F8FAFC' },
  notesInput: { minHeight: 80, textAlignVertical: 'top' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  boldText: { fontWeight: '700', color: '#0F172A' },
  submitBtn: { marginTop: 16, backgroundColor: '#0F172A', paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: 'white', fontWeight: '700' },
  auditRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  mutedSmall: { color: '#94A3AF', fontSize: 12 },
  auditMini: { color: '#475569', fontSize: 12, marginTop: 2 },
  itemName: { color: '#0F172A', fontWeight: '600' },
});
