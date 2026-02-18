import type { SymbolTick, Order, Fill, Position, RiskSnapshot, OrderSide, OrderType } from '../types';

export const DEMO_ACCOUNTS = ['SIM-001', 'SIM-ALPHA'];
export const DEMO_STRATEGIES = ['MANUAL', 'INTRADAY', 'MEANREV'];

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
  return (Math.random() - 0.5) * 0.55;
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T;
}

export function generateTick(symbol: string, basePrice?: number): SymbolTick {
  const base = basePrice ?? BASE_PRICES[symbol] ?? 100;
  const last = Math.max(0.1, base + randomDelta());
  const spread = Math.max(0.01, last * 0.0004);
  const bid = last - spread / 2;
  const ask = last + spread / 2;
  const change = last - base;
  const changePct = base ? (change / base) * 100 : 0;

  return {
    symbol,
    bid,
    ask,
    last,
    change,
    changePct,
    volume: Math.floor(Math.random() * 2_000_000),
    ts: Date.now(),
  };
}

export function seedInitialTicks(symbols: string[]): SymbolTick[] {
  return symbols.map((symbol) => generateTick(symbol));
}

let seq = 0;

export function nextOrderId(): string {
  seq += 1;
  return `ord-${Date.now()}-${seq}`;
}

export function nextFillId(): string {
  seq += 1;
  return `fill-${Date.now()}-${seq}`;
}

interface CreateOrderArgs {
  symbol: string;
  side: OrderSide;
  qty: number;
  type: OrderType;
  limitPrice?: number;
  accountId?: string;
  strategyId?: string;
}

export function createOrder(args: CreateOrderArgs): Order {
  const now = Date.now();
  const accountId = args.accountId ?? DEMO_ACCOUNTS[0];
  const strategyId = args.strategyId ?? DEMO_STRATEGIES[0];
  const estPrice = args.limitPrice ?? BASE_PRICES[args.symbol] ?? 100;

  return {
    id: nextOrderId(),
    symbol: args.symbol,
    side: args.side,
    qty: args.qty,
    type: args.type,
    limitPrice: args.limitPrice,
    status: 'PENDING',
    filledQty: 0,
    createdAt: now,
    updatedAt: now,
    accountId,
    strategyId,
    estNotional: estPrice * args.qty,
    riskFlag: args.qty >= 2500 ? 'WARN' : 'OK',
  };
}

export function createFillFromOrder(order: Order, price: number, qty: number): Fill {
  return {
    id: nextFillId(),
    orderId: order.id,
    symbol: order.symbol,
    side: order.side,
    price,
    qty,
    ts: Date.now(),
    accountId: order.accountId,
    strategyId: order.strategyId,
    fee: Number((price * qty * 0.0002).toFixed(2)),
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
      accountId: 'SIM-001',
      strategyId: 'MANUAL',
      estNotional: 18_450,
      riskFlag: 'OK',
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
      accountId: 'SIM-ALPHA',
      strategyId: 'INTRADAY',
      estNotional: 20_740,
      riskFlag: 'OK',
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
      accountId: 'SIM-ALPHA',
      strategyId: 'INTRADAY',
      fee: 4.15,
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
      accountId: 'SIM-ALPHA',
      strategyId: 'INTRADAY',
      grossExposure: 20_740,
      marginUsed: 7_500,
      marginAvailable: 42_500,
      lastUpdated: now,
    },
    {
      symbol: 'AAPL',
      qty: 200,
      avgPrice: 183.2,
      unrealizedPnl: -45,
      realizedPnl: 120.5,
      accountId: 'SIM-001',
      strategyId: 'MANUAL',
      grossExposure: 36_640,
      marginUsed: 9_200,
      marginAvailable: 40_800,
      lastUpdated: now,
    },
  ];
}

export function seedDemoRiskSnapshots(): RiskSnapshot[] {
  const now = Date.now();
  return [
    {
      id: 'risk-demo-1',
      symbol: 'MSFT',
      accountId: 'SIM-ALPHA',
      marginUsed: 7_500,
      marginAvailable: 42_500,
      grossExposure: 20_740,
      valueAtRisk95: 438,
      ts: now,
    },
    {
      id: 'risk-demo-2',
      symbol: 'AAPL',
      accountId: 'SIM-001',
      marginUsed: 9_200,
      marginAvailable: 40_800,
      grossExposure: 36_640,
      valueAtRisk95: 512,
      ts: now,
    },
  ];
}

export function randomAccountId(): string {
  return randomFrom(DEMO_ACCOUNTS);
}

export function randomStrategyId(): string {
  return randomFrom(DEMO_STRATEGIES);
}