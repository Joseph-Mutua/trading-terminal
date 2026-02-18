import { useTicksStore } from '../stores/ticksStore';
import { useWatchlistStore } from '../stores/watchlistStore';
import { useConnectionStore } from '../stores/connectionStore';
import { generateTick } from './mockData';

const TICK_INTERVAL_MS = 80; // ~12 updates/sec per symbol
let intervalId: ReturnType<typeof setInterval> | null = null;
const latencyJitter = () => 8 + Math.floor(Math.random() * 12);

export function startStreaming(): void {
  if (intervalId) return;

  useConnectionStore.getState().setConnected(true);

  intervalId = setInterval(() => {
    const symbols = useWatchlistStore.getState().symbols;
    const setTick = useTicksStore.getState().setTick;
    const ticks = symbols.map((s) => {
      const prev = useTicksStore.getState().getTick(s);
      return generateTick(s, prev?.last);
    });
    ticks.forEach(setTick);
    useConnectionStore.getState().setLatencyMs(latencyJitter());
  }, TICK_INTERVAL_MS);
}

export function stopStreaming(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  useConnectionStore.getState().setConnected(false);
}

export function isStreaming(): boolean {
  return intervalId != null;
}
