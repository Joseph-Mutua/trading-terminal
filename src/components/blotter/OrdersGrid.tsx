import { useMemo, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef } from 'ag-grid-community';
import { useOrdersStore } from '../../stores/ordersStore';
import type { Order } from '../../types';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import styles from './BlotterGrid.module.css';

export function OrdersGrid() {
  const orders = useOrdersStore((s) => s.orders);

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
        rowData={orders}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        getRowId={getRowId}
        rowHeight={28}
        headerHeight={32}
        domLayout="normal"
        animateRows={false}
        suppressCellFocus={false}
      />
    </div>
  );
}
