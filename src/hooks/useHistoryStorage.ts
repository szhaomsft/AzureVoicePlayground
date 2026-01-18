import { useState, useCallback } from 'react';
import { HistoryEntry } from '../types/history';

export function useHistoryStorage() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const addToHistory = useCallback((entry: Omit<HistoryEntry, 'id'>) => {
    const newEntry: HistoryEntry = {
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
