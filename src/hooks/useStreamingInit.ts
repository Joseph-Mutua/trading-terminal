import { useEffect } from 'react';
import { initializeTerminalData, shutdownTerminalData } from '../services/bootstrapService';

export function useStreamingInit(): void {
  useEffect(() => {
    initializeTerminalData();
    return () => shutdownTerminalData();
  }, []);
}
