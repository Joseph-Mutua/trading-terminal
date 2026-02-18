import { useEffect } from 'react';
import { TerminalLayout } from './components/layout/TerminalLayout';
import { useThemeStore } from './stores/themeStore';
import { useStreamingInit } from './hooks/useStreamingInit';

function App() {
  const theme = useThemeStore((s) => s.theme);
  useStreamingInit();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return <TerminalLayout />;
}

export default App;
