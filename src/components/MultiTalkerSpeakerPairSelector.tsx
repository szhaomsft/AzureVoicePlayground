import React, { useState, useMemo } from 'react';

export interface SpeakerPair {
  female: string;
  male: string;
  display: string;
}

// Hardcoded speaker pairs for en-US using DragonHDV2.4Neural
// Female speakers: ava, ada, emma, jane
// Male speakers: andrew, brian, davis, steffan
const EN_US_SPEAKER_PAIRS: SpeakerPair[] = [
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

interface MultiTalkerSpeakerPairSelectorProps {
  selectedPair: SpeakerPair | null;
  onPairChange: (pair: SpeakerPair) => void;
}

export function MultiTalkerSpeakerPairSelector({
  selectedPair,
  onPairChange,
}: MultiTalkerSpeakerPairSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Apply search filter
  const filteredPairs = useMemo(() => {
    if (!searchTerm) return EN_US_SPEAKER_PAIRS;

    const searchLower = searchTerm.toLowerCase().trim();
    return EN_US_SPEAKER_PAIRS.filter(pair =>
      pair.display.toLowerCase().includes(searchLower) ||
      pair.female.toLowerCase().includes(searchLower) ||
      pair.male.toLowerCase().includes(searchLower)
    );
  }, [searchTerm]);

  return (
    <div className="h-full flex flex-col space-y-2">
      <label className="block text-sm font-medium text-gray-700">Speaker Pair</label>

      <input
        type="text"
        placeholder="Search speaker pairs..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />

      {/* Selected pair display */}
      {selectedPair && (
        <div className="p-2 bg-purple-50 border border-purple-200 rounded-md flex-shrink-0">
          <div className="text-xs text-purple-600 font-medium">Selected:</div>
          <div className="text-sm text-purple-800 truncate">{selectedPair.display}</div>
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
            key={`${pair.female}-${pair.male}`}
            onClick={() => onPairChange(pair)}
            className={`w-full px-4 py-3 text-left border-b border-gray-100 last:border-b-0 transition-colors ${
              selectedPair?.female === pair.female && selectedPair?.male === pair.male
                ? 'bg-purple-50 border-l-4 border-l-purple-600'
                : 'hover:bg-gray-50'
            }`}
          >
            <div className="font-medium text-gray-800 text-sm">{pair.display}</div>
            <div className="text-xs text-gray-500 mt-0.5">
              <span className="inline-block px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded mr-2">
                en-US
              </span>
              <span className="inline-block px-1.5 py-0.5 bg-pink-100 text-pink-700 rounded mr-1">
                {pair.female}
              </span>
              <span className="inline-block px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                {pair.male}
              </span>
            </div>
          </button>
        ))}
      </div>

      <div className="text-xs text-gray-500 flex-shrink-0 pt-2">
        {filteredPairs.length} speaker pair{filteredPairs.length !== 1 ? 's' : ''} available
      </div>
    </div>
  );
}

/**
 * Get voice details for a speaker pair
 */
export function getVoiceDetailsFromPair(pair: SpeakerPair | null): {
  voiceName: string;
  locale: string;
  speakers: string[];
  displayName: string;
} | null {
  if (!pair) return null;

  return {
    voiceName: 'en-us-multitalker-set1:DragonHDV2.4Neural',
    locale: 'en-US',
    speakers: [pair.female, pair.male],
    displayName: pair.display,
  };
}
