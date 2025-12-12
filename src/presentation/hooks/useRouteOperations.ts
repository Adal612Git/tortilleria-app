import { useCallback, useEffect, useMemo, useState } from 'react';
import { RouteOperationsRepository } from '../../infrastructure/repositories/RouteOperationsRepository';
import { RouteBox, CoolerRecord, RouteDaySummary, RiderMetrics } from '../../domain/entities/RouteOperations';
import { User } from '../../domain/entities/User';
import { Product } from '../../domain/entities/Product';
import { UserRepository } from '../../infrastructure/repositories/UserRepository';
import { ProductRepositoryImpl } from '../../infrastructure/repositories/ProductRepositoryImpl';

const mexicoCityFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Mexico_City',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const getMexicoDateKey = (offsetDays = 0) => {
  const base = new Date();
  base.setDate(base.getDate() + offsetDays);
  return mexicoCityFormatter.format(base);
};

const todayKey = () => getMexicoDateKey();

const sanitizeDateInput = (value: string) => {
  const cleaned = value.replace(/[^0-9-]/g, '').slice(0, 10);
  return cleaned;
};

export const useRouteOperations = () => {
  const repository = useMemo(() => new RouteOperationsRepository(), []);
  const userRepository = useMemo(() => new UserRepository(), []);
  const productRepository = useMemo(() => new ProductRepositoryImpl(), []);

  const [selectedDate, setSelectedDate] = useState<string>(todayKey());
  const [routeBox, setRouteBox] = useState<RouteBox | null>(null);
  const [coolers, setCoolers] = useState<CoolerRecord[]>([]);
  const [daySummary, setDaySummary] = useState<RouteDaySummary | null>(null);
  const [riderMetrics, setRiderMetrics] = useState<RiderMetrics[]>([]);
  const [riders, setRiders] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [liquidating, setLiquidating] = useState(false);
  const [closingDay, setClosingDay] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [box, list, summary] = await Promise.all([
        repository.getRouteBox(selectedDate),
        repository.listCoolers(selectedDate),
        repository.getDaySummary(selectedDate),
      ]);
      setRouteBox(box);
      setCoolers(list);
      setDaySummary(summary);
      const riderIds = Array.from(new Set(list.map((cooler) => cooler.riderId)));
      if (riderIds.length > 0) {
        const metrics = await Promise.all(
          riderIds.map((id) => repository.getRiderMetrics(id, selectedDate))
        );
        setRiderMetrics(metrics);
      } else {
        setRiderMetrics([]);
      }
      setError(null);
    } catch (err: any) {
      setDaySummary(null);
      setRiderMetrics([]);
      setError(err?.message ?? 'No se pudo cargar la informacion');
    } finally {
      setLoading(false);
    }
  }, [repository, selectedDate]);

  const loadCatalogs = useCallback(async () => {
    try {
      const [users, inventory] = await Promise.all([
        userRepository.getAllUsers(),
        productRepository.getAll(),
      ]);
      setRiders(users.filter((user) => user.role === 'repartidor' && user.isActive));
      setProducts(inventory);
    } catch (err: any) {
      setError(err?.message ?? 'No se pudo cargar el catalogo de reparto');
    } finally {
      setCatalogLoading(false);
    }
  }, [productRepository, userRepository]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    loadCatalogs();
  }, [loadCatalogs]);

  const openDay = useCallback(async () => {
    setLoading(true);
    try {
      const next = await repository.openRouteBox(selectedDate);
      setRouteBox(next);
      setError(null);
    } catch (err: any) {
      setError(err?.message ?? 'No se pudo abrir la caja de ruta');
    } finally {
      setLoading(false);
    }
  }, [repository, selectedDate]);

  const closeDay = useCallback(async () => {
    setClosingDay(true);
    try {
      const next = await repository.closeRouteBox(selectedDate);
      setRouteBox(next);
      setError(null);
    } catch (err: any) {
      setError(err?.message ?? 'No se pudo cerrar el dia');
      throw err;
    } finally {
      setClosingDay(false);
    }
  }, [repository, selectedDate]);

  const liquidateCooler = useCallback(
    async (input: { coolerId: number; goodReturn: number; coldWaste: number; receivedTotal: number }) => {
      setLiquidating(true);
      try {
        await repository.liquidateCooler(input);
        await refresh();
        setError(null);
      } catch (err: any) {
        setError(err?.message ?? 'No se pudo liquidar la hielera');
        throw err;
      } finally {
        setLiquidating(false);
      }
    },
    [refresh, repository]
  );

  const createCooler = useCallback(
    async (input: {
      riderId: number;
      kilosOut: number;
      routePrice: number;
      initialCash: number;
      inventoryProductId?: string;
    }) => {
      setCreating(true);
      try {
        await repository.createCooler({
          date: selectedDate,
          riderId: input.riderId,
          kilosOut: input.kilosOut,
          routePrice: input.routePrice,
          // Guardamos el efectivo asignado desde la creaci?n para bloquearlo en la liquidaci?n.
          initialCash: input.initialCash,
          inventoryProductId: input.inventoryProductId,
          inventoryUnit: 'kg',
        });
        await refresh();
        setError(null);
      } catch (err: any) {
        setError(err?.message ?? 'No se pudo crear la hielera');
        throw err;
      } finally {
        setCreating(false);
      }
    },
    [refresh, repository, selectedDate]
  );

  const updateDate = (value: string) => {
    setSelectedDate(sanitizeDateInput(value));
  };

  return {
    selectedDate,
    setSelectedDate: updateDate,
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
  };
};
