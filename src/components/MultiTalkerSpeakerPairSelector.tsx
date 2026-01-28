import React, { useState, useMemo } from 'react';
import { VoiceInfo } from '../types/azure';

export interface SpeakerPair {
  speaker1: string;
  speaker2: string;
  display: string;
  pairType: 'female-male' | 'male-female' | 'female-female' | 'male-male';
}

export interface MultiTalkerVoiceSelection {
  voice: VoiceInfo;
  pair: SpeakerPair;
}

interface MultiTalkerSpeakerPairSelectorProps {
  voices: VoiceInfo[];
  selectedVoice: VoiceInfo | null;
  selectedPair: SpeakerPair | null;
  onVoiceChange: (voice: VoiceInfo) => void;
  onPairChange: (pair: SpeakerPair) => void;
  isLoading?: boolean;
}

/**
 * Check if a voice is a multitalker voice (has FemaleSpeakers or MaleSpeakers)
 */
export function isMultiTalkerVoice(voice: VoiceInfo): boolean {
  return !!(
    voice.voiceTag?.FemaleSpeakers?.length ||
    voice.voiceTag?.MaleSpeakers?.length
  );
}

/**
 * Get all multitalker voices from a voice list
 */
export function getMultiTalkerVoices(voices: VoiceInfo[]): VoiceInfo[] {
  return voices.filter(isMultiTalkerVoice);
}

/**
 * Generate all speaker pairs for a multitalker voice
 * Creates female-male pairs (and optionally same-gender pairs)
 */
export function generateSpeakerPairs(voice: VoiceInfo): SpeakerPair[] {
  const femaleSpeakers = voice.voiceTag?.FemaleSpeakers || [];
  const maleSpeakers = voice.voiceTag?.MaleSpeakers || [];
  const pairs: SpeakerPair[] = [];

  // Generate female-male pairs
  for (const female of femaleSpeakers) {
    for (const male of maleSpeakers) {
      pairs.push({
        speaker1: female,
        speaker2: male,
        display: `${female} & ${male}`,
        pairType: 'female-male',
      });
    }
  }

  // Generate male-female pairs (reversed order)
  for (const male of maleSpeakers) {
    for (const female of femaleSpeakers) {
      pairs.push({
        speaker1: male,
        speaker2: female,
        display: `${male} & ${female}`,
        pairType: 'male-female',
      });
    }
  }

  return pairs;
}

export function MultiTalkerSpeakerPairSelector({
  voices,
  selectedVoice,
  selectedPair,
  onVoiceChange,
  onPairChange,
  isLoading = false,
}: MultiTalkerSpeakerPairSelectorProps) {
  const [voiceSearchTerm, setVoiceSearchTerm] = useState('');
  const [pairSearchTerm, setPairSearchTerm] = useState('');

  // Filter to only multitalker voices
  const multiTalkerVoices = useMemo(() => {
    return getMultiTalkerVoices(voices);
  }, [voices]);

  // Apply search filter to voices
  const filteredVoices = useMemo(() => {
    if (!voiceSearchTerm) return multiTalkerVoices;

    const searchLower = voiceSearchTerm.toLowerCase().trim();
    return multiTalkerVoices.filter(voice =>
      voice.name.toLowerCase().includes(searchLower) ||
      voice.description.toLowerCase().includes(searchLower) ||
      voice.locale.toLowerCase().includes(searchLower)
    );
  }, [multiTalkerVoices, voiceSearchTerm]);

  // Generate pairs for selected voice
  const availablePairs = useMemo(() => {
    if (!selectedVoice) return [];
    return generateSpeakerPairs(selectedVoice);
  }, [selectedVoice]);

  // Apply search filter to pairs
  const filteredPairs = useMemo(() => {
    if (!pairSearchTerm) return availablePairs;

    const searchLower = pairSearchTerm.toLowerCase().trim();
    return availablePairs.filter(pair =>
      pair.display.toLowerCase().includes(searchLower) ||
      pair.speaker1.toLowerCase().includes(searchLower) ||
      pair.speaker2.toLowerCase().includes(searchLower)
    );
  }, [availablePairs, pairSearchTerm]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-500 text-sm">Loading voices...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-3">
      {/* Voice Selection */}
      <div className="flex-shrink-0">
        <label className="block text-sm font-medium text-gray-700 mb-1">Multi-Talker Voice</label>
        <input
          type="text"
          placeholder="Search voices..."
          value={voiceSearchTerm}
          onChange={(e) => setVoiceSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
        />
      </div>

      {/* Selected voice display */}
      {selectedVoice && (
        <div className="p-2 bg-purple-50 border border-purple-200 rounded-md flex-shrink-0">
          <div className="text-xs text-purple-600 font-medium">Selected Voice:</div>
          <div className="text-sm text-purple-800 truncate" title={selectedVoice.name}>{selectedVoice.name}</div>
          <div className="text-xs text-purple-600 mt-0.5">
            {selectedVoice.voiceTag?.FemaleSpeakers?.length || 0} female, {selectedVoice.voiceTag?.MaleSpeakers?.length || 0} male speakers
          </div>
        </div>
      )}

      {/* Voice list */}
      <div className="flex-1 overflow-y-auto border border-gray-200 rounded-md min-h-0 max-h-32">
        {filteredVoices.length === 0 && (
          <div className="p-4 text-center text-gray-500 text-sm">
            {multiTalkerVoices.length === 0 ? 'No multi-talker voices available' : 'No voices match search'}
          </div>
        )}

        {filteredVoices.map((voice) => (
          <button
            key={voice.name}
            onClick={() => {
              onVoiceChange(voice);
              // Auto-select first pair when voice changes
              const pairs = generateSpeakerPairs(voice);
              if (pairs.length > 0) {
                onPairChange(pairs[0]);
              }
            }}
            title={voice.name}
            className={`w-full px-3 py-2 text-left border-b border-gray-100 last:border-b-0 transition-colors ${
              selectedVoice?.name === voice.name
                ? 'bg-purple-50 border-l-4 border-l-purple-600'
                : 'hover:bg-gray-50'
            }`}
          >
            <div className="font-medium text-gray-800 text-sm truncate">{voice.name}</div>
            <div className="text-xs text-gray-500 mt-0.5">
              <span className="text-gray-400">
                {voice.voiceTag?.FemaleSpeakers?.length || 0}F / {voice.voiceTag?.MaleSpeakers?.length || 0}M
              </span>
            </div>
          </button>
        ))}
      </div>

      <div className="text-xs text-gray-500 flex-shrink-0">
        {filteredVoices.length} voice{filteredVoices.length !== 1 ? 's' : ''} available
      </div>

      {/* Speaker Pair Selection - only show if voice is selected */}
      {selectedVoice && (
        <>
          <div className="border-t border-gray-200 pt-3 flex-shrink-0">
            <label className="block text-sm font-medium text-gray-700 mb-1">Speaker Pair</label>
            <input
              type="text"
              placeholder="Search speaker pairs..."
              value={pairSearchTerm}
              onChange={(e) => setPairSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
            />
          </div>

          {/* Selected pair display */}
          {selectedPair && (
            <div className="p-2 bg-blue-50 border border-blue-200 rounded-md flex-shrink-0">
              <div className="text-xs text-blue-600 font-medium">Selected Pair:</div>
              <div className="text-sm text-blue-800 truncate">{selectedPair.display}</div>
              <div className="text-xs text-blue-600 mt-0.5">
                {selectedPair.pairType === 'female-male' ? 'Female & Male' :
                 selectedPair.pairType === 'male-female' ? 'Male & Female' :
                 selectedPair.pairType === 'female-female' ? 'Female & Female' : 'Male & Male'}
              </div>
            </div>
          )}

          {/* Pair list */}
          <div className="flex-1 overflow-y-auto border border-gray-200 rounded-md min-h-0">
            {filteredPairs.length === 0 && (
              <div className="p-4 text-center text-gray-500 text-sm">
                No speaker pairs found
              </div>
            )}

            {filteredPairs.map((pair) => (
              <button
                key={`${pair.speaker1}-${pair.speaker2}-${pair.pairType}`}
                onClick={() => onPairChange(pair)}
                className={`w-full px-3 py-2 text-left border-b border-gray-100 last:border-b-0 transition-colors ${
                  selectedPair?.speaker1 === pair.speaker1 &&
                  selectedPair?.speaker2 === pair.speaker2 &&
                  selectedPair?.pairType === pair.pairType
                    ? 'bg-blue-50 border-l-4 border-l-blue-600'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="font-medium text-gray-800 text-sm">{pair.display}</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  <span className={`inline-block px-1.5 py-0.5 rounded mr-1 ${
                    pair.pairType.startsWith('female') ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {pair.speaker1}
                  </span>
                  <span className={`inline-block px-1.5 py-0.5 rounded ${
                    pair.pairType.endsWith('male') ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'
                  }`}>
                    {pair.speaker2}
                  </span>
                </div>
              </button>
            ))}
          </div>

          <div className="text-xs text-gray-500 flex-shrink-0">
            {filteredPairs.length} pair{filteredPairs.length !== 1 ? 's' : ''} available
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Get voice details for synthesis
 */
export function getVoiceDetailsFromPair(
  voice: VoiceInfo | null,
  pair: SpeakerPair | null
): {
  voiceName: string;
  locale: string;
  speakers: string[];
  displayName: string;
} | null {
  if (!voice || !pair) return null;

  return {
    voiceName: voice.name,
    locale: voice.locale,
    speakers: [pair.speaker1.toLowerCase(), pair.speaker2.toLowerCase()],
    displayName: pair.display,
  };
}
