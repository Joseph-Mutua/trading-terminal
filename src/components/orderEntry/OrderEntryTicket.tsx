import { useState, useCallback, useEffect } from 'react';
import { useTicksStore } from '../../stores/ticksStore';
import { useWatchlistStore } from '../../stores/watchlistStore';
import { useSelectionStore } from '../../stores/selectionStore';
import { useOrdersStore } from '../../stores/ordersStore';
import { createOrder } from '../../services';
import type { OrderSide, OrderType } from '../../types';
import styles from './OrderEntryTicket.module.css';

const LARGE_ORDER_THRESHOLD = 1000;

export function OrderEntryTicket() {
  const symbols = useWatchlistStore((s) => s.symbols);
  const selectedSymbol = useSelectionStore((s) => s.selectedSymbol);
  const setSelectedSymbol = useSelectionStore((s) => s.setSelectedSymbol);
  const symbol = selectedSymbol ?? symbols[0] ?? '';
  useEffect(() => {
    if (!selectedSymbol && symbols[0]) {
      setSelectedSymbol(symbols[0]);
    }
  }, [symbols[0], selectedSymbol, setSelectedSymbol]);

  const tick = useTicksStore((s) => s.getTick(symbol));
  const addOrder = useOrdersStore((s) => s.addOrder);

  const [side, setSide] = useState<OrderSide>('BUY');
  const [qty, setQty] = useState('');
  const [orderType, setOrderType] = useState<OrderType>('MARKET');
  const [limitPrice, setLimitPrice] = useState('');
  const [confirmLarge, setConfirmLarge] = useState(false);

  const qtyNum = parseInt(qty, 10) || 0;
  const limitNum = limitPrice ? parseFloat(limitPrice) : undefined;
  const isLarge = qtyNum >= LARGE_ORDER_THRESHOLD;
  const needConfirm = isLarge && !confirmLarge;

  const handleSubmit = useCallback(() => {
    if (!symbol || !qtyNum) return;
    if (needConfirm) {
      setConfirmLarge(true);
      return;
    }
    const order = createOrder(symbol, side, qtyNum, orderType, orderType === 'LIMIT' ? limitNum : undefined);
    addOrder(order);
    setQty('');
    setLimitPrice('');
    setConfirmLarge(false);
  }, [symbol, side, qtyNum, orderType, limitNum, needConfirm, addOrder]);

  const handleCancelConfirm = useCallback(() => {
    setConfirmLarge(false);
  }, []);

  return (
    <div className={styles.ticket}>
      <div className={styles.section}>
        <label className={styles.label}>Symbol</label>
        <select
          className={styles.select}
          value={symbol}
          onChange={(e) => setSelectedSymbol(e.target.value || null)}
          aria-label="Symbol"
        >
          {symbols.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className={styles.section}>
        <label className={styles.label}>Side</label>
        <div className={styles.sideGroup}>
          <button
            type="button"
            className={`${styles.sideBtn} ${side === 'BUY' ? styles.sideBuy : ''}`}
            onClick={() => setSide('BUY')}
          >
            Buy
          </button>
          <button
            type="button"
            className={`${styles.sideBtn} ${side === 'SELL' ? styles.sideSell : ''}`}
            onClick={() => setSide('SELL')}
          >
            Sell
          </button>
        </div>
      </div>

      <div className={styles.section}>
        <label className={styles.label}>Quantity</label>
        <input
          type="number"
          className={styles.input}
          min={1}
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          placeholder="0"
          aria-label="Quantity"
        />
      </div>

      <div className={styles.section}>
        <label className={styles.label}>Type</label>
        <select
          className={styles.select}
          value={orderType}
          onChange={(e) => setOrderType(e.target.value as OrderType)}
          aria-label="Order type"
        >
          <option value="MARKET">Market</option>
          <option value="LIMIT">Limit</option>
        </select>
      </div>

      {orderType === 'LIMIT' && (
        <div className={styles.section}>
          <label className={styles.label}>Limit price</label>
          <input
            type="number"
            className={styles.input}
            step="0.01"
            value={limitPrice}
            onChange={(e) => setLimitPrice(e.target.value)}
            placeholder={tick ? tick.last.toFixed(2) : '0.00'}
            aria-label="Limit price"
          />
        </div>
      )}

      {needConfirm && (
        <div className={styles.confirmBanner}>
          <span>Large order ({qtyNum}): confirm to submit</span>
          <div className={styles.confirmActions}>
            <button type="button" className={styles.btnSecondary} onClick={handleCancelConfirm}>Cancel</button>
            <button type="button" className={styles.btnPrimary} onClick={handleSubmit}>Confirm</button>
          </div>
        </div>
      )}

      {!needConfirm && (
        <button
          type="button"
          className={styles.submitBtn}
          onClick={handleSubmit}
          disabled={!symbol || !qtyNum || (orderType === 'LIMIT' && !limitNum)}
        >
          {side} {qtyNum || '…'} {symbol || '…'}
        </button>
      )}

      {/* Level-1 stats */}
      <div className={styles.level1}>
        <div className={styles.level1Title}>Level 1</div>
        <div className={styles.level1Grid}>
          <div className={styles.level1Row}>
            <span className={styles.level1Label}>Bid</span>
            <span className={styles.level1Value}>{tick ? tick.bid.toFixed(2) : '—'}</span>
          </div>
          <div className={styles.level1Row}>
            <span className={styles.level1Label}>Ask</span>
            <span className={styles.level1Value}>{tick ? tick.ask.toFixed(2) : '—'}</span>
          </div>
          <div className={styles.level1Row}>
            <span className={styles.level1Label}>Last</span>
            <span className={styles.level1Value}>{tick ? tick.last.toFixed(2) : '—'}</span>
          </div>
          <div className={styles.level1Row}>
            <span className={styles.level1Label}>Vol</span>
            <span className={styles.level1Value}>{tick ? (tick.volume / 1000).toFixed(1) + 'k' : '—'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
