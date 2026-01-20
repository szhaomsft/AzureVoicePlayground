// Hook for managing Speech-to-Text transcription history

import { useState, useCallback } from 'react';
import { STTHistoryEntry } from '../types/stt';

interface UseSTTHistoryStorageReturn {
  history: STTHistoryEntry[];
  addToHistory: (entry: Omit<STTHistoryEntry, 'id'>) => void;
  removeFromHistory: (id: string) => void;
  clearHistory: () => void;
}

/**
 * Hook for managing STT transcription history
 * Stores history in memory only (transcripts can be large, not persisted to localStorage)
 */
export function useSTTHistoryStorage(): UseSTTHistoryStorageReturn {
  const [history, setHistory] = useState<STTHistoryEntry[]>([]);

  const addToHistory = useCallback((entry: Omit<STTHistoryEntry, 'id'>) => {
    const newEntry: STTHistoryEntry = {
      ...entry,
      id: `stt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    setHistory(prev => [newEntry, ...prev]);
  }, []);

  const removeFromHistory = useCallback((id: string) => {
    setHistory(prev => prev.filter(entry => entry.id !== id));
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
