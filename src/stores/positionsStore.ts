import { create } from 'zustand';
import type { Position } from '../types';

interface PositionsState {
  positions: Position[];
  setPosition: (position: Position) => void;
  setPositions: (positions: Position[]) => void;
  getPosition: (symbol: string, accountId?: string) => Position | undefined;
  updatePosition: (symbol: string, patch: Partial<Position>) => void;
}

export const usePositionsStore = create<PositionsState>((set, get) => ({
  positions: [],
  setPosition: (position) =>
    set((s) => {
      const key = (p: Position) => `${p.symbol}:${p.accountId ?? 'default'}`;
      const next = s.positions.filter(
        (p) => key(p) !== key(position)
      );
      next.push({ ...position });
      return { positions: next };
    }),
  setPositions: (positions) => set({ positions: [...positions] }),
  getPosition: (symbol, accountId) =>
    get().positions.find(
      (p) => p.symbol === symbol && (p.accountId ?? 'default') === (accountId ?? 'default')
    ),
  updatePosition: (symbol, patch) =>
    set((s) => ({
      positions: s.positions.map((p) =>
        p.symbol === symbol ? { ...p, ...patch, lastUpdated: Date.now() } : p
      ),
    })),
}));
