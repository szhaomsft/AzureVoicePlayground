import { useState, useCallback, useEffect } from 'react';
import { PodcastHistoryEntry } from '../types/podcast';

const STORAGE_KEY = 'podcast.history';
const MAX_HISTORY_ENTRIES = 50;

function loadHistory(): PodcastHistoryEntry[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load podcast history:', error);
  }
  return [];
}

function saveHistory(history: PodcastHistoryEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Failed to save podcast history:', error);
  }
}

export function usePodcastHistoryStorage() {
  const [history, setHistory] = useState<PodcastHistoryEntry[]>(loadHistory);

  const addToHistory = useCallback((entry: Omit<PodcastHistoryEntry, 'id'>) => {
    const newEntry: PodcastHistoryEntry = {
      ...entry,
      id: crypto.randomUUID(),
    };
    setHistory((prev) => {
      // Add to beginning, keep last MAX_HISTORY_ENTRIES
      const updated = [newEntry, ...prev].slice(0, MAX_HISTORY_ENTRIES);
      saveHistory(updated);
      return updated;
    });
  }, []);

  const removeFromHistory = useCallback((id: string) => {
    setHistory((prev) => {
      const updated = prev.filter((entry) => entry.id !== id);
      saveHistory(updated);
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    saveHistory([]);
  }, []);

  // Save to localStorage whenever history changes
  useEffect(() => {
    saveHistory(history);
  }, [history]);

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory,
  };
}
