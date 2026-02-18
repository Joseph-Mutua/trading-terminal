import { create } from 'zustand';

interface WatchlistState {
  symbols: string[];
  addSymbol: (symbol: string) => void;
  removeSymbol: (symbol: string) => void;
  setSymbols: (symbols: string[]) => void;
  moveSymbol: (fromIndex: number, toIndex: number) => void;
}

export const useWatchlistStore = create<WatchlistState>((set) => ({
  symbols: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA'],
  addSymbol: (symbol) =>
    set((s) =>
      s.symbols.includes(symbol) ? s : { symbols: [...s.symbols, symbol.toUpperCase()] }
    ),
  removeSymbol: (symbol) =>
    set((s) => ({ symbols: s.symbols.filter((x) => x !== symbol) })),
  setSymbols: (symbols) => set({ symbols: [...symbols] }),
  moveSymbol: (fromIndex, toIndex) =>
    set((s) => {
      const next = [...s.symbols];
      const [removed] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, removed);
      return { symbols: next };
    }),
}));
