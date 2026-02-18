import { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import type {
  ColDef,
  GridReadyEvent,
  GridApi,
  ColumnState,
  IDatasource,
  IGetRowsParams,
} from 'ag-grid-community';
import { useFillsStore } from '../../stores/fillsStore';
import { useGridViewsStore } from '../../stores/gridViewsStore';
import type { Fill } from '../../types';
import styles from './BlotterGrid.module.css';

const GRID_ID = 'fills-grid';
const PAGE_SIZE = 75;

type FilterModel = Record<string, { filter?: string | number; values?: string[]; type?: string }>;

function applyFillFilters(rows: Fill[], filterModel: FilterModel, quickFilterText: string): Fill[] {
  const normalizedQuickFilter = quickFilterText.trim().toLowerCase();

  return rows.filter((fill) => {
    if (normalizedQuickFilter) {
      const haystack = [
        fill.id,
        fill.orderId,
        fill.symbol,
        fill.side,
        fill.accountId ?? '',
        fill.strategyId ?? '',
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(normalizedQuickFilter)) return false;
    }

    return Object.entries(filterModel).every(([field, model]) => {
      const value = fill[field as keyof Fill];

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

function applyFillSorts(rows: Fill[], sortModel: Array<{ colId: string; sort: 'asc' | 'desc' }>): Fill[] {
  if (sortModel.length === 0) {
    return [...rows].sort((a, b) => b.ts - a.ts);
  }

  const sorted = [...rows];
  sorted.sort((left, right) => {
    for (const sort of sortModel) {
      const leftValue = left[sort.colId as keyof Fill];
      const rightValue = right[sort.colId as keyof Fill];
      if (leftValue === rightValue) continue;
      const direction = sort.sort === 'asc' ? 1 : -1;
      return (leftValue ?? 0) > (rightValue ?? 0) ? direction : -direction;
    }
    return 0;
  });

  return sorted;
}

function queryFills(params: IGetRowsParams, quickFilterText: string): { rows: Fill[]; totalRows: number } {
  const snapshot = useFillsStore.getState().fills;
  const filtered = applyFillFilters(snapshot, params.filterModel as FilterModel, quickFilterText);
  const sorted = applyFillSorts(filtered, params.sortModel as Array<{ colId: string; sort: 'asc' | 'desc' }>);

  return {
    rows: sorted.slice(params.startRow, params.endRow),
    totalRows: sorted.length,
  };
}

export function FillsGrid() {
  const fills = useFillsStore((state) => state.fills);
  const apiRef = useRef<GridApi<Fill> | null>(null);

  const saveView = useGridViewsStore((state) => state.saveView);
  const loadView = useGridViewsStore((state) => state.loadView);
  const [quickFilterText, setQuickFilterText] = useState('');

  const columnDefs = useMemo<ColDef<Fill>[]>(
    () => [
      { field: 'id', headerName: 'ID', width: 180, pinned: 'left' },
      { field: 'orderId', headerName: 'Order', width: 180 },
      { field: 'symbol', headerName: 'Symbol', width: 96, pinned: 'left', filter: 'agTextColumnFilter' },
      {
        field: 'side',
        headerName: 'Side',
        width: 84,
        filter: 'agSetColumnFilter',
        cellClass: (params) => (params.value === 'BUY' ? styles.buy : styles.sell),
      },
      {
        field: 'price',
        headerName: 'Price',
        width: 96,
        filter: 'agNumberColumnFilter',
        valueFormatter: (params) => (params.value != null ? Number(params.value).toFixed(2) : '-'),
      },
      { field: 'qty', headerName: 'Qty', width: 92, filter: 'agNumberColumnFilter' },
      {
        field: 'fee',
        headerName: 'Fee',
        width: 92,
        filter: 'agNumberColumnFilter',
        valueFormatter: (params) => (params.value != null ? Number(params.value).toFixed(2) : '-'),
      },
      { field: 'accountId', headerName: 'Account', width: 110, filter: 'agSetColumnFilter' },
      { field: 'strategyId', headerName: 'Strategy', width: 110, filter: 'agSetColumnFilter' },
      {
        field: 'ts',
        headerName: 'Time',
        width: 110,
        pinned: 'left',
        valueFormatter: (params) => (params.value != null ? new Date(params.value as number).toLocaleTimeString() : '-'),
      },
    ],
    []
  );

  const defaultColDef = useMemo<ColDef<Fill>>(
    () => ({ sortable: true, resizable: true, filter: true }),
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
        const { rows, totalRows } = queryFills(params, quickFilterText);
        window.setTimeout(() => params.successCallback(rows, totalRows), 30);
      },
    };

    api.setGridOption('datasource', datasource);
  }, [quickFilterText]);

  useEffect(() => {
    apiRef.current?.refreshInfiniteCache();
  }, [fills, quickFilterText]);

  const onGridReady = useCallback(
    (event: GridReadyEvent<Fill>) => {
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

      event.api.setGridOption('paginationPageSize', saved?.pageSize ?? PAGE_SIZE);
      setDatasource();
      if (saved?.page && saved.page > 0) {
        event.api.paginationGoToPage(saved.page);
      }
    },
    [loadView, setDatasource]
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

  const onExport = useCallback(() => {
    apiRef.current?.exportDataAsCsv({ fileName: `fills-${new Date().toISOString().slice(0, 10)}.csv` });
  }, []);

  return (
    <div className={styles.fillsWrap}>
      <div className={styles.toolbar}>
        <input
          type="search"
          className={styles.searchInput}
          value={quickFilterText}
          placeholder="Filter fills"
          onChange={(event) => onQuickFilterChange(event.target.value)}
          aria-label="Filter fills"
        />
        <button type="button" className={styles.exportBtn} onClick={onExport}>
          Export CSV
        </button>
      </div>
      <div className={`ag-theme-quartz terminal-grid-theme ${styles.wrapper}`}>
        <AgGridReact<Fill>
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          onGridReady={onGridReady}
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