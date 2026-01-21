import React, { useState, useMemo } from 'react';

interface VoicePair {
  female: string;
  male: string;
  display: string;
}

interface PodcastVoicePairSelectorProps {
  locale: string;
  selectedPair: VoicePair | null;
  onPairChange: (pair: VoicePair | null) => void;
  disabled?: boolean;
}

// Hardcoded voice pairs for en-US using DragonHDV2.4Neural
// Female speakers: ava, ada, emma, jane
// Male speakers: andrew, brian, davis, steffan
const EN_US_VOICE_PAIRS: VoicePair[] = [
  // Ava combinations
  { female: 'ava', male: 'andrew', display: 'Ava & Andrew' },
  { female: 'ava', male: 'brian', display: 'Ava & Brian' },
  { female: 'ava', male: 'davis', display: 'Ava & Davis' },
  { female: 'ava', male: 'steffan', display: 'Ava & Steffan' },

  // Ada combinations
  { female: 'ada', male: 'andrew', display: 'Ada & Andrew' },
  { female: 'ada', male: 'brian', display: 'Ada & Brian' },
  { female: 'ada', male: 'davis', display: 'Ada & Davis' },
  { female: 'ada', male: 'steffan', display: 'Ada & Steffan' },

  // Emma combinations
  { female: 'emma', male: 'andrew', display: 'Emma & Andrew' },
  { female: 'emma', male: 'brian', display: 'Emma & Brian' },
  { female: 'emma', male: 'davis', display: 'Emma & Davis' },
  { female: 'emma', male: 'steffan', display: 'Emma & Steffan' },

  // Jane combinations
  { female: 'jane', male: 'andrew', display: 'Jane & Andrew' },
  { female: 'jane', male: 'brian', display: 'Jane & Brian' },
  { female: 'jane', male: 'davis', display: 'Jane & Davis' },
  { female: 'jane', male: 'steffan', display: 'Jane & Steffan' },
];

export function PodcastVoicePairSelector({
  locale,
  selectedPair,
  onPairChange,
  disabled = false,
}: PodcastVoicePairSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Get available pairs for the selected locale
  const availablePairs = useMemo(() => {
    // Voice pairs are available for all locales
    return EN_US_VOICE_PAIRS;
  }, []);

  // Apply search filter
  const filteredPairs = useMemo(() => {
    if (!searchTerm) return availablePairs;

    const searchLower = searchTerm.toLowerCase();
    return availablePairs.filter(pair =>
      pair.display.toLowerCase().includes(searchLower) ||
      pair.female.toLowerCase().includes(searchLower) ||
      pair.male.toLowerCase().includes(searchLower)
    );
  }, [availablePairs, searchTerm]);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">Voice Pair</label>

      {/* Search Input */}
      <input
        type="text"
        placeholder="Search voice pairs..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        disabled={disabled}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
      />

      {/* Selected Pair Display */}
      {selectedPair && (
        <div className="p-2 bg-purple-50 border border-purple-200 rounded-md">
          <div className="text-xs text-purple-600 font-medium">Selected:</div>
          <div className="text-sm text-purple-800">{selectedPair.display}</div>
          <div className="text-xs text-purple-600 mt-0.5">
            Female: {selectedPair.female} | Male: {selectedPair.male}
          </div>
        </div>
      )}

      {/* Voice Pair List */}
      <div className="border border-gray-200 rounded-md max-h-64 overflow-y-auto">
        {filteredPairs.length === 0 && (
          <div className="p-4 text-center text-gray-500 text-sm">
            {searchTerm ? 'No voice pairs found matching search' : 'No voice pairs available'}
          </div>
        )}

        {filteredPairs.map((pair, index) => (
          <button
            key={`${pair.female}-${pair.male}`}
            onClick={() => onPairChange(pair)}
            disabled={disabled}
            className={`w-full px-4 py-3 text-left border-b border-gray-100 last:border-b-0 transition-colors ${
              selectedPair?.female === pair.female && selectedPair?.male === pair.male
                ? 'bg-purple-50 border-l-4 border-l-purple-600'
                : 'hover:bg-gray-50'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-800">
                    {pair.display}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Female: <span className="text-pink-600 font-medium">{pair.female}</span> |
                  Male: <span className="text-blue-600 font-medium"> {pair.male}</span>
                </div>
              </div>
              {selectedPair?.female === pair.female && selectedPair?.male === pair.male && (
                <svg className="w-5 h-5 text-purple-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
          </button>
        ))}
      </div>

      <div className="text-xs text-gray-500">
        {filteredPairs.length} voice pair{filteredPairs.length !== 1 ? 's' : ''} available
        {searchTerm && ` (filtered from ${availablePairs.length})`}
      </div>
    </div>
  );
}

// Helper function to get voice name and speaker names for API
export function getVoiceDetails(pair: VoicePair | null, locale: string): {
  voiceName: string;
  speakerNames: string;
} | null {
  if (!pair) return null;

  // Use the same voice for all locales
  // The voice supports multiple languages
  return {
    voiceName: 'en-us-multitalker-set1:DragonHDV2.4Neural',
    speakerNames: `${pair.female},${pair.male}`,
  };
}
