export interface SymbolTick {
  symbol: string;
  bid: number;
  ask: number;
  last: number;
  change: number;
  changePct: number;
  volume: number;
  ts: number;
}
