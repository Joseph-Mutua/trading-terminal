import { useMemo, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef } from 'ag-grid-community';
import { useFillsStore } from '../../stores/fillsStore';
import type { Fill } from '../../types';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import styles from './BlotterGrid.module.css';

export function FillsGrid() {
  const fills = useFillsStore((s) => s.fills);

  const columnDefs = useMemo<ColDef<Fill>[]>(
    () => [
      { field: 'id', headerName: 'ID', width: 140 },
      { field: 'orderId', headerName: 'Order', width: 140 },
      { field: 'symbol', headerName: 'Symbol', width: 88, filter: true },
      { field: 'side', headerName: 'Side', width: 72, cellClass: (p) => (p.value === 'BUY' ? styles.buy : styles.sell) },
      { field: 'price', headerName: 'Price', width: 88, valueFormatter: (p) => (p.value != null ? (p.value as number).toFixed(2) : '—') },
      { field: 'qty', headerName: 'Qty', width: 80 },
      { field: 'ts', headerName: 'Time', width: 100, valueFormatter: (p) => (p.value != null ? new Date(p.value as number).toLocaleTimeString() : '—') },
    ],
    []
  );

  const defaultColDef = useMemo<ColDef<Fill>>(
    () => ({ sortable: true, resizable: true }),
    []
  );

  const getRowId = useCallback((params: { data: Fill }) => params.data.id, []);

  return (
    <div className={`ag-theme-alpine ${styles.wrapper}`}>
      <AgGridReact<Fill>
        rowData={fills}
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
