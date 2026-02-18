import { create } from 'zustand';

export type Environment = 'SIM' | 'PAPER' | 'LIVE';

interface ConnectionState {
  environment: Environment;
  connected: boolean;
  latencyMs: number;
  setEnvironment: (env: Environment) => void;
  setConnected: (connected: boolean) => void;
  setLatencyMs: (ms: number) => void;
}

export const useConnectionStore = create<ConnectionState>((set) => ({
  environment: 'SIM',
  connected: true,
  latencyMs: 12,
  setEnvironment: (environment) => set({ environment }),
  setConnected: (connected) => set({ connected }),
  setLatencyMs: (latencyMs) => set({ latencyMs }),
}));
