export interface Fill {
  id: string;
  orderId: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  price: number;
  qty: number;
  ts: number;
}
