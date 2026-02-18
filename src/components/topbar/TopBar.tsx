import { useState, useCallback, useRef, useEffect } from 'react';
import { useConnectionStore } from '../../stores/connectionStore';
import { useThemeStore } from '../../stores/themeStore';
import styles from './TopBar.module.css';

const ENVIRONMENTS = ['SIM', 'PAPER', 'LIVE'] as const;

export function TopBar() {
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { environment, setEnvironment, connected, latencyMs } = useConnectionStore();

  useEffect(() => {
    const onGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        (document.activeElement as HTMLElement)?.blur();
      }
    };
    document.addEventListener('keydown', onGlobalKeyDown);
    return () => document.removeEventListener('keydown', onGlobalKeyDown);
  }, []);
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
          <span className={styles.searchIcon} aria-hidden>/</span>
          <input
            ref={searchInputRef}
            type="search"
            className={styles.searchInput}
            placeholder="Search symbol… (/)"
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
