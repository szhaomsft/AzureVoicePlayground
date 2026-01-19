import React, { useState, useRef, useEffect } from 'react';
import { ConversionHistoryEntry } from '../types/voiceConversion';
import { downloadAudioAsMP3, formatDuration } from '../utils/audioUtils';

interface ConversionHistoryPanelProps {
  history: ConversionHistoryEntry[];
  onClearHistory: () => void;
  onDeleteEntry: (id: string) => void;
}

export function ConversionHistoryPanel({
  history,
  onClearHistory,
  onDeleteEntry,
}: ConversionHistoryPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="border-t border-gray-200 bg-gray-50">
      {/* Header bar (always visible) */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-100"
        onClick={toggleExpanded}
      >
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-800">Conversion History</h3>
          {history.length > 0 && (
            <span className="px-2 py-1 text-xs font-medium text-white bg-purple-600 rounded-full">
              {history.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {history.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm('Clear all conversion history?')) {
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
              <p>No conversion history yet</p>
              <p className="text-sm mt-1">Converted audio will appear here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Reverse order to show newest first */}
              {[...history].reverse().map((entry) => (
                <ConversionHistoryEntryItem
                  key={entry.id}
                  entry={entry}
                  onDelete={onDeleteEntry}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface ConversionHistoryEntryItemProps {
  entry: ConversionHistoryEntry;
  onDelete: (id: string) => void;
}

function ConversionHistoryEntryItem({ entry, onDelete }: ConversionHistoryEntryItemProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  // Create blob URL from audio data
  useEffect(() => {
    const blob = new Blob([entry.resultAudioData], { type: 'audio/mpeg' });
    const url = URL.createObjectURL(blob);
    blobUrlRef.current = url;

    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, [entry.resultAudioData]);

  const handlePlayPause = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(blobUrlRef.current || '');
      audioRef.current.addEventListener('ended', () => {
        setIsPlaying(false);
      });
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSave = () => {
    const timestamp = new Date(entry.timestamp)
      .toISOString()
      .replace(/[:.]/g, '-')
      .slice(0, -5);
    const voiceName = entry.targetVoice.replace(/[^a-zA-Z0-9-]/g, '_');
    const sourceFile = entry.sourceFileName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9-]/g, '_');
    const filename = `voiceconversion-${sourceFile}-to-${voiceName}-${timestamp}.mp3`;
    downloadAudioAsMP3(entry.resultAudioData, filename);
  };

  const handleDelete = () => {
    // Stop audio if playing
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    onDelete(entry.id);
  };

  // Format timestamp
  const timeString = new Date(entry.timestamp).toLocaleTimeString();

  // Extract display name from voice name
  const voiceDisplayName = entry.targetVoice
    .replace('en-US-', '')
    .replace('MultilingualNeural', '')
    .replace('Turbo', ' (Turbo)');

  return (
    <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-md hover:bg-gray-50">
      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-800 truncate mb-1">
          <span className="font-medium">{entry.sourceFileName}</span>
          <span className="text-gray-400 mx-2">→</span>
          <span className="text-purple-600">{voiceDisplayName}</span>
        </p>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span>{timeString}</span>
          <span>•</span>
          <span>{entry.region}</span>
          <span>•</span>
          <span>{formatDuration(entry.duration)}</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={handlePlayPause}
          className="p-2 text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M5 4h3v12H5V4zm7 0h3v12h-3V4z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
          )}
        </button>
        <button
          onClick={handleSave}
          className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-colors"
          title="Save as MP3"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
            <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
          </svg>
        </button>
        <button
          onClick={handleDelete}
          className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
          title="Delete"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
