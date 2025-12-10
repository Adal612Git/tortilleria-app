import { create } from 'zustand';

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  unitLabel?: string;
  unitAmount?: number;
};

type State = {
  items: CartItem[];
  isOpen: boolean;
};

type Actions = {
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  increment: (productId: string, step?: number) => void;
  decrement: (productId: string, step?: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  toggle: (open?: boolean) => void;
  total: () => number;
};

export const useCartStore = create<State & Actions>((set, get) => ({
  items: [],
  isOpen: false,

  addItem: (item) => {
    const qty = item.quantity ?? 1;
    if (qty <= 0) return;
    const existing = get().items.find(i => i.productId === item.productId);
    if (existing) {
      set({
        items: get().items.map(i =>
          i.productId === item.productId
            ? {
                ...i,
                quantity: parseFloat((i.quantity + qty).toFixed(3)),
                unitLabel: item.unitLabel ?? i.unitLabel,
                unitAmount: item.unitAmount ?? i.unitAmount,
              }
            : i
        ),
      });
    } else {
      set({ items: [...get().items, { ...item, quantity: qty, unitAmount: item.unitAmount ?? qty }] });
    }
  },

  increment: (productId, step) =>
    set({
      items: get().items.map(i =>
        i.productId === productId
          ? { ...i, quantity: parseFloat((i.quantity + (step ?? i.unitAmount ?? 1)).toFixed(3)) }
          : i
      ),
    }),

  decrement: (productId, step) =>
    set({
      items: get().items
        .map(i => {
          if (i.productId !== productId) return i;
          const delta = step ?? i.unitAmount ?? 1;
          const next = parseFloat((i.quantity - delta).toFixed(3));
          return { ...i, quantity: next > 0 ? next : 0 };
        })
        .filter(i => i.quantity > 0),
    }),

  remove: (productId) => set({ items: get().items.filter(i => i.productId !== productId) }),
  clear: () => set({ items: [] }),
  toggle: (open) => set({ isOpen: open ?? !get().isOpen }),
  total: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
}));
