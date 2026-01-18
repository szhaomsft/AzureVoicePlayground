import React, { useState } from 'react';
import { HistoryEntry as HistoryEntryType } from '../types/history';
import { HistoryEntry } from './HistoryEntry';

interface HistoryPanelProps {
  history: HistoryEntryType[];
  onClearHistory: () => void;
  onDeleteEntry: (id: string) => void;
}

export function HistoryPanel({ history, onClearHistory, onDeleteEntry }: HistoryPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="border-t border-gray-200 bg-gray-50">
      {/* Header bar (always visible) */}
      <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-100" onClick={toggleExpanded}>
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-800">Synthesis History</h3>
          {history.length > 0 && (
            <span className="px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded-full">
              {history.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {history.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm('Clear all history?')) {
                  onClearHistory();
                }
              }}
              className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              Clear All
            </button>
          )}
          <button className="p-1 text-gray-600">
            <svg
              className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Expandable content */}
      {isExpanded && (
        <div className="px-4 pb-4 max-h-60 overflow-y-auto">
          {history.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <p>No synthesis history yet</p>
              <p className="text-sm mt-1">Synthesized audio will appear here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Reverse order to show newest first */}
              {[...history].reverse().map((entry) => (
                <HistoryEntry key={entry.id} entry={entry} onDelete={onDeleteEntry} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
