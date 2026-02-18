import type { Fill, Order, Position, RiskSnapshot, SymbolTick } from '../types';
import { useTicksStore } from '../stores/ticksStore';
import { useWatchlistStore } from '../stores/watchlistStore';
import { useConnectionStore } from '../stores/connectionStore';
import { useOrdersStore } from '../stores/ordersStore';
import { useFillsStore } from '../stores/fillsStore';
import { usePositionsStore } from '../stores/positionsStore';
import { useRiskStore } from '../stores/riskStore';
import { createFillFromOrder, generateTick } from './mockData';

const TICK_INTERVAL_MS = 70; // ~14 updates/sec
const EXECUTION_INTERVAL_MS = 260;
const ACCOUNT_EQUITY = 50_000;

let tickIntervalId: ReturnType<typeof setInterval> | null = null;
let executionIntervalId: ReturnType<typeof setInterval> | null = null;

function jitterLatency(): number {
  return 7 + Math.floor(Math.random() * 16);
}

function positionKey(symbol: string, accountId?: string): string {
  return `${symbol}:${accountId ?? 'default'}`;
}

function markToMarket(ticks: SymbolTick[]): void {
  if (ticks.length === 0) return;

  const tickMap = new Map<string, SymbolTick>(ticks.map((tick) => [tick.symbol, tick]));
  const positions = usePositionsStore.getState().positions;
  if (positions.length === 0) return;

  const updated = positions.map((position) => {
    const tick = tickMap.get(position.symbol);
    if (!tick) return position;

    const unrealized = Number(((tick.last - position.avgPrice) * position.qty).toFixed(2));
    const grossExposure = Math.abs(position.qty * tick.last);
    const marginUsed = Number((grossExposure * 0.25).toFixed(2));
    const marginAvailable = Number(Math.max(0, ACCOUNT_EQUITY - marginUsed).toFixed(2));

    return {
      ...position,
      unrealizedPnl: unrealized,
      grossExposure,
      marginUsed,
      marginAvailable,
      lastUpdated: Date.now(),
    };
  });

  usePositionsStore.getState().setPositions(updated);
}

function updatePositionFromFill(existing: Position | undefined, fill: Fill): Position {
  const signedQty = fill.side === 'BUY' ? fill.qty : -fill.qty;

  if (!existing) {
    const qty = signedQty;
    const grossExposure = Math.abs(qty * fill.price);
    const marginUsed = Number((grossExposure * 0.25).toFixed(2));

    return {
      symbol: fill.symbol,
      qty,
      avgPrice: fill.price,
      unrealizedPnl: 0,
      realizedPnl: 0,
      accountId: fill.accountId,
      strategyId: fill.strategyId,
      grossExposure,
      marginUsed,
      marginAvailable: Number(Math.max(0, ACCOUNT_EQUITY - marginUsed).toFixed(2)),
      lastUpdated: Date.now(),
    };
  }

  const prevQty = existing.qty;
  const nextQty = prevQty + signedQty;
  let nextAvg = existing.avgPrice;
  let nextRealized = existing.realizedPnl;

  if (prevQty === 0 || Math.sign(prevQty) === Math.sign(nextQty)) {
    const prevAbs = Math.abs(prevQty);
    const fillAbs = Math.abs(signedQty);
    const denom = prevAbs + fillAbs;
    nextAvg = denom === 0 ? fill.price : ((prevAbs * existing.avgPrice) + (fillAbs * fill.price)) / denom;
  } else {
    const closingQty = Math.min(Math.abs(prevQty), Math.abs(signedQty));
    const pnlPerUnit = (fill.price - existing.avgPrice) * (prevQty > 0 ? 1 : -1);
    nextRealized = Number((nextRealized + (closingQty * pnlPerUnit)).toFixed(2));
    if (nextQty === 0) {
      nextAvg = 0;
    } else if (Math.sign(prevQty) !== Math.sign(nextQty)) {
      nextAvg = fill.price;
    }
  }

  const grossExposure = Math.abs(nextQty * fill.price);
  const marginUsed = Number((grossExposure * 0.25).toFixed(2));

  return {
    ...existing,
    qty: nextQty,
    avgPrice: Number(nextAvg.toFixed(4)),
    realizedPnl: nextRealized,
    grossExposure,
    marginUsed,
    marginAvailable: Number(Math.max(0, ACCOUNT_EQUITY - marginUsed).toFixed(2)),
    lastUpdated: Date.now(),
  };
}

function makeRiskSnapshot(position: Position): RiskSnapshot {
  return {
    id: `risk-${Date.now()}-${Math.floor(Math.random() * 10_000)}`,
    symbol: position.symbol,
    accountId: position.accountId ?? 'default',
    marginUsed: position.marginUsed ?? 0,
    marginAvailable: position.marginAvailable ?? ACCOUNT_EQUITY,
    grossExposure: position.grossExposure ?? 0,
    valueAtRisk95: Number(((position.grossExposure ?? 0) * 0.021).toFixed(2)),
    ts: Date.now(),
  };
}

function processOrderLifecycle(): void {
  const ordersStore = useOrdersStore.getState();
  const activeOrders = ordersStore.orders.filter((order) =>
    order.status === 'PENDING' || order.status === 'LIVE' || order.status === 'PARTIALLY_FILLED'
  );
  if (activeOrders.length === 0) return;

  const patches: Array<{ id: string; patch: Partial<Order> }> = [];
  const newFills: Fill[] = [];

  for (const order of activeOrders) {
    const shouldActivate = order.status === 'PENDING' && Math.random() < 0.45;
    if (shouldActivate) {
      patches.push({ id: order.id, patch: { status: 'LIVE' } });
      continue;
    }

    if (order.status === 'PENDING') continue;
    if (Math.random() >= 0.5) continue;

    const tick = useTicksStore.getState().getTick(order.symbol);
    const basePrice = order.type === 'LIMIT' ? (order.limitPrice ?? tick?.last ?? 0) : (tick?.last ?? 0);
    if (basePrice <= 0) continue;

    const remaining = order.qty - order.filledQty;
    if (remaining <= 0) continue;

    const fillQty = Math.max(1, Math.min(remaining, Math.ceil(Math.random() * Math.max(1, remaining * 0.45))));
    const slippage = (Math.random() - 0.5) * 0.02;
    const fillPrice = Number((basePrice + slippage).toFixed(4));
    const fill = createFillFromOrder(order, fillPrice, fillQty);
    newFills.push(fill);

    const nextFilled = order.filledQty + fillQty;
    const priorNotional = (order.avgFillPrice ?? 0) * order.filledQty;
    const nextAvgFill = Number(((priorNotional + (fillPrice * fillQty)) / nextFilled).toFixed(4));

    patches.push({
      id: order.id,
      patch: {
        filledQty: nextFilled,
        avgFillPrice: nextAvgFill,
        status: nextFilled >= order.qty ? 'FILLED' : 'PARTIALLY_FILLED',
      },
    });
  }

  if (patches.length > 0) {
    ordersStore.updateManyOrders(patches);
  }
  if (newFills.length === 0) return;

  useFillsStore.getState().addManyFills(newFills);

  const positionsStore = usePositionsStore.getState();
  const current = positionsStore.positions;
  const byKey = new Map(current.map((position) => [positionKey(position.symbol, position.accountId), position] as const));

  const nextPositions: Position[] = [];
  const nextSnapshots: RiskSnapshot[] = [];

  for (const fill of newFills) {
    const key = positionKey(fill.symbol, fill.accountId);
    const nextPosition = updatePositionFromFill(byKey.get(key), fill);
    byKey.set(key, nextPosition);
    nextPositions.push(nextPosition);
    nextSnapshots.push(makeRiskSnapshot(nextPosition));
  }

  positionsStore.upsertManyPositions(nextPositions);
  useRiskStore.getState().setSnapshots([...nextSnapshots, ...useRiskStore.getState().snapshots].slice(0, 2000));
}

export function startStreaming(): void {
  if (tickIntervalId || executionIntervalId) return;

  useConnectionStore.getState().setConnected(true);

  tickIntervalId = setInterval(() => {
    const symbols = useWatchlistStore.getState().symbols;
    const ticksStore = useTicksStore.getState();

    const ticks = symbols.map((symbol) => {
      const prev = ticksStore.getTick(symbol);
      return generateTick(symbol, prev?.last);
    });

    ticksStore.mergeTicks(ticks);
    markToMarket(ticks);
    useConnectionStore.getState().setLatencyMs(jitterLatency());
  }, TICK_INTERVAL_MS);

  executionIntervalId = setInterval(() => {
    processOrderLifecycle();
  }, EXECUTION_INTERVAL_MS);
}

export function stopStreaming(): void {
  if (tickIntervalId) {
    clearInterval(tickIntervalId);
    tickIntervalId = null;
  }
  if (executionIntervalId) {
    clearInterval(executionIntervalId);
    executionIntervalId = null;
  }

  useConnectionStore.getState().setConnected(false);
}

export function isStreaming(): boolean {
  return tickIntervalId != null || executionIntervalId != null;
}