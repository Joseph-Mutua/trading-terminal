import { useEffect } from 'react';
import { TerminalLayout } from './components/layout/TerminalLayout';
import { useThemeStore } from './stores/themeStore';

function App() {
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return <TerminalLayout />;
}

export default App;
