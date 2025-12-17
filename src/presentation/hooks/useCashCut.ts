import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { DatabaseService } from '../../infrastructure/database/DatabaseService';
import { CashCutRepository, CashCutRecord } from '../../infrastructure/repositories/CashCutRepository';
import { useAuthStore } from '../store/authStore';
import { closeCashCut } from './useCashCutState';
import { readWebSales } from '../../infrastructure/storage/webSalesStorage';

type CreateCutInput = {
  openingFloat: number;
  countedCash: number;
  notes?: string;
};

const normalizeNumber = (value: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const getTodayBounds = () => {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
};

export const useCashCut = () => {
  const repository = useMemo(() => new CashCutRepository(), []);
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const [audits, setAudits] = useState<CashCutRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [todaySales, setTodaySales] = useState(0);

  const fetchTodaySales = useCallback(async () => {
    const { start, end } = getTodayBounds();
    if (Platform.OS === 'web') {
      const sales = await readWebSales();
      const totalWeb = sales
        .filter(
          (line) =>
            line.saleDate >= start &&
            line.saleDate <= end &&
            (userId ? line.userId === userId : true)
        )
        .reduce((sum, line) => sum + Number(line.totalPrice ?? 0), 0);
      const normalizedWebTotal = Number.isFinite(totalWeb) ? totalWeb : 0;
      setTodaySales(normalizedWebTotal);
      return normalizedWebTotal;
    }
    const db = await DatabaseService.getInstance().getDatabase();
    const tableInfo = await db.getAllAsync<any>('PRAGMA table_info(sales);');
    const hasTotalPrice = tableInfo.some((col) => col.name === 'totalPrice');
    const hasTotal = tableInfo.some((col) => col.name === 'total');
    const hasPaymentMethod = tableInfo.some((col) => col.name === 'paymentMethod');
    const hasUserId = tableInfo.some((col) => col.name === 'userId');
    const hasStatus = tableInfo.some((col) => col.name === 'status');

    if (!hasTotalPrice && !hasTotal) {
      setTodaySales(0);
      return 0;
    }

    const revenueExpr =
      hasTotalPrice && hasTotal
        ? 'SUM(COALESCE(CAST(totalPrice AS REAL), CAST(total AS REAL), 0))'
        : hasTotalPrice
          ? 'SUM(CAST(totalPrice AS REAL))'
          : 'SUM(CAST(total AS REAL))';

    let query = `SELECT ${revenueExpr} as revenue FROM sales WHERE saleDate >= ? AND saleDate <= ?`;
    const params: any[] = [start, end];
    if (hasPaymentMethod) {
      query += ' AND COALESCE(paymentMethod, \'cash\') = ?';
      params.push('cash');
    }
    if (hasUserId && userId) {
      query += ' AND userId = ?';
      params.push(userId);
    }
    if (hasStatus) {
      query += " AND COALESCE(status, 'completed') IN ('completed', 'paid')";
    }

    const rows = await db.getAllAsync<any>(query, params);
    const total = Number(rows?.[0]?.revenue ?? 0);
    const normalizedTotal = Number.isFinite(total) ? total : 0;
    setTodaySales(normalizedTotal);
    return normalizedTotal;
  }, [userId]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await fetchTodaySales();
      const list = await repository.list(20, userId ?? null);
      setAudits(list);
    } catch (err: any) {
      setError(err?.message ?? 'No fue posible cargar los cortes de caja.');
    } finally {
      setLoading(false);
    }
  }, [repository, fetchTodaySales, userId]);

  useEffect(() => {
    load();
  }, [load]);

  const getBaselineSales = useCallback(() => {
    const now = new Date();
    return audits.reduce((sum, audit) => {
      const auditDate = new Date(audit.createdAt);
      if (!Number.isNaN(auditDate.getTime()) && isSameDay(auditDate, now)) {
        return sum + normalizeNumber(audit.cashSales);
      }
      return sum;
    }, 0);
  }, [audits]);

  const recordCut = useCallback(
    async (input: CreateCutInput) => {
      const openingFloat = normalizeNumber(input.openingFloat);
      const countedCash = normalizeNumber(input.countedCash);
      const rawSales = await fetchTodaySales();
      const baselineSales = getBaselineSales();
      const cashSales = Math.max(rawSales - baselineSales, 0);
      const expectedCash = openingFloat + cashSales;
      const difference = countedCash - expectedCash;

      await repository.create({
        openingFloat,
        entries: 0,
        exits: 0,
        cashSales,
        expectedCash,
        countedCash,
        difference,
        notes: input.notes ?? null,
        userId: userId ?? null,
        createdAt: new Date().toISOString(),
      });
      await closeCashCut(userId ?? null);
      await load();
    },
    [repository, fetchTodaySales, load, getBaselineSales, userId]
  );

  return {
    audits,
    loading,
    error,
    todaySales,
    recordCut,
    refresh: load,
  };
};
