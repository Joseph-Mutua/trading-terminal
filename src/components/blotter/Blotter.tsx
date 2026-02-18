import { useBlotterStore, type BlotterTab } from '../../stores/blotterStore';
import { OrdersGrid } from './OrdersGrid';
import { FillsGrid } from './FillsGrid';
import { PositionsGrid } from './PositionsGrid';
import styles from './Blotter.module.css';

const TABS: { id: BlotterTab; label: string }[] = [
  { id: 'orders', label: 'Orders' },
  { id: 'fills', label: 'Fills' },
  { id: 'positions', label: 'Positions' },
];

export function Blotter() {
  const activeTab = useBlotterStore((s) => s.activeTab);
  const setActiveTab = useBlotterStore((s) => s.setActiveTab);

  return (
    <div className={styles.blotter}>
      <div className={styles.tabs}>
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className={activeTab === id ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className={styles.gridWrap}>
        {activeTab === 'orders' && <OrdersGrid />}
        {activeTab === 'fills' && <FillsGrid />}
        {activeTab === 'positions' && <PositionsGrid />}
      </div>
    </div>
  );
}
