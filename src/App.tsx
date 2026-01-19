import React, { useState } from 'react';
import { useSettings } from './hooks/useSettings';
import { useHistoryStorage } from './hooks/useHistoryStorage';
import { useConversionHistoryStorage } from './hooks/useConversionHistoryStorage';
import { PlaygroundMode } from './types/azure';
import { NavigationSidebar } from './components/NavigationSidebar';
import { TextToSpeechPlayground } from './components/TextToSpeechPlayground';
import { VoiceChangerPlayground } from './components/VoiceChangerPlayground';
import { ComingSoonPlaceholder } from './components/ComingSoonPlaceholder';

function App() {
  const { settings, updateSettings, isConfigured } = useSettings();
  const [activePlayground, setActivePlayground] = useState<PlaygroundMode>('text-to-speech');

  // Lift history state to App level so it persists when switching playgrounds
  const ttsHistory = useHistoryStorage();
  const conversionHistory = useConversionHistoryStorage();

  const renderPlayground = () => {
    switch (activePlayground) {
      case 'text-to-speech':
        return (
          <TextToSpeechPlayground
            settings={settings}
            onSettingsChange={updateSettings}
            isConfigured={isConfigured}
            history={ttsHistory.history}
            addToHistory={ttsHistory.addToHistory}
            removeFromHistory={ttsHistory.removeFromHistory}
            clearHistory={ttsHistory.clearHistory}
          />
        );
      case 'voice-changer':
        return (
          <VoiceChangerPlayground
            settings={settings}
            onSettingsChange={updateSettings}
            isConfigured={isConfigured}
            history={conversionHistory.history}
            addToHistory={conversionHistory.addToHistory}
            removeFromHistory={conversionHistory.removeFromHistory}
            clearHistory={conversionHistory.clearHistory}
          />
        );
      case 'podcast':
        return (
          <ComingSoonPlaceholder
            title="Podcast"
            description="Create multi-speaker podcast content with AI-powered voices."
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-screen flex overflow-hidden bg-white">
      {/* Left Navigation Sidebar */}
      <NavigationSidebar
        activeMode={activePlayground}
        onModeChange={setActivePlayground}
        settings={settings}
        onSettingsChange={updateSettings}
      />

      {/* Main Playground Area */}
      {renderPlayground()}
    </div>
  );
}

export default App;
