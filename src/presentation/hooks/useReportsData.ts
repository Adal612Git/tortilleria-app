import { useCallback, useEffect, useMemo, useState } from 'react';
import { DatabaseService } from '../../infrastructure/database/DatabaseService';

type DateRange = 'today' | 'week' | 'month' | 'custom';

type PaymentSlice = {
  method: string;
  amount: number;
  percentage: number;
};

type StockMovement = {
  product: string;
  sold: number;
  remaining: number;
  lastSale?: string | null;
};

type ReportsData = {
  totals: {
    revenue: number;
    items: number;
    avgTicket: number;
    lastSale?: string | null;
  };
  products: { name: string; quantity: number; revenue: number }[];
  salesByDate: { label: string; value: number; date: string }[];
  paymentMethods: PaymentSlice[];
  stockMovements: StockMovement[];
};

type UseReportsDataReturn = {
  data: ReportsData;
  loading: boolean;
  error: string | null;
  range: DateRange;
  setRange: (range: DateRange) => void;
  customStart: string;
  setCustomStart: (value: string) => void;
  customEnd: string;
  setCustomEnd: (value: string) => void;
  refresh: () => Promise<void>;
  usingFakeData: boolean;
};

const buildFakeData = (): ReportsData => ({
  totals: {
    revenue: 15200,
    items: 420,
    avgTicket: 72.38,
    lastSale: new Date().toISOString(),
  },
  products: [
    { name: 'Tortilla de maiz', quantity: 210, revenue: 6300 },
    { name: 'Masa especial', quantity: 130, revenue: 3900 },
    { name: 'Tostada horneada', quantity: 80, revenue: 3000 },
  ],
  salesByDate: Array.from({ length: 7 }).map((_, idx) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - idx));
    return {
      date: date.toISOString(),
      label: `${date.getDate()}/${date.getMonth() + 1}`,
      value: 1500 + idx * 120,
    };
  }),
  paymentMethods: [
    { method: 'Efectivo', amount: 9600, percentage: 63 },
    { method: 'Tarjeta', amount: 4200, percentage: 27 },
    { method: 'Transferencia', amount: 1400, percentage: 10 },
  ],
  stockMovements: [
    { product: 'Tortilla de maiz', sold: 210, remaining: 90, lastSale: new Date().toISOString() },
    { product: 'Tostadas horneadas', sold: 80, remaining: 40, lastSale: new Date().toISOString() },
    { product: 'Salsa verde', sold: 35, remaining: 65, lastSale: new Date().toISOString() },
  ],
});

const ensureValidDate = (value: string) => {
  const [y, m, d] = value.split('-').map((p) => Number(p));
  if (!y || !m || !d) return null;
  const date = new Date(y, m - 1, d);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getRange = (range: DateRange, start?: string, end?: string) => {
  const now = new Date();
  const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  if (range === 'today') {
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 1);
    return { start: startDate, end: endDate };
  }
  if (range === 'week') {
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 7);
    return { start: startDate, end: endDate };
  }
  if (range === 'month') {
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 30);
    return { start: startDate, end: endDate };
  }
  const startDate = start ? ensureValidDate(start) : null;
  const endDateInput = end ? ensureValidDate(end) : null;
  if (startDate && endDateInput && endDateInput >= startDate) {
    const exclusive = new Date(endDateInput);
    exclusive.setDate(exclusive.getDate() + 1);
    return { start: startDate, end: exclusive };
  }
  const fallbackStart = new Date(endDate);
  fallbackStart.setDate(fallbackStart.getDate() - 7);
  return { start: fallbackStart, end: endDate };
};

export const useReportsData = (): UseReportsDataReturn => {
  const [range, setRange] = useState<DateRange>('week');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [data, setData] = useState<ReportsData>(buildFakeData());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingFakeData, setUsingFakeData] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const db = await DatabaseService.getInstance().getDatabase();
      const { start, end } = getRange(range, customStart, customEnd);
      const startISO = start.toISOString();
      const endISO = end.toISOString();

      const totalsRows = await db.getAllAsync<any>(
        'SELECT SUM(COALESCE(totalPrice, total)) as revenue, SUM(quantity) as items, COUNT(*) as lines, MAX(saleDate) as lastSale FROM sales WHERE saleDate >= ? AND saleDate < ?',
        [startISO, endISO]
      );
      const totalsRow = totalsRows?.[0] ?? {};
      const revenue = Number(totalsRow.revenue ?? 0);
      const items = Number(totalsRow.items ?? 0);
      const lines = Number(totalsRow.lines ?? 0);
      const avgTicket = lines > 0 ? revenue / lines : 0;

      const topProductsRows = await db.getAllAsync<any>(
        `SELECT COALESCE(p.name, 'Producto') as name, SUM(s.quantity) as qty, SUM(COALESCE(s.totalPrice, s.total)) as total
         FROM sales s LEFT JOIN products p ON p.id = s.productId
         WHERE s.saleDate >= ? AND s.saleDate < ?
         GROUP BY name
         ORDER BY qty DESC
         LIMIT 8`,
        [startISO, endISO]
      );

      const salesByDateRows = await db.getAllAsync<any>(
        `SELECT substr(saleDate, 1, 10) as day, SUM(COALESCE(totalPrice, total)) as total
         FROM sales
         WHERE saleDate >= ? AND saleDate < ?
         GROUP BY day
         ORDER BY day ASC`,
        [startISO, endISO]
      );

      const salesTableInfo = await db.getAllAsync<any>('PRAGMA table_info(sales);');
      const hasPaymentMethodColumn = salesTableInfo.some((c: any) => c.name === 'paymentMethod');
      let paymentRows: { method: string; amount: number }[] = [];
      if (hasPaymentMethodColumn) {
        const raw = await db.getAllAsync<any>(
          `SELECT COALESCE(paymentMethod, 'cash') as method, SUM(COALESCE(totalPrice, total)) as total
           FROM sales
           WHERE saleDate >= ? AND saleDate < ?
           GROUP BY method`,
          [startISO, endISO]
        );
        paymentRows = raw.map(r => ({ method: r.method ?? 'cash', amount: Number(r.total ?? 0) }));
      }

      const stockRows = await db.getAllAsync<any>(
        `SELECT p.name as product, p.stock as remaining, COALESCE(SUM(s.quantity), 0) as sold, MAX(s.saleDate) as lastSale
         FROM products p
         LEFT JOIN sales s ON s.productId = p.id AND s.saleDate >= ? AND s.saleDate < ?
         GROUP BY p.id
         ORDER BY sold DESC
         LIMIT 10`,
        [startISO, endISO]
      );

      const paymentTotals = paymentRows.reduce((sum, row) => sum + row.amount, 0);
      const paymentSlices: PaymentSlice[] = paymentRows.length
        ? paymentRows.map(row => ({
            method: row.method,
            amount: row.amount,
            percentage: paymentTotals > 0 ? Math.round((row.amount / paymentTotals) * 100) : 0,
          }))
        : [];

      const nextData: ReportsData = {
        totals: {
          revenue,
          items,
          avgTicket,
          lastSale: totalsRow.lastSale ?? null,
        },
        products: topProductsRows.map((row: any) => ({
          name: row.name,
          quantity: Number(row.qty ?? 0),
          revenue: Number(row.total ?? 0),
        })),
        salesByDate: salesByDateRows.map((row: any) => {
          const [year, month, day] = String(row.day ?? '').split('-');
          return {
            date: row.day,
            label: month && day ? `${day}/${month}` : row.day,
            value: Number(row.total ?? 0),
          };
        }),
        paymentMethods: paymentSlices,
        stockMovements: stockRows.map((row: any) => ({
          product: row.product ?? 'Producto',
          sold: Number(row.sold ?? 0),
          remaining: Number(row.remaining ?? 0),
          lastSale: row.lastSale ?? null,
        })),
      };

      if (!nextData.totals.revenue && !nextData.products.length && !nextData.salesByDate.length) {
        setData(buildFakeData());
        setUsingFakeData(true);
      } else {
        setData(nextData);
        setUsingFakeData(false);
      }
    } catch (err: any) {
      setError(err?.message ?? 'No se pudieron cargar los reportes');
      setData(buildFakeData());
      setUsingFakeData(true);
    } finally {
      setLoading(false);
    }
  }, [range, customStart, customEnd]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    range,
    setRange,
    customStart,
    setCustomStart,
    customEnd,
    setCustomEnd,
    refresh: fetchData,
    usingFakeData,
  };
};
