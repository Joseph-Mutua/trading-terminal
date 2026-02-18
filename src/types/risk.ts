export interface RiskSnapshot {
  id: string;
  symbol: string;
  accountId: string;
  marginUsed: number;
  marginAvailable: number;
  grossExposure: number;
  valueAtRisk95: number;
  ts: number;
}
