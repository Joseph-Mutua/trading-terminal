import { create } from 'zustand';
import type { SymbolTick } from '../types';

interface TicksState {
  /** Map symbol -> latest tick */
  ticks: Record<string, SymbolTick>;
  setTick: (tick: SymbolTick) => void;
  setTicks: (ticks: SymbolTick[]) => void;
  mergeTicks: (ticks: SymbolTick[]) => void;
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
  mergeTicks: (ticks) =>
    set((s) => {
      const next = { ...s.ticks };
      for (const tick of ticks) {
        next[tick.symbol] = { ...(next[tick.symbol] ?? {}), ...tick };
      }
      return { ticks: next as Record<string, SymbolTick> };
    }),
  getTick: (symbol) => get().ticks[symbol],
}));
