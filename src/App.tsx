import React, { useState, useMemo } from 'react';
import { useSettings } from './hooks/useSettings';
import { useHistoryStorage } from './hooks/useHistoryStorage';
import { useConversionHistoryStorage } from './hooks/useConversionHistoryStorage';
import { useMultiTalkerHistoryStorage } from './hooks/useMultiTalkerHistoryStorage';
import { PlaygroundMode } from './types/azure';
import { NavigationSidebar } from './components/NavigationSidebar';
import { TextToSpeechPlayground } from './components/TextToSpeechPlayground';
import { VoiceChangerPlayground } from './components/VoiceChangerPlayground';
import { MultiTalkerPlayground } from './components/MultiTalkerPlayground';
import { VoiceLiveTranslatorPlayground } from './components/VoiceLiveTranslatorPlayground';

// Check for feature flag in URL: ?podcast=1 or ?podcast=true
function usePodcastFeatureFlag(): boolean {
  return useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const podcastParam = params.get('podcast');
    return podcastParam === '1' || podcastParam === 'true';
  }, []);
}

function App() {
  const { settings, updateSettings, isConfigured } = useSettings();
  const [activePlayground, setActivePlayground] = useState<PlaygroundMode>('text-to-speech');
  const showPodcastGenerator = usePodcastFeatureFlag();

  // Lift history state to App level so it persists when switching playgrounds
  const ttsHistory = useHistoryStorage();
  const conversionHistory = useConversionHistoryStorage();
  const multiTalkerHistory = useMultiTalkerHistoryStorage();

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
      case 'multi-talker':
        return (
          <MultiTalkerPlayground
            settings={settings}
            onSettingsChange={updateSettings}
            isConfigured={isConfigured}
            history={multiTalkerHistory.history}
            addToHistory={multiTalkerHistory.addToHistory}
            removeFromHistory={multiTalkerHistory.removeFromHistory}
            clearHistory={multiTalkerHistory.clearHistory}
          />
        );
      case 'voice-live-chat':
        return (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center p-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Voice Live Chat</h2>
              <p className="text-gray-600 max-w-md">
                Real-time voice conversation with AI agents. This feature is coming soon.
              </p>
            </div>
          </div>
        );
      case 'voice-live-translator':
        return (
          <VoiceLiveTranslatorPlayground
            endpoint={settings.voiceLiveEndpoint || ''}
            apiKey={settings.voiceLiveApiKey || ''}
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
        showPodcastGenerator={showPodcastGenerator}
      />

      {/* Main Playground Area */}
      {renderPlayground()}
    </div>
  );
}

export default App;
