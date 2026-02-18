import { Group, Panel, Separator } from 'react-resizable-panels';
import { TopBar } from '../topbar/TopBar';
import { WatchlistGrid } from '../watchlist/WatchlistGrid';
import styles from './TerminalLayout.module.css';

export function TerminalLayout() {
  return (
    <div className={styles.terminal}>
      <TopBar />

      {/* Main content: vertical split (content area | blotter) */}
      <div className={styles.mainContent}>
        <Group orientation="vertical">
          <Panel defaultSize={70} minSize={40} className={styles.contentArea}>
            <Group orientation="horizontal" className={styles.panelGroup}>
              {/* Left: Watchlist */}
              <Panel defaultSize={22} minSize={15} maxSize={35} className={styles.panel}>
                <div className={styles.panelContent}>
                  <div className={styles.panelLabel}>Watchlist</div>
                  <WatchlistGrid />
                </div>
              </Panel>
              <Separator className={styles.resizeHandle} />

              {/* Center: Chart + optional Time & Sales */}
              <Panel defaultSize={48} minSize={30} className={styles.panel}>
                <Group orientation="vertical">
                  <Panel defaultSize={70} minSize={20} className={styles.panel}>
                    <div className={styles.panelContent}>
                      <div className={styles.panelLabel}>Chart</div>
                    </div>
                  </Panel>
                  <Separator className={styles.resizeHandleVertical} />
                  <Panel defaultSize={30} minSize={15} className={styles.panel}>
                    <div className={styles.panelContent}>
                      <div className={styles.panelLabel}>Time & Sales</div>
                    </div>
                  </Panel>
                </Group>
              </Panel>
              <Separator className={styles.resizeHandle} />

              {/* Right: Order entry + level-1 */}
              <Panel defaultSize={30} minSize={20} maxSize={40} className={styles.panel}>
                <div className={styles.panelContent}>
                  <div className={styles.panelLabel}>Order Entry</div>
                </div>
              </Panel>
            </Group>
          </Panel>
          <Separator className={styles.resizeHandleVertical} />
          {/* Bottom: Blotter tabs */}
          <Panel defaultSize={30} minSize={120} maxSize={50} className={styles.blotterPanel}>
            <div className={styles.blotterContent}>
              <div className={styles.blotterTabs}>
                <button type="button" className={styles.tabActive}>Orders</button>
                <button type="button" className={styles.tab}>Fills</button>
                <button type="button" className={styles.tab}>Positions</button>
              </div>
              <div className={styles.blotterGridPlaceholder}>
                Blotter grid
              </div>
            </div>
          </Panel>
        </Group>
      </div>
    </div>
  );
}
