import { useMemo, useEffect, useRef, useState } from 'react';
import { useSelectionStore } from '../../stores/selectionStore';
import { useWatchlistStore } from '../../stores/watchlistStore';
import { useTicksStore } from '../../stores/ticksStore';
import styles from './ChartPanel.module.css';

type Timeframe = '1M' | '5M' | '15M';

const POINTS_BY_TIMEFRAME: Record<Timeframe, number> = {
  '1M': 40,
  '5M': 100,
  '15M': 180,
};

function buildPath(values: number[], width: number, height: number): string {
  if (values.length === 0) return '';

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(max - min, 0.0001);

  const points = values.map((value, index) => {
    const x = (index / Math.max(values.length - 1, 1)) * width;
    const y = height - ((value - min) / span) * (height - 12) - 6;
    return [x, y] as const;
  });

  return points.reduce((path, [x, y], index) => {
    if (index === 0) return `M ${x} ${y}`;
    return `${path} L ${x} ${y}`;
  }, '');
}

export function ChartPanel() {
  const symbols = useWatchlistStore((state) => state.symbols);
  const selectedSymbol = useSelectionStore((state) => state.selectedSymbol);
  const symbol = selectedSymbol ?? symbols[0] ?? '-';
  const tick = useTicksStore((state) => state.getTick(symbol));

  const historyRef = useRef<Record<string, number[]>>({});
  const [timeframe, setTimeframe] = useState<Timeframe>('5M');
  const [series, setSeries] = useState<number[]>([]);

  useEffect(() => {
    setSeries(historyRef.current[symbol] ?? []);
  }, [symbol]);

  useEffect(() => {
    if (!tick) return;

    const prev = historyRef.current[symbol] ?? [];
    const next = [...prev, tick.last].slice(-260);
    historyRef.current[symbol] = next;
    setSeries(next);
  }, [symbol, tick?.last, tick?.ts]);

  const visibleSeries = useMemo(
    () => series.slice(-POINTS_BY_TIMEFRAME[timeframe]),
    [series, timeframe]
  );

  const pathD = useMemo(() => buildPath(visibleSeries, 400, 160), [visibleSeries]);
  const areaD = pathD ? `${pathD} L 400 160 L 0 160 Z` : '';

  const stats = useMemo(() => {
    if (visibleSeries.length === 0) {
      return { high: 0, low: 0, range: 0 };
    }
    const high = Math.max(...visibleSeries);
    const low = Math.min(...visibleSeries);
    return {
      high,
      low,
      range: high - low,
    };
  }, [visibleSeries]);

  return (
    <div className={styles.chartPanel}>
      <div className={styles.chartHeader}>
        <div className={styles.symbolBlock}>
          <span className={styles.symbol}>{symbol}</span>
          {tick != null && (
            <span className={styles.last}>
              {tick.last.toFixed(2)}
              <span className={tick.change >= 0 ? styles.positive : styles.negative}>
                {' '}
                {tick.change >= 0 ? '+' : ''}
                {tick.change.toFixed(2)} ({tick.changePct >= 0 ? '+' : ''}
                {tick.changePct.toFixed(2)}%)
              </span>
            </span>
          )}
        </div>
        <div className={styles.statBlock}>
          <span>H {stats.high ? stats.high.toFixed(2) : '-'}</span>
          <span>L {stats.low ? stats.low.toFixed(2) : '-'}</span>
          <span>R {stats.range ? stats.range.toFixed(2) : '-'}</span>
        </div>
      </div>

      <div className={styles.chartSvgWrap}>
        <svg className={styles.chartSvg} viewBox="0 0 400 160" preserveAspectRatio="none">
          <defs>
            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {pathD && (
            <>
              <path d={pathD} fill="none" stroke="var(--accent)" strokeWidth="1.7" vectorEffect="non-scaling-stroke" />
              <path d={areaD} fill="url(#chartGrad)" />
            </>
          )}
        </svg>
      </div>

      <div className={styles.chartFooter}>
        {(['1M', '5M', '15M'] as Timeframe[]).map((entry) => (
          <button
            key={entry}
            type="button"
            className={entry === timeframe ? styles.timeframeActive : styles.timeframeBtn}
            onClick={() => setTimeframe(entry)}
          >
            {entry}
          </button>
        ))}
      </div>
    </div>
  );
}