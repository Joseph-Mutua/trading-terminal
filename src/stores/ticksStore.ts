import { create } from 'zustand';
import type { SymbolTick } from '../types';

interface TicksState {
  /** Map symbol -> latest tick */
  ticks: Record<string, SymbolTick>;
  setTick: (tick: SymbolTick) => void;
  setTicks: (ticks: SymbolTick[]) => void;
  getTick: (symbol: string) => SymbolTick | undefined;
}

export const useTicksStore = create<TicksState>((set, get) => ({
  ticks: {},
  setTick: (tick) =>
    set((s) => ({
      ticks: { ...s.ticks, [tick.symbol]: { ...tick } },
    })),
  setTicks: (ticks) =>
    set((s) => {
      const next = { ...s.ticks };
      for (const t of ticks) {
        next[t.symbol] = { ...t };
      }
      return { ticks: next };
    }),
  getTick: (symbol) => get().ticks[symbol],
}));
