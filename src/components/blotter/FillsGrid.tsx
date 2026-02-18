import { useMemo, useCallback, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef } from 'ag-grid-community';
import { useFillsStore } from '../../stores/fillsStore';
import type { Fill } from '../../types';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import styles from './BlotterGrid.module.css';

export function FillsGrid() {
  const fills = useFillsStore((s) => s.fills);
  const gridRef = useRef<AgGridReact<Fill>>(null);

  const columnDefs = useMemo<ColDef<Fill>[]>(
    () => [
      { field: 'id', headerName: 'ID', width: 140, filter: true },
      { field: 'orderId', headerName: 'Order', width: 140, filter: true },
      { field: 'symbol', headerName: 'Symbol', width: 88, filter: true },
      { field: 'side', headerName: 'Side', width: 72, filter: true, cellClass: (p) => (p.value === 'BUY' ? styles.buy : styles.sell) },
      { field: 'price', headerName: 'Price', width: 88, filter: 'agNumberColumnFilter', valueFormatter: (p) => (p.value != null ? (p.value as number).toFixed(2) : '—') },
      { field: 'qty', headerName: 'Qty', width: 80, filter: 'agNumberColumnFilter' },
      { field: 'ts', headerName: 'Time', width: 100, valueFormatter: (p) => (p.value != null ? new Date(p.value as number).toLocaleTimeString() : '—') },
    ],
    []
  );

  const defaultColDef = useMemo<ColDef<Fill>>(
    () => ({ sortable: true, resizable: true }),
    []
  );

  const getRowId = useCallback((params: { data: Fill }) => params.data.id, []);

  const onExport = useCallback(() => {
    gridRef.current?.api?.exportDataAsCsv({ fileName: `fills-${new Date().toISOString().slice(0, 10)}.csv` });
  }, []);

  return (
    <div className={styles.fillsWrap}>
      <div className={styles.toolbar}>
        <button type="button" className={styles.exportBtn} onClick={onExport}>
          Export CSV
        </button>
      </div>
      <div className={`ag-theme-alpine ${styles.wrapper}`}>
        <AgGridReact<Fill>
          ref={gridRef}
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
    </div>
  );
}
