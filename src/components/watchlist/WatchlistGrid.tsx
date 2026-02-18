import { useRef, useEffect, useMemo, useCallback, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import type {
  GridReadyEvent,
  GridApi,
  ColDef,
  ColumnState,
  CellValueChangedEvent,
  RowClickedEvent,
  CellKeyDownEvent,
} from 'ag-grid-community';
import { useWatchlistStore } from '../../stores/watchlistStore';
import { useTicksStore } from '../../stores/ticksStore';
import { usePositionsStore } from '../../stores/positionsStore';
import { useSelectionStore } from '../../stores/selectionStore';
import { useGridViewsStore } from '../../stores/gridViewsStore';
import styles from './WatchlistGrid.module.css';

const GRID_ID = 'watchlist-grid';
const TICK_UPDATE_MS = 80;

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
  getTick: (symbol: string) =>
    | {
        last: number;
        change: number;
        changePct: number;
        bid: number;
        ask: number;
        volume: number;
      }
    | undefined,
  getPosition: (symbol: string) => number
): WatchlistRow[] {
  return symbols.map((symbol) => {
    const tick = getTick(symbol);
    return {
      symbol,
      last: tick?.last ?? 0,
      change: tick?.change ?? 0,
      changePct: tick?.changePct ?? 0,
      bid: tick?.bid ?? 0,
      ask: tick?.ask ?? 0,
      volume: tick?.volume ?? 0,
      position: getPosition(symbol),
    };
  });
}

const defaultColDef: ColDef<WatchlistRow> = {
  sortable: true,
  resizable: true,
  filter: true,
  suppressMovable: false,
  enableCellChangeFlash: true,
};

export function WatchlistGrid() {
  const apiRef = useRef<GridApi<WatchlistRow> | null>(null);

  const symbols = useWatchlistStore((state) => state.symbols);
  const renameSymbol = useWatchlistStore((state) => state.renameSymbol);
  const getTick = useTicksStore((state) => state.getTick);
  const positions = usePositionsStore((state) => state.positions);
  const setSelectedSymbol = useSelectionStore((state) => state.setSelectedSymbol);
  const saveView = useGridViewsStore((state) => state.saveView);
  const loadView = useGridViewsStore((state) => state.loadView);
  const [quickFilterText, setQuickFilterText] = useState('');

  const getPosition = useCallback(
    (symbol: string) =>
      positions
        .filter((position) => position.symbol === symbol)
        .reduce((sum, position) => sum + position.qty, 0),
    [positions]
  );

  const [rowData, setRowData] = useState<WatchlistRow[]>(() => buildRows(symbols, getTick, getPosition));

  const columnDefs = useMemo<ColDef<WatchlistRow>[]>(
    () => [
      {
        field: 'symbol',
        headerName: 'Symbol',
        pinned: 'left',
        width: 100,
        editable: true,
        valueParser: (params) => String(params.newValue ?? '').toUpperCase().trim(),
      },
      {
        field: 'last',
        headerName: 'Last',
        pinned: 'left',
        width: 92,
        valueFormatter: (params) => (params.value != null ? (params.value as number).toFixed(2) : '-'),
      },
      {
        field: 'change',
        headerName: 'Chg',
        pinned: 'left',
        width: 86,
        valueFormatter: (params) => {
          if (params.value == null) return '-';
          const value = params.value as number;
          return `${value >= 0 ? '+' : ''}${value.toFixed(2)}`;
        },
        cellClass: (params) =>
          params.data && params.data.change < 0 ? styles.negative : params.data && params.data.change > 0 ? styles.positive : '',
      },
      {
        field: 'changePct',
        headerName: 'Chg %',
        width: 92,
        valueFormatter: (params) => {
          if (params.value == null) return '-';
          const value = params.value as number;
          return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
        },
        cellClass: (params) =>
          params.data && params.data.changePct < 0 ? styles.negative : params.data && params.data.changePct > 0 ? styles.positive : '',
      },
      {
        field: 'position',
        headerName: 'Pos',
        pinned: 'left',
        width: 84,
        valueFormatter: (params) => {
          const value = Number(params.value ?? 0);
          if (value === 0) return '0';
          return value > 0 ? `+${value}` : String(value);
        },
        cellClass: (params) =>
          params.data && params.data.position < 0 ? styles.negative : params.data && params.data.position > 0 ? styles.positive : '',
      },
      {
        field: 'bid',
        headerName: 'Bid',
        width: 90,
        valueFormatter: (params) => (params.value != null ? (params.value as number).toFixed(2) : '-'),
      },
      {
        field: 'ask',
        headerName: 'Ask',
        width: 90,
        valueFormatter: (params) => (params.value != null ? (params.value as number).toFixed(2) : '-'),
      },
      {
        field: 'volume',
        headerName: 'Vol',
        width: 98,
        valueFormatter: (params) => (params.value != null ? `${((params.value as number) / 1000).toFixed(1)}k` : '-'),
      },
    ],
    []
  );

  const persistGridState = useCallback(() => {
    const api = apiRef.current;
    if (!api) return;

    saveView(GRID_ID, {
      columnState: api.getColumnState(),
      filterModel: api.getFilterModel(),
      quickFilterText,
    });
  }, [quickFilterText, saveView]);

  useEffect(() => {
    setRowData(buildRows(symbols, getTick, getPosition));
  }, [symbols, getTick, getPosition]);

  useEffect(() => {
    if (symbols.length === 0) return;

    const intervalId = setInterval(() => {
      const symbolList = useWatchlistStore.getState().symbols;
      const tickState = useTicksStore.getState();
      const positionState = usePositionsStore.getState().positions;
      const getPositionQty = (symbol: string) =>
        positionState
          .filter((position) => position.symbol === symbol)
          .reduce((sum, position) => sum + position.qty, 0);

      apiRef.current?.applyTransactionAsync({
        update: buildRows(symbolList, tickState.getTick, getPositionQty),
      });
    }, TICK_UPDATE_MS);

    return () => clearInterval(intervalId);
  }, [symbols.length]);

  const onGridReady = useCallback(
    (event: GridReadyEvent<WatchlistRow>) => {
      apiRef.current = event.api;

      const saved = loadView(GRID_ID);
      if (saved?.columnState) {
        event.api.applyColumnState({ state: saved.columnState as ColumnState[] });
      }
      if (saved?.filterModel) {
        event.api.setFilterModel(saved.filterModel);
      }
      if (saved?.quickFilterText) {
        setQuickFilterText(saved.quickFilterText);
        event.api.setGridOption('quickFilterText', saved.quickFilterText);
      }
    },
    [loadView]
  );

  const onCellValueChanged = useCallback(
    (event: CellValueChangedEvent<WatchlistRow>) => {
      if (event.colDef.field !== 'symbol') return;
      const oldSymbol = String(event.oldValue ?? '').trim().toUpperCase();
      const newSymbol = String(event.newValue ?? '').trim().toUpperCase();
      if (!oldSymbol || !newSymbol || oldSymbol === newSymbol) return;
      renameSymbol(oldSymbol, newSymbol);
      persistGridState();
    },
    [persistGridState, renameSymbol]
  );

  const onRowClicked = useCallback(
    (event: RowClickedEvent<WatchlistRow>) => {
      if (!event.data?.symbol) return;
      setSelectedSymbol(event.data.symbol);
    },
    [setSelectedSymbol]
  );

  const onCellKeyDown = useCallback(
    (event: CellKeyDownEvent<WatchlistRow>) => {
      const keyboardEvent = event.event as KeyboardEvent;
      if (keyboardEvent.key !== 'Enter') return;
      const symbol = event.data?.symbol;
      if (!symbol) return;

      setSelectedSymbol(symbol);
      window.dispatchEvent(
        new CustomEvent('terminal:open-order-ticket', {
          detail: { symbol },
        })
      );
    },
    [setSelectedSymbol]
  );

  const onQuickFilterChange = useCallback(
    (value: string) => {
      setQuickFilterText(value);
      apiRef.current?.setGridOption('quickFilterText', value);
      saveView(GRID_ID, {
        ...(loadView(GRID_ID) ?? {}),
        quickFilterText: value,
      });
    },
    [loadView, saveView]
  );

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <input
          type="search"
          className={styles.searchInput}
          value={quickFilterText}
          placeholder="Filter symbols"
          onChange={(event) => onQuickFilterChange(event.target.value)}
          aria-label="Filter watchlist"
        />
      </div>
      <div className={`ag-theme-quartz terminal-grid-theme ${styles.wrapper}`}>
        <AgGridReact<WatchlistRow>
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          getRowId={(params) => params.data.symbol}
          onGridReady={onGridReady}
          onCellValueChanged={onCellValueChanged}
          onRowClicked={onRowClicked}
          onCellKeyDown={onCellKeyDown}
          onColumnMoved={persistGridState}
          onColumnPinned={persistGridState}
          onColumnResized={persistGridState}
          onSortChanged={persistGridState}
          onFilterChanged={persistGridState}
          rowHeight={30}
          headerHeight={34}
          domLayout="normal"
          animateRows={false}
          suppressAnimationFrame={true}
          rowSelection="single"
          cellFlashDuration={220}
          asyncTransactionWaitMillis={40}
        />
      </div>
    </div>
  );
}
