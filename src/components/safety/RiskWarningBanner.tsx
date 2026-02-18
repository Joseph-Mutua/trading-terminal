import { useMemo } from 'react';
import { usePositionsStore } from '../../stores/positionsStore';
import { useRiskStore } from '../../stores/riskStore';

const PNL_WARNING_THRESHOLD = -500;
const MARGIN_UTIL_WARNING_THRESHOLD = 0.82;

export function RiskWarningBanner() {
  const positions = usePositionsStore((state) => state.positions);
  const snapshots = useRiskStore((state) => state.snapshots);

  const { totalUnrealized, totalMarginUsed, totalMarginAvailable } = useMemo(() => {
    const latestByKey = new Map<string, { marginUsed: number; marginAvailable: number }>();
    for (const snapshot of snapshots) {
      const key = `${snapshot.accountId}:${snapshot.symbol}`;
      if (!latestByKey.has(key)) {
        latestByKey.set(key, {
          marginUsed: snapshot.marginUsed,
          marginAvailable: snapshot.marginAvailable,
        });
      }
    }

    const margin = Array.from(latestByKey.values()).reduce(
      (acc, item) => ({
        used: acc.used + item.marginUsed,
        available: acc.available + item.marginAvailable,
      }),
      { used: 0, available: 0 }
    );

    return {
      totalUnrealized: positions.reduce((sum, position) => sum + position.unrealizedPnl, 0),
      totalMarginUsed: margin.used,
      totalMarginAvailable: margin.available,
    };
  }, [positions, snapshots]);

  const marginDenominator = totalMarginUsed + totalMarginAvailable;
  const marginUtilization = marginDenominator > 0 ? totalMarginUsed / marginDenominator : 0;
  const showPnlWarning = totalUnrealized < PNL_WARNING_THRESHOLD;
  const showMarginWarning = marginUtilization > MARGIN_UTIL_WARNING_THRESHOLD;

  if (!showPnlWarning && !showMarginWarning) {
    return null;
  }

  return (
    <div role="alert" className="risk-banner">
      <span className="risk-banner-icon">!</span>
      <span>
        {showPnlWarning && `U-PnL ${totalUnrealized.toFixed(2)}.`}{' '}
        {showMarginWarning && `Margin utilization ${(marginUtilization * 100).toFixed(1)}%.`}{' '}
        Review exposure before placing new size.
      </span>
    </div>
  );
}