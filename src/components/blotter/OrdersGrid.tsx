import { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import type {
  ColDef,
  GridReadyEvent,
  ColumnState,
  GridApi,
  IDatasource,
  IGetRowsParams,
  CellValueChangedEvent,
} from 'ag-grid-community';
import { useOrdersStore } from '../../stores/ordersStore';
import { useGridViewsStore } from '../../stores/gridViewsStore';
import type { Order } from '../../types';
import styles from './BlotterGrid.module.css';

const GRID_ID = 'orders-grid';
const PAGE_SIZE = 50;

type FilterModel = Record<string, { filter?: string | number; values?: string[]; type?: string }>;

function applyOrderFilters(rows: Order[], filterModel: FilterModel, quickFilterText: string): Order[] {
  const normalizedQuickFilter = quickFilterText.trim().toLowerCase();

  return rows.filter((order) => {
    if (normalizedQuickFilter) {
      const haystack = [
        order.id,
        order.symbol,
        order.side,
        order.status,
        order.accountId ?? '',
        order.strategyId ?? '',
      ]
        .join(' ')
        .toLowerCase();

      if (!haystack.includes(normalizedQuickFilter)) {
        return false;
      }
    }

    return Object.entries(filterModel).every(([field, model]) => {
      const value = order[field as keyof Order];
      if (model.values?.length) {
        return model.values.includes(String(value ?? ''));
      }
      if (model.filter == null || model.filter === '') {
        return true;
      }

      if (typeof value === 'number') {
        const target = Number(model.filter);
        if (Number.isNaN(target)) return true;
        if (model.type === 'greaterThan') return value > target;
        if (model.type === 'lessThan') return value < target;
        return value === target;
      }

      return String(value ?? '').toLowerCase().includes(String(model.filter).toLowerCase());
    });
  });
}

function applyOrderSorts(rows: Order[], sortModel: Array<{ colId: string; sort: 'asc' | 'desc' }>): Order[] {
  if (sortModel.length === 0) {
    return [...rows].sort((a, b) => b.createdAt - a.createdAt);
  }

  const sorted = [...rows];
  sorted.sort((left, right) => {
    for (const sort of sortModel) {
      const leftValue = left[sort.colId as keyof Order];
      const rightValue = right[sort.colId as keyof Order];

      if (leftValue === rightValue) continue;
      const direction = sort.sort === 'asc' ? 1 : -1;
      return (leftValue ?? 0) > (rightValue ?? 0) ? direction : -direction;
    }
    return 0;
  });

  return sorted;
}

function queryOrders(params: IGetRowsParams, quickFilterText: string): { rows: Order[]; totalRows: number } {
  const snapshot = useOrdersStore.getState().orders;
  const filtered = applyOrderFilters(snapshot, params.filterModel as FilterModel, quickFilterText);
  const sorted = applyOrderSorts(filtered, params.sortModel as Array<{ colId: string; sort: 'asc' | 'desc' }>);

  return {
    rows: sorted.slice(params.startRow, params.endRow),
    totalRows: sorted.length,
  };
}

export function OrdersGrid() {
  const orders = useOrdersStore((state) => state.orders);
  const updateOrder = useOrdersStore((state) => state.updateOrder);

  const apiRef = useRef<GridApi<Order> | null>(null);
  const saveView = useGridViewsStore((state) => state.saveView);
  const loadView = useGridViewsStore((state) => state.loadView);
  const [quickFilterText, setQuickFilterText] = useState('');

  const columnDefs = useMemo<ColDef<Order>[]>(
    () => [
      { field: 'id', headerName: 'ID', width: 170, pinned: 'left' },
      { field: 'symbol', headerName: 'Symbol', width: 96, pinned: 'left', filter: 'agTextColumnFilter' },
      {
        field: 'side',
        headerName: 'Side',
        width: 86,
        filter: 'agSetColumnFilter',
        cellClass: (params) => (params.value === 'BUY' ? styles.buy : styles.sell),
      },
      {
        field: 'qty',
        headerName: 'Qty',
        width: 90,
        editable: (params) =>
          params.data != null && (params.data.status === 'PENDING' || params.data.status === 'LIVE'),
        valueParser: (params) => Math.max(1, Number(params.newValue) || Number(params.oldValue) || 1),
        filter: 'agNumberColumnFilter',
      },
      { field: 'type', headerName: 'Type', width: 90, filter: 'agSetColumnFilter' },
      {
        field: 'limitPrice',
        headerName: 'Limit',
        width: 100,
        editable: (params) =>
          params.data != null && params.data.type === 'LIMIT' && params.data.status !== 'FILLED',
        valueParser: (params) => {
          const parsed = Number(params.newValue);
          return Number.isFinite(parsed) ? parsed : params.oldValue;
        },
        valueFormatter: (params) => (params.value != null ? (params.value as number).toFixed(2) : '-'),
      },
      {
        field: 'status',
        headerName: 'Status',
        width: 136,
        filter: 'agSetColumnFilter',
        pinned: 'left',
      },
      {
        field: 'riskFlag',
        headerName: 'Risk',
        width: 96,
        filter: 'agSetColumnFilter',
        cellClass: (params) =>
          params.value === 'WARN' ? styles.warning : params.value === 'BLOCKED' ? styles.negative : '',
      },
      { field: 'accountId', headerName: 'Account', width: 112, filter: 'agSetColumnFilter' },
      { field: 'strategyId', headerName: 'Strategy', width: 116, filter: 'agSetColumnFilter' },
      { field: 'filledQty', headerName: 'Filled', width: 92, filter: 'agNumberColumnFilter' },
      {
        field: 'avgFillPrice',
        headerName: 'Avg Fill',
        width: 104,
        valueFormatter: (params) => (params.value != null ? (params.value as number).toFixed(2) : '-'),
      },
      {
        field: 'estNotional',
        headerName: 'Notional',
        width: 118,
        valueFormatter: (params) =>
          params.value != null ? `$${Number(params.value).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '-',
      },
      {
        field: 'createdAt',
        headerName: 'Created',
        width: 108,
        valueFormatter: (params) => (params.value != null ? new Date(params.value as number).toLocaleTimeString() : '-'),
      },
    ],
    []
  );

  const defaultColDef = useMemo<ColDef<Order>>(
    () => ({ sortable: true, resizable: true, filter: true, enableCellChangeFlash: true }),
    []
  );

  const persistView = useCallback(() => {
    const api = apiRef.current;
    if (!api) return;

    saveView(GRID_ID, {
      columnState: api.getColumnState(),
      filterModel: api.getFilterModel(),
      quickFilterText,
      page: api.paginationGetCurrentPage(),
      pageSize: api.paginationGetPageSize(),
    });
  }, [quickFilterText, saveView]);

  const setDatasource = useCallback(() => {
    const api = apiRef.current;
    if (!api) return;

    const datasource: IDatasource = {
      rowCount: undefined,
      getRows: (params) => {
        const { rows, totalRows } = queryOrders(params, quickFilterText);
        window.setTimeout(() => {
          params.successCallback(rows, totalRows);
        }, 40);
      },
    };

    api.setGridOption('datasource', datasource);
  }, [quickFilterText]);

  useEffect(() => {
    apiRef.current?.refreshInfiniteCache();
  }, [orders, quickFilterText]);

  const onGridReady = useCallback(
    (event: GridReadyEvent<Order>) => {
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
      }

      const pageSize = saved?.pageSize ?? PAGE_SIZE;
      event.api.setGridOption('paginationPageSize', pageSize);
      setDatasource();

      if (saved?.page && saved.page > 0) {
        event.api.paginationGoToPage(saved.page);
      }
    },
    [loadView, setDatasource]
  );

  const onCellValueChanged = useCallback(
    (event: CellValueChangedEvent<Order>) => {
      const field = event.colDef.field;
      const order = event.data;
      if (!field || !order) return;

      if (field === 'qty') {
        const qty = Number(event.newValue);
        if (!Number.isFinite(qty) || qty <= 0) return;
        const estPrice = order.limitPrice ?? order.avgFillPrice ?? 0;
        updateOrder(order.id, {
          qty,
          estNotional: estPrice > 0 ? qty * estPrice : order.estNotional,
          riskFlag: qty >= 2500 ? 'WARN' : 'OK',
        });
        return;
      }

      if (field === 'limitPrice') {
        const limitPrice = Number(event.newValue);
        if (!Number.isFinite(limitPrice) || limitPrice <= 0) return;
        updateOrder(order.id, {
          limitPrice,
          estNotional: limitPrice * order.qty,
        });
      }
    },
    [updateOrder]
  );

  const onQuickFilterChange = useCallback(
    (value: string) => {
      setQuickFilterText(value);
      setDatasource();
      saveView(GRID_ID, {
        ...(loadView(GRID_ID) ?? {}),
        quickFilterText: value,
      });
    },
    [loadView, saveView, setDatasource]
  );

  const exportCsv = useCallback(() => {
    apiRef.current?.exportDataAsCsv({
      fileName: `orders-${new Date().toISOString().slice(0, 10)}.csv`,
    });
  }, []);

  return (
    <div className={styles.fillsWrap}>
      <div className={styles.toolbar}>
        <input
          type="search"
          className={styles.searchInput}
          value={quickFilterText}
          onChange={(event) => onQuickFilterChange(event.target.value)}
          placeholder="Filter orders"
          aria-label="Filter orders"
        />
        <button type="button" className={styles.exportBtn} onClick={exportCsv}>
          Export CSV
        </button>
      </div>
      <div className={`ag-theme-quartz terminal-grid-theme ${styles.wrapper}`}>
        <AgGridReact<Order>
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          onGridReady={onGridReady}
          onCellValueChanged={onCellValueChanged}
          onColumnMoved={persistView}
          onColumnPinned={persistView}
          onColumnResized={persistView}
          onSortChanged={persistView}
          onFilterChanged={persistView}
          onPaginationChanged={persistView}
          rowModelType="infinite"
          cacheBlockSize={PAGE_SIZE}
          maxBlocksInCache={4}
          pagination={true}
          paginationPageSize={PAGE_SIZE}
          rowHeight={30}
          headerHeight={34}
          animateRows={false}
        />
      </div>
    </div>
  );
}
