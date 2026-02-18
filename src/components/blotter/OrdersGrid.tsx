import { useMemo, useCallback, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef, GridReadyEvent, ColumnState } from 'ag-grid-community';
import { useOrdersStore } from '../../stores/ordersStore';
import type { Order } from '../../types';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import styles from './BlotterGrid.module.css';

const ORDERS_VIEW_KEY = 'trading-terminal-orders-view';

export function OrdersGrid() {
  const orders = useOrdersStore((s) => s.orders);
  const gridRef = useRef<AgGridReact<Order>>(null);

  const onGridReady = useCallback((e: GridReadyEvent<Order>) => {
    try {
      const saved = localStorage.getItem(ORDERS_VIEW_KEY);
      if (saved) {
        const state = JSON.parse(saved) as { columnState?: ColumnState[] };
        if (state.columnState?.length) e.api.applyColumnState({ state: state.columnState });
      }
    } catch {
      /* ignore */
    }
  }, []);

  const saveView = useCallback(() => {
    const api = gridRef.current?.api;
    if (!api) return;
    try {
      const columnState = api.getColumnState();
      localStorage.setItem(ORDERS_VIEW_KEY, JSON.stringify({ columnState }));
    } catch {
      /* ignore */
    }
  }, []);

  const columnDefs = useMemo<ColDef<Order>[]>(
    () => [
      { field: 'id', headerName: 'ID', width: 140, flex: 0 },
      { field: 'symbol', headerName: 'Symbol', width: 88, filter: true },
      { field: 'side', headerName: 'Side', width: 72, filter: true, cellClass: (p) => (p.value === 'BUY' ? styles.buy : styles.sell) },
      { field: 'qty', headerName: 'Qty', width: 80, type: 'numericColumn', filter: 'agNumberColumnFilter' },
      { field: 'type', headerName: 'Type', width: 76, filter: true },
      { field: 'limitPrice', headerName: 'Limit', width: 88, valueFormatter: (p) => (p.value != null ? (p.value as number).toFixed(2) : '—') },
      { field: 'status', headerName: 'Status', width: 100, filter: true },
      { field: 'filledQty', headerName: 'Filled', width: 80 },
      { field: 'avgFillPrice', headerName: 'Avg', width: 80, valueFormatter: (p) => (p.value != null ? (p.value as number).toFixed(2) : '—') },
      { field: 'createdAt', headerName: 'Created', width: 100, valueFormatter: (p) => (p.value != null ? new Date(p.value as number).toLocaleTimeString() : '—') },
    ],
    []
  );

  const defaultColDef = useMemo<ColDef<Order>>(
    () => ({ sortable: true, resizable: true }),
    []
  );

  const getRowId = useCallback((params: { data: Order }) => params.data.id, []);

  return (
    <div className={`ag-theme-alpine ${styles.wrapper}`}>
      <AgGridReact<Order>
        ref={gridRef}
        rowData={orders}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        getRowId={getRowId}
        rowHeight={28}
        headerHeight={32}
        domLayout="normal"
        animateRows={false}
        suppressCellFocus={false}
        onGridReady={onGridReady}
        onColumnMoved={saveView}
        onColumnResized={saveView}
        onSortChanged={saveView}
      />
    </div>
  );
}
