import { create } from 'zustand';

interface SelectionState {
  selectedSymbol: string | null;
  setSelectedSymbol: (symbol: string | null) => void;
}

export const useSelectionStore = create<SelectionState>((set) => ({
  selectedSymbol: null,
  setSelectedSymbol: (selectedSymbol) => set({ selectedSymbol }),
}));
