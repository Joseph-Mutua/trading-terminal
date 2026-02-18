import { useMemo } from 'react';
import { useSelectionStore } from '../../stores/selectionStore';
import { useWatchlistStore } from '../../stores/watchlistStore';
import { useTicksStore } from '../../stores/ticksStore';
import styles from './ChartPanel.module.css';

/** Placeholder chart: shows symbol and a simple SVG area. Replace with Lightweight Charts / TradingView when needed. */
export function ChartPanel() {
  const symbols = useWatchlistStore((s) => s.symbols);
  const selectedSymbol = useSelectionStore((s) => s.selectedSymbol);
  const symbol = selectedSymbol ?? symbols[0] ?? '—';
  const tick = useTicksStore((s) => s.getTick(symbol));

  const pathDStable = useMemo(() => {
    const points = 40;
    const width = 400;
    const height = 120;
    const arr: number[] = [];
    for (let i = 0; i <= points; i++) {
      const x = (i / points) * width;
      const y = height - 35 - Math.sin((i / points) * Math.PI) * 40;
      arr.push(x, y);
    }
    let d = `M ${arr[0]} ${arr[1]}`;
    for (let i = 2; i < arr.length; i += 2) {
      d += ` L ${arr[i]} ${arr[i + 1]}`;
    }
    return d;
  }, []);

  return (
    <div className={styles.chartPanel}>
      <div className={styles.chartHeader}>
        <span className={styles.symbol}>{symbol}</span>
        {tick != null && (
          <span className={styles.last}>
            {tick.last.toFixed(2)}
            <span className={tick.change >= 0 ? styles.positive : styles.negative}>
              {' '}{tick.change >= 0 ? '+' : ''}{tick.change.toFixed(2)} ({tick.changePct >= 0 ? '+' : ''}{tick.changePct.toFixed(2)}%)
            </span>
          </span>
        )}
      </div>
      <div className={styles.chartSvgWrap}>
        <svg className={styles.chartSvg} viewBox="0 0 400 140" preserveAspectRatio="none">
          <defs>
            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent, #00d4aa)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="var(--accent, #00d4aa)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d={pathDStable}
            fill="none"
            stroke="var(--accent, #00d4aa)"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={pathDStable + ` L 400 140 L 0 140 Z`}
            fill="url(#chartGrad)"
          />
        </svg>
      </div>
      <div className={styles.chartFooter}>
        <span>1D</span>
        <span>1W</span>
        <span className={styles.active}>1M</span>
      </div>
    </div>
  );
}
