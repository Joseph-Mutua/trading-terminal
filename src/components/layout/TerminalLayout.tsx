import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import styles from './TerminalLayout.module.css';

export function TerminalLayout() {
  return (
    <div className={styles.terminal}>
      {/* Top bar placeholder - will be implemented in commit 3 */}
      <header className={styles.topBar}>
        <div className={styles.topBarLeft}>Trading Terminal</div>
        <div className={styles.topBarCenter} />
        <div className={styles.topBarRight} />
      </header>

      {/* Main content: vertical split (content area | blotter) */}
      <div className={styles.mainContent}>
        <PanelGroup direction="vertical">
          <Panel defaultSize={70} minSize={40} className={styles.contentArea}>
            <PanelGroup direction="horizontal" className={styles.panelGroup}>
              {/* Left: Watchlist */}
              <Panel defaultSize={22} minSize={15} maxSize={35} className={styles.panel}>
                <div className={styles.panelContent}>
                  <div className={styles.panelLabel}>Watchlist</div>
                </div>
              </Panel>
              <PanelResizeHandle className={styles.resizeHandle} />

              {/* Center: Chart + optional Time & Sales */}
              <Panel defaultSize={48} minSize={30} className={styles.panel}>
                <PanelGroup direction="vertical">
                  <Panel defaultSize={70} minSize={20} className={styles.panel}>
                    <div className={styles.panelContent}>
                      <div className={styles.panelLabel}>Chart</div>
                    </div>
                  </Panel>
                  <PanelResizeHandle className={styles.resizeHandleVertical} />
                  <Panel defaultSize={30} minSize={15} className={styles.panel}>
                    <div className={styles.panelContent}>
                      <div className={styles.panelLabel}>Time & Sales</div>
                    </div>
                  </Panel>
                </PanelGroup>
              </Panel>
              <PanelResizeHandle className={styles.resizeHandle} />

              {/* Right: Order entry + level-1 */}
              <Panel defaultSize={30} minSize={20} maxSize={40} className={styles.panel}>
                <div className={styles.panelContent}>
                  <div className={styles.panelLabel}>Order Entry</div>
                </div>
              </Panel>
            </PanelGroup>
          </Panel>
          <PanelResizeHandle className={styles.resizeHandleVertical} />
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
        </PanelGroup>
      </div>
    </div>
  );
}
