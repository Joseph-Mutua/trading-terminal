import { create } from 'zustand';

export type BlotterTab = 'orders' | 'fills' | 'positions';

interface BlotterState {
  activeTab: BlotterTab;
  setActiveTab: (tab: BlotterTab) => void;
}

export const useBlotterStore = create<BlotterState>((set) => ({
  activeTab: 'orders',
  setActiveTab: (activeTab) => set({ activeTab }),
}));
