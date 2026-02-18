import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useTicksStore } from '../../stores/ticksStore';
import { useWatchlistStore } from '../../stores/watchlistStore';
import { useSelectionStore } from '../../stores/selectionStore';
import { useOrdersStore } from '../../stores/ordersStore';
import { usePositionsStore } from '../../stores/positionsStore';
import { useRiskStore } from '../../stores/riskStore';
import { createOrder } from '../../services';
import type { OrderSide, OrderType } from '../../types';
import styles from './OrderEntryTicket.module.css';

const LARGE_ORDER_THRESHOLD = 1000;
const NOTIONAL_WARNING_THRESHOLD = 120_000;
const VAR_WARNING_THRESHOLD = 1_100;

const STRATEGIES = ['MANUAL', 'INTRADAY', 'MEANREV'];

export function OrderEntryTicket() {
  const symbols = useWatchlistStore((state) => state.symbols);
  const selectedSymbol = useSelectionStore((state) => state.selectedSymbol);
  const setSelectedSymbol = useSelectionStore((state) => state.setSelectedSymbol);
  const symbol = selectedSymbol ?? symbols[0] ?? '';

  const tick = useTicksStore((state) => state.getTick(symbol));
  const addOrder = useOrdersStore((state) => state.addOrder);
  const orders = useOrdersStore((state) => state.orders);
  const positions = usePositionsStore((state) => state.positions);
  const riskSnapshots = useRiskStore((state) => state.snapshots);

  const qtyInputRef = useRef<HTMLInputElement>(null);

  const [side, setSide] = useState<OrderSide>('BUY');
  const [qty, setQty] = useState('');
  const [orderType, setOrderType] = useState<OrderType>('MARKET');
  const [limitPrice, setLimitPrice] = useState('');
  const [accountId, setAccountId] = useState('SIM-001');
  const [strategyId, setStrategyId] = useState('MANUAL');
  const [confirmLarge, setConfirmLarge] = useState(false);
  const [riskOverride, setRiskOverride] = useState(false);

  const accountOptions = useMemo(() => {
    const fromPositions = positions.map((position) => position.accountId).filter((value): value is string => Boolean(value));
    const fromOrders = orders.map((order) => order.accountId).filter((value): value is string => Boolean(value));
    const next = new Set<string>(['SIM-001', ...fromPositions, ...fromOrders]);
    return Array.from(next);
  }, [orders, positions]);

  const qtyNum = Number.parseInt(qty, 10) || 0;
  const limitNum = limitPrice ? Number.parseFloat(limitPrice) : undefined;
  const referencePrice = orderType === 'LIMIT' ? limitNum ?? tick?.last ?? 0 : tick?.last ?? 0;
  const estNotional = qtyNum * referencePrice;

  const latestSnapshot = useMemo(
    () =>
      riskSnapshots.find(
        (snapshot) => snapshot.symbol === symbol && snapshot.accountId === accountId
      ),
    [accountId, riskSnapshots, symbol]
  );

  const marginAvailable = latestSnapshot?.marginAvailable ?? 50_000;
  const breachesMargin = marginAvailable > 0 && estNotional > marginAvailable * 0.9;
  const varWarning = (latestSnapshot?.valueAtRisk95 ?? 0) >= VAR_WARNING_THRESHOLD;
  const isLarge = qtyNum >= LARGE_ORDER_THRESHOLD;
  const highNotional = estNotional >= NOTIONAL_WARNING_THRESHOLD;
  const requiresConfirm = isLarge || highNotional;
  const showRiskWarning = breachesMargin || varWarning;

  useEffect(() => {
    if (!selectedSymbol && symbols[0]) {
      setSelectedSymbol(symbols[0]);
    }
  }, [selectedSymbol, setSelectedSymbol, symbols]);

  useEffect(() => {
    const onOpenOrderTicket = (event: Event) => {
      const requestedSymbol = (event as CustomEvent<{ symbol?: string }>).detail?.symbol;
      if (requestedSymbol) {
        setSelectedSymbol(requestedSymbol);
      }
      window.setTimeout(() => qtyInputRef.current?.focus(), 0);
    };

    window.addEventListener('terminal:open-order-ticket', onOpenOrderTicket);
    return () => window.removeEventListener('terminal:open-order-ticket', onOpenOrderTicket);
  }, [setSelectedSymbol]);

  useEffect(() => {
    setConfirmLarge(false);
    setRiskOverride(false);
  }, [qty, limitPrice, side, symbol, accountId]);

  const canSendOrder =
    Boolean(symbol) &&
    qtyNum > 0 &&
    (orderType === 'MARKET' || (limitNum != null && limitNum > 0)) &&
    (!requiresConfirm || confirmLarge) &&
    (!breachesMargin || riskOverride);

  const handleSubmit = useCallback(() => {
    if (!symbol || !qtyNum) return;

    if (requiresConfirm && !confirmLarge) {
      setConfirmLarge(true);
      return;
    }
    if (breachesMargin && !riskOverride) {
      return;
    }

    const order = createOrder({
      symbol,
      side,
      qty: qtyNum,
      type: orderType,
      limitPrice: orderType === 'LIMIT' ? limitNum : undefined,
      accountId,
      strategyId,
    });

    addOrder(order);
    setQty('');
    setLimitPrice('');
    setConfirmLarge(false);
    setRiskOverride(false);
  }, [
    accountId,
    addOrder,
    breachesMargin,
    confirmLarge,
    limitNum,
    orderType,
    qtyNum,
    requiresConfirm,
    riskOverride,
    side,
    strategyId,
    symbol,
  ]);

  return (
    <div className={styles.ticket}>
      <div className={styles.inlineGrid}>
        <div className={styles.section}>
          <label className={styles.label}>Symbol</label>
          <select
            className={styles.select}
            value={symbol}
            onChange={(event) => setSelectedSymbol(event.target.value || null)}
            aria-label="Symbol"
          >
            {symbols.map((entry) => (
              <option key={entry} value={entry}>
                {entry}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.section}>
          <label className={styles.label}>Account</label>
          <select
            className={styles.select}
            value={accountId}
            onChange={(event) => setAccountId(event.target.value)}
            aria-label="Account"
          >
            {accountOptions.map((entry) => (
              <option key={entry} value={entry}>
                {entry}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.section}>
        <label className={styles.label}>Strategy</label>
        <select
          className={styles.select}
          value={strategyId}
          onChange={(event) => setStrategyId(event.target.value)}
          aria-label="Strategy"
        >
          {STRATEGIES.map((entry) => (
            <option key={entry} value={entry}>
              {entry}
            </option>
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

      <div className={styles.inlineGrid}>
        <div className={styles.section}>
          <label className={styles.label}>Quantity</label>
          <input
            ref={qtyInputRef}
            type="number"
            className={styles.input}
            min={1}
            value={qty}
            onChange={(event) => setQty(event.target.value)}
            placeholder="0"
            aria-label="Quantity"
          />
        </div>

        <div className={styles.section}>
          <label className={styles.label}>Type</label>
          <select
            className={styles.select}
            value={orderType}
            onChange={(event) => setOrderType(event.target.value as OrderType)}
            aria-label="Order type"
          >
            <option value="MARKET">Market</option>
            <option value="LIMIT">Limit</option>
          </select>
        </div>
      </div>

      {orderType === 'LIMIT' && (
        <div className={styles.section}>
          <label className={styles.label}>Limit price</label>
          <input
            type="number"
            className={styles.input}
            step="0.01"
            value={limitPrice}
            onChange={(event) => setLimitPrice(event.target.value)}
            placeholder={tick ? tick.last.toFixed(2) : '0.00'}
            aria-label="Limit price"
          />
        </div>
      )}

      <div className={styles.metricsRow}>
        <span>Notional</span>
        <strong>{estNotional > 0 ? `$${estNotional.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '-'}</strong>
      </div>

      {requiresConfirm && !confirmLarge && (
        <div className={styles.confirmBanner}>
          <div>Large ticket detected. Confirm before submit.</div>
          <div className={styles.confirmActions}>
            <button type="button" className={styles.btnSecondary} onClick={() => setConfirmLarge(false)}>
              Cancel
            </button>
            <button type="button" className={styles.btnPrimary} onClick={() => setConfirmLarge(true)}>
              Confirm
            </button>
          </div>
        </div>
      )}

      {showRiskWarning && (
        <div className={styles.riskBanner}>
          <div className={styles.riskTitle}>Risk warning</div>
          {breachesMargin && (
            <div className={styles.riskLine}>Estimated notional exceeds 90% of available margin.</div>
          )}
          {varWarning && (
            <div className={styles.riskLine}>Current VaR95 is elevated for this symbol/account.</div>
          )}
          {breachesMargin && (
            <label className={styles.overrideLabel}>
              <input
                type="checkbox"
                checked={riskOverride}
                onChange={(event) => setRiskOverride(event.target.checked)}
              />
              Override margin warning
            </label>
          )}
        </div>
      )}

      <button
        type="button"
        className={styles.submitBtn}
        onClick={handleSubmit}
        disabled={!canSendOrder}
      >
        {side} {qtyNum || '-'} {symbol || '-'}
      </button>

      <div className={styles.level1}>
        <div className={styles.level1Title}>Level 1</div>
        <div className={styles.level1Grid}>
          <div className={styles.level1Row}>
            <span className={styles.level1Label}>Bid</span>
            <span className={styles.level1Value}>{tick ? tick.bid.toFixed(2) : '-'}</span>
          </div>
          <div className={styles.level1Row}>
            <span className={styles.level1Label}>Ask</span>
            <span className={styles.level1Value}>{tick ? tick.ask.toFixed(2) : '-'}</span>
          </div>
          <div className={styles.level1Row}>
            <span className={styles.level1Label}>Last</span>
            <span className={styles.level1Value}>{tick ? tick.last.toFixed(2) : '-'}</span>
          </div>
          <div className={styles.level1Row}>
            <span className={styles.level1Label}>Vol</span>
            <span className={styles.level1Value}>{tick ? `${(tick.volume / 1000).toFixed(1)}k` : '-'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}