import { create } from 'zustand';
import type { Fill } from '../types';

interface FillsState {
  fills: Fill[];
  setFills: (fills: Fill[]) => void;
  addFill: (fill: Fill) => void;
  addManyFills: (fills: Fill[]) => void;
  getFillsByOrderId: (orderId: string) => Fill[];
  getFillsBySymbol: (symbol: string) => Fill[];
}

export const useFillsStore = create<FillsState>((set, get) => ({
  fills: [],
  setFills: (fills) => set({ fills: [...fills] }),
  addFill: (fill) =>
    set((s) => ({ fills: [fill, ...s.fills] })),
  addManyFills: (fills) =>
    set((s) => ({ fills: [...fills, ...s.fills] })),
  getFillsByOrderId: (orderId) =>
    get().fills.filter((f) => f.orderId === orderId),
  getFillsBySymbol: (symbol) =>
    get().fills.filter((f) => f.symbol === symbol),
}));
