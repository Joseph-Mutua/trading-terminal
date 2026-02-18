import { usePositionsStore } from '../../stores/positionsStore';

const RISK_THRESHOLD = -500;

export function RiskWarningBanner() {
  const positions = usePositionsStore((s) => s.positions);
  const totalUnrealized = positions.reduce((sum, p) => sum + p.unrealizedPnl, 0);
  const show = totalUnrealized < RISK_THRESHOLD;

  if (!show) return null;

  return (
    <div role="alert" className="risk-banner">
      <span className="risk-banner-icon">⚠</span>
      <span>
        Total unrealized PnL: <strong>{totalUnrealized.toFixed(2)}</strong> — consider reducing exposure.
      </span>
    </div>
  );
}
