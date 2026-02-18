import { create } from 'zustand';
import type { Order } from '../types';

interface OrdersState {
  orders: Order[];
  addOrder: (order: Order) => void;
  updateOrder: (id: string, patch: Partial<Order>) => void;
  removeOrder: (id: string) => void;
  getOrder: (id: string) => Order | undefined;
}

export const useOrdersStore = create<OrdersState>((set, get) => ({
  orders: [],
  addOrder: (order) =>
    set((s) => ({ orders: [order, ...s.orders] })),
  updateOrder: (id, patch) =>
    set((s) => ({
      orders: s.orders.map((o) =>
        o.id === id ? { ...o, ...patch, updatedAt: Date.now() } : o
      ),
    })),
  removeOrder: (id) =>
    set((s) => ({ orders: s.orders.filter((o) => o.id !== id) })),
  getOrder: (id) => get().orders.find((o) => o.id === id),
}));
