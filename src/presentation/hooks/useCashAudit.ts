import { useCallback, useEffect, useMemo, useState } from 'react';
import { DatabaseService } from '../../infrastructure/database/DatabaseService';
import { CashAuditRepository, CashAudit } from '../../infrastructure/repositories/CashAuditRepository';

type CreateAuditInput = {
  openingFloat: number;
  entries: number;
  exits: number;
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

export const useCashAudit = () => {
  const repository = useMemo(() => new CashAuditRepository(), []);
  const [audits, setAudits] = useState<CashAudit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [todaySales, setTodaySales] = useState(0);

  const fetchTodaySales = useCallback(async () => {
    const db = await DatabaseService.getInstance().getDatabase();
    const { start, end } = getTodayBounds();
    const rows = await db.getAllAsync<any>(
      'SELECT SUM(COALESCE(totalPrice, total)) as revenue FROM sales WHERE saleDate >= ? AND saleDate <= ?',
      [start, end]
    );
    setTodaySales(Number(rows?.[0]?.revenue ?? 0));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await fetchTodaySales();
      const list = await repository.list();
      setAudits(list);
    } catch (err: any) {
      setError(err?.message ?? 'No fue posible cargar los arqueos.');
    } finally {
      setLoading(false);
    }
  }, [repository, fetchTodaySales]);

  useEffect(() => {
    load();
  }, [load]);

  const recordAudit = useCallback(async (input: CreateAuditInput) => {
    const openingFloat = normalizeNumber(input.openingFloat);
    const entries = normalizeNumber(input.entries);
    const exits = normalizeNumber(input.exits);
    const countedCash = normalizeNumber(input.countedCash);
    const expectedCash = openingFloat + entries + todaySales - exits;
    const difference = countedCash - expectedCash;

    await repository.create({
      openingFloat,
      entries,
      exits,
      cashSales: todaySales,
      expectedCash,
      countedCash,
      difference,
      notes: input.notes ?? null,
      createdAt: new Date().toISOString(),
    });
    await load();
  }, [repository, todaySales, load]);

  return {
    audits,
    loading,
    error,
    todaySales,
    recordAudit,
    refresh: load,
  };
};
