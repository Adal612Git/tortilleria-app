import React, { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { useRouteOperations } from '../../hooks/useRouteOperations';
import { CoolerRecord } from '../../../domain/entities/RouteOperations';
import { RouteOperationsRepository } from '@infrastructure/repositories/RouteOperationsRepository';
import { formatCurrency } from '../../utils/currency';
import DateTimePicker from '@react-native-community/datetimepicker';

// Every manual date needs to use Mexico City time so the UI matches the data served to the riders.
const mexicoDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Mexico_City',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const formatMexicoDate = (offset = 0) => {
  const base = new Date();
  base.setDate(base.getDate() + offset);
  return mexicoDateFormatter.format(base);
};

const parseDateInput = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }
  const [year, month, day] = value.split('-').map((part) => Number(part));
  const parsed = new Date(year, month - 1, day);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const buildDateRange = (start: string, end: string) => {
  const dates: string[] = [];
  const startDate = parseDateInput(start);
  const endDate = parseDateInput(end);
  if (!startDate || !endDate) {
    return dates;
  }
  const step = startDate <= endDate ? 1 : -1;
  const cursor = new Date(startDate);
  while ((step > 0 && cursor <= endDate) || (step < 0 && cursor >= endDate)) {
    dates.push(formatDateKey(cursor));
    cursor.setDate(cursor.getDate() + step);
  }
  return step < 0 ? dates.reverse() : dates;
};
export default function CoolerManagementScreen() {
  const {
    selectedDate,
    setSelectedDate,
    routeBox,
    coolers,
    daySummary,
    riderMetrics,
    riders,
    products,
    loading,
    catalogLoading,
    creating,
    liquidating,
    closingDay,
    error,
    refresh,
    openDay,
    closeDay,
    createCooler,
    liquidateCooler,
  } = useRouteOperations();

  const isBoxOpen = !!routeBox?.isOpen;
  const canCloseDay = isBoxOpen && coolers.length > 0 && coolers.every((cooler) => cooler.status === 'liquidada');
  const defaultProductId = useMemo(() => {
    if (!products.length) {
      return undefined;
    }
    const tortilla = products.find((product) => product.category === 'tortilla');
    return (tortilla ?? products[0]).id;
  }, [products]);

  const summary = daySummary ?? { date: selectedDate, totalExpected: 0, kilosSold: 0, settledCoolers: 0 };
  const riderStats = useMemo(() => {
    if (!riderMetrics.length) {
      return [];
    }
    return riderMetrics
      .map((metric) => ({
        ...metric,
        name: riders.find((rider) => rider.id === metric.riderId)?.name ?? `Repartidor #${metric.riderId}`,
      }))
      .sort((a, b) => b.totalCoolers - a.totalCoolers);
  }, [riderMetrics, riders]);

  const historyRepo = useMemo(() => new RouteOperationsRepository(), []);
  const isWeb = Platform.OS === 'web';
  const historyDateInputStyle: React.CSSProperties = {
    borderWidth: 1,
    borderColor: '#CBD5F5',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#F8FAFC',
    color: '#0F172A',
    fontWeight: '600',
    width: '100%',
    boxSizing: 'border-box',
  };
  const [historyStartDate, setHistoryStartDate] = useState<Date>(
    () => parseDateInput(formatMexicoDate(-7)) ?? new Date()
  );
  const [historyEndDate, setHistoryEndDate] = useState<Date>(
    () => parseDateInput(formatMexicoDate(0)) ?? new Date()
  );
  const [historyPicker, setHistoryPicker] = useState<{ field: 'start' | 'end' | null; value: Date }>({
    field: null,
    value: new Date(),
  });
  const [historyRecords, setHistoryRecords] = useState<CoolerRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const [createVisible, setCreateVisible] = useState(false);
  const [selectedRider, setSelectedRider] = useState<number | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>(undefined);
  const [kilosOut, setKilosOut] = useState(10);
  const [priceInput, setPriceInput] = useState('18.00');

  const [liquidateVisible, setLiquidateVisible] = useState(false);
  const [targetCooler, setTargetCooler] = useState<CoolerRecord | null>(null);
  const [wasteInput, setWasteInput] = useState('0');
  const [returnInput, setReturnInput] = useState('0');

  const parseDecimal = (value: string) => Number(value.replace(/,/g, '.')) || 0;

  const jumpToToday = () => setSelectedDate(formatMexicoDate(0));
  const jumpToTomorrow = () => setSelectedDate(formatMexicoDate(1));

  const openCreation = () => {
    if (!isBoxOpen) {
      Alert.alert('Caja cerrada', 'Abre el dia antes de crear una hielera.');
      return;
    }
    const defaultPrice = '18.00';
    setSelectedRider(null);
    setSelectedProductId(defaultProductId);
    setKilosOut(10);
    setPriceInput(defaultPrice);
    setCreateVisible(true);
  };

  const closeCreation = () => {
    if (!creating) {
      setCreateVisible(false);
    }
  };

  const loadHistoryRange = async () => {
    const startValue = formatDateKey(historyStartDate);
    const endValue = formatDateKey(historyEndDate);
    const dates = buildDateRange(startValue, endValue);
    if (!dates.length) {
      setHistoryError('Selecciona fechas validas.');
      setHistoryRecords([]);
      return;
    }
    if (dates.length > 31) {
      setHistoryError('El rango maximo es de 31 dias.');
      setHistoryRecords([]);
      return;
    }
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      // Consultamos directamente al repositorio para no bloquear la UI principal.
      const lists = await Promise.all(dates.map((date) => historyRepo.listCoolers(date)));
      const flattened = lists
        .flat()
        .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : (a.coolerNumber ?? 0) - (b.coolerNumber ?? 0)));
      setHistoryRecords(flattened);
    } catch (err: any) {
      setHistoryError(err?.message ?? 'No se pudo cargar el historial');
      setHistoryRecords([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const openHistoryPicker = (field: 'start' | 'end') => {
    const base = field === 'start' ? historyStartDate : historyEndDate;
    setHistoryPicker({ field, value: base });
  };

  const handleHistoryPickerChange = (_event: any, selectedDate?: Date) => {
    if (!historyPicker.field) {
      setHistoryPicker({ field: null, value: new Date() });
      return;
    }
    if (selectedDate) {
      const normalized = new Date(selectedDate);
      if (historyPicker.field === 'start') {
        setHistoryStartDate(normalized);
        if (normalized > historyEndDate) {
          setHistoryEndDate(normalized);
        }
      } else {
        setHistoryEndDate(normalized);
        if (normalized < historyStartDate) {
          setHistoryStartDate(normalized);
        }
      }
    }
    setHistoryPicker({ field: null, value: new Date() });
  };

  const handleWebHistoryInputChange =
    (field: 'start' | 'end') => (event: ChangeEvent<HTMLInputElement>) => {
      const isoValue = event.target.value;
      const parsed = parseDateInput(isoValue);
      if (!parsed) {
        return;
      }
      if (field === 'start') {
        setHistoryStartDate(parsed);
        if (parsed > historyEndDate) {
          setHistoryEndDate(parsed);
        }
      } else {
        setHistoryEndDate(parsed);
        if (parsed < historyStartDate) {
          setHistoryStartDate(parsed);
        }
      }
    };

  const renderHistoryField = (field: 'start' | 'end') => {
    const dateValue = field === 'start' ? historyStartDate : historyEndDate;
    const label = field === 'start' ? 'Desde' : 'Hasta';
    if (isWeb) {
      return (
        <View key={field} style={styles.historyInputBox}>
          <Text style={styles.label}>{label}</Text>
          <input
            type="date"
            value={formatDateKey(dateValue)}
            max={formatDateKey(new Date())}
            onChange={handleWebHistoryInputChange(field)}
            style={historyDateInputStyle}
          />
        </View>
      );
    }
    return (
      <TouchableOpacity key={field} style={styles.historyInputBox} onPress={() => openHistoryPicker(field)}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.historyInput}>
          <Text style={styles.historyInputValue}>{formatDateKey(dateValue)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  useEffect(() => {
    loadHistoryRange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const adjustKilos = (delta: number) => {
    setKilosOut((prev) => Math.max(1, prev + delta));
  };
  const handleCreate = async () => {
    if (!routeBox?.isOpen) {
      Alert.alert('Caja cerrada', 'Abre el dia antes de asignar producto.');
      return;
    }
    if (!selectedRider) {
      Alert.alert('Informacion insuficiente', 'Selecciona un repartidor.');
      return;
    }
    if (!selectedProductId) {
      Alert.alert('Inventario', 'Selecciona un producto para descontar del inventario.');
      return;
    }
    const parsedPrice = parseDecimal(priceInput);
    if (!parsedPrice || parsedPrice <= 0) {
      Alert.alert('Precio invalido', 'Ingresa un precio de ruta valido.');
      return;
    }
    try {
      await createCooler({
        riderId: selectedRider,
        kilosOut,
        routePrice: parsedPrice,
        initialCash: Number((parsedPrice * kilosOut).toFixed(2)),
        inventoryProductId: selectedProductId,
      });
      Alert.alert('Hielera creada', 'Se registro la hielera correctamente.');
      setCreateVisible(false);
    } catch (err: any) {
      Alert.alert('No se pudo crear la hielera', err?.message ?? 'Intenta de nuevo.');
    }
  };

  const openLiquidation = (cooler: CoolerRecord) => {
    setTargetCooler(cooler);
    setWasteInput('0');
    setReturnInput('0');
    setLiquidateVisible(true);
  };

  const closeLiquidation = () => {
    if (!liquidating) {
      setLiquidateVisible(false);
      setTargetCooler(null);
      setReturnInput('0');
    }
  };

  const handleLiquidation = async () => {
    if (!targetCooler) {
      return;
    }
    const coldWaste = parseDecimal(wasteInput);
    const returnedKilos = parseDecimal(returnInput);
    if (coldWaste < 0 || returnedKilos < 0) {
      Alert.alert('Valores invalidos', 'Los kilos no pueden ser negativos.');
      return;
    }
    if (coldWaste + returnedKilos > targetCooler.kilosOut) {
      Alert.alert('Revision', 'La merma no puede exceder la carga inicial.');
      return;
    }
    // Calculamos el efectivo que el repartidor debe entregar tras descontar la merma y los kilos devueltos.
    const computedReceived = Number(expectedCash().toFixed(2));
    try {
      await liquidateCooler({
        coolerId: targetCooler.id!,
        goodReturn: returnedKilos,
        coldWaste,
        receivedTotal: computedReceived,
      });
      Alert.alert('Liquidacion registrada', 'La hielera fue liquidada.');
      setLiquidateVisible(false);
      setTargetCooler(null);
    } catch (err: any) {
      Alert.alert('No se pudo liquidar', err?.message ?? 'Intenta de nuevo.');
    }
  };

  const computedKilosSold = () => {
    if (!targetCooler) {
      return 0;
    }
    const coldWaste = parseDecimal(wasteInput);
    const returnedKilos = parseDecimal(returnInput);
    return Math.max(0, targetCooler.kilosOut - coldWaste - returnedKilos);
  };

  const expectedCash = () => {
    if (!targetCooler) {
      return 0;
    }
    return computedKilosSold() * targetCooler.routePrice;
  };

  const handleCloseDay = async () => {
    try {
      await closeDay();
    } catch (err: any) {
      Alert.alert('No se pudo cerrar el dia', err?.message ?? 'Revisa las hieleras pendientes.');
    }
  };
  return (
    <>
      <SafeAreaView style={[styles.container, isWeb && styles.containerWeb]} edges={['top', 'left', 'right']}>
        <ScrollView
        style={[styles.scroll, isWeb && styles.scrollWeb]}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerCard}>
          <View>
            <Text style={styles.heroTitle}>Gestion de Hieleras</Text>
            <Text style={styles.heroSubtitle}>
              Administra la caja de ruta, las cargas y las liquidaciones.
            </Text>
          </View>
        </View>

        <View style={styles.controlsRow}>
          <View style={styles.dateBox}>
            <Text style={styles.label}>Dia</Text>
            <TextInput
              value={selectedDate}
              onChangeText={setSelectedDate}
              placeholder="2025-12-10"
              placeholderTextColor="#94A3B8"
              style={styles.dateInput}
            />
          </View>
          <View style={styles.dateShortcuts}>
            <TouchableOpacity style={styles.shortcutButton} onPress={jumpToToday}>
              <Text style={styles.shortcutText}>Hoy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shortcutButton} onPress={jumpToTomorrow}>
              <Text style={styles.shortcutText}>Manana</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.secondaryButton} onPress={refresh}>
            <Text style={styles.secondaryButtonText}>Actualizar</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator size="small" color="#0F172A" />
            <Text style={styles.loaderText}>Cargando modulo...</Text>
          </View>
        ) : null}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.statusCard}>
          <Text style={styles.sectionTitle}>Caja de ruta</Text>
          <Text style={isBoxOpen ? styles.badgeOpen : styles.badgeClosed}>
            {isBoxOpen ? 'Dia abierto' : 'Cerrado'}
          </Text>
          <View style={styles.metricsRow}>
            <View style={styles.metricBox}>
              <Text style={styles.metricValue}>{routeBox?.totalSold ?? 0} kg</Text>
              <Text style={styles.metricLabel}>Venta neta</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricValue}>{routeBox?.totalWaste ?? 0} kg</Text>
              <Text style={styles.metricLabel}>Merma acumulada</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricValue}>{routeBox?.ridersInRoute ?? 0}</Text>
              <Text style={styles.metricLabel}>Repartidores</Text>
            </View>
          </View>
          {!isBoxOpen ? (
            <TouchableOpacity style={styles.primaryButton} onPress={openDay}>
              <Text style={styles.primaryButtonText}>Abrir dia</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.primaryButton, canCloseDay ? styles.successButton : styles.disabledButton]}
                onPress={handleCloseDay}
                disabled={!canCloseDay || closingDay}
              >
                {closingDay ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    {canCloseDay ? 'Cerrar ruta' : 'Liquida las hieleras para cerrar'}
                  </Text>
                )}
              </TouchableOpacity>
              {!canCloseDay && (
                <Text style={styles.hintText}>Liquida todas las hieleras para cerrar la ruta.</Text>
              )}
            </>
          )}
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.listHeader}>
            <Text style={styles.sectionTitle}>Resumen del dia</Text>
            <Text style={styles.sectionSubtitle}>{summary.settledCoolers} liquidadas</Text>
          </View>
          <View style={styles.summaryMetricsRow}>
            <View style={styles.summaryMetric}>
              <Text style={styles.metricLabel}>Total vendido</Text>
              <Text style={styles.summaryMoney}>{formatMoney(summary.totalExpected)}</Text>
            </View>
            <View style={styles.summaryMetric}>
              <Text style={styles.metricLabel}>Kilos netos</Text>
              <Text style={styles.summaryStatValue}>{summary.kilosSold} kg</Text>
            </View>
            <View style={styles.summaryMetric}>
              <Text style={styles.metricLabel}>Hieleras liquidadas</Text>
              <Text style={styles.summaryStatValue}>{summary.settledCoolers}</Text>
            </View>
          </View>
        </View>

        <View style={styles.listCard}>
          <View style={styles.listHeader}>
            <Text style={styles.sectionTitle}>Hieleras del dia</Text>
            <Text style={styles.sectionSubtitle}>{coolers.length} en total</Text>
          </View>
          {isBoxOpen ? (
            <TouchableOpacity style={styles.addButton} onPress={openCreation}>
              <Text style={styles.addButtonText}>+ Nueva hielera</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.hintText}>Abre el dia para comenzar a asignar hieleras.</Text>
          )}

          {coolers.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Sin hieleras registradas</Text>
              <Text style={styles.emptySubtitle}>Cuando crees la primera, aparecera aqui.</Text>
            </View>
          ) : (
            coolers.map((cooler) => (
              <View
                key={cooler.id ?? `${cooler.coolerNumber}-${cooler.riderId}`}
                style={styles.coolerRow}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.coolerTitle}>Hielera #{cooler.coolerNumber}</Text>
                  <Text style={styles.coolerMeta}>Repartidor #{cooler.riderId}</Text>
                  <Text style={styles.coolerMeta}>
                    {cooler.kilosOut} kg | {formatMoney(cooler.routePrice)} / kg
                  </Text>
                  <Text style={styles.coolerMeta}>Efectivo asignado: {formatMoney(cooler.initialCash)}</Text>
                </View>
                <View style={styles.rowActions}>
                  <Text style={[styles.statusPill, statusToStyle(cooler.status)]}>{formatStatus(cooler.status)}</Text>
                  {cooler.status !== 'liquidada' && (
                    <TouchableOpacity style={styles.liquidateButton} onPress={() => openLiquidation(cooler)}>
                      <Text style={styles.liquidateButtonText}>Liquidar</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.metricsCard}>
          <View style={styles.listHeader}>
            <Text style={styles.sectionTitle}>Metricas por repartidor</Text>
            <Text style={styles.sectionSubtitle}>{riderStats.length} con actividad</Text>
          </View>
          {riderStats.length === 0 ? (
            <Text style={styles.hintText}>Aun no hay liquidaciones registradas en esta fecha.</Text>
          ) : (
            riderStats.map((stat) => (
              <View key={`metric-${stat.riderId}`} style={styles.metricsRowCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.metricRiderName}>{stat.name}</Text>
                  <Text style={styles.metricRiderDetail}>Hieleras: {stat.totalCoolers} | Vendidos: {stat.kilosSold} kg</Text>
                </View>
                <View style={styles.metricStatsRow}>
                  <Text style={styles.metricDetail}>Venta {formatMoney(stat.totalExpected)}</Text>
                  <Text style={styles.metricDetail}>Faltante prom. {formatMoney(stat.averageShortage)}</Text>
                  <Text style={styles.metricDetail}>{stat.onTargetPercentage.toFixed(0)}% cuadrado</Text>
                </View>
              </View>
            ))
          )}
        </View>
        <View style={styles.historyCard}>
          <View style={styles.listHeader}>
            <Text style={styles.sectionTitle}>Historial por rango</Text>
            <Text style={styles.sectionSubtitle}>Consulta fechas anteriores</Text>
          </View>
          <View style={styles.historyFilters}>
            {renderHistoryField('start')}
            {renderHistoryField('end')}
            <TouchableOpacity
              style={[styles.historyButton, historyLoading ? styles.disabledButton : null]}
              onPress={loadHistoryRange}
              disabled={historyLoading}
            >
              {historyLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.historyButtonText}>Consultar</Text>
              )}
            </TouchableOpacity>
          </View>
          {!isWeb && historyPicker.field && (
            <DateTimePicker
              value={historyPicker.value}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
              onChange={handleHistoryPickerChange}
              maximumDate={new Date()}
            />
          )}
          {historyError ? <Text style={styles.errorText}>{historyError}</Text> : null}
          <View style={styles.historyList}>
            {historyRecords.length === 0 ? (
              <Text style={styles.historyEmpty}>No hay movimientos en el rango seleccionado.</Text>
            ) : (
              historyRecords.map((record, index) => (
                <View key={record.id ?? `${record.date}-${record.coolerNumber}-${record.riderId}`}>
                  <View style={styles.historyRecord}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.historyRecordTitle}>
                        {record.date} | Hielera #{record.coolerNumber}
                      </Text>
                      <Text style={styles.historyRecordMeta}>
                        Repartidor #{record.riderId} | {record.kilosOut} kg cargados
                      </Text>
                      <Text style={styles.historyRecordMeta}>
                        Efectivo asignado {formatMoney(record.initialCash)} | Liquidacion {formatMoney(record.receivedTotal || record.initialCash)}
                      </Text>
                    </View>
                    <View style={styles.historyStatusBox}>
                      <Text style={[styles.statusPill, statusToStyle(record.status)]}>{formatStatus(record.status)}</Text>
                    </View>
                  </View>
                  {index < historyRecords.length - 1 ? <View style={styles.historyDivider} /> : null}
                </View>
              ))
            )}
          </View>
        </View>
        </ScrollView>
      </SafeAreaView>

      <Modal visible={createVisible} transparent animationType="slide" onRequestClose={closeCreation}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Nueva hielera</Text>
            {catalogLoading ? (
              <View style={styles.loaderBox}>
                <ActivityIndicator size="small" color="#0F172A" />
                <Text style={styles.loaderText}>Cargando catalogos...</Text>
              </View>
            ) : (
              <>
                <Text style={styles.modalLabel}>1. Selecciona repartidor</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.riderRow}>
                  {riders.map((rider) => (
                    <TouchableOpacity
                      key={rider.id}
                      style={[
                        styles.riderChip,
                        selectedRider === rider.id ? styles.riderChipActive : null,
                      ]}
                      onPress={() => setSelectedRider(rider.id!)}
                    >
                      <Text
                        style={[
                          styles.riderChipText,
                          selectedRider === rider.id ? styles.riderChipTextActive : null,
                        ]}
                      >
                        {rider.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  {riders.length === 0 ? (
                    <Text style={styles.emptySubtitle}>Registra repartidores en gestion de usuarios.</Text>
                  ) : null}
                </ScrollView>

                <Text style={styles.modalLabel}>2. Kilos para ruta</Text>
                <View style={styles.kilosRow}>
                  {[10, 5, 1, 0.5].map((value) => (
                    <TouchableOpacity key={`inc-${value}`} style={styles.kilosButton} onPress={() => adjustKilos(value)}>
                      <Text style={styles.kilosButtonText}>+{value}</Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity style={styles.kilosButton} onPress={() => adjustKilos(-0.5)}>
                    <Text style={styles.kilosButtonText}>-0.5</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.kilosButton} onPress={() => adjustKilos(-1)}>
                    <Text style={styles.kilosButtonText}>-1</Text>
                  </TouchableOpacity>
                  <Text style={styles.kilosValue}>{kilosOut} kg</Text>
                </View>

                <Text style={styles.modalLabel}>Precio de ruta (MX$)</Text>
                <TextInput
                  value={priceInput}
                  onChangeText={setPriceInput}
                  keyboardType="decimal-pad"
                  style={styles.priceInput}
                />

                <Text style={styles.modalLabel}>Producto (inventario)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.productRow}>
                  {products.map((product) => (
                    <TouchableOpacity
                      key={product.id}
                      style={[
                        styles.productChip,
                        selectedProductId === product.id ? styles.productChipActive : null,
                      ]}
                      onPress={() => setSelectedProductId(product.id)}
                    >
                      <Text
                        style={[
                          styles.productChipText,
                          selectedProductId === product.id ? styles.productChipTextActive : null,
                        ]}
                      >
                        {product.name} ({product.stock} {product.unit})
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalButton, styles.modalCancel]} onPress={closeCreation}>
                <Text style={[styles.modalButtonText, styles.modalButtonTextDark]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalPrimary]}
                onPress={handleCreate}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={[styles.modalButtonText, styles.modalButtonTextLight]}>Guardar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={liquidateVisible} transparent animationType="slide" onRequestClose={closeLiquidation}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Liquidar hielera</Text>
            {targetCooler ? (
              <>
                <Text style={styles.modalSummary}>Carga inicial: {targetCooler.kilosOut} kg</Text>
                <Text style={styles.modalLabel}>Merma / frias (kg)</Text>
                <TextInput
                  value={wasteInput}
                  onChangeText={setWasteInput}
                  keyboardType="decimal-pad"
                  style={styles.priceInput}
                />
                <Text style={styles.modalLabel}>Kilos devueltos (kg)</Text>
                <TextInput
                  value={returnInput}
                  onChangeText={setReturnInput}
                  keyboardType="decimal-pad"
                  style={styles.priceInput}
                />
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryText}>Total vendido</Text>
                  <Text style={styles.summaryValue}>{computedKilosSold()} kg</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryText}>Debe entregar</Text>
                  <Text style={styles.summaryValue}>{formatMoney(expectedCash())}</Text>
                </View>
                <Text style={styles.modalSummary}>Efectivo asignado: {formatMoney(targetCooler.initialCash)}</Text>
              </>
            ) : null}
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalButton, styles.modalCancel]} onPress={closeLiquidation}>
                <Text style={[styles.modalButtonText, styles.modalButtonTextDark]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalPrimary]}
                onPress={handleLiquidation}
                disabled={liquidating}
              >
                {liquidating ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={[styles.modalButtonText, styles.modalButtonTextLight]}>Liquidar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
const formatStatus = (status: string) => {
  switch (status) {
    case 'pendiente_liquidar':
      return 'Pendiente';
    case 'liquidada':
      return 'Liquidada';
    default:
      return 'En ruta';
  }
};

const statusToStyle = (status: string) => {
  switch (status) {
    case 'pendiente_liquidar':
      return { backgroundColor: '#FBBF24', color: '#92400E' };
    case 'liquidada':
      return { backgroundColor: '#DCFCE7', color: '#065F46' };
    default:
      return { backgroundColor: '#DBEAFE', color: '#1E3A8A' };
  }
};

const formatMoney = (value: number) => formatCurrency(value || 0);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  containerWeb: {
    maxHeight: '100vh',
  },
  scrollWeb: {
    maxHeight: '100vh',
    overflowY: 'auto',
  },
  scroll: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 120,
  },
  headerCard: {
    backgroundColor: '#0F172A',
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: 'white',
  },
  heroSubtitle: {
    color: '#CBD5F5',
    marginTop: 6,
    fontSize: 14,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  dateBox: {
    flex: 1,
    minWidth: 220,
    marginRight: 12,
    marginBottom: 12,
  },
  dateShortcuts: {
    flexDirection: 'column',
    marginRight: 12,
    marginBottom: 12,
    flexShrink: 0,
  },
  shortcutButton: {
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  shortcutText: {
    fontWeight: '700',
    color: '#0F172A',
  },
  label: {
    color: '#475569',
    marginBottom: 6,
    fontWeight: '600',
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#CBD5F5',
    borderRadius: 12,
    padding: 12,
    backgroundColor: 'white',
    color: '#0F172A',
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginBottom: 12,
  },
  secondaryButtonText: {
    color: '#0F172A',
    fontWeight: '700',
  },
  loaderBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  loaderText: {
    color: '#475569',
    marginLeft: 8,
  },
  errorText: {
    color: '#DC2626',
    marginBottom: 12,
  },
  statusCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 16,
  },
  summaryMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  summaryMetric: {
    flex: 1,
    marginRight: 12,
    marginBottom: 8,
  },
  summaryMoney: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  summaryStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  sectionSubtitle: {
    color: '#64748B',
  },
  badgeOpen: {
    alignSelf: 'flex-start',
    backgroundColor: '#DCFCE7',
    color: '#15803D',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    fontWeight: '700',
    marginBottom: 12,
  },
  badgeClosed: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFE4E6',
    color: '#BE123C',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    fontWeight: '700',
    marginBottom: 12,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metricBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginRight: 8,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  metricLabel: {
    color: '#94A3AF',
    marginTop: 2,
  },
  primaryButton: {
    backgroundColor: '#1D4ED8',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  successButton: {
    backgroundColor: '#059669',
  },
  disabledButton: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: 'white',
    fontWeight: '700',
  },
  listCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
  },
  metricsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginTop: 16,
  },
  metricsRowCard: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  metricRiderName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  metricRiderDetail: {
    color: '#64748B',
    marginTop: 2,
  },
  metricStatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  metricDetail: {
    marginRight: 12,
    color: '#0F172A',
    fontWeight: '600',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addButton: {
    backgroundColor: '#0F172A',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '700',
  },
  hintText: {
    color: '#94A3AF',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  emptyState: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyTitle: {
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  emptySubtitle: {
    color: '#94A3AF',
  },
  coolerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  coolerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  coolerMeta: {
    color: '#64748B',
    fontSize: 12,
  },
  rowActions: {
    alignItems: 'flex-end',
  },
  liquidateButton: {
    marginTop: 8,
    backgroundColor: '#1D4ED8',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  liquidateButtonText: {
    color: 'white',
    fontWeight: '700',
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    fontWeight: '700',
    textAlign: 'center',
    minWidth: 90,
  },
  historyCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginTop: 16,
  },
  historyFilters: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  historyInputBox: {
    flex: 1,
    marginRight: 12,
  },
  historyInput: {
    borderWidth: 1,
    borderColor: '#CBD5F5',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#F8FAFC',
  },
  historyInputValue: {
    color: '#0F172A',
    fontWeight: '600',
  },
  historyButton: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 18,
    minWidth: 120,
    alignItems: 'center',
  },
  historyButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  historyList: {
    marginTop: 8,
  },
  historyRecord: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  historyRecordTitle: {
    fontWeight: '700',
    color: '#0F172A',
  },
  historyRecordMeta: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },
  historyStatusBox: {
    marginLeft: 12,
  },
  historyDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  historyEmpty: {
    color: '#94A3AF',
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  modalLabel: {
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 12,
    marginBottom: 6,
  },
  modalSummary: {
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  summaryText: {
    color: '#475569',
    fontWeight: '600',
  },
  summaryValue: {
    color: '#0F172A',
    fontWeight: '800',
  },
  riderRow: {
    marginBottom: 8,
  },
  riderChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
  },
  riderChipActive: {
    backgroundColor: '#1D4ED8',
    borderColor: '#1D4ED8',
  },
  riderChipText: {
    color: '#0F172A',
    fontWeight: '600',
  },
  riderChipTextActive: {
    color: 'white',
  },
  kilosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  kilosButton: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginRight: 8,
    marginBottom: 8,
  },
  kilosButtonText: {
    fontWeight: '700',
    color: '#0F172A',
  },
  kilosValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  priceInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    color: '#0F172A',
  },
  productRow: {
    marginBottom: 8,
  },
  productChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
    marginBottom: 8,
  },
  productChipActive: {
    backgroundColor: '#10B981',
    borderColor: '#0F9C68',
  },
  productChipText: {
    color: '#0F172A',
    fontWeight: '600',
  },
  productChipTextActive: {
    color: 'white',
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 12,
  },
  modalButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  modalCancel: {
    backgroundColor: '#E2E8F0',
  },
  modalPrimary: {
    backgroundColor: '#1D4ED8',
  },
  modalButtonText: {
    fontWeight: '700',
    fontSize: 15,
  },
  modalButtonTextDark: {
    color: '#0F172A',
  },
  modalButtonTextLight: {
    color: '#FFFFFF',
  },
});
