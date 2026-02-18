import { create } from 'zustand';
import type { Fill } from '../types';

interface FillsState {
  fills: Fill[];
  addFill: (fill: Fill) => void;
  getFillsByOrderId: (orderId: string) => Fill[];
  getFillsBySymbol: (symbol: string) => Fill[];
}

export const useFillsStore = create<FillsState>((set, get) => ({
  fills: [],
  addFill: (fill) =>
    set((s) => ({ fills: [fill, ...s.fills] })),
  getFillsByOrderId: (orderId) =>
    get().fills.filter((f) => f.orderId === orderId),
  getFillsBySymbol: (symbol) =>
    get().fills.filter((f) => f.symbol === symbol),
}));
