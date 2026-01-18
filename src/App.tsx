import React, { useState, useEffect, useRef } from 'react';
import { useSettings } from './hooks/useSettings';
import { useAzureTTS } from './hooks/useAzureTTS';
import { useHistoryStorage } from './hooks/useHistoryStorage';
import { SettingsPanel } from './components/SettingsPanel';
import { TextInput } from './components/TextInput';
import { PlaybackControls } from './components/PlaybackControls';
import { FeedbackButton } from './components/FeedbackButton';
import { HistoryPanel } from './components/HistoryPanel';
import { getAudioDuration } from './utils/audioUtils';

function App() {
  const { settings, updateSettings, isConfigured } = useSettings();
  const [text, setText] = useState('Welcome to Azure Voice Playground. Select a voice and choose a preset text to get started, or type your own text.');
  const { history, addToHistory, removeFromHistory, clearHistory } = useHistoryStorage();
  const previousAudioDataRef = useRef<ArrayBuffer | null>(null);

  const { state, error, wordBoundaries, currentWordIndex, audioData, synthesize, pause, resume, stop } =
    useAzureTTS(settings);

  // Add to history when synthesis completes successfully with NEW audio
  useEffect(() => {
    if (audioData && audioData !== previousAudioDataRef.current) {
      // Update ref to track this audio
      previousAudioDataRef.current = audioData;

      // Calculate audio duration and add to history
      getAudioDuration(audioData)
        .then((duration) => {
          addToHistory({
            timestamp: Date.now(),
            text: text,
            voice: settings.selectedVoice,
            region: settings.region,
            audioData: audioData,
            duration: duration,
          });
        })
        .catch((err) => {
          console.error('Failed to get audio duration:', err);
          // Add to history anyway with estimated duration
          const estimatedDuration = (audioData.byteLength * 8 / 48000);
          addToHistory({
            timestamp: Date.now(),
            text: text,
            voice: settings.selectedVoice,
            region: settings.region,
            audioData: audioData,
            duration: estimatedDuration,
          });
        });
    }
  }, [audioData, text, settings.selectedVoice, settings.region, addToHistory]);

  const handlePlay = () => {
    synthesize(text);
  };

  return (
    <div className="h-screen flex flex-col md:flex-row overflow-hidden bg-white">
      {/* Left Panel - Settings */}
      <div className="w-full md:w-80 flex-shrink-0">
        <SettingsPanel settings={settings} onSettingsChange={updateSettings} />
      </div>

      {/* Right Panel - Text Input and Controls */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 shadow-md">
          <h1 className="text-3xl font-bold">Azure Voice Playground</h1>
          <p className="text-blue-100 mt-1">
            Realtime text-to-Speech voices from Microsoft Foundry Voice Gallery
          </p>
        </div>

        {/* Main Content */}
        <div className="flex-1 grid grid-rows-[1fr_auto] gap-6 p-6 overflow-hidden">
          {/* Text Input Area */}
          <div className="overflow-hidden">
            <TextInput
              text={text}
              onTextChange={setText}
              wordBoundaries={wordBoundaries}
              currentWordIndex={currentWordIndex}
              selectedVoice={settings.selectedVoice}
              state={state}
            />
          </div>

          {/* Playback Controls */}
          <div className="border-t border-gray-200 pt-6">
            <PlaybackControls
              state={state}
              error={error}
              audioData={audioData}
              hasText={text.trim().length > 0}
              isConfigured={isConfigured}
              onPlay={handlePlay}
              onPause={pause}
              onResume={resume}
              onStop={stop}
            />
          </div>
        </div>

        {/* History Panel */}
        <HistoryPanel
          history={history}
          onClearHistory={clearHistory}
          onDeleteEntry={removeFromHistory}
        />

        {/* Footer with Feedback Button */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-600">
              Built with React, TypeScript, and Azure Cognitive Services Speech SDK
            </p>
            <FeedbackButton
              text={text}
              selectedVoice={settings.selectedVoice}
              region={settings.region}
              audioData={audioData}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
