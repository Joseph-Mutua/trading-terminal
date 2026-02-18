import { useMemo, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef } from 'ag-grid-community';
import { usePositionsStore } from '../../stores/positionsStore';
import type { Position } from '../../types';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import styles from './BlotterGrid.module.css';

export function PositionsGrid() {
  const positions = usePositionsStore((s) => s.positions);

  const columnDefs = useMemo<ColDef<Position>[]>(
    () => [
      { field: 'symbol', headerName: 'Symbol', width: 88, filter: true },
      { field: 'qty', headerName: 'Qty', width: 88, valueFormatter: (p) => (p.value != null && p.value !== 0 ? (p.value > 0 ? '+' + p.value : String(p.value)) : '0'), cellClass: (p) => (p.data && p.data.qty < 0 ? styles.sell : p.data && p.data.qty > 0 ? styles.buy : '') },
      { field: 'avgPrice', headerName: 'Avg', width: 88, valueFormatter: (p) => (p.value != null ? (p.value as number).toFixed(2) : '—') },
      { field: 'unrealizedPnl', headerName: 'U/PnL', width: 92, valueFormatter: (p) => (p.value != null ? (p.value as number).toFixed(2) : '—'), cellClass: (p) => (p.data && p.data.unrealizedPnl < 0 ? styles.negative : p.data && p.data.unrealizedPnl > 0 ? styles.positive : '') },
      { field: 'realizedPnl', headerName: 'R/PnL', width: 92, valueFormatter: (p) => (p.value != null ? (p.value as number).toFixed(2) : '—'), cellClass: (p) => (p.data && p.data.realizedPnl < 0 ? styles.negative : p.data && p.data.realizedPnl > 0 ? styles.positive : '') },
      { field: 'lastUpdated', headerName: 'Updated', width: 100, valueFormatter: (p) => (p.value != null ? new Date(p.value as number).toLocaleTimeString() : '—') },
    ],
    []
  );

  const defaultColDef = useMemo<ColDef<Position>>(
    () => ({ sortable: true, resizable: true }),
    []
  );

  const getRowId = useCallback((params: { data: Position }) => params.data.symbol, []);

  return (
    <div className={`ag-theme-alpine ${styles.wrapper}`}>
      <AgGridReact<Position>
        rowData={positions}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        getRowId={getRowId}
        rowHeight={28}
        headerHeight={32}
        domLayout="normal"
        animateRows={false}
      />
    </div>
  );
}
