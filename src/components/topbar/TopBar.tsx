import { useState, useCallback } from 'react';
import { useConnectionStore } from '../../stores/connectionStore';
import { useThemeStore } from '../../stores/themeStore';
import styles from './TopBar.module.css';

const ENVIRONMENTS = ['SIM', 'PAPER', 'LIVE'] as const;

export function TopBar() {
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { environment, setEnvironment, connected, latencyMs } = useConnectionStore();
  const { theme, toggleTheme } = useThemeStore();

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      (e.target as HTMLInputElement).blur();
      setSearchQuery('');
    }
  }, []);

  return (
    <header className={styles.topBar}>
      <div className={styles.left}>
        <span className={styles.logo}>TRADE</span>
        <select
          className={styles.envSelect}
          value={environment}
          onChange={(e) => setEnvironment(e.target.value as 'SIM' | 'PAPER' | 'LIVE')}
          aria-label="Environment"
        >
          {ENVIRONMENTS.map((env) => (
            <option key={env} value={env}>{env}</option>
          ))}
        </select>
        <div className={styles.connection} aria-label="Connection status">
          <span
            className={styles.statusDot}
            data-connected={connected}
            title={connected ? 'Connected' : 'Disconnected'}
          />
          <span className={styles.statusText}>
            {connected ? 'Live' : 'Offline'}
          </span>
        </div>
        <div className={styles.latency} title="Round-trip latency">
          <span className={styles.latencyValue}>{latencyMs}</span>
          <span className={styles.latencyUnit}>ms</span>
        </div>
      </div>

      <div className={styles.center}>
        <div className={`${styles.searchWrap} ${searchFocused ? styles.searchFocused : ''}`}>
          <span className={styles.searchIcon} aria-hidden>⌘</span>
          <input
            type="search"
            className={styles.searchInput}
            placeholder="Search symbol…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            onKeyDown={handleKeyDown}
            aria-label="Global search"
          />
        </div>
      </div>

      <div className={styles.right}>
        <button
          type="button"
          className={styles.themeToggle}
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          title="Toggle theme"
        >
          {theme === 'dark' ? '☀' : '◐'}
        </button>
      </div>
    </header>
  );
}
