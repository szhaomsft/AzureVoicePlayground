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
import { VoiceLiveChatPlayground } from './components/VoiceLiveChatPlayground';

// Check for feature flag in URL: ?avatar=1 or ?avatar=true
function useAvatarFeatureFlag(): boolean {
  return useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const avatarParam = params.get('avatar');
    return avatarParam === '1' || avatarParam === 'true';
  }, []);
}

function App() {
  const { settings, updateSettings, isConfigured } = useSettings();
  const [activePlayground, setActivePlayground] = useState<PlaygroundMode>('text-to-speech');
  const showAvatarFeature = useAvatarFeatureFlag();

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
          <VoiceLiveChatPlayground
            endpoint={settings.voiceLiveEndpoint || ''}
            apiKey={settings.voiceLiveApiKey || ''}
            showAvatarFeature={showAvatarFeature}
          />
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
      />

      {/* Main Playground Area */}
      {renderPlayground()}
    </div>
  );
}

export default App;
