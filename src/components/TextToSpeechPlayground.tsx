import React, { useState, useEffect, useRef } from 'react';
import { AzureSettings, WordBoundary, SynthesisState } from '../types/azure';
import { HistoryEntry } from '../types/history';
import { useAzureTTS } from '../hooks/useAzureTTS';
import { VoiceSelector, SelectedVoiceInfo } from './VoiceSelector';
import { TextInput } from './TextInput';
import { PlaybackControls } from './PlaybackControls';
import { FeedbackButton } from './FeedbackButton';
import { HistoryPanel } from './HistoryPanel';
import { getAudioDuration } from '../utils/audioUtils';
import { PERSONAL_VOICE_MODELS, PersonalVoiceModel } from '../types/personalVoice';
import { getLanguageFromVoice } from '../utils/languagePresets';
import { useFeatureFlags } from '../hooks/useFeatureFlags';

interface TextToSpeechPlaygroundProps {
  settings: AzureSettings;
  onSettingsChange: (settings: Partial<AzureSettings>) => void;
  isConfigured: boolean;
  history: HistoryEntry[];
  addToHistory: (entry: Omit<HistoryEntry, 'id'>) => void;
  removeFromHistory: (id: string) => void;
  clearHistory: () => void;
}

export function TextToSpeechPlayground({
  settings,
  onSettingsChange,
  isConfigured,
  history,
  addToHistory,
  removeFromHistory,
  clearHistory,
}: TextToSpeechPlaygroundProps) {
  const { enableMAIVoices } = useFeatureFlags();

  // Check if the selected voice is an HD voice (DragonHD or DragonHDOmni)
  const isHDVoice = settings.selectedVoice?.includes('DragonHD') || false;

  // Default texts
  const defaultText = 'Welcome to Azure Voice Playground. Select a voice and choose a preset text to get started, or type your own text.';
  const hdVoiceExampleText = `Welcome to Azure Voice Playground. Select a voice and choose a preset text to get started, or type your own text.

[laughter] This is very funny.
[whisper] I just don't know if I can handle this anymore, I confided softly, hoping no one else could hear.
[shouting] Why can't anyone understand what I'm going through?
[angry] It's so frustrating to feel like I'm shouting into a void!
[sad] I just... I feel so alone in this, I finally admitted, my voice breaking as the sadness overwhelmed me.`;

  const [text, setText] = useState(defaultText);
  const [selectedPresetLanguage, setSelectedPresetLanguage] = useState<string>('');
  const previousAudioDataRef = useRef<ArrayBuffer | null>(null);
  const previousVoiceRef = useRef<string>('');

  const { state, error, wordBoundaries, currentWordIndex, audioData, synthesize, pause, resume, stop } =
    useAzureTTS(settings);

  // Update text when voice changes between HD and non-HD voices
  useEffect(() => {
    const currentVoice = settings.selectedVoice || '';
    const currentIsHD = currentVoice.includes('DragonHD');
    const previousIsHD = previousVoiceRef.current.includes('DragonHD');

    // Only update text if:
    // 1. Voice changed from non-HD to HD (show examples)
    // 2. Voice changed from HD to non-HD (remove examples)
    // 3. Text is still the default text (user hasn't typed custom text)
    if (currentVoice !== previousVoiceRef.current &&
        currentIsHD !== previousIsHD &&
        (text === defaultText || text === hdVoiceExampleText)) {
      setText(currentIsHD ? hdVoiceExampleText : defaultText);
    }

    previousVoiceRef.current = currentVoice;
  }, [settings.selectedVoice, text]);

  // Get current language from selected voice or preset selection
  const currentLanguage = getLanguageFromVoice(settings.selectedVoice);
  const synthesisLocale = selectedPresetLanguage || currentLanguage || 'en-US';

  // Add to history when synthesis completes successfully with NEW audio
  useEffect(() => {
    if (audioData && audioData !== previousAudioDataRef.current) {
      previousAudioDataRef.current = audioData;

      // Get model if personal voice
      const model = settings.personalVoiceInfo?.isPersonalVoice
        ? settings.personalVoiceInfo.model
        : undefined;

      getAudioDuration(audioData)
        .then((duration) => {
          addToHistory({
            timestamp: Date.now(),
            text: text,
            voice: settings.selectedVoice,
            region: settings.region,
            audioData: audioData,
            duration: duration,
            model: model,
          });
        })
        .catch((err) => {
          console.error('Failed to get audio duration:', err);
          const estimatedDuration = (audioData.byteLength * 8) / 48000;
          addToHistory({
            timestamp: Date.now(),
            text: text,
            voice: settings.selectedVoice,
            region: settings.region,
            audioData: audioData,
            duration: estimatedDuration,
            model: model,
          });
        });
    }
  }, [audioData, text, settings.selectedVoice, settings.region, settings.personalVoiceInfo, addToHistory]);

  const handlePlay = () => {
    synthesize(text, synthesisLocale);
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
      {/* Left side - Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 shadow-md">
          <h1 className="text-3xl font-bold">Text to Speech</h1>
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
              personalVoiceInfo={settings.personalVoiceInfo}
              selectedPresetLanguage={selectedPresetLanguage}
              onPresetLanguageChange={setSelectedPresetLanguage}
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

      {/* Right side - Voice Selector */}
      <div className="w-full md:w-80 flex-shrink-0 bg-gray-50 border-l border-gray-200 p-6 flex flex-col overflow-hidden">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Voice Selection</h2>
        <div className="flex-1 min-h-0">
          <VoiceSelector
            apiKey={settings.apiKey}
            region={settings.region}
            selectedVoice={settings.selectedVoice}
            enableMAIVoices={enableMAIVoices}
            onVoiceChange={(voice) => {
              console.log('TTSPlayground: Voice changed to:', voice);
              // Only update selectedVoice here, personalVoiceInfo is updated via onVoiceInfoChange
              onSettingsChange({ selectedVoice: voice });
            }}
            onVoiceInfoChange={(info: SelectedVoiceInfo) => {
              console.log('TTSPlayground: Voice info changed:', info);
              // Update both selectedVoice and personalVoiceInfo together to avoid race conditions
              const voiceName = info.isPersonalVoice ? `personal:${info.voiceName}` : info.voiceName;
              onSettingsChange({
                selectedVoice: voiceName,
                personalVoiceInfo: {
                  isPersonalVoice: info.isPersonalVoice,
                  speakerProfileId: info.speakerProfileId,
                  locale: info.locale,
                  model: info.isPersonalVoice ? (settings.personalVoiceInfo?.model || 'DragonLatestNeural') : undefined,
                },
              });
            }}
          />
        </div>

        {/* Personal Voice Model Selector - only show when personal voice is selected */}
        {settings.personalVoiceInfo?.isPersonalVoice && settings.selectedVoice?.startsWith('personal:') && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Voice Model
            </label>
            <select
              value={settings.personalVoiceInfo?.model || 'DragonLatestNeural'}
              onChange={(e) => {
                onSettingsChange({
                  personalVoiceInfo: {
                    ...settings.personalVoiceInfo!,
                    model: e.target.value as PersonalVoiceModel,
                  },
                });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {PERSONAL_VOICE_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} - {m.description}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
