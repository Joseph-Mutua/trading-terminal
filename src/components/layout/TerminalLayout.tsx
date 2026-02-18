import { Group, Panel, Separator } from 'react-resizable-panels';
import { TopBar } from '../topbar/TopBar';
import { WatchlistGrid } from '../watchlist/WatchlistGrid';
import { OrderEntryTicket } from '../orderEntry/OrderEntryTicket';
import { ChartPanel } from '../chart/ChartPanel';
import { TimeAndSales } from '../chart/TimeAndSales';
import { Blotter } from '../blotter/Blotter';
import { RiskWarningBanner } from '../safety/RiskWarningBanner';
import styles from './TerminalLayout.module.css';

export function TerminalLayout() {
  return (
    <div className={styles.terminal}>
      <TopBar />
      <RiskWarningBanner />

      {/* Main content: vertical split (content area | blotter) */}
      <div className={styles.mainContent}>
        <Group orientation="vertical">
          <Panel defaultSize={70} minSize={40} className={styles.contentArea}>
            <Group orientation="horizontal" className={styles.panelGroup}>
              {/* Left: Watchlist - pixel min for readability */}
              <Panel defaultSize={22} minSize="200px" maxSize={35} className={styles.panel}>
                <div className={styles.panelContent}>
                  <div className={styles.panelLabel}>Watchlist</div>
                  <WatchlistGrid />
                </div>
              </Panel>
              <Separator className={styles.resizeHandle} />

              {/* Center: Chart + optional Time & Sales - can shrink but has min */}
              <Panel defaultSize={48} minSize="280px" className={styles.panel}>
                <Group orientation="vertical">
                  <Panel defaultSize={70} minSize={20} className={styles.panel}>
                    <div className={styles.panelContent}>
                      <div className={styles.panelLabel}>Chart</div>
                      <ChartPanel />
                    </div>
                  </Panel>
                  <Separator className={styles.resizeHandleVertical} />
                  <Panel defaultSize={30} minSize={15} className={styles.panel}>
                    <div className={styles.panelContent}>
                      <div className={styles.panelLabel}>Time & Sales</div>
                      <TimeAndSales />
                    </div>
                  </Panel>
                </Group>
              </Panel>
              <Separator className={styles.resizeHandle} />

              {/* Right: Order entry + level-1 - pixel min so it never gets squeezed */}
              <Panel defaultSize={30} minSize="280px" maxSize={45} className={styles.panel}>
                <div className={styles.panelContent} data-panel="order-entry">
                  <div className={styles.panelLabel}>Order Entry</div>
                  <OrderEntryTicket />
                </div>
              </Panel>
            </Group>
          </Panel>
          <Separator className={styles.resizeHandleVertical} />
          {/* Bottom: Blotter tabs */}
          <Panel defaultSize={30} minSize={120} maxSize={50} className={styles.blotterPanel}>
            <Blotter />
          </Panel>
        </Group>
      </div>
    </div>
  );
}
