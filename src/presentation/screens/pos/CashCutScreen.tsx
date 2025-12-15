import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatCurrency } from '../../utils/currency';
import { useCashCut } from '../../hooks/useCashCut';
import { openCashCut, useCashCutState } from '../../hooks/useCashCutState';

const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const formatHeaderDate = () => {
  const now = new Date();
  const day = dayNames[now.getDay()] ?? 'Hoy';
  const month = monthNames[now.getMonth()] ?? '';
  return `${day}, ${now.getDate().toString().padStart(2, '0')} ${month}`;
};
const formatCutDate = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Sin fecha';
  return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1)
    .toString()
    .padStart(2, '0')} | ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

export default function CashCutScreen() {
  const { audits, loading, error, todaySales, recordCut } = useCashCut();
  const { state: cutState, refresh: refreshCutState } = useCashCutState();
  const [openingFloatInput, setOpeningFloatInput] = useState('0');
  const [countedCash, setCountedCash] = useState('0');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const latestCut = audits[0];
  const parsedOpening = cutState.isOpen ? cutState.openingFloat : Number(openingFloatInput) || 0;
  const parsedCounted = Number(countedCash) || 0;
  const expected = parsedOpening + todaySales;
  const gap = parsedCounted - expected;

  const summary = useMemo(
    () => [
      { label: 'Monto de inicio', value: latestCut?.openingFloat ?? parsedOpening, accent: '#6366F1' },
      { label: 'Ventas en efectivo', value: latestCut?.cashSales ?? todaySales, accent: '#10B981' },
      { label: 'Total esperado', value: latestCut?.expectedCash ?? expected, accent: '#0EA5E9' },
      {
        label: 'Resultado',
        value: latestCut?.difference ?? gap,
        accent: (latestCut?.difference ?? gap) >= 0 ? '#22C55E' : '#EF4444',
      },
    ],
    [latestCut, todaySales, parsedOpening, expected, gap]
  );

  useEffect(() => {
    if (cutState.isOpen) {
      setOpeningFloatInput(cutState.openingFloat.toString());
    }
  }, [cutState.isOpen, cutState.openingFloat]);

  const handleOpen = async () => {
    const parsed = Number(openingFloatInput) || 0;
    if (parsed <= 0) {
      Alert.alert('Fondo requerido', 'Ingresa un monto de inicio mayor a cero');
      return;
    }
    try {
      await openCashCut(parsed);
      refreshCutState();
      Alert.alert('Caja abierta', 'Ya puedes cobrar operaciones.');
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'No se pudo abrir la caja');
    }
  };

  const handleSubmit = async () => {
    if (!cutState.isOpen) {
      Alert.alert('Caja cerrada', 'Abre la caja antes de confirmar el corte.');
      return;
    }
    try {
      setSubmitting(true);
      await recordCut({
        openingFloat: parsedOpening,
        countedCash: parsedCounted,
        notes,
      });
      setCountedCash('0');
      setNotes('');
      setOpeningFloatInput('0');
      setTimeout(() => refreshCutState(), 250);
      Alert.alert('Corte registrado', 'El corte de caja se guardó correctamente.');
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'No se pudo registrar el corte.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, Platform.OS === 'web' && styles.containerWeb]}>
      <ScrollView
        style={[styles.scroll, Platform.OS === 'web' && styles.scrollWeb]}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Corte de caja</Text>
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
          <Text style={styles.sectionTitle}>{cutState.isOpen ? 'Registrar corte' : 'Abrir caja'}</Text>
          <Text style={styles.muted}>Ventas en efectivo del día: {formatCurrency(todaySales)}</Text>

          {!cutState.isOpen ? (
            <>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Monto de inicio</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={openingFloatInput}
                  onChangeText={setOpeningFloatInput}
                  placeholder="0.00"
                />
              </View>
              <TouchableOpacity style={[styles.submitBtn, submitting && styles.submitBtnDisabled]} onPress={handleOpen}>
                <Text style={styles.submitText}>Abrir caja</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Conteo en caja</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={countedCash}
                  onChangeText={setCountedCash}
                  placeholder="0.00"
                />
              </View>

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Conteo en caja (inicio + ventas)</Text>
                <Text style={styles.resultValue}>{formatCurrency(expected)}</Text>
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

              <TouchableOpacity
                style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Confirmar corte</Text>}
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Historial de cortes</Text>
          {loading ? (
            <ActivityIndicator />
          ) : audits.length === 0 ? (
            <Text style={styles.muted}>Sin registros</Text>
          ) : (
            <View style={styles.historyList}>
              {audits.map((audit) => (
                <View key={audit.id} style={styles.auditCard}>
                  <Text style={styles.auditDate}>{formatCutDate(audit.createdAt)}</Text>
                  <Text style={styles.auditDetail}>Ventas en efectivo: {formatCurrency(audit.cashSales)}</Text>
                  <Text style={styles.auditDetail}>Fondo: {formatCurrency(audit.openingFloat)}</Text>
                  <Text style={styles.auditDetail}>Conteo: {formatCurrency(audit.countedCash)}</Text>
                  <Text style={[styles.auditResult, audit.difference < 0 ? styles.dangerText : styles.successText]}>
                    Resultado {formatCurrency(audit.difference)}
                  </Text>
                  {audit.notes ? <Text style={styles.auditNotes}>{audit.notes}</Text> : null}
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
  scroll: { flex: 1 },
  scrollWeb: { maxHeight: '100vh', overflowY: 'auto' },
  containerWeb: { maxHeight: '100vh' },
  content: { padding: 16, paddingBottom: 32, flexGrow: 1 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  headerDate: { color: '#64748B', fontWeight: '600', marginTop: 2 },
  error: { color: '#DC2626', marginVertical: 8 },
  summaryScroll: { marginVertical: 16 },
  summaryCard: { padding: 12, borderRadius: 14, borderWidth: 1, backgroundColor: 'white', marginRight: 12, minWidth: 150 },
  summaryLabel: { color: '#475569', marginBottom: 6 },
  summaryValue: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  dangerText: { color: '#DC2626' },
  successText: { color: '#059669' },
  section: { backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 18, borderWidth: 1, borderColor: '#E2E8F0' },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  muted: { color: '#94A3AF' },
  fieldGroup: { marginTop: 12 },
  fieldLabel: { color: '#475569', marginBottom: 6, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#CBD5F5', borderRadius: 12, padding: 12, color: '#0F172A', backgroundColor: '#F8FAFC' },
  notesInput: { minHeight: 80, textAlignVertical: 'top' },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  resultLabel: { color: '#475569', fontWeight: '600' },
  resultValue: { fontWeight: '800', fontSize: 20, color: '#0F172A' },
  submitBtn: { marginTop: 16, backgroundColor: '#0F172A', paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: 'white', fontWeight: '700' },
  historyList: { gap: 12 },
  auditCard: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 16, padding: 16, alignItems: 'center' },
  auditDate: { fontWeight: '700', color: '#0F172A', marginBottom: 6 },
  auditDetail: { color: '#475569', fontSize: 13 },
  auditResult: { marginTop: 8, fontWeight: '700' },
  auditNotes: { fontStyle: 'italic', color: '#475569', marginTop: 4 },
});
