import { useEffect } from 'react';
import { useTicksStore } from '../stores/ticksStore';
import { useWatchlistStore } from '../stores/watchlistStore';
import { useOrdersStore } from '../stores/ordersStore';
import { useFillsStore } from '../stores/fillsStore';
import { usePositionsStore } from '../stores/positionsStore';
import {
  startStreaming,
  stopStreaming,
  seedInitialTicks,
  seedDemoOrders,
  seedDemoFills,
  seedDemoPositions,
} from '../services';

export function useStreamingInit(): void {
  useEffect(() => {
    const symbols = useWatchlistStore.getState().symbols;
    useTicksStore.getState().setTicks(seedInitialTicks(symbols));

    const ordersStore = useOrdersStore.getState();
    if (ordersStore.orders.length === 0) {
      seedDemoOrders().forEach((o) => ordersStore.addOrder(o));
    }
    const fillsStore = useFillsStore.getState();
    if (fillsStore.fills.length === 0) {
      seedDemoFills().forEach((f) => fillsStore.addFill(f));
    }
    if (usePositionsStore.getState().positions.length === 0) {
      usePositionsStore.getState().setPositions(seedDemoPositions());
    }

    startStreaming();
    return () => stopStreaming();
  }, []);
}
