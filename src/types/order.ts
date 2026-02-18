export type OrderSide = 'BUY' | 'SELL';
export type OrderType = 'MARKET' | 'LIMIT';
export type OrderStatus =
  | 'PENDING'
  | 'LIVE'
  | 'PARTIALLY_FILLED'
  | 'FILLED'
  | 'CANCELLED'
  | 'REJECTED';

export interface Order {
  id: string;
  symbol: string;
  side: OrderSide;
  qty: number;
  type: OrderType;
  limitPrice?: number;
  status: OrderStatus;
  filledQty: number;
  avgFillPrice?: number;
  createdAt: number;
  updatedAt: number;
  accountId?: string;
  strategyId?: string;
  estNotional?: number;
  riskFlag?: 'OK' | 'WARN' | 'BLOCKED';
}
