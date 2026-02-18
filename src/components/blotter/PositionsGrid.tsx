import { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import type {
  ColDef,
  GridApi,
  GridReadyEvent,
  ColumnState,
} from 'ag-grid-community';
import { usePositionsStore } from '../../stores/positionsStore';
import { useFillsStore } from '../../stores/fillsStore';
import { useRiskStore } from '../../stores/riskStore';
import { useGridViewsStore } from '../../stores/gridViewsStore';
import type { Fill, Position, RiskSnapshot } from '../../types';
import styles from './BlotterGrid.module.css';

const GRID_ID = 'positions-grid';

interface PositionDetailRow {
  id: string;
  eventType: 'FILL' | 'RISK';
  time: number;
  side?: string;
  qty?: number;
  price?: number;
  fee?: number;
  marginUsed?: number;
  marginAvailable?: number;
  valueAtRisk95?: number;
}

function positionKey(position: Position): string {
  return `${position.symbol}:${position.accountId ?? 'default'}`;
}

function buildDetailRows(position: Position, fills: Fill[], snapshots: RiskSnapshot[]): PositionDetailRow[] {
  const positionFills = fills.filter(
    (fill) => fill.symbol === position.symbol && (fill.accountId ?? 'default') === (position.accountId ?? 'default')
  );
  const positionRisk = snapshots.filter(
    (snapshot) =>
      snapshot.symbol === position.symbol &&
      snapshot.accountId === (position.accountId ?? 'default')
  );

  const rows: PositionDetailRow[] = [
    ...positionFills.map((fill) => ({
      id: fill.id,
      eventType: 'FILL' as const,
      time: fill.ts,
      side: fill.side,
      qty: fill.qty,
      price: fill.price,
      fee: fill.fee,
    })),
    ...positionRisk.map((snapshot) => ({
      id: snapshot.id,
      eventType: 'RISK' as const,
      time: snapshot.ts,
      marginUsed: snapshot.marginUsed,
      marginAvailable: snapshot.marginAvailable,
      valueAtRisk95: snapshot.valueAtRisk95,
    })),
  ];

  rows.sort((left, right) => right.time - left.time);
  return rows;
}

export function PositionsGrid() {
  const positions = usePositionsStore((state) => state.positions);
  const fills = useFillsStore((state) => state.fills);
  const snapshots = useRiskStore((state) => state.snapshots);

  const apiRef = useRef<GridApi<Position> | null>(null);
  const saveView = useGridViewsStore((state) => state.saveView);
  const loadView = useGridViewsStore((state) => state.loadView);
  const [quickFilterText, setQuickFilterText] = useState('');

  const detailByPosition = useMemo(() => {
    const next = new Map<string, PositionDetailRow[]>();
    for (const position of positions) {
      next.set(positionKey(position), buildDetailRows(position, fills, snapshots));
    }
    return next;
  }, [fills, positions, snapshots]);

  const columnDefs = useMemo<ColDef<Position>[]>(
    () => [
      { field: 'accountId', headerName: 'Account', rowGroup: true, hide: true },
      { field: 'symbol', headerName: 'Symbol', rowGroup: true, hide: true },
      { field: 'strategyId', headerName: 'Strategy', width: 110, filter: 'agSetColumnFilter' },
      {
        field: 'qty',
        headerName: 'Qty',
        width: 92,
        valueFormatter: (params) => {
          const value = Number(params.value ?? 0);
          if (value === 0) return '0';
          return value > 0 ? `+${value}` : String(value);
        },
        cellClass: (params) =>
          params.data && params.data.qty < 0 ? styles.negative : params.data && params.data.qty > 0 ? styles.positive : '',
      },
      {
        field: 'avgPrice',
        headerName: 'Avg',
        width: 96,
        valueFormatter: (params) => (params.value != null ? Number(params.value).toFixed(2) : '-'),
      },
      {
        field: 'unrealizedPnl',
        headerName: 'U PnL',
        width: 104,
        valueFormatter: (params) => (params.value != null ? Number(params.value).toFixed(2) : '-'),
        cellClass: (params) =>
          params.data && params.data.unrealizedPnl < 0
            ? styles.negative
            : params.data && params.data.unrealizedPnl > 0
              ? styles.positive
              : '',
      },
      {
        field: 'realizedPnl',
        headerName: 'R PnL',
        width: 104,
        valueFormatter: (params) => (params.value != null ? Number(params.value).toFixed(2) : '-'),
        cellClass: (params) =>
          params.data && params.data.realizedPnl < 0
            ? styles.negative
            : params.data && params.data.realizedPnl > 0
              ? styles.positive
              : '',
      },
      {
        field: 'grossExposure',
        headerName: 'Exposure',
        width: 120,
        valueFormatter: (params) => (params.value != null ? Number(params.value).toFixed(0) : '-'),
      },
      {
        field: 'marginUsed',
        headerName: 'Mgn Used',
        width: 116,
        valueFormatter: (params) => (params.value != null ? Number(params.value).toFixed(0) : '-'),
      },
      {
        field: 'marginAvailable',
        headerName: 'Mgn Avail',
        width: 120,
        valueFormatter: (params) => (params.value != null ? Number(params.value).toFixed(0) : '-'),
      },
      {
        field: 'lastUpdated',
        headerName: 'Updated',
        width: 108,
        valueFormatter: (params) => (params.value != null ? new Date(params.value as number).toLocaleTimeString() : '-'),
      },
    ],
    []
  );

  const defaultColDef = useMemo<ColDef<Position>>(
    () => ({ sortable: true, resizable: true, filter: true }),
    []
  );

  const detailCellRendererParams = useMemo(
    () => ({
      detailGridOptions: {
        columnDefs: [
          { field: 'eventType', headerName: 'Type', width: 90 },
          {
            field: 'time',
            headerName: 'Time',
            width: 106,
            valueFormatter: (params: { value: number | null | undefined }) =>
              params.value != null ? new Date(params.value as number).toLocaleTimeString() : '-',
          },
          {
            field: 'side',
            headerName: 'Side',
            width: 84,
            cellClass: (params: { value?: string }) =>
              params.value === 'BUY' ? styles.buy : params.value === 'SELL' ? styles.sell : '',
          },
          { field: 'qty', headerName: 'Qty', width: 82 },
          {
            field: 'price',
            headerName: 'Price',
            width: 92,
            valueFormatter: (params: { value: number | null | undefined }) =>
              params.value != null ? Number(params.value).toFixed(2) : '-',
          },
          {
            field: 'fee',
            headerName: 'Fee',
            width: 84,
            valueFormatter: (params: { value: number | null | undefined }) =>
              params.value != null ? Number(params.value).toFixed(2) : '-',
          },
          {
            field: 'marginUsed',
            headerName: 'Mgn Used',
            width: 106,
            valueFormatter: (params: { value: number | null | undefined }) =>
              params.value != null ? Number(params.value).toFixed(0) : '-',
          },
          {
            field: 'marginAvailable',
            headerName: 'Mgn Avail',
            width: 112,
            valueFormatter: (params: { value: number | null | undefined }) =>
              params.value != null ? Number(params.value).toFixed(0) : '-',
          },
          {
            field: 'valueAtRisk95',
            headerName: 'VaR95',
            width: 90,
            valueFormatter: (params: { value: number | null | undefined }) =>
              params.value != null ? Number(params.value).toFixed(0) : '-',
          },
        ],
        defaultColDef: {
          sortable: true,
          resizable: true,
          filter: true,
        },
        rowHeight: 26,
        headerHeight: 30,
      },
      getDetailRowData: (params: { data: Position; successCallback: (rows: PositionDetailRow[]) => void }) => {
        const rows = detailByPosition.get(positionKey(params.data));
        params.successCallback(rows ?? []);
      },
    }),
    [detailByPosition]
  );

  const persistView = useCallback(() => {
    const api = apiRef.current;
    if (!api) return;

    saveView(GRID_ID, {
      columnState: api.getColumnState(),
      filterModel: api.getFilterModel(),
      quickFilterText,
    });
  }, [quickFilterText, saveView]);

  useEffect(() => {
    apiRef.current?.setGridOption('rowData', positions);
  }, [positions]);

  const onGridReady = useCallback(
    (event: GridReadyEvent<Position>) => {
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

  const onExport = useCallback(() => {
    apiRef.current?.exportDataAsCsv({ fileName: `positions-${new Date().toISOString().slice(0, 10)}.csv` });
  }, []);

  return (
    <div className={styles.fillsWrap}>
      <div className={styles.toolbar}>
        <input
          type="search"
          className={styles.searchInput}
          value={quickFilterText}
          placeholder="Filter positions"
          onChange={(event) => onQuickFilterChange(event.target.value)}
          aria-label="Filter positions"
        />
        <button type="button" className={styles.exportBtn} onClick={onExport}>
          Export CSV
        </button>
      </div>
      <div className={`ag-theme-quartz terminal-grid-theme ${styles.wrapper}`}>
        <AgGridReact<Position>
          rowData={positions}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          autoGroupColumnDef={{
            headerName: 'Account / Symbol',
            minWidth: 220,
            pinned: 'left',
          }}
          getRowId={(params) => `${params.data.accountId ?? 'default'}:${params.data.symbol}`}
          onGridReady={onGridReady}
          onColumnMoved={persistView}
          onColumnPinned={persistView}
          onColumnResized={persistView}
          onSortChanged={persistView}
          onFilterChanged={persistView}
          rowHeight={30}
          headerHeight={34}
          rowGroupPanelShow="always"
          groupDisplayType="multipleColumns"
          groupDefaultExpanded={1}
          animateRows={false}
          masterDetail={true}
          isRowMaster={(dataItem) => {
            if (!dataItem) return false;
            return (detailByPosition.get(positionKey(dataItem))?.length ?? 0) > 0;
          }}
          detailCellRendererParams={detailCellRendererParams}
          detailRowHeight={220}
        />
      </div>
    </div>
  );
}
