import { create } from 'zustand';

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
};

type State = {
  items: CartItem[];
  isOpen: boolean;
};

type Actions = {
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  increment: (productId: string) => void;
  decrement: (productId: string) => void;
  remove: (productId: string) => void;
  clear: () => void;
  toggle: (open?: boolean) => void;
  total: () => number;
};

export const useCartStore = create<State & Actions>((set, get) => ({
  items: [],
  isOpen: false,

  addItem: (item) => {
    const existing = get().items.find(i => i.productId === item.productId);
    if (existing) {
      set({ items: get().items.map(i => i.productId === item.productId ? { ...i, quantity: i.quantity + 1 } : i) });
    } else {
      set({ items: [...get().items, { ...item, quantity: 1 }] });
    }
  },

  increment: (productId) => set({ items: get().items.map(i => i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i) }),
  decrement: (productId) => set({ items: get().items.map(i => i.productId === productId ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i) }),
  remove: (productId) => set({ items: get().items.filter(i => i.productId !== productId) }),
  clear: () => set({ items: [] }),
  toggle: (open) => set({ isOpen: open ?? !get().isOpen }),
  total: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
}));

