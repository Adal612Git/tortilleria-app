import { useCallback, useEffect, useMemo, useState } from 'react';
import { DatabaseService } from '../../infrastructure/database/DatabaseService';
import { CashCutRepository, CashCutRecord } from '../../infrastructure/repositories/CashCutRepository';
import { useAuthStore } from '../store/authStore';

type CreateCutInput = {
  openingFloat: number;
  countedCash: number;
  notes?: string;
};

const normalizeNumber = (value: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

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
    const db = await DatabaseService.getInstance().getDatabase();
    const { start, end } = getTodayBounds();
    let query =
      'SELECT SUM(COALESCE(totalPrice, total)) as revenue FROM sales WHERE saleDate >= ? AND saleDate <= ? AND COALESCE(paymentMethod, \'cash\') = ?';
    const params: any[] = [start, end, 'cash'];
    if (userId) {
      query += ' AND userId = ?';
      params.push(userId);
    }
    const rows = await db.getAllAsync<any>(query, params);
    setTodaySales(Number(rows?.[0]?.revenue ?? 0));
  }, [userId]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await fetchTodaySales();
      const list = await repository.list();
      setAudits(list);
    } catch (err: any) {
      setError(err?.message ?? 'No fue posible cargar los cortes de caja.');
    } finally {
      setLoading(false);
    }
  }, [repository, fetchTodaySales]);

  useEffect(() => {
    load();
  }, [load]);

  const recordCut = useCallback(
    async (input: CreateCutInput) => {
      const openingFloat = normalizeNumber(input.openingFloat);
      const countedCash = normalizeNumber(input.countedCash);
      const expectedCash = openingFloat + todaySales;
      const difference = countedCash - expectedCash;

      await repository.create({
        openingFloat,
        entries: 0,
        exits: 0,
        cashSales: todaySales,
        expectedCash,
        countedCash,
        difference,
        notes: input.notes ?? null,
        createdAt: new Date().toISOString(),
      });
      await load();
    },
    [repository, todaySales, load]
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
