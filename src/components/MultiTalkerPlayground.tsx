import React, { useState, useEffect, useRef } from 'react';
import { AzureSettings, SynthesisState } from '../types/azure';
import { MultiTalkerVoice, MultiTalkerHistoryEntry } from '../types/multiTalker';
import { useMultiTalkerTTS } from '../hooks/useMultiTalkerTTS';
import { MultiTalkerVoiceSelector } from './MultiTalkerVoiceSelector';
import { PlaybackControls } from './PlaybackControls';
import { FeedbackButton } from './FeedbackButton';
import { getAudioDuration } from '../utils/audioUtils';
import { PODCAST_PRESETS, getBestPresetForLocale, adaptPresetToSpeakers } from '../utils/podcastPresets';

interface MultiTalkerPlaygroundProps {
  settings: AzureSettings;
  onSettingsChange: (settings: Partial<AzureSettings>) => void;
  isConfigured: boolean;
  history: MultiTalkerHistoryEntry[];
  addToHistory: (entry: Omit<MultiTalkerHistoryEntry, 'id'>) => void;
  removeFromHistory: (id: string) => void;
  clearHistory: () => void;
}

const SAMPLE_TEXT = `speaker1: Welcome to Tech Talk! I'm your host, and today we're diving into artificial intelligence.
speaker2: Thanks for having me! AI is such a fascinating topic these days.
speaker1: Absolutely! Can you explain what makes modern AI so powerful?
speaker2: Of course! The key is deep learning, which allows computers to learn patterns from massive amounts of data.
speaker1: That sounds incredible. What are some practical applications?
speaker2: We see AI everywhere now - voice assistants, recommendation systems, autonomous vehicles, and more.`;

export function MultiTalkerPlayground({
  settings,
  onSettingsChange,
  isConfigured,
  history,
  addToHistory,
  removeFromHistory,
  clearHistory,
}: MultiTalkerPlaygroundProps) {
  const [text, setText] = useState(SAMPLE_TEXT);
  const [selectedVoice, setSelectedVoice] = useState<MultiTalkerVoice | null>(null);
  const [showSSML, setShowSSML] = useState(false);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('en-US');
  const [playingHistoryId, setPlayingHistoryId] = useState<string | null>(null);
  const previousAudioDataRef = useRef<ArrayBuffer | null>(null);
  const historyAudioRef = useRef<HTMLAudioElement | null>(null);

  const { state, error, audioData, generatedSSML, synthesize, pause, resume, stop } =
    useMultiTalkerTTS({
      apiKey: settings.apiKey,
      region: settings.region,
    });

  // Load preset when selected
  const handlePresetChange = (presetLocale: string) => {
    setSelectedPreset(presetLocale);
    if (presetLocale && selectedVoice) {
      const preset = PODCAST_PRESETS.find(p => p.locale === presetLocale);
      if (preset) {
        const adaptedScript = adaptPresetToSpeakers(preset, selectedVoice.speakers);
        setText(adaptedScript);
      }
    }
  };

  // Update text when voice changes to adapt speaker names
  useEffect(() => {
    if (selectedVoice && selectedPreset) {
      const preset = PODCAST_PRESETS.find(p => p.locale === selectedPreset);
      if (preset) {
        const adaptedScript = adaptPresetToSpeakers(preset, selectedVoice.speakers);
        setText(adaptedScript);
      }
    }
  }, [selectedVoice, selectedPreset]);

  // Add to history when synthesis completes successfully with NEW audio
  useEffect(() => {
    if (audioData && audioData !== previousAudioDataRef.current && selectedVoice) {
      previousAudioDataRef.current = audioData;

      getAudioDuration(audioData)
        .then((duration) => {
          addToHistory({
            timestamp: Date.now(),
            text: text,
            voice: selectedVoice.displayName,
            region: settings.region,
            audioData: audioData,
            duration: duration,
          });
        })
        .catch((err) => {
          console.error('Failed to get audio duration:', err);
          const estimatedDuration = (audioData.byteLength * 8) / 48000;
          addToHistory({
            timestamp: Date.now(),
            text: text,
            voice: selectedVoice.displayName,
            region: settings.region,
            audioData: audioData,
            duration: estimatedDuration,
          });
        });
    }
  }, [audioData, text, selectedVoice, settings.region, addToHistory]);

  const handlePlay = () => {
    if (selectedVoice) {
      synthesize(text, selectedVoice.name, selectedVoice.locale, selectedVoice.speakers);
    }
  };

  const handleDownload = (entry: MultiTalkerHistoryEntry) => {
    const blob = new Blob([entry.audioData], { type: 'audio/mpeg' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `multitalker-${entry.voice}-${Date.now()}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePlayHistoryEntry = (entry: MultiTalkerHistoryEntry) => {
    // If clicking the same entry that's playing, stop it
    if (playingHistoryId === entry.id && historyAudioRef.current) {
      historyAudioRef.current.pause();
      historyAudioRef.current = null;
      setPlayingHistoryId(null);
      return;
    }

    // Stop any currently playing audio
    if (historyAudioRef.current) {
      historyAudioRef.current.pause();
      historyAudioRef.current = null;
    }

    const blob = new Blob([entry.audioData], { type: 'audio/mpeg' });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    historyAudioRef.current = audio;
    setPlayingHistoryId(entry.id);

    audio.play();
    audio.onended = () => {
      URL.revokeObjectURL(url);
      setPlayingHistoryId(null);
      historyAudioRef.current = null;
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      setPlayingHistoryId(null);
      historyAudioRef.current = null;
    };
  };

  // Map MultiTalkerState to SynthesisState for PlaybackControls compatibility
  const synthesisState: SynthesisState = state as SynthesisState;

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
      {/* Left side - Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 shadow-md">
          <h1 className="text-3xl font-bold">Podcast Generator</h1>
          <p className="text-purple-100 mt-1">
            Create multi-speaker dialog content with AI-powered voices
          </p>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col gap-4 p-6 overflow-y-auto">
          {/* Preset Selector */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Podcast Script Preset:</label>
            <select
              value={selectedPreset}
              onChange={(e) => handlePresetChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
              disabled={state === 'synthesizing' || state === 'playing'}
            >
              <option value="">-- Select a preset --</option>
              {PODCAST_PRESETS.map((preset) => (
                <option key={preset.locale} value={preset.locale}>
                  {preset.language}
                </option>
              ))}
            </select>
            {selectedPreset && (
              <button
                onClick={() => {
                  setSelectedPreset('');
                }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear
              </button>
            )}
          </div>

          {/* Text Input Area */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Dialog Text</label>
              {selectedVoice && (
                <div className="text-xs text-gray-500">
                  Format: <code className="bg-gray-100 px-1 rounded">speaker: text</code>
                  {' | Speakers: '}
                  {selectedVoice.speakers.map((s, i) => (
                    <code key={s} className="bg-purple-100 text-purple-700 px-1 rounded mx-0.5">
                      {s}
                    </code>
                  ))}
                </div>
              )}
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`Enter dialog text with speaker prefixes:\nspeaker1: Hello!\nspeaker2: Hi there!`}
              className="flex-1 w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono text-sm resize-none"
              disabled={state === 'synthesizing' || state === 'playing'}
            />
            <div className="mt-1 text-xs text-gray-500">
              {text.split('\n').filter(l => l.trim()).length} lines | {text.length} characters
            </div>
          </div>

          {/* SSML Preview Toggle */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setShowSSML(!showSSML)}
              className="w-full px-4 py-2 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors text-sm"
            >
              <span className="font-medium text-gray-700">SSML Preview</span>
              <svg
                className={`w-4 h-4 text-gray-500 transition-transform ${showSSML ? 'rotate-180' : ''}`}
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
            {showSSML && (
              <div className="p-4 bg-gray-900 text-green-400 font-mono text-xs overflow-x-auto max-h-48 overflow-y-auto">
                <pre>{generatedSSML || 'SSML will appear after synthesis'}</pre>
              </div>
            )}
          </div>

          {/* Playback Controls */}
          <div className="border-t border-gray-200 pt-4">
            <PlaybackControls
              state={synthesisState}
              error={error}
              audioData={audioData}
              hasText={text.trim().length > 0}
              isConfigured={isConfigured && selectedVoice !== null}
              onPlay={handlePlay}
              onPause={pause}
              onResume={resume}
              onStop={stop}
            />
          </div>
        </div>

        {/* History Panel */}
        <div className="border-t border-gray-200 bg-gray-50">
          <div
            className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-100"
            onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
          >
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-gray-800">Synthesis History</h3>
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
                    if (window.confirm('Clear all history?')) {
                      clearHistory();
                    }
                  }}
                  className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                >
                  Clear All
                </button>
              )}
              <svg
                className={`w-5 h-5 text-gray-600 transform transition-transform ${isHistoryExpanded ? 'rotate-180' : ''}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>

          {isHistoryExpanded && (
            <div className="max-h-64 overflow-y-auto">
              {history.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500 text-sm">
                  No synthesis history yet
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {history.map((entry) => (
                    <div
                      key={entry.id}
                      className="px-4 py-3 flex items-center justify-between hover:bg-gray-100"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-800 truncate">
                          {entry.voice}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(entry.timestamp).toLocaleTimeString()} |{' '}
                          {entry.duration.toFixed(1)}s |{' '}
                          {entry.text.substring(0, 50)}...
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handlePlayHistoryEntry(entry)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title={playingHistoryId === entry.id ? 'Pause' : 'Play'}
                        >
                          {playingHistoryId === entry.id ? (
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
                          onClick={() => handleDownload(entry)}
                          className="p-2 text-gray-600 hover:bg-gray-200 rounded-full"
                          title="Download"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => removeFromHistory(entry.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                          title="Delete"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-3 flex items-center justify-between">
          <p className="text-xs text-gray-600">
            Podcast Generator uses Azure Speech Service with mstts:dialog SSML elements.
          </p>
          <FeedbackButton
            text={text}
            selectedVoice={selectedVoice?.displayName || ''}
            region={settings.region}
            audioData={audioData}
          />
        </div>
      </div>

      {/* Right side - Voice Selector */}
      <div className="w-full md:w-80 flex-shrink-0 bg-gray-50 border-l border-gray-200 p-6 flex flex-col overflow-hidden">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Voice Selection</h2>
        <div className="flex-1 min-h-0">
          <MultiTalkerVoiceSelector
            apiKey={settings.apiKey}
            region={settings.region}
            selectedVoice={selectedVoice}
            onVoiceChange={setSelectedVoice}
          />
        </div>
      </div>
    </div>
  );
}
