import { useState, useCallback } from 'react';
import { MultiTalkerHistoryEntry } from '../types/multiTalker';

export function useMultiTalkerHistoryStorage() {
  const [history, setHistory] = useState<MultiTalkerHistoryEntry[]>([]);

  const addToHistory = useCallback((entry: Omit<MultiTalkerHistoryEntry, 'id'>) => {
    const newEntry: MultiTalkerHistoryEntry = {
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
