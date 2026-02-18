import { useTicksStore } from '../stores/ticksStore';
import { useWatchlistStore } from '../stores/watchlistStore';
import { useOrdersStore } from '../stores/ordersStore';
import { useFillsStore } from '../stores/fillsStore';
import { usePositionsStore } from '../stores/positionsStore';
import { useRiskStore } from '../stores/riskStore';
import {
  seedInitialTicks,
  seedDemoOrders,
  seedDemoFills,
  seedDemoPositions,
  seedDemoRiskSnapshots,
} from './mockData';
import { startStreaming, stopStreaming } from './streamingService';

let initialized = false;

export function initializeTerminalData(): void {
  if (initialized) return;
  initialized = true;

  const symbols = useWatchlistStore.getState().symbols;
  useTicksStore.getState().setTicks(seedInitialTicks(symbols));

  const ordersStore = useOrdersStore.getState();
  if (ordersStore.orders.length === 0) {
    ordersStore.setOrders(seedDemoOrders());
  }

  const fillsStore = useFillsStore.getState();
  if (fillsStore.fills.length === 0) {
    fillsStore.setFills(seedDemoFills());
  }

  const positionsStore = usePositionsStore.getState();
  if (positionsStore.positions.length === 0) {
    positionsStore.setPositions(seedDemoPositions());
  }

  const riskStore = useRiskStore.getState();
  if (riskStore.snapshots.length === 0) {
    riskStore.setSnapshots(seedDemoRiskSnapshots());
  }

  startStreaming();
}

export function shutdownTerminalData(): void {
  stopStreaming();
  initialized = false;
}
