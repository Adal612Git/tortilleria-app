import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { DatabaseService } from '../../infrastructure/database/DatabaseService';
import { ProductRepositoryImpl } from '../../infrastructure/repositories/ProductRepositoryImpl';
import { UserRepository } from '../../infrastructure/repositories/UserRepository';
import { readRouteCoolers } from '../../infrastructure/storage/webRouteOperationsStorage';
import { readWebSales } from '../../infrastructure/storage/webSalesStorage';

const getTodayBounds = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
};

const formatDateKey = (date: Date) => date.toISOString().slice(0, 10);

type Stats = {
  users: number;
  products: number;
  sales: number;
  loading: boolean;
  error: string | null;
};

const initialStats: Stats = {
  users: 0,
  products: 0,
  sales: 0,
  loading: false,
  error: null,
};

export const useAdminDashboardStats = () => {
  const userRepo = useMemo(() => new UserRepository(), []);
  const productRepo = useMemo(() => new ProductRepositoryImpl(), []);
  const [stats, setStats] = useState<Stats>(initialStats);

  const load = useCallback(async () => {
    setStats(prev => ({ ...prev, loading: true, error: null }));
    try {
      const { start, end } = getTodayBounds();
      const startISO = start.toISOString();
      const endISO = end.toISOString();
      const dayKey = formatDateKey(start);

      if (Platform.OS === 'web') {
        const [users, products, sales, coolers] = await Promise.all([
          userRepo.getAllUsers(),
          productRepo.getAll(),
          readWebSales(),
          readRouteCoolers(),
        ]);
        const activeUsers = users.filter(user => user.isActive).length;
        const salesCount = sales.filter(line => {
          const date = line.saleDate ?? '';
          return date >= startISO && date < endISO;
        }).length;
        const coolerCount = coolers.filter(
          cooler => cooler.status === 'liquidada' && cooler.date === dayKey
        ).length;
        setStats({
          users: activeUsers,
          products: products.length,
          sales: salesCount + coolerCount,
          loading: false,
          error: null,
        });
        return;
      }

      const db = await DatabaseService.getInstance().getDatabase();
      const [usersRow, productsRow, salesRow, coolersRow] = await Promise.all([
        db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM users WHERE isActive = 1', []),
        db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM products WHERE isActive = 1', []),
        db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM sales WHERE saleDate >= ? AND saleDate < ?', [
          startISO,
          endISO,
        ]),
        db.getFirstAsync<{ count: number }>(
          'SELECT COUNT(*) as count FROM coolers WHERE date = ? AND status = ?',
          [dayKey, 'liquidada']
        ),
      ]);
      const usersCount = usersRow?.count ?? 0;
      const productsCount = productsRow?.count ?? 0;
      const salesCount = (salesRow?.count ?? 0) + (coolersRow?.count ?? 0);
      setStats({
        users: usersCount,
        products: productsCount,
        sales: salesCount,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      console.error('No se pudieron cargar los indicadores del dashboard', error);
      setStats(prev => ({
        ...prev,
        loading: false,
        error: error?.message ?? 'Error al obtener indicadores',
      }));
    }
  }, [productRepo, userRepo]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    ...stats,
    refresh: load,
  };
};
