import { create } from 'zustand';
import type { Order } from '../types';

interface OrdersState {
  orders: Order[];
  setOrders: (orders: Order[]) => void;
  addOrder: (order: Order) => void;
  upsertOrder: (order: Order) => void;
  updateManyOrders: (updates: Array<{ id: string; patch: Partial<Order> }>) => void;
  updateOrder: (id: string, patch: Partial<Order>) => void;
  removeOrder: (id: string) => void;
  getOrder: (id: string) => Order | undefined;
}

export const useOrdersStore = create<OrdersState>((set, get) => ({
  orders: [],
  setOrders: (orders) => set({ orders: [...orders] }),
  addOrder: (order) =>
    set((s) => ({ orders: [order, ...s.orders] })),
  upsertOrder: (order) =>
    set((s) => {
      const idx = s.orders.findIndex((o) => o.id === order.id);
      if (idx < 0) return { orders: [order, ...s.orders] };
      const next = [...s.orders];
      next[idx] = { ...next[idx], ...order };
      return { orders: next };
    }),
  updateManyOrders: (updates) =>
    set((s) => {
      if (updates.length === 0) return s;
      const byId = new Map(updates.map((u) => [u.id, u.patch]));
      return {
        orders: s.orders.map((order) => {
          const patch = byId.get(order.id);
          return patch ? { ...order, ...patch, updatedAt: Date.now() } : order;
        }),
      };
    }),
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
