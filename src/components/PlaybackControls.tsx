import React, { useState } from 'react';
import { SynthesisState } from '../types/azure';

interface PlaybackControlsProps {
  state: SynthesisState;
  error: string;
  audioData: ArrayBuffer | null;
  hasText: boolean;
  isConfigured: boolean;
  onPlay: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

export function PlaybackControls({
  state,
  error,
  audioData,
  hasText,
  isConfigured,
  onPlay,
  onPause,
  onResume,
  onStop,
}: PlaybackControlsProps) {
  const [showHelp, setShowHelp] = useState(false);
  const canPlay = hasText && isConfigured && state === 'idle';
  const canPause = state === 'playing';
  const canResume = state === 'paused';
  const canStop = state === 'playing' || state === 'paused' || state === 'synthesizing';

  const getStateDisplay = () => {
    switch (state) {
      case 'idle':
        return 'Ready';
      case 'synthesizing':
        return 'Synthesizing...';
      case 'playing':
        return 'Playing';
      case 'paused':
        return 'Paused';
      case 'error':
        return 'Error';
      default:
        return 'Unknown';
    }
  };

  const getStateColor = () => {
    switch (state) {
      case 'idle':
        return 'text-gray-600';
      case 'synthesizing':
        return 'text-blue-600';
      case 'playing':
        return 'text-green-600';
      case 'paused':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-4">
      {/* State Display */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Status:</span>
          <span className={`text-sm font-semibold ${getStateColor()}`}>
            {getStateDisplay()}
          </span>
          {state === 'synthesizing' && (
            <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700 font-medium">Error:</p>
          <p className="text-xs text-red-600 mt-1">{error}</p>
        </div>
      )}

      {/* Configuration Warning */}
      {!isConfigured && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-700">
            Please configure your API key and region in the settings panel.
          </p>
        </div>
      )}

      {/* Playback Controls */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={onPlay}
          disabled={!canPlay}
          className="flex-1 min-w-[100px] px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
          title={
            !hasText
              ? 'Enter text first'
              : !isConfigured
              ? 'Configure settings first'
              : 'Play'
          }
        >
          ▶ Play
        </button>

        {canResume ? (
          <button
            onClick={onResume}
            className="flex-1 min-w-[100px] px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            ▶ Resume
          </button>
        ) : (
          <button
            onClick={onPause}
            disabled={!canPause}
            className="flex-1 min-w-[100px] px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-yellow-600"
          >
            ⏸ Pause
          </button>
        )}

        <button
          onClick={onStop}
          disabled={!canStop}
          className="flex-1 min-w-[100px] px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-600"
        >
          ⏹ Stop
        </button>

        {/* Help Button */}
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          title="Help"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Help Text (collapsible) */}
      {showHelp && (
        <div className="text-xs text-gray-500 space-y-1 pt-2 mt-2 border-t border-gray-200">
          <p>• Click Play to start synthesis and playback</p>
          <p>• Word highlighting shows the current word being spoken</p>
          <p>• Save audio from history panel below</p>
        </div>
      )}
    </div>
  );
}
