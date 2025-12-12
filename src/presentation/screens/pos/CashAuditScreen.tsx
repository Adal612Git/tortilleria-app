import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatCurrency } from '../../utils/currency';
import { useCashAudit } from '../../hooks/useCashAudit';

const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const formatHeaderDate = () => {
  const now = new Date();
  const day = dayNames[now.getDay()] ?? 'Hoy';
  const month = monthNames[now.getMonth()] ?? '';
  return `${day}, ${now.getDate().toString().padStart(2, '0')} ${month}`;
};
const formatAuditDate = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Sin fecha';
  return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')} | ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

export default function CashAuditScreen() {
  const { audits, loading, error, todaySales, recordAudit } = useCashAudit();
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
  const gap = parsedCounted - expected;

  const summary = useMemo(
    () => [
      { label: 'Entradas', value: latestAudit?.entries ?? parsedEntries, accent: '#0EA5E9' },
      { label: 'Salidas', value: latestAudit?.exits ?? parsedExits, accent: '#F97316' },
      { label: 'Ventas', value: latestAudit?.cashSales ?? todaySales, accent: '#10B981' },
      { label: 'Fondo de caja', value: latestAudit?.openingFloat ?? parsedOpening, accent: '#6366F1' },
      {
        label: 'Resultado',
        value: latestAudit?.difference ?? gap,
        accent: (latestAudit?.difference ?? gap) >= 0 ? '#22C55E' : '#EF4444',
      },
    ],
    [latestAudit, todaySales, parsedOpening, parsedEntries, parsedExits, gap]
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
          <View>
            <Text style={styles.title}>Arqueo de caja</Text>
            <Text style={styles.headerDate}>{formatHeaderDate()}</Text>
          </View>
        </View>
        {error && <Text style={styles.error}>{error}</Text>}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.summaryScroll}>
          {summary.map((item) => (
            <View key={item.label} style={[styles.summaryCard, { borderColor: item.accent }]}>
              <Text style={styles.summaryLabel}>{item.label}</Text>
              <Text
                style={[
                  styles.summaryValue,
                  item.label === 'Resultado' ? (item.value < 0 ? styles.dangerText : styles.successText) : null,
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
            <Text style={styles.fieldLabel}>Conteo en caja</Text>
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

          <View style={styles.balanceRow}>
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Balance proyectado</Text>
              <Text style={styles.balanceValue}>{formatCurrency(expected)}</Text>
            </View>
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Conteo final</Text>
              <Text style={[styles.balanceValue, gap < 0 ? styles.dangerText : styles.successText]}>
                {formatCurrency(parsedCounted)}
              </Text>
            </View>
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
            <View style={styles.historyList}>
              {audits.map((audit) => (
                <View key={audit.id} style={styles.auditCard}>
                  <Text style={styles.auditDate}>{formatAuditDate(audit.createdAt)}</Text>
                  <Text style={styles.auditDetail}>Entradas {formatCurrency(audit.entries)}</Text>
                  <Text style={styles.auditDetail}>Salidas {formatCurrency(audit.exits)}</Text>
                  <Text style={styles.auditDetail}>Ventas {formatCurrency(audit.cashSales)}</Text>
                  <Text style={styles.auditDetail}>Fondo {formatCurrency(audit.openingFloat)}</Text>
                  <Text style={[styles.auditResult, audit.difference < 0 ? styles.dangerText : styles.successText]}>
                    Resultado {formatCurrency(audit.difference)}
                  </Text>
                </View>
              ))}
            </View>
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
  title: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  headerDate: { color: '#64748B', fontWeight: '600', marginTop: 2 },
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
  balanceRow: { flexDirection: 'row', marginTop: 16, columnGap: 12 },
  balanceCard: { flex: 1, backgroundColor: '#F8FAFC', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  balanceLabel: { color: '#94A3AF', fontSize: 12 },
  balanceValue: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginTop: 4 },
  submitBtn: { marginTop: 16, backgroundColor: '#0F172A', paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: 'white', fontWeight: '700' },
  historyList: { gap: 12 },
  auditCard: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 16, padding: 16, alignItems: 'center' },
  auditDate: { fontWeight: '700', color: '#0F172A', marginBottom: 6 },
  auditDetail: { color: '#475569', fontSize: 13 },
  auditResult: { marginTop: 8, fontWeight: '700' },
});

