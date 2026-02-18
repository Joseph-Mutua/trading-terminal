import { useMemo, useCallback, useState, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef } from 'ag-grid-community';
import { usePositionsStore } from '../../stores/positionsStore';
import { useFillsStore } from '../../stores/fillsStore';
import type { Position, Fill } from '../../types';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import styles from './BlotterGrid.module.css';
import detailStyles from './PositionsGridDetail.module.css';

export function PositionsGrid() {
  const positions = usePositionsStore((s) => s.positions);
  const getFillsBySymbol = useFillsStore((s) => s.getFillsBySymbol);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const gridRef = useRef<AgGridReact<Position>>(null);

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

  const onSelectionChanged = useCallback(() => {
    const selected = gridRef.current?.api?.getSelectedRows() as Position[] | undefined;
    const sym = selected?.length ? selected[0].symbol : null;
    setSelectedSymbol(sym);
  }, []);

  const selectedPosition = selectedSymbol ? positions.find((p) => p.symbol === selectedSymbol) : null;
  const detailFills = selectedSymbol ? getFillsBySymbol(selectedSymbol) : [];

  return (
    <div className={detailStyles.positionsWrap}>
      <div className={`ag-theme-alpine ${styles.wrapper}`}>
        <AgGridReact<Position>
          ref={gridRef}
          rowData={positions}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          getRowId={getRowId}
          rowHeight={28}
          headerHeight={32}
          domLayout="normal"
          animateRows={false}
          rowSelection="single"
          onSelectionChanged={onSelectionChanged}
        />
      </div>
      {selectedPosition && (
        <div className={detailStyles.detail}>
          <div className={detailStyles.detailHeader}>
            <span className={detailStyles.detailTitle}>{selectedPosition.symbol} — Fills &amp; risk</span>
            <button type="button" className={detailStyles.closeBtn} onClick={() => setSelectedSymbol(null)} aria-label="Close">×</button>
          </div>
          <div className={detailStyles.riskRow}>
            <span>U/PnL</span>
            <span className={selectedPosition.unrealizedPnl >= 0 ? styles.positive : styles.negative}>{selectedPosition.unrealizedPnl.toFixed(2)}</span>
          </div>
          <div className={detailStyles.riskRow}>
            <span>R/PnL</span>
            <span className={selectedPosition.realizedPnl >= 0 ? styles.positive : styles.negative}>{selectedPosition.realizedPnl.toFixed(2)}</span>
          </div>
          <div className={detailStyles.fillsTitle}>Fills</div>
          <div className={detailStyles.fillsList}>
            {detailFills.length === 0 && <div className={detailStyles.fillsEmpty}>No fills for this position</div>}
            {detailFills.map((f: Fill) => (
              <div key={f.id} className={detailStyles.fillRow}>
                <span>{new Date(f.ts).toLocaleTimeString()}</span>
                <span className={f.side === 'BUY' ? detailStyles.fillSideBuy : detailStyles.fillSideSell}>{f.side}</span>
                <span>{f.price.toFixed(2)}</span>
                <span>{f.qty}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
