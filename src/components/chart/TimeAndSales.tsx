import { useRef, useEffect, useState, useMemo } from 'react';
import { useSelectionStore } from '../../stores/selectionStore';
import { useWatchlistStore } from '../../stores/watchlistStore';
import { useTicksStore } from '../../stores/ticksStore';
import { useFillsStore } from '../../stores/fillsStore';
import styles from './TimeAndSales.module.css';

interface TapeRow {
  id: string;
  ts: number;
  price: number;
  qty: number;
  side: 'BUY' | 'SELL';
  source: 'TICK' | 'FILL';
}

const MAX_ROWS = 60;

export function TimeAndSales() {
  const symbols = useWatchlistStore((state) => state.symbols);
  const selectedSymbol = useSelectionStore((state) => state.selectedSymbol);
  const symbol = selectedSymbol ?? symbols[0] ?? '';
  const tick = useTicksStore((state) => state.getTick(symbol));
  const fills = useFillsStore((state) => state.fills);

  const [syntheticRows, setSyntheticRows] = useState<TapeRow[]>([]);
  const idRef = useRef(0);
  const lastTsRef = useRef(0);

  useEffect(() => {
    setSyntheticRows([]);
  }, [symbol]);

  useEffect(() => {
    if (!tick) return;
    const now = Date.now();
    if (now - lastTsRef.current < 300) return;
    lastTsRef.current = now;

    const side: 'BUY' | 'SELL' = tick.change >= 0 ? 'BUY' : 'SELL';
    const qty = Math.floor(Math.random() * 180) + 20;
    const row: TapeRow = {
      id: `tas-${symbol}-${++idRef.current}`,
      ts: now,
      price: tick.last,
      qty,
      side,
      source: 'TICK',
    };

    setSyntheticRows((prev) => [row, ...prev].slice(0, MAX_ROWS));
  }, [symbol, tick?.change, tick?.last, tick?.ts]);

  const fillRows = useMemo(
    () =>
      fills
        .filter((fill) => fill.symbol === symbol)
        .slice(0, MAX_ROWS)
        .map<TapeRow>((fill) => ({
          id: fill.id,
          ts: fill.ts,
          price: fill.price,
          qty: fill.qty,
          side: fill.side,
          source: 'FILL',
        })),
    [fills, symbol]
  );

  const rows = useMemo(() => {
    const merged = [...fillRows, ...syntheticRows];
    merged.sort((left, right) => right.ts - left.ts);
    return merged.slice(0, MAX_ROWS);
  }, [fillRows, syntheticRows]);

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <span>Time</span>
        <span>Price</span>
        <span>Qty</span>
        <span>Src</span>
      </div>
      <div className={styles.list}>
        {rows.length === 0 && <div className={styles.empty}>No prints for {symbol}</div>}
        {rows.map((row) => (
          <div key={row.id} className={styles.row}>
            <span className={styles.time}>{new Date(row.ts).toTimeString().slice(0, 8)}</span>
            <span className={styles.price}>{row.price.toFixed(2)}</span>
            <span className={row.side === 'BUY' ? styles.buy : styles.sell}>{row.qty}</span>
            <span className={styles.source}>{row.source}</span>
          </div>
        ))}
      </div>
    </div>
  );
}