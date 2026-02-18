import { useRef, useEffect, useState } from 'react';
import { useSelectionStore } from '../../stores/selectionStore';
import { useWatchlistStore } from '../../stores/watchlistStore';
import { useTicksStore } from '../../stores/ticksStore';
import styles from './TimeAndSales.module.css';

interface TradeRow {
  id: string;
  time: string;
  price: number;
  qty: number;
  side: 'BUY' | 'SELL';
}

const MAX_ROWS = 50;

export function TimeAndSales() {
  const symbols = useWatchlistStore((s) => s.symbols);
  const selectedSymbol = useSelectionStore((s) => s.selectedSymbol);
  const symbol = selectedSymbol ?? symbols[0] ?? '';
  const tick = useTicksStore((s) => s.getTick(symbol));
  const [trades, setTrades] = useState<TradeRow[]>([]);
  const idRef = useRef(0);
  const lastTsRef = useRef(0);

  useEffect(() => {
    if (!tick) return;
    const now = Date.now();
    if (now - lastTsRef.current < 400) return;
    lastTsRef.current = now;
    const timeStr = new Date().toTimeString().slice(0, 8);
    const side: 'BUY' | 'SELL' = Math.random() > 0.5 ? 'BUY' : 'SELL';
    const qty = Math.floor(Math.random() * 200) + 10;
    const row: TradeRow = {
      id: `tas-${++idRef.current}`,
      time: timeStr,
      price: tick.last,
      qty,
      side,
    };
    setTrades((prev) => [row, ...prev].slice(0, MAX_ROWS));
  }, [tick?.last, tick?.ts, symbol]);

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <span>Time</span>
        <span>Price</span>
        <span>Qty</span>
      </div>
      <div className={styles.list}>
        {trades.length === 0 && (
          <div className={styles.empty}>No trades yet for {symbol}</div>
        )}
        {trades.map((row) => (
          <div key={row.id} className={styles.row}>
            <span className={styles.time}>{row.time}</span>
            <span className={styles.price}>{row.price.toFixed(2)}</span>
            <span className={row.side === 'BUY' ? styles.buy : styles.sell}>
              {row.qty}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
