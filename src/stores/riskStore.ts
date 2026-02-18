import { create } from 'zustand';
import type { RiskSnapshot } from '../types';

interface RiskState {
  snapshots: RiskSnapshot[];
  pushSnapshot: (snapshot: RiskSnapshot) => void;
  setSnapshots: (snapshots: RiskSnapshot[]) => void;
  getSnapshots: (symbol: string, accountId?: string) => RiskSnapshot[];
  getLatestSnapshot: (symbol: string, accountId?: string) => RiskSnapshot | undefined;
}

export const useRiskStore = create<RiskState>((set, get) => ({
  snapshots: [],
  pushSnapshot: (snapshot) =>
    set((s) => ({ snapshots: [snapshot, ...s.snapshots].slice(0, 2000) })),
  setSnapshots: (snapshots) => set({ snapshots: [...snapshots] }),
  getSnapshots: (symbol, accountId) =>
    get().snapshots.filter(
      (snapshot) =>
        snapshot.symbol === symbol &&
        (accountId ? snapshot.accountId === accountId : true)
    ),
  getLatestSnapshot: (symbol, accountId) =>
    get().snapshots.find(
      (snapshot) =>
        snapshot.symbol === symbol &&
        (accountId ? snapshot.accountId === accountId : true)
    ),
}));
