import { create } from 'zustand';
import type { Position } from '../types';

interface PositionsState {
  positions: Position[];
  setPosition: (position: Position) => void;
  setPositions: (positions: Position[]) => void;
  upsertPosition: (position: Position) => void;
  upsertManyPositions: (positions: Position[]) => void;
  getPosition: (symbol: string, accountId?: string) => Position | undefined;
  updatePosition: (symbol: string, patch: Partial<Position>, accountId?: string) => void;
}

function positionKey(position: Pick<Position, 'symbol' | 'accountId'>): string {
  return `${position.symbol}:${position.accountId ?? 'default'}`;
}

export const usePositionsStore = create<PositionsState>((set, get) => ({
  positions: [],
  setPosition: (position) =>
    set((s) => {
      const next = s.positions.filter(
        (p) => positionKey(p) !== positionKey(position)
      );
      next.push({ ...position });
      return { positions: next };
    }),
  setPositions: (positions) => set({ positions: [...positions] }),
  upsertPosition: (position) =>
    set((s) => {
      const key = positionKey(position);
      const idx = s.positions.findIndex((p) => positionKey(p) === key);
      if (idx < 0) return { positions: [position, ...s.positions] };
      const next = [...s.positions];
      next[idx] = { ...next[idx], ...position, lastUpdated: Date.now() };
      return { positions: next };
    }),
  upsertManyPositions: (positions) =>
    set((s) => {
      if (positions.length === 0) return s;
      const map = new Map(s.positions.map((p) => [positionKey(p), p] as const));
      for (const position of positions) {
        map.set(positionKey(position), { ...map.get(positionKey(position)), ...position });
      }
      return { positions: Array.from(map.values()) };
    }),
  getPosition: (symbol, accountId) =>
    get().positions.find(
      (p) => p.symbol === symbol && (p.accountId ?? 'default') === (accountId ?? 'default')
    ),
  updatePosition: (symbol, patch, accountId) =>
    set((s) => ({
      positions: s.positions.map((p) =>
        p.symbol === symbol && (p.accountId ?? 'default') === (accountId ?? 'default')
          ? { ...p, ...patch, lastUpdated: Date.now() }
          : p
      ),
    })),
}));
