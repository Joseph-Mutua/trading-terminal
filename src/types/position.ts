export interface Position {
  symbol: string;
  qty: number;
  avgPrice: number;
  unrealizedPnl: number;
  realizedPnl: number;
  accountId?: string;
  strategyId?: string;
  grossExposure?: number;
  marginUsed?: number;
  marginAvailable?: number;
  lastUpdated: number;
}
