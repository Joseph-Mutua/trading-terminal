import { useRef, useEffect, useMemo, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import type { GridReadyEvent, GridApi, ColDef } from 'ag-grid-community';
import { useWatchlistStore } from '../../stores/watchlistStore';
import { useTicksStore } from '../../stores/ticksStore';
import { usePositionsStore } from '../../stores/positionsStore';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import styles from './WatchlistGrid.module.css';

const TICK_UPDATE_MS = 100;

export interface WatchlistRow {
  symbol: string;
  last: number;
  change: number;
  changePct: number;
  bid: number;
  ask: number;
  volume: number;
  position: number;
}

function buildRows(
  symbols: string[],
  getTick: (s: string) => { last: number; change: number; changePct: number; bid: number; ask: number; volume: number } | undefined,
  getPosition: (s: string) => number
): WatchlistRow[] {
  return symbols.map((symbol) => {
    const tick = getTick(symbol);
    const position = getPosition(symbol);
    return {
      symbol,
      last: tick?.last ?? 0,
      change: tick?.change ?? 0,
      changePct: tick?.changePct ?? 0,
      bid: tick?.bid ?? 0,
      ask: tick?.ask ?? 0,
      volume: tick?.volume ?? 0,
      position,
    };
  });
}

const defaultColDef: ColDef<WatchlistRow> = {
  sortable: true,
  resizable: true,
  suppressMovable: false,
};

export function WatchlistGrid() {
  const gridRef = useRef<AgGridReact<WatchlistRow>>(null);
  const apiRef = useRef<GridApi<WatchlistRow> | null>(null);

  const symbols = useWatchlistStore((s) => s.symbols);
  const getTick = useTicksStore((s) => s.getTick);
  const positions = usePositionsStore((s) => s.positions);
  const getPosition = useCallback(
    (symbol: string) => positions.find((p) => p.symbol === symbol)?.qty ?? 0,
    [positions]
  );

  const columnDefs = useMemo<ColDef<WatchlistRow>[]>(
    () => [
      { field: 'symbol', headerName: 'Symbol', pinned: 'left', width: 88, flex: 0 },
      { field: 'last', headerName: 'Last', pinned: 'left', width: 82, flex: 0, valueFormatter: (p) => (p.value != null ? (p.value as number).toFixed(2) : '—') },
      { field: 'change', headerName: 'Chg', width: 72, flex: 0, valueFormatter: (p) => (p.value != null ? (p.value as number) >= 0 ? '+' + (p.value as number).toFixed(2) : (p.value as number).toFixed(2) : '—'), cellClass: (p) => p.data && p.data.change < 0 ? styles.negative : p.data && p.data.change > 0 ? styles.positive : '' },
      { field: 'changePct', headerName: '%', width: 56, flex: 0, valueFormatter: (p) => (p.value != null ? ((p.value as number) >= 0 ? '+' : '') + (p.value as number).toFixed(2) + '%' : '—'), cellClass: (p) => p.data && p.data.changePct < 0 ? styles.negative : p.data && p.data.changePct > 0 ? styles.positive : '' },
      { field: 'position', headerName: 'Pos', pinned: 'left', width: 72, flex: 0, valueFormatter: (p) => (p.value === 0 ? '0' : (p.value as number) > 0 ? '+' + p.value : String(p.value)), cellClass: (p) => p.data && p.data.position < 0 ? styles.negative : p.data && p.data.position > 0 ? styles.positive : '' },
      { field: 'bid', headerName: 'Bid', width: 72, valueFormatter: (p) => (p.value != null ? (p.value as number).toFixed(2) : '—') },
      { field: 'ask', headerName: 'Ask', width: 72, valueFormatter: (p) => (p.value != null ? (p.value as number).toFixed(2) : '—') },
      { field: 'volume', headerName: 'Vol', width: 90, valueFormatter: (p) => (p.value != null ? ((p.value as number) / 1000).toFixed(1) + 'k' : '—') },
    ],
    []
  );

  const rowData = useMemo(
    () => buildRows(symbols, getTick, getPosition),
    [symbols, getTick, getPosition]
  );

  useEffect(() => {
    if (symbols.length === 0) return;
    const id = setInterval(() => {
      const syms = useWatchlistStore.getState().symbols;
      const gt = useTicksStore.getState().getTick;
      const posList = usePositionsStore.getState().positions;
      const gp = (s: string) => posList.find((p) => p.symbol === s)?.qty ?? 0;
      const rows = buildRows(syms, gt, gp);
      apiRef.current?.applyTransactionAsync({ update: rows });
    }, TICK_UPDATE_MS);
    return () => clearInterval(id);
  }, [symbols.length]);

  const onGridReady = useCallback((e: GridReadyEvent<WatchlistRow>) => {
    apiRef.current = e.api;
  }, []);

  return (
    <div className={`ag-theme-alpine ${styles.wrapper}`}>
      <AgGridReact<WatchlistRow>
        ref={gridRef}
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        getRowId={(params) => params.data.symbol}
        onGridReady={onGridReady}
        suppressCellFocus={false}
        rowHeight={28}
        headerHeight={32}
        domLayout="normal"
        animateRows={false}
        suppressAnimationFrame={true}
      />
    </div>
  );
}
