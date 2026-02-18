import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useConnectionStore } from '../../stores/connectionStore';
import { useThemeStore } from '../../stores/themeStore';
import { useWatchlistStore } from '../../stores/watchlistStore';
import { useSelectionStore } from '../../stores/selectionStore';
import styles from './TopBar.module.css';

const ENVIRONMENTS = ['SIM', 'PAPER', 'LIVE'] as const;

function isFormElement(target: EventTarget | null): boolean {
  const tagName = (target as HTMLElement | null)?.tagName;
  return tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT';
}

export function TopBar() {
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { environment, setEnvironment, connected, latencyMs } = useConnectionStore();
  const { theme, toggleTheme } = useThemeStore();
  const symbols = useWatchlistStore((state) => state.symbols);
  const setSelectedSymbol = useSelectionStore((state) => state.setSelectedSymbol);

  const suggestions = useMemo(
    () => symbols.filter((symbol) => symbol.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 6),
    [searchQuery, symbols]
  );

  const applyGlobalSearch = useCallback((query: string) => {
    window.dispatchEvent(new CustomEvent('terminal:global-search', { detail: { query } }));
  }, []);

  const submitSearch = useCallback(
    (query: string) => {
      const normalized = query.trim().toUpperCase();
      if (!normalized) return;

      const matched = symbols.find((symbol) => symbol === normalized) ?? suggestions[0];
      if (!matched) {
        applyGlobalSearch(normalized);
        return;
      }

      setSelectedSymbol(matched);
      applyGlobalSearch(matched);
      window.dispatchEvent(new CustomEvent('terminal:open-order-ticket', { detail: { symbol: matched } }));
    },
    [applyGlobalSearch, setSelectedSymbol, suggestions, symbols]
  );

  useEffect(() => {
    const onGlobalKeyDown = (event: KeyboardEvent) => {
      const pressedSlash = event.key === '/';
      const pressedQuickSearch = event.key.toLowerCase() === 'k' && (event.ctrlKey || event.metaKey);
      if ((pressedSlash || pressedQuickSearch) && !isFormElement(event.target)) {
        event.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }

      if (event.key === 'Escape' && document.activeElement === searchInputRef.current) {
        setSearchQuery('');
        applyGlobalSearch('');
      }
    };

    document.addEventListener('keydown', onGlobalKeyDown);
    return () => document.removeEventListener('keydown', onGlobalKeyDown);
  }, [applyGlobalSearch]);

  const handleSearchKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        submitSearch(searchQuery);
      }

      if (event.key === 'Escape') {
        setSearchQuery('');
        applyGlobalSearch('');
        (event.target as HTMLInputElement).blur();
      }
    },
    [applyGlobalSearch, searchQuery, submitSearch]
  );

  const onSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value);
      applyGlobalSearch(value);
    },
    [applyGlobalSearch]
  );

  return (
    <header className={styles.topBar}>
      <div className={styles.left}>
        <span className={styles.logo}>NOVA TRADE</span>
        <select
          className={styles.envSelect}
          value={environment}
          onChange={(event) => setEnvironment(event.target.value as 'SIM' | 'PAPER' | 'LIVE')}
          aria-label="Environment"
        >
          {ENVIRONMENTS.map((env) => (
            <option key={env} value={env}>
              {env}
            </option>
          ))}
        </select>
        <div className={styles.connection} aria-label="Connection status">
          <span className={styles.statusDot} data-connected={connected} />
          <span className={styles.statusText}>{connected ? 'Connected' : 'Offline'}</span>
        </div>
        <div className={styles.latency} title="Round-trip latency">
          <span className={styles.latencyValue}>{latencyMs}</span>
          <span className={styles.latencyUnit}>ms</span>
        </div>
      </div>

      <div className={styles.center}>
        <div className={`${styles.searchWrap} ${searchFocused ? styles.searchFocused : ''}`}>
          <span className={styles.searchIcon} aria-hidden>
            /
          </span>
          <input
            ref={searchInputRef}
            type="search"
            className={styles.searchInput}
            placeholder="Search symbol (/ or Ctrl+K)"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            onKeyDown={handleSearchKeyDown}
            aria-label="Global search"
            list="topbar-symbols"
          />
          <datalist id="topbar-symbols">
            {suggestions.map((symbol) => (
              <option key={symbol} value={symbol} />
            ))}
          </datalist>
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
          {theme === 'dark' ? 'Light' : 'Dark'}
        </button>
      </div>
    </header>
  );
}