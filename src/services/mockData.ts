import type { SymbolTick, Order, Fill, Position } from '../types';

const BASE_PRICES: Record<string, number> = {
  AAPL: 185,
  MSFT: 415,
  GOOGL: 172,
  AMZN: 178,
  META: 485,
  NVDA: 138,
  TSLA: 248,
};

function randomDelta(): number {
  return (Math.random() - 0.5) * 0.5;
}

export function generateTick(symbol: string, basePrice?: number): SymbolTick {
  const base = basePrice ?? BASE_PRICES[symbol] ?? 100;
  const last = base + randomDelta();
  const spread = 0.01;
  const bid = last - spread / 2;
  const ask = last + spread / 2;
  const prev = base;
  const change = last - prev;
  const changePct = prev ? (change / prev) * 100 : 0;
  return {
    symbol,
    bid,
    ask,
    last,
    change,
    changePct,
    volume: Math.floor(Math.random() * 1_000_000),
    ts: Date.now(),
  };
}

export function seedInitialTicks(symbols: string[]): SymbolTick[] {
  return symbols.map((s) => generateTick(s));
}

let tickId = 0;
export function nextOrderId(): string {
  return `ord-${Date.now()}-${++tickId}`;
}

export function nextFillId(): string {
  return `fill-${Date.now()}-${++tickId}`;
}

export function createOrder(
  symbol: string,
  side: 'BUY' | 'SELL',
  qty: number,
  type: 'MARKET' | 'LIMIT',
  limitPrice?: number
): Order {
  const now = Date.now();
  return {
    id: nextOrderId(),
    symbol,
    side,
    qty,
    type,
    limitPrice,
    status: 'PENDING',
    filledQty: 0,
    createdAt: now,
    updatedAt: now,
  };
}

export function createFillFromOrder(
  order: Order,
  price: number,
  qty: number
): Fill {
  return {
    id: nextFillId(),
    orderId: order.id,
    symbol: order.symbol,
    side: order.side,
    price,
    qty,
    ts: Date.now(),
  };
}

export function seedDemoOrders(): Order[] {
  const now = Date.now();
  return [
    {
      id: 'ord-demo-1',
      symbol: 'AAPL',
      side: 'BUY',
      qty: 100,
      type: 'LIMIT',
      limitPrice: 184.5,
      status: 'LIVE',
      filledQty: 0,
      createdAt: now - 60_000,
      updatedAt: now,
    },
    {
      id: 'ord-demo-2',
      symbol: 'MSFT',
      side: 'SELL',
      qty: 50,
      type: 'MARKET',
      status: 'FILLED',
      filledQty: 50,
      avgFillPrice: 414.8,
      createdAt: now - 120_000,
      updatedAt: now - 119_500,
    },
  ];
}

export function seedDemoFills(): Fill[] {
  return [
    {
      id: 'fill-demo-1',
      orderId: 'ord-demo-2',
      symbol: 'MSFT',
      side: 'SELL',
      price: 414.8,
      qty: 50,
      ts: Date.now() - 119_500,
    },
  ];
}

export function seedDemoPositions(): Position[] {
  const now = Date.now();
  return [
    {
      symbol: 'MSFT',
      qty: -50,
      avgPrice: 414.8,
      unrealizedPnl: 12.5,
      realizedPnl: 0,
      lastUpdated: now,
    },
    {
      symbol: 'AAPL',
      qty: 200,
      avgPrice: 183.2,
      unrealizedPnl: -45.0,
      realizedPnl: 120.5,
      lastUpdated: now,
    },
  ];
}
