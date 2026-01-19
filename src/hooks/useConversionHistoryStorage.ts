import { useState, useCallback } from 'react';
import { ConversionHistoryEntry } from '../types/voiceConversion';

export function useConversionHistoryStorage() {
  const [history, setHistory] = useState<ConversionHistoryEntry[]>([]);

  const addToHistory = useCallback((entry: Omit<ConversionHistoryEntry, 'id'>) => {
    const newEntry: ConversionHistoryEntry = {
      ...entry,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    setHistory((prev) => [...prev, newEntry]);
  }, []);

  const removeFromHistory = useCallback((id: string) => {
    setHistory((prev) => prev.filter((entry) => entry.id !== id));
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory,
  };
}
