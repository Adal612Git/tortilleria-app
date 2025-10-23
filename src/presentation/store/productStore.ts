import { create } from 'zustand';
import { Product } from '../../domain/entities/Product';
import { ProductRepositoryImpl } from '../../infrastructure/repositories/ProductRepositoryImpl';

type State = {
  products: Product[];
  loading: boolean;
  error?: string | null;
  search: string;
};

type Actions = {
  load: () => Promise<void>;
  seedIfEmpty: () => Promise<void>;
  add: (p: Omit<Product, 'id' | 'createdAt'>) => Promise<void>;
  update: (id: string, p: Partial<Product>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  setSearch: (q: string) => void;
};

const repo = new ProductRepositoryImpl();

export const useProductStore = create<State & Actions>((set, get) => ({
  products: [],
  loading: false,
  error: null,
  search: '',

  load: async () => {
    set({ loading: true, error: null });
    try {
      const data = await repo.getAll();
      set({ products: data });
    } catch (e: any) {
      set({ error: e.message });
    } finally {
      set({ loading: false });
    }
  },

  seedIfEmpty: async () => {
    await get().load();
    if (get().products.length === 0) {
      const now = Date.now();
      await repo.create({ name: 'Tortilla de Maíz', description: 'Fresca del día', price: 20, stock: 100, unit: 'kg', category: 'tortilla', isActive: true });
      await repo.create({ name: 'Tostadas', description: 'Crujientes', price: 12, stock: 60, unit: 'pieza', category: 'tostada', isActive: true });
      await repo.create({ name: 'Masa', description: 'Para tamales', price: 18, stock: 80, unit: 'kg', category: 'masa', isActive: true });
      await get().load();
      console.log('✅ Productos de ejemplo cargados');
    }
  },

  add: async (p) => {
    await repo.create(p);
    await get().load();
  },

  update: async (id, p) => {
    await repo.update(id, p);
    await get().load();
  },

  remove: async (id) => {
    await repo.delete(id);
    await get().load();
  },

  setSearch: (q) => set({ search: q }),
}));

