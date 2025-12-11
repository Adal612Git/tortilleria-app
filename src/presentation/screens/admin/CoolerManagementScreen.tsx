import React, { useMemo, useState } from 'react';
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
} from 'react-native';
import { useRouteOperations } from '../../hooks/useRouteOperations';
import { CoolerRecord } from '../../../domain/entities/RouteOperations';

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

  const [createVisible, setCreateVisible] = useState(false);
  const [selectedRider, setSelectedRider] = useState<number | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>(undefined);
  const [kilosOut, setKilosOut] = useState(10);
  const [priceInput, setPriceInput] = useState('18.00');

  const [liquidateVisible, setLiquidateVisible] = useState(false);
  const [targetCooler, setTargetCooler] = useState<CoolerRecord | null>(null);
  const [goodReturnInput, setGoodReturnInput] = useState('0');
  const [wasteInput, setWasteInput] = useState('0');
  const [cashInput, setCashInput] = useState('0');

  const openCreation = () => {
    if (!isBoxOpen) {
      Alert.alert('Caja cerrada', 'Abre el dia antes de crear una hielera.');
      return;
    }
    setSelectedRider(null);
    setSelectedProductId(defaultProductId);
    setKilosOut(10);
    setPriceInput('18.00');
    setCreateVisible(true);
  };

  const closeCreation = () => {
    if (!creating) {
      setCreateVisible(false);
    }
  };

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
    const parsedPrice = Number(priceInput.replace(/,/g, '.'));
    if (!parsedPrice || parsedPrice <= 0) {
      Alert.alert('Precio invalido', 'Ingresa un precio de ruta valido.');
      return;
    }
    try {
      await createCooler({
        riderId: selectedRider,
        kilosOut,
        routePrice: parsedPrice,
        inventoryProductId: selectedProductId,
      });
      setCreateVisible(false);
    } catch (err: any) {
      Alert.alert('No se pudo crear la hielera', err?.message ?? 'Intenta de nuevo.');
    }
  };

  const openLiquidation = (cooler: CoolerRecord) => {
    setTargetCooler(cooler);
    setGoodReturnInput('0');
    setWasteInput('0');
    setCashInput((cooler.routePrice * cooler.kilosOut).toFixed(2));
    setLiquidateVisible(true);
  };

  const closeLiquidation = () => {
    if (!liquidating) {
      setLiquidateVisible(false);
      setTargetCooler(null);
    }
  };

  const handleLiquidation = async () => {
    if (!targetCooler) {
      return;
    }
    const goodReturn = Number(goodReturnInput) || 0;
    const coldWaste = Number(wasteInput) || 0;
    const receivedTotal = Number(cashInput.replace(/,/g, '.')) || 0;
    if (goodReturn < 0 || coldWaste < 0) {
      Alert.alert('Valores invalidos', 'Los kilos no pueden ser negativos.');
      return;
    }
    if (goodReturn + coldWaste > targetCooler.kilosOut) {
      Alert.alert('Revision', 'Los kilos sobrantes y merma no pueden exceder la carga inicial.');
      return;
    }
    try {
      await liquidateCooler({
        coolerId: targetCooler.id!,
        goodReturn,
        coldWaste,
        receivedTotal,
      });
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
    const goodReturn = Number(goodReturnInput) || 0;
    const coldWaste = Number(wasteInput) || 0;
    return Math.max(0, targetCooler.kilosOut - (goodReturn + coldWaste));
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
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
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
          ) : canCloseDay ? (
            <TouchableOpacity
              style={[styles.primaryButton, styles.successButton]}
              onPress={handleCloseDay}
              disabled={closingDay}
            >
              {closingDay ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Cerrar dia</Text>
              )}
            </TouchableOpacity>
          ) : null}
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
                  <Text style={styles.metricRiderDetail}>Hieleras: {stat.totalCoolers} ? Vendidos: {stat.kilosSold} kg</Text>
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
      </ScrollView>

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
                  {[10, 5, 1].map((value) => (
                    <TouchableOpacity key={value} style={styles.kilosButton} onPress={() => adjustKilos(value)}>
                      <Text style={styles.kilosButtonText}>+{value}</Text>
                    </TouchableOpacity>
                  ))}
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
                <Text style={styles.modalLabel}>Sobrante bueno (kg)</Text>
                <TextInput
                  value={goodReturnInput}
                  onChangeText={setGoodReturnInput}
                  keyboardType="decimal-pad"
                  style={styles.priceInput}
                />
                <Text style={styles.modalLabel}>Merma / frias (kg)</Text>
                <TextInput
                  value={wasteInput}
                  onChangeText={setWasteInput}
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
                <Text style={styles.modalLabel}>Efectivo recibido</Text>
                <TextInput
                  value={cashInput}
                  onChangeText={setCashInput}
                  keyboardType="decimal-pad"
                  style={styles.priceInput}
                />
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

    </SafeAreaView>
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

const formatMoney = (value: number) => `MX$${Number(value || 0).toFixed(2)}`;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
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
    marginBottom: 16,
  },
  dateBox: {
    flex: 1,
    marginRight: 12,
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
