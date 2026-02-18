export interface Position {
  symbol: string;
  qty: number;
  avgPrice: number;
  unrealizedPnl: number;
  realizedPnl: number;
  accountId?: string;
  lastUpdated: number;
}
