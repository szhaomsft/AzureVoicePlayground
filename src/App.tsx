import React, { useState } from 'react';
import { useSettings } from './hooks/useSettings';
import { useAzureTTS } from './hooks/useAzureTTS';
import { SettingsPanel } from './components/SettingsPanel';
import { TextInput } from './components/TextInput';
import { PlaybackControls } from './components/PlaybackControls';

function App() {
  const { settings, updateSettings, isConfigured } = useSettings();
  const [text, setText] = useState('Welcome to One Fish, Two Fish, the podcast that aims to make you laugh as you learn about the fascinating world of marine biology. From the depths of the deep blue to the shores of our coastlines, we\'ll explore the wonders of the underwater world and the creatures that call it home. Join us each week as we dive into the latest research, meet the experts in the field, and, discover the stories of the people dedicated to protecting our oceans along with the incredible species that inhabit them.');

  console.log('Current settings in App:', settings);

  const { state, error, wordBoundaries, currentWordIndex, audioData, synthesize, pause, resume, stop } =
    useAzureTTS(settings);

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
            Text-to-Speech with real-time word highlighting and MP3 export
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

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-3">
          <p className="text-xs text-gray-600 text-center">
            Built with React, TypeScript, and Azure Cognitive Services Speech SDK
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
